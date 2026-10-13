// Cards that no data source lists: written by hand, with their rarity.
// `image` is a CommunityDragon path when official art exists; otherwise the build draws an emblem
// from `mark` (a few letters).
import type { Rarity } from "../src/lib/card.ts";

export type Handmade = {
  slug: string;
  name: string;
  rarity: Rarity;
  subtitle?: string;
  flavor?: string;
  mark?: string;
  image?: string;
  // Folder of the game mode in the client assets; the build picks its background image.
  modeArt?: string;
};

const HUD = "game/assets/characters";
const POSITION = "plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";

export const SERVERS: Handmade[] = [
  ["EUW", "Europe Ouest"],
  ["EUNE", "Europe Nord et Est"],
  ["NA", "Amérique du Nord"],
  ["KR", "Corée"],
  ["CN", "Chine"],
  ["BR", "Brésil"],
  ["LAN", "Amérique latine Nord"],
  ["LAS", "Amérique latine Sud"],
  ["OCE", "Océanie"],
  ["TR", "Turquie"],
  ["RU", "Russie"],
  ["JP", "Japon"],
  ["ME", "Moyen-Orient"],
  ["SEA", "Asie du Sud-Est"],
  ["TW", "Taïwan, Hong Kong et Macao"],
  ["VN", "Vietnam"],
].map(([code, name]): Handmade => ({
  slug: code.toLowerCase(),
  name: `${code} · ${name}`,
  rarity: "uncommon",
  mark: code,
  flavor: `Serveur de League of Legends de la région ${name}.`,
}));
SERVERS.push({
  slug: "pbe",
  name: "PBE",
  rarity: "rare",
  mark: "PBE",
  subtitle: "Environnement de test public",
  flavor: "Le serveur où les nouveautés sont essayées avant d'arriver en jeu.",
});

export const LANES: Handmade[] = [
  { slug: "top", name: "Voie du haut", flavor: "L'île des duellistes : un contre un, loin du reste de la carte." },
  { slug: "jungle", name: "Jungle", flavor: "Entre les voies, là où se décident les embuscades et les objectifs." },
  { slug: "middle", name: "Voie du milieu", flavor: "La voie la plus courte, au centre de tout." },
  { slug: "bottom", name: "Voie du bas", flavor: "La voie du tireur, à deux pas du dragon." },
  { slug: "utility", name: "Support", flavor: "Celui qui protège, engage et éclaire la carte pour les autres." },
].map((lane): Handmade => ({ ...lane, rarity: "epic", image: `${POSITION}/icon-position-${lane.slug}.png` }));

