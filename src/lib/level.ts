import { RANKS } from "./upgrades.ts";

// A player's rank, from the number of cards they own. Same ten names as the ranked skins.
// The steps widen as the collection grows: the first ranks come in days, the last in months.
// 8,700 cards exist; Challenger is about two thirds of them.
export const RANK_STEPS = [0, 25, 75, 200, 400, 800, 1500, 2500, 4000, 6000];

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
