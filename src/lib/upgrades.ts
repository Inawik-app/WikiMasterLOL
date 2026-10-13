import type { Card } from "./card";

// What a duplicate does instead of turning into essence.
//
// "Héros de guerre" skins (the ranked rewards) climb one rank per duplicate, from Fer to
// Challenger. The rank is the number of copies owned: 1 is Fer, 10 is Challenger.
// Other skins with chromas earn one chroma to pick per duplicate, until all are unlocked.
// Past those caps, and for every other card, a duplicate is essence as before.

export const RANKS = ["Fer", "Bronze", "Argent", "Or", "Platine", "Émeraude", "Diamant", "Maître", "Grand Maître", "Challenger"];

// From this rank on, the frame comes with visual effects.
export const FIRST_SHINING_RANK = 6; // Émeraude

type Upgradable = Pick<Card, "type" | "name" | "chromas">;

export const isRanked = (card: Upgradable) => card.type === "skin" && /héros de guerre/i.test(card.name);

export type DuplicateMode = "essence" | "rank" | "chroma";

// `cap` is the highest rank, or the number of chromas: the database stops upgrading there.
export function duplicateRule(card: Upgradable): { mode: DuplicateMode; cap: number } {
  if (isRanked(card)) return { mode: "rank", cap: RANKS.length };
  if (card.chromas?.length) return { mode: "chroma", cap: card.chromas.length };
  return { mode: "essence", cap: 0 };
}