export const MONSTERS: Handmade[] = [
  // Epic objectives
  { slug: "baron", name: "Baron Nashor", rarity: "transcendent", image: `${HUD}/sru_baron/hud/baron_square.png`, flavor: "Le monstre le plus puissant de la Faille. Son buff retourne une partie." },
  { slug: "elder-dragon", name: "Dragon ancestral", rarity: "legendary", image: `${HUD}/sru_dragon_elder/hud/dragon_square_elder.png`, flavor: "Il apparaît une fois l'âme du dragon acquise et exécute les ennemis affaiblis." },
  { slug: "rift-herald", name: "Héraut de la Faille", rarity: "legendary", image: `${HUD}/sru_riftherald/hud/sruriftherald_square.png`, flavor: "Une fois capturé, il charge les tourelles pour ton équipe." },
  { slug: "atakhan", name: "Atakhan", rarity: "legendary", image: `${HUD}/sru_atakhan/hud/atakhan_r_square_128.png`, flavor: "Le Porteur de ruine, attiré par le côté de la carte où le sang a le plus coulé." },
  { slug: "voidgrubs", name: "Larves du Néant", rarity: "rare", image: `${HUD}/sru_horde/hud/sru_voidgrub_square.png`, flavor: "Elles occupent l'antre du Baron en début de partie." },
  // Elemental drakes
  { slug: "dragon", name: "Dragon", rarity: "legendary", subtitle: "Avant les dragons élémentaires", image: `${HUD}/sru_dragon/hud/dragon_square.png`, flavor: "Le dragon d'origine : de l'or pour toute l'équipe, rien de plus." },
  { slug: "infernal-drake", name: "Dragon infernal", rarity: "rare", image: `${HUD}/sru_dragon_fire/hud/dragon_square_fire.png`, flavor: "Dragon élémentaire du feu." },
  { slug: "ocean-drake", name: "Dragon des océans", rarity: "rare", image: `${HUD}/sru_dragon_water/hud/dragon_square_water.png`, flavor: "Dragon élémentaire de l'eau." },
  { slug: "mountain-drake", name: "Dragon des montagnes", rarity: "rare", image: `${HUD}/sru_dragon_earth/hud/dragon_square_earth.png`, flavor: "Dragon élémentaire de la terre." },
  { slug: "cloud-drake", name: "Dragon des nuages", rarity: "rare", image: `${HUD}/sru_dragon_air/hud/dragon_air_square.png`, flavor: "Dragon élémentaire de l'air." },
  { slug: "hextech-drake", name: "Dragon Hextech", rarity: "rare", mark: "HEX", flavor: "Dragon élémentaire Hextech." },
  { slug: "chemtech-drake", name: "Dragon techno-chimique", rarity: "rare", mark: "CHEM", flavor: "Dragon élémentaire techno-chimique." },
  // Jungle camps
  { slug: "blue-sentinel", name: "Sentinelle bleue", rarity: "uncommon", image: `${HUD}/sru_blue/hud/bluesentinel_square.png`, flavor: "Gardienne du buff bleu." },
  { slug: "red-brambleback", name: "Roncier rouge", rarity: "uncommon", image: `${HUD}/sru_red/hud/brambleback_square.png`, flavor: "Gardien du buff rouge." },
  { slug: "gromp", name: "Gromp", rarity: "uncommon", image: `${HUD}/sru_gromp/hud/gromp_square.png`, flavor: "Le gros crapaud solitaire de la jungle." },
  { slug: "krugs", name: "Krugs", rarity: "uncommon", image: `${HUD}/sru_krug/hud/ancientkrug_square.png`, flavor: "Un camp de pierres qui se divisent en plus petites pierres." },
  { slug: "murk-wolves", name: "Loups des ténèbres", rarity: "uncommon", image: `${HUD}/sru_murkwolf/hud/greatermurkwolf_square.png`, flavor: "Une meute de trois, au cœur de la jungle." },
  { slug: "raptors", name: "Becs-rasoirs", rarity: "uncommon", image: `${HUD}/sru_razorbeak/hud/razorbeak_square.png`, flavor: "Six volatiles à nettoyer d'un coup." },
  { slug: "scuttle-crab", name: "Carapateur", rarity: "uncommon", image: `${HUD}/sru_crab/hud/crab_square_0.png`, flavor: "Le crabe de la rivière, qui ne se bat jamais et offre la vision." },
  // Gone from the game: older means rarer
  { slug: "vilemaw", name: "Vilemaw", rarity: "mythic", mark: "VM", subtitle: "Forêt torturée", flavor: "L'araignée géante qui régnait sur la Forêt torturée, disparue avec la carte." },
  { slug: "wraiths", name: "Spectres", rarity: "epic", mark: "SP", subtitle: "Ancienne jungle", flavor: "L'ancien camp des spectres, remplacé par les becs-rasoirs." },
  { slug: "golems", name: "Golems", rarity: "epic", mark: "GO", subtitle: "Ancienne jungle", flavor: "L'ancien camp des deux golems, remplacé par les krugs." },
  { slug: "wolves", name: "Loups", rarity: "epic", mark: "LO", subtitle: "Ancienne jungle", flavor: "L'ancien camp des loups, devenu les loups des ténèbres." },
  { slug: "ancient-golem", name: "Golem ancien", rarity: "epic", mark: "GA", subtitle: "Ancienne jungle", flavor: "L'ancien gardien du buff bleu." },
  { slug: "lizard-elder", name: "Lézard ancien", rarity: "epic", mark: "LA", subtitle: "Ancienne jungle", flavor: "L'ancien gardien du buff rouge." },
];

export const MAPS: Handmade[] = [
  { slug: "summoners-rift", name: "Faille de l'invocateur", rarity: "transcendent", mark: "FL", modeArt: "classic_sru", flavor: "Trois voies, une jungle, deux Nexus : la carte de League of Legends." },
  { slug: "howling-abyss", name: "Abîme hurlant", rarity: "legendary", mark: "AH", modeArt: "aram", flavor: "Un seul pont gelé de Freljord, sans retour à la base : la carte de l'ARAM." },
  { slug: "twisted-treeline", name: "Forêt torturée", rarity: "mythic", mark: "3c3", flavor: "La carte en trois contre trois des Îles obscures, retirée du jeu." },
  { slug: "crystal-scar", name: "Brèche de cristal", rarity: "mythic", mark: "DOM", flavor: "La carte circulaire du mode Dominion, retirée du jeu." },
  { slug: "butchers-bridge", name: "Pont du boucher", rarity: "legendary", mark: "PB", flavor: "Un pont de Bilgewater qui a remplacé l'Abîme hurlant le temps d'un événement." },
];

