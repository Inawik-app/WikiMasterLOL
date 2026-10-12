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
| Catalogue | — | `npm run cards` produit un JSON avec champions, skins, compétences, sorts d'invocateur, runes, objets, récits, vidéos, cartes d'univers, e-sport, Teamfight Tactics, monstres, cartes, modes, musiques et personnalités, chacune avec une rareté et une image |
| Compte | se connecter | la collection est retrouvée depuis un autre appareil |
| Booster | ouvrir un booster et découvrir ses cartes | les cartes tirées apparaissent dans sa collection ; la limite d'ouverture est respectée côté serveur |
| Collection | parcourir ses cartes, filtrer par type et rareté, voir sa progression | le compteur « x / total » est juste |
| Amis | voir la collection d'un autre joueur | la page d'un ami affiche ses cartes en lecture seule |

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

- À DÉCIDER : rythme des boosters (un par jour ? toutes les X heures ? cumulables ?).
- À DÉCIDER : taille d'un booster et probabilités par rareté ; garantie d'une carte rare ou non.
- À DÉCIDER : que faire des doublons (simple compteur, ou recyclage en quelque chose).
- À DÉCIDER : comment débloquer les différents chromas d'un skin (voir « Chromas »).
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

## Chromas

Un chroma n'est pas une carte : c'est une variante d'une carte de skin. Quand un skin sort d'un booster, il peut sortir avec un effet visuel aux couleurs d'un de ses chromas, tiré au hasard. Le catalogue contient déjà les chromas de chaque skin (nom et couleurs).
