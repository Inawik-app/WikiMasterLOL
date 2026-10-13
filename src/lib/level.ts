import { RANKS } from "./upgrades.ts";

// A player's rank, from the number of cards they own. Same ten names as the ranked skins.
// Every rank is the same distance from the next: 870 cards, a tenth of the 8,700 that exist.
// Challenger starts at nine tenths of the catalogue.
const STEP = 870;
export const RANK_STEPS = RANKS.map((_, i) => i * STEP);

export function playerRank(cards: number) {
  // 1 is Fer, 10 is Challenger: the same numbers as `data-rank` in the styles.
  const rank = RANK_STEPS.findLastIndex((step) => cards >= step) + 1 || 1;
  const from = RANK_STEPS[rank - 1];
  const next = RANK_STEPS[rank] as number | undefined; // undefined at Challenger
  return {
    rank,
    name: RANKS[rank - 1],
    next,
    // How far along the current rank, from 0 to 1.
    progress: next === undefined ? 1 : (cards - from) / (next - from),
  };
}
