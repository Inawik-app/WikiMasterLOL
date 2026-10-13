"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buyCard, collectionState, type CollectionState, setFavorite } from "@/app/actions";
import { type CardType, RARITIES, RARITY_LABEL, type Rarity, TYPE_LABEL } from "@/lib/card";
import { isSecret, PRICE, SECRET_RARITIES } from "@/lib/forge";
import { createClient } from "@/lib/supabase/client";
import { CardDialog } from "./CardDialog";
import { CardFace, cardClass, cardLabel, type FaceCard } from "./CardFace";
import { Gem, GemDefs } from "./Gem";

const PAGE = 60;
const TYPES = Object.keys(TYPE_LABEL) as CardType[];
// Lowercase and strip accents, so "ecu" finds "Écu".
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const count = new Intl.NumberFormat("fr-FR");

// One cell of the grid: a card the player may see, or a secret one nobody has found yet.
type Item =
  | { kind: "card"; key: string; rarity: Rarity; card: FaceCard; owned: boolean; found: boolean; by?: string; fav?: boolean; at?: string }
  | { kind: "secret"; key: string; rarity: Rarity };
type CardItem = Extract<Item, { kind: "card" }>;

// `cards` holds every card below legendary. The rarer ones are secret: the page only knows
// how many exist (`secretTotals`) until the server says which ones the group has found.
// `view` "collection" keeps only the cards the player owns, or the ones `friend` owns.
export function Catalogue({
  cards,
  secretTotals,
  view = "catalogue",
  friend,
}: {
  cards: FaceCard[];
  secretTotals: Record<Rarity, number>;
  view?: "catalogue" | "collection";
  friend?: { id: string; username: string };
}) {
  const mine = view === "collection";
  const [type, setType] = useState<CardType | "all">("all");
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [query, setQuery] = useState("");
  const [foundOnly, setFoundOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [opened, setOpened] = useState<CardItem | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<"rarity" | "recent" | "name">("rarity");
  const [buying, setBuying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // undefined: not known yet. null: signed out, or the collection cannot be read; the catalogue
  // then shows as a plain catalogue.
  const [state, setState] = useState<CollectionState | null | undefined>(undefined);
  const [supabase] = useState(createClient);
  const sentinel = useRef<HTMLDivElement>(null);

  // If the collection cannot be read, the page stays a plain catalogue.
  const friendId = friend?.id;
  const refresh = useCallback(async () => setState(await collectionState(friendId).catch(() => null)), [friendId]);
  useEffect(() => {
    if (!supabase) return;
    // Read the collection again whenever the player signs in or out.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refresh();
      else setState(null);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, refresh]);

  const items = useMemo(() => {
    const owned = new Map(state?.owned.map((o) => [o.id, o]));
    const discovered = new Set(state?.discovered);
    const list: Item[] = [];
    const found: Partial<Record<Rarity, number>> = {};
    for (const { card, by } of state?.revealed ?? []) {
      found[card.rarity] = (found[card.rarity] ?? 0) + 1;
      list.push({ kind: "card", key: card.id, rarity: card.rarity, card, owned: owned.has(card.id), found: true, by, ...owned.get(card.id) });
    }
    for (const r of SECRET_RARITIES) {
      for (let i = found[r] ?? 0; i < secretTotals[r]; i++) list.push({ kind: "secret", key: `${r}-${i}`, rarity: r });
    }
    // Signed out, nothing is "missing": the page is a plain catalogue.
    for (const card of cards) {
      list.push({
        kind: "card",
        key: card.id,
        rarity: card.rarity,
        card,
        owned: state ? owned.has(card.id) : true,
        found: discovered.has(card.id),
        ...owned.get(card.id),
      });
    }
    // Rarest first; within a rarity, found cards come before the silhouettes.
    return list.sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity));
  }, [cards, secretTotals, state]);

  const searchIndex = useMemo(
    () => new Map(items.map((it) => [it.key, it.kind === "card" ? fold(`${it.card.name} ${it.card.subtitle ?? ""}`) : ""])),
    [items],
  );

  // Rarity counts follow the other filters, so the rack shows the pyramid of what is on screen.
  const beforeRarity = useMemo(() => {
    const q = fold(query.trim());
    return items.filter((it) => {
      if (it.kind === "secret") return type === "all" && !q && !mine && !foundOnly; // a silhouette has no type and no name
      if (mine ? !it.owned || (favOnly && !it.fav) : foundOnly && !it.found) return false;
      return (type === "all" || it.card.type === type) && (!q || searchIndex.get(it.key)!.includes(q));
    });
  }, [items, searchIndex, type, query, mine, foundOnly, favOnly]);

  const rarityCount = useMemo(() => {
    const counts = Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>;
    for (const it of beforeRarity) counts[it.rarity]++;
    return counts;
  }, [beforeRarity]);

  // `items` come rarest first. The other orders only exist in a collection, where every item is a card.
  const results = useMemo(() => {
    const list = rarity ? beforeRarity.filter((it) => it.rarity === rarity) : beforeRarity;
    if (sort === "rarity") return list;
    const cardsOnly = list.filter((it) => it.kind === "card");
    return sort === "name"
      ? cardsOnly.sort((a, b) => a.card.name.localeCompare(b.card.name, "fr"))
      : cardsOnly.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  }, [beforeRarity, rarity, sort]);
  const shown = results.slice(0, limit);
  const total = cards.length + SECRET_RARITIES.reduce((n, r) => n + secretTotals[r], 0);

  // Load the next page when the end of the grid comes near. Re-created after each page
  // so it fires again if the sentinel is still in view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setLimit((current) => current + PAGE),
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [limit, results.length]);

  const open = (item: CardItem) => {
    setOpened(item);
    setNotice(null);
  };

  const buy = async (item: CardItem) => {
    setBuying(true);
    setNotice(null);
    const result = await buyCard(item.card.id);
    if (result.ok) {
      setOpened({ ...item, owned: true });
    } else {
      setNotice(
        result.reason === "not-enough"
          ? "Tu n'as pas assez d'essence."
          : result.reason === "owned"
            ? "Tu as déjà cette carte."
            : "L'achat n'a pas abouti. Réessaie dans un instant.",
      );
    }
    await refresh();
    setBuying(false);
  };


  // Shown at once; the server is told in the background, and the collection read again.
  const favorite = async (item: CardItem) => {
    setOpened({ ...item, fav: !item.fav });
    const result = await setFavorite(item.card.id, !item.fav);
    if (!result.ok) setNotice("Le favori n'a pas été enregistré. Réessaie dans un instant.");
    await refresh();
  };

  // Where the opened card stands in the player's collection, and what they can do about it.
  const ownership = opened && state && !friend && (
    <div className="anvil__own">
      {opened.owned ? (
        <>
          <p>Dans ta collection{opened.by ? ` · découverte par ${opened.by}` : ""}</p>
          <button type="button" className="forge__secondary" aria-pressed={Boolean(opened.fav)} onClick={() => favorite(opened)}>
            {opened.fav ? "★ Retirer des favoris" : "☆ Ajouter aux favoris"}
          </button>
        </>
      ) : isSecret(opened.card.rarity) ? (
        <p>Découverte par {opened.by}. À trouver dans un booster ou à la forge.</p>
      ) : (
        <>
          <button
            type="button"
            className="anvil__buy"
            disabled={buying || state.essence < PRICE[opened.card.rarity]}
            onClick={() => buy(opened)}
          >
            {buying ? "Achat…" : `Acheter · ${count.format(PRICE[opened.card.rarity])} essence`}
          </button>
          <p>Tu as {count.format(state.essence)} essence.</p>
        </>
      )}
      {notice && <p role="alert">{notice}</p>}
    </div>
  );

  // The collection needs a player: nothing to show before the answer, a word of help after.
  if (mine && !state) {
    return state === null || !supabase ? (
      <p className="empty">Connecte-toi avec Discord, en haut de la page, pour voir ta collection.</p>
    ) : null;
  }

  return (
    <>
      <GemDefs />

      <section className="filters" aria-label="Filtres">
        <div className="rack" role="group" aria-label="Rareté">
          {RARITIES.map((r) => (
            <button
              key={r}
              type="button"
              className="rack__slot"
              data-rarity={r}
              aria-pressed={rarity === r}
              disabled={!rarityCount[r]}
              onClick={() => {
                setRarity(rarity === r ? null : r);
                setLimit(PAGE);
              }}
            >
              <Gem rarity={r} />
              <span className="rack__label">{RARITY_LABEL[r]}</span>
              <span className="rack__count">{count.format(rarityCount[r])}</span>
            </button>
          ))}
        </div>

        <div className="bench">
          <div className="tabs" role="group" aria-label="Type de carte">
            {(["all", ...TYPES] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="tabs__tab"
                aria-pressed={type === t}
                onClick={() => {
                  setType(t);
                  setLimit(PAGE);
                }}
              >
                {t === "all" ? "Tout" : TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <label className="search">
            <span className="sr-only">Chercher une carte</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
            <input
              type="search"
              value={query}
              placeholder="Chercher une carte"
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(PAGE);
              }}
            />
          </label>
        </div>
      </section>

      <div className="tally">
        <p aria-live="polite">
          <strong>{count.format(results.length)}</strong> {results.length > 1 ? "cartes" : "carte"}
          {state && (
            <span>
              {" "}
              · {friend ? `${friend.username} en possède` : "tu en possèdes"} {count.format(state.owned.length)} sur{" "}
              {count.format(total)}
            </span>
          )}
        </p>
        {mine && (
          <div className="tally__tools">
            <label className="sort">
              Trier par
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as typeof sort);
                  setLimit(PAGE);
                }}
              >
                <option value="rarity">Rareté</option>
                <option value="recent">Dernières obtenues</option>
                <option value="name">Ordre alphabétique</option>
              </select>
            </label>
            <button
              type="button"
              className="switch"
              aria-pressed={favOnly}
              onClick={() => {
                setFavOnly(!favOnly);
                setLimit(PAGE);
              }}
            >
              <span className="switch__track" aria-hidden="true" />
              Favoris
            </button>
          </div>
        )}
        {state && !mine && (
          <button
            type="button"
            className="switch"
            aria-pressed={foundOnly}
            onClick={() => {
              setFoundOnly(!foundOnly);
              setLimit(PAGE);
            }}
          >
            <span className="switch__track" aria-hidden="true" />
            Découvertes par les joueurs
          </button>
        )}
      </div>

      {results.length ? (
        <ul className="grid-cards">
          {shown.map((item) =>
            item.kind === "secret" ? (
              <li key={item.key}>
                <div
                  className="card card--locked"
                  data-rarity={item.rarity}
                  role="img"
                  aria-label={`Carte inconnue, ${RARITY_LABEL[item.rarity]}`}
                >
                  <span className="card__art">
                    <Gem rarity={item.rarity} className="card__sigil" />
                  </span>
                  <Gem rarity={item.rarity} className="card__gem" />
                </div>
              </li>
            ) : (
              <li key={item.key}>
                <button
                  type="button"
                  className={`${cardClass(item.card)}${item.owned ? "" : " card--missing"}${item.fav ? " card--fav" : ""}`}
                  data-rarity={item.rarity}
                  aria-label={`${cardLabel(item.card)}${item.owned ? "" : ", pas encore dans ta collection"}${item.fav ? ", favori" : ""}`}
                  onClick={() => open(item)}
                >
                  <CardFace card={item.card} />
                </button>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="empty">
          {mine && !state?.owned.length
            ? friend
              ? `${friend.username} n'a encore aucune carte.`
              : "Ta collection est vide. Ouvre ton premier booster à la forge."
            : "Aucune carte ne sort de la forge avec ces réglages. Retire un filtre ou essaie un autre nom."}
        </p>
      )}
      {shown.length < results.length && <div ref={sentinel} className="sentinel" aria-hidden="true" />}

      <CardDialog card={opened?.card ?? null} onClose={() => setOpened(null)}>
        {ownership}
      </CardDialog>

    </>
  );
}
