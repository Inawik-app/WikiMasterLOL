import type { SupabaseClient } from "@supabase/supabase-js";
import { RARITIES, RARITY_LABEL } from "./card";
import { cardById } from "./catalogue";
import { isSecret } from "./forge";
import { playerRank } from "./level";
import { readAll } from "./supabase/server";

// Server only. What happened in the group over the last seven days, as text for Discord.

const RANK_EMOJI = ["⚙️", "🥉", "🥈", "🥇", "💠", "🟢", "💎", "🔮", "🔥", "👑"];
const count = new Intl.NumberFormat("fr-FR");

export type Recap = { title: string; sections: { name: string; value: string }[] };

export async function weeklyRecap(admin: SupabaseClient, now = new Date()): Promise<Recap> {
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: profiles }, rows, discoveries] = await Promise.all([
    admin.from("profiles").select("id, username"),
    // ponytail: reads every collection row of every player. Fine for a group of friends, once
    // a week; count in SQL if the game grows.
    readAll<{ user_id: string; card_id: string; first_obtained_at: string }>((from, to) =>
      admin.from("collection").select("user_id, card_id, first_obtained_at").order("user_id").order("card_id").range(from, to),
    ),
    readAll<{ card_id: string; username: string; first_obtained_at: string }>((from, to) =>
      admin
        .from("discoveries")
        .select("card_id, username, first_obtained_at")
        .gte("first_obtained_at", since)
        .order("card_id")
        .range(from, to),
    ),
  ]);
  const cards = cardById();

  const players = (profiles ?? []).map((profile) => {
    const mine = rows.filter((row) => row.user_id === profile.id);
    // Cards from legendary up obtained this week.
    const rare = mine.filter((row) => row.first_obtained_at >= since && isSecret(cards.get(row.card_id)?.rarity ?? "common"));
    return { name: profile.username as string, total: mine.length, gained: mine.filter((row) => row.first_obtained_at >= since).length, rare: rare.length };
  });

  const best = [...players].sort((a, b) => b.rare - a.rare)[0];
  const table = [...players]
    .sort((a, b) => b.total - a.total)
    .map((p) => {
      const { rank, name } = playerRank(p.total);
      return `${RANK_EMOJI[rank - 1]} **${p.name}** · ${name} · ${count.format(p.total)} cartes${p.gained ? ` (+${count.format(p.gained)})` : ""}`;
    });
  const found = discoveries
    .flatMap((d) => {
      const card = cards.get(d.card_id);
      return card && isSecret(card.rarity) ? [{ card, by: d.username }] : [];
    })
    .sort((a, b) => RARITIES.indexOf(b.card.rarity) - RARITIES.indexOf(a.card.rarity));

  // Discord cuts a field at 1,024 characters.
  const fit = (lines: string[], empty: string) => {
    let text = "";
    for (const line of lines) {
      if (text.length + line.length > 980) return `${text}…`;
      text += `${line}\n`;
    }
    return text || empty;
  };

  return {
    title: "La semaine à la forge",
    sections: [
      {
        name: "Chasseur de la semaine",
        value: best?.rare
          ? `**${best.name}**, avec ${best.rare} ${best.rare > 1 ? "cartes légendaires ou plus rares" : "carte légendaire ou plus rare"}.`
          : "Personne n'a sorti de carte légendaire ou plus rare cette semaine.",
      },
      { name: "Collections", value: fit(table, "Aucun joueur pour l'instant.") },
      {
        name: "Découvertes de la semaine",
        value: fit(
          found.map((f) => `${f.card.name} · ${RARITY_LABEL[f.card.rarity]} · par ${f.by}`),
          "Aucune carte secrète découverte cette semaine.",
        ),
      },
    ],
  };
}
