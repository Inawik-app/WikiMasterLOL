"use client";

import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { type CardType, RARITY_LABEL, SOURCE_LABEL, TYPE_LABEL, TYPE_SOURCE } from "@/lib/card";
import { Art, CardFace, cardClass, ddSplash, type FaceCard, isWide, type Look, lookProps, thumb } from "./CardFace";
import { Gem } from "./Gem";

const LINK_LABEL: Partial<Record<CardType, string>> = {
  story: "Lire le récit",
  video: "Regarder la vidéo",
  comic: "Lire la bande dessinée",
  region: "Explorer la région",
  song: "Écouter sur YouTube",
  person: "Voir sur Leaguepedia",
};

const NARRATIVE_TYPES = new Set<CardType>(["story", "video", "comic"]);

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
        <span>
          {/* Teamfight Tactics is both the game and the only type it has. */}
          {card.type === "tft" ? TYPE_LABEL.tft : `${SOURCE_LABEL[TYPE_SOURCE[card.type]]} · ${TYPE_LABEL[card.type]}`}
        </span>
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

// The card opened in large: the whole artwork with its text. `children` go under the text
// (what the player can do with the card). Needs <GemDefs /> somewhere on the page.
export function CardDialog({
  card,
  look,
  onClose,
  children,
}: {
  card: FaceCard | null;
  look?: Look;
  onClose: () => void;
  children?: ReactNode;
}) {
  const [artOnly, setArtOnly] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (card && !dialog.current?.open) dialog.current?.showModal();
  }, [card]);

  const close = () => {
    setArtOnly(false);
    onClose();
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

  const wide = card !== null && isWide(card);

  return (
    <dialog
      ref={dialog}
      className={`anvil${wide ? " anvil--wide" : ""}${artOnly ? " anvil--art-only" : ""}`}
      data-rarity={card?.rarity}
      {...lookProps(look)}
      onClose={close}
      aria-labelledby="anvil-title"
    >
      {card && wide && (
        <>
          {/* The whole artwork, uncropped. The text sits over its right edge and can be put away. */}
          <figure
              className="anvil__art"
              style={card.splash ? { aspectRatio: "1215 / 717" } : undefined}
              onPointerMove={tilt}
              onPointerLeave={rest}
            >
            {/* Riot’s copy of the splash first (same artwork, much faster), CommunityDragon’s as fallback. */}
            <Art
              src={ddSplash(card) ?? thumb(card.splash ?? card.image, 1600)}
              fallback={card.dd ? (card.splash ?? card.image) : undefined}
            />
            <span className="card__light" />
          </figure>
          <Gem rarity={card.rarity} className="anvil__gem" />
          <div className="anvil__info">
            {card.frames && (
              <div className={`${cardClass(card)} anvil__mini`} data-rarity={card.rarity} {...lookProps(look)}>
                <CardFace card={card} />
              </div>
            )}
            <CardInfo card={card} />
            {children}
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
      {card && !wide && (
        <>
          <div className="anvil__stage" onPointerMove={tilt} onPointerLeave={rest}>
            <div className={cardClass(card, { large: true })} data-rarity={card.rarity} {...lookProps(look)}>
              <CardFace card={card} large />
              <span className="card__light" />
            </div>
          </div>
          <div className="anvil__info">
            <CardInfo card={card} />
            {children}
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
  );
}
