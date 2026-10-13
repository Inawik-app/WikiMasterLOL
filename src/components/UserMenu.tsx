"use client";

/* eslint-disable @next/next/no-img-element -- Discord avatar, hotlinked like the card art */
import type { User } from "@supabase/supabase-js";
import { type CSSProperties, useEffect, useState } from "react";
import { playerRank } from "@/lib/level";
import { createClient } from "@/lib/supabase/client";
import { RankBadge } from "./RankBadge";

// What Discord tells Supabase about the player.
const displayName = (user: User) =>
  user.user_metadata.custom_claims?.global_name ?? user.user_metadata.full_name ?? user.user_metadata.name ?? "Invocateur";

export function UserMenu() {
  const [supabase] = useState(createClient);
  // undefined while the session is being read, null when signed out.
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [cards, setCards] = useState<number | null>(null); // how many cards the player owns

  useEffect(() => {
    if (!supabase) return;
    // Fires once with the current session, then on every sign-in and sign-out.
    // Coming back from Discord, the client finishes the sign-in on its own before firing.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  // The rank follows the collection: counted at sign-in, and again whenever a page says it changed.
  const userId = user?.id;
  useEffect(() => {
    if (!supabase || !userId) return;
    const read = async () => {
      // Row level security only shows the player's own rows.
      const { count } = await supabase.from("collection").select("*", { count: "exact", head: true });
      setCards(count);
    };
    read();
    window.addEventListener("collection-changed", read);
    return () => window.removeEventListener("collection-changed", read);
  }, [supabase, userId]);

  if (!supabase || user === undefined) return null;

  if (!user) {
    const signIn = async () => {
      setError(false);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: window.location.origin },
      });
      if (error) setError(true);
    };
    return (
      <div className="user">
        {error && <p role="alert">Connexion impossible. Réessaie dans un instant.</p>}
        <button type="button" className="user__signin" onClick={signIn}>
          Se connecter avec Discord
        </button>
      </div>
    );
  }

  return (
    <div className="user">
      {cards !== null && <Rank cards={cards} />}
      {user.user_metadata.avatar_url && <img src={user.user_metadata.avatar_url} alt="" width={36} height={36} className="user__avatar" />}
      <span className="user__name">{displayName(user)}</span>
      <button type="button" className="user__signout" onClick={() => supabase.auth.signOut()}>
        Se déconnecter
      </button>
    </div>
  );
}

const count = new Intl.NumberFormat("fr-FR");

// The crest of the player's rank over a thin bar: how far along to the next one.
function Rank({ cards }: { cards: number }) {
  const { name, next, progress } = playerRank(cards);
  const label = next
    ? `Rang ${name} · ${count.format(cards)} cartes, ${name === "Challenger" ? "" : `${count.format(next - cards)} avant le rang suivant`}`
    : `Rang ${name} · ${count.format(cards)} cartes`;
  return (
    <span className="user__rank" title={label}>
      <RankBadge cards={cards} />
      <span className="user__xp" style={{ "--progress": progress } as CSSProperties} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
