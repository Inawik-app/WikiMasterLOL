"use client";

/* eslint-disable @next/next/no-img-element -- hotlinked Riot art, see CardFace */
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { type CardType, RARITIES, RARITY_LABEL, type Rarity, TYPE_LABEL } from "@/lib/card";
import { CardFace, cardClass, cardLabel, type FaceCard, isWide, thumb } from "./CardFace";
import { Gem, GemDefs } from "./Gem";

const PAGE = 60;
const TYPES = Object.keys(TYPE_LABEL) as CardType[];
const LINK_LABEL: Partial<Record<CardType, string>> = {
  story: "Lire le récit",
  video: "Regarder la vidéo",
  comic: "Lire la bande dessinée",
  region: "Explorer la région",
};

const NARRATIVE_TYPES = new Set<CardType>(["story", "video", "comic"]);

// Lowercase and strip accents, so "ecu" finds "Écu".
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const count = new Intl.NumberFormat("fr-FR");

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

export function Catalogue({ cards }: { cards: FaceCard[] }) {
  const [type, setType] = useState<CardType | "all">("all");
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [query, setQuery] = useState("");
  const [mystery, setMystery] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [opened, setOpened] = useState<FaceCard | null>(null);
  const [artOnly, setArtOnly] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const searchIndex = useMemo(() => cards.map((c) => fold(`${c.name} ${c.subtitle ?? ""}`)), [cards]);

  // Rarity counts follow the type and search filters, so the rack shows the pyramid of what is on screen.
  const byTypeAndQuery = useMemo(() => {
    const q = fold(query.trim());
    return cards.filter((c, i) => (type === "all" || c.type === type) && (!q || searchIndex[i].includes(q)));
  }, [cards, searchIndex, type, query]);

  const rarityCount = useMemo(() => {
    const counts = Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>;
    for (const c of byTypeAndQuery) counts[c.rarity]++;
    return counts;
  }, [byTypeAndQuery]);

  const results = rarity ? byTypeAndQuery.filter((c) => c.rarity === rarity) : byTypeAndQuery;
  const shown = results.slice(0, limit);

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

  const open = (card: FaceCard) => {
    setOpened(card);
    setArtOnly(false);
    dialog.current?.showModal();
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

  const wide = opened !== null && isWide(opened);

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
        </p>
        <button type="button" className="switch" aria-pressed={mystery} onClick={() => setMystery(!mystery)}>
          <span className="switch__track" aria-hidden="true" />
          Aperçu mystère
        </button>
      </div>

      {results.length ? (
        <ul className="grid-cards">
          {shown.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                className={cardClass(card, { locked: mystery })}
                data-rarity={card.rarity}
                aria-label={cardLabel(card, mystery)}
                disabled={mystery}
                onClick={() => open(card)}
              >
                <CardFace card={card} locked={mystery} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">
          Aucune carte ne sort de la forge avec ces réglages. Retire un filtre ou essaie un autre nom.
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
              <img src={thumb(opened.splash ?? opened.image, 1600)} alt="" />
              <span className="card__light" />
            </figure>
            <Gem rarity={opened.rarity} className="anvil__gem" />
            <div className="anvil__info">
              {opened.frames && (
                <div className={`${cardClass(opened)} anvil__mini`} data-rarity={opened.rarity}>
                  <CardFace card={opened} />
                </div>
              )}
              <CardInfo card={opened} />
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
              <div className={cardClass(opened, { large: true })} data-rarity={opened.rarity}>
                <CardFace card={opened} large />
                <span className="card__light" />
              </div>
            </div>
            <div className="anvil__info">
              <CardInfo card={opened} />
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
