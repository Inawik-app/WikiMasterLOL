import type { Rarity } from "@/lib/card";

type Point = [number, number];

// Points of a regular polygon or star centred in a 24x24 box.
function ring(points: number, outer: number, inner = outer, rotation = -90): Point[] {
  const total = inner === outer ? points : points * 2;
  return Array.from({ length: total }, (_, i) => {
    const radius = i % 2 ? inner : outer;
    const angle = ((rotation + (360 / total) * i) * Math.PI) / 180;
    return [12 + radius * Math.cos(angle), 12 + radius * Math.sin(angle)];
  });
}

// One cut per rarity, so the tier reads from the shape alone, not only the colour.
const CUTS: Record<Rarity, Point[]> = {
  common: ring(12, 7.5), // rivet
  uncommon: ring(4, 10.5, 10.5, -45), // square
  rare: ring(4, 11), // lozenge
  epic: ring(6, 11), // hexagon
  legendary: [[4.5, 3.5], [19.5, 3.5], [19.5, 13], [12, 22.5], [4.5, 13]], // shield
  mythic: [[12, 0.5], [18, 8], [18, 16], [12, 23.5], [6, 16], [6, 8]], // marquise
  ultimate: ring(8, 11.5, 7.2),
  transcendent: ring(12, 12, 7),
};

const TABLE = 0.5; // the flat top of the stone, as a fraction of its outline
const LIGHT = (-135 * Math.PI) / 180; // lit from the top left

const fmt = (points: Point[]) => points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
const toTable = ([x, y]: Point): Point => [12 + (x - 12) * TABLE, 12 + (y - 12) * TABLE];

// One facet per edge, between the outline and the table, shaded by how squarely it faces the light.
function facets(cut: Point[]) {
  return cut.map((a, i) => {
    const b = cut[(i + 1) % cut.length];
    const facing = Math.cos(Math.atan2((a[1] + b[1]) / 2 - 12, (a[0] + b[0]) / 2 - 12) - LIGHT);
    const shade = Math.round(Math.abs(facing) * 55);
    return {
      points: fmt([a, b, toTable(b), toTable(a)]),
      fill: `color-mix(in oklab, var(--gem) ${100 - shade}%, ${facing > 0 ? "white" : "#05080a"})`,
    };
  });
}

const GEMS = Object.fromEntries(
  Object.entries(CUTS).map(([rarity, cut]) => [
    rarity,
    { outline: fmt(cut), table: fmt(cut.map(toTable)), facets: facets(cut) },
  ]),
) as Record<Rarity, { outline: string; table: string; facets: ReturnType<typeof facets> }>;

export function Gem({ rarity, className }: { rarity: Rarity; className?: string }) {
  const gem = GEMS[rarity];
  return (
    <svg viewBox="0 0 24 24" className={className} data-rarity={rarity} aria-hidden="true">
      {gem.facets.map((facet) => (
        <polygon key={facet.points} points={facet.points} style={{ fill: facet.fill }} />
      ))}
      <polygon points={gem.table} className="gem__table" />
      <polygon points={gem.outline} className="gem__outline" />
    </svg>
  );
}

// Gradient for the transcendent gem, referenced from CSS. Render once per page.
export function GemDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <linearGradient id="gem-prism" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8ff3ff" />
        <stop offset=".35" stopColor="#ffffff" />
        <stop offset=".65" stopColor="#f6b6ff" />
        <stop offset="1" stopColor="#ffe59a" />
      </linearGradient>
    </svg>
  );
}
