# Base de données

Aucune base n'existe encore : ce document décrit ce qui est prévu.

## Moteur et accès

Postgres chez Supabase, palier gratuit (500 Mo, mise en pause après 7 jours sans activité). Client `@supabase/supabase-js`, pas d'ORM. Migrations SQL dans `supabase/migrations/`.

## Modèle

- `profiles` — un par joueur (`id` = `auth.users.id`, pseudo, état de la limite de boosters).
- `collection` — une ligne par (joueur, carte) avec un compteur d'exemplaires. `card_id` est l'identifiant de la carte dans `src/data/cards.json` : pas de table `cards`, donc pas de clé étrangère dessus.

À DÉCIDER : comment stocker les chromas obtenus (dépend de la mécanique de déblocage, voir `PRD.md`). Piste : une ligne par (joueur, carte, chroma).

À DÉCIDER : forme exacte de la limite de boosters dans `profiles` (dépend du rythme choisi dans `PRD.md`).

## Règles

- Toute clé étrangère est indexée.
- Les contraintes (unicité de `(user_id, card_id)`, non nul, compteur ≥ 1) sont dans la base.
- Pas de requête dans une boucle : l'écriture d'un booster est un seul `upsert` groupé.
- Requêtes paramétrées uniquement (le client Supabase le fait).
- Tables et colonnes en `snake_case`, tables au pluriel sauf `collection`.
- Suppression définitive ; supprimer un compte supprime sa collection en cascade.

## Migrations

Un fichier SQL numéroté par changement, appliqué à la main dans l'éditeur SQL de Supabase par Yanis. Une migration appliquée ne se modifie plus.

## Accès par ligne

RLS activée sur toutes les tables. Lecture : tout joueur connecté lit tous les profils et toutes les collections. Écriture : aucune depuis le client ; seul le serveur écrit, avec la clé de service. Détail dans `SECURITY.md`.

## Données personnelles

| Donnée | Pourquoi | Durée de conservation | Suppression |
|---|---|---|---|
| Identifiant de connexion (selon la méthode retenue) | se connecter | tant que le compte existe | suppression du compte dans Supabase |
| Pseudo | l'afficher aux amis | idem | idem |

## Sauvegardes

Aucune sur le palier gratuit. Risque accepté : perdre des collections de cartes entre amis.

## Données de test

À DÉCIDER : second projet Supabase gratuit pour le développement, ou un seul projet partagé avec la production.