export const MODES: Handmade[] = [
  { slug: "aram", name: "ARAM", rarity: "epic", mark: "A", modeArt: "aram", flavor: "Tous aléatoires, tous au milieu." },
  { slug: "urf", name: "URF", rarity: "legendary", mark: "U", modeArt: "urf", subtitle: "Ultra Rapid Fire", flavor: "Plus de mana, presque plus de délais de récupération." },
  { slug: "arurf", name: "ARURF", rarity: "rare", mark: "A", modeArt: "snowurf", subtitle: "Ultra Rapid Fire aléatoire", flavor: "L'URF, mais c'est le jeu qui choisit ton champion." },
  { slug: "one-for-all", name: "Un pour tous", rarity: "rare", mark: "PT", modeArt: "oneforall", flavor: "Toute l'équipe joue le même champion." },
  { slug: "doom-bots", name: "Bots du chaos", rarity: "rare", mark: "BC", modeArt: "doombots", flavor: "Des bots aux sorts démesurés, à battre à cinq." },
  { slug: "nexus-blitz", name: "Blitz du Nexus", rarity: "rare", mark: "BN", modeArt: "gamemodex", flavor: "Des parties courtes, ponctuées d'événements imprévisibles." },
  { slug: "ultimate-spellbook", name: "Grimoire ultime", rarity: "rare", mark: "GU", modeArt: "ultbook", flavor: "Ton second sort d'invocateur est l'ultime d'un autre champion." },
  { slug: "arena", name: "Arena", rarity: "rare", mark: "A", modeArt: "cherry", flavor: "Des duos qui s'affrontent en rounds, optimisations à l'appui." },
  { slug: "poro-king", name: "Légende du roi Poro", rarity: "epic", mark: "LRP", modeArt: "kingporo", flavor: "Des poros à lancer, et un roi à invoquer." },
  { slug: "blood-moon", name: "Chasse de la lune de sang", rarity: "epic", mark: "CLS", modeArt: "assassinate", flavor: "Un mode réservé aux assassins." },
  { slug: "tft", name: "Teamfight Tactics", rarity: "rare", mark: "TT", modeArt: "tft", flavor: "Le jeu de stratégie en huit joueurs né dans le client de League of Legends." },
  { slug: "aram-mayhem", name: "ARAM : Chaos", rarity: "rare", mark: "ARAM", flavor: "L'ARAM avec des optimisations à choisir en cours de partie." },
  { slug: "hexakill", name: "Hexakill", rarity: "epic", mark: "6c6", flavor: "Six contre six." },
  { slug: "ascension", name: "Ascension", rarity: "epic", mark: "ASC", flavor: "Un mode temporaire de Shurima sur la Brèche de cristal." },
  { slug: "dominion", name: "Dominion", rarity: "mythic", mark: "DOM", flavor: "Capturer et tenir cinq points : un mode permanent retiré du jeu." },
  { slug: "nexus-siege", name: "Siège du Nexus", rarity: "epic", mark: "SN", flavor: "Une équipe attaque, l'autre défend, puis on échange." },
  { slug: "swarm", name: "Swarm", rarity: "epic", mark: "SW", flavor: "Un mode coopératif contre des vagues d'ennemis." },
  { slug: "odyssey", name: "Odyssée : Extraction", rarity: "epic", mark: "ODY", flavor: "Un mode coopératif de l'événement Odyssée." },
  { slug: "star-guardian-invasion", name: "Invasion", rarity: "epic", mark: "INV", flavor: "Le mode coopératif des Gardiennes des étoiles." },
  { slug: "clash", name: "Clash", rarity: "rare", mark: "CL", flavor: "Des tournois par équipes de cinq, organisés dans le client." },
];

