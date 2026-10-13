import assert from "node:assert/strict";
import { test } from "node:test";
import { luck, oddsText, rareCardsPerBooster } from "./luck.ts";

test("a booster holds about 0.07 legendary or better card on average", () => {
  // 4 × 0.8 % + 4.0 %, plus a sliver for god packs.
  const perBooster = rareCardsPerBooster();
  assert.ok(perBooster > 0.07 && perBooster < 0.075, `got ${perBooster}`);
});

test("luck compares what a player got with what the odds promised", () => {
  const none = luck(0, 50); // about 3.6 expected
  assert.ok(Math.abs(none.expected - 50 * rareCardsPerBooster()) < 1e-9);
  assert.equal(none.atLeast, 1); // everyone gets at least zero
  assert.ok(none.atMost > 0.02 && none.atMost < 0.035, `got ${none.atMost}`);
  const many = luck(9, 50);
  assert.ok(many.atLeast < 0.02 && many.atMost > 0.99);
  // The two tails overlap on the exact count.
  const mid = luck(3, 50);
  assert.ok(mid.atLeast + mid.atMost > 1);
});

test("odds read as a sentence", () => {
  assert.equal(oddsText(1 / 12), "1 chance sur 12");
  assert.equal(oddsText(0.75), "75 % de chances");
  assert.equal(oddsText(1), "quasi certain");
});
