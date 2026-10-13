# Produit

## Problème

Wikimaster est amusant mais porte sur Wikipédia. Yanis et ses amis veulent le même plaisir de collection sur un univers qu'ils connaissent par cœur : League of Legends.

## Utilisateurs

Yanis et quelques amis joueurs de LoL. Ils veulent ouvrir des boosters, tomber sur une carte rare, et comparer leurs collections.

## Proposition

Ouvre des boosters de cartes League of Legends et complète ta collection avant tes amis.

## Périmètre de la version en cours (V1)

| Fonctionnalité | L'utilisateur peut… | Terminé quand… |
|---|---|---|
| Catalogue | — | `npm run cards` produit un JSON avec champions, skins, compétences, sorts d'invocateur, runes, objets, récits, vidéos, cartes d'univers, e-sport, Teamfight Tactics, monstres, cartes, modes, musiques et personnalités, chacune avec une rareté et une image ; deux cartes ne portent jamais le même nom (les homonymes reçoivent une étiquette : « Annie - TFT Set 3 », « Bastion - Runeterra ») |
| Compte | se connecter | la collection est retrouvée depuis un autre appareil |
| Booster | ouvrir un booster sur la page « Boosters » et retourner ses cartes une à une ; une carte retournée s'ouvre en grand d'un clic | les cartes tirées apparaissent dans sa collection ; la limite d'ouverture est respectée côté serveur |
| Source des cartes | chaque carte indique son jeu ou sa source (League of Legends, Univers de Runeterra, Legends of Runeterra, Teamfight Tactics, E-sport, Communauté) ; le catalogue se filtre par source puis par type | la source se déduit du type (`TYPE_SOURCE` dans `src/lib/card.ts`) |
| Cartes « Invocateurs » | clin d’œil : les comptes League des joueurs du groupe sont des cartes transcendantes (icône de profil sur l’illustration de leur fond de profil ou de leur champion le plus maîtrisé) | liste tenue à la main dans `ACCOUNTS` (`scripts/handmade.ts`), à mettre à jour puis `npm run cards` |
| Dons | depuis la page Amis, donner à un ami autant de cartes que voulu (celles qu'il n'a pas) et de l'essence ; la carte quitte la collection du donneur avec son rang et ses chromas ; un don ne se reprend pas | tout passe ou rien (fonction `give`) |
| Annonces Discord | un message dans le salon du groupe quand un joueur est le premier à trouver une carte secrète, et à chaque don | webhook (`DISCORD_WEBHOOK_URL`), pas de bot à héberger |
| Rang du joueur | un écusson dans la barre du haut, de Fer à Challenger selon le nombre de cartes possédées (un rang tous les 728 cartes, Challenger à 75 % du catalogue, `src/lib/level.ts`), avec une jauge vers le rang suivant ; l'écusson gagne une pièce à chaque rang | visible aussi dans la liste d'amis et le récapitulatif |
| Récapitulatif hebdomadaire | chaque dimanche, un message Discord : le plus chanceux et le moins chanceux de la semaine (cartes légendaires ou plus rares tirées, comparées à ce que les probabilités annonçaient, avec la chance d’un tel résultat ; calcul dans `src/lib/luck.ts`), le plus généreux, le tableau des collections avec les rangs, les découvertes de la semaine | tâche planifiée Vercel (`vercel.json`) vers `/api/recap`, protégée par `CRON_SECRET` |
| Autres annonces Discord | récompense du sceau récupérée ; skin « héros de guerre » monté au rang Diamant ou plus | — |
| Ordre des pages | Boosters en accueil (`/`), puis Collection, puis Catalogue | — |
| Catalogue | parcourir toutes les cartes, filtrer celles que le groupe a découvertes, acheter avec l'essence | une carte secrète non trouvée reste une silhouette |
| Collection | page à part : uniquement les cartes qu'il possède, mêmes filtres ; tri par rareté (par défaut), dernières obtenues ou ordre alphabétique ; cartes favorites (étoile, filtre) | le compteur « x sur total » est juste |
| Amis | page « Amis » : ajouter un joueur du jeu (immédiat, réciproque, sans demande), le retirer, ouvrir sa collection | la collection d'un ami affiche ses cartes en lecture seule |

## Hors périmètre

- Combats, decks, statistiques de cartes.
- Échanges de cartes entre joueurs.
- Achats, monnaie réelle, publicité.
- Ouverture au public, inscription libre.
- Application mobile native.

## Parcours principal

Connexion → un booster est disponible → ouverture, révélation des cartes une à une → les nouvelles cartes rejoignent la collection → consultation de la collection et de celle des amis.

## Modèle économique

Gratuit, privé.

## Contraintes

