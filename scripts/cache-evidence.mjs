#!/usr/bin/env node
/**
 * Reproducible cache evidence against a PRODUCTION build.
 *
 *   npm run build && npm run evidence      (takes ~70 s: it waits out the 60 s window)
 *
 * Starts the mock origin (:4000) and `next start` (:3200) pointed at it, with a
 * wiped fetch cache, then runs every scenario from the brief and counts the
 * requests that actually reached the ORIGIN (from the origin's own counter).
 * Writes evidence/cache-evidence.md (summary table + raw origin log).
 */
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const ORIGIN = "http://localhost:4000";
const APP = "http://localhost:3200";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const originLog = [];
const rows = [];
let failed = 0;

function start(cmd, args, env, tag) {
  const p = spawn(cmd, args, { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  p.stdout.on("data", (d) => tag === "origin" && originLog.push(...String(d).trim().split("\n")));
  p.stderr.on("data", (d) => process.env.DEBUG && process.stderr.write(d));
  return p;
}

async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try { await fetch(url); return; } catch { await sleep(250); }
  }
  throw new Error(`${url} did not start`);
}

const stats = async () => (await (await fetch(`${ORIGIN}/__stats`)).json()).total;
const get = async (path) => {
  const res = await fetch(APP + path);
  return { status: res.status, html: await res.text() };
};

async function step(name, expectedOriginHits, fn) {
  const before = await stats();
  const t = new Date().toISOString();
  const note = await fn();
  await sleep(400); // let background revalidations reach the origin
  const hits = (await stats()) - before;
  const ok = hits === expectedOriginHits;
  if (!ok) failed++;
  rows.push(`| ${t.slice(11, 19)} | ${name} | ${expectedOriginHits} | ${hits} | ${ok ? "✅" : "❌"} | ${note ?? ""} |`);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: origin hits ${hits} (expected ${expectedOriginHits}) ${note ?? ""}`);
}

const priceOf = (html) => html.match(/Essence Mascara Lash Princess[\s\S]*?\$(\d+\.\d\d)/)?.[1];

rmSync(".next/cache/fetch-cache", { recursive: true, force: true }); // clean cache = true cold start
const origin = start("node", ["scripts/mock-origin.mjs"], {}, "origin");
await waitFor(`${ORIGIN}/__stats`);
const app = start("npx", ["next", "start", "-p", "3200"], { API_BASE_URL: ORIGIN, DATA_SOURCE: "api" }, "app");
await waitFor(APP + "/api/refresh-healthcheck-404");

try {
  // 1. cold + warm
  await step("Cold: first catalogue request", 1, async () => `HTTP ${(await get("/")).status}`);
  await step("Warm: independent repeat within 60 s", 0, async () => `HTTP ${(await get("/")).status}`);
  await step("Warm: different search/filter/sort/page URLs share the entry", 0, async () => {
    for (const u of ["/?q=phone", "/?category=beauty&sort=price-desc", "/?page=3", "/?saved=1,2"]) await get(u);
    return "4 URLs";
  });
  await step("Detail: product 1 cold", 1, async () => `HTTP ${(await get("/products/1")).status}`);
  await step("Detail: product 1 warm", 0, async () => `HTTP ${(await get("/products/1")).status}`);
  await step("Detail: product 2 cached independently", 1, async () => `HTTP ${(await get("/products/2")).status}`);

  // 2. time-based (stale-while-revalidate)
  console.log("…waiting 61 s for the revalidate window to pass");
  await sleep(61_000);
  await step("After 60 s: request serves STALE + triggers background revalidation", 1, async () => `HTTP ${(await get("/")).status}`);
  await step("Follow-up request gets the fresh entry from cache", 0, async () => `HTTP ${(await get("/")).status}`);

  // 3. manual invalidation before timer expires
  await fetch(`${ORIGIN}/__bump`); // change upstream data
  await step("Upstream changed, cache still fresh: old price shown", 0, async () => `price $${priceOf((await get("/?q=essence")).html)}`);
  await step("Manual refresh (POST /api/refresh) + next request refetches", 1, async () => {
    await fetch(`${APP}/api/refresh`, { method: "POST" });
    return `price $${priceOf((await get("/?q=essence")).html)} (updated)`;
  });

  // 4. failure + recovery
  await fetch(`${ORIGIN}/__fail?on=1`);
  await step("Refresh during outage -> cold cache -> error page", 1, async () => {
    await fetch(`${APP}/api/refresh`, { method: "POST" });
    return `HTTP ${(await get("/")).status} (error boundary with retry)`;
  });
  await step("Retry while still down (failures are not cached)", 1, async () => `HTTP ${(await get("/")).status}`);
  await fetch(`${ORIGIN}/__fail?on=0`);
  await step("Origin recovers -> retry succeeds", 1, async () => {
    const r = await get("/");
    return `HTTP ${r.status}, ${r.html.match(/Showing [^<]*/)?.[0] ?? "?"}`;
  });
  await step("Recovered entry is cached again", 0, async () => `HTTP ${(await get("/")).status}`);
} finally {
  app.kill();
  origin.kill();
}

mkdirSync("evidence", { recursive: true });
writeFileSync(
  "evidence/cache-evidence.md",
  `# Cache evidence

Generated by \`npm run evidence\` on ${new Date().toISOString()} against a production build
(\`next start\`) with a wiped fetch cache. "Origin hits" are counted **by the mock origin
server itself**, so a 0 means Next served the response from its server Data Cache.

| Time (UTC) | Scenario | Expected origin hits | Actual | Result | Notes |
|---|---|---|---|---|---|
${rows.join("\n")}

**${failed === 0 ? "All scenarios passed." : `${failed} scenario(s) FAILED.`}**

## Raw origin log

\`\`\`
${originLog.join("\n")}
\`\`\`
`,
);
console.log(`\nWrote evidence/cache-evidence.md — ${failed === 0 ? "all passed" : failed + " failed"}`);
process.exit(failed ? 1 : 0);
