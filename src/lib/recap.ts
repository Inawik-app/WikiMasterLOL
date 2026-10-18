import type { SupabaseClient } from "@supabase/supabase-js";
import { RARITIES, RARITY_LABEL, type Rarity } from "./card";
import { cardById } from "./catalogue";
import { essences, isSecret } from "./forge";
import { playerRank } from "./level";
import { luck, oddsText, rareCardsPerBooster } from "./luck";
import { BOOSTER_SIZE } from "./booster";
import { readAll } from "./supabase/server";

// Server only. What happened in the group over the last seven days, as text for Discord.

const RANK_EMOJI = ["⚙️", "🥉", "🥈", "🥇", "💠", "🟢", "💎", "🔮", "🔥", "👑"];
const WEEK = 7 * 24 * 60 * 60 * 1000;
// Fewer boosters than this says nothing about luck.
const MIN_BOOSTERS = 5;
const count = new Intl.NumberFormat("fr-FR");
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const plural = (n: number, one: string, many: string) => `${count.format(n)} ${n > 1 ? many : one}`;

// "1 mythique, 2 légendaires"
const RARE_WORD: Partial<Record<Rarity, [string, string]>> = {
  legendary: ["légendaire", "légendaires"],
  mythic: ["mythique", "mythiques"],
  ultimate: ["ultime", "ultimes"],
  transcendent: ["transcendante", "transcendantes"],
};
function rareList(rarities: Rarity[]) {
  const counts = new Map<Rarity, number>();
  for (const r of rarities) counts.set(r, (counts.get(r) ?? 0) + 1);
  return [...counts].map(([r, n]) => plural(n, ...RARE_WORD[r]!)).join(", ");
}
const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export type Recap = { title: string; sections: { name: string; value: string }[] };

// A table added by a later migration may not exist yet: the recap then goes without it.
const orEmpty = <Row>(rows: Promise<Row[]>) => rows.catch(() => [] as Row[]);

