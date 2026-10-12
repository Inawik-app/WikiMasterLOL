// Ordered from most common to rarest.
export const RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "ultimate",
  "transcendent",
] as const;

export type Rarity = (typeof RARITIES)[number];

export type CardType =
  | "champion"
  | "skin"
  | "ability"
  | "summoner"
  | "rune"
  | "item"
  | "region"
  | "character"
  | "place"
  | "spell"
  | "story"
  | "video"
  | "comic";

export type Chroma = { id: number; name: string; colors: string[] };

export type Card = {
  id: string;
  type: CardType;
  name: string;
  rarity: Rarity;
  image: string;
  splash?: string;
  subtitle?: string;
  region?: string;
  flavor?: string;
  url?: string;
  // Label and value pairs shown when the card is opened (cooldown, price...).
  facts?: [string, string][];
  // Overlays drawn over the art: special borders, pro player signatures.
  frames?: string[];
  // CSS object-position for art that must be cropped.
  focus?: string;
  chromas?: Chroma[];
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
  mythic: "Mythique",
  ultimate: "Ultime",
  transcendent: "Transcendant",
};

export const TYPE_LABEL: Record<CardType, string> = {
  champion: "Champions",
  skin: "Skins",
  ability: "Compétences",
  summoner: "Sorts d'invocateur",
  rune: "Runes",
  item: "Objets",
  region: "Régions",
  character: "Personnages",
  place: "Lieux",
  spell: "Sorts",
  story: "Récits",
  video: "Vidéos",
  comic: "Bandes dessinées",
};
