# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Français** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Installer le userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![Licence : MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.13.0-green?style=for-the-badge)](CHANGELOG.md)

Un userscript pour la boutique Steam et Steam Community qui ajoute des informations supplémentaires sur les jeux depuis [GameStatus.info](https://gamestatus.info) — protection, dates de sortie, notes, configuration matérielle, etc.

Pendant votre navigation sur Steam, des badges d’information compacts apparaissent sur les cartes de jeux et dans l’en-tête de la page du jeu, sans quitter la boutique.

Compatible avec [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat et d’autres gestionnaires prenant en charge le bloc de métadonnées `// ==UserScript==`.

## Installation rapide

1. Installez un gestionnaire de userscripts (Tampermonkey ou Violentmonkey recommandés).
2. Cliquez sur le lien d’installation ci-dessous — votre gestionnaire devrait ouvrir une boîte de dialogue d’installation.

**URL d’installation :**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![Installer](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### Installer depuis une URL (tableau de bord)

| Gestionnaire | Chemin |
|---------|------|
| Tampermonkey | Tableau de bord → **Utilities** → **Install from URL** |
| Violentmonkey | Tableau de bord → **+** → **Install from URL** |
| Greasemonkey | Menu de l’extension → **New User Script** → collez l’URL brute |

Collez l’URL d’installation indiquée ci-dessus.

### Installation manuelle

1. Ouvrez [`steam-gamestatus.user.js`](steam-gamestatus.user.js) dans ce dépôt.
2. Copiez l’intégralité du contenu du fichier.
3. Dans votre gestionnaire de userscripts, créez un nouveau script et collez le code.
4. Enregistrez et activez le script.

## Mises à jour

Le script inclut les métadonnées `@updateURL` et `@downloadURL` pointant vers le fichier brut sur GitHub. Les gestionnaires compatibles vérifient automatiquement les mises à jour (Tampermonkey : Tableau de bord → intervalle de vérification ; Violentmonkey : similaire).

Les gestionnaires comparent la `@version` installée avec les métadonnées distantes pour décider s’il faut proposer une mise à jour.

## Fonctionnalités

- **Panneau de réglages** — bouton dans l’en-tête pour définir la position et la taille des badges, la position de la carte, la durée du cache, vider le cache et afficher ou non les badges « Absent de la base »
- **Badges de statut sur les cartes de jeux** — accueil de la boutique, résultats de recherche, listes de souhaits, pages de soldes et autres listes contenant des liens `/app/{id}`
- **Badge de statut sur les pages de jeux** — chip compact dans `.apphub_OtherSiteInfo`, à côté des liens Community Hub / Store Page
- **Infobulles détaillées** — popovers à la Steam avec jaquette, chips de statut, notes colorées et détails matériels
- **Statuts codés par couleur** — analyse visuelle rapide d’une longue liste de jeux
- **Chargement différé** — les badges ne se chargent que lorsque les cartes entrent dans la zone visible
- **Cache intelligent** — les réponses sont mises en cache localement pour réduire la charge de l’API et accélérer les visites répétées
- **Interface à la Steam** — badges au style de `.app_tag` de Steam, infobulles comme les popovers de la boutique
- **10 langues d’interface** — anglais, russe, chinois, espagnol, portugais, allemand, français, japonais, coréen et polonais (détectées selon la langue du navigateur)

## Pages prises en charge

| Site | Motif d’URL |
|------|-------------|
| Boutique Steam | `https://store.steampowered.com/*` |
| Steam Community (hub de l’app) | `https://steamcommunity.com/app/*` |

## Couleurs des statuts

Chaque badge possède un point coloré qui reflète le statut du jeu sur GameStatus.info :

| Couleur | Statut | Signification |
|-------|--------|---------|
| Vert | Prêt | Le statut indique que le jeu est prêt / disponible |
| Orange | En attente (récent) | Statut en attente ; le jeu est sorti il y a moins d’un mois |
| Rouge | En attente (attente longue) | Statut en attente ; le jeu est sorti il y a plus d’un mois |
| Orange | Contournement de protection | Le statut indique une méthode de contournement de la protection |
| Bleu | Sortie aujourd’hui | Le jeu sort aujourd’hui ; le statut peut encore être en attente |
| Gris | Statut inconnu / absent de la base | Statut incertain ou jeu introuvable sur GameStatus.info |
| Bleu (spinner) | Chargement | Les données sont récupérées depuis l’API |

Cliquer sur un badge ouvre la page du jeu sur GameStatus.info (ou la page d’accueil du site si le jeu n’a pas été trouvé).

## Contenu de l’infobulle

Survoler un badge ouvre un popover à la Steam qui peut afficher :

- **En-tête** — jaquette, titre, chip de statut, chips AAA / protection / groupe
- **Dates** — dates de sortie et de mise à jour du statut, Steam ID, abonnements
- **Notes** — valeurs GameStatus et Metacritic avec des couleurs à la Metacritic (vert ≥75, jaune ≥50, rouge en dessous)
- **Configuration** — CPU, RAM, GPU et OS lorsqu’ils sont disponibles
- **Description** — courte description du jeu
- **Pied** — bouton de soutien et liens API / GameStatus

Si un jeu n’est pas dans la base de données, le popover affiche le chip « Absent de la base » et liste les URL d’API essayées lors de la recherche.

## Réglages

Ouvrez **GameStatus** dans l’en-tête Steam (ou dans le menu du gestionnaire de userscripts) pour configurer :

| Réglage | Par défaut | Remarques |
|---------|---------|--------|
| Position du badge (verticale / horizontale) | Haut / Gauche | Badges des cartes uniquement ; les chips des pages de jeux restent dans l’en-tête |
| Position de la carte | Gauche | Où la carte GameStatus s’ouvre à côté du jeu ; bascule vers le côté suivant disposant de place |
| Taille du badge | Moyenne | Petite / Moyenne / Grande / Très grande ; badges des cartes uniquement |
| Afficher les badges « Absent de la base » | Activé | Si désactivé, les cartes sans correspondance restent sans marquage |
| Durée du cache (heures) | 6 | S’applique à toutes les requêtes mises en cache ; maximum 168 (7 jours) |
| Vider le cache | — | Immédiat ; aucune sauvegarde nécessaire |

## Pour les développeurs

Cette section a été déplacée vers des guides dédiés :

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — build, tests locaux, configuration, publication
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — fonctionnement, structure du dépôt, métadonnées, permissions
- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow de contribution et checklist de PR
- [AGENTS.md](AGENTS.md) — instructions pour les agents IA
- [SECURITY.md](SECURITY.md) — politique de sécurité et signalement privé

## Source des données

Toutes les données de jeu proviennent de l’API publique GameStatus.info :

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

Ce projet n’est **pas affilié** à Valve, Steam ou GameStatus.info. Les informations de statut sont maintenues par la communauté et peuvent être incomplètes ou obsolètes. Utilisez-les comme référence, pas comme garantie.

## Licence

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
