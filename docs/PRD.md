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
| Catalogue | — | `npm run cards` produit un JSON avec champions, skins et cartes d'univers, chacune avec une rareté et une image |
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
- À DÉCIDER : rareté des cartes sans palier Riot — champions de base, skins `kNoRarity` (665 anciens skins), cartes d'univers.
- À DÉCIDER : contenu exact des cartes d'univers (régions seules, ou aussi nouvelles et personnages de lore).
- À DÉCIDER : inclure ou non les chromas.
- À DÉCIDER : nom du jeu.
