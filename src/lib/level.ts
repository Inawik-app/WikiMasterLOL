import { RANKS } from "./upgrades.ts";

// A player's rank, from the number of cards they own. Same ten names as the ranked skins.
// Every rank is the same distance from the next. Challenger starts at three quarters of the
// 8,732 cards that exist (6,552), reached in nine equal steps of 728 cards.
const STEP = 728;
export const RANK_STEPS = RANKS.map((_, i) => i * STEP);

// Each rank below Challenger is cut in four divisions, 1 to 4, so that something is always
// within reach: a division is 182 cards.
export const DIVISIONS = 4;
const DIVISION_STEP = STEP / DIVISIONS;

const count = new Intl.NumberFormat("fr-FR");

export function playerRank(cards: number) {
  // 1 is Fer, 10 is Challenger: the same numbers as `data-rank` in the styles.
  const rank = Math.min(RANKS.length, Math.floor(Math.max(0, cards) / STEP) + 1);
  const top = rank === RANKS.length;
  const division = top ? undefined : Math.floor((cards - RANK_STEPS[rank - 1]) / DIVISION_STEP) + 1;
  const from = RANK_STEPS[rank - 1] + ((division ?? 1) - 1) * DIVISION_STEP;
  const next = top ? undefined : from + DIVISION_STEP; // undefined at Challenger
  const label = division ? `${RANKS[rank - 1]} ${division}` : RANKS[rank - 1];
  // What comes after this division: the next one, or the first of the next rank.
  const nextLabel =
    division === undefined
      ? undefined
      : division < DIVISIONS
        ? `${RANKS[rank - 1]} ${division + 1}`
        : rank + 1 === RANKS.length
          ? RANKS[rank]
          : `${RANKS[rank]} 1`;
  return {
    rank,
    name: RANKS[rank - 1],
    division,
    label, // "Or 3", "Challenger"
    next,
    // How far along the current division, from 0 to 1.
    progress: next === undefined ? 1 : (cards - from) / DIVISION_STEP,
    // Everything there is to say, for a tooltip.
    summary:
      next === undefined
        ? `Rang ${label} · ${count.format(cards)} cartes`
        : `Rang ${label} · ${count.format(cards)} cartes · encore ${count.format(next - cards)} avant ${nextLabel}`,
  };
}