// Worlds anthems. Rarity comes from the view count read on YouTube at build time.
export const SONGS: { year: number; name: string; artist: string; video: string }[] = [
  { year: 2014, name: "Warriors", artist: "Imagine Dragons", video: "fmI_Ndrxy14" },
  { year: 2015, name: "Worlds Collide", artist: "Nicki Taylor", video: "4Twd965VzX4" },
  { year: 2016, name: "Ignite", artist: "Zedd", video: "Zasx9hjo4WY" },
  { year: 2017, name: "Legends Never Die", artist: "Against The Current", video: "r6zIGXun57U" },
  { year: 2018, name: "RISE", artist: "The Glitch Mob, Mako, The Word Alive", video: "fB8TyLTD7EE" },
  { year: 2019, name: "Phoenix", artist: "Cailin Russo, Chrissy Costanza", video: "i1IKnWDecwA" },
  { year: 2020, name: "Take Over", artist: "Jeremy McKinnon, MAX, Henry", video: "KbNL9ZyB49c" },
  { year: 2021, name: "Burn It All Down", artist: "PVRIS", video: "1Z6CHioIn3s" },
  { year: 2022, name: "STAR WALKIN'", artist: "Lil Nas X", video: "HYsz1hP0BFo" },
  { year: 2023, name: "GODS", artist: "NewJeans", video: "C3GouGa0noM" },
  { year: 2024, name: "Heavy Is The Crown", artist: "Linkin Park", video: "5FrhtahQiRc" },
  { year: 2025, name: "Sacrifice", artist: "G.E.M.", video: "pzt6SmvGpXk" },
  { year: 2026, name: "Know My Name", artist: "True Damage", video: "mlFxxNsExJc" },
];

// People. Only what is widely known about their role; photos come from Leaguepedia when it has one.
export type Person = { name?: string; handle: string; role: string; rarity: Rarity; flavor: string; page?: string };

export const DEVELOPERS: Person[] = [
  { name: "Brandon Beck", handle: "Ryze", role: "Cofondateur de Riot Games", rarity: "ultimate", flavor: "Cofondateur de Riot Games avec Marc Merrill. Le champion Ryze porte son pseudonyme." },
  { name: "Marc Merrill", handle: "Tryndamere", role: "Cofondateur de Riot Games", rarity: "ultimate", flavor: "Cofondateur de Riot Games avec Brandon Beck. Le champion Tryndamere porte son pseudonyme." },
  { name: "Steve Feak", handle: "Guinsoo", role: "Concepteur", rarity: "legendary", flavor: "Concepteur de DotA Allstars puis des débuts de League of Legends. La Lame enragée de Guinsoo porte son nom." },
  { name: "Steve Mescon", handle: "Pendragon", role: "Communauté", rarity: "legendary", flavor: "Figure de la communauté DotA, parmi les premiers employés de Riot Games." },
  { name: "Tom Cadwell", handle: "Zileas", role: "Concepteur", rarity: "legendary", flavor: "L'un des premiers responsables de la conception du jeu." },
  { name: "Colt Hallam", handle: "Ezreal", role: "Concepteur", rarity: "legendary", flavor: "Concepteur des débuts du jeu. Le champion Ezreal porte son pseudonyme." },
  { name: "Greg Street", handle: "Ghostcrawler", role: "Concepteur", rarity: "legendary", flavor: "Ancien responsable de la conception de League of Legends." },
  { name: "Ryan Scott", handle: "Morello", role: "Concepteur", rarity: "legendary", flavor: "Ancien responsable de la conception. Le Morellonomicon porte son nom." },
  { name: "Andrei van Roon", handle: "Meddler", role: "Concepteur", rarity: "epic", flavor: "Concepteur puis responsable du jeu chez Riot Games." },
  { name: "Mark Yetter", handle: "Scruffy", role: "Concepteur", rarity: "epic", flavor: "Ancien responsable de l'équilibrage et de la conception." },
  { name: "Bradford Wenban", handle: "CertainlyT", role: "Concepteur de champions", rarity: "epic", flavor: "Concepteur de champions réputés pour leur complexité." },
  { name: "August Browning", handle: "August", role: "Concepteur de champions", rarity: "epic", flavor: "Concepteur de champions, dont Jinx." },
  { name: "Matt Leung-Harrison", handle: "Phroxzon", role: "Équilibrage", rarity: "epic", flavor: "Responsable de l'équilibrage du jeu." },
];

