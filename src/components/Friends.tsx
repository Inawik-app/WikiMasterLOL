"use client";

/* eslint-disable @next/next/no-img-element -- Discord avatars, hotlinked like the card art */
import { useCallback, useEffect, useState } from "react";
import { addFriend, friendsState, type FriendsState, type Player, removeFriend } from "@/app/actions";
import type { Rarity } from "@/lib/card";
import { createClient } from "@/lib/supabase/client";
import type { FaceCard } from "./CardFace";
import { Catalogue } from "./Catalogue";

const count = new Intl.NumberFormat("fr-FR");

function Who({ player, detail }: { player: Player; detail?: string }) {
  return (
    <>
      {player.avatar && <img src={player.avatar} alt="" className="user__avatar" />}
      <p className="players__name">
        {player.username}
        {detail && <span>{detail}</span>}
      </p>
    </>
  );
}

// The list of friends, the other players to add, and the collection of the friend picked.
// `cards` and `secretTotals` are handed to the catalogue that shows that collection.
export function Friends(props: { cards: FaceCard[]; secretTotals: Record<Rarity, number> }) {
  const [supabase] = useState(createClient);
  // undefined: not known yet. null: signed out.
  const [state, setState] = useState<FriendsState | "unavailable" | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<Player | null>(null);

  const refresh = useCallback(async () => setState(await friendsState().catch(() => "unavailable" as const)), []);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refresh();
      else setState(null);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, refresh]);

  if (state === undefined && supabase) return null;
  if (!state) return <p className="empty">Connecte-toi avec Discord, en haut de la page, pour retrouver tes amis.</p>;

  if (state === "unavailable") return <p className="empty">La liste d&apos;amis est introuvable. Réessaie dans un instant.</p>;

  const change = async (action: (id: string) => Promise<{ ok: boolean }>, id: string) => {
    setBusy(true);
    await action(id);
    await refresh();
    setBusy(false);
  };

  if (viewing) {
    return (
      <>
        <div className="friend-bar">
          <button type="button" className="forge__secondary" onClick={() => setViewing(null)}>
            ← Retour aux amis
          </button>
          <h2>Collection de {viewing.username}</h2>
        </div>
        <Catalogue {...props} view="collection" friend={viewing} />
      </>
    );
  }

  return (
    <>
      <section className="shop" aria-labelledby="friends-title">
        <div className="seal__head">
          <h2 id="friends-title">Amis</h2>
          {!state.friends.length && <p>Tu n&apos;as pas encore d&apos;ami. Ajoute un joueur de la liste ci-dessous.</p>}
        </div>
        <ul className="players">
          {state.friends.map((friend) => (
            <li key={friend.id}>
              <Who player={friend} detail={`${count.format(friend.cards)} ${friend.cards > 1 ? "cartes" : "carte"}`} />
              <button type="button" className="forge__secondary" onClick={() => setViewing(friend)}>
                Voir la collection
              </button>
              <button type="button" className="players__remove" disabled={busy} onClick={() => change(removeFriend, friend.id)}>
                Retirer
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="shop" aria-labelledby="players-title">
        <div className="seal__head">
          <h2 id="players-title">Autres joueurs</h2>
          <p>
            {state.others.length
              ? "L'ajout est immédiat et vaut dans les deux sens : vous voyez chacun la collection de l'autre."
              : state.friends.length
                ? "Tous les joueurs sont déjà tes amis."
                : "Personne d'autre n'a encore rejoint le jeu. Envoie le lien à tes amis."}
          </p>
        </div>
        <ul className="players">
          {state.others.map((player) => (
            <li key={player.id}>
              <Who player={player} />
              <button type="button" className="forge__secondary" disabled={busy} onClick={() => change(addFriend, player.id)}>
                Ajouter
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
