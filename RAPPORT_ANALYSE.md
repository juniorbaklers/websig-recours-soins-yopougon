# Rapport d'analyse des données d'enquête

## Recours aux soins de santé des personnes du 3ᵉ âge en milieu urbain : cas de la commune de Yopougon

*Analyse produite à partir du fichier `enquetes these modifie juin 2026.xlsx` (726 enquêtés géolocalisés).*

---

## 1. Méthode et couverture

- **726 personnes âgées** enquêtées, toutes géolocalisées (latitude/longitude) dans la commune de Yopougon.
- **115 variables** initiales couvrant le profil sociodémographique, le ménage et le logement, l'économie du ménage, l'accès aux structures de soins, le recours aux soins, les coûts, les médicaments, la perception des structures et la relation soignant/soigné.
- Échantillon **paritaire** : 363 femmes et 363 hommes.
- Répartition par âge : 60-65 ans **53,2 %**, 65-70 ans **25,2 %**, 70-75 ans **12,7 %**, 75-80 ans **5,8 %**, 80 ans et plus **3,2 %**.

---

## 2. Qualité des données et corrections effectuées

Le fichier brut présentait des problèmes classiques de saisie de terrain. Voici ce qui a été corrigé (le détail ligne par ligne est dans `data/journal_corrections.csv`, les données propres dans `data/donnees_nettoyees.csv`) :

