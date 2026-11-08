# WikiMasterLOL

Jeu de collection de cartes League of Legends entre amis : on ouvre des boosters, on tombe sur une carte rare, on complète sa collection avant les autres.

Projet privé, au stade de prototype.

## Le jeu

- **8 729 cartes** générées automatiquement à partir des données publiques de Riot : champions, skins, compétences, objets, lieux, récits… réparties en 25 types.
- **8 niveaux de rareté** (de commun à transcendant), fondés sur ce que les joueurs reconnaissent : palier du skin, difficulté d'obtention, ancienneté.
- Les cartes qu'on ne possède pas apparaissent en **silhouette mystère** : on voit qu'elles existent et leur rareté, mais pas leur image.
- Interface pensée autant pour le téléphone que pour l'ordinateur.

## Choix techniques

- **Le tirage des boosters se fait côté serveur**, jamais dans le navigateur : impossible de tricher en modifiant le client.
- **Supabase** (Auth + Postgres) protégé par des règles de sécurité au niveau des lignes ; la clé d'administration ne quitte jamais le serveur.
- **Catalogue généré par script** (`npm run cards`) à partir des données Riot. Les images ne sont pas copiées dans le dépôt : elles sont servies depuis les CDN de Riot.
- Tout tient sur des offres gratuites (Supabase, Vercel).
- Documentation dans `docs/` : architecture, base de données, sécurité, design system, tests.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase · Vercel

## Lancer le projet

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés Supabase
npm run dev                  # http://localhost:3000
npm test
```

---

Projet de fan, non approuvé par Riot Games. League of Legends et les visuels associés sont la propriété de Riot Games, Inc.
