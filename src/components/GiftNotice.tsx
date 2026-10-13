"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { dismissGifts, pendingGifts, type ReceivedGift } from "@/app/actions";
import { essences } from "@/lib/forge";
import { createClient } from "@/lib/supabase/client";

const SHOWN = 6; // card names listed before "and N more"
const count = new Intl.NumberFormat("fr-FR");

// On every page: tells the player what friends have given them since their last visit.
// It stays until closed, then the gifts are marked as seen.
export function GiftNotice() {
  const [supabase] = useState(createClient);
  const [gifts, setGifts] = useState<ReceivedGift[]>([]);

  const read = useCallback(async () => setGifts(await pendingGifts().catch(() => [])), []);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) read();
      else setGifts([]);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, read]);

  if (!gifts.length) return null;

  const close = () => {
    // Everything shown is acknowledged; a gift made in the meantime will show next time.
    dismissGifts(gifts[gifts.length - 1].at).catch(() => {});
    setGifts([]);
    window.dispatchEvent(new Event("collection-changed"));
  };

  return (
    <aside className="gifts" role="status" aria-label="Cadeaux reçus">
      <h2>{gifts.length > 1 ? "Tu as reçu des cadeaux" : "Tu as reçu un cadeau"}</h2>
      <ul>
        {gifts.map((gift) => (
          <li key={gift.at}>
            <strong>{gift.from}</strong> t&apos;offre{" "}
            {[
              gift.cards.length > 0 && `${count.format(gift.cards.length)} ${gift.cards.length > 1 ? "cartes" : "carte"}`,
              gift.essence > 0 && essences(gift.essence),
            ]
              .filter(Boolean)
              .join(" et ")}
            {gift.cards.length > 0 && (
              <span>
                {gift.cards.slice(0, SHOWN).join(", ")}
                {gift.cards.length > SHOWN && ` et ${count.format(gift.cards.length - SHOWN)} de plus`}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="gifts__actions">
        <Link href="/collection" className="forge__secondary" onClick={close}>
          Voir ma collection
        </Link>
        <button type="button" className="players__remove" onClick={close}>
          Fermer
        </button>
      </div>
    </aside>
  );
}
