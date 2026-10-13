import assert from "node:assert/strict";
import { test } from "node:test";
import { isSecret, nextSealMilestone, PRICE, sealReward } from "./forge.ts";
import { ESSENCE } from "./booster.ts";
import { RARITIES } from "./card.ts";

test("cards are secret from legendary up", () => {
  assert.deepEqual(RARITIES.filter(isSecret), ["legendary", "mythic", "ultimate", "transcendent"]);
});

test("the seal rewards days 14, 21 and 28 of every cycle", () => {
  assert.deepEqual(
    [0, 13, 14, 21, 28, 41, 42, 55].map(nextSealMilestone),
    [14, 14, 21, 28, 42, 42, 49, 56],
  );
  assert.deepEqual([14, 21, 28, 42, 49, 56].map(sealReward), [
    "mythic",
    "ultimate",
    "transcendent",
    "mythic",
    "ultimate",
    "transcendent",
  ]);
});

test("a card costs more essence than its duplicate gives back", () => {
  for (const rarity of RARITIES) assert.ok(PRICE[rarity] > ESSENCE[rarity], rarity);
});
