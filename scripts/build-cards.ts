// Builds src/data/cards.json from Riot and community JSON sources.
// Run with `npm run cards`. All rarity rules live in this file.
import { mkdir, writeFile } from "node:fs/promises";
import { RARITIES, type Card, type CardType, type Rarity } from "../src/lib/card.ts";
import {
  ALL_TIME_GREATS,
  CASTERS,
  CREATORS,
  DEVELOPERS,
  GREATEST_PLAYER,
  LANES,
  LEGENDS,
  MAPS,
  MODES,
  MONSTERS,
  SERVERS,
  SONGS,
  STARS,
  type Handmade,
  type Person,
} from "./handmade.ts";

const DDRAGON = "https://ddragon.leagueoflegends.com";
const CDRAGON = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global";
const MERAKI = "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US";
const UNIVERSE = "https://universe-meeps.leagueoflegends.com/v1/fr_fr";
const LOR = "https://dd.b.pvp.net/latest";

// --- Rarity rules -----------------------------------------------------------

// A skin earns points from three sources; the total picks its rarity (0 = common ... 5 = mythic).
const RIOT_TIER_POINTS: Record<string, number> = { kRare: 1, kEpic: 1, kLegendary: 3, kMythic: 4 };
// How hard the skin is to get today.
const AVAILABILITY_POINTS: Record<string, number> = { Available: 0, Upcoming: 0, Legacy: 1, Rare: 2, Limited: 3 };
// Older skins are rarer.
const agePoints = (year: number) => (!year ? 0 : year <= 2010 ? 3 : year <= 2015 ? 2 : year <= 2020 ? 1 : 0);

// Riot's own top tiers stay on top whatever their age or availability.
const TOP_TIER: Record<string, Rarity> = { kUltimate: "ultimate", kExalted: "transcendent", kTranscendent: "transcendent" };

// Skins famous for being nearly unobtainable. Hand-picked: no data source says "iconic".
const ICONIC_SKINS = new Set([
  12001, // Black Alistar
  10001, // Silver Kayle
  10005, // Judgment Kayle
  13001, // Young Ryze
  13004, // Triumphant Ryze
  33001, // King Rammus
  42001, // UFO Corki
  4001, // PAX Twisted Fate
  24004, // PAX Jax
  15005, // PAX Sivir
  53001, // Rusty Blitzcrank
  19002, // Urf the Manatee Warwick
  27001, // Riot Squad Singed
  92004, // Championship Riven (2012)
]);


export function skinRarity(id: number, riotTier: string, meta?: { availability?: string; release?: string }): Rarity {
  if (ICONIC_SKINS.has(id)) return "ultimate";
  if (TOP_TIER[riotTier]) return TOP_TIER[riotTier];
  const year = Number(meta?.release?.slice(0, 4)) || 0;
  const points =
    (RIOT_TIER_POINTS[riotTier] ?? 0) + (AVAILABILITY_POINTS[meta?.availability ?? ""] ?? 0) + agePoints(year);
  // Mythic is reserved for Riot's mythic skins and for skins that can never be obtained again.
  const cap: Rarity = riotTier === "kMythic" || meta?.availability === "Limited" ? "mythic" : "legendary";
  return RARITIES[Math.min(points, RARITIES.indexOf(cap))];
}

// rank 0 = most picked champion. The more picked, the rarer.
export function championRarity(rank: number, total: number): Rarity {
  const share = rank / total;
  return share < 0.15 ? "rare" : share < 0.5 ? "uncommon" : "common";
}

// Legends of Runeterra cards. "None" = tokens and skills that cannot be collected in LoR.
// LoR epics are notable characters and places; an epic spell is only a strong spell, so one step lower.
const LOR_RARITY: Record<string, Rarity> = { None: "common", Common: "common", Rare: "uncommon", Epic: "epic" };
const lorRarity = (ref: string, type: CardType): Rarity =>
  ref === "Epic" && type === "spell" ? "rare" : (LOR_RARITY[ref] ?? "common");
const LOR_TYPE: Record<string, CardType> = {
  Unité: "character",
  Site: "place",
  Équipement: "item",
  Sort: "spell",
  Compétence: "spell",
  Piège: "spell",
};

const REGION_RARITY: Rarity = "legendary";
// Flash stands apart: the one spell every player takes.
const summonerSpellRarity = (id: string): Rarity => (id === "SummonerFlash" ? "transcendent" : "epic");
const abilityRarity = (slot: string): Rarity => (slot === "R" ? "uncommon" : "common");
const runeRarity = (isKeystone: boolean): Rarity => (isKeystone ? "rare" : "uncommon");
// Stories: the longer the read, the rarer.
const storyRarity = (words: number): Rarity => (words >= 5000 ? "legendary" : words >= 1500 ? "epic" : "rare");
// Videos: cinematics on top, then animated shorts and music videos, then login screens and making-ofs.
const VIDEO_RARITY: Record<string, Rarity> = { cinematic: "legendary", animation: "epic", "music-video": "epic" };
const COMIC_RARITY: Rarity = "legendary";
const itemRarity = (gold: number): Rarity => (gold >= 2800 ? "rare" : gold >= 1000 ? "uncommon" : "common");

