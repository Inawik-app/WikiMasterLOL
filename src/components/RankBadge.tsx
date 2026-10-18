import { DIVISIONS, playerRank } from "@/lib/level";

// A player's rank as a crest. One piece is added at each rank, so the crest grows from a bare
// plate of iron to a crowned, winged, ringed emblem; pips under it count the division. Its metal
// comes from `data-rank` (see the styles), which also lights it from Émeraude up; within a rank,
// `data-division` makes the plate brighter and the crest glow more as the player climbs.
// The tooltip says everything: rank, division, cards, and what is left before the next step.
export function RankBadge({ cards, className = "" }: { cards: number; className?: string }) {
  const { rank, division, summary } = playerRank(cards);
  return (
    <svg
      viewBox="0 0 48 48"
      className={`rank ${className}`}
      data-rank={rank}
      data-division={division}
      role="img"
      aria-label={summary}
    >
      <title>{summary}</title>
      {/* Grand Maître: a ring around the whole crest. */}
      {rank >= 9 && <circle cx="24" cy="24" r="21.5" className="rank__line" />}
      {/* Or: wings. Émeraude: a second pair. */}
      {rank >= 4 && <path d="M12 18 3 14l3 11 6 3ZM36 18l9-4-3 11-6 3Z" className="rank__metal" />}
      {rank >= 6 && <path d="M12 26 5 29l8 7ZM36 26l7 3-8 7Z" className="rank__metal" />}
      {/* Platine: a spike. Diamant: a crown of three. */}
      {rank >= 5 && <path d="m24 1 3.5 8h-7Z" className="rank__metal" />}
      {rank >= 7 && <path d="m15 4 4.5 7-5 1.5ZM33 4l-4.5 7 5 1.5Z" className="rank__metal" />}
      {/* Fer: the plate. */}
      <path d="M24 8 37 15.5v15L24 38 11 30.5v-15Z" className="rank__plate" />
      {/* Bronze: an inner plate. */}
      {rank >= 2 && <path d="M24 13 32.5 18v10L24 33l-8.5-5V18Z" className="rank__line" />}
      {/* Argent: a gem. Maître: a larger, brighter one. */}
      {rank >= 3 && <path d={rank >= 8 ? "m24 16 6 7-6 8-6-8Z" : "m24 18.5 4 4.5-4 5.5-4-5.5Z"} className="rank__gem" />}
      {/* The division: one lit pip for each one reached. */}
      {division &&
        Array.from({ length: DIVISIONS }, (_, i) => (
          <rect key={i} x={13 + i * 6} y="43" width="4" height="4" className={i < division ? "rank__pip rank__pip--on" : "rank__pip"} />
        ))}
    </svg>
  );
}
