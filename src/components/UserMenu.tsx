"use client";

/* eslint-disable @next/next/no-img-element -- Discord avatar, hotlinked like the card art */
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// What Discord tells Supabase about the player.
const displayName = (user: User) =>
  user.user_metadata.custom_claims?.global_name ?? user.user_metadata.full_name ?? user.user_metadata.name ?? "Invocateur";

export function UserMenu() {
  const [supabase] = useState(createClient);
  // undefined while the session is being read, null when signed out.
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    // Fires once with the current session, then on every sign-in and sign-out.
    // Coming back from Discord, the client finishes the sign-in on its own before firing.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

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
      {user.user_metadata.avatar_url && <img src={user.user_metadata.avatar_url} alt="" width={36} height={36} className="user__avatar" />}
      <span className="user__name">{displayName(user)}</span>
      <button type="button" className="user__signout" onClick={() => supabase.auth.signOut()}>
        Se déconnecter
      </button>
    </div>
  );
}