// --- Build ------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped third-party JSON */
async function getJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const cdragonAsset = (path: string) => `${CDRAGON}/default/${path.replace("/lol-game-data/assets/", "").toLowerCase()}`;

// --- Text cleaning ----------------------------------------------------------

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", hellip: "…", mdash: "—", ndash: "–",
  laquo: "«", raquo: "»", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", oelig: "œ", OElig: "Œ",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â", ccedil: "ç", icirc: "î", iuml: "ï",
  ocirc: "ô", ugrave: "ù", ucirc: "û", Eacute: "É", Egrave: "È", Agrave: "À", Ccedil: "Ç",
};

// Turns "&nbsp;", "&#233;" and friends back into characters.
export function decodeEntities(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&(\w+);/g, (whole, name) => ENTITIES[name] ?? whole);
}

// --- Hand-made, esports and TFT cards ---------------------------------------

const LOLESPORTS = "https://esports-api.lolesports.com/persisted/gw";
// Not a secret: lolesports.com sends this key to every visitor's browser.
const LOLESPORTS_KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";
const LEAGUEPEDIA = "https://lol.fandom.com";
// Regions arrive in capitals ("CORÉE"); only the acronym stays that way.
const regionLabel = (region: string) => (region === "EMEA" ? region : sentenceCase(region));

const cdragonFile = (path: string) => `https://raw.communitydragon.org/latest/${path}`;
const secure = (url: string) => url.replace("http://", "https://");
const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

// Cards without official art get an authored emblem: a few letters struck on a forge plate.
// The SVG files are written to public/emblems/ at the end of the build.
const emblems = new Map<string, string>();
function emblem(slug: string, mark: string) {
  const size = mark.length <= 2 ? 250 : mark.length === 3 ? 190 : mark.length === 4 ? 150 : 110;
  const safe = mark.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  emblems.set(
    `${slug}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 840">
<defs><radialGradient id="g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#1c3c45"/><stop offset="1" stop-color="#050f12"/></radialGradient></defs>
<rect width="600" height="840" fill="url(#g)"/>
<rect x="24" y="24" width="552" height="792" fill="none" stroke="#86713f" stroke-width="3"/>
<rect x="38" y="38" width="524" height="764" fill="none" stroke="#86713f" stroke-width="1"/>
<polygon points="300,130 500,245 500,475 300,590 100,475 100,245" fill="#0a1b20" stroke="#c9a55c" stroke-width="5"/>
<polygon points="300,160 474,260 474,460 300,560 126,460 126,260" fill="none" stroke="#86713f" stroke-width="2"/>
<text x="300" y="360" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" letter-spacing="4" fill="#c9a55c">${safe}</text>
</svg>
`,
  );
  return `/emblems/${slug}.svg`;
}

function handmadeCards(type: CardType, list: Handmade[], icon = false): Card[] {
  return list.map((h) => ({
    id: `${type}:${h.slug}`,
    type,
    name: h.name,
    subtitle: h.subtitle,
    rarity: h.rarity,
    image: h.image ? cdragonFile(h.image) : emblem(`${type}-${h.slug}`, h.mark ?? h.name.slice(0, 2)),
    flavor: h.flavor,
    icon: (icon && Boolean(h.image)) || undefined,
  }));
}

// Esports: rarity follows the level of the league a team plays in.
const INTERNATIONAL_EVENTS = new Set(["worlds", "msi", "first_stand", "ewc_lol"]);
const MAJOR_LEAGUE_SLUGS = new Set(["lck", "lpl", "lec", "lcs", "lcp", "lta_n", "lta_s", "cblol-brazil"]);
const MAJOR_LEAGUES = new Set(["LCK", "LPL", "LEC", "LCS", "LCP", "CBLOL", "LTA North", "LTA South", "Mondial", "MSI"]);
const SECOND_TIER_LEAGUES = new Set([
  "La Ligue Française", "Prime League", "LES", "NLC", "TCL", "LJL", "VCS", "PCS", "LLA", "LCO",
  "LCK Challengers", "NACL", "EMEA Masters", "LCL", "Circuito Desafiante",
]);
// World champions, hand-listed: the API has no titles. T1 stands alone above them.
const WORLD_CHAMPIONS = /^(SK Telecom T1( K)?|Fnatic|Taipei Assassins|Samsung White|Samsung Galaxy|Gen\.G Esports|Invictus Gaming|FunPlus Phoenix|Dplus KIA|EDWARD GAMING|DRX)$/i;
const MOST_TITLED = /^T1$/i;
const ROLE_LABEL: Record<string, string> = { top: "haut", jungle: "jungle", mid: "milieu", bottom: "bas", support: "support" };

export function teamRarity(name: string, league: string): Rarity {
  if (MOST_TITLED.test(name)) return "transcendent";
  if (WORLD_CHAMPIONS.test(name)) return "ultimate";
  return MAJOR_LEAGUES.has(league) ? "epic" : SECOND_TIER_LEAGUES.has(league) ? "rare" : "uncommon";
}