| Problème détecté | Traitement appliqué |
|---|---|
| **Espaces, retours à la ligne, casse** (« YOPOUGON », « YOPOUGON. », « Ivoirien » vs « Ivoirienne ») | Nettoyage systématique, harmonisation |
| **Quartiers** : 170 libellés pour un nombre réel bien plus faible (« Maroc » / « Maroc », « Port-bouet 2 » / « Port Bouet 2 ») | Fusion des variantes (accents, tirets, espaces ignorés), passage en casse titre. 170 → 141 libellés |
| **« Niveau quartier »** (40 cas) : mention de contrôle, pas un vrai quartier | Renommé « Non précisé » |
| **Professions** : 176 libellés très hétérogènes | Conservation du libellé nettoyé + création d'une **catégorie de profession** en 15 groupes (Commerce, Ménagère/Foyer, Artisan, Transport, Enseignant, etc.) |
| **Valeurs numériques mélangées à du texte** (« 2000F », « 5000f », « Ne sais pas », « 0f », « 15 000 ») dans les coûts | Extraction du montant, texte non chiffrable mis à vide |
| **Coûts aberrants** (ex. 500 010 000 issus d'une saisie « 5000/10000 ») | Plafonnés, valeurs impossibles écartées |
| **Réponses Oui/Non incohérentes** (« OUI »/« NON » mêlés à « Propre (Oui) », « Pas Propre (Non) ») dans propreté, équipement, performance | Recodage binaire Oui/Non homogène |
| **Colonnes d'en-tête vides** (10 colonnes de section sans données : C53, C70, C75, C79, C83, C98, C105, C113-115) | Écartées |
| **« Education » vs « Éducation »**, doublons de « Hors Côte d'Ivoire » | Fusionnés |

> Point d'attention pour la thèse : les questions ouvertes de coût (« combien coûte une consultation », « coût max accepté ») ont été saisies de façon très libre. Les statistiques sur ces montants sont indicatives et à interpréter avec prudence.

---

## 3. Profil des enquêtés

- **Nationalité** : 85 % ivoiriens, 15 % non ivoiriens.
- **Instruction** : Primaire 35,5 %, Secondaire 27,7 %, **Sans niveau 27,1 %**, Supérieur 9,6 %. Une majorité peu ou pas scolarisée.
- **Profession** dominante : Commerce (35 %) et Ménagère/Foyer (13 %).
- **Revenu mensuel** : 22 % gagnent moins de 30 000 FCFA, 21 % entre 30 000 et 50 000, 19 % entre 100 000 et 200 000. Population majoritairement à faibles revenus.
- **Assurance maladie** : seulement **25,8 %** en disposent. Trois personnes âgées sur quatre paient les soins de leur poche.

---

## 4. Le recours aux soins (résultat central)

### Premier recours en cas de maladie
| Recours | Part |
|---|---|
| Formation sanitaire **publique** | **55,8 %** |
| Formation sanitaire privée | 17,5 % |
| **Médecine traditionnelle** | 15,6 % |
| Automédication | 8,0 % |
| Médecin personnel | 2,8 % |

Regroupé par type : **médecine moderne 76,4 %**, médecine traditionnelle 15,6 %, automédication 8,0 %.

L'hôpital public reste le premier réflexe, choisi d'abord parce qu'il est **moins cher** (17,1 %), **plus efficace** (16,0 %) et **plus proche** (12,8 %). Quand il n'est pas le premier recours, c'est parce qu'il est jugé **trop éloigné** (11,4 %), **moins efficace** (8,4 %) ou **trop cher** (6,1 %).

### Déterminants du recours (croisements clés)

- **Niveau d'instruction** : gradient très net. Recours à la médecine moderne de **73 %** chez les sans-niveau et primaires, **82,6 %** au secondaire, **91,4 %** au supérieur. Plus on est instruit, moins on recourt au traditionnel.
- **Assurance maladie** : les assurés recourent au moderne à **87,2 %** contre **72,7 %** pour les non-assurés. L'assurance oriente vers le système formel.
- **Revenu** : au-delà de 300 000 FCFA, recours au moderne à 100 %. Mais la **médecine traditionnelle culmine dans les tranches intermédiaires** (24,8 % chez les 100-200 000 FCFA). L'**automédication est la plus forte chez les sans-revenu** (27,8 %), signe d'un renoncement financier aux soins.
- **Âge** : recours au traditionnel un peu plus marqué chez les hommes (18,2 % vs 12,9 % des femmes) et l'automédication remonte chez les 80 ans et plus (17,4 %).

---

## 5. Accès physique aux structures

- **70 %** des enquêtés vivent à moins de 1 km d'un centre public (moins de 500 m : 34,8 %, 500 m à 1 km : 35,1 %).
- Pourtant **21,3 %** mettent plus d'une heure pour s'y rendre, ce qui suggère un problème de transport ou de saturation urbaine plutôt que de distance pure.
- **56,9 %** fréquentent effectivement le centre public (16,1 % « non concernés » car ils déclarent l'absence de centre à proximité).

---

## 5 bis. Analyse spatiale (SIG) : accessibilité géographique aux centres de santé

À la couche des enquêtés a été ajoutée une **couche de 108 établissements de santé** de Yopougon (2 CHU, 1 hôpital général, 1 polyclinique, 37 cliniques, 11 CSU/FSU, 29 centres de santé, dispensaires, etc.). Pour chaque personne âgée, la **distance réelle au centre le plus proche** a été calculée en projection métrique (UTM 30N).

### Couverture géographique
| Type de centre | à moins de 500 m | à moins d'1 km | à moins de 1,5 km |
|---|---|---|---|
| Tout centre (public ou privé) | 70 % | 98 % | 99 % |
| Centre **public** | 24 % | 69 % | — |
| **1er contact** (CSU, centre de santé, dispensaire) | 32 % | 81 % | 96 % |

- Distance médiane au centre le plus proche, tous types confondus : **369 m** (moyenne 408 m, maximum 2,1 km).
- Distance médiane au **premier contact** : **621 m** (moyenne 687 m, maximum 2,3 km).

**Lecture** : l'offre de soins de proximité est dense, mais elle est surtout **privée**. Les structures **publiques et de premier niveau, celles que privilégient les personnes âgées pour leur coût, sont sensiblement plus éloignées** (à peine 24 % des enquêtés à moins de 500 m d'un centre public, contre 70 % pour l'ensemble). Il existe donc un décalage entre l'offre proche (privée, jugée chère) et l'offre recherchée (publique, plus lointaine).

### La distance influence-t-elle le recours ?
La part de recours **hors système formel** (traditionnel + automédication) selon la distance au premier contact :

| Distance au 1er contact | Effectif | 1er recours public | Hors système formel |
|---|---|---|---|
| Moins de 500 m | 234 | 57,7 % | 24,8 % |
| 500 m à 1 km | 356 | 54,5 % | 22,5 % |
| 1 à 1,5 km | 105 | 54,3 % | 26,7 % |
| Plus de 1,5 km | 31 | 61,3 % | 12,9 % |

Le gradient est **faible et non monotone** : la distance physique n'est **pas** le principal déterminant du recours dans ce contexte urbain dense. Ce résultat, à première vue contre-intuitif, renforce la conclusion précédente : les vrais freins sont **économiques** (coût, absence d'assurance) et non la proximité. En revanche, la **fréquentation effective du centre public** décroît légèrement avec l'éloignement (68 % à moins de 500 m, 59 % au-delà de 1,5 km), signe d'un effet de distance réel mais secondaire.

### Distance déclarée vs distance réelle
Les distances déclarées dans l'enquête ne coïncident pas exactement avec les distances calculées : les enquêtés qui déclarent « moins de 500 m » ont en réalité une distance médiane de **758 m** au centre public le plus proche. Les déclarations renvoient à la structure **habituellement fréquentée**, pas nécessairement à la plus proche. Le SIG apporte donc une mesure objective qui complète le ressenti des enquêtés.

> Ces analyses sont explorables dans l'onglet **Analyse spatiale** du WebSIG, et visualisables sur la carte (centres de santé, zones de couverture 500 m / 1 km, coloration des enquêtés par distance réelle).

### Redistribution des enquêtés sur la grille d'échantillonnage (500 m)

L'échantillon a été conçu sur une **grille de 500 m** (332 cellules, dont 24 en zone industrielle « acces = NON » exclues), à raison de **2 personnes par cellule (1 homme + 1 femme)**, soit un objectif théorique proche de 664. La réalité du terrain a porté l'échantillon à **726**, retenu comme effectif définitif.

La superposition des 726 positions GPS sur la grille montre que le terrain n'a pas respecté le plan : **forte concentration** (65 cellules comptaient 5 personnes ou plus, jusqu'à 20 dans une seule), **160 cellules accessibles vides**, et **12 enquêtés tombés dans des cellules « NON »**. Pour restituer la logique spatiale du plan d'échantillonnage, les 726 enquêtés ont été **réaffectés aux cellules** selon la règle suivante :