export const CASTERS: Person[] = [
  { name: "David Turley", handle: "Phreak", page: "Phreak", role: "Commentateur puis concepteur", rarity: "legendary", flavor: "Voix des premières années du jeu et des présentations de champions, passé ensuite à la conception." },
  { name: "Joshua Leesman", handle: "Jatt", page: "Jatt", role: "Commentateur", rarity: "epic", flavor: "Ancien joueur devenu commentateur des ligues nord-américaines." },
  { name: "Sam Hartman-Kenzler", handle: "Kobe", role: "Commentateur", rarity: "epic", flavor: "Commentateur des ligues nord-américaines." },
  { name: "Clayton Raines", handle: "CaptainFlowers", page: "CaptainFlowers", role: "Commentateur", rarity: "epic", flavor: "Commentateur des ligues nord-américaines et des finales mondiales." },
  { name: "Isaac Cummings-Bentley", handle: "Azael", page: "Azael", role: "Commentateur", rarity: "epic", flavor: "Commentateur des ligues nord-américaines." },
  { name: "Rivington Bisland III", handle: "Rivington", role: "Commentateur", rarity: "epic", flavor: "L'une des voix des débuts de la scène nord-américaine." },
  { name: "Trevor Henry", handle: "Quickshot", page: "Quickshot", role: "Commentateur", rarity: "epic", flavor: "Commentateur historique des ligues européennes." },
  { name: "Martin Lynge", handle: "Deficio", page: "Deficio", role: "Commentateur", rarity: "epic", flavor: "Ancien joueur devenu commentateur des ligues européennes." },
  { name: "Aaron Chamberlain", handle: "Medic", role: "Commentateur", rarity: "epic", flavor: "Commentateur des ligues européennes." },
  { name: "Daniel Drakos", handle: "Drakos", page: "Drakos", role: "Commentateur", rarity: "epic", flavor: "Commentateur des ligues européennes." },
  { name: "Andy Day", handle: "Vedius", page: "Vedius", role: "Commentateur", rarity: "epic", flavor: "Commentateur des ligues européennes." },
  { name: "Marc Lamont", handle: "Caedrel", page: "Caedrel", role: "Commentateur et streamer", rarity: "legendary", flavor: "Ancien joueur professionnel devenu commentateur, streamer et fondateur de Los Ratones." },
  { name: "Eefje Depoortere", handle: "Sjokz", page: "Sjokz", role: "Présentatrice", rarity: "legendary", flavor: "Présentatrice des ligues européennes et des compétitions internationales." },
  { name: "Christopher Mykles", handle: "MonteCristo", page: "MonteCristo", role: "Commentateur", rarity: "epic", flavor: "Voix anglophone de la ligue coréenne à ses débuts." },
  { name: "Erik Lonnquist", handle: "DoA", role: "Commentateur", rarity: "epic", flavor: "Voix anglophone de la ligue coréenne à ses débuts." },
  { name: "Chris Smith", handle: "PapaSmithy", page: "PapaSmithy", role: "Commentateur", rarity: "epic", flavor: "Commentateur anglophone de la ligue coréenne." },
  { name: "Max Anderson", handle: "Atlus", role: "Commentateur", rarity: "epic", flavor: "Commentateur anglophone de la ligue coréenne." },
  { name: "Mitch Voorspoels", handle: "Krepo", page: "Krepo", role: "Commentateur", rarity: "epic", flavor: "Ancien joueur devenu commentateur des ligues européennes." },
  { name: "Leigh Smith", handle: "Deman", page: "Deman", role: "Commentateur", rarity: "epic", flavor: "L'une des voix des débuts de la scène européenne." },
  { name: "Fabien Culié", handle: "Chips", role: "Commentateur francophone", rarity: "epic", flavor: "Commentateur francophone, en duo avec Noi." },
  { name: "Charles Lapassat", handle: "Noi", role: "Commentateur francophone", rarity: "epic", flavor: "Commentateur francophone, en duo avec Chips." },
  { name: "Laure Valée", handle: "Bulii", role: "Journaliste et présentatrice", rarity: "epic", flavor: "Journaliste française, intervieweuse des compétitions européennes et internationales." },
  // Added from a player's list (2026-10-12)
  { handle: "Tweekz", role: "Commentateur francophone", rarity: "epic", flavor: "Commentateur francophone des compétitions de League of Legends." },
  { handle: "Dagda", role: "Commentateur", rarity: "epic", flavor: "Commentateur anglophone." },
  { name: "Maurits Meeusen", handle: "Chronicler", role: "Commentateur", rarity: "epic", flavor: "Commentateur anglophone de la ligue coréenne." },
  { name: "Jun Yong-jun", handle: "Caster Jun", role: "Commentateur coréen", rarity: "legendary", flavor: "La voix des grandes finales en Corée." },
  { name: "James Patterson", handle: "Dash", role: "Présentateur", rarity: "epic", flavor: "Présentateur des ligues nord-américaines." },
  { name: "Park Jeesun", handle: "Jeesun", role: "Interprète et intervieweuse", rarity: "epic", flavor: "Interprète des joueurs coréens lors des entretiens d'après-match." },
];