// Players: the level of their league, unless their name is on one of the hand-picked lists.
// The lists do not apply in the smallest leagues, where a famous nickname is usually a namesake.
const leagueLevel = (league: string) => (MAJOR_LEAGUES.has(league) ? 2 : SECOND_TIER_LEAGUES.has(league) ? 1 : 0);
const handPicked = new Map<string, Rarity>([
  ...LEGENDS.map((l): [string, Rarity] => [l.handle.toLowerCase(), l.rarity]),
  ...STARS.map((n): [string, Rarity] => [n.toLowerCase(), "mythic"]),
  ...ALL_TIME_GREATS.map((n): [string, Rarity] => [n.toLowerCase(), "ultimate"]),
  [GREATEST_PLAYER.toLowerCase(), "transcendent"],
]);
export function playerRarity(name: string, league: string): Rarity {
  const level = leagueLevel(league);
  const picked = handPicked.get(name.toLowerCase());
  if (picked && level > 0) return picked;
  return level === 2 ? "rare" : level === 1 ? "uncommon" : "common";
}

async function esportsCards(): Promise<Card[]> {
  const options = { headers: { "x-api-key": LOLESPORTS_KEY } };
  const [leagues, teams] = await Promise.all([
    fetch(`${LOLESPORTS}/getLeagues?hl=fr-FR`, options).then((r) => r.json()),
    fetch(`${LOLESPORTS}/getTeams?hl=fr-FR`, options).then((r) => r.json()),
  ]);
  const cards: Card[] = leagues.data.leagues.map((l: any) => ({
    id: `competition:${l.slug}`,
    type: "competition",
    name: l.name,
    subtitle: regionLabel(l.region),
    rarity:
      l.slug === "worlds"
        ? "transcendent"
        : INTERNATIONAL_EVENTS.has(l.slug)
          ? "mythic"
          : MAJOR_LEAGUE_SLUGS.has(l.slug)
            ? "legendary"
            : "rare",
    image: secure(l.image),
    icon: true,
  }));
  const seen = new Set<string>();
  const rosters = new Map<string, any>();
  for (const t of teams.data.teams) {
    if (t.status !== "active" || !t.homeLeague || !t.image) continue;
    // A player listed on several rosters keeps the one in the highest league.
    for (const p of t.players ?? []) {
      const known = rosters.get(p.id);
      if (!known || leagueLevel(t.homeLeague.name) > leagueLevel(known.team.homeLeague.name)) rosters.set(p.id, { ...p, team: t });
    }
    if (seen.has(t.name)) continue;
    seen.add(t.name);
    const players = (t.players ?? []).map((p: any) => `${p.summonerName} (${ROLE_LABEL[p.role] ?? p.role})`);
    cards.push({
      id: `team:${t.slug}`,
      type: "team",
      name: t.name,
      subtitle: `${t.homeLeague.name} · ${regionLabel(t.homeLeague.region)}`,
      rarity: teamRarity(t.name, t.homeLeague.name),
      image: secure(t.image),
      icon: true,
      facts: [["Sigle", t.code], ...(players.length ? [["Joueurs", players.join(", ")]] : [])] as [string, string][],
    });
  }
  const names = new Map<string, number>(); // name -> level of the league
  for (const p of rosters.values()) {
    // Players without a real photo all share one grey silhouette: not worth a card.
    const key = p.summonerName.toLowerCase();
    if (!p.image || /default|silhouette|placeholder/i.test(p.image) || names.has(key)) continue;
    names.set(key, leagueLevel(p.team.homeLeague.name));
    cards.push({
      id: `player:${p.id}`,
      type: "player",
      name: p.summonerName,
      subtitle: `${p.firstName} ${p.lastName} · ${p.team.name}`.trim(),
      rarity: playerRarity(p.summonerName, p.team.homeLeague.name),
      image: secure(p.image),
      facts: [
        ["Poste", sentenceCase(ROLE_LABEL[p.role] ?? p.role)],
        ["Équipe", p.team.name],
        ["Ligue", `${p.team.homeLeague.name} · ${regionLabel(p.team.homeLeague.region)}`],
      ],
    });
  }
  for (const legend of LEGENDS) {
    // Still on a roster of a known league: the card with the photo wins. A namesake in a small
    // league does not count.
    if ((names.get(legend.handle.toLowerCase()) ?? 0) > 0) continue;
    cards.push({
      id: `player:legend-${legend.handle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      type: "player",
      name: legend.handle,
      subtitle: "Légende de la scène",
      rarity: legend.rarity,
      image: emblem(`player-${legend.handle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, legend.handle.slice(0, 2).toUpperCase()),
      facts: [["Poste", sentenceCase(legend.role)]],
    });
  }
  return cards;
}

// Teamfight Tactics. Rarity follows the gold cost of a unit.
const TFT_COST_RARITY: Rarity[] = ["common", "common", "common", "uncommon", "rare", "epic", "legendary"];
const tftImage = (path: string) => cdragonFile(`game/${path.toLowerCase().replace(/\.(tex|dds)$/, ".png")}`);
const tftSetLabel = (key: string, name: string) => (/^Set\d+$/.test(name) ? `Set ${name.slice(3)}` : `Set ${key} · ${name}`);

