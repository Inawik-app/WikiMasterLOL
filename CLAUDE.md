# WikiMasterLOL

@AGENTS.md

## Le projet en deux phrases

Jeu de collection de cartes League of Legends dans l'esprit de Wikimaster : on ouvre des boosters, on complète sa collection de champions, skins et cartes de l'univers Runeterra. Usage privé, Yanis et quelques amis. Stade : prototype (rien de déployé).

## Stack

TypeScript · Next.js 16 (App Router, React 19) · Tailwind 4 · Supabase (Auth + Postgres, palier gratuit) · Vercel (palier Hobby) · npm · Node 24.

## Commandes

| Action | Commande |
|---|---|
| Installer | `npm install` |
| Lancer en local | `npm run dev` |
| Tests | `npm test` |
| Lint et types | `npm run lint` · `npx tsc --noEmit` |
| Build | `npm run build` |
| Régénérer le catalogue de cartes | `npm run cards` |
| Déployer | push sur `main` (Vercel, pas encore relié) |

## Où trouver quoi

| Sujet | Document |
|---|---|
| Structure, frontières, où placer du code | `docs/ARCHITECTURE.md` |
| Ce qu'on construit et ce qu'on ne construit pas | `docs/PRD.md` |
| Couleurs, typographie, composants | `docs/DESIGN-SYSTEM.md` |
| Schéma, migrations, index | `docs/DATABASE.md` |
| Authentification, droits, secrets | `docs/SECURITY.md` |
| Conventions de code | `docs/CODE-STYLE.md` |
| Quoi tester et comment | `docs/TESTING.md` |

Lire le document du domaine touché avant de le modifier. Pas les autres.

## Interdits

- Ne jamais éditer `src/data/cards.json` ni `public/emblems/` à la main : ils sont générés par `npm run cards`. Les cartes écrites à la main vivent dans `scripts/handmade.ts`.
- Le tirage d'un booster ne se fait jamais côté client.
- La clé `SUPABASE_SERVICE_ROLE_KEY` ne quitte jamais le serveur (pas de préfixe `NEXT_PUBLIC_`).
- Ne pas copier les images Riot dans le dépôt : elles sont servies depuis leurs CDN.
- Pas de migration sur la base Supabase ni de déploiement sans accord.

## Pièges connus

- Next.js 16 diffère de ce que Claude connaît : lire `node_modules/next/dist/docs/` avant d'utiliser une API (voir `AGENTS.md`).
- `create-next-app` refuse les majuscules du nom de dossier : le paquet s'appelle `wikimaster-lol`.
- Le projet est sur un lecteur réseau (Z:) : `next dev` ne voit pas toujours les fichiers modifiés. Si un changement de CSS ou de composant n'apparaît pas, redémarrer le serveur avant de chercher un bug.
