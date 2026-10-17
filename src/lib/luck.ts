import { BOOSTER_SIZE, GOD_PACK, GOD_PACK_CHANCE, LAST_CARD_ODDS, ODDS } from "./booster.ts";
import type { Rarity } from "./card.ts";
import { SECRET_RARITIES } from "./forge.ts";

// How lucky a player was with their boosters, measured against the odds of the game.
// "Rare" here means legendary or better.

// Average number of rare cards in one booster: four ordinary cards, one guaranteed-rare-or-better
// card, and the occasional god pack (four rare cards in a row).
export function rareCardsPerBooster() {
  const share = (odds: typeof ODDS) => SECRET_RARITIES.reduce((sum, rarity) => sum + odds[rarity], 0) / 100;
  const normal = (BOOSTER_SIZE - 1) * share(ODDS) + share(LAST_CARD_ODDS);
  return (1 - GOD_PACK_CHANCE) * normal + GOD_PACK_CHANCE * SECRET_RARITIES.length;
}

// Chance of exactly `k` rare cards when `expected` are due on average (Poisson law: a good
// fit for many draws that each rarely succeed).
function poisson(k: number, expected: number) {
  let p = Math.exp(-expected);
  for (let i = 1; i <= k; i++) p *= expected / i;
  return p;
}

// Chance of doing at least this well, and of doing this badly or worse.
export function luck(rare: number, boosters: number) {
  const expected = boosters * rareCardsPerBooster();
  let atMost = 0;
  for (let k = 0; k <= rare; k++) atMost += poisson(k, expected);
  return { expected, atLeast: Math.min(1, 1 - atMost + poisson(rare, expected)), atMost: Math.min(1, atMost) };
}

// "1 chance sur 12", "3 chances sur 4" for the likely ones.
export function oddsText(p: number) {
  if (p >= 0.995) return "quasi certain";
  if (p > 0.4) return `${Math.round(p * 100)} % de chances`;
  return `1 chance sur ${new Intl.NumberFormat("fr-FR").format(Math.max(2, Math.round(1 / p)))}`;
}

// Chance that one booster holds at least one card of this rarity, or this very card when the
// rarity has `cards` of them. Four ordinary cards, the last one from its own table, and the god
// pack, which holds one card of each rarity from epic up.
export function chancePerBooster(rarity: Rarity, cards = 1) {
  const miss = (odds: number) => 1 - odds / 100 / cards;
  const normal = 1 - miss(ODDS[rarity]) ** (BOOSTER_SIZE - 1) * miss(LAST_CARD_ODDS[rarity]);
  const inGodPack = GOD_PACK.includes(rarity) ? 1 / cards : 0;
  return (1 - GOD_PACK_CHANCE) * normal + GOD_PACK_CHANCE * inGodPack;
}