async function tftCards(): Promise<Card[]> {
  const data = await getJson(cdragonFile("cdragon/tft/fr_fr.json"));
  const cards: Card[] = [];
  for (const [key, set] of Object.entries<any>(data.sets)) {
    if (set.name.startsWith("Tutorial")) continue;
    const label = tftSetLabel(key, set.name);
    const seen = new Set<string>();
    const usedTraits = new Set<string>();
    for (const c of set.champions) {
      if (!c.traits.length || c.cost < 1 || c.cost > 6 || !c.icon || seen.has(c.name)) continue;
      seen.add(c.name);
      for (const trait of c.traits) usedTraits.add(trait);
      cards.push({
        id: `tft:${key}:${c.apiName}`,
        type: "tft",
        name: c.name,
        subtitle: `Unité · ${label} · coût ${c.cost}`,
        rarity: TFT_COST_RARITY[c.cost],
        // The square tile is framed on the unit; the full splash is kept for the opened card.
        image: tftImage(c.squareIcon ?? c.icon),
        splash: tftImage(c.icon),
        facts: [["Traits", c.traits.join(", ")]],
      });
    }
    for (const t of set.traits) {
      if (!usedTraits.has(t.name) || !t.icon) continue;
      usedTraits.delete(t.name);
      // Keep the opening sentence only: the rest is per-level numbers full of placeholders.
      const intro = stripHtml(t.desc?.split(/<br>|<row>|<expandRow>/)[0]);
      cards.push({
        id: `tft:${key}:trait:${t.apiName}`,
        type: "tft",
        name: t.name,
        subtitle: `Trait · ${label}`,
        rarity: "uncommon",
        image: tftImage(t.icon),
        icon: true,
        flavor: intro && !/[@%]/.test(intro) ? intro : undefined,
      });
    }
  }
  // Core items: the components and what they combine into. The rest of the list is loot and set gimmicks.
  const byApi = new Map<string, any>(data.items.map((i: any) => [i.apiName, i]));
  const completed = data.items.filter((i: any) => /^TFT_Item_/.test(i.apiName) && i.composition?.length === 2 && i.name && i.icon);
  const components = new Set<string>(completed.flatMap((i: any) => i.composition));
  const seenItems = new Set<string>();
  for (const i of [...[...components].map((api) => byApi.get(api)).filter(Boolean), ...completed]) {
    if (seenItems.has(i.name) || i.name.includes("@")) continue;
    seenItems.add(i.name);
    const recipe = (i.composition ?? []).map((api: string) => byApi.get(api)?.name).filter(Boolean);
    cards.push({
      id: `tft:item:${i.apiName}`,
      type: "tft",
      name: i.name,
      subtitle: recipe.length ? "Objet · TFT" : "Composant · TFT",
      rarity: recipe.length ? "uncommon" : "common",
      image: tftImage(i.icon),
      icon: true,
      facts: recipe.length ? [["Recette", recipe.join(" + ")]] : undefined,
    });
  }
  return cards;
}

// Worlds anthems: the more views, the rarer.
export const songRarity = (views: number): Rarity =>
  views >= 400e6 ? "transcendent" : views >= 300e6 ? "ultimate" : views >= 100e6 ? "legendary" : views >= 30e6 ? "epic" : "rare";

async function songCards(): Promise<Card[]> {
  const today = new Date().toLocaleDateString("fr-FR");
  return Promise.all(
    SONGS.map(async (song): Promise<Card> => {
      // The view count is only in the page itself; the cookie skips the consent screen.
      const page = await fetch(`https://www.youtube.com/watch?v=${song.video}&hl=en`, {
        headers: { cookie: "CONSENT=YES+cb; SOCS=CAI", "accept-language": "en" },
      })
        .then((r) => r.text())
        .catch(() => "");
      const views = Number(page.match(/"viewCount":"(\d+)"/)?.[1] ?? 0);
      return {
        id: `song:${song.video}`,
        type: "song",
        name: song.name,
        subtitle: `Hymne des Worlds ${song.year} · ${song.artist}`,
        rarity: views ? songRarity(views) : "rare",
        image: `https://i.ytimg.com/vi/${song.video}/maxresdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${song.video}`,
        facts: views ? [["Vues sur YouTube", `${gold.format(views)} (au ${today})`]] : undefined,
      };
    }),
  );
}

// People: an emblem with their initials, never a photo. The only source of pictures refuses
// hotlinking, and a real person's face should not go on a card unchecked.
function peopleCards(): Card[] {
  const card = (p: Person, name: string, subtitle: string): Card => ({
    id: `person:${p.handle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    type: "person",
    name,
    subtitle,
    rarity: p.rarity,
    image: emblem(`person-${p.handle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, p.handle.slice(0, 2).toUpperCase()),
    flavor: p.flavor,
    url: p.page ? `${LEAGUEPEDIA}/wiki/${encodeURIComponent(p.page)}` : undefined,
  });
  return [
    ...DEVELOPERS.map((p) => card(p, p.name ?? p.handle, `« ${p.handle} » · ${p.role}`)),
    ...CASTERS.map((p) => card(p, p.handle, p.name ? `${p.name} · ${p.role}` : p.role)),
  ];
}

