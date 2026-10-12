"use client";

/* eslint-disable @next/next/no-img-element -- hotlinked Riot art, see CardFace */
import { type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buyCard, collectionState, type CollectionState } from "@/app/actions";
import { type CardType, RARITIES, RARITY_LABEL, type Rarity, TYPE_LABEL } from "@/lib/card";
import { isSecret, PRICE, SECRET_RARITIES } from "@/lib/forge";
import { createClient } from "@/lib/supabase/client";
import { CardFace, cardClass, cardLabel, type FaceCard, isWide, thumb } from "./CardFace";
import { Gem, GemDefs } from "./Gem";

const PAGE = 60;
const TYPES = Object.keys(TYPE_LABEL) as CardType[];
const LINK_LABEL: Partial<Record<CardType, string>> = {
  story: "Lire le récit",
  video: "Regarder la vidéo",
  comic: "Lire la bande dessinée",
  region: "Explorer la région",
  song: "Écouter sur YouTube",
  person: "Voir sur Leaguepedia",
};

const NARRATIVE_TYPES = new Set<CardType>(["story", "video", "comic"]);

// Lowercase and strip accents, so "ecu" finds "Écu".
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const count = new Intl.NumberFormat("fr-FR");

// One cell of the grid: a card the player may see, or a secret one nobody has found yet.
type Item =
  | { kind: "card"; key: string; rarity: Rarity; card: FaceCard; owned: boolean; found: boolean; by?: string }
  | { kind: "secret"; key: string; rarity: Rarity };
type CardItem = Extract<Item, { kind: "card" }>;

// What the opened card says about itself.
function CardInfo({ card }: { card: FaceCard }) {
  return (
    <>
      <h2 id="anvil-title">{card.name}</h2>
      {card.subtitle && (
        <p className="anvil__subtitle">
          {/* For a story or a video the subtitle lists the champions involved. */}
          {NARRATIVE_TYPES.has(card.type) ? `Avec ${card.subtitle}` : card.subtitle}
        </p>
      )}
      <p className="anvil__rank">
        <Gem rarity={card.rarity} />
        {RARITY_LABEL[card.rarity]}
        <span>{TYPE_LABEL[card.type]}</span>
      </p>
      {card.flavor && <p className="anvil__flavor">{card.flavor}</p>}
      {card.facts && (
        <dl className="anvil__facts">
          {card.facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {card.url && (
        <a className="anvil__link" href={card.url} target="_blank" rel="noreferrer">
          {LINK_LABEL[card.type] ?? "Ouvrir"}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>
      )}
    </>
  );
}

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
  const [artOnly, setArtOnly] = useState(false);
  const [buying, setBuying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // undefined: not known yet. null: signed out, or the collection cannot be read; the catalogue
  // then shows as a plain catalogue.
  const [state, setState] = useState<CollectionState | null | undefined>(undefined);
  const [supabase] = useState(createClient);
  const dialog = useRef<HTMLDialogElement>(null);
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
    const owned = new Set(state?.owned);
    const discovered = new Set(state?.discovered);
    const list: Item[] = [];
    const found: Partial<Record<Rarity, number>> = {};
    for (const { card, by } of state?.revealed ?? []) {
      found[card.rarity] = (found[card.rarity] ?? 0) + 1;
      list.push({ kind: "card", key: card.id, rarity: card.rarity, card, owned: owned.has(card.id), found: true, by });
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
      if (mine ? !it.owned : foundOnly && !it.found) return false;
      return (type === "all" || it.card.type === type) && (!q || searchIndex.get(it.key)!.includes(q));
    });
  }, [items, searchIndex, type, query, mine, foundOnly]);

  const rarityCount = useMemo(() => {
    const counts = Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>;
    for (const it of beforeRarity) counts[it.rarity]++;
    return counts;
  }, [beforeRarity]);

  const results = rarity ? beforeRarity.filter((it) => it.rarity === rarity) : beforeRarity;
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
    setArtOnly(false);
    setNotice(null);
    dialog.current?.showModal();
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

  // The opened card leans toward the pointer and catches the light of its gem.
  const tilt = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    const style = event.currentTarget.style;
    style.setProperty("--tilt-x", `${((0.5 - y) * 16).toFixed(2)}deg`);
    style.setProperty("--tilt-y", `${((x - 0.5) * 20).toFixed(2)}deg`);
    style.setProperty("--light-x", `${(x * 100).toFixed(1)}%`);
    style.setProperty("--light-y", `${(y * 100).toFixed(1)}%`);
  };
  const rest = (event: PointerEvent<HTMLElement>) => {
    for (const name of ["--tilt-x", "--tilt-y", "--light-x", "--light-y"]) event.currentTarget.style.removeProperty(name);
  };

  const wide = opened !== null && isWide(opened.card);

  // Where the opened card stands in the player's collection, and what they can do about it.
  const ownership = opened && state && !friend && (
    <div className="anvil__own">
      {opened.owned ? (
        <p>Dans ta collection{opened.by ? ` · découverte par ${opened.by}` : ""}</p>
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
                  className={`${cardClass(item.card)}${item.owned ? "" : " card--missing"}`}
                  data-rarity={item.rarity}
                  aria-label={`${cardLabel(item.card)}${item.owned ? "" : ", pas encore dans ta collection"}`}
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

      <dialog
        ref={dialog}
        className={`anvil${wide ? " anvil--wide" : ""}${artOnly ? " anvil--art-only" : ""}`}
        data-rarity={opened?.rarity}
        onClose={() => setOpened(null)}
        aria-labelledby="anvil-title"
      >
        {opened && wide && (
          <>
            {/* The whole artwork, uncropped. The text sits over its right edge and can be put away. */}
            <figure className="anvil__art" onPointerMove={tilt} onPointerLeave={rest}>
              <img src={thumb(opened.card.splash ?? opened.card.image, 1600)} alt="" />
              <span className="card__light" />
            </figure>
            <Gem rarity={opened.rarity} className="anvil__gem" />
            <div className="anvil__info">
              {opened.card.frames && (
                <div className={`${cardClass(opened.card)} anvil__mini`} data-rarity={opened.rarity}>
                  <CardFace card={opened.card} />
                </div>
              )}
              <CardInfo card={opened.card} />
              {ownership}
            </div>
            <button type="button" className="anvil__toggle" onClick={() => setArtOnly(!artOnly)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {!artOnly && <path d="m4 4 16 16" />}
              </svg>
              {artOnly ? "Afficher le texte" : "Masquer le texte"}
            </button>
          </>
        )}
        {opened && !wide && (
          <>
            <div className="anvil__stage" onPointerMove={tilt} onPointerLeave={rest}>
              <div className={cardClass(opened.card, { large: true })} data-rarity={opened.rarity}>
                <CardFace card={opened.card} large />
                <span className="card__light" />
              </div>
            </div>
            <div className="anvil__info">
              <CardInfo card={opened.card} />
              {ownership}
            </div>
          </>
        )}
        <form method="dialog">
          <button className="anvil__close" aria-label="Fermer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </form>
      </dialog>
    </>
  );
}
