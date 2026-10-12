# Tests

## Outils

Lanceur intégré à Node (`node --test`), qui exécute le TypeScript directement depuis Node 24 : aucune dépendance. Commande : `npm test`. Les tests vivent à côté du fichier testé (`*.test.ts`).

## Quoi tester

Seulement la logique qui peut être fausse sans que ça se voie :

- le tirage d'un booster : taille, répartition des raretés sur un grand nombre de tirages, respect de la limite ;
- la génération du catalogue : chaque carte a un identifiant unique, une rareté connue et une URL d'image.

## Quoi ne pas tester

Les pages, les composants d'affichage, Supabase lui-même. Ils se vérifient à l'œil dans le navigateur.

## Avant de dire « c'est fait »

`npm run lint`, `npx tsc --noEmit`, `npm test`, puis le parcours principal de `docs/PRD.md` à la main dans le navigateur.

## Tests de bout en bout

Aucun. À reconsidérer si le parcours principal casse deux fois sans qu'on le voie.