function creatorCards(): Card[] {
  return CREATORS.map((c) => {
    const slug = c.handle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      id: `creator:${slug}`,
      type: "creator",
      name: c.handle,
      subtitle: c.role,
      rarity: c.rarity,
      image: emblem(`creator-${slug}`, c.handle.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()),
      flavor: c.flavor,
    };
  });
}

// Game mode art: each mode folder names its background differently, so look inside.
const MODE_ASSETS = "plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets";
const MODE_ART = [/^gameflow-background(?!-dark).*\.(jpg|png)$/, /^parties-background.*\.jpg$/, /^gameflow-background/, /^champ-select-flyout-background/];
async function withModeArt(list: Handmade[]): Promise<Handmade[]> {
  return Promise.all(
    list.map(async (h) => {
      if (!h.modeArt) return h;
      const files: string[] = await getJson(`https://raw.communitydragon.org/json/latest/${MODE_ASSETS}/${h.modeArt}/img/`)
        .then((entries) => entries.map((e: any) => e.name))
        .catch(() => []);
      const art = MODE_ART.map((pattern) => files.find((f) => pattern.test(f))).find(Boolean);
      return art ? { ...h, image: `${MODE_ASSETS}/${h.modeArt}/img/${art}` } : h;
    }),
  );
}

// Remote images are not all still there: a card whose image is gone falls back to an emblem,
// or is dropped when it has nothing to draw one from.
async function withLiveImages(cards: Card[]): Promise<Card[]> {
  const alive: Card[] = [];
  for (let i = 0; i < cards.length; i += 30) {
    const batch = cards.slice(i, i + 30);
    const live = (url: string) => fetch(url, { method: "HEAD" }).then((r) => r.ok, () => false);
    const ok = await Promise.all(batch.map((c) => (c.image.startsWith("/") ? true : live(c.image))));
    // A missing splash only costs the wide view: keep the card, drop the splash.
    await Promise.all(batch.map(async (c) => c.splash && !(await live(c.splash)) && delete c.splash));
    batch.forEach((card, n) => {
      if (ok[n]) alive.push(card);
      else if (card.type === "team") alive.push({ ...card, icon: undefined, image: emblem(card.id.replace(":", "-"), card.facts?.[0]?.[1] ?? "?") });
      else console.warn(`dropped, image gone: ${card.id}`);
    });
  }
  return alive;
}

async function lorCards(): Promise<any[]> {
  const globals = await getJson(`${LOR}/core/fr_fr/data/globals-fr_fr.json`);
  const sets = await Promise.all(
    globals.sets.map((s: any) => {
      const ref = s.nameRef.toLowerCase();
      // Some listed sets (events) have no data file: skip them.
      return getJson(`${LOR}/${ref}/fr_fr/data/${ref}-fr_fr.json`).catch(() => []);
    }),
  );
  return sets.flat();
}

// The Universe site has no full index: its content is listed in "modules" spread over the
// explore page and every champion and faction page. Crawl them all and merge by slug.
async function universeModules(factions: any): Promise<any[]> {
  const champions = await getJson(`${UNIVERSE}/champion-browse/index.json`);
  const pages: { path: string; champion?: string }[] = [
    { path: "explore2" },
    ...champions.champions.map((c: any) => ({ path: `champions/${c.slug}`, champion: c.name })),
    ...factions.factions.map((f: any) => ({ path: `factions/${f.slug}` })),
  ];
  const modules = new Map<string, any>();
  for (let i = 0; i < pages.length; i += 20) {
    const slice = pages.slice(i, i + 20);
    const batch = await Promise.all(slice.map((p) => getJson(`${UNIVERSE}/${p.path}/index.json`)));
    batch.forEach((page, n) => {
      for (const m of page.modules ?? []) {
        const key = `${m.type}:${m["story-slug"] ?? m.slug}`;
        // A story listed on several champion pages involves all of them.
        const entry = modules.get(key) ?? { ...m, champions: new Set<string>() };
        for (const c of m["featured-champions"] ?? []) entry.champions.add(c.name);
        if (slice[n].champion) entry.champions.add(slice[n].champion);
        modules.set(key, entry);
      }
    });
  }
  // The length of a story is only on its own page.
  const all = [...modules.values()];
  const stories = all.filter((m) => m.type === "story-preview");
  for (let i = 0; i < stories.length; i += 20) {
    await Promise.all(
      stories.slice(i, i + 20).map(async (m) => {
        const page = await getJson(`${UNIVERSE}/story/${m["story-slug"]}/index.json`).catch(() => ({}));
        m.words = page["word-count"] ?? 0;
      }),
    );
  }
  return all;
}

