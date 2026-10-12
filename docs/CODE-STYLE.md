# Style de code

## Outils

- Linter : ESLint (`eslint-config-next`) — `npm run lint`.
- Types : TypeScript strict — `npx tsc --noEmit`.
- Formateur : aucun installé. Suivre le style des fichiers générés par `create-next-app` (deux espaces, guillemets doubles, points-virgules).

## Arborescence

```
scripts/        génération du catalogue (hors site)
src/app/        pages, layouts, Server Actions
src/components/ composants d'interface
src/lib/        règles de jeu, clients Supabase
src/data/       cards.json généré
supabase/       migrations SQL
docs/           documents de référence
```

Les appels aux sources Riot vivent uniquement dans `scripts/`.

## Nommage

- Code, identifiants, commits : anglais. Textes d'interface : français.
- Fichiers de composants en `PascalCase.tsx`, le reste en `kebab-case.ts`.
- Tables et colonnes SQL en `snake_case`.

## Règles

- Composants serveur par défaut ; `"use client"` seulement pour l'interactivité (animation d'ouverture, filtres).
- Pas de dépendance ajoutée pour ce que la plateforme ou quelques lignes font déjà.
- Pas d'abstraction avant le deuxième usage réel.
- Un raccourci assumé se signale par un commentaire `ponytail:` qui nomme sa limite.

## Commits

Messages en anglais, à l'impératif, un sujet par commit.