// Streamers, video makers and channels of the League of Legends community. Emblem cards.
export type Creator = { handle: string; role: string; rarity: Rarity; flavor?: string };

export const CREATORS: Creator[] = [
  // Francophones
  { handle: "Kameto", role: "Streamer francophone", rarity: "legendary", flavor: "Streamer et cofondateur de la Karmine Corp." },
  { handle: "Domingo", role: "Streamer francophone", rarity: "legendary", flavor: "Streamer et animateur." },
  { handle: "Corobizar", role: "Streamer francophone", rarity: "epic" },
  { handle: "Wakz", role: "Streamer francophone", rarity: "epic", flavor: "Ancien joueur professionnel devenu streamer." },
  { handle: "Chap", role: "Streamer francophone", rarity: "epic" },
  { handle: "Alderiate", role: "Streamer francophone", rarity: "epic" },
  { handle: "LRB", role: "Créateur de contenu francophone", rarity: "epic" },
  { handle: "Potent", role: "Streamer francophone", rarity: "epic" },
  { handle: "Jbzz", role: "Streamer francophone", rarity: "epic" },
  { handle: "OTP LoL", role: "Chaîne francophone", rarity: "epic", flavor: "Chaîne francophone de retransmission des compétitions." },
  // Streamers
  { handle: "Tyler1", role: "Streamer", rarity: "legendary", flavor: "Streamer indissociable de Draven." },
  { handle: "Thebausffs", role: "Streamer", rarity: "legendary", flavor: "Streamer indissociable de Sion." },
  { handle: "Dopa", role: "Joueur de file solo", rarity: "legendary", flavor: "Figure de la file solo coréenne." },
  { handle: "imaqtpie", role: "Streamer", rarity: "legendary", flavor: "Ancien joueur professionnel devenu streamer." },
  { handle: "Ratirl", role: "Streamer", rarity: "epic", flavor: "Streamer indissociable de Twitch." },
  { handle: "Gosu", role: "Streamer", rarity: "epic", flavor: "Streamer indissociable de Vayne." },
  { handle: "Cowsep", role: "Streamer", rarity: "epic", flavor: "Streamer indissociable de Maître Yi." },
  { handle: "Nightblue3", role: "Streamer", rarity: "epic", flavor: "Streamer spécialiste de la jungle." },
  { handle: "Trick2g", role: "Streamer", rarity: "epic", flavor: "Streamer indissociable d'Udyr." },
  { handle: "Yassuo", role: "Streamer", rarity: "epic", flavor: "Streamer indissociable de Yasuo." },
  { handle: "Boxbox", role: "Streamer", rarity: "epic", flavor: "Streamer indissociable de Riven." },
  { handle: "PinkWard", role: "Streamer", rarity: "epic", flavor: "Streamer indissociable de Shaco." },
  { handle: "TF Blade", role: "Streamer", rarity: "epic", flavor: "Streamer de la voie du haut, habitué des sommets du classement." },
  { handle: "AloisNL", role: "Streamer", rarity: "epic", flavor: "Streamer pédagogue de la voie du haut." },
  { handle: "NattyNatt", role: "Vidéaste", rarity: "epic", flavor: "Vidéaste de la voie du haut." },
  // Channels
  { handle: "SkinSpotlights", role: "Chaîne YouTube", rarity: "legendary", flavor: "La chaîne qui présente chaque skin en jeu avant sa sortie." },
  { handle: "Vandiril", role: "Vidéaste", rarity: "legendary", flavor: "Bugs, expériences et interactions improbables du jeu." },
  { handle: "Necrit", role: "Vidéaste", rarity: "epic", flavor: "Vidéos sur l'univers et l'histoire de Runeterra." },
  { handle: "Skill Capped", role: "Chaîne YouTube", rarity: "rare", flavor: "Guides pour progresser." },
  { handle: "ProGuides", role: "Chaîne YouTube", rarity: "rare", flavor: "Guides pour progresser." },
  { handle: "Protatomonster", role: "Chaîne YouTube", rarity: "epic", flavor: "Compilations des meilleures actions." },
  { handle: "MagikarpUsedFly", role: "Vidéaste", rarity: "epic", flavor: "Montages et parodies." },
  { handle: "Synapse", role: "Chaîne YouTube", rarity: "rare", flavor: "Compilations de moments forts de streamers." },
  { handle: "Instalok", role: "Chaîne YouTube", rarity: "epic", flavor: "Parodies musicales sur les champions." },
  { handle: "Falconshield", role: "Chaîne YouTube", rarity: "rare", flavor: "Chansons originales sur les champions." },
  { handle: "Sp4zie", role: "Vidéaste", rarity: "epic" },
  { handle: "Redmercy", role: "Vidéaste", rarity: "rare" },
  { handle: "Gbay99", role: "Vidéaste", rarity: "epic", flavor: "Vidéos d'analyse des premières années du jeu." },
  { handle: "UberDanger", role: "Vidéaste", rarity: "epic" },
  { handle: "Zwag", role: "Vidéaste", rarity: "rare" },
  { handle: "Professor Akali", role: "Vidéaste", rarity: "rare" },
  { handle: "videogamedunkey", role: "Vidéaste", rarity: "epic", flavor: "Ses vidéos sur League of Legends ont marqué les premières années du jeu." },
];

