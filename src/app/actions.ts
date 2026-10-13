"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FaceCard } from "@/components/CardFace";
import { drawBooster, ESSENCE } from "@/lib/booster";
import type { Chroma, Rarity } from "@/lib/card";
import { cardById, cardPool, toFaceCard, toListCard } from "@/lib/catalogue";
import { announceCardRank, announceDiscovery, announceGift, announceSeal } from "@/lib/discord";
import { isSecret, nextSealMilestone, PRICE, sealReward, SECRET_RARITIES } from "@/lib/forge";
import { adminClient, currentUser, readAll } from "@/lib/supabase/server";
import { duplicateRule, isRanked, RANKS } from "@/lib/upgrades";

// Every action follows the same pattern: find out who is asking, decide here on the server,
// then let one database function record the result in a single transaction.

type Failure<Reason extends string> = { ok: false; reason: Reason | "signed-out" | "unavailable" };

async function session(): Promise<
  { user: { id: string }; admin: SupabaseClient; failure?: undefined } | { failure: "signed-out" | "unavailable" }
> {
  const user = await currentUser();
  if (!user) return { failure: "signed-out" };
  const admin = adminClient();
  if (!admin) return { failure: "unavailable" };
  // At most 120 actions a minute per player: far above normal play, low enough to stop a script.
  // If the counter itself fails, the action goes through.
  const { data: allowed } = await admin.rpc("rate_limit", { p_user: user.id, p_max: 120, p_seconds: 60 });
  if (allowed === false) return { failure: "unavailable" };
  return { user, admin };
}


const ANNOUNCED_CARD_RANK = 7; // Diamant: from there, a ranked skin climbing is worth telling

async function usernameOf(admin: SupabaseClient, userId: string) {
  const { data } = await admin.from("profiles").select("username").eq("id", userId).single();
  return (data?.username as string | undefined) ?? "Un joueur";
}

// Tells the group's Discord about the secret cards this player is the first to own.
// Rare by nature, so the extra requests only run a few times a week.
async function celebrate(admin: SupabaseClient, userId: string, cardIds: (string | null)[]) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  const secret = cardIds.flatMap((id) => {
    const card = id ? cardById().get(id) : undefined;
    return card && isSecret(card.rarity) ? [card] : [];
  });
  if (!secret.length) return;
  const { data: profile } = await admin.from("profiles").select("username").eq("id", userId).single();
  for (const card of secret) {
    const { count } = await admin.from("collection").select("*", { count: "exact", head: true }).eq("card_id", card.id);
    if (count === 1) await announceDiscovery(profile?.username ?? "Un joueur", card);
  }
}

async function ownedIds(admin: SupabaseClient, userId: string) {
  const rows = await readAll<{ card_id: string }>((from, to) =>
    admin.from("collection").select("card_id").eq("user_id", userId).order("card_id").range(from, to),
  );
  return new Set(rows.map((r) => r.card_id));
}

// A card of this rarity that the player does not own yet, or null when they have them all.
function randomMissing(rarity: Rarity, owned: Set<string>) {
  const missing = cardPool()[rarity].filter((id) => !owned.has(id));
  return missing.length ? missing[Math.floor(Math.random() * missing.length)] : null;
}

// --- Boosters ----------------------------------------------------------------

// `rank` is set when a duplicate raised the rank of a ranked skin, `chroma` when it earned a
// chroma to pick; otherwise a duplicate gives `essence`.
export type OpenedCard = { card: FaceCard; isNew: boolean; essence: number; rank?: number; chroma?: boolean };
export type BoosterResult = { ok: true; cards: OpenedCard[] } | Failure<"empty">;

