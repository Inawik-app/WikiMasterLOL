import assert from "node:assert/strict";
import { test } from "node:test";
import { BOOSTER_SIZE, boosterStock, drawBooster, LAST_CARD_ODDS, MAX_STOCK, ODDS, type Pool } from "./booster.ts";
import { RARITIES } from "./card.ts";

// Twenty cards of each rarity.
const pool = Object.fromEntries(
  RARITIES.map((r) => [r, Array.from({ length: 20 }, (_, i) => `${r}-${i}`)]),
) as Pool;

// Repeatable pseudo-random numbers, so a failure can be reproduced.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

test("odds add up to 100 %", () => {
  for (const odds of [ODDS, LAST_CARD_ODDS]) {
    const total = Object.values(odds).reduce((sum, n) => sum + n, 0);
    assert.ok(Math.abs(total - 100) < 1e-9, `total is ${total}`);
  }
});

test("a booster holds five different cards and ends on a rare or better", () => {
  const random = seeded(42);
  const seen = new Map<string, number>();
  for (let n = 0; n < 5000; n++) {
    const cards = drawBooster(pool, random);
    assert.equal(cards.length, BOOSTER_SIZE);
    assert.equal(new Set(cards.map((c) => c.id)).size, BOOSTER_SIZE);
    assert.ok(cards.every((c) => pool[c.rarity].includes(c.id)));
    assert.ok(RARITIES.indexOf(cards[BOOSTER_SIZE - 1].rarity) >= RARITIES.indexOf("rare"));
    // Sorted from the least rare to the rarest, to keep the best for the end.
    const ranks = cards.map((c) => RARITIES.indexOf(c.rarity));
    assert.deepEqual(ranks, [...ranks].sort((x, y) => x - y));
    for (const c of cards.slice(0, -1)) seen.set(c.rarity, (seen.get(c.rarity) ?? 0) + 1);
  }
  // Over 20,000 cards the common share should sit close to its 55 %.
  const share = (seen.get("common") ?? 0) / 20000;
  assert.ok(share > 0.52 && share < 0.58, `common share is ${share}`);
});

test("a god pack holds one card of each rarity from epic up", () => {
  const rolls = [0]; // the first roll decides the god pack
  const cards = drawBooster(pool, () => rolls.shift() ?? 0.5);
  assert.deepEqual(
    cards.map((c) => c.rarity),
    ["epic", "legendary", "mythic", "ultimate", "transcendent"],
  );
});

test("boosters refill one per hour up to eight", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);
  assert.equal(boosterStock(ago(30), now).available, 0);
  assert.equal(boosterStock(ago(30), now).nextAt?.toISOString(), "2026-10-12T12:30:00.000Z");
  assert.equal(boosterStock(ago(150), now).available, 2);
  assert.equal(boosterStock(ago(60 * 20), now).available, MAX_STOCK);
  assert.equal(boosterStock(ago(60 * 20), now).nextAt, null);
});
