import { type Card, RARITY_LABEL, type Rarity } from "./card";
import { essences } from "./forge";

// Server only. Announcements go to the group's Discord server through a webhook: one URL, set
// in DISCORD_WEBHOOK_URL, and no bot to host. Without it, nothing is sent.
// ponytail: a webhook can only post. Slash commands would need a Discord application with an
// interactions endpoint (a route on this site), not a bot process.

const COLOR: Record<Rarity, number> = {
  common: 0x8d979c,
  uncommon: 0x58b97e,
  rare: 0x4b8df5,
  epic: 0xa274f5,
  legendary: 0xf2613c,
  mythic: 0xf04fa9,
  ultimate: 0xf5c44e,
  transcendent: 0xc8f6ff,
};

type Embed = {
  title: string;
  description?: string;
  color?: number;
  thumbnail?: { url: string };
  fields?: { name: string; value: string }[];
};

// Never throws and never waits long: an announcement must not break or slow down the game.
async function post(embed: Embed) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No mention can ping anyone: the names come from Discord profiles.
      body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Discord is down or slow: the card is in the collection anyway.
  }
}

// A player is the first of the group to find a secret card.
// `odds` is set when the card came out of a booster: the chances the player had.
export function announceDiscovery(
  player: string,
  card: Pick<Card, "name" | "rarity" | "image">,
  odds?: { rarity: string; card: string },
) {
  return post({
    title: `${card.name} · ${RARITY_LABEL[card.rarity]}`,
    description:
      `**${player}** vient de découvrir une carte que personne n'avait encore trouvée.` +
      (odds
        ? `

Une carte ${RARITY_LABEL[card.rarity].toLowerCase()} dans un booster : ${odds.rarity}.
Cette carte-là précisément : ${odds.card}.`
        : ""),
    color: COLOR[card.rarity],
    // Emblems are local files of the site: Discord could not fetch them.
    thumbnail: card.image.startsWith("https://") ? { url: card.image } : undefined,
  });
}

export function announceGift(from: string, to: string, cards: number, essence: number) {
  const parts = [
    cards > 0 && `${cards} ${cards > 1 ? "cartes" : "carte"}`,
    essence > 0 && essences(essence),
  ].filter(Boolean);
  return post({ title: "Un cadeau à la forge", description: `**${from}** offre ${parts.join(" et ")} à **${to}**.` });
}

// A player collects a reward of the forge seal (days 14, 21 and 28 of each cycle).
export function announceSeal(player: string, day: number, card: Pick<Card, "name" | "rarity" | "image"> | null) {
  return post({
    title: `Sceau de forge · jour ${day}`,
    description: card
      ? `**${player}** a tenu ${day} jours et repart avec **${card.name}** (${RARITY_LABEL[card.rarity]}).`
      : `**${player}** a tenu ${day} jours. Il avait déjà toutes les cartes de ce palier : le sceau l'a payé en essence.`,
    color: card ? COLOR[card.rarity] : undefined,
    thumbnail: card?.image.startsWith("https://") ? { url: card.image } : undefined,
  });
}

// A ranked skin reaches Diamant or higher.
export function announceCardRank(player: string, card: Pick<Card, "name" | "image">, rank: string) {
  return post({
    title: `${card.name} · rang ${rank}`,
    description: `**${player}** a monté cette carte au rang **${rank}**.`,
    color: 0x7fb0ff,
    thumbnail: card.image.startsWith("https://") ? { url: card.image } : undefined,
  });
}

export function postRecap(recap: { title: string; sections: { name: string; value: string }[] }) {
  return post({ title: recap.title, color: 0xc8a45c, fields: recap.sections });
}