// Opens one booster. Nothing from the browser decides the content: the cards are drawn here,
// and the database checks the stock and records them in one go.
export async function openBooster(): Promise<BoosterResult> {
  const s = await session();
  if (s.failure) return { ok: false, reason: s.failure };

  const cards = cardById();
  const drawn = drawBooster(cardPool());
  const rules = drawn.map((d) => duplicateRule(cards.get(d.id)!));
  const { data, error } = await s.admin.rpc("open_booster", {
    p_user: s.user.id,
    p_cards: drawn.map((d) => d.id),
    p_essences: drawn.map((d) => ESSENCE[d.rarity]),
    p_modes: rules.map((r) => r.mode),
    p_caps: rules.map((r) => r.cap),
  });
  if (error) {
    if (error.message.includes("no_booster")) return { ok: false, reason: "empty" };
    console.error("open_booster failed:", error.code);
    return { ok: false, reason: "unavailable" };
  }

  const rows = data as { card: string; outcome: "new" | "essence" | "rank" | "chroma"; level: number | null }[];
  await celebrate(s.admin, s.user.id, rows.filter((row) => row.outcome === "new").map((row) => row.card));
  const climbed = rows.filter((row) => row.outcome === "rank" && (row.level ?? 0) >= ANNOUNCED_CARD_RANK);
  if (climbed.length && process.env.DISCORD_WEBHOOK_URL) {
    const player = await usernameOf(s.admin, s.user.id);
    for (const row of climbed) await announceCardRank(player, cards.get(row.card)!, RANKS[row.level! - 1]);
  }
  return {
    ok: true,
    cards: rows.map((row) => {
      const card = cards.get(row.card)!;
      return {
        card: toFaceCard(card),
        isNew: row.outcome === "new",
        essence: row.outcome === "essence" ? ESSENCE[card.rarity] : 0,
        rank: row.outcome === "rank" ? (row.level ?? undefined) : undefined,
        chroma: row.outcome === "chroma" || undefined,
      };
    }),
  };
}

// --- Forge seal --------------------------------------------------------------

export type SealResult = { ok: true; card: FaceCard | null; essence: number } | Failure<"not-ready">;

// Collects the next seal reward: a card of the promised rarity that the player does not own.
export async function claimSeal(): Promise<SealResult> {
  const s = await session();
  if (s.failure) return { ok: false, reason: s.failure };

  const { data: profile } = await s.admin.from("profiles").select("seal_days, seal_claimed_day").eq("id", s.user.id).single();
  if (!profile) return { ok: false, reason: "unavailable" };
  const day = nextSealMilestone(profile.seal_claimed_day);
  if (day > profile.seal_days) return { ok: false, reason: "not-ready" };

  const rarity = sealReward(day);
  const cardId = randomMissing(rarity, await ownedIds(s.admin, s.user.id));
  // Nothing left to give in this rarity: the reward is paid in essence, at the price of a forge.
  const essence = cardId ? 0 : PRICE[rarity];
  const { error } = await s.admin.rpc("claim_seal", { p_user: s.user.id, p_day: day, p_card: cardId, p_essence: essence });
  if (error) {
    if (error.message.includes("no_seal")) return { ok: false, reason: "not-ready" };
    console.error("claim_seal failed:", error.code);
    return { ok: false, reason: "unavailable" };
  }
  await celebrate(s.admin, s.user.id, [cardId]);
  if (process.env.DISCORD_WEBHOOK_URL) {
    await announceSeal(await usernameOf(s.admin, s.user.id), day, cardId ? cardById().get(cardId)! : null);
  }
  return { ok: true, card: cardId ? toFaceCard(cardById().get(cardId)!) : null, essence };
}

// --- Spending essence ----------------------------------------------------------

export type PurchaseResult = { ok: true; card: FaceCard } | Failure<"not-enough" | "owned" | "not-for-sale" | "complete">;

async function pay(admin: SupabaseClient, userId: string, cardId: string, rarity: Rarity): Promise<PurchaseResult> {
  const { error } = await admin.rpc("spend_essence", { p_user: userId, p_card: cardId, p_price: PRICE[rarity] });
  if (error) {
    if (error.message.includes("not_enough_essence")) return { ok: false, reason: "not-enough" };
    if (error.code === "23505") return { ok: false, reason: "owned" }; // unique violation
    console.error("spend_essence failed:", error.code);
    return { ok: false, reason: "unavailable" };
  }
  await celebrate(admin, userId, [cardId]);
  return { ok: true, card: toFaceCard(cardById().get(cardId)!) };
}

