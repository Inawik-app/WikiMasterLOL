---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Catalogue (page d'accueil)

Scope: `src/app/page.tsx`, `src/components/`. Mode: Experience — les cartes mènent, l'interface s'efface.

Audience et tâche: joueurs de LoL qui parcourent les cartes, filtrent par type et rareté, ouvrent une carte pour la regarder de près. Cette page montre tout le catalogue ; la future page de collection réutilisera la même grille avec l'état « silhouette mystère » pour les cartes non possédées.

Moment mémorable: la carte qu'on ouvre prend la lumière de sa gemme. Les cartes à icône se posent sur l'enclume et s'inclinent sous le doigt ; les cartes à grande illustration (champions, skins, récits, vidéos, régions, personnages, lieux) montrent l'œuvre entière, avec le texte posé sur son bord droit et un bouton pour le ranger. Adaptation demandée par l'utilisateur après la première version.

Ajouts demandés ensuite par l'utilisateur: description et faits à l'ouverture pour régions, compétences, objets, runes et sorts d'invocateur ; fenêtre paysage sur les cartes de récit ; liste des champions d'un récit (« Avec … ») ; bordures spéciales et signatures de joueurs pro superposées sur les skins qui en ont une en jeu.

Non résolu: nom du jeu ; poids des illustrations Legends of Runeterra (~700 Ko chacune, non redimensionnées) ; effet de chroma sur les skins.

## Direction contract

THESIS: Forge Hextech. La rareté est une matière, pas une étiquette : chaque carte est une pièce forgée, sertie d'une gemme dont la taille et la couleur disent le palier avant qu'on lise le nom. Refuse la grille neutre de vignettes avec badge de couleur, et la copie du client LoL bleu nuit et or.

OWN-WORLD: fond d'atelier bleu pétrole presque noir, gravé d'un nid d'abeilles à peine visible ; laiton pour toute la structure (rails, biseaux, filets) ; lueur cyan hextech pour l'énergie et le focus ; orange braise pour la sélection. Huit gemmes de formes distinctes (rivet, carré, losange, hexagone, écu, navette, étoile à huit branches, étoile à douze branches). Titres en Marcellus capitales, interface en Barlow Semi Condensed.

STORY: le visiteur comprend d'un regard l'échelle des huit raretés, voit les pièces les plus rares en premier, filtre, puis ouvre une carte pour l'admirer.

FIRST VIEWPORT: en haut, sous une lueur hextech, le titre en grandes capitales à gauche et la phrase de compte. Juste dessous, sur toute la largeur, le râtelier : huit gemmes posées sur un rail de laiton, chacune avec son nom et son nombre de cartes, servant de filtre de rareté. Puis une ligne d'onglets gravés pour les types et la recherche. La grille commence dans le premier écran, cartes les plus rares d'abord.

FORM: direction choisie par l'utilisateur parmi les candidates issues de l'univers de LoL (troisième de la liste ordonnée) ; seed: none (unavailable).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
