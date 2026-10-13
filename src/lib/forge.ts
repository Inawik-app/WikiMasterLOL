// What essence buys, which cards stay secret, and the forge seal.
import { RARITIES, type Rarity } from "./card.ts";

// From this rarity up, a card stays a mystery silhouette until a player of the group finds it.
// The same line splits essence: below it you buy the exact card, from it you forge a random one.
const FIRST_SECRET: Rarity = "legendary";
export const isSecret = (rarity: Rarity) => RARITIES.indexOf(rarity) >= RARITIES.indexOf(FIRST_SECRET);
export const SECRET_RARITIES = RARITIES.filter(isSecret);

// Essence price of a card: the exact one below legendary, a random new one from legendary up.
export const PRICE: Record<Rarity, number> = {
  common: 30,
  uncommon: 60,
  rare: 150,
  epic: 400,
  legendary: 1500,
  mythic: 5000,
  ultimate: 20000,
  transcendent: 60000,
};

// Forge seal: one point per day played, a reward on days 14, 21 and 28 of each cycle.
// The same rule is in supabase/migrations/0003_seal_and_essence_spending.sql, which enforces it.
export const SEAL_CYCLE = 28;
export const SEAL_STEPS: [day: number, reward: Rarity][] = [
  [14, "mythic"],
  [21, "ultimate"],
  [28, "transcendent"],
];

// The next reward day after the one last collected: 14, 21, 28, 42, 49, 56...
export function nextSealMilestone(claimedDay: number) {
  const cycleStart = Math.floor(claimedDay / SEAL_CYCLE) * SEAL_CYCLE;
  return cycleStart + SEAL_STEPS.find(([day]) => cycleStart + day > claimedDay)![0];
}

export function sealReward(day: number): Rarity {
  const dayInCycle = day % SEAL_CYCLE || SEAL_CYCLE;
  return SEAL_STEPS.find(([step]) => step === dayInCycle)![1];
}
