import assert from "node:assert/strict";
import { test } from "node:test";
import { playerRank, RANK_STEPS } from "./level.ts";
import { RANKS } from "./upgrades.ts";

test("a player's rank follows the number of cards owned", () => {
  assert.equal(RANK_STEPS.length, RANKS.length);
  assert.deepEqual(playerRank(0), { rank: 1, name: "Fer", next: 870, progress: 0 });
  assert.equal(playerRank(869).name, "Fer");
  assert.equal(playerRank(870).name, "Bronze");
  assert.deepEqual(playerRank(3045), { rank: 4, name: "Or", next: 3480, progress: 0.5 });
  assert.deepEqual(playerRank(9000), { rank: 10, name: "Challenger", next: undefined, progress: 1 });
});
