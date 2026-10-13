import { BOOSTER_SIZE, GOD_PACK_CHANCE, LAST_CARD_ODDS, ODDS } from "@/lib/booster";
import { RARITIES, RARITY_LABEL } from "@/lib/card";

const percent = (value: number) =>
  value ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(value)} %` : "—";

// A question mark that opens the odds of a booster. The numbers are the ones the draw uses.
// A native popover: it opens on click or tap, and closes on Escape or a click outside.
export function OddsHelp() {
  return (
    <>
      <button type="button" className="help" popoverTarget="odds" aria-label="Voir les probabilités d'un booster">
        ?
      </button>
      <div id="odds" popover="auto" className="odds">
        <h2>Probabilités d&apos;un booster</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Rareté</th>
              <th scope="col">Cartes 1 à {BOOSTER_SIZE - 1}</th>
              <th scope="col">Dernière carte</th>
            </tr>
          </thead>
          <tbody>
            {RARITIES.map((rarity) => (
              <tr key={rarity} data-rarity={rarity}>
                <th scope="row">{RARITY_LABEL[rarity]}</th>
                <td>{percent(ODDS[rarity])}</td>
                <td>{percent(LAST_CARD_ODDS[rarity])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Dans une rareté, toutes les cartes ont la même chance. Un booster sur{" "}
          {new Intl.NumberFormat("fr-FR").format(Math.round(1 / GOD_PACK_CHANCE))} est un god pack : une carte de
          chaque rareté, d&apos;épique à transcendant.
        </p>
        <button type="button" className="forge__secondary" popoverTarget="odds" popoverTargetAction="hide">
          Fermer
        </button>
      </div>
    </>
  );
}
