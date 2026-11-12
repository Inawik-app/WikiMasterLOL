/* eslint-disable @next/next/no-img-element -- card art is hotlinked from Riot CDNs; next/image would spend Vercel's image quota */
import type { CSSProperties, ImgHTMLAttributes } from "react";
import { type Card, RARITY_LABEL } from "@/lib/card";
import { Gem } from "./Gem";

export type FaceCard = Pick<
  Card,
  "id" | "type" | "name" | "rarity" | "image" | "splash" | "subtitle" | "flavor" | "url" | "facts" | "frames" | "focus" | "icon" | "backdrop" | "dd"
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

// Riot’s copies on Data Dragon, for a champion or a skin, when CommunityDragon fails.
const DD = "https://ddragon.leagueoflegends.com/cdn/img/champion";
export const ddLoading = (card: FaceCard) => (card.dd ? `${DD}/loading/${card.dd}.jpg` : undefined);
export const ddSplash = (card: FaceCard) => (card.dd ? `${DD}/splash/${card.dd}.jpg` : undefined);

// A hotlinked image that does not leave a broken icon: when it fails it switches to `fallback`,
// and without one (or when that fails too) it hides. The ref catches the images that failed
// before the page came alive, when no error handler was listening yet.
export function Art({ fallback, ...props }: ImgHTMLAttributes<HTMLImageElement> & { fallback?: string }) {
  const recover = (img: HTMLImageElement) => {
    if (fallback && img.src !== fallback) img.src = fallback;
    else img.style.visibility = "hidden";
  };
  return (
    <img
      alt=""
      {...props}
      onError={(event) => recover(event.currentTarget)}
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0 && img.currentSrc) recover(img);
      }}
    />
  );
}

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
            {card.backdrop ? (
              <Art src={card.backdrop} loading="lazy" className="card__backdrop" />
            ) : (
              <Art src={src} fallback={ddLoading(card)} loading="lazy" className="card__blur" />
            )}
            <Art src={src} fallback={ddLoading(card)} loading="lazy" className="card__icon" />
          </>
        ) : isLandscape(card) ? (
          <>
            <Art src={src} fallback={ddLoading(card)} loading="lazy" className="card__blur" />
            <Art src={src} fallback={ddLoading(card)} loading="lazy" className="card__window" style={{ objectPosition: card.focus }} />
          </>
        ) : card.frames ? (
          // Special border and signature overlays are drawn for the uncropped loading-screen art.
          <>
            <Art src={src} fallback={ddLoading(card)} loading="lazy" className="card__blur" />
            <span className="card__portrait">
              <Art src={src} fallback={ddLoading(card)} loading="lazy" />
              {card.frames.map((frame) => (
                <Art key={frame} src={frame} loading="lazy" className="card__frame" />
              ))}
            </span>
          </>
        ) : (
          <Art src={src} fallback={ddLoading(card)} loading="lazy" className="card__full" />
        )}
      </span>
      {!locked && (
        <span className="card__plate">
          {/* An ability says whose it is: its name alone does not. */}
          {card.type === "ability" && card.subtitle && <small className="card__owner">{card.subtitle.split(" · ")[0]}</small>}
          {card.name}
        </span>
      )}
      <Gem rarity={card.rarity} className="card__gem" />
    </>
  );
}
