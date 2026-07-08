# Guide d'utilisation du WebSIG

## Comment ouvrir l'application

> La **page d'accueil** est `index.html` (présentation Bakusm@p). Le **tableau de bord** est `plateforme.html` (bouton « Entrer dans la plateforme »).

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

## Déplacer les points manuellement (mode édition)

Certains points de la vue échantillonnage peuvent tomber dans une zone non habitée (forêt, terrain vague), tandis que des zones habitées restent sans point. Vous pouvez corriger cela vous-même :

1. Onglet **Carte**, choisissez un fond **Satellite** (Google ou Esri) pour voir le terrain.
2. Cochez **✏️ Mode édition — déplacer les points**. La vue échantillonnage et la grille s'activent automatiquement.
3. **Glissez** un point mal placé vers une zone habitée. Dès que vous le lâchez : ses coordonnées GPS et sa cellule se mettent à jour, la grille se recolore, et le déplacement est **enregistré dans votre navigateur** (vous seul le voyez).
4. Bouton **⬇ Exporter mes positions** : télécharge un CSV (`positions_echantillonnage_modifiees.csv`) avec, pour chaque enquêté, la position réelle, la position d'échantillonnage modifiée et la cellule. Conservez-le ou transmettez-le pour l'intégrer définitivement.
5. Bouton **↺ Réinitialiser** : annule tous vos déplacements et revient aux positions d'origine.

> Vos déplacements restent sur votre ordinateur (stockage local du navigateur). Ils ne modifient pas la version en ligne pour les autres visiteurs. Pour les rendre définitifs dans les données, exportez le CSV.

## Isochrones d'accessibilité (zones atteignables à pied)

Onglet **Carte** : cochez **🕒 Isochrones**, puis **cliquez un centre de santé**. Les zones atteignables en **5 / 10 / 15 minutes de marche** s'affichent (vert / orange / rouge).
- Sans clé : zones **approximatives** par distance (~400 / 800 / 1200 m).
- Pour des **isochrones réseau réelles** (le long des rues) : créez une clé gratuite sur [openrouteservice.org](https://openrouteservice.org/dev/#/signup), collez-la dans le champ **Clé OpenRouteService**. La clé est mémorisée dans votre navigateur.

## Enregistrement automatique en ligne (optionnel, Supabase)

Par défaut, vos déplacements de points restent sur votre navigateur. Pour qu'ils soient **sauvegardés en ligne et partagés sur tous vos appareils** automatiquement, configurez une base **Supabase** gratuite :

1. Créez un compte sur [supabase.com](https://supabase.com) et un **nouveau projet** (gratuit).
2. Dans le projet, ouvrez **SQL Editor** et exécutez :
   ```sql
   create table points_overrides (
     id int8 primary key,
     glat float8, glon float8, cellid int8, lat float8, lng float8,
     maj timestamptz default now()
   );
   alter table points_overrides enable row level security;
   create policy "acces public" on points_overrides for all using (true) with check (true);
   ```
3. Dans **Project Settings → API**, copiez l'**URL** du projet et la clé **anon public**.
4. Dans Bakusm@p (onglet Carte, section ☁), collez l'URL et la clé, puis cliquez **☁ Publier mes modifications en ligne**.

Ensuite, à chaque ouverture, la plateforme recharge automatiquement les positions publiées.

> Note : avec la politique ci-dessus, la table est en lecture/écriture publique (adapté à un outil de recherche personnel). Pour un accès restreint, ajoutez une authentification Supabase.

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
| `../WebSIG_base/` | Copie de sauvegarde du tableau de bord avec les **données non modifiées** (positions GPS réelles, sans la grille) |
| `data/donnees_nettoyees.csv` | Données propres, ouvrables dans Excel |
| `data/journal_corrections.csv` | Journal des corrections appliquées |
| `RAPPORT_ANALYSE.md` | Rapport d'analyse rédigé |
| `Lancer_WebSIG.bat` | Lanceur avec serveur local |
| `serve.ps1` | Serveur local (utilisé par le .bat) |
