#!/usr/bin/env node
/**
 * Single source of truth for versioning. The version lives in package.json and
 * is mirrored in: package-lock.json, CHANGELOG.md (top release heading) and
 * README.md (the "Version:" line). The UI footer reads package.json directly.
 *
 *   node scripts/version.mjs check            verify every place agrees (CI + pre-push)
 *   node scripts/version.mjs bump <patch|minor|major>
 *                                              bump everywhere; moves CHANGELOG
 *                                              "Unreleased" notes under the new version
 *   node scripts/version.mjs current          print the version
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const read = (f) => readFileSync(f, "utf8");
const pkgVersion = () => JSON.parse(read("package.json")).version;

function locations() {
  const lock = JSON.parse(read("package-lock.json"));
  return {
    "package.json": pkgVersion(),
    "package-lock.json": lock.version,
    "package-lock.json (root package)": lock.packages?.[""]?.version,
    "CHANGELOG.md": read("CHANGELOG.md").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1],
    "README.md": read("README.md").match(/^\*\*Version:\*\* `?v?(\d+\.\d+\.\d+)`?/m)?.[1],
  };
}

function check() {
  const locs = locations();
  const expected = locs["package.json"];
  const bad = Object.entries(locs).filter(([, v]) => v !== expected);
  if (bad.length) {
    console.error(`✖ Version mismatch (package.json is ${expected}):`);
    for (const [f, v] of bad) console.error(`    ${f}: ${v ?? "(not found)"}`);
    console.error("  Run: npm run release -- <patch|minor|major>");
    process.exit(1);
  }
  console.log(`✔ v${expected} consistent across ${Object.keys(locs).join(", ")}`);
}

function bump(kind) {
  if (!["patch", "minor", "major"].includes(kind)) {
    console.error("Usage: npm run release -- <patch|minor|major>");
    process.exit(1);
  }
  const changelog = read("CHANGELOG.md");
  const unreleased = changelog.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|$)/);
  if (!unreleased || !unreleased[1].trim()) {
    console.error("✖ CHANGELOG.md has no notes under ## [Unreleased]. Describe the change first.");
    process.exit(1);
  }

  execSync(`npm version ${kind} --no-git-tag-version`, { stdio: "ignore" }); // package.json + lock
  const v = pkgVersion();
  const date = new Date().toISOString().slice(0, 10);

  writeFileSync(
    "CHANGELOG.md",
    changelog.replace(
      /## \[Unreleased\]\n[\s\S]*?(?=\n## \[|$)/,
      `## [Unreleased]\n\n## [${v}] - ${date}\n${unreleased[1].trimEnd()}\n`,
    ),
  );
  writeFileSync(
    "README.md",
    read("README.md").replace(/^\*\*Version:\*\* .*$/m, `**Version:** \`v${v}\``),
  );
  console.log(`✔ Bumped to v${v}. Commit with: <type>(v${v}): <description>`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "check") check();
else if (cmd === "bump") bump(arg);
else if (cmd === "current") console.log(pkgVersion());
else {
  console.error("Usage: version.mjs <check|bump <kind>|current>");
  process.exit(1);
}