export async function weeklyRecap(admin: SupabaseClient, now = new Date()): Promise<Recap> {
  const since = new Date(now.getTime() - WEEK).toISOString();
  const [{ data: profiles }, rows, discoveries, draws, gifts] = await Promise.all([
    admin.from("profiles").select("id, username"),
    // ponytail: reads every collection row of every player. Fine for a group of friends, once
    // a week; count in SQL if the game grows.
    readAll<{ user_id: string; card_id: string; first_obtained_at: string }>((from, to) =>
      admin.from("collection").select("user_id, card_id, first_obtained_at").order("user_id").order("card_id").range(from, to),
    ),
    readAll<{ card_id: string; username: string }>((from, to) =>
      admin.from("discoveries").select("card_id, username").gte("first_obtained_at", since).order("card_id").range(from, to),
    ),
    orEmpty(
      readAll<{ user_id: string; rarity: Rarity }>((from, to) =>
        admin.from("draws").select("user_id, rarity").gte("drawn_at", since).order("drawn_at").order("card_id").range(from, to),
      ),
    ),
    orEmpty(
      readAll<{ from_id: string; cards: number; essence: number }>((from, to) =>
        admin.from("gifts").select("from_id, cards, essence").gte("given_at", since).order("given_at").range(from, to),
      ),
    ),
  ]);
  // The draw log may be younger than the week: luck then only covers the part it saw.
  const { data: firstDraw } = await admin.from("draws").select("drawn_at").order("drawn_at").limit(1);
  const logStart = firstDraw?.[0]?.drawn_at as string | undefined;
  const partial = logStart !== undefined && logStart > since;

  // Old draws are of no use any more.
  await admin.from("draws").delete().lt("drawn_at", new Date(now.getTime() - 8 * WEEK).toISOString());

  const cards = cardById();
  const players = (profiles ?? []).map((profile) => {
    const mine = rows.filter((row) => row.user_id === profile.id);
    const drawn = draws.filter((draw) => draw.user_id === profile.id);
    const given = gifts.filter((gift) => gift.from_id === profile.id);
    const boosters = Math.round(drawn.length / BOOSTER_SIZE);
    const rare = drawn.filter((draw) => isSecret(draw.rarity)).length;
    return {
      name: profile.username as string,
      total: mine.length,
      gained: mine.filter((row) => row.first_obtained_at >= since).length,
      // Cards from legendary up that joined the collection this week, whatever their source
      // (booster, forge, seal, gift), rarest first.
      gainedRare: mine
        .filter((row) => row.first_obtained_at >= since)
        .map((row) => cards.get(row.card_id)?.rarity)
        .filter((rarity): rarity is Rarity => rarity !== undefined && isSecret(rarity))
        .sort((a, b) => RARITIES.indexOf(b) - RARITIES.indexOf(a)),
      boosters,
      rare,
      ...luck(rare, boosters),
      givenCards: given.reduce((sum, gift) => sum + gift.cards, 0),
      givenEssence: given.reduce((sum, gift) => sum + gift.essence, 0),
    };
  });

  // Luck: the player whose week was the least likely, on the good side and on the bad side.
  const played = players.filter((p) => p.boosters >= MIN_BOOSTERS);
  const luckiest = [...played].sort((a, b) => a.atLeast - b.atLeast)[0];
  const unluckiest = [...played].filter((p) => p !== luckiest).sort((a, b) => a.atMost - b.atMost)[0];
  const score = (p: (typeof players)[number]) =>
    `${plural(p.rare, "carte légendaire ou plus rare", "cartes légendaires ou plus rares")} en ${plural(p.boosters, "booster", "boosters")}, pour ${decimal.format(p.expected)} attendues`;
  const luckLines = [
    luckiest && `🍀 **${luckiest.name}** · ${score(luckiest)}. Faire aussi bien ou mieux : ${oddsText(luckiest.atLeast)}.`,
    unluckiest && `💀 **${unluckiest.name}** · ${score(unluckiest)}. Faire aussi mal ou pire : ${oddsText(unluckiest.atMost)}.`,
  ].filter(Boolean);

  // Generosity: cards first, essence to break ties.
  const generous = players
    .filter((p) => p.givenCards || p.givenEssence)
    .sort((a, b) => b.givenCards - a.givenCards || b.givenEssence - a.givenEssence)[0];

  const table = [...players]
    .sort((a, b) => b.total - a.total)
    .map((p) => {
      const { rank, label } = playerRank(p.total);
      return `${RANK_EMOJI[rank - 1]} **${p.name}** · ${label} · ${plural(p.total, "carte", "cartes")}${p.gained ? ` (+${count.format(p.gained)}${p.gainedRare.length ? `, dont ${rareList(p.gainedRare)}` : ""})` : ""}`;
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
        name: "La chance de la semaine",
        value:
          (partial && luckLines.length ? `Boosters enregistrés depuis le ${dayFormat.format(new Date(logStart!))} seulement.
` : "") +
            fit(luckLines as string[], "") ||
          `Personne n'a ouvert au moins ${MIN_BOOSTERS} boosters cette semaine : pas assez pour parler de chance.`,
      },
      {
        name: "Le calcul",
        value: `Un booster contient en moyenne ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(rareCardsPerBooster())} carte légendaire ou plus rare, soit une tous les ${Math.round(1 / rareCardsPerBooster())} boosters. La chance compare ce que chacun a tiré à cette moyenne (loi de Poisson).`,
      },
      {
        name: "Le plus généreux",
        value: generous
          ? `🎁 **${generous.name}** · ${[
              generous.givenCards > 0 && plural(generous.givenCards, "carte donnée", "cartes données"),
              generous.givenEssence > 0 && `${essences(generous.givenEssence)} ${generous.givenEssence > 1 ? "offertes" : "offerte"}`,
            ]
              .filter(Boolean)
              .join(" et ")}.`
          : "Aucun don cette semaine.",
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