- jusqu'à **2 personnes conservées par cellule** (1 homme + 1 femme en priorité) ;
- le **surplus déplacé vers les cellules accessibles voisines les plus proches** (redistribution locale), avec un **maximum de 4 par cellule** et priorité aux cellules de 2 ;
- **aucune affectation dans les cellules « NON »** (zones industrielles non enquêtées) ;
- les **coordonnées GPS réelles sont conservées** dans un champ distinct (traçabilité).

**Résultat** : 283 cellules accessibles occupées, dont **181 à 2 personnes**, 82 à 4, 8 à 3, 12 à 1. **401 enquêtés** ont été rattachés à une autre cellule que leur cellule d'origine (déplacement médian **669 m**, maximum 1,9 km), dont les 12 issus de zones « NON ». L'objectif « 1 homme + 1 femme » a pu être tenu dans une partie des cellules seulement, la composition par sexe des amas de terrain étant parfois déséquilibrée.

Cette redistribution est une **régularisation spatiale du plan d'échantillonnage** (utile pour la carte méthodologique et le respect de la grille). Les analyses statistiques et les distances d'accès du présent rapport reposent, elles, sur les **positions GPS réelles**. Les couches produites (`SIG_grille/points_echantillonnage.gpkg`, `SIG_grille/grille_comptage.gpkg`) sont directement exploitables dans QGIS.

