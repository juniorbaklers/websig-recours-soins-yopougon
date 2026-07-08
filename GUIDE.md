# Guide d'utilisation du WebSIG

## Comment ouvrir l'application

### Méthode simple
Double-cliquez sur **`index.html`**. L'application s'ouvre dans votre navigateur.
> Une connexion internet est nécessaire au premier chargement (fond de carte OpenStreetMap et bibliothèques graphiques).

### Méthode robuste (si la carte ne s'affiche pas)
Double-cliquez sur **`Lancer_WebSIG.bat`**. Un petit serveur local démarre et la page s'ouvre automatiquement sur `http://localhost:8971`. Laissez la fenêtre noire ouverte pendant l'utilisation, fermez-la quand vous avez terminé.

---

## Ce que contient le tableau de bord

En haut, **8 indicateurs clés** qui se recalculent selon vos filtres.

À gauche, un panneau de **filtres** (sexe, âge, quartier, revenu, instruction, assurance, premier recours, maladie…). Cochez une ou plusieurs modalités pour restreindre l'échantillon. Rien de coché = tout l'échantillon. Les filtres actifs apparaissent en pastilles sous les onglets et s'appliquent à **toutes** les vues.

Six onglets :

1. **🗺️ Carte** : les 726 enquêtés localisés. Choisissez la variable qui colore les points (premier recours, sexe, âge, assurance, maladie…). Cliquez un point pour voir sa fiche. Option de regroupement par densité et fond de carte clair.
2. **📊 Vue d'ensemble** : profil sociodémographique (sexe, âge, instruction, religion, profession, revenu, quartiers, maladies).
3. **🏥 Recours aux soins** : le cœur de l'analyse. Premier recours et ses croisements avec l'âge, le sexe, le revenu, l'instruction, l'assurance ; raisons du choix ; accompagnement.
4. **⭐ Perceptions & qualité** : comparaison Public / Privé / Traditionnel, qualité de la relation médecin, coûts, médicaments, résultats.
5. **🧭 Analyse spatiale** : accessibilité géographique aux 108 centres de santé. Taux de couverture par rayon (500 m / 1 km / 1,5 km), distance réelle au premier contact, premier recours selon la distance, distance moyenne par quartier, distance déclarée vs réelle. Contient aussi la **synthèse du plan d'échantillonnage** (redistribution sur la grille de 500 m : occupation des cellules, distances de déplacement). Sur l'onglet **Carte**, activez les centres de santé, les zones de couverture, la **grille d'échantillonnage** et la **vue échantillonnage** (repositionne chaque enquêté dans sa cellule).
6. **🔀 Analyse croisée** : **choisissez vous-même deux variables** à croiser (X et Y), le mode d'affichage (barres empilées en %, en effectifs, ou groupées) et lisez le **tableau de contingence** coloré.
7. **🔎 Explorateur** : sélectionnez n'importe quelle variable pour voir sa distribution détaillée, y compris les variables numériques (histogramme + statistiques). Bouton d'**export CSV** de la sélection filtrée.

---

## Exemples d'analyses à faire

- Filtrer **Sans niveau** d'instruction et observer la montée du recours traditionnel dans l'onglet Recours.
- Dans **Analyse croisée**, croiser `Niveau d'instruction` × `Premier recours (catégorie)` en mode 100 %.
- Colorer la carte par **Premier recours** et repérer d'éventuelles logiques spatiales par quartier.
- Filtrer les **non-assurés** et comparer leurs indicateurs de recours à ceux des assurés.

---

## Fichiers du dossier

| Fichier | Contenu |
|---|---|
| `index.html` | L'application (à ouvrir) |
| `app.js` | Logique du tableau de bord |
| `data/data.js` | Données nettoyées + distances SIG (intégrées à l'app) |
| `data/centres.js` | 108 établissements de santé de Yopougon |
| `data/yopougon.js` | Limite communale de Yopougon |
| `data/grille.js` | Grille d'échantillonnage 500 m |
| `data/affectation_grille.csv` | Affectation de chaque enquêté à sa cellule (Excel) |
| `../SIG_grille/` | Couches QGIS : points repositionnés + grille comptée (gpkg) |
| `data/donnees_nettoyees.csv` | Données propres, ouvrables dans Excel |
| `data/journal_corrections.csv` | Journal des corrections appliquées |
| `RAPPORT_ANALYSE.md` | Rapport d'analyse rédigé |
| `Lancer_WebSIG.bat` | Lanceur avec serveur local |
| `serve.ps1` | Serveur local (utilisé par le .bat) |
