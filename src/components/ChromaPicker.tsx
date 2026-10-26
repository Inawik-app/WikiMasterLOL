import { type CSSProperties, useState } from "react";
import type { Chroma, Rarity } from "@/lib/card";
import { CHROMA_PRICE, essences } from "@/lib/forge";

export type ChromaState = { options: Chroma[]; unlocked?: number[]; chroma?: number; picks?: number };

// The chromas of a skin, as swatches. A click only previews one (`onPreview` gives its colours
// to the card shown above, null for the original look); a button under the swatches then says
// what confirming does and does it: wear it, unlock it with a pick earned from a duplicate, or
// buy it with essence when `essence` is given and there is no pick left.
// Used inside client components only (it holds the preview).
export function ChromaPicker({
  rarity,
  state,
  essence,
  onWear,
  onBuy,
  onPreview,
}: {
  rarity: Rarity;
  state: ChromaState;
  essence?: number;
  // Wears this chroma; passing the one already worn takes it off.
  onWear: (chromaId: number) => void;
  onBuy?: (chromaId: number) => void;
  onPreview: (colors: string[] | null | undefined) => void;
}) {
  // undefined: nothing previewed. null: the original look. A number: that chroma.
  const [preview, setPreview] = useState<number | null | undefined>(undefined);
  const price = CHROMA_PRICE[rarity];
  const canBuy = onBuy !== undefined && essence !== undefined;
  const owned = state.unlocked?.length ?? 0;

  const show = (id: number | null) => {
    setPreview(id);
    onPreview(id === null ? null : state.options.find((option) => option.id === id)?.colors);
  };
  const reset = () => {
    setPreview(undefined);
    onPreview(undefined);
  };
  const confirm = (act: () => void) => {
    act();
    reset();
  };

  const previewed = state.options.find((option) => option.id === preview);
  const unlocked = preview !== null && preview !== undefined && state.unlocked?.includes(preview);
  const changes = preview !== undefined && preview !== (state.chroma ?? null);

  return (
    <div className="chromas" data-pending={Boolean(state.picks)}>
      <p>
        {state.picks ? (
          <strong>
            {state.picks > 1 ? `${state.picks} chromas à choisir` : "Un chroma à choisir"} : clique sur une pastille pour
            le voir sur la carte, puis confirme.
          </strong>
        ) : (
          <>
            Chromas : {owned} sur {state.options.length} débloqués. Clique sur une pastille pour la voir sur la carte.
            Chaque doublon en débloque un{canBuy ? `, ou achète-le pour ${essences(price)} (tu en as ${essences(essence)})` : ""}.
          </>
        )}
      </p>
      <ul>
        <li>
          <button
            type="button"
            className="chromas__swatch chromas__swatch--original"
            aria-pressed={(preview === undefined ? state.chroma : preview) === undefined || preview === null}
            aria-label="Apparence d'origine"
            title="Apparence d'origine"
            onClick={() => show(null)}
          />
        </li>
        {state.options.map((option) => {
          const isUnlocked = state.unlocked?.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                className="chromas__swatch"
                style={{ "--chroma-a": option.colors[0], "--chroma-b": option.colors[1] ?? option.colors[0] } as CSSProperties}
                aria-pressed={(preview === undefined ? state.chroma : preview) === option.id}
                aria-label={`${option.name}${isUnlocked ? "" : ", verrouillé"}`}
                title={option.name}
                data-locked={!isUnlocked}
                data-worn={state.chroma === option.id}
                onClick={() => show(option.id)}
              />
            </li>
          );
        })}
      </ul>

      {/* What the preview is, and what confirming it does. */}
      {preview !== undefined && (
        <div className="chromas__confirm">
          <p>
            Aperçu : <strong>{previewed?.name ?? "apparence d'origine"}</strong>
            {!changes && " (déjà porté)"}
          </p>
          <div>
            {changes && preview === null && (
              <button type="button" className="anvil__buy" onClick={() => confirm(() => onWear(state.chroma!))}>
                Revenir à l&apos;original
              </button>
            )}
            {changes && unlocked && (
              <button type="button" className="anvil__buy" onClick={() => confirm(() => onWear(preview as number))}>
                Porter ce chroma
              </button>
            )}
            {changes && preview !== null && !unlocked && state.picks ? (
              <button type="button" className="anvil__buy" onClick={() => confirm(() => onWear(preview as number))}>
                Débloquer avec mon choix
              </button>
            ) : null}
            {changes && preview !== null && !unlocked && !state.picks && canBuy && (
              <button
                type="button"
                className="anvil__buy"
                disabled={(essence ?? 0) < price}
                onClick={() => confirm(() => onBuy?.(preview as number))}
              >
                {(essence ?? 0) < price ? `Il te faut ${essences(price)}` : `Acheter · ${essences(price)}`}
              </button>
            )}
            {changes && preview !== null && !unlocked && !state.picks && !canBuy && <span>Verrouillé.</span>}
            <button type="button" className="players__remove" onClick={reset}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
