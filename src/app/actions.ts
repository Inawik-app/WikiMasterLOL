"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FaceCard } from "@/components/CardFace";
import { drawBooster, ESSENCE } from "@/lib/booster";
import type { Rarity } from "@/lib/card";
import { allCards, cardPool, toFaceCard } from "@/lib/catalogue";
import { isSecret, nextSealMilestone, PRICE, sealReward, SECRET_RARITIES } from "@/lib/forge";
import { adminClient, currentUser } from "@/lib/supabase/server";

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
  return { user, admin };
}

const cardById = () => new Map(allCards().map((c) => [c.id, c]));

// Supabase returns at most 1,000 rows per request: read page after page.
async function readAll<Row>(page: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>) {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error || !data) throw new Error("could not read the collection");
    rows.push(...data);
    if (data.length < 1000) return rows;
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

export type OpenedCard = { card: FaceCard; isNew: boolean; essence: number };
export type BoosterResult = { ok: true; cards: OpenedCard[] } | Failure<"empty">;

// Opens one booster. Nothing from the browser decides the content: the cards are drawn here,
// and the database checks the stock and records them in one go.
export async function openBooster(): Promise<BoosterResult> {
  const s = await session();
  if (s.failure) return { ok: false, reason: s.failure };

  const drawn = drawBooster(cardPool());
  const { data, error } = await s.admin.rpc("open_booster", {
    p_user: s.user.id,
    p_cards: drawn.map((d) => d.id),
    p_essences: drawn.map((d) => ESSENCE[d.rarity]),
  });
  if (error) {
    if (error.message.includes("no_booster")) return { ok: false, reason: "empty" };
    console.error("open_booster failed:", error.message);
    return { ok: false, reason: "unavailable" };
  }

  const cards = cardById();
  return {
    ok: true,
    cards: (data as { card: string; is_new: boolean }[]).map((row) => {
      const card = cards.get(row.card)!;
      return { card: toFaceCard(card), isNew: row.is_new, essence: row.is_new ? 0 : ESSENCE[card.rarity] };
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
    console.error("claim_seal failed:", error.message);
    return { ok: false, reason: "unavailable" };
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
    console.error("spend_essence failed:", error.message);
    return { ok: false, reason: "unavailable" };
  }
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

// --- Collection ----------------------------------------------------------------

export type Revealed = { card: FaceCard; by: string };
export type CollectionState = {
  owned: string[];
  // Secret cards the group has found, with the name of the first player who got each.
  revealed: Revealed[];
  // Every card at least one player of the group owns.
  discovered: string[];
  essence: number;
};

// What this player may see. Secret cards nobody has found are not sent at all, so they cannot
// be read from the page; the browser only knows how many remain in each rarity.
// With `friendId`, `owned` is that friend's collection instead of the player's own.
export async function collectionState(friendId?: string): Promise<CollectionState | null> {
  const s = await session();
  if (s.failure) return null;
  if (friendId && !(await friendIds(s.admin, s.user.id)).has(friendId)) return null;
  const [owned, discoveries, profile] = await Promise.all([
    ownedIds(s.admin, friendId ?? s.user.id),
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
    if (card && isSecret(card.rarity)) revealed.push({ card: toFaceCard(card), by: d.username });
  }
  return { owned: [...owned], revealed, discovered: discoveries.map((d) => d.card_id), essence: profile.data?.essence ?? 0 };
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
  if (error) console.error("addFriend failed:", error.message); // an unknown id breaks the foreign key
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
  if (error) console.error("removeFriend failed:", error.message);
  return { ok: !error };
}
