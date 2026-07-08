# WebSIG — Recours aux soins des personnes du 3ᵉ âge à Yopougon

Tableau de bord cartographique interactif (WebSIG) construit à partir d'une enquête de terrain de thèse portant sur le **recours aux soins de santé des personnes du troisième âge en milieu urbain, cas de la commune de Yopougon** (Abidjan, Côte d'Ivoire).

> 726 personnes âgées enquêtées et géolocalisées · 115 variables · données nettoyées et harmonisées.

## 🔗 Voir le rendu en ligne

**➡️ https://juniorbaklers.github.io/websig-recours-soins-yopougon/**

## Ce que contient l'application

- **Carte** des enquêtés (Leaflet), coloriable par n'importe quelle variable (premier recours, sexe, âge, assurance, maladie…).
- **8 indicateurs clés** recalculés en direct selon les filtres.
- **Filtres multicritères** (sexe, âge, quartier, revenu, instruction, assurance…) qui s'appliquent à toutes les vues.
- **Analyse spatiale (SIG)** : 108 établissements de santé de Yopougon superposés, zones de couverture (buffers 500 m / 1 km), et **distance réelle** de chaque enquêté au centre le plus proche (public, privé, premier contact) calculée en projection métrique.
- **Grille d'échantillonnage (500 m)** : redistribution des 726 enquêtés sur la grille (1H + 1F par cellule, max 4, hors zones industrielles), avec une « vue échantillonnage » qui repositionne chaque personne dans sa cellule, et un choroplèthe du nombre d'enquêtés par cellule.
- **7 onglets** : Carte, Vue d'ensemble, Recours aux soins, Perceptions & qualité, Analyse spatiale, Analyse croisée (choix libre de deux variables + tableau de contingence), Explorateur (distributions et statistiques, export CSV).

## Principaux résultats

- Premier recours = **hôpital public 56 %** (par contrainte de coût et de proximité), médecine moderne 76 %, traditionnelle 16 %.
- Recours à la médecine moderne fortement lié à l'**instruction** (73 % → 91 % du sans-niveau au supérieur), à l'**assurance** (87 % vs 73 %) et au **revenu**.
- Seulement **26 %** des enquêtés possèdent une assurance maladie.
- **91 %** fréquenteraient davantage le public si les médicaments y étaient disponibles.
- Accessibilité (SIG) : centre le plus proche à **369 m** en médiane, mais seulement **24 %** à moins de 500 m d'un centre **public**. La distance est un frein secondaire ; le coût domine.

Analyse détaillée dans [`RAPPORT_ANALYSE.md`](RAPPORT_ANALYSE.md).

## Structure du projet

```
index.html   Structure de la page + styles (commenté)
app.js       Toute la logique du tableau de bord (commenté section par section)
data/
  data.js               Données nettoyées, intégrées à l'application
  donnees_nettoyees.csv Données propres (Excel, séparateur ;)
  journal_corrections.csv  Journal des corrections appliquées
RAPPORT_ANALYSE.md   Rapport d'analyse rédigé
GUIDE.md             Guide d'utilisation
serve.ps1            Petit serveur local (usage hors ligne)
Lancer_WebSIG.bat    Lanceur local (Windows)
```

## Utilisation en local

Double-cliquez sur `index.html` (connexion internet requise pour le fond de carte), ou sur `Lancer_WebSIG.bat` pour un serveur local.

## Technologies

HTML/CSS/JavaScript sans dépendance de build. [Leaflet](https://leafletjs.com/) pour la carte, [Chart.js](https://www.chartjs.org/) pour les graphiques, fonds [OpenStreetMap](https://www.openstreetmap.org/) / [CARTO](https://carto.com/).

---

*Auteur : Junior · Thèse de doctorat en géographie de la population, Université Félix Houphouët-Boigny de Cocody.*
