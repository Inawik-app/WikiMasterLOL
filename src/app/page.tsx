import { BoosterForge } from "@/components/BoosterForge";
import { OddsHelp } from "@/components/OddsHelp";
import { SiteHeader } from "@/components/SiteHeader";

export default function Boosters() {
  return (
    <main className="forge">
      <SiteHeader current="boosters" />
      <header className="masthead">
        <h1>La forge</h1>
        <p className="masthead__lede">
          Un booster se recharge toutes les heures, huit en réserve au plus. Cinq cartes, la dernière au moins rare.{" "}
          <OddsHelp />
        </p>
      </header>
      <BoosterForge />
    </main>
  );
}