// Below legendary: buy the exact card.
export async function buyCard(cardId: string): Promise<PurchaseResult> {
  const s = await session();
  if (s.failure) return { ok: false, reason: s.failure };
  const card = cardById().get(cardId);
  if (!card || isSecret(card.rarity)) return { ok: false, reason: "not-for-sale" };
  return pay(s.admin, s.user.id, card.id, card.rarity);
}

// From legendary up: forge a random card of the rarity, always one the player does not own.
export async function forgeCard(rarity: Rarity): Promise<PurchaseResult> {
  const s = await session();
  if (s.failure) return { ok: false, reason: s.failure };
  if (!SECRET_RARITIES.includes(rarity)) return { ok: false, reason: "not-for-sale" };
  const cardId = randomMissing(rarity, await ownedIds(s.admin, s.user.id));
  if (!cardId) return { ok: false, reason: "complete" };
  return pay(s.admin, s.user.id, cardId, rarity);
}

type OwnedRow = {
  card_id: string;
  first_obtained_at: string;
  favorite: boolean;
  copies: number;
  chromas: number[];
  chroma: number | null;
  chroma_picks: number;
};

// --- Collection ----------------------------------------------------------------

export type Revealed = { card: FaceCard; by: string };
// A card owned: when it was first obtained, whether it is a favourite, and its upgrades.
// `rank` only exists on ranked skins. `options` lists the chromas of a skin that has some;
// `unlocked` are the ones the player owns, `chroma` the one worn, `picks` the ones left to choose.
export type Owned = {
  id: string;
  at: string;
  fav: boolean;
  rank?: number;
  options?: Chroma[];
  unlocked?: number[];
  chroma?: number;
  picks?: number;
};
export type CollectionState = {
  owned: Owned[];
  // Secret cards the group has found, with the name of the first player who got each.
  revealed: Revealed[];
  // On a collection page: the cards owned below legendary (the rarer ones are in `revealed`).
  cards?: FaceCard[];
  // Every card at least one player of the group owns.
  discovered: string[];
  essence: number;
};

// What this player may see. Secret cards nobody has found are not sent at all, so they cannot
// be read from the page; the browser only knows how many remain in each rarity.
// With `friendId`, `owned` is that friend's collection instead of the player's own.
// `withCards` adds the owned cards themselves, for the pages that do not ship the catalogue.
export async function collectionState(friendId?: string, withCards = false): Promise<CollectionState | null> {
  const s = await session();
  if (s.failure) return null;
  if (friendId && !(await friendIds(s.admin, s.user.id)).has(friendId)) return null;
  const [owned, discoveries, profile] = await Promise.all([
    readAll<OwnedRow>((from, to) =>
      s.admin
        .from("collection")
        .select("card_id, first_obtained_at, favorite, copies, chromas, chroma, chroma_picks")
        .eq("user_id", friendId ?? s.user.id)
        .order("card_id")
        .range(from, to),
    ),
    // ponytail: reads every discovery, then keeps the secret rarities. Fine for a group of
    // friends (at most one row per card); filter in SQL if the table grows large.
    readAll<{ card_id: string; username: string }>((from, to) =>
      s.admin.from("discoveries").select("card_id, username").order("card_id").range(from, to),
    ),
    s.admin.from("profiles").select("essence").eq("id", s.user.id).single(),
  ]);
  const cards = cardById();
  const revealed: Revealed[] = [];
  for (const d of discoveries) {
    const card = cards.get(d.card_id);
    if (card && isSecret(card.rarity)) revealed.push({ card: toListCard(card), by: d.username });
  }
  return {
    owned: owned.map((row) => {
      const card = cards.get(row.card_id);
      const ranked = card && isRanked(card);
      // A ranked skin climbs ranks instead of unlocking chromas.
      const options = !ranked && card?.chromas?.length ? card.chromas : undefined;
      return {
        id: row.card_id,
        at: row.first_obtained_at,
        fav: row.favorite,
        rank: ranked ? row.copies : undefined,
        options,
        unlocked: options && row.chromas,
        chroma: (options && row.chroma) ?? undefined,
        picks: options && row.chroma_picks,
      };
    }),
    revealed,
    cards: withCards
      ? owned.flatMap((row) => {
          const card = cards.get(row.card_id);
          return card && !isSecret(card.rarity) ? [toListCard(card)] : [];
        })
      : undefined,     discovered: discoveries.map((d) => d.card_id),
    essence: profile.data?.essence ?? 0,
  };
}

