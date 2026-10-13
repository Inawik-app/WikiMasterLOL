import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FaceCard } from "@/components/CardFace";
import { type Card, RARITIES, type Rarity } from "./card";
import { isSecret } from "./forge";
import type { Pool } from "./booster";

// Server only. Read from disk rather than imported: type-checking a 5 MB JSON literal is slow.
// Next traces this path by itself: the build lists cards.json among the files of every page
// (.next/server/app/**/page.js.nft.json), so it is deployed with the server code.
let cards: Card[] | undefined;
export function allCards(): Card[] {
  cards ??= JSON.parse(readFileSync(join(process.cwd(), "src/data/cards.json"), "utf8")) as Card[];
  return cards;
}

// What the interface needs to draw a card: everything but the chromas.
export function toFaceCard({ id, type, name, rarity, image, splash, subtitle, flavor, url, facts, frames, focus, icon }: Card): FaceCard {
  return { id, type, name, rarity, image, splash, subtitle, flavor, url, facts, frames, focus, icon };
}

let pool: Pool | undefined;
export function cardPool(): Pool {
  if (!pool) {
    pool = Object.fromEntries(RARITIES.map((r) => [r, [] as string[]])) as Pool;
    for (const card of allCards()) pool[card.rarity].push(card.id);
  }
  return pool;
}

// What the catalogue and collection pages hand to the browser. Cards from legendary up are
// secret: only their number per rarity goes into the page. The ones the group has found arrive
// later, from the server, for signed-in players.
// ponytail: every card below legendary ships to the browser, about 4 MB before compression.
// Acceptable for now; load the detail of a card when it is opened if the page gets slow.
export function catalogueProps() {
  const secretTotals = Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>;
  const cards: FaceCard[] = [];
  for (const card of allCards()) {
    if (isSecret(card.rarity)) secretTotals[card.rarity]++;
    else cards.push(toFaceCard(card));
  }
  return { cards, secretTotals };
}
