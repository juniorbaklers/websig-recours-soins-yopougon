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
5. **🔀 Analyse croisée** : **choisissez vous-même deux variables** à croiser (X et Y), le mode d'affichage (barres empilées en %, en effectifs, ou groupées) et lisez le **tableau de contingence** coloré.
6. **🔎 Explorateur** : sélectionnez n'importe quelle variable pour voir sa distribution détaillée, y compris les variables numériques (histogramme + statistiques). Bouton d'**export CSV** de la sélection filtrée.

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
| `data/data.js` | Données nettoyées (intégrées à l'app) |
| `data/donnees_nettoyees.csv` | Données propres, ouvrables dans Excel |
| `data/journal_corrections.csv` | Journal des corrections appliquées |
| `RAPPORT_ANALYSE.md` | Rapport d'analyse rédigé |
| `Lancer_WebSIG.bat` | Lanceur avec serveur local |
| `serve.ps1` | Serveur local (utilisé par le .bat) |
