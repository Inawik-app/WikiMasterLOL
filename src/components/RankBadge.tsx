import { playerRank } from "@/lib/level";

// A player's rank as a crest. One piece is added at each rank, so the crest grows from a bare
// plate of iron to a crowned, winged, ringed emblem. Its metal comes from `data-rank` (see the
// styles), which also lights it from Émeraude up.
export function RankBadge({ cards, className = "" }: { cards: number; className?: string }) {
  const { rank, name } = playerRank(cards);
  return (
    <svg viewBox="0 0 48 48" className={`rank ${className}`} data-rank={rank} role="img" aria-label={`Rang ${name}`}>
      <title>{`Rang ${name}`}</title>
      {/* Grand Maître: a ring around the whole crest. */}
      {rank >= 9 && <circle cx="24" cy="25" r="21.5" className="rank__line" />}
      {/* Or: wings. Émeraude: a second pair. */}
      {rank >= 4 && <path d="M12 19 3 15l3 11 6 3ZM36 19l9-4-3 11-6 3Z" className="rank__metal" />}
      {rank >= 6 && <path d="M12 27 5 30l8 7ZM36 27l7 3-8 7Z" className="rank__metal" />}
      {/* Platine: a spike. Diamant: a crown of three. */}
      {rank >= 5 && <path d="m24 2 3.5 8h-7Z" className="rank__metal" />}
      {rank >= 7 && <path d="m15 5 4.5 7-5 1.5ZM33 5l-4.5 7 5 1.5Z" className="rank__metal" />}
      {/* Fer: the plate. */}
      <path d="M24 9 37 16.5v15L24 39 11 31.5v-15Z" className="rank__plate" />
      {/* Bronze: an inner plate. */}
      {rank >= 2 && <path d="M24 14 32.5 19v10L24 34l-8.5-5V19Z" className="rank__line" />}
      {/* Argent: a gem. Maître: a larger, brighter one. */}
      {rank >= 3 && <path d={rank >= 8 ? "m24 17 6 7-6 8-6-8Z" : "m24 19.5 4 4.5-4 5.5-4-5.5Z"} className="rank__gem" />}
    </svg>
  );
}
