# Sécurité

Enjeu faible (jeu privé, aucune donnée sensible, aucun paiement). On protège surtout l'équité du jeu et les secrets.

## Ce qu'on protège

1. La clé de service Supabase (elle contourne toutes les règles d'accès).
2. L'intégrité des collections : personne ne s'ajoute de cartes, n'ouvre plus de boosters que permis, ni ne dépense de l'essence qu'il n'a pas.
3. Le secret des cartes rares non découvertes : elles ne figurent dans aucune page envoyée au navigateur.
4. Les identifiants de connexion des amis.

## Authentification

Supabase Auth, session en cookie via `@supabase/ssr`. Décidé le 2026-10-12 :

- Connexion par Discord uniquement. Aucun mot de passe n'est géré par le site.
- Accès ouvert : toute personne qui a le lien du site peut créer un compte et jouer. Aucune liste d'invités ni validation.
- La connexion se termine dans le navigateur (`src/lib/supabase/client.ts`). La lecture de la session côté serveur arrivera avec les boosters.

## Autorisation

| Rôle | Peut lire | Peut modifier |
|---|---|---|
| Visiteur non connecté | le catalogue des cartes, public par nature | rien |
| Joueur connecté | son profil, sa collection, ses amitiés ; via le serveur : la liste des joueurs, la collection de ses amis, les découvreurs des cartes rares | rien directement ; ouvre des boosters, ajoute ou retire un ami, supprime son compte via le serveur |

La collection d'un autre joueur n'est lisible que s'il est ami : vérifié dans la Server Action, et RLS ne laisse lire que ses propres lignes. L'amitié ne demande pas d'accord : c'est dit dans les mentions légales.

Le site est ouvert à tout compte Discord. Mentions légales, confidentialité et règles sont sur `/mentions-legales` ; la suppression du compte s'y fait en un clic (`deleteAccount`). L'adresse de contact vient de `NEXT_PUBLIC_CONTACT_EMAIL`. Les moteurs de recherche sont écartés (`robots` dans `layout.tsx`). En-têtes de sécurité dans `next.config.ts`, sans CSP complète.

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
