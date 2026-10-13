/* eslint-disable @next/next/no-img-element -- card art is hotlinked from Riot CDNs; next/image would spend Vercel's image quota */
import type { CSSProperties } from "react";
import { type Card, RARITY_LABEL } from "@/lib/card";
import { Gem } from "./Gem";

export type FaceCard = Pick<
  Card,
  "id" | "type" | "name" | "rarity" | "image" | "splash" | "subtitle" | "flavor" | "url" | "facts" | "frames" | "focus" | "icon"
>;

// What an owned card wears on top of its rarity: a rank (ranked skins) or the two colours of a chroma.
export type Look = { rank?: number; colors?: string[] };

// Attributes for the element that carries `cardClass`: the styles read them to draw the frame.
export const lookProps = (look?: Look) => ({
  "data-rank": look?.rank,
  "data-chroma": look?.colors ? "" : undefined,
  style: look?.colors
    ? ({ "--chroma-a": look.colors[0], "--chroma-b": look.colors[1] ?? look.colors[0] } as CSSProperties)
    : undefined,
});

const fromLor = (card: FaceCard) => card.image.includes("dd.b.pvp.net");

// These types only have a 64px icon: it is set in a socket instead of being stretched.
const ICON_TYPES = new Set(["ability", "summoner", "rune", "item"]);
const isIcon = (card: FaceCard) => card.icon || (ICON_TYPES.has(card.type) && !fromLor(card));

// Authored emblems (cards without official art) are already card-shaped.
const isEmblem = (card: FaceCard) => card.image.startsWith("/emblems/");

// Art that only exists in landscape: shown in a wide window rather than cropped to a sliver.
const LANDSCAPE_TYPES = new Set(["story", "video", "comic", "region", "song", "map", "mode"]);
const isLandscape = (card: FaceCard) => LANDSCAPE_TYPES.has(card.type) && !isEmblem(card);

// Cards whose full artwork is wide enough to deserve the whole dialog when opened.
export const isWide = (card: FaceCard) =>
  Boolean(card.splash) || isLandscape(card) || card.type === "character" || card.type === "place";

// The Universe CDN resizes on demand; the others do not.
export const thumb = (url: string, width: number) => (url.includes("cmsassets.rgpub.io") ? `${url}&w=${width}` : url);

export const cardLabel = (card: FaceCard, locked?: boolean) =>
  locked ? `Carte inconnue, ${RARITY_LABEL[card.rarity]}` : `${card.name}, ${RARITY_LABEL[card.rarity]}`;

export function cardClass(card: FaceCard, { locked, large }: { locked?: boolean; large?: boolean } = {}) {
  return [
    "card",
    locked && "card--locked",
    large && "card--large",
    !locked && isLandscape(card) && "card--landscape",
    !locked && card.frames && "card--framed",
  ]
    .filter(Boolean)
    .join(" ");
}

// The inside of a card. The wrapper (button in the grid, div on the anvil) carries
// `cardClass` and `data-rarity`.
export function CardFace({ card, locked, large }: { card: FaceCard; locked?: boolean; large?: boolean }) {
  const src = thumb(card.image, large ? 900 : 480);
  return (
    <>
      <span className="card__art">
        {locked ? (
          <Gem rarity={card.rarity} className="card__sigil" />
        ) : isIcon(card) ? (
          <>
            <img src={src} alt="" loading="lazy" className="card__blur" />
            <img src={src} alt="" loading="lazy" className="card__icon" />
          </>
        ) : isLandscape(card) ? (
          <>
            <img src={src} alt="" loading="lazy" className="card__blur" />
            <img src={src} alt="" loading="lazy" className="card__window" style={{ objectPosition: card.focus }} />
          </>
        ) : card.frames ? (
          // Special border and signature overlays are drawn for the uncropped loading-screen art.
          <>
            <img src={src} alt="" loading="lazy" className="card__blur" />
            <span className="card__portrait">
              <img src={src} alt="" loading="lazy" />
              {card.frames.map((frame) => (
                <img key={frame} src={frame} alt="" loading="lazy" className="card__frame" />
              ))}
            </span>
          </>
        ) : (
          <img src={src} alt="" loading="lazy" className="card__full" />
        )}
      </span>
      {!locked && <span className="card__plate">{card.name}</span>}
      <Gem rarity={card.rarity} className="card__gem" />
    </>
  );
}
