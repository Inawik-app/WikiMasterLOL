// The rules of a booster. Nothing outside this file decides which cards come out.
import { RARITIES, type Rarity } from "./card.ts";

export const BOOSTER_SIZE = 5;

// One booster per hour, eight in stock at most. The same two numbers are in
// supabase/migrations/0002_boosters_and_essence.sql, which enforces them: change both together.
export const REFILL_MS = 60 * 60 * 1000;
export const MAX_STOCK = 8;

// Chance, in percent, for each of the first four cards.
export const ODDS: Record<Rarity, number> = {
  common: 55,
  uncommon: 30,
  rare: 11,
  epic: 3.2,
  legendary: 0.65,
  mythic: 0.12,
  ultimate: 0.025,
  transcendent: 0.005,
};

// The last card is at least rare.
export const LAST_CARD_ODDS: Record<Rarity, number> = {
  common: 0,
  uncommon: 0,
  rare: 78,
  epic: 18,
  legendary: 3.3,
  mythic: 0.55,
  ultimate: 0.12,
  transcendent: 0.03,
};

// One booster in five thousand is a god pack: one card of each rarity from epic up.
// Kept that rare on purpose: more often, it would become the main source of transcendent cards.
export const GOD_PACK_CHANCE = 1 / 5000;
export const GOD_PACK: Rarity[] = ["epic", "legendary", "mythic", "ultimate", "transcendent"];

// Essence given by a card the player already owns.
export const ESSENCE: Record<Rarity, number> = {
  common: 5,
  uncommon: 10,
  rare: 25,
  epic: 60,
  legendary: 150,
  mythic: 400,
  ultimate: 1200,
  transcendent: 4000,
};

export type Pool = Record<Rarity, string[]>; // card ids by rarity
export type Drawn = { id: string; rarity: Rarity };

function pickRarity(odds: Record<Rarity, number>, random: () => number): Rarity {
  let roll = random() * 100;
  for (const rarity of RARITIES) {
    roll -= odds[rarity];
    if (roll < 0) return rarity;
  }
  return "common"; // only reached through rounding at the very end of the scale
}

export function drawBooster(pool: Pool, random: () => number = Math.random): Drawn[] {
  const rarities =
    random() < GOD_PACK_CHANCE
      ? GOD_PACK
      : Array.from({ length: BOOSTER_SIZE }, (_, slot) =>
          pickRarity(slot === BOOSTER_SIZE - 1 ? LAST_CARD_ODDS : ODDS, random),
        );
  const drawn: Drawn[] = [];
  for (const rarity of rarities) {
    // Never the same card twice in one booster.
    const choices = pool[rarity].filter((id) => !drawn.some((d) => d.id === id));
    drawn.push({ id: choices[Math.floor(random() * choices.length)], rarity });
  }
  // Least rare first: the best card of the booster is the last one turned over.
  return drawn.sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity));
}

// How many boosters a player can open now, and when the next one arrives (null when full).
export function boosterStock(anchor: Date, now: Date = new Date()) {
  const elapsed = now.getTime() - anchor.getTime();
  const available = Math.max(0, Math.min(MAX_STOCK, Math.floor(elapsed / REFILL_MS)));
  const nextAt = available >= MAX_STOCK ? null : new Date(anchor.getTime() + (available + 1) * REFILL_MS);
  return { available, nextAt };
}