const itemStats = (html: string) => stripHtml(html.match(/<stats>([\s\S]*?)<\/stats>/)?.[1]);
const SLOT_LABEL: Record<string, string> = { P: "Passif", Q: "Compétence Q", W: "Compétence W", E: "Compétence E", R: "Ultime" };
const gold = new Intl.NumberFormat("fr-FR");

// Special loading-screen borders (event frames, pro player signatures): one overlay per layer,
// the highest tier of each. Ranked borders depend on the player's rank, not on the skin: skipped.
function skinFrames(augments: any): string[] | undefined {
  const frames = Object.values<any>(augments?.borders ?? {})
    .map((layer) => [...layer].sort((a, b) => b.priority - a.priority)[0]?.borderPath)
    .filter((path) => path && !path.includes("/Rewards/Ranked/"))
    .map(cdragonAsset);
  return frames.length ? frames : undefined;
}

// Universe images carry a focal point; only its horizontal part is reliable.
function focusOf(image: any) {
  // The width is often missing from the data but always present in the file name ("-1920x798.jpg").
  const width = image?.width ?? Number(image?.uri?.match(/-(\d+)x\d+\.\w+/)?.[1]);
  return width && image.x != null ? `${Math.min(100, Math.round((image.x / width) * 100))}% 50%` : undefined;
}