---

## 6. Perception et qualité des structures

Part de jugements positifs (« oui ») :

| Critère | Public | Privé | Traditionnel |
|---|---|---|---|
| Propreté | 71,7 % | **94,7 %** | 55,3 % |
| Équipement suffisant | 65,0 % | **87,8 %** | 53,8 % |
| Performance | 76,2 % | **89,2 %** | 68,9 % |

Le **privé domine sur tous les critères**, le public occupe une position intermédiaire, le traditionnel est le moins bien perçu. Cela crée une tension : le public est choisi surtout pour son coût, pas pour sa qualité perçue.

Relation soignant/soigné dans le public :
- Personnel **accueillant** 67,4 %, personnel soignant **gentil** 89,6 %, médecins jugés **compétents** 81,4 %.
- **Constantes prises** (poids, tension, température, antécédents) : 94,5 %, bonne pratique clinique de base.
- Points faibles : **temps d'attente jugé long à 66,3 %**, **dialogue permanent avec le médecin seulement 64,4 %**, information régulière sur l'état de santé 68,9 %.
- **24,3 %** déclarent que le personnel du public leur a recommandé d'aller voir un tradipraticien, articulation informelle entre les deux médecines.

---

## 7. Coûts et médicaments (enjeu majeur)

- Coût médian d'une consultation déclaré : **2 000 FCFA** (moyenne 3 252, min 0, max 50 000).
- **50 %** jugent ce coût **élevé**, 41 % satisfaisant.
- Le public est jugé **plus cher que le tradipraticien** par 55,9 % des enquêtés.
- Médicaments : **82,7 %** ont pu acheter tous les médicaments prescrits, mais **seulement 67,2 %** ont pu les acheter **sur place** dans la structure. Le principal motif de non-achat sur place est l'**indisponibilité** (rupture) qui renvoie vers la pharmacie.
- Signal fort : **90,8 %** déclarent qu'ils fréquenteraient **plus souvent** le public **si les médicaments y étaient disponibles**. La disponibilité des médicaments apparaît comme le premier levier d'attractivité du système public.

---

## 8. Résultats et fidélité

- **95,2 %** rapportent une **guérison (40,1 %) ou une amélioration (55,1 %)** après leur dernier traitement.
- **72,5 %** retourneraient dans la même structure. Les rares refus (6,7 %) tiennent au coût, aux horaires d'ouverture et à l'éloignement.
- **79,1 %** se disent satisfaits de leur médecin traitant.

### Pathologies les plus fréquentes (dernière consultation)
Paludisme **32,5 %**, affections cardiovasculaires 12,5 %, affections rhumatologiques 7,6 %, ORL/dermato/ophtalmo 6,2 %, diabète 6,2 %, affections digestives 6,1 %. Un profil épidémiologique mixte : maladies infectieuses encore dominantes, mais forte présence des maladies chroniques liées à l'âge (cardiovasculaire, diabète, rhumatologie).

---

## 9. Synthèse pour la thèse

1. **L'hôpital public est le pivot du recours (56 %)**, non par préférence qualitative mais par contrainte économique et de proximité.
2. **Le recours est socialement déterminé** : l'instruction, l'assurance et le revenu tirent vers la médecine moderne ; leur absence pousse vers le traditionnel et surtout vers l'automédication, marqueur de renoncement chez les plus pauvres.
3. **La faible couverture assurantielle (26 %)** est un facteur structurel de vulnérabilité de cette population âgée.
4. **La disponibilité des médicaments dans le public** est le levier le plus cité (91 %) pour améliorer le recours.
5. **La qualité perçue du public reste inférieure au privé**, avec des points concrets d'amélioration : temps d'attente et dialogue médecin/patient.

---

## 10. Le tableau de bord WebSIG

Pour explorer ces résultats de façon interactive (carte, filtres croisés, graphiques dynamiques), ouvrez `index.html`. Voir `GUIDE.md`.