// Wears a chroma on one of the player's skins: one already unlocked, a new one paid with a pick
// earned from a duplicate, or null to go back to the original look.
export async function pickChroma(cardId: string, chromaId: number | null): Promise<{ ok: boolean }> {
  const s = await session();
  if (s.failure || typeof cardId !== "string") return { ok: false };
  const mine = s.admin.from("collection");
  if (chromaId === null) {
    const { error } = await mine.update({ chroma: null }).eq("user_id", s.user.id).eq("card_id", cardId);
    return { ok: !error };
  }
  // The chroma must be one of this skin's: the database does not know the catalogue.
  if (!cardById().get(cardId)?.chromas?.some((c) => c.id === chromaId)) return { ok: false };
  // Already unlocked: just wear it. The filter on `chromas` makes this a no-op otherwise.
  const { data: worn, error } = await mine
    .update({ chroma: chromaId })
    .eq("user_id", s.user.id)
    .eq("card_id", cardId)
    .contains("chromas", [chromaId])
    .select("card_id");
  if (error) return { ok: false };
  if (worn.length) return { ok: true };
  const { error: locked } = await s.admin.rpc("unlock_chroma", { p_user: s.user.id, p_card: cardId, p_chroma: chromaId });
  return { ok: !locked };
}

// Marks or unmarks one of the player's own cards as a favourite.
export async function setFavorite(cardId: string, favorite: boolean): Promise<{ ok: boolean }> {
  const s = await session();
  if (s.failure || typeof cardId !== "string") return { ok: false };
  const { error } = await s.admin
    .from("collection")
    .update({ favorite: favorite === true })
    .eq("user_id", s.user.id)
    .eq("card_id", cardId);
  if (error) console.error("setFavorite failed:", error.code);
  return { ok: !error };
}

// The full card, with its texts, when it is opened. A secret card is only given once a player
// has found it.
export async function cardDetail(cardId: string): Promise<FaceCard | null> {
  const card = typeof cardId === "string" ? cardById().get(cardId) : undefined;
  if (!card) return null;
  if (isSecret(card.rarity)) {
    const s = await session();
    if (s.failure) return null;
    const { data } = await s.admin.from("discoveries").select("card_id").eq("card_id", cardId).limit(1);
    if (!data?.length) return null;
  }
  return toFaceCard(card);
}

// --- Friends -------------------------------------------------------------------

export type Player = { id: string; username: string; avatar: string | null };
export type FriendsState = { friends: (Player & { cards: number })[]; others: Player[] };

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

async function friendIds(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from("friendships").select("friend_id").eq("user_id", userId);
  if (error) throw new Error("could not read the friends");
  return new Set(data.map((row) => row.friend_id as string));
}

