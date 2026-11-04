#!/usr/bin/env node
/**
 * Controlled local mock of the DummyJSON origin, for CACHE EVIDENCE.
 *
 * Every request that actually reaches this server is logged with a timestamp
 * and a running counter. If Next's server cache is hit, nothing is logged here,
 * which is the proof the brief asks for (logs at the origin, not before fetch).
 *
 *   npm run mock-origin                 # listens on :4000
 *   API_BASE_URL=http://localhost:4000 npm run build && npm start
 *
 * Control endpoints (not cached by Next, call with curl):
 *   GET /__fail?on=1    every request returns 500 (simulate outage)
 *   GET /__fail?on=0    back to normal
 *   GET /__delay?ms=3000  add latency to each response (simulate slow origin)
 *   GET /__stats        request counts so far
 *   GET /__bump         change product 1's price, so a refresh visibly changes the UI
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const PORT = Number(process.env.MOCK_PORT ?? 4000);
const data = JSON.parse(
  readFileSync(new URL("../fixtures/products.json", import.meta.url), "utf8"),
);

let failing = false;
let delayMs = 0;
let counter = 0;
const counts = {};

const log = (msg) => console.log(`[origin ${new Date().toISOString()}] ${msg}`);
const send = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // --- control endpoints ---
  if (url.pathname === "/__fail") {
    failing = url.searchParams.get("on") === "1";
    log(`failure mode ${failing ? "ON" : "OFF"}`);
    return send(res, 200, { failing });
  }
  if (url.pathname === "/__delay") {
    delayMs = Number(url.searchParams.get("ms") ?? 0);
    log(`delay set to ${delayMs}ms`);
    return send(res, 200, { delayMs });
  }
  if (url.pathname === "/__stats") return send(res, 200, { total: counter, counts });
  if (url.pathname === "/__bump") {
    data.products[0].price = Math.round((data.products[0].price + 1) * 100) / 100;
    log(`bumped product 1 price -> ${data.products[0].price}`);
    return send(res, 200, { price: data.products[0].price });
  }

  // --- origin endpoints ---
  counter++;
  const key = url.pathname + url.search;
  counts[key] = (counts[key] ?? 0) + 1;
  log(`#${counter} ${req.method} ${key} (hit ${counts[key]} for this URL)${failing ? " -> 500" : ""}`);

  if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  if (failing) return send(res, 500, { message: "Simulated origin failure" });

  if (url.pathname === "/products") {
    return send(res, 200, { products: data.products, total: data.total, skip: 0, limit: 0 });
  }
  const m = url.pathname.match(/^\/products\/(\d+)$/);
  if (m) {
    const p = data.products.find((x) => x.id === Number(m[1]));
    return p ? send(res, 200, p) : send(res, 404, { message: `Product with id '${m[1]}' not found` });
  }
  send(res, 404, { message: "Not found" });
}).listen(PORT, () => log(`mock origin listening on http://localhost:${PORT}`));
