import type { Metadata } from "next";
import { Friends } from "@/components/Friends";
import { SiteHeader } from "@/components/SiteHeader";
import { catalogueProps } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Amis · WikiMaster LoL" };

export default function Amis() {
  return (
    <main className="forge">
      <header className="masthead">
        <SiteHeader current="amis" />
        <h1>Tes amis</h1>
        <p className="masthead__lede">Ajoute les autres forgerons et va voir ce qu&apos;ils ont sorti de leurs boosters.</p>
      </header>
      <Friends {...catalogueProps()} />
    </main>
  );
}
