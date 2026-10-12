# Product

<!-- impeccable:product-schema 1 -->

Détail du périmètre et des règles de jeu : `docs/PRD.md`. Ce fichier ne garde que ce qui oriente le design.

## Platform

web

## Users

Yanis et quelques amis, tous joueurs de League of Legends qui connaissent champions, skins et lore par cœur. Ils jouent autant sur téléphone que sur ordinateur : aucun des deux n'est une version dégradée.

## Product Purpose

Jeu privé de collection de cartes League of Legends, dans l'esprit de Wikimaster : ouvrir des boosters, tomber sur une carte rare, compléter sa collection avant ses amis. Réussi si les amis reviennent ouvrir leurs boosters sans qu'on le leur rappelle.

## Positioning

Chaque carte est un vrai morceau de League of Legends (champion, skin, compétence, objet, personnage secondaire, lieu, récit) et sa rareté suit une logique que les joueurs reconnaissent : palier Riot, difficulté d'obtention réelle, ancienneté.

## Operating Context

- Rituel court et répété : ouvrir un booster, regarder ce qui sort, comparer avec les amis.
- Consultation plus longue de la collection, la sienne et celle des autres.
- Les cartes non possédées apparaissent en silhouette mystère : on voit qu'une carte existe et sa rareté, pas son image ni son nom.

## Capabilities and Constraints

- Catalogue de 8 729 cartes dans `src/data/cards.json`, 25 types, 8 paliers de rareté (commun, peu commun, rare, épique, légendaire, mythique, ultime, transcendant).
- Face d'une carte : image, nom, rareté. Sous-titre, texte d'ambiance et lien vers le récit n'apparaissent qu'à l'ouverture de la carte.
- Images très hétérogènes, servies depuis les CDN de Riot, jamais copiées ni optimisées par un service payant : visuel vertical + splash paysage (champions, skins), grande illustration (Legends of Runeterra), image paysage (récits, vidéos, régions), simple icône de 64 px (compétences, sorts d'invocateur, runes, objets).
- Les skins portent des chromas (nom + deux couleurs) qui donneront un effet coloré à la carte.
- Pas encore construit : comptes, boosters, collection des amis. Hors périmètre : combats, échanges, achats.
- Tout reste sur des paliers gratuits.

## Brand Commitments

- La direction artistique doit faire clairement écho à League of Legends ; un résultat qui n'y fait pas assez penser est raté.
- Elle ne doit pas être trop sage : c'est un jeu, pas un tableau de bord.
- Les raretés doivent se distinguer d'un coup d'œil.
- Interface en français, tutoiement.
- Nom du jeu : non décidé (« WikiMasterLOL » est un nom de travail).

## Evidence on Hand

- Illustrations officielles de Riot pour chaque carte (URL dans le catalogue).
- Aucun logo, aucune typographie ni aucun asset propre au projet.

## Product Principles

- L'illustration est la vedette ; l'interface la sert.
- La rareté se lit avant le nom.
- Le mystère fait partie du jeu : ce qu'on n'a pas encore reste caché.
- Téléphone et ordinateur à égalité.
