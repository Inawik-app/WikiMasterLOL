"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

// Erases the player's account and everything attached to it. Asks once before doing so.
export function DeleteAccount() {
  const [supabase] = useState(createClient);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const erase = async () => {
    if (!window.confirm("Supprimer ton compte, ta collection et ta liste d'amis ? C'est définitif.")) return;
    setBusy(true);
    const result = await deleteAccount().catch(() => ({ ok: false, reason: "unavailable" }) as const);
    if (result.ok) {
      await supabase?.auth.signOut();
      setMessage("Ton compte et tes données sont supprimés.");
    } else {
      setMessage(
        result.reason === "signed-out"
          ? "Connecte-toi d'abord, en haut de la page, avec le compte à supprimer."
          : "La suppression n'a pas abouti. Réessaie dans un instant.",
      );
    }
    setBusy(false);
  };

  return (
    <>
      <button type="button" className="forge__secondary" disabled={busy} onClick={erase}>
        {busy ? "Suppression…" : "Supprimer mon compte et mes données"}
      </button>
      {message && <p role="status">{message}</p>}
    </>
  );
}
