import assert from "node:assert/strict";
import { test } from "node:test";
import { playerRank, RANK_STEPS } from "./level.ts";
import { RANKS } from "./upgrades.ts";

test("a player's rank and division follow the number of cards owned", () => {
  assert.equal(RANK_STEPS.length, RANKS.length);
  const start = playerRank(0);
  assert.deepEqual([start.label, start.next, start.progress], ["Fer 1", 182, 0]);
  assert.equal(playerRank(181).label, "Fer 1");
  assert.equal(playerRank(182).label, "Fer 2");
  assert.equal(playerRank(727).label, "Fer 4");
  assert.equal(playerRank(728).label, "Bronze 1");
  const gold = playerRank(2275); // Or starts at 2,184: half way through its first division
  assert.deepEqual([gold.rank, gold.label, gold.next, gold.progress], [4, "Or 1", 2366, 0.5]);
});

test("Challenger has no division and nothing above it", () => {
  assert.equal(playerRank(6551).label, "Grand Maître 4");
  assert.match(playerRank(6551).summary, /encore 1 avant Challenger$/);
  const top = playerRank(9000);
  assert.deepEqual([top.rank, top.label, top.division, top.next, top.progress], [10, "Challenger", undefined, undefined, 1]);
});