// Players the esports API no longer lists on a roster: remembered by hand, without a photo.
// Only their position is stated; rarity reflects their place in the history of the scene.
// Legends who still appear on the roster of a small league. Hand lists do not apply there
// (a famous nickname is usually a namesake), so these are confirmed one by one: the roster card
// with the photo takes the legend's rarity, and no second card is made.
export const LEGENDS_STILL_PLAYING = ["Diamondprox", "Selfmade"];

export const LEGENDS: { handle: string; role: string; rarity: Rarity }[] = [
  { handle: "Uzi", role: "bas", rarity: "ultimate" },
  { handle: "Deft", role: "bas", rarity: "ultimate" },
  { handle: "Bengi", role: "jungle", rarity: "ultimate" },
  { handle: "Bang", role: "bas", rarity: "ultimate" },
  { handle: "Wolf", role: "support", rarity: "ultimate" },
  { handle: "Mata", role: "support", rarity: "ultimate" },
  { handle: "Doublelift", role: "bas", rarity: "mythic" },
  { handle: "Bjergsen", role: "milieu", rarity: "mythic" },
  { handle: "Perkz", role: "milieu", rarity: "mythic" },
  { handle: "xPeke", role: "milieu", rarity: "mythic" },
  { handle: "sOAZ", role: "haut", rarity: "mythic" },
  { handle: "YellOwStaR", role: "support", rarity: "mythic" },
  { handle: "Froggen", role: "milieu", rarity: "mythic" },
  { handle: "Jankos", role: "jungle", rarity: "mythic" },
  { handle: "Hylissang", role: "support", rarity: "mythic" },
  { handle: "Broxah", role: "jungle", rarity: "mythic" },
  { handle: "Sneaky", role: "bas", rarity: "mythic" },
  { handle: "Ambition", role: "jungle", rarity: "mythic" },
  { handle: "MaRin", role: "haut", rarity: "mythic" },
  { handle: "Smeb", role: "haut", rarity: "mythic" },
  { handle: "Score", role: "jungle", rarity: "mythic" },
  { handle: "PraY", role: "bas", rarity: "mythic" },
  { handle: "GorillA", role: "support", rarity: "mythic" },
  { handle: "Madlife", role: "support", rarity: "mythic" },
  { handle: "Crown", role: "milieu", rarity: "mythic" },
  { handle: "CuVee", role: "haut", rarity: "mythic" },
  { handle: "Peanut", role: "jungle", rarity: "mythic" },
  { handle: "Ning", role: "jungle", rarity: "mythic" },
  { handle: "Doinb", role: "milieu", rarity: "mythic" },
  { handle: "Nuguri", role: "haut", rarity: "mythic" },
  { handle: "BeryL", role: "support", rarity: "mythic" },
  { handle: "Clearlove", role: "jungle", rarity: "mythic" },
  { handle: "Mlxg", role: "jungle", rarity: "mythic" },
  { handle: "Ming", role: "support", rarity: "mythic" },
  // Added from a player's list (2026-10-12)
  { handle: "Ocelote", role: "milieu", rarity: "mythic" },
  { handle: "Diamondprox", role: "jungle", rarity: "mythic" },
  { handle: "Alex Ich", role: "milieu", rarity: "mythic" },
  { handle: "Darien", role: "haut", rarity: "legendary" },
  { handle: "Gripex", role: "jungle", rarity: "legendary" },
  { handle: "Cabochard", role: "haut", rarity: "legendary" },
  { handle: "Saken", role: "milieu", rarity: "legendary" },
  { handle: "Nemesis", role: "milieu", rarity: "mythic" },
  { handle: "Selfmade", role: "jungle", rarity: "mythic" },
  { handle: "Zven", role: "bas", rarity: "mythic" },
  { handle: "Mithy", role: "support", rarity: "mythic" },
  { handle: "Khan", role: "haut", rarity: "mythic" },
  { handle: "GALA", role: "bas", rarity: "mythic" },
  { handle: "Karsa", role: "jungle", rarity: "mythic" },
  { handle: "Maple", role: "milieu", rarity: "mythic" },
  { handle: "SwordArt", role: "support", rarity: "mythic" },
  { handle: "Doggo", role: "bas", rarity: "legendary" },
  { handle: "Dyrus", role: "haut", rarity: "mythic" },
  { handle: "Meteos", role: "jungle", rarity: "mythic" },
  { handle: "Hai", role: "milieu", rarity: "mythic" },
  { handle: "Jensen", role: "milieu", rarity: "mythic" },
  { handle: "Aphromoo", role: "support", rarity: "mythic" },
  { handle: "Xmithie", role: "jungle", rarity: "mythic" },
  { handle: "WildTurtle", role: "bas", rarity: "mythic" },
  { handle: "jojopyun", role: "milieu", rarity: "legendary" },
  { handle: "Scarra", role: "milieu", rarity: "mythic" },
  { handle: "Voyboy", role: "haut", rarity: "mythic" },
  { handle: "Levi", role: "jungle", rarity: "mythic" },
  { handle: "SofM", role: "jungle", rarity: "mythic" },
  { handle: "Optimus", role: "milieu", rarity: "legendary" },
  { handle: "Evi", role: "haut", rarity: "legendary" },
  { handle: "Yutapon", role: "bas", rarity: "legendary" },
  { handle: "brTT", role: "bas", rarity: "mythic" },
  { handle: "tinowns", role: "milieu", rarity: "legendary" },
  { handle: "Revolta", role: "jungle", rarity: "legendary" },
];

