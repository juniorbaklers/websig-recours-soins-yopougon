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
