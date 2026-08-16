import assert from "node:assert/strict";
import test from "node:test";

import {
  badgeMarkdown,
  badgeUrl,
  parseArgs
} from "../bin/agentic-badge.js";

test("badgeUrl creates a stable Shields URL", () => {
  const url = badgeUrl({
    total: 16,
    max: 20,
    rating: "limited beta"
  });

  assert.match(url, /^https:\/\/img\.shields\.io\/badge\//);
  assert.match(url, /16%2F20%20limited%20beta/);
  assert.match(url, /-287a50\?style=flat-square$/);
});

test("badgeMarkdown wraps the badge URL", () => {
  const markdown = badgeMarkdown({
    total: 19,
    max: 20,
    rating: "production candidate"
  });

  assert.match(markdown, /^!\[Agent production readiness\]\(/);
  assert.match(markdown, /production%20candidate/);
});

test("parseArgs supports output format and custom label", () => {
  const args = parseArgs([
    "node",
    "agentic-badge.js",
    "card.json",
    "--format",
    "json",
    "--label",
    "release gate"
  ]);

  assert.equal(args.file, "card.json");
  assert.equal(args.format, "json");
  assert.equal(args.label, "release gate");
});

test("parseArgs rejects unsupported formats", () => {
  assert.throws(
    () =>
      parseArgs([
        "node",
        "agentic-badge.js",
        "card.json",
        "--format",
        "svg"
      ]),
    /markdown, url, or json/
  );
});