// Players still on a roster whose name alone is worth more than their league. Hand-picked.
export const GREATEST_PLAYER = "Faker";
export const ALL_TIME_GREATS = ["Ruler", "Chovy", "Canyon", "ShowMaker", "Caps", "Rookie", "TheShy", "Keria", "Zeus", "Oner", "Gumayusi", "Knight", "JackeyLove", "Meiko", "Viper", "Scout", "Doran"];
export const STARS = ["Rekkles", "Bdd", "Kiin", "Peyz", "Lehends", "Hans Sama", "Upset", "Elyoya", "Humanoid", "Bwipo", "CoreJJ", "Impact", "Tian", "Crisp", "Flandre", "Jiejie", "Pyosik", "Zeka", "Kingen", "Mikyx", "Wunder", "Blaber", "Inspired", "Razork", "Yike", "BrokenBlade", "Canna", "Kanavi", "369", "Bin", "Xun", "Elk", "Tarzan", "Aiming", "Delight", "Caliste", "Xiaohu"];

// Easter egg: the League accounts of the people who play this game, as transcendent cards.
// `icon` is the profile icon id, `art` the name of the champion or skin card shown behind it:
// the profile background chosen in the client when known, else the champion with the most
// mastery. Read by hand from the public profiles on 2026-10-13; update here when they change.
export const ACCOUNTS: { riotId: string; icon: number; art: string; main: string }[] = [
  { riotId: "Azoth999#AZOTH", icon: 5534, art: "HEARTSTEEL Aphelios", main: "Maître Yi" },
  { riotId: "Amplix#EUW", icon: 6760, art: "Alistar", main: "Alistar" },
  { riotId: "Splatox#EUW", icon: 4380, art: "Fiora", main: "Fiora" },
  { riotId: "FigueUniforme#help", icon: 5488, art: "Nami", main: "Nami" },
  { riotId: "IXKIXKIXI#IXIKI", icon: 29, art: "Akali", main: "Akali" },
];
