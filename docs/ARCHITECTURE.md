# Architecture

## 1. Qu'y a-t-il dans le système ?

```
Sources Riot (JSON)  ──npm run cards──►  src/data/cards.json  (catalogue, versionné)
                                                │
Navigateur ──► Next.js sur Vercel (pages serveur + Server Actions) ──► Supabase (Auth + Postgres)
     └── images : CDN Data Dragon / CommunityDragon / cmsassets.rgpub.io
```

Sources du catalogue, toutes en JSON (aucun scraping) :

- champions : `ddragon.leagueoflegends.com/cdn/<version>/data/fr_FR/champion.json`
- skins et paliers de rareté : `raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/fr_fr/v1/skins.json`
- univers : `universe-meeps.leagueoflegends.com/v1/fr_fr/` (`faction-browse`, `champion-browse`, `search`)

## 2. Qui est responsable de quoi ?

| Responsabilité | Module propriétaire |
|---|---|
| Identité et session | Supabase Auth, via `src/lib/supabase/` |
| Catalogue de cartes (contenu, rareté) | `scripts/build-cards.ts` → `src/data/cards.json` |
| Tirage d'un booster (probabilités, limites) | `src/lib/booster.ts`, appelé par une Server Action |
| Collection des joueurs | table Postgres `collection` |

## 3. Pourquoi est-ce construit ainsi ?

- 2026-10-12 — Catalogue en fichier JSON généré, pas en base : ~2 400 cartes en lecture seule qui ne changent qu'à chaque patch. Écarté : table `cards` (une migration de données à chaque patch pour rien).
- 2026-10-12 — Rareté = palier officiel Riot (champ `rarity` de CommunityDragon). Écarté : popularité en jeu (source externe, change à chaque patch).
- 2026-10-12 — Tirage dans une Server Action avec la clé de service, écriture interdite aux clients par RLS : empêche de s'offrir des cartes depuis le navigateur. Écarté : fonction PL/pgSQL (plus dure à lire et à tester).
- 2026-10-12 — Images servies depuis les CDN Riot : pas de stockage, pas de quota. Risque accepté : une URL peut changer à un patch, `npm run cards` la régénère.

## 4. Qui a le droit de toucher quoi ?

`src/app` (pages, actions) → `src/lib` (règles, accès Supabase) → `src/data` (catalogue). Jamais dans l'autre sens.

Interdit explicitement :

- Un composant client n'écrit jamais dans Supabase.
- Rien en dehors de `src/lib/booster.ts` ne décide quelles cartes sortent.
- Le site n'appelle jamais les sources Riot à l'exécution : seulement le script de génération.

## 5. Comment circulent les données ?

Ouverture d'un booster : clic → Server Action → lecture de la session (qui est le joueur) → vérification du droit d'ouvrir (limite) → tirage dans `cards.json` → écriture dans `collection` avec la clé de service → renvoi des cartes tirées → animation côté client.

## 6. Qu'est-ce qui n'est pas négociable ?

- Les secrets restent côté serveur.
- Chaque règle métier a un seul emplacement.
- Aucune frontière n'est traversée en silence.
- Aucun nouveau patron ni nouvelle dépendance sans raison écrite ici.
- Tout reste dans les paliers gratuits de Vercel et Supabase.

## 7. Où va le nouveau code ?

| Je veux ajouter | Ça va dans |
|---|---|
| Une page | `src/app/<route>/page.tsx` |
| Un composant d'interface | `src/components/` |
| Une règle de jeu | `src/lib/` |
| Un type de carte ou une source | `scripts/build-cards.ts` |
| Une table ou un champ | `supabase/migrations/` + `docs/DATABASE.md` |

## 8. Quand Claude s'arrête-t-il pour demander ?

Dès qu'une tâche oblige à enfreindre une règle de ce document :

1. s'arrêter ;
2. nommer le conflit ;
3. montrer ce qu'il affecte ;
4. proposer le plus petit correctif qui ne l'enfreint pas.

Aussi : changement de schéma, suppression de données, nouvelle dépendance, tout service qui pourrait devenir payant.
