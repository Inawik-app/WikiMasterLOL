import type { Metadata } from "next";
import { Catalogue } from "@/components/Catalogue";
import { SiteHeader } from "@/components/SiteHeader";
import { allCards, catalogueProps } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Catalogue" };

export default function CataloguePage() {
  return (
    <main className="forge">
      <SiteHeader current="catalogue" />
      <header className="masthead">
        <h1>Le catalogue</h1>
        <p className="masthead__lede">
          {new Intl.NumberFormat("fr-FR").format(allCards().length)} cartes à forger, du rivet de fer à la gemme
          transcendante. Les plus rares restent secrètes tant que personne ne les a trouvées.
        </p>
      </header>
      <Catalogue {...catalogueProps()} />
    </main>
  );
}