// The player's friends with the size of their collection, and everyone else who plays.
// ponytail: lists every player of the game, fine for a group of friends. Add a search by
// name if the list ever gets long.
export async function friendsState(): Promise<FriendsState | null> {
  const s = await session();
  if (s.failure) return null;
  const [ids, profiles] = await Promise.all([
    friendIds(s.admin, s.user.id),
    s.admin.from("profiles").select("id, username, avatar_url").neq("id", s.user.id).order("username"),
  ]);
  if (profiles.error) throw new Error("could not read the players");
  const players: Player[] = profiles.data.map((p) => ({ id: p.id, username: p.username, avatar: p.avatar_url }));
  const friends = await Promise.all(
    players
      .filter((p) => ids.has(p.id))
      .map(async (p) => {
        const { count } = await s.admin.from("collection").select("*", { count: "exact", head: true }).eq("user_id", p.id);
        return { ...p, cards: count ?? 0 };
      }),
  );
  return { friends, others: players.filter((p) => !ids.has(p.id)) };
}

// Friendship needs no approval and goes both ways: both rows are written in one statement.
export async function addFriend(friendId: string): Promise<{ ok: boolean }> {
  const s = await session();
  if (s.failure || !UUID.test(friendId) || friendId === s.user.id) return { ok: false };
  const { error } = await s.admin.from("friendships").upsert([
    { user_id: s.user.id, friend_id: friendId },
    { user_id: friendId, friend_id: s.user.id },
  ]);
  if (error) console.error("addFriend failed:", error.code); // an unknown id breaks the foreign key
  return { ok: !error };
}

export async function removeFriend(friendId: string): Promise<{ ok: boolean }> {
  const s = await session();
  // The id goes into a filter written as text: nothing but a real id may pass.
  if (s.failure || !UUID.test(friendId)) return { ok: false };
  const { error } = await s.admin
    .from("friendships")
    .delete()
    .or(`and(user_id.eq.${s.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${s.user.id})`);
  if (error) console.error("removeFriend failed:", error.code);
  return { ok: !error };
}

export type GiftResult = { ok: true } | Failure<"not-friends" | "not-enough" | "already-owned" | "not-owned" | "empty">;

// Gives cards and essence to a friend. The database moves everything or nothing.
export async function giveToFriend(friendId: string, cardIds: string[], essence: number): Promise<GiftResult> {
  const s = await session();
  if (s.failure) return { ok: false, reason: s.failure };
  const cards = Array.isArray(cardIds) ? [...new Set(cardIds.filter((id) => typeof id === "string"))] : [];
  const amount = Number.isInteger(essence) && essence > 0 ? essence : 0;
  if (!UUID.test(friendId) || (!cards.length && !amount)) return { ok: false, reason: "empty" };

  const { error } = await s.admin.rpc("give", { p_from: s.user.id, p_to: friendId, p_cards: cards, p_essence: amount });
  if (error) {
    for (const [message, reason] of [
      ["not_friends", "not-friends"],
      ["not_enough_essence", "not-enough"],
      ["already_owned", "already-owned"],
      ["not_owned", "not-owned"],
    ] as const) {
      if (error.message.includes(message)) return { ok: false, reason };
    }
    console.error("give failed:", error.code);
    return { ok: false, reason: "unavailable" };
  }
  const { data: names } = await s.admin.from("profiles").select("id, username").in("id", [s.user.id, friendId]);
  const name = (id: string) => names?.find((p) => p.id === id)?.username ?? "Un joueur";
  await announceGift(name(s.user.id), name(friendId), cards.length, amount);
  return { ok: true };
}

// --- Account -------------------------------------------------------------------

// Erases the player for good. Deleting the sign-in account removes the profile, and with it
// the collection and the friendships (cascading foreign keys).
export async function deleteAccount(): Promise<{ ok: true } | { ok: false; reason: "signed-out" | "unavailable" }> {
  const s = await session();
  if (s.failure) return { ok: false, reason: s.failure };
  const { error } = await s.admin.auth.admin.deleteUser(s.user.id);
  if (error) console.error("deleteAccount failed:", error.code);
  return error ? { ok: false, reason: "unavailable" } : { ok: true };
}

// The server's clock. The booster stock is counted from it, not from the player's device:
// a device a few seconds late showed one booster fewer right after opening one.
export async function serverTime() {
  return Date.now();
}
