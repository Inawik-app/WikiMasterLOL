"use client";

import { useCallback, useEffect, useState } from "react";
import { boosterHistory, type OpenedBooster } from "@/app/actions";
import { RARITY_LABEL } from "@/lib/card";
import { isSecret } from "@/lib/forge";
import { Gem } from "./Gem";

const PAGE = 10;
const when = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// The boosters the player opened lately, newest first: one line per booster, its five cards,
// the ones from legendary up set apart. Needs <GemDefs /> on the page.
export function BoosterHistory() {
  const [boosters, setBoosters] = useState<OpenedBooster[] | null>(null);
  const [shown, setShown] = useState(PAGE);

  const read = useCallback(async () => setBoosters(await boosterHistory().catch(() => null)), []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after the request, not during the effect
    read();
    // A booster just opened: read again.
    window.addEventListener("collection-changed", read);
    return () => window.removeEventListener("collection-changed", read);
  }, [read]);

  if (!boosters) return null;
  const rare = boosters.reduce((n, b) => n + b.cards.filter((c) => isSecret(c.rarity)).length, 0);

  return (
    <section className="shop history" aria-labelledby="history-title">
      <div className="seal__head">
        <h2 id="history-title">Tes derniers boosters</h2>
        <p>
          {boosters.length
            ? `${boosters.length} ${boosters.length > 1 ? "boosters ouverts" : "booster ouvert"} ces deux derniers mois, dont ${rare} ${rare > 1 ? "cartes légendaires ou plus rares" : "carte légendaire ou plus rare"}.`
            : "Aucun booster ouvert ces deux derniers mois."}
        </p>
      </div>
      <ol className="history__list">
        {boosters.slice(0, shown).map((booster) => (
          <li key={booster.at} data-lit={booster.cards.some((c) => isSecret(c.rarity))}>
            <time dateTime={booster.at}>{when.format(new Date(booster.at))}</time>
            <ul>
              {booster.cards.map((card, i) => (
                <li key={i} data-rarity={card.rarity} title={RARITY_LABEL[card.rarity]}>
                  <Gem rarity={card.rarity} />
                  <span>{card.name}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {shown < boosters.length && (
        <button type="button" className="forge__secondary" onClick={() => setShown(shown + PAGE)}>
          Voir les précédents
        </button>
      )}
    </section>
  );
}
