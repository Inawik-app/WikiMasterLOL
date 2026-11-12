"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dismissGifts, pendingGifts, type ReceivedGift } from "@/app/actions";
import { RARITIES } from "@/lib/card";
import { essences } from "@/lib/forge";
import { createClient } from "@/lib/supabase/client";
import { CardFace, cardClass, cardLabel } from "./CardFace";
import { GemDefs } from "./Gem";

const count = new Intl.NumberFormat("fr-FR");

// On every page: the gifts friends have made since the player's last visit, laid out like a
// booster on the bench. One button closes it, and the gifts are then marked as seen.
export function GiftNotice() {
  const [supabase] = useState(createClient);
  const [gifts, setGifts] = useState<ReceivedGift[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);

  const read = useCallback(async () => setGifts(await pendingGifts().catch(() => [])), []);
  useEffect(() => {
    if (!supabase) return;
    // Server actions run one after the other: the check waits a moment, so that the page's own
    // data comes first.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timer);
      if (session) timer = setTimeout(read, 2000);
      else setGifts([]);
    });
    return () => {
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [supabase, read]);

  useEffect(() => {
    if (gifts.length && !dialog.current?.open) dialog.current?.showModal();
  }, [gifts]);

  if (!gifts.length) return null;

  // Everything shown is acknowledged; a gift made in the meantime will show next time.
  // Escape closes the dialog too, and lands here through onClose.
  const close = () => {
    dismissGifts(gifts[gifts.length - 1].at).catch(() => {});
    setGifts([]);
    window.dispatchEvent(new Event("collection-changed"));
  };

  return (
    <dialog ref={dialog} className="gift-box" aria-labelledby="gift-box-title" onClose={close}>
      <GemDefs />
      <h2 id="gift-box-title">{gifts.length > 1 ? "Tu as reçu des cadeaux" : "Tu as reçu un cadeau"}</h2>
      {gifts.map((gift) => (
        <section key={gift.at} className="gift-box__gift">
          <p>
            <strong>{gift.from}</strong> t&apos;offre{" "}
            {[
              gift.cards.length > 0 && `${count.format(gift.cards.length)} ${gift.cards.length > 1 ? "cartes" : "carte"}`,
              gift.essence > 0 && essences(gift.essence),
            ]
              .filter(Boolean)
              .join(" et ")}
            .
          </p>
          {gift.cards.length > 0 && (
            <ul className="gift-box__cards">
              {[...gift.cards]
                .sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity))
                .map((card) => (
                  <li key={card.id}>
                    <div className={`${cardClass(card)} card--revealed`} data-rarity={card.rarity} role="img" aria-label={cardLabel(card)}>
                      <CardFace card={card} />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ))}
      <form method="dialog">
        <button className="forge__open">Fermer</button>
      </form>
    </dialog>
  );
}
