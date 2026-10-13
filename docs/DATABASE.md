# Base de données

Un seul projet Supabase sert au développement et au jeu réel (décidé le 2026-10-12). Schéma : fichiers de `supabase/migrations/`, à appliquer dans l'ordre.

## Moteur et accès

Postgres chez Supabase, palier gratuit (500 Mo, mise en pause après 7 jours sans activité). Client `@supabase/supabase-js`, pas d'ORM. Migrations SQL dans `supabase/migrations/`.

## Modèle

- `profiles` — un par joueur (`id` = `auth.users.id`, pseudo, avatar). Créé par un déclencheur à la première connexion, à partir du nom et de l'avatar Discord.
- `profiles` porte aussi la réserve de boosters (`booster_anchor` : les boosters se comptent à partir de cet instant, un par heure, huit au plus) et l'essence.
- `profiles` porte enfin le sceau de forge : `seal_days` (jours joués), `seal_last_day` (dernier jour compté, heure de Paris), `seal_claimed_day` (dernier palier récupéré).
- `claim_seal` et `spend_essence` — fonctions qui récupèrent une récompense du sceau et qui paient une carte en essence, chacune en une transaction. Seul le serveur peut les appeler.
- `discoveries` — vue : le premier joueur à avoir obtenu chaque carte. Sert à révéler les cartes secrètes au groupe.
- `open_booster` — fonction qui ouvre un booster en une seule transaction : elle retire un booster de la réserve, ajoute les cartes, convertit les doublons en essence. Seul le serveur peut l'appeler.
- `friendships` — une amitié = deux lignes `(user_id, friend_id)`, une dans chaque sens, écrites et supprimées ensemble par le serveur. Pas de demande à accepter.
- `collection` — une ligne par (joueur, carte). La colonne `copies` reste à 1 : les doublons deviennent de l'essence. `card_id` est l'identifiant de la carte dans `src/data/cards.json` : pas de table `cards`, donc pas de clé étrangère dessus.

Supabase renvoie au plus 1 000 lignes par requête : le serveur lit les collections page par page (`readAll` dans `src/app/actions.ts`).

À DÉCIDER : comment stocker les chromas obtenus (dépend de la mécanique de déblocage, voir `PRD.md`). Piste : une ligne par (joueur, carte, chroma).

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

RLS activée sur toutes les tables. Lecture : un joueur connecté ne lit que ses propres lignes (profil, collection, amitiés). Tout ce qui concerne les autres joueurs passe par le serveur. Écriture : aucune depuis le client ; seul le serveur écrit, avec la clé de service. Détail dans `SECURITY.md`.

## Données personnelles

| Donnée | Pourquoi | Durée de conservation | Suppression |
|---|---|---|---|
| Identifiant et adresse e-mail Discord (gardés par Supabase Auth) | se connecter | tant que le compte existe | suppression du compte dans Supabase |
| Pseudo et avatar Discord | les afficher aux autres joueurs | idem | idem |

## Sauvegardes

Aucune sur le palier gratuit. Risque accepté : perdre des collections de cartes entre amis.

## Données de test

Pas de base locale ni de jeu de données : on teste sur le projet unique, avec son propre compte Discord.
