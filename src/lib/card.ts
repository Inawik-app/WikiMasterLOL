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
  | "comic"
  | "team"
  | "player"
  | "competition"
  | "person"
  | "creator"
  | "song"
  | "tft"
  | "server"
  | "lane"
  | "monster"
  | "map"
  | "mode"
  | "account";

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
  // The image is a small icon or a logo: set in a socket instead of filling the card.
  icon?: boolean;
  // Art shown behind an icon, instead of a blurred wash of the icon itself.
  backdrop?: string;
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
  team: "Équipes",
  player: "Joueurs",
  competition: "Compétitions",
  person: "Personnalités",
  account: "Invocateurs",
  creator: "Créateurs",
  song: "Musiques",
  tft: "Teamfight Tactics",
  server: "Serveurs",
  lane: "Voies",
  monster: "Monstres",
  map: "Cartes de jeu",
  mode: "Modes de jeu",
};

// The game or the place a card comes from. It follows from the type of the card.
export const SOURCES = ["lol", "universe", "lor", "tft", "esport", "community"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABEL: Record<Source, string> = {
  lol: "League of Legends",
  universe: "Univers de Runeterra",
  lor: "Legends of Runeterra",
  tft: "Teamfight Tactics",
  esport: "E-sport",
  community: "Communauté",
};

export const TYPE_SOURCE: Record<CardType, Source> = {
  champion: "lol",
  skin: "lol",
  ability: "lol",
  summoner: "lol",
  rune: "lol",
  item: "lol",
  monster: "lol",
  map: "lol",
  mode: "lol",
  lane: "lol",
  server: "lol",
  region: "universe",
  story: "universe",
  video: "universe",
  comic: "universe",
  character: "lor",
  place: "lor",
  spell: "lor",
  tft: "tft",
  team: "esport",
  player: "esport",
  competition: "esport",
  song: "esport",
  person: "community",
  account: "community",
  creator: "community",
};
