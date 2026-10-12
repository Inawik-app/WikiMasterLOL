import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Catalogue } from "@/components/Catalogue";
import { type Card, RARITIES } from "@/lib/card";

export default function Home() {
  // Read at build time rather than imported: type-checking a 2.7 MB JSON literal is slow.
  const all = JSON.parse(readFileSync(join(process.cwd(), "src/data/cards.json"), "utf8")) as Card[];
  // ponytail: the whole catalogue (minus chromas) ships to the browser, about 2.5 MB before
  // compression. Fine for a catalogue everyone may see; the collection page must filter on
  // the server so that cards a player does not own never reach their browser.
  const cards = all
    .map(({ id, type, name, rarity, image, splash, subtitle, flavor, url, facts, frames, focus }) => ({
      id,
      type,
      name,
      rarity,
      image,
      splash,
      subtitle,
      flavor,
      url,
      facts,
      frames,
      focus,
    }))
    .sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity));

  return (
    <main className="forge">
      <header className="masthead">
        <p className="masthead__mark">WikiMaster LoL</p>
        <h1>Le catalogue</h1>
        <p className="masthead__lede">
          {new Intl.NumberFormat("fr-FR").format(cards.length)} cartes à forger, du rivet de fer à la gemme
          transcendante.
        </p>
      </header>
      <Catalogue cards={cards} />
    </main>
  );
}
