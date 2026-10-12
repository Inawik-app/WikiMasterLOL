// Builds src/data/cards.json from Riot and community JSON sources.
// Run with `npm run cards`. All rarity rules live in this file.
import { mkdir, writeFile } from "node:fs/promises";
import { RARITIES, type Card, type CardType, type Rarity } from "../src/lib/card.ts";

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
const SUMMONER_SPELL_RARITY: Rarity = "epic";
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
      rarity: SUMMONER_SPELL_RARITY,
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
  return cards;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function check(cards: Card[]) {
  const ids = new Set(cards.map((c) => c.id));
  if (ids.size !== cards.length) throw new Error("duplicate card ids");
  const bad = cards.find((c) => !c.name || !c.image?.startsWith("https://") || !RARITIES.includes(c.rarity));
  if (bad) throw new Error(`invalid card: ${JSON.stringify(bad)}`);
}

if (import.meta.main) {
  const cards = await build();
  check(cards);
  await mkdir("src/data", { recursive: true });
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