function stripHtml(html?: string) {
  return (
    html
      ?.replace(/<br\s*\/?>/g, " · ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/(?: ·)+ /g, " · ")
      .replace(/^[ ·]+|[ ·]+$/g, "") || undefined
  );
}

async function build(): Promise<Card[]> {
  const [version] = await getJson(`${DDRAGON}/api/versions.json`);
  const data = `${DDRAGON}/cdn/${version}/data/fr_FR`;
  const img = `${DDRAGON}/cdn/${version}/img`;
  const [champions, items, summoners, runes, skins, merakiChampions, merakiRates, factions, search, lor] = await Promise.all([
    getJson(`${data}/championFull.json`),
    getJson(`${data}/item.json`),
    getJson(`${data}/summoner.json`),
    getJson(`${data}/runesReforged.json`),
    getJson(`${CDRAGON}/fr_fr/v1/skins.json`),
    getJson(`${MERAKI}/champions.json`),
    getJson(`${MERAKI}/championrates.json`),
    getJson(`${UNIVERSE}/faction-browse/index.json`),
    getJson(`${UNIVERSE}/search/index.json`),
    lorCards(),
  ]);

  const championById = new Map<number, any>(Object.values<any>(champions.data).map((c) => [Number(c.key), c]));
  const skinMeta = new Map<number, any>(
    Object.values<any>(merakiChampions).flatMap((c) => c.skins.map((s: any) => [s.id, s])),
  );
  const pickRate = (championId: number) =>
    Object.values<any>(merakiRates.data[championId] ?? {}).reduce((sum, role) => sum + role.playRate, 0);

  const allSkins = Object.values<any>(skins);
  const championIds = allSkins.filter((s) => s.isBase).map((s) => Math.floor(s.id / 1000));
  const byPickRate = [...championIds].sort((a, b) => pickRate(b) - pickRate(a));

  // Champions and skins
  const skinIds = new Set(allSkins.map((s) => s.id));
  const cards: Card[] = allSkins.flatMap((s): Card[] => {
    const championId = Math.floor(s.id / 1000);
    const images = {
      // The "vintage" loading screen is the one with the skin's special border baked in.
      image: cdragonAsset(s.loadScreenVintagePath || s.loadScreenPath || s.splashPath),
      splash: cdragonAsset(s.splashPath),
    };
    if (s.isBase) {
      return [
        {
          id: `champion:${championId}`,
          type: "champion",
          name: s.name,
          subtitle: championById.get(championId)?.title,
          rarity: pickRate(championId) ? championRarity(byPickRate.indexOf(championId), byPickRate.length) : "common",
          ...images,
          flavor: championById.get(championId)?.lore,
        },
      ];
    }
    const rarity = skinRarity(s.id, s.rarity, skinMeta.get(s.id));
    const skin: Card = {
      id: `skin:${s.id}`,
      type: "skin",
      name: s.name,
      rarity,
      ...images,
      flavor: s.description || undefined,
      frames: skinFrames(s.skinAugments),
      chromas: s.chromas?.map((c: any) => ({ id: c.id, name: c.name, colors: c.colors })),
    };
    // Evolving skins: their later forms only exist as tiers of the first one.
    const tiers: Card[] = (s.questSkinInfo?.tiers ?? [])
      .filter((t: any) => t.stage > 1 && !skinIds.has(t.id))
      .map((t: any) => ({
        id: `skin:${t.id}`,
        type: "skin",
        name: t.name,
        rarity,
        image: cdragonAsset(t.loadScreenPath),
        splash: cdragonAsset(t.splashPath),
        flavor: t.description || undefined,
        frames: skinFrames(t.skinAugments),
      }));
    return [skin, ...tiers];
  });

  // Champion abilities
  for (const [championId, c] of championById) {
    const abilities = [
      { slot: "P", name: c.passive.name, image: `${img}/passive/${c.passive.image.full}`, text: c.passive.description },
      ...c.spells.map((s: any, i: number) => ({
        slot: "QWER"[i],
        name: s.name,
        image: `${img}/spell/${s.image.full}`,
        text: s.description,
        facts: [
          ["Délai de récupération", `${s.cooldownBurn} s`],
          ...(s.costBurn !== "0" ? [["Coût", s.costBurn]] : []),
        ],
      })),
    ];
    for (const a of abilities) {
      cards.push({
        id: `ability:${championId}:${a.slot}`,
        type: "ability",
        name: a.name,
        subtitle: `${c.name} · ${SLOT_LABEL[a.slot]}`,
        rarity: abilityRarity(a.slot),
        image: a.image,
        flavor: stripHtml(a.text),
        facts: a.facts,
      });
    }
  }

  // Summoner spells: only those of the classic modes, not event leftovers.
  for (const s of Object.values<any>(summoners.data)) {
    if (!s.modes.includes("CLASSIC") && !s.modes.includes("ARAM")) continue;
    cards.push({
      id: `summoner:${s.key}`,
      type: "summoner",
      name: s.name,
      rarity: summonerSpellRarity(s.id),
      image: `${img}/spell/${s.image.full}`,
      flavor: s.description,
      facts: [
        ["Délai de récupération", `${s.cooldownBurn} s`],
        ["Niveau requis", String(s.summonerLevel)],
      ],
    });
  }

  // Runes: the first row of each tree holds the keystones.
  for (const tree of runes) {
    tree.slots.forEach((slot: any, row: number) => {
      for (const r of slot.runes) {
        cards.push({
          id: `rune:${r.id}`,
          type: "rune",
          name: r.name,
          subtitle: row === 0 ? `${tree.name} · Rune clé` : tree.name,
          rarity: runeRarity(row === 0),
          image: `${DDRAGON}/cdn/img/${r.icon}`,
          flavor: stripHtml(r.longDesc),
        });
      }
    });
  }

  // Items of Summoner's Rift. The same item exists once per game mode: keep one per name.
  const seenItems = new Set<string>();
  for (const [id, it] of Object.entries<any>(items.data)) {
    if (!it.maps["11"] || !it.gold.purchasable || it.inStore === false || seenItems.has(it.name)) continue;
    seenItems.add(it.name);
    cards.push({
      id: `item:${id}`,
      type: "item",
      name: it.name,
      rarity: itemRarity(it.gold.total),
      image: `${img}/item/${it.image.full}`,
      flavor:
        [it.plaintext, stripHtml(it.description.replace(/<stats>[\s\S]*?<\/stats>/, ""))].filter(Boolean).join(" ") ||
        undefined,
      facts: [
        ["Prix", `${gold.format(it.gold.total)} PO`],
        ...(itemStats(it.description) ? [["Statistiques", itemStats(it.description)]] : []),
      ] as [string, string][],
    });
  }

  // Regions
  const regionText = new Map<string, string>(search.factions.map((f: any) => [f.slug, f.description]));
  for (const f of factions.factions) {
    cards.push({
      id: `region:${f.slug}`,
      type: "region",
      name: f.name,
      rarity: REGION_RARITY,
      image: f.image.uri,
      focus: focusOf(f.image),
      flavor: stripHtml(regionText.get(f.slug)),
      url: `https://universe.leagueoflegends.com/fr_FR/region/${f.slug}/`,
    });
  }

  // Universe site: short stories, videos (cinematics, music) and comics
  for (const m of await universeModules(factions)) {
    const image = m["featured-image"]?.uri ?? m.background?.uri;
    if (!image) continue;
    const base = {
      name: m.title,
      image,
      flavor: stripHtml(m.description),
      subtitle: [...m.champions].join(", ") || undefined,
      focus: focusOf(m["featured-image"] ?? m.background),
    };
    if (m.type === "story-preview") {
      cards.push({
        ...base,
        id: `story:${m["story-slug"]}`,
        type: "story",
        rarity: storyRarity(m.words),
        url: `https://universe.leagueoflegends.com/fr_FR/story/${m["story-slug"]}/`,
      });
    } else if (m.type === "featured-video") {
      cards.push({ ...base, id: `video:${m.slug}`, type: "video", rarity: VIDEO_RARITY[m["video-type"]] ?? "rare", url: m.uri });
    } else if (m.type === "link-out" && m.isComic) {
      cards.push({ ...base, id: `comic:${m.slug}`, type: "comic", rarity: COMIC_RARITY, url: m.url });
    }
  }

  // Legends of Runeterra: everything but champions (already cards). Tokens often repeat a
  // collectible card, so keep one card per name, collectible first.
  const seenLor = new Set<string>();
  for (const c of [...lor].sort((a, b) => Number(b.collectible) - Number(a.collectible))) {
    const type = LOR_TYPE[c.type];
    if (!type || (c.type === "Unité" && c.supertype) || seenLor.has(c.name)) continue;
    seenLor.add(c.name);
    cards.push({
      id: `lor:${c.cardCode}`,
      type,
      name: c.name,
      rarity: lorRarity(c.rarityRef, type),
      image: c.assets[0].fullAbsolutePath.replace("http://", "https://"),
      region: c.regionRefs[0],
      flavor: c.flavorText || undefined,
    });
  }
  cards.push(
    ...(await withLiveImages([
      ...(await esportsCards()),
      ...(await tftCards()),
      ...(await songCards()),
      ...handmadeCards("lane", LANES, true),
      ...handmadeCards("monster", MONSTERS, true),
      ...handmadeCards("map", await withModeArt(MAPS)),
      ...handmadeCards("mode", await withModeArt(MODES)),
    ])),
    ...peopleCards(),
    ...creatorCards(),
    ...handmadeCards("server", SERVERS),
  );

  // Source texts carry HTML tags and entities ("&nbsp;"): clean every text in one place.
  for (const card of cards) {
    card.name = decodeEntities(card.name);
    if (card.subtitle) card.subtitle = decodeEntities(card.subtitle);
    if (card.flavor) card.flavor = decodeEntities(stripHtml(card.flavor) ?? "") || undefined;
  }
  return distinctNames(cards);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// What is added to a name shared by several cards. The order is also the priority: in a group
// of namesakes, the card whose type comes first keeps the bare name ("Annie" stays the champion).
const NAME_TAG: Record<CardType, string> = {
  champion: "Champion",
  skin: "Skin",
  region: "Région",
  item: "Objet",
  rune: "Rune",
  summoner: "Sort d'invocateur",
  ability: "Compétence",
  monster: "Monstre",
  map: "Carte de jeu",
  mode: "Mode de jeu",
  lane: "Voie",
  server: "Serveur",
  team: "Équipe",
  player: "Joueur",
  competition: "Compétition",
  person: "Personnalité",
  creator: "Créateur",
  song: "Musique",
  story: "Récit",
  video: "Vidéo",
  comic: "BD",
  character: "Runeterra",
  place: "Runeterra",
  spell: "Runeterra",
  tft: "TFT",
};
const TAG_ORDER = Object.keys(NAME_TAG);

// Two cards never show the same name: namesakes get a tag after it ("Annie - TFT Set 3",
// "Éclair - Runeterra"). Ids do not change, so collections are untouched.
export function distinctNames(cards: Card[]): Card[] {
  const key = (c: Card) => c.name.toLowerCase();
  const groups = Map.groupBy(cards, key);
  const renamed = cards.map((card) => {
    const group = groups.get(key(card))!;
    if (group.length === 1) return card;
    const sameType = group.filter((c) => c.type === card.type);
    const first = group.reduce((a, b) => (TAG_ORDER.indexOf(b.type) < TAG_ORDER.indexOf(a.type) ? b : a));
    if (card === first && sameType.length === 1) return card;
    let tag = NAME_TAG[card.type];
    if (sameType.length > 1) {
      // Several cards of one type: the tag alone would not tell them apart.
      const set = card.subtitle?.match(/Set \d+/)?.[0];
      tag = card.type === "tft" ? (set ? `TFT ${set}` : "TFT") : (card.subtitle?.split(" · ")[0] ?? tag);
    }
    return { ...card, name: `${card.name} - ${tag}` };
  });
  // Still the same name (a unit and a trait of one TFT set): say what kind of card it is.
  const after = Map.groupBy(renamed, key);
  return renamed.map((card) => {
    const kind = card.subtitle?.split(" · ")[0];
    return after.get(key(card))!.length > 1 && kind ? { ...card, name: `${card.name} ${kind.toLowerCase()}` } : card;
  });
}

export function check(cards: Card[]) {
  const ids = new Set(cards.map((c) => c.id));
  if (ids.size !== cards.length) throw new Error("duplicate card ids");
  const names = new Set(cards.map((c) => c.name.toLowerCase()));
  if (names.size !== cards.length) throw new Error("two cards share a name");
  const bad = cards.find((c) => !c.name || !/^(https:\/\/|\/emblems\/)/.test(c.image ?? "") || !RARITIES.includes(c.rarity));
  if (bad) throw new Error(`invalid card: ${JSON.stringify(bad)}`);
}

if (import.meta.main) {
  const cards = await build();
  check(cards);
  await mkdir("src/data", { recursive: true });
  await mkdir("public/emblems", { recursive: true });
  for (const [file, svg] of emblems) await writeFile(`public/emblems/${file}`, svg);
  // One card per line keeps git diffs readable after a patch.
  await writeFile("src/data/cards.json", `[\n${cards.map((c) => JSON.stringify(c)).join(",\n")}\n]\n`);

  const table: Record<string, Record<string, number>> = { TOTAL: {} };
  for (const c of cards) {
    for (const row of [c.type, "TOTAL"]) {
      table[row] ??= {};
      table[row][c.rarity] = (table[row][c.rarity] ?? 0) + 1;
    }
  }
  console.table(table, [...RARITIES]);
  console.log(`${cards.length} cards written to src/data/cards.json`);
}
