import assert from "node:assert/strict";
import test from "node:test";

import { buildSnapshot, formatText, parseArgs, parseRepo } from "../bin/star-watch.js";

test("parseRepo accepts owner/name", () => {
  assert.equal(parseRepo("owner/repo"), "owner/repo");
});

test("parseRepo accepts GitHub URLs", () => {
  assert.equal(parseRepo("https://github.com/owner/repo"), "owner/repo");
  assert.equal(parseRepo("https://github.com/owner/repo.git"), "owner/repo");
});

test("parseArgs reads state, target, and format", () => {
  const options = parseArgs([
    "node",
    "star-watch.js",
    "owner/repo",
    "--state",
    ".star-watch.json",
    "--target",
    "500",
    "--text"
  ]);

  assert.equal(options.repo, "owner/repo");
  assert.equal(options.statePath, ".star-watch.json");
  assert.equal(options.target, 500);
  assert.equal(options.format, "text");
});

test("buildSnapshot calculates star delta and target remaining", () => {
  const snapshot = buildSnapshot(
    "owner/repo",
    {
      stargazers_count: 120,
      forks_count: 8,
      open_issues_count: 3,
      pushed_at: "2026-08-17T00:00:00Z"
    },
    { stars: 100 },
    1000
  );

  assert.equal(snapshot.stars, 120);
  assert.equal(snapshot.previous_stars, 100);
  assert.equal(snapshot.delta_stars, 20);
  assert.equal(snapshot.remaining_to_target, 880);
  assert.equal(snapshot.reached_target, false);
});

test("formatText includes key monitoring fields", () => {
  const text = formatText({
    repo: "owner/repo",
    stars: 120,
    delta_stars: 20,
    forks: 8,
    open_issues: 3,
    target_stars: 1000,
    remaining_to_target: 880,
    checked_at: "2026-08-17T00:00:00Z"
  });

  assert.match(text, /Stars: 120 \(\+20 since last check\)/);
  assert.match(text, /Remaining: 880/);
});
