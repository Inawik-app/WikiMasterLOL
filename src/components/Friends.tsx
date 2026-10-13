"use client";

/* eslint-disable @next/next/no-img-element -- Discord avatars, hotlinked like the card art */
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  addFriend,
  collectionState,
  friendsState,
  type FriendsState,
  giveToFriend,
  type Player,
  removeFriend,
} from "@/app/actions";
import type { Rarity } from "@/lib/card";
import { createClient } from "@/lib/supabase/client";
import type { FaceCard } from "./CardFace";
import { Catalogue } from "./Catalogue";
import { RankBadge } from "./RankBadge";

const count = new Intl.NumberFormat("fr-FR");

function Who({ player, detail, cards }: { player: Player; detail?: string; cards?: number }) {
  return (
    <>
      {cards !== undefined && <RankBadge cards={cards} />}
      {player.avatar && <img src={player.avatar} alt="" width={36} height={36} loading="lazy" className="user__avatar" />}
      <p className="players__name">
        {player.username}
        {detail && <span>{detail}</span>}
      </p>
    </>
  );
}

// The list of friends, the other players to add, and the collection of the friend picked.
// `cards` and `secretTotals` are handed to the catalogue that shows that collection.
export function Friends(props: { cards: FaceCard[]; secretTotals: Record<Rarity, number>; total: number }) {
  const [supabase] = useState(createClient);
  // undefined: not known yet. null: signed out.
  const [state, setState] = useState<FriendsState | "unavailable" | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<Player | null>(null);
  // The gift being prepared: for whom, which cards, how much essence.
  const [giving, setGiving] = useState<Player | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState<Set<string>>(new Set()); // cards the friend already owns
  const [essence, setEssence] = useState("");
  const [giftNote, setGiftNote] = useState<string | null>(null);
  const [round, setRound] = useState(0); // reloads the collection after a gift

  const refresh = useCallback(async () => setState(await friendsState().catch(() => "unavailable" as const)), []);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refresh();
      else setState(null);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, refresh]);

  // Next keeps a page alive when the player goes to another one. Coming back to the friends
  // page should show the list, not a gift left half way: it is put away when the page hides.
  useLayoutEffect(() => () => setGiving(null), []);

  if (state === undefined && supabase) return null;
  if (!state) return <p className="empty">Connecte-toi avec Discord, en haut de la page, pour retrouver tes amis.</p>;

  if (state === "unavailable") return <p className="empty">La liste d&apos;amis est introuvable. Réessaie dans un instant.</p>;

  const change = async (action: (id: string) => Promise<{ ok: boolean }>, id: string) => {
    setBusy(true);
    await action(id);
    await refresh();
    setBusy(false);
  };

  const startGift = async (friend: Player) => {
    setGiving(friend);
    setPicked(new Set());
    setEssence("");
    setGiftNote(null);
    const theirs = await collectionState(friend.id).catch(() => null);
    setBlocked(new Set(theirs?.owned.map((card) => card.id)));
  };
  const amount = Math.max(0, Math.floor(Number(essence) || 0));
  const giftLabel = [
    picked.size > 0 && `${count.format(picked.size)} ${picked.size > 1 ? "cartes" : "carte"}`,
    amount > 0 && `${count.format(amount)} essence`,
  ]
    .filter(Boolean)
    .join(" et ");
  const sendGift = async (friend: Player) => {
    if (!window.confirm(`Donner ${giftLabel} à ${friend.username} ? Un don ne se reprend pas.`)) return;
    setBusy(true);
    const result = await giveToFriend(friend.id, [...picked], amount).catch(() => ({ ok: false, reason: "unavailable" }) as const);
    if (result.ok) {
      setGiftNote(`C'est donné : ${giftLabel} pour ${friend.username}.`);
      setBlocked(new Set([...blocked, ...picked]));
      setPicked(new Set());
      setEssence("");
      setRound(round + 1);
      window.dispatchEvent(new Event("collection-changed"));
    } else {
      setGiftNote(
        {
          "not-enough": "Tu n'as pas autant d'essence.",
          "already-owned": `${friend.username} possède déjà une de ces cartes. Recharge la page et recommence.`,
          "not-owned": "Une de ces cartes n'est plus dans ta collection.",
          "not-friends": "Vous n'êtes plus amis.",
        }[result.reason as string] ?? "Le don n'a pas abouti. Réessaie dans un instant.",
      );
    }
    setBusy(false);
  };

  if (giving) {
    return (
      <>
        <div className="friend-bar">
          <button type="button" className="forge__secondary" onClick={() => setGiving(null)}>
            ← Retour aux amis
          </button>
          <h2>Un cadeau pour {giving.username}</h2>
        </div>
        <div className="gift">
          <p>
            Clique sur les cartes de ta collection que tu veux lui donner, autant que tu veux. Les cartes éteintes, il
            les a déjà. Une carte donnée quitte ta collection, avec son rang et ses chromas.
          </p>
          <label className="sort">
            Essence à donner
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={essence}
              placeholder="0"
              onChange={(event) => setEssence(event.target.value)}
            />
          </label>
          <button type="button" className="forge__open" disabled={busy || !giftLabel} onClick={() => sendGift(giving)}>
            {busy ? "Envoi…" : giftLabel ? `Donner ${giftLabel}` : "Choisis quoi donner"}
          </button>
          {giftNote && <p role="status">{giftNote}</p>}
        </div>
        <Catalogue
          key={round}
          {...props}
          view="collection"
          select={{
            picked,
            blocked,
            toggle: (id) => {
              const next = new Set(picked);
              if (!next.delete(id)) next.add(id);
              setPicked(next);
            },
          }}
        />
      </>
    );
  }

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
              <Who player={friend} cards={friend.cards} detail={`${count.format(friend.cards)} ${friend.cards > 1 ? "cartes" : "carte"}`} />
              <button type="button" className="forge__secondary" onClick={() => setViewing(friend)}>
                Voir la collection
              </button>
              <button type="button" className="forge__secondary" onClick={() => startGift(friend)}>
                Faire un don
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
