# Sécurité

Enjeu faible (jeu privé, aucune donnée sensible, aucun paiement). On protège surtout l'équité du jeu et les secrets.

## Ce qu'on protège

1. La clé de service Supabase (elle contourne toutes les règles d'accès).
2. L'intégrité des collections : personne ne s'ajoute de cartes ni n'ouvre plus de boosters que permis.
3. Les identifiants de connexion des amis.

## Authentification

Supabase Auth, session en cookie via `@supabase/ssr`.

- À DÉCIDER : méthode de connexion (Discord, lien magique par e-mail, ou e-mail + mot de passe).
- À DÉCIDER : comment restreindre l'accès aux amis (inscriptions fermées et comptes créés à la main, ou liste d'autorisés).

## Autorisation

| Rôle | Peut lire | Peut modifier |
|---|---|---|
| Visiteur non connecté | rien | rien |
| Joueur connecté | tous les profils et collections | rien directement ; ouvre des boosters via le serveur |

Le droit est vérifié dans la Server Action (qui est connecté, a-t-il un booster disponible) et verrouillé par RLS : aucune politique d'écriture pour les clients.

## Secrets

| Secret | Où il vit | Qui y accède |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | variables d'environnement Vercel, `.env.local` en local | serveur uniquement |

`NEXT_PUBLIC_SUPABASE_URL` et la clé publique Supabase sont exposées au navigateur : sans risque tant que RLS est activée sur toutes les tables. `.env*` est ignoré par git. Si un secret fuit : le régénérer dans Supabase, le remplacer dans Vercel.

## Entrées

Seules entrées utilisateur : le pseudo (longueur et caractères validés côté serveur) et l'action « ouvrir un booster » (aucun paramètre venant du client ne décide du contenu).

## Limitation des abus

La limite de boosters est contrôlée côté serveur, dans la même opération que l'écriture, pour qu'un double clic ne donne pas deux boosters. Limites de débit de connexion : celles de Supabase Auth.

## Services tiers

| Service | Données transmises | Vérification des webhooks |
|---|---|---|
| Supabase | identifiant de connexion, pseudo, collection | sans objet |
| Vercel | aucune donnée de joueur stockée | sans objet |
| CDN Riot / CommunityDragon | l'adresse IP du joueur, en chargeant les images | sans objet |

## Journalisation

Rien de spécifique. Ne jamais écrire de clé ni de jeton de session dans un log.

## En cas d'incident

Régénérer les clés Supabase, prévenir les amis sur leur canal habituel.
