# Système de design

Direction choisie le 2026-10-12 : **Forge Hextech**. Les jetons vivent dans `src/app/globals.css` (bloc `@theme` et `[data-rarity]`) ; ce document dit à quoi ils servent. Contexte produit : `PRODUCT.md`. Intention de la page catalogue : `.impeccable/surfaces/src-app-page-tsx.md`.

## Intention

L'atelier où l'on forge le butin de League of Legends. La rareté est une matière, pas une étiquette : chaque carte est une pièce forgée, sertie d'une gemme qui dit son palier avant qu'on lise son nom. L'illustration occupe toute la carte ; l'interface autour reste sombre et s'efface.

À ne pas évoquer : un tableau de bord, une grille neutre de vignettes avec badge de couleur, une copie du client LoL bleu nuit et or.

## Couleurs

Thème sombre uniquement : on joue le soir, à côté du client LoL ou sur son téléphone.

| Rôle | Jeton | Valeur |
|---|---|---|
| Fond d'atelier | `forge-950` | `#050f12` |
| Surface | `forge-900` | `#0a1b20` |
| Surface relevée, survol | `forge-800` | `#10282f` |
| Bordure discrète | `forge-700` | `#1c3c45` |
| Texte | `ivory` | `#ece5d3` |
| Texte secondaire | `mist` | `#9db4b5` |
| Structure : rails, filets, cadres | `brass` / `brass-dim` | `#c9a55c` / `#86713f` |
| Énergie : focus, lueur | `hextech` | `#5ad7e6` |
| Sélection et action principale | `ember` | `#f08a3c` |

Trois rôles, jamais mélangés : le laiton structure, le cyan hextech éclaire, l'orange braise marque ce qui est choisi ou cliquable en priorité.

## Raretés

Chaque palier a une couleur **et** une forme de gemme propres, pour rester lisible sans la couleur. Poser `data-rarity` sur un élément lui donne `--gem`.

| Palier | Gemme | Couleur |
|---|---|---|
| Commun | rivet rond | `#8d979c` |
| Peu commun | carré | `#58b97e` |
| Rare | losange | `#4b8df5` |
| Épique | hexagone | `#a274f5` |
| Légendaire | écu | `#f2613c` |
| Mythique | navette | `#f04fa9` |
| Ultime | étoile à huit branches | `#f5c44e` |
| Transcendant | étoile à douze branches | prismatique |

Montée en puissance : le biseau de la carte prend la teinte de sa gemme à tous les paliers ; à partir de légendaire la gemme éclaire l'illustration de l'intérieur ; ultime et transcendant ont en plus un reflet qui traverse la carte.

## Typographie

- Titres et noms de cartes : **Marcellus**, capitales pour les grands titres. Ses empattements évasés rappellent le lettrage historique de LoL.
- Interface : **Barlow Semi Condensed** (400, 500, 600), une voix d'atelier, compacte pour les filtres et les compteurs.
- Chiffres des compteurs en `tabular-nums`. Corps de texte à 1 rem minimum, tailles en `rem` ou `clamp()`.

## Espacement et mise en page

- Gouttière de page : `clamp(1rem, 4vw, 3.5rem)`.
- Grille de cartes : colonnes automatiques de 6,4 à 10,5 rem ; trois cartes de front sur téléphone, sept sur un écran de 1440 px.
- Un seul point de rupture, 720 px : le râtelier passe sur deux rangées, les types défilent horizontalement, la carte ouverte s'empile.

## Formes

Angles presque vifs : rayon de 2 à 4 px partout, jamais de pilule. Ombres portées vers le bas, décalées et floues ; la lueur colorée d'une gemme suit la même règle.

## Composants

- **Carte** (`CardFace`, classe `card`) : format 5:7, biseau qui s'épaissit avec la rareté (3, 4 puis 5 px), illustration plein cadre, plaque du nom en bas, gemme à facettes à cheval sur le bord supérieur. Le nom sur la carte est la seule exception à la taille de texte minimale. Variantes :
  - icône (compétences, sorts d'invocateur, runes, objets) : l'icône garde sa taille, sertie sur un fond flou de ses propres couleurs ;
  - paysage (`card--landscape` : récits, vidéos, bandes dessinées, régions) : l'image dans une fenêtre large, cadrée sur son point d'intérêt, au lieu d'un recadrage étroit ;
  - encadrée (`card--framed`) : skins qui ont en jeu une bordure spéciale ou une signature de joueur pro ; l'illustration d'écran de chargement entière, avec les calques officiels par-dessus ;
  - grande (`card--large`) ;
  - mystère (`card--locked`) : cadre et gemme seuls, ni image ni nom.
- **Râtelier** (`rack`) : les huit gemmes sur un rail de laiton, filtre de rareté avec compteurs.
- **Onglets de type** (`tabs`) : texte seul, fond braise quand actif.
- **Recherche**, **interrupteur**.
- **Enclume** (`anvil`) : `<dialog>` natif qui présente la carte ouverte. Deux mises en page :
  - carte à icône ou à image carrée : la grande carte à gauche, le texte à droite ;
  - grande illustration (`anvil--wide`) : l'œuvre entière, non recadrée, remplit la fenêtre ; le texte est posé sur son bord droit et un bouton « Masquer le texte » le range. Sur téléphone le texte passe dessous. Une carte encadrée y montre aussi sa miniature, pour qu'on voie bordure et signature.
  - Le texte comprend le nom, un sous-titre (« Avec … » pour les champions d'un récit), la rareté, une description et, s'il y en a, une liste de faits (délai, coût, prix, statistiques).

États prévus pour chaque contrôle : repos, survol, focus visible (contour hextech), actif, désactivé.

## Mouvement

Une seule courbe, `--ease-forge`. Le moment fort actuel est l'ouverture d'une carte : elle prend la lumière de sa gemme, qui suit le pointeur ; les cartes à icône s'inclinent en plus vers lui. Le prochain sera l'ouverture d'un booster. `prefers-reduced-motion` coupe l'inclinaison, les reflets et les transitions.

## Icônes et images

- Icônes d'interface dessinées en SVG, trait de 2, bouts arrondis. Pas d'emoji.
- Illustrations servies depuis les CDN Riot, jamais copiées ; balise `<img>` simple, pas `next/image` (quota d'optimisation). Seul le CDN du site Universe sait redimensionner (`&w=`).
- Limite connue : les illustrations Legends of Runeterra pèsent environ 700 Ko chacune.

## Ton rédactionnel

Français, tutoiement, vocabulaire de la forge quand il vient naturellement (« forger », « sertie », « enclume »), sans en faire un jeu de mots à chaque ligne.

## Interdits

- Pas de bleu nuit et or façon client LoL à la place du pétrole et du laiton.
- Pas de dégradé sur du texte, pas de verre dépoli décoratif, pas de coins très arrondis.
- Pas de rareté indiquée par la seule couleur.
- Pas de quatrième couleur d'interface : les couleurs vives appartiennent aux gemmes et aux illustrations.
