import type { CSSProperties } from "react";
import type { Chroma, Rarity } from "@/lib/card";
import { CHROMA_PRICE, essences } from "@/lib/forge";

export type ChromaState = { options: Chroma[]; unlocked?: number[]; chroma?: number; picks?: number };

// The chromas of a skin, as swatches. An unlocked one is worn with a click (a second click takes
// it off); a locked one is unlocked with a pick earned from a duplicate, or bought with essence
// when `essence` is given and there is no pick left.
export function ChromaPicker({
  rarity,
  state,
  essence,
  onWear,
  onBuy,
}: {
  rarity: Rarity;
  state: ChromaState;
  essence?: number;
  onWear: (chromaId: number) => void;
  onBuy?: (chromaId: number, name: string) => void;
}) {
  const price = CHROMA_PRICE[rarity];
  const canBuy = onBuy !== undefined && essence !== undefined;
  const owned = state.unlocked?.length ?? 0;
  return (
    <div className="chromas" data-pending={Boolean(state.picks)}>
      <p>
        {state.picks ? (
          <strong>
            {state.picks > 1 ? `${state.picks} chromas à choisir` : "Un chroma à choisir"} : clique sur une pastille
            verrouillée pour le débloquer et le porter.
          </strong>
        ) : (
          <>
            Chromas : {owned} sur {state.options.length} débloqués. Chaque doublon de cette carte en débloque un
            {canBuy ? `, ou achète-en un pour ${essences(price)} (tu en as ${essences(essence)})` : ""}.
          </>
        )}
      </p>
      <ul>
        {state.options.map((option) => {
          const unlocked = state.unlocked?.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                className="chromas__swatch"
                style={{ "--chroma-a": option.colors[0], "--chroma-b": option.colors[1] ?? option.colors[0] } as CSSProperties}
                aria-pressed={state.chroma === option.id}
                aria-label={`${option.name}${unlocked ? "" : state.picks ? ", à débloquer" : canBuy ? `, à acheter pour ${essences(price)}` : ", verrouillé"}`}
                title={option.name}
                data-locked={!unlocked}
                disabled={!unlocked && !state.picks && !(canBuy && essence >= price)}
                onClick={() => (unlocked || state.picks ? onWear(option.id) : onBuy?.(option.id, option.name))}
              />
            </li>
          );
        })}
      </ul>
      {state.chroma !== undefined && (
        <p className="chromas__worn">
          Porté : {state.options.find((option) => option.id === state.chroma)?.name}. Clique dessus à nouveau pour revenir à
          l&apos;original.
        </p>
      )}
    </div>
  );
}