- Paliers gratuits uniquement : Vercel Hobby, Supabase Free (500 Mo de base, projet mis en pause après 7 jours sans activité).
- Contenu et images propriété de Riot Games : usage privé entre amis, pas de diffusion publique.
- Interface en français, utilisable sur téléphone et ordinateur.

## Mesure du succès

Les amis reviennent ouvrir leurs boosters sans qu'on le leur rappelle.

## Questions ouvertes

- Chromas et rangs : décidés le 2026-10-13, voir « Chromas et rangs ».
- À DÉCIDER : quelles familles de cartes ajouter pour se rapprocher de 10 000 (le catalogue en compte 8 729 ; emotes, icônes et balises sont exclus). Pistes restantes : optimisations et petites légendes de Teamfight Tactics.
- À DÉCIDER : nom du jeu.

## Règles de rareté (décidées le 2026-10-12)

Huit paliers, du plus courant au plus rare : commun, peu commun, rare, épique, légendaire, mythique, ultime, transcendant. Objectif : une pyramide, chaque palier compte moins de cartes que le précédent. Les noms de paliers de Riot ne sont pas repris tels quels. Les règles sont codées à un seul endroit, `scripts/build-cards.ts`, qui affiche la répartition à chaque génération.

- **Skins** : addition de trois critères, le total donne le palier.
  - Palier Riot : Épique +1, Légendaire +3, Mythique +4.
  - Difficulté d'obtention : héritage +1, rare +2, limité +3.
  - Ancienneté : 2016-2020 +1, 2011-2015 +2, avant 2011 +3. Plus c'est récent, moins c'est rare.
  - Mythique est réservé aux skins mythiques de Riot et aux skins qu'on ne peut plus obtenir ; les autres plafonnent à légendaire.
  - Les skins Ultimes de Riot sont ultimes ; Exalté et Transcendant sont transcendants.
  - Une courte liste de skins mythiques dans la communauté (Alistar noir, Kayle d'argent, skins PAX…) est fixée à la main en ultime.
- **Champions** : commun, peu commun ou rare selon le taux de sélection. Les 15 % les plus joués sont rares, les 35 % suivants peu communs. Taux actuel seulement : aucune source gratuite ne donne la moyenne depuis la sortie.
- **Compétences de champion** : communes, l'ultime (R) peu commun.
- **Sorts d'invocateur** : épiques, Saut éclair transcendant.
- **Runes** : peu communes, les runes clés rares.
- **Objets** : selon leur prix en or (moins de 1 000 commun, moins de 2 800 peu commun, au-delà rare).
- **Régions** : légendaires.
- **Récits du site Universe** : selon leur longueur (moins de 1 500 mots rare, moins de 5 000 épique, au-delà légendaire). Chaque carte renvoie vers le texte complet.
- **Vidéos du site Universe** : cinématiques légendaires, courts animés et clips épiques, le reste (écrans de connexion, coulisses) rare.
- **Bandes dessinées** : légendaires.
- **Cartes de valeur** : la carte la plus emblématique d'une famille est transcendante, pour donner un but à la collection : T1, Faker, le Mondial, la Faille de l'invocateur, le Baron Nashor, le Saut éclair, les hymnes à plus de 400 millions de vues.
- **Équipes e-sport** : selon le niveau. T1, l'équipe la plus titrée, transcendante ; les autres champions du monde ultimes ; équipes des ligues majeures (LCK, LPL, LEC, LCS, LCP, CBLOL, LTA) épiques ; ligues régionales reconnues (LFL, Prime League, LJL…) rares ; le reste peu commun. La liste des champions du monde est tenue à la main.
- **Joueurs e-sport** : ceux que l'API de lolesports liste dans un effectif avec une vraie photo. Rareté selon la ligue (majeure rare, régionale reconnue peu commune, autre commune). Des listes tenues à la main passent au-dessus, sauf dans les plus petites ligues où un pseudo célèbre est le plus souvent un homonyme : Faker transcendant, les plus grands (Chovy, Caps, Ruler…) ultimes, les vedettes mythiques. Les légendes qui ne sont plus dans un effectif (Uzi, Deft, Bengi…) ont une carte à emblème, ultime ou mythique.
- **Compétitions** : le Mondial transcendant ; MSI, First Stand et Esports World Cup mythiques ; ligues majeures légendaires ; les autres rares.
- **Teamfight Tactics** : unités selon leur coût en or (1 et 2 communes, 3 peu communes, 4 rares, 5 épiques, 6 légendaires) ; traits et objets peu communs ; composants communs.
- **Hymnes des Worlds** : selon le nombre de vues YouTube lu à la génération (400 millions et plus transcendant, 300 millions ultime, 100 millions légendaire, 30 millions épique, en dessous rare).
- **Personnalités** : cofondateurs de Riot Games ultimes ; concepteurs historiques et figures les plus connues légendaires ; les autres épiques. Rareté fixée à la main.
- **Créateurs** (streamers, vidéastes, chaînes) : cartes à emblème, rareté fixée à la main selon la notoriété (légendaire, épique ou rare).
- **Monstres** : Baron Nashor transcendant, autres objectifs majeurs légendaires, dragons élémentaires rares, camps de la jungle peu communs ; les monstres retirés du jeu sont épiques, Vilemaw mythique.
- **Cartes et modes de jeu** : Faille de l'invocateur transcendante, autres cartes légendaires, modes rares à épiques ; ce qui a été retiré du jeu est mythique (Forêt torturée, Brèche de cristal, Dominion).
- **Voies** : épiques. **Serveurs** : peu communs.
- **Legends of Runeterra** (personnages, lieux, sorts, objets ; tout sauf les cartes de champion) : jetons et communs → commun, rare → peu commun, épique → épique pour un personnage ou un lieu, rare pour un sort.

## Boosters (décidé le 2026-10-12)

Tout est réglé dans `src/lib/booster.ts`.

- **Rythme** : un booster par heure, huit en réserve au plus. Un nouveau joueur commence avec la réserve pleine.
- **Contenu** : cinq cartes différentes. Les quatre premières suivent la table ci-dessous ; la dernière est au moins rare.
- **God pack** : un booster sur cinq mille contient une carte de chaque rareté à partir d'épique (épique, légendaire, mythique, ultime, transcendant).
- **Doublons** : une carte déjà possédée n'entre pas en double dans la collection, elle est convertie en essence.

| Rareté | Cartes 1 à 4 | Dernière carte | Essence du doublon |
|---|---|---|---|
| Commun | 55 % | — | 5 |
| Peu commun | 30 % | — | 10 |
| Rare | 11 % | 78 % | 25 |
| Épique | 3,2 % | 18 % | 60 |
| Légendaire | 0,65 % | 3,3 % | 150 |
| Mythique | 0,12 % | 0,55 % | 400 |
| Ultime | 0,025 % | 0,12 % | 1 200 |
| Transcendant | 0,005 % | 0,03 % | 4 000 |

Objectif d'équilibre : environ un an pour avoir la plupart des cartes en jouant chaque jour, les paliers hauts restant un accomplissement. Une simulation d'un an (une visite par jour, 8 boosters) donne 76 % du catalogue, 38 % des légendaires, 11 % des mythiques, avant toute dépense d'essence.

## Essence, secret et sceau de forge (décidé le 2026-10-13)

Tout est réglé dans `src/lib/forge.ts`.

- **Essence, deux étages.** En dessous de légendaire, on achète la carte exacte depuis le catalogue. À partir de légendaire, on forge une carte au hasard dans la rareté choisie, toujours une que l'on n'a pas.

| Rareté | Mode | Prix |
|---|---|---|
| Commun | achat direct | 30 |
| Peu commun | achat direct | 60 |
| Rare | achat direct | 150 |
| Épique | achat direct | 400 |
| Légendaire | forge au hasard | 1 500 |
| Mythique | forge au hasard | 5 000 |
| Ultime | forge au hasard | 20 000 |
| Transcendant | forge au hasard | 60 000 |

- **Secret.** Les cartes en dessous de légendaire sont toujours visibles, éteintes tant qu'on ne les possède pas. À partir de légendaire, une carte reste une silhouette mystère jusqu'à ce qu'un joueur du groupe la trouve ; elle est alors révélée à tous, avec le nom de celui qui l'a découverte. Les cartes secrètes non découvertes ne sont jamais envoyées au navigateur.
- **Sceau de forge.** Un point par jour où l'on ouvre au moins un booster (jour compté à l'heure de Paris). La jauge ne se vide jamais. Sur chaque cycle de 28 jours : une carte mythique au jour 14, une ultime au jour 21, une transcendante au jour 28, toujours une carte que le joueur n'a pas. S'il les a toutes, il reçoit le prix de forge en essence.

## Chromas et rangs (décidé le 2026-10-13)

Réglé dans `src/lib/upgrades.ts`. Un doublon ne donne plus toujours de l’essence :

- **Skin avec chromas** : chaque doublon donne un chroma à choisir parmi ceux du skin, jusqu’à les avoir tous. Le chroma porté colore le cadre de la carte et teinte son illustration ; on peut en changer ou revenir à l’original à tout moment.
- **Skin « héros de guerre »** : chaque doublon monte la carte d’un rang, de Fer à Challenger (dix rangs, le premier exemplaire est Fer). Le cadre prend le métal du rang ; à partir d’Émeraude un reflet parcourt la carte, à partir de Maître le cadre pulse, Challenger est irisé. Un skin héros de guerre monte en rang et ne débloque pas de chromas.
- Une fois tous les chromas ou le rang Challenger atteints, et pour toutes les autres cartes, le doublon redevient de l’essence.
