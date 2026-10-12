import type { Metadata } from "next";
import { Catalogue } from "@/components/Catalogue";
import { SiteHeader } from "@/components/SiteHeader";
import { catalogueProps } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Collection" };

export default function Collection() {
  return (
    <main className="forge">
      <header className="masthead">
        <SiteHeader current="collection" />
        <h1>Ta collection</h1>
        <p className="masthead__lede">Les cartes que tu as sorties de la forge, les plus rares en premier.</p>
      </header>
      <Catalogue {...catalogueProps()} view="collection" />
    </main>
  );
}
