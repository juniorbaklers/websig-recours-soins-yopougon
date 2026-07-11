/* ============================================================================
   WebSIG — Recours aux soins des personnes du 3e age (Yopougon)
   ----------------------------------------------------------------------------
   Ce fichier contient TOUTE la logique du tableau de bord.
   Il est organise en sections numerotees. Lis-les dans l'ordre :

     1. Metadonnees des variables (noms lisibles, ordres, groupes de filtres)
     2. Palette de couleurs
     3. Etat des filtres et fonction de filtrage
     4. Fonctions d'agregation (compter, ordonner)
     5. Fonctions de dessin des graphiques (Chart.js)
     6. Indicateurs cles (KPIs)
     7. La carte (Leaflet)
     8. La barre de filtres (colonne de gauche)
     9. Les menus deroulants (colorer la carte, analyse croisee, explorateur)
    10. Rendu de chaque onglet
    11. Analyse croisee (tableau de contingence)
    12. Explorateur de variable
    13. Export CSV
    14. Orchestration (tout relier) et demarrage

   Rappel : "recs" = la liste des enquetes actuellement selectionnes (apres
   application des filtres). Chaque enquete est un objet { sexe, age, ... }.
   ============================================================================ */
'use strict';

// window.DATA est le tableau des 726 enquetes, injecte par data/data.js
const DATA = window.DATA || [];


/* ============================================================================
   1. METADONNEES DES VARIABLES
   ============================================================================ */

// ORD = ordre "logique" impose a certaines variables ordinales.
// Sans cela, les graphiques trieraient par frequence, ce qui n'a pas de sens
// pour un age ou un revenu (on veut du plus petit au plus grand).
const ORD = {
  age:['[60 - 65 ans[','[65 - 70 ans[','[70 - 75 ans[','[75 - 80 ans[','[80ans - plus['],
  instruction:['Sans niveau','Primaire','Secondaire','Supérieur'],
  revenu:['Aucun','Moins de 30000 FCFA','30000-50000 FCFA','50000-100000 FCFA','100000-200000 FCFA','200000-300000 FCFA','300000-500000 FCFA','Plus de 500000 FCFA','Autre:'],
  depenses:['Moins de 15000 FCFA','15000-25000 FCFA','25000-50000 FCFA','50000-100000 FCFA','100000-200000 FCFA','200000-500000 FCFA'],
  nbEnfantsCat:['Aucun','1 à 2','3 à 5','6 à 10','Plus de 10'],
  personnesCharge:['Aucun','1 à 3','4 à 5','6 à 10','plus de 10'],
  distancePublique:['Moins de 500 m','500 à 1Km','1km à 1,5 Km','Plus de 1,5 km à 2Km et plus'],
  tempsMis:['Moins de 30 min','30 min à 1 h','Plus d’une 1h'],
  opinionDistance:['Acceptable','Longue','Trop longue'],
  opinionCout:['Bas','Satisfaisant','Elevé'],
  opinionTransport:['Bas','Satisfaisant','Élevé','Trop élevé'],
  tempsAttente:['Court','Acceptable','Long'],
  coutTransport:['Ne paie pas de coût de transport','200 f','200 à 500 f','600 à 1000 f','1000 à 2000 f','2000 à 3000 f','3000 à 5000 f','5000 à 10000 f','10000 à 15000 f'],
  nbPieces:['1 pièce','2 pièces','3 pièces','4 pièces et plus'],
  resultatTraitement:['Guérison','Amélioration','Pas de Guérison'],
  retourneMemeStructure:['Oui','Ne sait pas','Non'],
  prixVsPharmacie:['Moins chers','Pareils','Plus chers'],
  coutVsTradi:['Moins cher','Pareil','Plus cher'],
  // Tranches de distance REELLE calculee en SIG (voir section analyse spatiale)
  bandPrim:['Moins de 500 m','500 m a 1 km','1 a 1,5 km','Plus de 1,5 km'],
  bandAny:['Moins de 500 m','500 m a 1 km','1 a 1,5 km','Plus de 1,5 km'],
  // Classe d'accessibilite selon le temps de marche au centre le plus proche
  coverClass:['5 min','10 min','15 min','Hors 15 min']
};

// DIMS = pour chaque variable (cle technique), son libelle lisible affiche
// dans les menus, les legendes et les titres.
const DIMS = {
  sexe:'Sexe', age:"Tranche d'âge", quartier:'Quartier', nationalite:'Nationalité', ethnie:'Ethnie',
  lieuNaissance:'Lieu de naissance', matrimonial:'Situation matrimoniale', religion:'Religion',
  professionCat:'Catégorie de profession', cadreProfession:"Cadre d'exercice", instruction:"Niveau d'instruction",
  nbEnfantsCat:"Nombre d'enfants", personnesCharge:'Personnes à charge', statutLogement:'Statut du logement',
  typeConstruction:'Type de construction', nbPieces:'Nombre de pièces', locomotion:'Moyen de locomotion',
  ordures:'Évacuation des ordures', eauxUsees:'Évacuation eaux usées', revenu:'Revenu mensuel',
  autreRevenu:'Autre source de revenu', depenses:'Dépenses mensuelles', depensePrio1:'Dépense prioritaire (1er)',
  existenceCentre:'Existence centre de santé', frequentation:'Fréquentation centre public',
  motifNonFreq:'Motif de non-fréquentation', distancePublique:'Distance au centre public', tempsMis:'Temps pour y aller',
  opinionDistance:'Opinion sur la distance', coutTransport:'Coût transport A/R', opinionTransport:'Opinion coût transport',
  premierRecours:'Premier recours (détaillé)', premierRecoursCat:'Premier recours (catégorie)',
  recours2:'2e recours', recours3:'3e recours', seulAccompagne:'Se rend seul/accompagné', accompagnePar:'Accompagné par',
  assurance:'Assurance maladie', raisonHopitalOui:'Raison hôpital public = 1er recours',
  raisonHopitalNon:'Raison hôpital public ≠ 1er recours', opinionCout:'Opinion coût consultation',
  coutVsTradi:'Coût public vs tradipraticien', prixVsPharmacie:'Prix médic. vs pharmacie',
  acheteTousMedic:'A acheté tous les médicaments', acheteSurPlace:'A acheté les médic. sur place',
  prixMedicConvient:'Prix médic. convient', iraitPlusSouvent:'Irait plus souvent si médic. dispo',
  personnelAccueil:'Personnel accueillant', tempsAttente:"Temps d'attente", competents:'Médecins compétents',
  propretePublique:'Propreté · Public', proprietePrive:'Propreté · Privé', proprieteTradi:'Propreté · Tradi',
  equipPublique:'Équipement · Public', equipPrive:'Équipement · Privé', equipTradi:'Équipement · Tradi',
  perfPublique:'Performance · Public', perfPrive:'Performance · Privé', perfTradi:'Performance · Tradi',
  maladieCat:'Catégorie de maladie', medecinTemps:'Médecin consacre du temps',
  expliquerMedic:'Explique la prise des médicaments', expliquerPrevention:'Explique la prévention',
  infoRegulier:'Infos régulières sur la santé', possibiliteExpr:"Peut s'exprimer sur les soins",
  respecte:'Respecté par le médecin', dialogue:'Dialogue permanent', satisfaitMedecin:'Satisfait du médecin traitant',
  resultatTraitement:'Résultat du traitement', personnelGentil:'Personnel soignant gentil',
  prisConstantes:'Constantes prises (poids/tension…)', oriente:'Orienté vers une autre structure',
  recommandeTradi:"Recommandé d'aller voir un tradipraticien", retourneMemeStructure:'Retournerait dans la même structure',
  // Variables issues de l'analyse spatiale (distances reelles au centre le plus proche)
  bandPrim:'Distance réelle au 1er contact', bandAny:'Distance réelle (tout centre)',
  coverClass:'Couverture (temps de marche)',
  // Centre de sante le plus proche (calcule par computeNearest(), voir section 1bis)
  nearestName:'Centre de santé le plus proche'
};

// NUM = les variables numeriques (montants + distances calculees en SIG). Traitees a part car on calcule
// des statistiques (mediane, moyenne) et un histogramme, pas des categories.
const NUM = { coutConsultation:'Coût de la consultation (FCFA)', coutMax:'Coût max. accepté (FCFA)', loyer:'Loyer mensuel (FCFA)',
  dAny:'Distance au centre le plus proche (m)', dPub:'Distance au centre public le plus proche (m)', dPrim:'Distance au 1er contact le plus proche (m)' };

// Couches spatiales injectees par centres.js, yopougon.js et grille.js
const CENTRES = window.CENTRES || [];
const YOP = window.YOP_BOUNDARY || null;
const GRID = window.GRID || null;
// gridView : quand true, on affiche les enquetes a leur position "grille" (gLon/gLat)
// au lieu de leur position GPS reelle (lat/lng). Voir la case "Vue echantillonnage".
let gridView=false;
// editMode : quand true, les points deviennent deplacables a la souris (mode edition).
let editMode=false;
const EDIT_KEY='websig_edits_v1'; // cle de sauvegarde des deplacements dans le navigateur

// FILTER_GROUPS = quelles variables apparaissent dans la barre de filtres a
// gauche, et sous quel intitule de groupe. On ne met pas TOUT pour ne pas
// surcharger ; les 70+ variables restent accessibles dans les onglets.
// Etape 5a : le premier groupe reunit les filtres consideres comme essentiels
// (quartier, sexe, age, type de recours, distance, revenu, cout du transport,
// mode de deplacement, centre de sante, satisfaction, perception de la
// distance, accessibilite), les groupes suivants reprennent le detail.
const FILTER_GROUPS = [
  { g:'🎯 Filtres essentiels', keys:['quartier','sexe','age','premierRecoursCat','bandPrim','revenu','coutTransport','locomotion','nearestName','satisfaitMedecin','opinionDistance','coverClass'] },
  { g:'Profil', keys:['nationalite','ethnie','matrimonial','religion','instruction','professionCat','cadreProfession'] },
  { g:'Localisation', keys:['lieuNaissance'] },
  { g:'Ménage & économie', keys:['statutLogement','typeConstruction','nbPieces','depenses','nbEnfantsCat','personnesCharge','autreRevenu'] },
  { g:'Accès aux soins (détail)', keys:['existenceCentre','frequentation','distancePublique','tempsMis'] },
  { g:'Recours & assurance', keys:['premierRecours','assurance','seulAccompagne'] },
  { g:'Santé & résultats', keys:['maladieCat','resultatTraitement','retourneMemeStructure'] }
];

/* ============================================================================
   1bis. CAMPAGNE D'ENQUETE / ANALYSE TEMPORELLE (etape 5a)
   Detecte automatiquement un champ temporel dans les donnees. Ce jeu de
   donnees provient d'une enquete unique : le champ n'existe pas, et l'appli
   doit le signaler proprement plutot que de planter ou d'afficher un filtre vide.
   ============================================================================ */
const TEMPORAL_CANDIDATES=['annee','date_enquete','periode','campagne','vague_enquete','mois_enquete'];
function detectTemporalField(){
  if(!DATA.length) return null;
  const keys=Object.keys(DATA[0]);
  for(const cand of TEMPORAL_CANDIDATES){
    const found=keys.find(k=>k.toLowerCase()===cand);
    if(found){
      const vals=new Set(DATA.map(d=>(d[found]??'').toString().trim()).filter(Boolean));
      if(vals.size>0) return found; // le champ existe ET contient au moins une valeur renseignee
    }
  }
  return null;
}
const TEMPORAL_FIELD=detectTemporalField();
if(TEMPORAL_FIELD){
  if(!DIMS[TEMPORAL_FIELD]) DIMS[TEMPORAL_FIELD]="Campagne / période d'enquête";
  FILTER_GROUPS.push({ g:"🕐 Campagne d'enquête / Analyse temporelle", keys:[TEMPORAL_FIELD] });
}


/* ============================================================================
   2. PALETTE DE COULEURS
   ============================================================================ */

// Palette categorielle par defaut, choisie pour rester lisible (y compris pour
// la plupart des daltoniens) et coherente entre la carte et les graphiques.
const PAL = ['#0f5e8f','#e8813a','#12a08a','#b0568f','#4c9a4c','#d9534f','#6f7fb3','#e6b84c','#7a5c48','#4bb1c9','#9a4c78','#8aa14c'];

// MAP_PALETTES (etape 5b) : jeux de couleurs categoriels nommes, selectionnables
// dans « Style cartographique ». "daltonienne" reprend la palette Okabe-Ito,
// reconnue pour rester distinguable pour la plupart des types de daltonisme.
const MAP_PALETTES = {
  bleu:       ['#0b3d59','#1a6f9c','#2b8cbf','#5fb0d9','#0f5e8f','#3a86b8','#6bb0d6','#8fcbe8','#b8dff0','#123f5c'],
  vert:       ['#1e4d2b','#2e6b3e','#3f8a51','#57a765','#0d8a6a','#3fae8c','#12a08a','#6cc4ac','#7fc48a','#a8dab0'],
  jor:        ['#7f0000','#b30000','#d7301f','#ef6548','#e8813a','#fc8d59','#fdbb84','#fdd49e','#f4a460','#fee8c8'],
  violet:     ['#3f007d','#54278f','#6a51a3','#807dba','#b0568f','#8a4c9a','#9e9ac8','#c084c0','#bcbddc','#dadaeb'],
  turquoise:  ['#004c4c','#00696b','#00838a','#00a1a8','#12a08a','#4bb1c9','#3fc1c9','#2ba9a0','#7fd8dd','#b3e8ea'],
  rouge:      ['#4d0000','#7a0000','#a30000','#c62828','#d9534f','#b5121b','#e57373','#c94f4f','#ef9a9a','#f4b6b6'],
  sombre:     ['#1c1c1c','#2e2e2e','#404040','#525252','#3a3a3a','#646464','#4c4c4c','#767676','#5e5e5e','#888888'],
  claire:     ['#6b9abb','#79a4c1','#87adc8','#95b6ce','#a3bfd4','#b1c9db','#bfd2e1','#cddbe8','#dbe4ee','#e8eef4'],
  daltonienne:['#0173b2','#de8f05','#029e73','#d55e00','#cc78bc','#ca9161','#56b4e9','#949494','#ece133','#fbafe4']
};

// Cas particulier des reponses Oui/Non : vert = Oui, rouge = Non (plus intuitif).
const YESNO = { 'Oui':'#4c9a4c','Non':'#d9534f','OUI':'#4c9a4c','NON':'#d9534f' };
// Couleurs des classes d'accessibilite (marche) : du vert (proche) au rouge (hors zone)
const COVER_COL = { '5 min':'#1a9850','10 min':'#91cf60','15 min':'#fee08b','Hors 15 min':'#d73027' };

// mapStyle (etape 5b) : etat central du style cartographique, memorise dans le
// navigateur (localStorage) et applique a la carte (palette, opacite, taille
// des points, couleurs des couches). DEFAULT_MAP_STYLE sert de reference pour
// le bouton « Réinitialiser le style ».
const DEFAULT_MAP_STYLE = { palette:'bleu', layerOpacity:0.5, pointSize:5.5,
  colorCentres:'#0d8a6a', colorQuartier:'#0f5e8f', colorCouverture:'#0d8a6a', colorGrille:'#5f6b7a', colorIsochrones:'#2e7d32' };
let mapStyle = Object.assign({}, DEFAULT_MAP_STYLE);
try{ const savedStyle=JSON.parse(localStorage.getItem('map_style_v1')||'null'); if(savedStyle) Object.assign(mapStyle,savedStyle); }catch(e){}
// opacityMult() : multiplicateur applique aux opacites de base des couches (500 -> 1x, 0-100 -> 0x-2x)
function opacityMult(){ return mapStyle.layerOpacity/0.5; }
// shade()/shades3() : eclaircit (amt>0) ou assombrit (amt<0) une couleur hex, pour derouler dynamiquement
// 3 teintes (isochrones 5/10/15 min) a partir d'une seule couleur choisie par l'utilisateur.
function hexToRgb(hex){ hex=(hex||'#888888').replace('#',''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join(''); const n=parseInt(hex,16)||0x888888; return [n>>16&255,n>>8&255,n&255]; }
function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function shade(hex,amt){ const [r,g,b]=hexToRgb(hex); return rgbToHex(r+amt,g+amt,b+amt); }
function shades3(hex){ return [shade(hex,45),hex,shade(hex,-55)]; }
// Vitesse de marche retenue pour les personnes agees : 4,8 km/h = 80 m/min
const WALK_M_MIN = 80;
// haversine() : distance en metres entre deux points (lat/lon degres)
function haversine(la1,lo1,la2,lo2){ const R=6371000,r=Math.PI/180;
  const dla=(la2-la1)*r, dlo=(lo2-lo1)*r;
  const a=Math.sin(dla/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dlo/2)**2;
  return 2*R*Math.asin(Math.sqrt(a)); }
// computeNearest() : pour chaque enquete, centre le plus proche + distance + temps de marche + classe
function computeNearest(){
  if(!CENTRES||!CENTRES.length) return;
  DATA.forEach(d=>{
    if(typeof d.lat!=='number'||typeof d.lng!=='number'||!d.lat){ d.nearestDist=null; d.nearestName=''; d.walkMin=null; d.coverClass=''; return; }
    let best=1e18,bn='',bt='';
    for(const c of CENTRES){ const dist=haversine(d.lat,d.lng,c.lat,c.lon); if(dist<best){best=dist;bn=c.nom;bt=c.type;} }
    d.nearestDist=Math.round(best); d.nearestName=bn; d.nearestType=bt;
    d.walkMin=Math.max(1,Math.round(best/WALK_M_MIN));
    d.coverClass = best<=400?'5 min':best<=800?'10 min':best<=1200?'15 min':'Hors 15 min';
  });
}

// catsOf(cle) : renvoie la liste ORDONNEE des modalites d'une variable,
// calculee une seule fois sur TOUT le jeu de donnees (pour que les couleurs
// et l'ordre restent stables meme quand on filtre).
function catsOf(key){
  if(ORD[key]){ // variable ordinale : on suit l'ordre impose, en ne gardant que les modalites presentes
    const present=new Set(DATA.map(d=>norm(d[key])).filter(Boolean));
    const base=ORD[key].filter(c=>present.has(norm(c)) || present.has(c));
    const extra=[...present].filter(p=>!ORD[key].some(o=>norm(o)===p)); // valeurs inattendues eventuelles
    return base.concat(extra.filter(e=>e).map(e=>reprOf(key,e)));
  }
  // variable nominale : on trie par frequence decroissante
  const m=new Map();
  DATA.forEach(d=>{const v=(d[key]??'').toString().trim(); if(v) m.set(v,(m.get(v)||0)+1);});
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]);
}
// norm() : normalise une valeur (minuscules, sans espaces) pour comparer sans se soucier de la casse
function norm(v){return (v??'').toString().trim().toLowerCase();}
// reprOf() : retrouve l'ecriture "officielle" d'une valeur a partir de sa version normalisee
function reprOf(key,normv){const f=DATA.find(d=>norm(d[key])===normv); return f?f[key].toString().trim():normv;}

// CATS : cache des modalites de chaque variable (calcule au chargement)
const CATS={}; Object.keys(DIMS).forEach(k=>CATS[k]=catsOf(k));

// colorFor(cle, valeur) : couleur d'une modalite. Si la variable est de type
// Oui/Non on utilise le code vert/rouge, sinon la position dans la palette.
function colorFor(key,val){
  if(key==='coverClass' && COVER_COL[(val||'').trim()]) return COVER_COL[val.trim()]; // classes de marche
  const cats=CATS[key]||catsOf(key);
  if(cats.every(c=>YESNO[c.trim()]!==undefined || ['Oui','Non','OUI','NON'].includes(c.trim())) && YESNO[val.trim()]) return YESNO[val.trim()];
  const pal=MAP_PALETTES[mapStyle.palette]||PAL;
  const i=cats.indexOf(val); return pal[(i<0?0:i)%pal.length];
}


/* ============================================================================
   3. ETAT DES FILTRES + FILTRAGE
   ============================================================================ */

// filters = objet { cle : Set(valeurs cochees) }.
// Si une variable n'a aucune valeur cochee, elle n'impose aucune restriction.
const filters={};

// passes(d) : est-ce que l'enquete d respecte TOUS les filtres actifs ?
function passes(d){
  for(const k in filters){
    const s=filters[k];
    if(s&&s.size){ const v=(d[k]??'').toString().trim(); if(!s.has(v)) return false; }
  }
  return true;
}
// filtered() : la sous-population correspondant aux filtres actifs
function filtered(){ return DATA.filter(passes); }


/* ============================================================================
   4. AGREGATIONS
   ============================================================================ */

// countBy(recs, cle) : compte les effectifs de chaque modalite -> Map(valeur -> effectif)
function countBy(recs,key){
  const m=new Map();
  recs.forEach(d=>{const v=(d[key]??'').toString().trim(); if(v) m.set(v,(m.get(v)||0)+1);});
  return m;
}
// ordered(cle, m) : renvoie les modalites presentes, dans le bon ordre
// (ordre logique si ordinal, sinon par effectif decroissant)
function ordered(key,m){
  let cats=(ORD[key]?CATS[key]:[...m.keys()].sort((a,b)=>(m.get(b)||0)-(m.get(a)||0)));
  cats=cats.filter(c=>m.has(c));
  [...m.keys()].forEach(k=>{if(!cats.includes(k))cats.push(k);}); // securite : n'oublier aucune modalite
  return cats;
}


/* ============================================================================
   5. GRAPHIQUES (Chart.js)
   ============================================================================ */

// Reglages generaux de police/couleur pour tous les graphiques
Chart.defaults.font.family='"Segoe UI",Roboto,Arial,sans-serif';
Chart.defaults.font.size=11.5; Chart.defaults.color='#334155';

// charts = registre des graphiques crees, indexe par l'id du <canvas>.
// On garde une reference pour DETRUIRE l'ancien graphique avant d'en redessiner
// un nouveau (sinon Chart.js empile les graphiques et cela bugue).
const charts={};
function draw(id,cfg){
  if(charts[id]) charts[id].destroy();          // on efface l'ancien
  const el=document.getElementById(id); if(!el)return;
  charts[id]=new Chart(el,cfg);                 // on dessine le nouveau
}

// barSimple() : graphique d'une seule variable (barres verticales/horizontales
// ou anneau). Affiche l'effectif et le pourcentage dans l'infobulle.
function barSimple(id,key,recs,{horizontal=false,color=null,doughnut=false}={}){
  const m=countBy(recs,key); const cats=ordered(key,m); const vals=cats.map(c=>m.get(c)||0);
  const total=vals.reduce((a,b)=>a+b,0);
  const colors=cats.map(c=>color||colorFor(key,c));
  if(doughnut){ // version anneau (camembert perce)
    draw(id,{type:'doughnut',data:{labels:cats,datasets:[{data:vals,backgroundColor:colors,borderWidth:1,borderColor:'#fff'}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{boxWidth:12}},
        tooltip:{callbacks:{label:c=>`${c.label}: ${c.parsed} (${(100*c.parsed/total).toFixed(1)}%)`}}}}});
    return;
  }
  // version barres
  draw(id,{type:'bar',data:{labels:cats,datasets:[{data:vals,backgroundColor:colors,borderRadius:4,maxBarThickness:46}]},
    options:{indexAxis:horizontal?'y':'x',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const v=horizontal?c.parsed.x:c.parsed.y;return `${v} (${(100*v/total).toFixed(1)}%)`;}}}},
      scales:{x:{grid:{display:!horizontal}},y:{grid:{display:horizontal},ticks:{autoSkip:false}}}}});
}

// crossChart() : croise DEUX variables. keyX en abscisse, keyY = les couleurs
// empilees. mode = 'pct' (empilement 100%), 'cnt' (effectifs empiles) ou
// 'grp' (barres cote a cote). Renvoie la grille de comptage pour le tableau.
function crossChart(id,keyX,keyY,recs,mode='pct'){
  const catsX=ordered(keyX,countBy(recs,keyX));
  const catsY=ordered(keyY,countBy(recs,keyY));
  // grid[x][y] = nombre d'enquetes ayant la valeur x pour keyX et y pour keyY
  const grid={}; catsX.forEach(x=>{grid[x]={}; catsY.forEach(y=>grid[x][y]=0);});
  const totX={}; catsX.forEach(x=>totX[x]=0); // total par colonne X (pour convertir en %)
  recs.forEach(d=>{const x=(d[keyX]??'').toString().trim(),y=(d[keyY]??'').toString().trim(); if(grid[x]&&y&&grid[x][y]!==undefined){grid[x][y]++;totX[x]++;}});
  // un "dataset" par modalite de keyY
  const datasets=catsY.map(y=>({label:y,backgroundColor:colorFor(keyY,y),borderRadius:3,maxBarThickness:60,
    data:catsX.map(x=> mode==='pct' ? (totX[x]?100*grid[x][y]/totX[x]:0) : grid[x][y] )}));
  const stacked=(mode!=='grp'); // empile sauf en mode barres groupees
  draw(id,{type:'bar',data:{labels:catsX,datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{boxWidth:12}},
        tooltip:{callbacks:{label:c=>{const raw=grid[catsX[c.dataIndex]][c.dataset.label]; const t=totX[catsX[c.dataIndex]];
          return mode==='pct'?`${c.dataset.label}: ${raw} (${(c.parsed.y).toFixed(1)}%)`:`${c.dataset.label}: ${raw}`;}}}},
      scales:{x:{stacked,ticks:{autoSkip:false,maxRotation:60,minRotation:0}},
              y:{stacked,max:mode==='pct'?100:undefined,ticks:{callback:v=>mode==='pct'?v+'%':v}}}}});
  return {catsX,catsY,grid,totX};
}

// yesRateChart() : pour une LISTE de variables binaires (Oui/Non), affiche le
// pourcentage de "Oui" de chacune. Sert aux batteries de questions de qualite.
function yesRateChart(id,keys,recs,positive='Oui'){
  const labels=keys.map(k=>DIMS[k]||k);
  const vals=keys.map(k=>{let o=0,n=0; recs.forEach(d=>{const v=(d[k]??'').toString().trim(); if(v==='Oui'||v==='OUI')o++; else if(v==='Non'||v==='NON')n++;}); const t=o+n; return t?100*o/t:0;});
  draw(id,{type:'bar',data:{labels,datasets:[{data:vals,backgroundColor:vals.map(v=>v>=50?'#4c9a4c':'#d9534f'),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.x.toFixed(1)}% de « Oui »`}}},
      scales:{x:{max:100,ticks:{callback:v=>v+'%'}},y:{ticks:{autoSkip:false}}}}});
}


/* ============================================================================
   6. INDICATEURS CLES (KPIs)
   ============================================================================ */

// rate() : part (%) des enquetes dont la variable "key" vaut l'une des "vals".
// Calculee uniquement sur les reponses non vides (base = repondants valides).
function rate(recs,key,vals){
  let ok=0,t=0; const set=new Set(vals.map(v=>v.toLowerCase()));
  recs.forEach(d=>{const v=(d[key]??'').toString().trim();if(v){t++;if(set.has(v.toLowerCase()))ok++;}});
  return t?100*ok/t:0;
}
// median() : valeur mediane d'un tableau de nombres
function median(arr){if(!arr.length)return null;const s=[...arr].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
// animateCount() : anime un compteur de 0 vers sa valeur finale (ex "56%", "2 000 F", "726")
function animateCount(el,finalText){
  const m=(finalText||'').match(/^(\D*)([\d\s.,]+)(.*)$/);
  if(!m){ el.textContent=finalText; return; }
  const pre=m[1], suf=m[3], target=parseFloat(m[2].replace(/\s/g,'').replace(',','.'));
  if(isNaN(target)){ el.textContent=finalText; return; }
  const dur=650, t0=performance.now();
  const fmt=v=> target>=1000?Math.round(v).toLocaleString('fr-FR'):Math.round(v);
  const step=now=>{ const p=Math.min(1,(now-t0)/dur); el.textContent=pre+fmt(target*(1-Math.pow(1-p,3)))+suf; if(p<1)requestAnimationFrame(step); else el.textContent=finalText; };
  requestAnimationFrame(step);
}

// renderKPIs() : (re)calcule et affiche les 8 cartes d'indicateurs en haut
function renderKPIs(recs){
  const n=recs.length;
  const kMod=rate(recs,'premierRecoursCat',['Médecine moderne']);
  const kPub=rate(recs,'premierRecours',['La formation sanitaire publique']);
  const kTradi=rate(recs,'premierRecoursCat',['Médecine traditionnelle']);
  const kAssur=rate(recs,'assurance',['Oui']);
  const kFreq=rate(recs,'frequentation',['Oui']);
  const kSat=rate(recs,'satisfaitMedecin',['Oui']);
  const kGuer=rate(recs,'resultatTraitement',['Guérison','Amélioration']);
  const med=median(recs.map(d=>d.coutConsultation).filter(v=>typeof v==='number'));
  const kpis=[
    {v:n,l:'Enquêtés (sélection)',s:`sur ${DATA.length} au total`},
    {v:kPub.toFixed(0)+'%',l:'1er recours = hôpital public'},
    {v:kMod.toFixed(0)+'%',l:'Recours à la médecine moderne'},
    {v:kTradi.toFixed(0)+'%',l:'Recours à la médecine traditionnelle'},
    {v:kAssur.toFixed(0)+'%',l:'Possèdent une assurance maladie'},
    {v:med!=null?med.toLocaleString('fr-FR')+' F':'—',l:'Coût médian d\'une consultation'},
    {v:kSat.toFixed(0)+'%',l:'Satisfaits du médecin traitant'},
    {v:kGuer.toFixed(0)+'%',l:'Guérison ou amélioration'}
  ];
  document.getElementById('kpis').innerHTML=kpis.map(k=>`<div class="kpi"><div class="v">${k.v}</div><div class="l">${k.l}</div>${k.s?`<div class="s">${k.s}</div>`:''}</div>`).join('');
  document.querySelectorAll('#kpis .v').forEach(el=>animateCount(el,el.textContent)); // compteurs animes
}


/* ============================================================================
   7. LA CARTE (Leaflet)
   ============================================================================ */

let map,baseLayers,currentBase,markerLayer,clusterLayer;
let centresLayer,buffer500Layer,buffer1000Layer,boundaryLayer,gridLayer; // couches de l'analyse spatiale
let homeBounds=null, measureOn=false, measurePts=[], measureLayer=null; // outils SIG
let isoMode=false, isoLayer=null; // isochrones d'accessibilite
let underLayer=null; // zones faiblement desservies (hors 15 min)
let gridCounts={}; // effectif d'enquetes par cellule (recalcule en direct pendant l'edition)
const GRID_COL={1:'#f0cf87',2:'#5fae5f',3:'#e69a34',4:'#d9534f'}; // couleur cellule selon nb d'enquetes

// recomputeGridCounts() : recompte les enquetes par cellule (d'apres cellId)
function recomputeGridCounts(){ gridCounts={}; DATA.forEach(d=>{ if(d.cellId!=null) gridCounts[d.cellId]=(gridCounts[d.cellId]||0)+1; }); }
// styleCell() : style d'une cellule de la grille selon son effectif (couleur/opacite pilotees par mapStyle, etape 5b)
function styleCell(f){
  const isNon=(f.properties.acces==='NON'); const n=gridCounts[f.properties.id]||0; const om=opacityMult();
  if(isNon) return {color:'#7a828c',weight:.6,fillColor:'#9aa5b1',fillOpacity:Math.min(1,.35*om),dashArray:'2 2'};
  if(n===0)  return {color:mapStyle.colorGrille,weight:.5,fill:false};
  return {color:mapStyle.colorGrille,weight:.6,fillColor:GRID_COL[Math.min(n,4)],fillOpacity:Math.min(1,.5*om)};
}
// pointInGeom() : test point-dans-polygone (x=lng, y=lat) pour retrouver la cellule d'un point
function pointInGeom(x,y,geom){
  const polys = geom.type==='MultiPolygon'?geom.coordinates:[geom.coordinates];
  for(const poly of polys){
    let inside=false; const ring=poly[0];
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
      if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
    }
    if(inside) return true;
  }
  return false;
}
// cellAt() : proprietes de la cellule contenant le point (ou null hors grille)
function cellAt(lat,lng){ if(!GRID) return null; for(const f of GRID.features){ if(pointInGeom(lng,lat,f.geometry)) return f.properties; } return null; }

// Couleur d'un centre de sante selon son type simplifie
const CENTRE_COL={'Hopital':'#b5121b','Clinique privee':'#7a3fa0','Centre de sante (1er contact)':'#0d8a6a','Cabinet / Infirmerie':'#e8813a','Autre / a verifier':'#8a94a6'};

// initMap() : cree la carte une seule fois, centree sur Yopougon
function initMap(){
  map=L.map('map',{preferCanvas:true}).setView([5.345,-4.075],13);
  // fonds de carte disponibles (plan, clair, satellite Google, satellite + rues)
  baseLayers={
    osm:  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}),
    carto:L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'}),
    cartodark:L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'}),
    gsat: L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{maxZoom:20,subdomains:['mt0','mt1','mt2','mt3'],attribution:'Imagerie © Google'}),
    ghyb: L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{maxZoom:20,subdomains:['mt0','mt1','mt2','mt3'],attribution:'Imagerie © Google'}),
    esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imagerie © Esri, Maxar, Earthstar Geographics'})
  };
  currentBase=baseLayers.osm; currentBase.addTo(map);
  markerLayer=L.layerGroup().addTo(map); // couche qui contiendra les enquetes
  isoLayer=L.layerGroup(); // couche des isochrones d'accessibilite
  underLayer=L.layerGroup(); // couche des personnes hors zone 15 min

  buildSpatialLayers(); // cree les couches centres / buffers / limite
  homeBounds = YOP ? L.geoJSON(YOP).getBounds() : null;
  addGisTools(); // echelle, coordonnees, plein ecran, vue d'ensemble, mesure

  // choix du fond de carte
  document.getElementById('basemapSelect').addEventListener('change',e=>{
    map.removeLayer(currentBase); currentBase=baseLayers[e.target.value]||baseLayers.osm; currentBase.addTo(map); currentBase.bringToBack();
  });
  // bascule du regroupement (cluster)
  document.getElementById('clusterToggle').addEventListener('change',()=>renderMap(filtered()));
  // bascules des couches spatiales : on affiche/masque la couche correspondante
  const tog=(id,layer)=>document.getElementById(id).addEventListener('change',e=>{e.target.checked?layer.addTo(map):map.removeLayer(layer);});
  tog('centresToggle',centresLayer); tog('buffer500Toggle',buffer500Layer); tog('buffer1000Toggle',buffer1000Layer); tog('boundaryToggle',boundaryLayer);
  // affichage de la grille (par-dessus les fonds mais sous les points)
  document.getElementById('gridToggle').addEventListener('change',e=>{ if(e.target.checked){gridLayer.addTo(map);gridLayer.bringToBack();boundaryLayer.bringToBack&&boundaryLayer.bringToBack();} else map.removeLayer(gridLayer); });
  // bascule vue echantillonnage : change la source des coordonnees et redessine
  document.getElementById('gridViewToggle').addEventListener('change',e=>{
    gridView=e.target.checked;
    if(gridView && !document.getElementById('gridToggle').checked){ document.getElementById('gridToggle').checked=true; gridLayer.addTo(map); gridLayer.bringToBack(); }
    renderMap(filtered());
  });
}

// buildSpatialLayers() : construit les couches SIG. Rejouable (etape 5b, changement
// de style) : on VIDE et REPEUPLE les MEMES objets layerGroup plutot que d'en creer
// de nouveaux, pour ne pas casser les cases a cocher deja branchees dessus (tog()).
function buildSpatialLayers(){
  // 1) limite communale de Yopougon (contour) — creee une seule fois, pas de restylage prevu ici
  if(!boundaryLayer){ boundaryLayer = YOP ? L.geoJSON(YOP,{style:{color:'#0f5e8f',weight:2,fill:false,dashArray:'4 3'}}) : L.layerGroup(); boundaryLayer.addTo(map); }

  // 2) centres de sante + zones de couverture (couleurs pilotees par mapStyle)
  const firstBuild=!centresLayer;
  if(!centresLayer) centresLayer=L.layerGroup();
  if(!buffer500Layer) buffer500Layer=L.layerGroup();
  if(!buffer1000Layer) buffer1000Layer=L.layerGroup();
  centresLayer.clearLayers(); buffer500Layer.clearLayers(); buffer1000Layer.clearLayers();
  const om=opacityMult();
  CENTRES.forEach(c=>{
    const col=mapStyle.colorCentres;
    // symbologie cartographique standard d'un point de sante : rond + croix blanche a l'interieur
    const icon=L.divIcon({className:'centre-ico',iconSize:[20,20],iconAnchor:[10,10],
      html:`<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="${col}" stroke="#fff" stroke-width="1.6"/><path d="M10 5.2V14.8M5.2 10H14.8" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/></svg>`});
    const mk=L.marker([c.lat,c.lon],{icon});
    mk.bindPopup(()=>centrePopupHtml(c),{maxWidth:270}); // fiche calculee a l'ouverture (compte les personnes les + proches a jour)
    mk.on('click',()=>{ if(isoMode) computeIsochrone(c); }); // isochrones a la demande
    centresLayer.addLayer(mk);
    // zones de couverture autour des centres de PREMIER CONTACT uniquement
    if(c.type==='Centre de sante (1er contact)'){
      buffer500Layer.addLayer(L.circle([c.lat,c.lon],{radius:500,color:mapStyle.colorCouverture,weight:1,fillColor:mapStyle.colorCouverture,fillOpacity:Math.min(1,.08*om)}));
      buffer1000Layer.addLayer(L.circle([c.lat,c.lon],{radius:1000,color:mapStyle.colorCouverture,weight:1,fillColor:mapStyle.colorCouverture,fillOpacity:Math.min(1,.05*om)}));
    }
  });
  if(firstBuild) centresLayer.addTo(map); // affiches par defaut (case cochee), une seule fois

  // 3) grille d'echantillonnage : cellules colorees selon le nombre d'enquetes affectes
  if(GRID){
    recomputeGridCounts();
    if(!gridLayer){
      gridLayer=L.geoJSON(GRID,{
        style:styleCell,
        onEachFeature:(f,l)=>{ l.on('click',()=>{ const n=gridCounts[f.properties.id]||0;
          l.bindPopup(`<div class="pop"><b>Cellule ${f.properties.id}</b><br>${f.properties.acces==='NON'?'Zone non enquêtée (industrielle)':n+' enquêté(s) affecté(s)'}</div>`).openPopup(); }); }
      });
    } else { gridLayer.clearLayers(); gridLayer.addData(GRID); }
  } else if(!gridLayer) gridLayer=L.layerGroup();
}

// popupHtml() : fiche d'information affichee quand on clique un point enquete
function popupHtml(d){
  const rows=[['Quartier',d.quartier],['Sexe',d.sexe],['Âge',d.age],
    ['Recours aux soins',d.premierRecours],['Centre le + proche',d.nearestName],
    ['Distance estimée',d.nearestDist!=null?d.nearestDist+' m':null],
    ['Temps de marche',d.walkMin!=null?'~'+d.walkMin+' min':null],
    ['Statut de couverture',d.coverClass],
    ['Mode de déplacement',d.locomotion],['Coût du transport',d.coutTransport],
    ['Perception distance',d.opinionDistance],['Maladie',d.maladieCat],['Résultat',d.resultatTraitement]]
    .filter(r=>r[1]!=null && r[1]!=='');
  const badgeCol=COVER_COL[d.coverClass]||'rgba(255,255,255,.25)';
  return `<div class="pop"><span class="ttl">Enquêté n°${d.id}${d.coverClass?` <span class="badge" style="background:${badgeCol}">${d.coverClass}</span>`:''}</span>
    <table>${rows.map(r=>`<tr><td class="k">${r[0]}</td><td class="v">${r[1]}</td></tr>`).join('')}</table></div>`;
}
// centrePopupHtml() : fiche d'information pour un centre de sante
function centrePopupHtml(c){
  const near=DATA.filter(d=>d.nearestName===c.nom);
  const c5=near.filter(d=>d.coverClass==='5 min').length, c10=near.filter(d=>d.coverClass==='10 min').length, c15=near.filter(d=>d.coverClass==='15 min').length;
  const rows=[['Type',c.categorie],['Niveau',c.niveau],['Secteur',c.secteur],['Quartier',c.quartier||'—'],
    ['Personnes âgées les + proches',near.length],['Couvertes à 5 min',c5],['Couvertes à 10 min',c10],['Couvertes à 15 min',c15]];
  return `<div class="pop"><span class="ttl">${c.nom}</span><table>${rows.map(r=>`<tr><td class="k">${r[0]}</td><td class="v">${r[1]}</td></tr>`).join('')}</table></div>`;
}

// renderMap() : (re)dessine les points selon la selection et la variable choisie
function renderMap(recs){
  const key=document.getElementById('colorBy').value;      // variable qui donne la couleur
  markerLayer.clearLayers(); if(clusterLayer){map.removeLayer(clusterLayer);clusterLayer=null;}
  const cluster=document.getElementById('clusterToggle').checked && L.markerClusterGroup;
  const target = cluster ? (clusterLayer=L.markerClusterGroup({maxClusterRadius:45})) : markerLayer;
  const baseR=mapStyle.pointSize, hoverR=baseR+3, editOuter=Math.round(baseR*2.9), editInner=Math.max(6,Math.round(baseR*2.36)); // taille des points (etape 5b)
  recs.forEach(d=>{
    // position selon le mode : reelle (lat/lng) ou grille d'echantillonnage (gLat/gLon)
    const la = gridView ? d.gLat : d.lat, ln = gridView ? d.gLon : d.lng;
    if(typeof la!=='number'||typeof ln!=='number'||!la) return; // ignorer les points sans coordonnees
    const val=(d[key]??'').toString().trim()||'(non renseigné)';
    const col=val==='(non renseigné)'?'#9aa5b1':colorFor(key,val);
    let mk;
    if(editMode){ // mode edition : point deplacable a la souris
      mk=L.marker([la,ln],{draggable:true,icon:L.divIcon({className:'',iconSize:[editOuter,editOuter],iconAnchor:[editOuter/2,editOuter/2],
        html:`<div style="width:${editInner}px;height:${editInner}px;border-radius:50%;background:${col};border:2px solid #fff;box-shadow:0 0 3px rgba(0,0,0,.7);cursor:move"></div>`})});
      mk.on('dragend',()=>onDragEnd(d,mk));
    } else {
      mk=L.circleMarker([la,ln],{radius:baseR,color:'#ffffff',weight:1.4,fillColor:col,fillOpacity:.9});
      // interactivite : survol qui met en avant le point
      mk.on('mouseover',function(){ this.setStyle({radius:hoverR,weight:2,fillOpacity:1}); this.bringToFront&&this.bringToFront(); });
      mk.on('mouseout', function(){ this.setStyle({radius:baseR,weight:1.4,fillOpacity:.9}); });
    }
    mk.bindPopup(popupHtml(d),{maxWidth:260}); target.addLayer(mk);
  });
  if(cluster) map.addLayer(clusterLayer);
  renderUnderserved(recs); // met en evidence les personnes hors zone 15 min si active
  renderLegend(key,recs);
}

// renderUnderserved() : halos rouges autour des enquetes hors zone 15 min (suit les filtres)
function renderUnderserved(recs){
  if(!underLayer) return;
  underLayer.clearLayers();
  const on=document.getElementById('underToggle') && document.getElementById('underToggle').checked;
  if(!on){ if(map.hasLayer(underLayer)) map.removeLayer(underLayer); return; }
  const latF=gridView?'gLat':'lat', lngF=gridView?'gLon':'lng';
  recs.forEach(d=>{ if(d.coverClass==='Hors 15 min' && typeof d[latF]==='number'){
    L.circleMarker([d[latF],d[lngF]],{radius:11,color:'#d73027',weight:2,fill:false,opacity:.9,dashArray:'3 3'}).addTo(underLayer); }});
  if(!map.hasLayer(underLayer)) underLayer.addTo(map);
}

// renderLegend() : legende dynamique flottante (creee une fois par legendCtl, mise a jour ici).
// S'adapte au type de variable : classes de valeurs pour le quantitatif, categories pour le qualitatif.
let legendCollapsed=false;
function renderLegend(key,recs){
  const box=document.getElementById('legendBody'); if(!box) return;
  const m=countBy(recs,key); const cats=ordered(key,m);
  document.getElementById('legendTitle').textContent=DIMS[key]||NUM[key]||key;
  box.innerHTML=cats.map(c=>`<div class="li"><span class="sw" style="background:${colorFor(key,c)}"></span><span style="flex:1">${c}</span><span class="cnt">${m.get(c)||0}</span></div>`).join('')
    +(m.size?'':'<div class="muted">Aucune donnée pour la sélection</div>');
}

// applyMapStyle() : reconstruit les couches SIG stylees (centres/couverture/grille) et
// redessine les points avec les reglages courants, puis memorise le style (etape 5b).
function applyMapStyle(){
  buildSpatialLayers();
  renderMap(filtered());
  localStorage.setItem('map_style_v1', JSON.stringify(mapStyle));
}

// highlightQuartier() : surligne temporairement l'emprise d'un quartier sur la carte
// (utilise par le tableau matrice, etape 4, quand on clique une ligne « quartier »).
let quartierHiLayer=null, quartierHiTimer=null;
function highlightQuartier(lat,lng,radiusM){
  if(!quartierHiLayer) quartierHiLayer=L.layerGroup();
  quartierHiLayer.clearLayers();
  L.circle([lat,lng],{radius:radiusM,color:mapStyle.colorQuartier,weight:2,fillColor:mapStyle.colorQuartier,fillOpacity:.10,dashArray:'6 4'}).addTo(quartierHiLayer);
  if(!map.hasLayer(quartierHiLayer)) quartierHiLayer.addTo(map);
  clearTimeout(quartierHiTimer);
  quartierHiTimer=setTimeout(()=>{ quartierHiLayer.clearLayers(); },6000); // s'efface au bout de 6 s
}

/* ---------- Outils SIG (echelle, coordonnees, plein ecran, mesure) ---------- */
function addGisTools(){
  L.control.scale({imperial:false,maxWidth:150}).addTo(map); // barre d'echelle metrique

  // legende dynamique flottante (bas droite) : titre + liste, bouton afficher/masquer
  const LegendCtl=L.Control.extend({options:{position:'bottomright'},
    onAdd:function(){
      const d=L.DomUtil.create('div','legendbox');
      d.innerHTML=`<div class="lgh"><span id="legendTitle">Légende</span><span id="legendToggle">▾</span></div><div class="lgbody" id="legendBody"></div>`;
      L.DomEvent.disableClickPropagation(d);
      return d; }});
  map.addControl(new LegendCtl());
  document.getElementById('legendToggle').addEventListener('click',()=>{
    legendCollapsed=!legendCollapsed;
    document.querySelector('.legendbox').classList.toggle('collapsed',legendCollapsed);
    document.getElementById('legendToggle').textContent=legendCollapsed?'▸':'▾';
  });

  // coordonnees sous le curseur (bas gauche)
  const CoordCtl=L.Control.extend({options:{position:'bottomleft'},
    onAdd:function(){ const d=L.DomUtil.create('div','gis-coord'); d.innerHTML='lat, lon'; this._d=d; return d; }});
  const coordCtl=new CoordCtl(); map.addControl(coordCtl);
  map.on('mousemove',e=>{ coordCtl._d.innerHTML=`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`; });

  // barre de boutons (haut droite) : vue d'ensemble, mesure, plein ecran
  const bar=L.control({position:'topright'});
  bar.onAdd=function(){ const c=L.DomUtil.create('div','leaflet-bar gis-bar');
    c.innerHTML=`<a href="#" title="Vue d'ensemble de Yopougon" id="gisHome">⌂</a>`+
                `<a href="#" title="Mesurer une distance (clic sur la carte, double-clic pour effacer)" id="gisMeasure">📏</a>`+
                `<a href="#" title="Plein écran" id="gisFull">⛶</a>`;
    L.DomEvent.disableClickPropagation(c); return c; };
  bar.addTo(map);
  document.getElementById('gisHome').onclick=e=>{e.preventDefault(); if(homeBounds)map.fitBounds(homeBounds);};
  document.getElementById('gisFull').onclick=e=>{e.preventDefault(); const el=map.getContainer();
    if(!document.fullscreenElement){ el.requestFullscreen&&el.requestFullscreen(); } else { document.exitFullscreen(); }
    setTimeout(()=>map.invalidateSize(),250);};
  document.getElementById('gisMeasure').onclick=e=>{e.preventDefault(); toggleMeasure();};

  // clics pour la mesure
  map.on('click',e=>{ if(measureOn){ measurePts.push(e.latlng); drawMeasure(); } });
  map.on('dblclick',()=>{ if(measureOn){ clearMeasure(); } });
}
function toggleMeasure(){
  measureOn=!measureOn;
  const b=document.getElementById('gisMeasure'); if(b) b.style.background=measureOn?'#e8813a':'';
  if(measureOn){ measurePts=[]; map.doubleClickZoom.disable(); map.getContainer().style.cursor='crosshair'; }
  else { clearMeasure(); map.doubleClickZoom.enable(); map.getContainer().style.cursor=''; }
}
function clearMeasure(){ if(measureLayer){ map.removeLayer(measureLayer); measureLayer=null; } measurePts=[]; }
function drawMeasure(){
  if(measureLayer) map.removeLayer(measureLayer);
  measureLayer=L.layerGroup().addTo(map);
  if(measurePts.length>1) L.polyline(measurePts,{color:'#e8813a',weight:3,dashArray:'6 4'}).addTo(measureLayer);
  measurePts.forEach(p=>L.circleMarker(p,{radius:4,color:'#e8813a',fillColor:'#fff',fillOpacity:1,weight:2}).addTo(measureLayer));
  let tot=0; for(let i=1;i<measurePts.length;i++) tot+=measurePts[i-1].distanceTo(measurePts[i]);
  if(measurePts.length){ const last=measurePts[measurePts.length-1];
    L.marker(last,{icon:L.divIcon({className:'',iconSize:[110,20],iconAnchor:[-10,10],
      html:`<div class="gis-measlabel">${tot<1000?Math.round(tot)+' m':(tot/1000).toFixed(2)+' km'}</div>`})}).addTo(measureLayer);
  }
}

/* ---------- Isochrones d'accessibilite (objectif 2) ---------- */
function setIsoInfo(t){ const el=document.getElementById('isoInfo'); if(el) el.innerHTML=t; }
// computeIsochrone() : zones atteignables a pied (5/10/15 min) autour d'un centre.
// Utilise OpenRouteService si une cle est fournie, sinon des cercles approximatifs.
async function computeIsochrone(c){
  isoLayer.clearLayers(); if(!map.hasLayer(isoLayer)) isoLayer.addTo(map);
  const key=(localStorage.getItem('ors_key')||'').trim();
  const cols=shades3(mapStyle.colorIsochrones); // 5, 10, 15 min — 3 teintes derivees de la couleur choisie (etape 5b)
  if(key){
    setIsoInfo(`Calcul des isochrones réseau autour de « ${c.nom} »…`);
    try{
      const res=await fetch('https://api.openrouteservice.org/v2/isochrones/foot-walking',
        {method:'POST',headers:{'Authorization':key,'Content-Type':'application/json'},
         body:JSON.stringify({locations:[[c.lon,c.lat]],range:[300,600,900],range_type:'time'})});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const gj=await res.json();
      // dessiner du plus grand (15 min) au plus petit (5 min)
      gj.features.sort((a,b)=>b.properties.value-a.properties.value).forEach(f=>{
        const v=f.properties.value, idx=v<=300?0:v<=600?1:2;
        L.geoJSON(f,{style:{color:cols[idx],weight:1.6,fillColor:cols[idx],fillOpacity:.2}}).addTo(isoLayer); });
      L.marker([c.lat,c.lon]).addTo(isoLayer);
      setIsoInfo(`<b>${c.nom}</b> — isochrones à pied : <span style="color:${cols[0]}">5 min</span> · <span style="color:${cols[1]}">10 min</span> · <span style="color:${cols[2]}">15 min</span>.`);
    }catch(e){ approxIso(c,cols); setIsoInfo(`API indisponible (${e.message}). Zones approximatives affichées. Vérifiez votre clé.`); }
  } else { approxIso(c,cols);
    setIsoInfo(`<b>${c.nom}</b> — zones approximatives (marche ~4,8 km/h) : 5/10/15 min. Ajoutez une clé OpenRouteService pour des isochrones réseau précises.`); }
}
// approxIso() : cercles de distance equivalents a 5/10/15 min de marche (~400/800/1200 m)
function approxIso(c,cols){ [[1200,cols[2]],[800,cols[1]],[400,cols[0]]].forEach(([r,col])=>
  L.circle([c.lat,c.lon],{radius:r,color:col,weight:1.6,fillColor:col,fillOpacity:.14}).addTo(isoLayer)); }

/* ---------- Enregistrement en ligne optionnel (Supabase) ----------
   Permet une sauvegarde AUTOMATIQUE et partagee des deplacements, sans exporter.
   Inactif tant que l'URL et la cle ne sont pas renseignees. Voir GUIDE.md. */
function setEditInfo(t){ const el=document.getElementById('editInfo'); if(el) el.innerHTML=t; }
function setCloudInfo(t){ const el=document.getElementById('cloudInfo'); if(el) el.innerHTML=t; else setEditInfo(t); }
function sbCfg(){ return { url:(localStorage.getItem('sb_url')||'').trim().replace(/\/+$/,''), key:(localStorage.getItem('sb_key')||'').trim() }; }
// cloudPublish() : teste la connexion puis envoie les points modifies vers Supabase (upsert)
async function cloudPublish(){
  const {url,key}=sbCfg(); if(!url||!key){ setCloudInfo('⚠ Renseignez d\'abord l\'URL et la clé Supabase, puis cliquez en dehors du champ.'); return; }
  const rows=DATA.filter(d=> d.gLat!==d._gLat0||d.gLon!==d._gLon0||d.lat!==d._lat0||d.lng!==d._lng0)
    .map(d=>({id:d.id,glat:d.gLat,glon:d.gLon,cellid:d.cellId,lat:d.lat,lng:d.lng}));
  setCloudInfo('Connexion à Supabase…');
  try{
    // 1) test de connexion (verifie l'URL, la cle et la table)
    const test=await fetch(url+'/rest/v1/points_overrides?select=id&limit=1',{headers:{'apikey':key,'Authorization':'Bearer '+key}});
    if(!test.ok) throw new Error('HTTP '+test.status+' — '+(await test.text()).slice(0,120));
    if(!rows.length){ setCloudInfo('✓ Connexion réussie. Aucune modification à publier pour l\'instant : déplace un point en Mode édition, puis reclique Publier.'); return; }
    // 2) envoi des modifications
    const res=await fetch(url+'/rest/v1/points_overrides',{method:'POST',
      headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},
      body:JSON.stringify(rows)});
    if(!res.ok) throw new Error('HTTP '+res.status+' — '+(await res.text()).slice(0,120));
    setCloudInfo(`✓ ${rows.length} modification(s) publiée(s) en ligne (visibles sur tous les appareils).`);
  }catch(e){ setCloudInfo('✗ Échec : '+e.message); }
}
// cloudLoad() : recharge les deplacements publies et les applique
async function cloudLoad(){
  const {url,key}=sbCfg(); if(!url||!key) return 0;
  try{
    const res=await fetch(url+'/rest/v1/points_overrides?select=*',{headers:{'apikey':key,'Authorization':'Bearer '+key}});
    if(!res.ok) return 0;
    const arr=await res.json(); const byId={}; DATA.forEach(d=>byId[d.id]=d); let n=0;
    arr.forEach(o=>{ const d=byId[o.id]; if(!d)return;
      if(o.glat!=null){ d.gLat=+o.glat; d.gLon=+o.glon; d.cellId=o.cellid!=null?+o.cellid:d.cellId; }
      if(o.lat!=null){ d.lat=+o.lat; d.lng=+o.lng; } n++; });
    recomputeGridCounts(); if(gridLayer) gridLayer.setStyle(styleCell);
    return n;
  }catch(e){ return 0; }
}

// loadFullDataFromCloud() : si une table `enquetes` existe dans Supabase, charge TOUTES
// les donnees depuis elle (au lieu de data.js). Ainsi, toute modification faite dans
// pgAdmin/Supabase agit directement sur la plateforme. Repli sur data.js si indisponible.
const NUM_FIELDS=['id','lat','lng','gLat','gLon','cellId','gCount','gMoved','gMoveDist','gFromNon','gHorsCommune','dAny','dPub','dPrim','coutConsultation','coutMax','loyer'];
async function loadFullDataFromCloud(){
  const {url,key}=sbCfg(); if(!url||!key) return false;
  try{
    const res=await fetch(url+'/rest/v1/enquetes?select=*&limit=5000',{headers:{'apikey':key,'Authorization':'Bearer '+key}});
    if(!res.ok){ setCloudInfo('ℹ Table « enquetes » absente ou inaccessible (code '+res.status+'). Données locales utilisées.'); return false; }
    let rows=await res.json();
    if(!Array.isArray(rows)||rows.length<10){ setCloudInfo('ℹ Table « enquetes » vide ou policy de lecture manquante. Données locales utilisées.'); return false; }
    // convertir les champs numeriques (au cas ou ils reviennent en texte)
    rows.forEach(r=>NUM_FIELDS.forEach(f=>{ if(r[f]!==null&&r[f]!==undefined&&r[f]!==''){ const n=+r[f]; if(!isNaN(n)) r[f]=n; } }));
    // validation : au moins 80% des points doivent avoir des coordonnees valides
    const ok=rows.filter(r=>typeof r.lat==='number'&&typeof r.lng==='number'&&r.lat).length;
    if(ok < rows.length*0.8){ setCloudInfo('ℹ Données « enquetes » incomplètes (coordonnées). Données locales utilisées.'); return false; }
    DATA.length=0; rows.forEach(r=>DATA.push(r));               // remplace le jeu de donnees
    DATA.forEach(d=>{ d._gLat0=d.gLat; d._gLon0=d.gLon; d._cellId0=d.cellId; d._lat0=d.lat; d._lng0=d.lng; });
    Object.keys(DIMS).forEach(k=>CATS[k]=catsOf(k));            // recalcule les modalites/couleurs
    setCloudInfo('✓ '+DATA.length+' enquêtés chargés depuis la base en ligne (modifiables via pgAdmin/Supabase).');
    return true;
  }catch(e){ return false; }
}

/* ---------- Mode edition : deplacer les points a la souris ---------- */
// onDragEnd() : appele quand on lache un point deplace. Met a jour ses coordonnees,
// recalcule sa cellule, recolorie la grille, enregistre le deplacement.
function onDragEnd(d,mk){
  const p=mk.getLatLng();
  if(gridView){ d.gLat=+p.lat.toFixed(7); d.gLon=+p.lng.toFixed(7); }
  else        { d.lat=+p.lat.toFixed(7);  d.lng=+p.lng.toFixed(7); }
  const cell=cellAt(p.lat,p.lng);
  if(gridView) d.cellId = cell?cell.id:null; // rattachement automatique a la nouvelle cellule
  computeNearest(); // recalcule le centre le plus proche apres deplacement
  saveEdit(d);
  recomputeGridCounts(); if(gridLayer) gridLayer.setStyle(styleCell);
  mk.setPopupContent(popupHtml(d));
  const nonWarn = (cell && cell.acces==='NON') ? ' <b style="color:#d9534f">(zone NON, non habitée)</b>' : '';
  document.getElementById('editInfo').innerHTML =
    `Point n°${d.id} → <b>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</b>` + (cell?` · cellule ${cell.id}${nonWarn}`:' · <b>hors grille</b>');
  if(currentTab==='spatial') renderGridPlan(); // met a jour les indicateurs du plan
}
// saveEdit() : enregistre le deplacement d'un enquete dans le navigateur (localStorage)
function saveEdit(d){
  let e={}; try{ e=JSON.parse(localStorage.getItem(EDIT_KEY)||'{}'); }catch(_){}
  e[d.id]=e[d.id]||{};
  if(gridView){ e[d.id].gLa=d.gLat; e[d.id].gLn=d.gLon; e[d.id].cid=d.cellId; }
  else        { e[d.id].la=d.lat;  e[d.id].ln=d.lng; }
  localStorage.setItem(EDIT_KEY,JSON.stringify(e));
}
// applySavedEdits() : au chargement, reapplique les deplacements enregistres
function applySavedEdits(){
  let e={}; try{ e=JSON.parse(localStorage.getItem(EDIT_KEY)||'{}'); }catch(_){}
  let n=0;
  DATA.forEach(d=>{ const s=e[d.id]; if(!s)return; n++;
    if(s.gLa!=null){ d.gLat=s.gLa; d.gLon=s.gLn; d.cellId=(s.cid!=null?s.cid:(cellAt(s.gLa,s.gLn)||{}).id); }
    if(s.la!=null){ d.lat=s.la; d.lng=s.ln; }
  });
  recomputeGridCounts();
  return n;
}
// download() : utilitaire de telechargement d'un fichier texte
function download(name,text,mime){ const blob=new Blob([text],{type:(mime||'text/plain')+';charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }

// champs internes a NE PAS exporter (memoires de reinitialisation)
const HIDDEN=['_gLat0','_gLon0','_cellId0','_lat0','_lng0'];

// exportPositions() : telecharge un CSV COMPLET (toutes les colonnes), actualise avec les
// deplacements. Les coordonnees d'echantillonnage et la cellule refletent tes modifications.
function exportPositions(){
  const cols=Object.keys(DATA[0]).filter(k=>!HIDDEN.includes(k));
  const esc=v=>{ v=(v==null?'':(''+v)).replace(/"/g,'""'); return /[;"\n]/.test(v)?`"${v}"`:v; };
  const lines=[cols.join(';')];
  DATA.forEach(d=>lines.push(cols.map(c=>esc(d[c])).join(';')));
  download('bakusmap_donnees_actualisees.csv','﻿'+lines.join('\r\n'),'text/csv');
}
// exportDataJs() : genere le fichier data.js pret a remplacer dans data/ pour rendre les
// modifications DEFINITIVES sur la plateforme (a re-publier ensuite).
function exportDataJs(){
  const clean=DATA.map(d=>{const o={};Object.keys(d).forEach(k=>{if(!HIDDEN.includes(k))o[k]=d[k];});return o;});
  download('data.js','window.DATA = '+JSON.stringify(clean)+';','application/javascript');
}
// importPositions() : recharge des positions depuis un CSV precedemment exporte
// (colonnes id, lat, lng, gLat, gLon, cellId reconnues). Met a jour et enregistre.
function importPositions(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      const txt=r.result.replace(/^﻿/,''); const rows=txt.split(/\r?\n/).filter(x=>x.trim());
      const head=rows[0].split(';').map(h=>h.trim());
      const ix=n=>head.indexOf(n);
      const iId=ix('id'), iLat=ix('lat'), iLng=ix('lng'), iGLat=ix('gLat'), iGLon=ix('gLon'), iCell=ix('cellId');
      if(iId<0){ alert('CSV non reconnu : colonne "id" manquante.'); return; }
      const byId={}; DATA.forEach(d=>byId[d.id]=d);
      let n=0;
      for(let i=1;i<rows.length;i++){ const f=rows[i].split(';'); const d=byId[+f[iId]]; if(!d)continue;
        if(iLat>=0&&f[iLat]!=='') d.lat=+f[iLat];
        if(iLng>=0&&f[iLng]!=='') d.lng=+f[iLng];
        if(iGLat>=0&&f[iGLat]!=='') d.gLat=+f[iGLat];
        if(iGLon>=0&&f[iGLon]!=='') d.gLon=+f[iGLon];
        if(iCell>=0&&f[iCell]!=='') d.cellId=+f[iCell];
        // sauvegarde locale
        let e={};try{e=JSON.parse(localStorage.getItem(EDIT_KEY)||'{}');}catch(_){}
        e[d.id]={gLa:d.gLat,gLn:d.gLon,cid:d.cellId,la:d.lat,ln:d.lng}; localStorage.setItem(EDIT_KEY,JSON.stringify(e));
        n++;
      }
      computeNearest(); recomputeGridCounts(); if(gridLayer) gridLayer.setStyle(styleCell);
      renderMap(filtered()); if(currentTab==='spatial') renderGridPlan();
      document.getElementById('editInfo').textContent=`${n} position(s) importée(s) et appliquée(s).`;
    }catch(err){ alert('Erreur de lecture du CSV : '+err.message); }
  };
  r.readAsText(file);
}
// resetPositions() : annule tous les deplacements et revient aux positions d'origine
function resetPositions(){
  localStorage.removeItem(EDIT_KEY);
  DATA.forEach(d=>{ d.gLat=d._gLat0; d.gLon=d._gLon0; d.cellId=d._cellId0; d.lat=d._lat0; d.lng=d._lng0; });
  computeNearest(); recomputeGridCounts(); if(gridLayer) gridLayer.setStyle(styleCell);
  renderMap(filtered()); if(currentTab==='spatial') renderGridPlan();
  document.getElementById('editInfo').textContent='Déplacements réinitialisés.';
}


/* ============================================================================
   8. LA BARRE DE FILTRES (colonne de gauche)
   ============================================================================ */

// buildFilters() : construit dynamiquement toutes les cases a cocher
function buildFilters(){
  const body=document.getElementById('filterBody');
  body.innerHTML=FILTER_GROUPS.map(grp=>{
    // titre du groupe
    return `<div style="padding:4px 2px 2px;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-top:6px">${grp.g}</div>`+
      grp.keys.map(key=>{
      const m=countBy(DATA,key); const cats=ordered(key,m);
      const many=cats.length>8; // si beaucoup de modalites, on ajoute un champ de recherche
      const opts=cats.map(c=>`<label class="opt"><input type="checkbox" data-k="${key}" value="${esc(c)}"><span>${c}</span><span class="cnt">${m.get(c)||0}</span></label>`).join('');
      return `<details class="fg"><summary>${DIMS[key]||key}<span class="chev">▶</span></summary><div class="opts">${many?`<input class="search" placeholder="Filtrer…" data-search="${key}">`:''}<div data-optbox="${key}">${opts}</div></div></details>`;
    }).join('');
  }).join('') + (TEMPORAL_FIELD ? '' :
    // etape 5a : aucun champ temporel detecte -> message discret plutot qu'un filtre vide
    `<details class="fg"><summary>🕐 Campagne d'enquête / Analyse temporelle<span class="chev">▶</span></summary>`+
    `<div class="opts"><div class="note" style="margin:2px 0 4px">Données issues d'une campagne d'enquête unique. Aucun filtre temporel disponible pour le moment.</div></div></details>`);
  // quand on coche/decoche : on met a jour l'ensemble filters puis on rafraichit tout
  body.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.addEventListener('change',()=>{
    const k=cb.dataset.k; if(!filters[k])filters[k]=new Set();
    if(cb.checked)filters[k].add(cb.value); else filters[k].delete(cb.value);
    if(!filters[k].size)delete filters[k]; // plus rien de coche = plus de filtre
    refresh();
  }));
  // champ de recherche dans les longues listes (ex : quartier)
  body.querySelectorAll('input[data-search]').forEach(s=>s.addEventListener('input',()=>{
    const box=body.querySelector(`[data-optbox="${s.dataset.search}"]`); const q=s.value.toLowerCase();
    box.querySelectorAll('.opt').forEach(o=>{o.style.display=o.textContent.toLowerCase().includes(q)?'':'none';});
  }));
}
// esc() : echappe les guillemets pour ne pas casser le HTML genere
function esc(s){return (s+'').replace(/"/g,'&quot;');}

// renderChips() : affiche les filtres actifs sous forme de pastilles supprimables
function renderChips(){
  const box=document.getElementById('activeChips'); const chips=[];
  for(const k in filters){ [...filters[k]].forEach(v=>chips.push(`<span class="chip">${DIMS[k]||k}: <b>${v}</b> <span class="x" data-k="${k}" data-v="${esc(v)}">✕</span></span>`)); }
  box.innerHTML=chips.length?chips.join('')+`<span class="chip" style="background:#fdeaea;color:#d9534f;border-color:#f5cccc" id="clearAll">Tout effacer ✕</span>`:'';
  // clic sur la croix d'une pastille = retirer ce filtre
  box.querySelectorAll('.x[data-k]').forEach(x=>x.addEventListener('click',()=>{
    filters[x.dataset.k].delete(x.dataset.v); if(!filters[x.dataset.k].size)delete filters[x.dataset.k];
    syncChecks(); refresh();
  }));
  const ca=document.getElementById('clearAll'); if(ca)ca.addEventListener('click',resetFilters);
}
// syncChecks() : remet les cases a cocher en accord avec l'etat filters
function syncChecks(){document.querySelectorAll('#filterBody input[type=checkbox]').forEach(cb=>{cb.checked=!!(filters[cb.dataset.k]&&filters[cb.dataset.k].has(cb.value));});}
// resetFilters() : efface tous les filtres
function resetFilters(){for(const k in filters)delete filters[k];syncChecks();refresh();}


/* ============================================================================
   9. MENUS DEROULANTS (colorer la carte, croiser, explorer)
   ============================================================================ */

// fillSelect() : remplit un <select> simple avec une liste de cles
function fillSelect(el,keys,sel){el.innerHTML=keys.map(k=>`<option value="${k}"${k===sel?' selected':''}>${DIMS[k]||NUM[k]||k}</option>`).join('');}

// optgroupedDims() : construit un <select> avec toutes les variables, rangees
// par grands themes (<optgroup>). Utilise pour l'analyse croisee et l'explorateur.
function optgroupedDims(){
  return `<optgroup label="Profil">`+['sexe','age','nationalite','ethnie','lieuNaissance','matrimonial','religion','instruction','professionCat','cadreProfession','quartier'].map(o=>`<option value="${o}">${DIMS[o]}</option>`).join('')+`</optgroup>`+
  `<optgroup label="Ménage & économie">`+['statutLogement','typeConstruction','nbPieces','locomotion','revenu','depenses','nbEnfantsCat','personnesCharge','autreRevenu'].map(o=>`<option value="${o}">${DIMS[o]}</option>`).join('')+`</optgroup>`+
  `<optgroup label="Accès & recours">`+['existenceCentre','frequentation','coverClass','bandPrim','distancePublique','tempsMis','opinionDistance','coutTransport','opinionTransport','premierRecours','premierRecoursCat','assurance','seulAccompagne','accompagnePar'].map(o=>`<option value="${o}">${DIMS[o]}</option>`).join('')+`</optgroup>`+
  `<optgroup label="Coût & médicaments">`+['opinionCout','coutVsTradi','prixVsPharmacie','acheteTousMedic','acheteSurPlace','prixMedicConvient','iraitPlusSouvent'].map(o=>`<option value="${o}">${DIMS[o]}</option>`).join('')+`</optgroup>`+
  `<optgroup label="Perceptions & qualité">`+['personnelAccueil','tempsAttente','competents','propretePublique','equipPublique','perfPublique','medecinTemps','expliquerMedic','infoRegulier','respecte','dialogue','satisfaitMedecin','personnelGentil','prisConstantes','oriente','recommandeTradi'].map(o=>`<option value="${o}">${DIMS[o]}</option>`).join('')+`</optgroup>`+
  `<optgroup label="Santé & résultats">`+['maladieCat','resultatTraitement','retourneMemeStructure'].map(o=>`<option value="${o}">${DIMS[o]}</option>`).join('')+`</optgroup>`;
}


/* ============================================================================
   10. RENDU DE CHAQUE ONGLET
   ============================================================================ */

let currentTab='carte'; // onglet actuellement affiche

// renderTab() : redessine le contenu de l'onglet actif avec la selection "recs".
// On ne redessine que l'onglet visible, pour rester rapide.
function renderTab(recs){
  if(currentTab==='carte'){ renderMap(recs); }

  if(currentTab==='apercu'){ // profil sociodemographique
    drawGauges(recs); // jauges radiales animees (indicateurs cles)
    barSimple('c_sexe','sexe',recs,{doughnut:true});
    barSimple('c_age','age',recs);
    barSimple('c_instr','instruction',recs);
    barSimple('c_relig','religion',recs,{doughnut:true});
    barSimple('c_prof','professionCat',recs,{horizontal:true});
    barSimple('c_rev','revenu',recs,{horizontal:true});
    barSimple('c_matri','matrimonial',recs,{doughnut:true});
    barSimple('c_nat','nationalite',recs,{doughnut:true});
    barSimple('c_mal','maladieCat',recs,{horizontal:true});
    // top 20 des quartiers (barres horizontales)
    const m=countBy(recs,'quartier'); const top=[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20);
    draw('c_quart',{type:'bar',data:{labels:top.map(t=>t[0]),datasets:[{data:top.map(t=>t[1]),backgroundColor:'#0f5e8f',borderRadius:4}]},
      options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{autoSkip:false}}}}});
  }

  if(currentTab==='recours'){ // le coeur de l'analyse : le recours aux soins
    barSimple('r_prem','premierRecours',recs,{horizontal:true});
    barSimple('r_cat','premierRecoursCat',recs,{doughnut:true});
    crossChart('r_age','age','premierRecours',recs,'pct');          // recours selon l'age
    crossChart('r_sexe','sexe','premierRecours',recs,'pct');        // selon le sexe
    crossChart('r_rev','revenu','premierRecours',recs,'pct');       // selon le revenu
    crossChart('r_instr','instruction','premierRecours',recs,'pct');// selon l'instruction
    barSimple('r_oui','raisonHopitalOui',recs,{horizontal:true,color:'#4c9a4c'});
    barSimple('r_non','raisonHopitalNon',recs,{horizontal:true,color:'#d9534f'});
    barSimple('r_acc','seulAccompagne',recs,{doughnut:true});
    barSimple('r_par','accompagnePar',recs,{doughnut:true});
    barSimple('r_assur','assurance',recs,{doughnut:true});
    crossChart('r_assurx','assurance','premierRecours',recs,'pct'); // selon l'assurance
  }

  if(currentTab==='percept'){ // perceptions et qualite percue
    structPerception('p_struct',recs); // comparaison Public / Prive / Tradi
    yesRateChart('p_rel',['medecinTemps','expliquerMedic','expliquerPrevention','infoRegulier','possibiliteExpr','respecte','dialogue','satisfaitMedecin'],recs);
    yesRateChart('p_acc',['personnelAccueil','competents','personnelGentil','prisConstantes'],recs);
    barSimple('p_cout','opinionCout',recs,{doughnut:true});
    barSimple('p_tradi','coutVsTradi',recs,{doughnut:true});
    barSimple('p_res','resultatTraitement',recs,{doughnut:true});
    barSimple('p_ret','retourneMemeStructure',recs,{doughnut:true});
    // achat des medicaments : % de Oui pour deux questions
    const keys=['acheteTousMedic','acheteSurPlace']; const labels=keys.map(k=>DIMS[k]);
    const oui=keys.map(k=>{let o=0,t=0;recs.forEach(d=>{const v=(d[k]??'').toString().trim();if(v==='Oui'||v==='OUI')o++;if(v==='Oui'||v==='OUI'||v==='Non'||v==='NON')t++;});return t?100*o/t:0;});
    draw('p_med',{type:'bar',data:{labels,datasets:[{label:'% Oui',data:oui,backgroundColor:'#12a08a',borderRadius:4}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y.toFixed(1)+'% de Oui'}}},scales:{y:{max:100,ticks:{callback:v=>v+'%'}}}}});
    barSimple('p_plus','iraitPlusSouvent',recs,{doughnut:true});
  }

  if(currentTab==='determinants'){ renderDeterminants(recs); } // objectif 3 : facteurs du recours
  if(currentTab==='spatial'){ renderSpatial(recs); } // analyse spatiale (distances SIG)
  if(currentTab==='croise'){ renderCross(recs); }   // analyse croisee libre
  if(currentTab==='matrice'){ renderMatrice(recs); } // tableau matrice (etape 4)
  if(currentTab==='explor'){ renderExplorer(recs); } // explorateur de variable
}

// drawGauges() : jauges radiales animees des indicateurs cles (onglet Vue d'ensemble)
function drawGauges(recs){
  const box=document.getElementById('apercuGauges'); if(!box) return;
  const items=[
    {v:rate(recs,'premierRecoursCat',['Médecine moderne']),l:'Médecine moderne',c:'#0f5e8f'},
    {v:rate(recs,'premierRecours',['La formation sanitaire publique']),l:'1er recours = public',c:'#12a08a'},
    {v:rate(recs,'assurance',['Oui']),l:'Assurance maladie',c:'#e8813a'},
    {v:rate(recs,'satisfaitMedecin',['Oui']),l:'Satisfaits du médecin',c:'#b0568f'},
    {v:rate(recs,'resultatTraitement',['Guérison','Amélioration']),l:'Guérison / amélioration',c:'#4c9a4c'}
  ];
  const C=2*Math.PI*42;
  box.innerHTML=items.map((it,i)=>`<div class="gauge"><svg viewBox="0 0 100 100" width="92" height="92">
    <circle cx="50" cy="50" r="42" fill="none" stroke="#e9eef4" stroke-width="9"/>
    <circle id="garc${i}" cx="50" cy="50" r="42" fill="none" stroke="${it.c}" stroke-width="9" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/>
    <text id="gtxt${i}" x="50" y="56" text-anchor="middle" font-size="22" font-weight="800" fill="${it.c}">0%</text></svg>
    <div class="glabel">${it.l}</div></div>`).join('');
  items.forEach((it,i)=>{ const arc=document.getElementById('garc'+i), txt=document.getElementById('gtxt'+i); if(!arc)return;
    const t0=performance.now(), dur=850;
    const step=now=>{ const p=Math.min(1,(now-t0)/dur), val=it.v*(1-Math.pow(1-p,3));
      arc.setAttribute('stroke-dashoffset',(C*(1-val/100)).toFixed(1)); txt.textContent=Math.round(val)+'%'; if(p<1)requestAnimationFrame(step); };
    requestAnimationFrame(step); });
}

/* --- Onglet Determinants (objectif 3) : facteurs influencant le recours --- */
const DET_FACTORS=['sexe','age','instruction','revenu','assurance','professionCat','religion','matrimonial','nationalite','bandPrim','frequentation','nbEnfantsCat','statutLogement','cadreProfession'];
const DET_TARGET={mod:{cat:'premierRecoursCat',val:'Médecine moderne'},pub:{cat:'premierRecours',val:'La formation sanitaire publique'},
  trad:{cat:'premierRecoursCat',val:'Médecine traditionnelle'},auto:{cat:'premierRecoursCat',val:'Automédication'}};
// taux de recours (cible) pour un sous-groupe
function targetRate(group,tgt){ let ok=0,t=0; group.forEach(d=>{const v=(d[tgt.cat]??'').toString().trim(); if(v){t++; if(v===tgt.val)ok++;}}); return t?{rate:100*ok/t,n:t}:{rate:null,n:0}; }
function renderDeterminants(recs){
  const tgtKey=document.getElementById('detTarget').value; const tgt=DET_TARGET[tgtKey];
  // 1) classement des facteurs par ecart (max-min) du taux entre categories (n>=10)
  const rank=DET_FACTORS.map(f=>{
    const cats=ordered(f,countBy(recs,f)); const rates=[];
    cats.forEach(c=>{ const g=recs.filter(d=>(d[f]??'').toString().trim()===c); const r=targetRate(g,tgt); if(r.n>=10&&r.rate!=null)rates.push(r.rate); });
    if(rates.length<2) return {f,spread:0};
    return {f,spread:Math.max(...rates)-Math.min(...rates)};
  }).filter(x=>x.spread>0).sort((a,b)=>b.spread-a.spread);
  draw('det_rank',{type:'bar',data:{labels:rank.map(r=>DIMS[r.f]),datasets:[{data:rank.map(r=>+r.spread.toFixed(1)),
    backgroundColor:rank.map((_,i)=>i<3?'#0f5e8f':'#6f7fb3'),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>`écart de ${c.parsed.x} points de %`}}},
      scales:{x:{title:{display:true,text:'écart de recours entre catégories (points de %)'},ticks:{callback:v=>v+' pts'}},y:{ticks:{autoSkip:false}}}}});

  // 2) detail d'un facteur : taux du recours cible par categorie
  const f=document.getElementById('detFactor').value;
  const cats=ordered(f,countBy(recs,f)); const rows=[];
  cats.forEach(c=>{ const g=recs.filter(d=>(d[f]??'').toString().trim()===c); const r=targetRate(g,tgt); if(r.n>0)rows.push({c,rate:r.rate,n:r.n}); });
  const moy=targetRate(recs,tgt).rate||0;
  draw('det_detail',{type:'bar',data:{labels:rows.map(r=>`${r.c} (n=${r.n})`),datasets:[{data:rows.map(r=>+r.rate.toFixed(1)),
    backgroundColor:rows.map(r=>r.rate>=moy?'#4c9a4c':'#d9534f'),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>`${c.parsed.x}% (moyenne ${moy.toFixed(1)}%)`}}},
      scales:{x:{max:100,title:{display:true,text:'% de recours — vert=au-dessus, rouge=en-dessous de la moyenne'},ticks:{callback:v=>v+'%'}},y:{ticks:{autoSkip:false}}}}});
  const targetLbl={mod:'à la médecine moderne',pub:'à l\'hôpital public',trad:'à la médecine traditionnelle',auto:'à l\'automédication'}[tgtKey];
  document.getElementById('detNote').innerHTML=`Recours ${targetLbl} : <b>${moy.toFixed(1)}%</b> en moyenne sur la sélection. Le graphique du haut classe les facteurs du plus discriminant au moins discriminant.`;
}

// renderAccessibility() : couverture par temps de marche + indicateurs + tableau par quartier
function renderAccessibility(recs){
  const wc=recs.filter(d=>d.coverClass);
  // 1) doughnut des classes de couverture
  barSimple('acc_cover','coverClass',recs,{doughnut:true});
  // 2) indicateurs
  const n=wc.length;
  const c=v=>wc.filter(d=>d.coverClass===v).length;
  const c5=c('5 min'),c10=c('10 min'),c15=c('15 min'),hors=c('Hors 15 min');
  const taux=n?100*(c5+c10+c15)/n:0;
  const dm=median(wc.map(d=>d.nearestDist).filter(x=>typeof x==='number'));
  const wm=median(wc.map(d=>d.walkMin).filter(x=>typeof x==='number'));
  const kp=[
    {v:taux.toFixed(0)+'%',l:'Couverts à ≤ 15 min de marche'},
    {v:hors,l:'Hors zone 15 min',s:n?`${(100*hors/n).toFixed(0)}% de la sélection`:''},
    {v:dm!=null?Math.round(dm)+' m':'—',l:'Distance médiane au centre le + proche'},
    {v:wm!=null?wm+' min':'—',l:'Temps de marche médian'}
  ];
  const ak=document.getElementById('accKpis'); if(ak) ak.innerHTML=kp.map(k=>`<div class="kpi"><div class="v">${k.v}</div><div class="l">${k.l}</div>${k.s?`<div class="s">${k.s}</div>`:''}</div>`).join('');
  document.querySelectorAll('#accKpis .v').forEach(el=>animateCount(el,el.textContent));
  // 3) tableau recapitulatif par quartier
  const byq={};
  wc.forEach(d=>{ const q=d.quartier||'(non précisé)'; (byq[q]=byq[q]||{t:0,c5:0,c10:0,c15:0,h:0}); byq[q].t++;
    if(d.coverClass==='5 min')byq[q].c5++; else if(d.coverClass==='10 min')byq[q].c10++; else if(d.coverClass==='15 min')byq[q].c15++; else byq[q].h++; });
  const rows=Object.entries(byq).map(([q,o])=>({q,...o,taux:o.t?100*(o.c5+o.c10+o.c15)/o.t:0})).sort((a,b)=>b.t-a.t);
  let html='<table class="ct"><thead><tr><th>Quartier</th><th>Enquêtés</th><th>≤5 min</th><th>≤10 min</th><th>≤15 min</th><th>Hors 15 min</th><th>Taux couverture</th></tr></thead><tbody>';
  rows.forEach(r=>{ html+=`<tr><td class="rowh">${r.q}</td><td>${r.t}</td><td>${r.c5}</td><td>${r.c10}</td><td>${r.c15}</td><td>${r.h}</td><td><span class="hm" style="background:${heat(r.taux)}">${r.taux.toFixed(0)}%</span></td></tr>`; });
  const tot={t:n,c5,c10,c15,h:hors};
  html+=`<tr><td class="rowh"><b>Ensemble</b></td><td><b>${tot.t}</b></td><td><b>${c5}</b></td><td><b>${c10}</b></td><td><b>${c15}</b></td><td><b>${hors}</b></td><td><b>${taux.toFixed(0)}%</b></td></tr>`;
  html+='</tbody></table>';
  const aq=document.getElementById('accQuartier'); if(aq) aq.innerHTML=html;
}

/* --- Rendu de l'onglet Analyse spatiale --- */
function renderSpatial(recs){
  renderGridPlan(); // synthese du plan d'echantillonnage (design fixe sur les 726)
  renderAccessibility(recs); // couverture par temps de marche + tableau par quartier

  // 1) KPIs de couverture (part des enquetes a moins de X m d'un centre)
  const covRate=(field,thr)=>{const v=recs.map(d=>d[field]).filter(x=>typeof x==='number'); return v.length?100*v.filter(x=>x<thr).length/v.length:0;};
  const medOf=(field)=>{const v=recs.map(d=>d[field]).filter(x=>typeof x==='number'); return median(v);};
  const kp=[
    {v:medOf('dAny')!=null?Math.round(medOf('dAny'))+' m':'—',l:'Distance médiane au centre le plus proche'},
    {v:medOf('dPrim')!=null?Math.round(medOf('dPrim'))+' m':'—',l:'Distance médiane au 1er contact'},
    {v:covRate('dAny',1000).toFixed(0)+'%',l:'À moins d\'1 km d\'un centre (tout type)'},
    {v:covRate('dPub',1000).toFixed(0)+'%',l:'À moins d\'1 km d\'un centre public'}
  ];
  document.getElementById('spatialKpis').innerHTML=kp.map(k=>`<div class="kpi"><div class="v">${k.v}</div><div class="l">${k.l}</div></div>`).join('');

  // 2) Tableau des taux de couverture
  const rows=[['Tout centre','dAny'],['Centre public','dPub'],['1er contact','dPrim']];
  const thrs=[500,1000,1500];
  let html='<table class="ct"><thead><tr><th>Type de centre</th>'+thrs.map(t=>`<th>&lt; ${t} m</th>`).join('')+'</tr></thead><tbody>';
  rows.forEach(r=>{html+=`<tr><td class="rowh">${r[0]}</td>`+thrs.map(t=>{const p=covRate(r[1],t);return `<td><span class="hm" style="background:${heat(p)}">${p.toFixed(0)}%</span></td>`;}).join('')+'</tr>';});
  html+='</tbody></table>';
  document.getElementById('coverageTable').innerHTML=html;

  // 3) Histogramme de la distance au 1er contact
  const vals=recs.map(d=>d.dPrim).filter(x=>typeof x==='number');
  const bins=10,size=250; const counts=new Array(bins).fill(0);
  vals.forEach(v=>{let b=Math.min(bins-1,Math.floor(v/size));counts[b]++;});
  draw('s_hist',{type:'bar',data:{labels:counts.map((_,i)=>`${i*size}–${(i+1)*size}`),datasets:[{data:counts,backgroundColor:'#0d8a6a',borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{title:{display:true,text:'mètres'}},y:{title:{display:true,text:'Effectif'}}}}});

  // 4) Premier recours (categorie) selon la tranche de distance reelle -> graphe cle
  crossChart('s_recours','bandPrim','premierRecoursCat',recs,'pct');

  // 5) Part cumulee "hors systeme formel" (traditionnelle + automedication) par distance
  const cats=ORD.bandPrim;
  const hors=cats.map(b=>{const g=recs.filter(d=>d.bandPrim===b);const t=g.filter(d=>d.premierRecoursCat).length;const h=g.filter(d=>['Médecine traditionnelle','Automédication'].includes(d.premierRecoursCat)).length;return t?100*h/t:0;});
  draw('s_hors',{type:'bar',data:{labels:cats,datasets:[{data:hors,backgroundColor:'#b0568f',borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y.toFixed(1)+'% hors système formel'}}},scales:{y:{max:Math.max(40,Math.ceil(Math.max(...hors)/10)*10),ticks:{callback:v=>v+'%'}}}}});

  // 6) Distance declaree (enquete) vs distance reelle (SIG)
  crossChart('s_declare','distancePublique','bandPrim',recs,'pct');

  // 7) Distance moyenne au 1er contact par quartier (Top 20 par effectif)
  const byq={};recs.forEach(d=>{if(typeof d.dPrim==='number'){(byq[d.quartier]=byq[d.quartier]||[]).push(d.dPrim);}});
  const q=Object.entries(byq).filter(e=>e[1].length>=3).map(e=>[e[0],e[1].reduce((a,b)=>a+b,0)/e[1].length,e[1].length]).sort((a,b)=>b[2]-a[2]).slice(0,20).sort((a,b)=>b[1]-a[1]);
  draw('s_quart',{type:'bar',data:{labels:q.map(e=>e[0]),datasets:[{data:q.map(e=>Math.round(e[1])),backgroundColor:q.map(e=>e[1]>687?'#d9534f':'#0d8a6a'),borderRadius:3}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.x+' m en moyenne'}}},scales:{x:{title:{display:true,text:'mètres (rouge = au-dessus de la moyenne générale)'}},y:{ticks:{autoSkip:false}}}}});

  // 8) Frequentation du centre public selon la distance reelle
  crossChart('s_freq','bandPrim','frequentation',recs,'pct');
}

// renderGridPlan() : synthese de la redistribution sur la grille de 500 m.
// Basee sur l'ensemble des 726 (le plan d'echantillonnage est fixe, il ne depend pas des filtres).
function renderGridPlan(){
  const cells={}; DATA.forEach(d=>{ if(d.cellId!=null) cells[d.cellId]=(cells[d.cellId]||0)+1; });
  const occ={1:0,2:0,3:0,4:0}; Object.values(cells).forEach(n=>{const k=Math.min(n,4);occ[k]=(occ[k]||0)+1;});
  const nOcc=Object.keys(cells).length;
  const moved=DATA.filter(d=>d.gMoved===1); const fromNon=DATA.filter(d=>d.gFromNon===1).length;
  const md=median(moved.map(d=>d.gMoveDist).filter(x=>typeof x==='number'));
  const pct2=nOcc?100*occ[2]/nOcc:0;
  const kp=[
    {v:nOcc,l:'Cellules accessibles occupées'},
    {v:occ[2],l:'Cellules à 2 enquêtés (1H+1F visé)',s:`${pct2.toFixed(0)}% des cellules occupées`}
  ];
  document.getElementById('gridKpis').innerHTML=kp.map(k=>`<div class="kpi"><div class="v">${k.v}</div><div class="l">${k.l}</div>${k.s?`<div class="s">${k.s}</div>`:''}</div>`).join('');

  // occupation : nombre de cellules ayant 1, 2, 3 ou 4 enquetes
  draw('g_occ',{type:'bar',data:{labels:['1 enquêté','2 (cible)','3','4 (max)'],datasets:[{data:[occ[1],occ[2],occ[3],occ[4]],backgroundColor:[GRID_COL[1],GRID_COL[2],GRID_COL[3],GRID_COL[4]],borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y+' cellules'}}},scales:{y:{title:{display:true,text:'nombre de cellules'}}}}});

  // distribution des distances de deplacement (reaffectes uniquement)
  const dv=moved.map(d=>d.gMoveDist).filter(x=>typeof x==='number'); const bins=8,size=250; const co=new Array(bins).fill(0);
  dv.forEach(v=>{let b=Math.min(bins-1,Math.floor(v/size));co[b]++;});
  draw('g_move',{type:'bar',data:{labels:co.map((_,i)=>`${i*size}–${(i+1)*size}`),datasets:[{data:co,backgroundColor:'#0f5e8f',borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{title:{display:true,text:'mètres'}},y:{title:{display:true,text:'enquêtés'}}}}});
}

// structPerception() : graphique special qui compare les trois types de
// structures (public/prive/traditionnel) sur 3 criteres (proprete, equipement,
// performance), en % de jugements positifs.
function structPerception(id,recs){
  const dims=[['Propreté',['propretePublique','proprietePrive','proprieteTradi']],
              ['Équipement suffisant',['equipPublique','equipPrive','equipTradi']],
              ['Performance',['perfPublique','perfPrive','perfTradi']]];
  const struct=['Public','Privé','Médecine traditionnelle'];
  const colors=['#0f5e8f','#e8813a','#12a08a'];
  const datasets=struct.map((s,i)=>({label:s,backgroundColor:colors[i],borderRadius:3,
    data:dims.map(dd=>{const k=dd[1][i];let o=0,t=0;recs.forEach(d=>{const v=(d[k]??'').toString().trim();if(v==='Oui')o++;if(v==='Oui'||v==='Non')t++;});return t?100*o/t:0;})}));
  draw(id,{type:'bar',data:{labels:dims.map(d=>d[0]),datasets},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.y.toFixed(1)}% jugent « oui »`}}},
      scales:{y:{max:100,ticks:{callback:v=>v+'%'}}}}});
}


/* ============================================================================
   11. ANALYSE CROISEE (onglet + tableau de contingence)
   ============================================================================ */

function renderCross(recs){
  const kx=document.getElementById('cx').value, ky=document.getElementById('cy').value, mode=document.getElementById('cmode').value;
  const res=crossChart('crossChart',kx,ky,recs,mode); // dessine le graphique et recupere la grille
  document.getElementById('crossInfo').textContent=`${DIMS[kx]} (lignes) × ${DIMS[ky]} (colonnes) — ${recs.length} enquêtés dans la sélection.`;
  // construction du tableau de contingence (HTML)
  const {catsX,catsY,grid,totX}=res;
  let html='<table class="ct"><thead><tr><th>'+DIMS[kx]+' ＼ '+DIMS[ky]+'</th>'+catsY.map(y=>`<th>${y}</th>`).join('')+'<th>Total</th></tr></thead><tbody>';
  catsX.forEach(x=>{ // une ligne par modalite de X
    html+=`<tr><td class="rowh">${x}</td>`+catsY.map(y=>{const v=grid[x][y];const p=totX[x]?100*v/totX[x]:0;const bg=heat(p);return `<td><span class="hm" style="background:${bg}">${v}<span class="muted"> ${p.toFixed(0)}%</span></span></td>`;}).join('')+`<td><b>${totX[x]}</b></td></tr>`;
  });
  // ligne des totaux par colonne
  const colTot={};catsY.forEach(y=>colTot[y]=catsX.reduce((a,x)=>a+grid[x][y],0));const gTot=catsX.reduce((a,x)=>a+totX[x],0);
  html+=`<tr><td class="rowh"><b>Total</b></td>`+catsY.map(y=>`<td><b>${colTot[y]}</b></td>`).join('')+`<td><b>${gTot}</b></td></tr>`;
  html+='</tbody></table>';
  document.getElementById('crossTable').innerHTML=html;
}
// heat() : couleur de fond d'une cellule selon son % (plus c'est fort, plus c'est bleu)
function heat(p){const a=Math.min(1,p/100);return `rgba(15,94,143,${(0.08+0.72*a).toFixed(3)})`;}


/* ============================================================================
   11bis. TABLEAU MATRICE (etape 4) — croise / heatmap / aide a la decision
   Complement synthetique a l'Analyse croisee : meme donnees, mais tri,
   recherche, export CSV/Excel/PDF, clic-ligne (zoom quartier) et clic-cellule
   (filtre la carte et les graphiques sur la combinaison choisie).
   ============================================================================ */

let mxMode='croise', mxColorblind=false, mxSearch='';
let mxSort={key:null,dir:1}; // colonne triee (0 = libelle de ligne) et sens (1 asc, -1 desc)
let mxLastTable={headers:[],rows:[]}; // derniere table affichee, en texte brut (pour l'export)

// heatColor() : couleur diverging selon un pourcentage 0-100.
// invert=true si une valeur HAUTE est defavorable (ex: distance, personnes hors couverture).
// colorblind=true : palette bleu -> orange (Okabe-Ito) au lieu de rouge -> vert.
function heatColor(pct,invert,colorblind){
  const p=Math.max(0,Math.min(100, invert?100-pct:pct));
  if(colorblind){
    const lo=[1,115,178], hi=[222,143,5]; // bleu -> orange
    const t=p/100, c=lo.map((l,i)=>Math.round(l+(hi[i]-l)*t));
    return `rgba(${c[0]},${c[1]},${c[2]},0.82)`;
  }
  const stops=[[217,83,79],[232,168,58],[76,154,76]]; // rouge -> jaune -> vert
  const [a,b,t] = p<50 ? [stops[0],stops[1],p/50] : [stops[1],stops[2],(p-50)/50];
  const c=a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  return `rgba(${c[0]},${c[1]},${c[2]},0.82)`;
}

// computeCrossGrid() : meme grille de contingence que crossChart(), sans dessiner de graphique
function computeCrossGrid(keyX,keyY,recs){
  const catsX=ordered(keyX,countBy(recs,keyX));
  const catsY=ordered(keyY,countBy(recs,keyY));
  const grid={}; catsX.forEach(x=>{grid[x]={}; catsY.forEach(y=>grid[x][y]=0);});
  const totX={}; catsX.forEach(x=>totX[x]=0);
  recs.forEach(d=>{const x=(d[keyX]??'').toString().trim(),y=(d[keyY]??'').toString().trim(); if(grid[x]&&y&&grid[x][y]!==undefined){grid[x][y]++;totX[x]++;}});
  return {catsX,catsY,grid,totX};
}

// quartierMatrixAgg() : agregation par quartier pour le tableau d'aide a la decision.
// Etend quartierAgg() (panneau de droite) avec temps de marche, recours dominant,
// satisfaction, et un score de vulnerabilite -> niveau de priorite d'intervention.
function quartierMatrixAgg(recs){
  const byq={};
  recs.forEach(d=>{
    const q=(d.quartier??'').toString().trim(); if(!q) return;
    const o=byq[q]=byq[q]||{q,n:0,c5:0,c10:0,c15:0,hors:0,distSum:0,distN:0,walkSum:0,walkN:0,satOui:0,satN:0,modOui:0,recN:0,recCount:{}};
    o.n++;
    if(d.coverClass==='5 min')o.c5++;
    else if(d.coverClass==='10 min')o.c10++;
    else if(d.coverClass==='15 min')o.c15++;
    else if(d.coverClass==='Hors 15 min')o.hors++;
    if(typeof d.nearestDist==='number'){ o.distSum+=d.nearestDist; o.distN++; }
    if(typeof d.walkMin==='number'){ o.walkSum+=d.walkMin; o.walkN++; }
    const sat=(d.satisfaitMedecin??'').toString().trim(); if(sat){ o.satN++; if(sat==='Oui'||sat==='OUI') o.satOui++; }
    const rec=(d.premierRecoursCat??'').toString().trim(); if(rec){ o.recN++; o.recCount[rec]=(o.recCount[rec]||0)+1; if(rec==='Médecine moderne') o.modOui++; }
  });
  const maxN=Math.max(1,...Object.values(byq).map(o=>o.n));
  return Object.values(byq).map(o=>{
    const taux=(o.c5+o.c10+o.c15+o.hors)?100*(o.c5+o.c10+o.c15)/(o.c5+o.c10+o.c15+o.hors):null;
    const distMoy=o.distN?o.distSum/o.distN:null;
    const walkMoy=o.walkN?o.walkSum/o.walkN:null;
    const satisfaction=o.satN?100*o.satOui/o.satN:null;
    const tauxMod=o.recN?100*o.modOui/o.recN:null;
    const recDom=Object.entries(o.recCount).sort((a,b)=>b[1]-a[1])[0];
    // score de vulnerabilite (0-100) : faible couverture + distance elevee + population importante + faible recours moderne
    const covScore = taux!=null? 100-taux : 50;
    const distScore = distMoy!=null? Math.min(100, 100*distMoy/3000) : 50; // plafond a 3 km
    const popScore = 100*o.n/maxN;
    const modScore = tauxMod!=null? 100-tauxMod : 50;
    const vulnerabilite = 0.35*covScore + 0.25*distScore + 0.20*modScore + 0.20*popScore;
    let priorite='Faible', prioColor='var(--ok, #4c9a4c)';
    if(vulnerabilite>=66){ priorite='Critique'; prioColor='var(--danger, #d9534f)'; }
    else if(vulnerabilite>=50){ priorite='Élevée'; prioColor='#d9534f'; }
    else if(vulnerabilite>=33){ priorite='Modérée'; prioColor='#e8813a'; }
    return { q:o.q, n:o.n, distMoy, walkMoy, hors:o.hors, taux,
      c5pct: o.n?100*o.c5/o.n:0, c10pct: o.n?100*(o.c5+o.c10)/o.n:0,
      recDom: recDom?`${recDom[0]} (${recDom[1]})`:'—', satisfaction, vulnerabilite, priorite, prioColor };
  });
}

// renderMatriceTable() : moteur generique — tri par colonne, recherche, clic
// cellule/ligne. "rows" = [{label, cells:[{text, sortVal, bg, title, html, onClick}], onRowClick}]
function renderMatriceTable(containerId, headers, rows, opts={}){
  opts=Object.assign({searchable:true, sortable:true}, opts);
  let rr=rows;
  const q=(mxSearch||'').toLowerCase().trim();
  if(q) rr=rr.filter(r=> r.label.toLowerCase().includes(q) || r.cells.some(c=>(''+c.text).toLowerCase().includes(q)));
  if(opts.sortable && mxSort.key!=null){
    rr=[...rr].sort((a,b)=>{
      const va = mxSort.key===0 ? a.label : (a.cells[mxSort.key-1]?.sortVal ?? a.cells[mxSort.key-1]?.text ?? '');
      const vb = mxSort.key===0 ? b.label : (b.cells[mxSort.key-1]?.sortVal ?? b.cells[mxSort.key-1]?.text ?? '');
      const c = (typeof va==='number' && typeof vb==='number') ? va-vb : (''+va).localeCompare(''+vb,'fr');
      return c*mxSort.dir;
    });
  }
  let html='<table class="ct"><thead><tr>';
  headers.forEach((h,i)=>{
    if(!opts.sortable){ html+=`<th>${h}</th>`; return; }
    const sorted=mxSort.key===i; const arrow=sorted?(mxSort.dir===1?'▲':'▼'):'⇅';
    html+=`<th class="sortable${sorted?' sorted':''}" data-col="${i}">${h}<span class="arrow">${arrow}</span></th>`;
  });
  html+='</tr></thead><tbody>';
  rr.forEach((r,ri)=>{
    html+=`<tr${r.onRowClick?' class="rowclick"':''} data-ri="${ri}"><td class="rowh" title="${esc(r.label)}">${r.label}</td>`;
    r.cells.forEach((c,ci)=>{
      const style=c.bg?` style="background:${c.bg}"`:''; const cls=c.onClick?' class="clickable"':'';
      html+=`<td${style}${cls} data-ri="${ri}" data-ci="${ci}" title="${esc(c.title||c.text)}">${c.html!=null?c.html:c.text}</td>`;
    });
    html+='</tr>';
  });
  html+='</tbody></table>';
  const el=document.getElementById(containerId); if(!el) return;
  el.innerHTML=html;
  if(opts.sortable) el.querySelectorAll('th.sortable').forEach(th=>th.addEventListener('click',()=>{
    const col=+th.dataset.col;
    if(mxSort.key===col) mxSort.dir*=-1; else { mxSort.key=col; mxSort.dir=1; }
    renderMatriceTable(containerId,headers,rows,opts);
  }));
  el.querySelectorAll('td[data-ci]').forEach(td=>{
    const ri=+td.dataset.ri, ci=+td.dataset.ci, r=rr[ri], c=r&&r.cells[ci];
    if(c && c.onClick) td.addEventListener('click',()=>c.onClick());
  });
  el.querySelectorAll('tr.rowclick').forEach(tr=>{
    const ri=+tr.dataset.ri, r=rr[ri];
    tr.addEventListener('click',e=>{ if(e.target.closest('td.clickable'))return; r.onRowClick(); });
  });
  mxLastTable={ headers, rows: rr.map(r=>[r.label, ...r.cells.map(c=>c.text)]) };
}

// zoomToQuartier() : centre la carte sur le centroide des points du quartier (bascule sur l'onglet Carte)
function zoomToQuartier(q){
  const pts=filtered().filter(d=>((d.quartier??'').toString().trim())===q && typeof d.lat==='number' && d.lat);
  if(!pts.length) return;
  const lat=pts.reduce((a,d)=>a+d.lat,0)/pts.length, lng=pts.reduce((a,d)=>a+d.lng,0)/pts.length;
  const radius=Math.max(200, Math.max(...pts.map(d=>haversine(lat,lng,d.lat,d.lng))));
  switchTab('carte');
  setTimeout(()=>{ map.setView([lat,lng],16); highlightQuartier(lat,lng,radius); },120);
}

// applyComboFilter() : clic sur une cellule du tableau croise/heatmap -> filtre
// la carte, les KPIs et les graphiques sur cette combinaison X=..., Y=...
function applyComboFilter(kx,xVal,ky,yVal){
  filters[kx]=new Set([xVal]); filters[ky]=new Set([yVal]);
  syncChecks(); refresh();
  const info=document.getElementById('mxInfo'); if(info) info.textContent=`Filtré sur ${DIMS[kx]||kx} = « ${xVal} » et ${DIMS[ky]||ky} = « ${yVal} »`;
}

// renderMatriceCroise() : tableau croise classique (heat=false) ou heatmap colore (heat=true)
function renderMatriceCroise(recs,heatMode){
  const kx=document.getElementById('mx').value, ky=document.getElementById('my').value;
  const {catsX,catsY,grid,totX}=computeCrossGrid(kx,ky,recs);
  const headers=[`${DIMS[kx]||kx} ＼ ${DIMS[ky]||ky}`, ...catsY, 'Total'];
  const rows=catsX.map(x=>{
    const cells=catsY.map(y=>{
      const v=grid[x][y], p=totX[x]?100*v/totX[x]:0;
      const bg = heatMode ? heatColor(p,false,mxColorblind) : (v?heat(p):undefined);
      return { text:`${v} (${p.toFixed(0)}%)`, sortVal:v,
        title:`${DIMS[kx]||kx} : ${x}  |  ${DIMS[ky]||ky} : ${y}  |  Effectif : ${v}  |  ${p.toFixed(1)}% de la ligne`,
        bg, onClick:()=>applyComboFilter(kx,x,ky,y) };
    });
    cells.push({ text:totX[x], sortVal:totX[x] });
    return { label:x, cells };
  });
  const colTot={}; catsY.forEach(y=>colTot[y]=catsX.reduce((a,x)=>a+grid[x][y],0));
  const gTot=catsX.reduce((a,x)=>a+totX[x],0);
  rows.push({ label:'Total', cells:[...catsY.map(y=>({text:colTot[y],sortVal:colTot[y]})),{text:gTot,sortVal:gTot}] });
  const info=document.getElementById('mxInfo'); if(info) info.textContent=`${recs.length} enquêtés — ${catsX.length}×${catsY.length} modalités`;
  renderMatriceTable('matriceTable',headers,rows,{sortable:true,searchable:true});
}

// renderMatriceQuartier() : tableau d'aide a la decision, une ligne par quartier
function renderMatriceQuartier(recs){
  const qa=quartierMatrixAgg(recs).sort((a,b)=>b.n-a.n);
  const headers=['Quartier','Enquêtés','Distance moy.','Marche moy.','Couv. 5 min','Couv. 15 min (cumul)','Hors couverture','Recours dominant','Satisfaction','Score vulnérabilité','Priorité'];
  const rows=qa.map(o=>{
    const horsPct=o.n?100*o.hors/o.n:0;
    const cells=[
      { text:o.n, sortVal:o.n },
      { text:o.distMoy!=null?Math.round(o.distMoy)+' m':'—', sortVal:o.distMoy??-1 },
      { text:o.walkMoy!=null?Math.round(o.walkMoy)+' min':'—', sortVal:o.walkMoy??-1 },
      { text:o.c5pct.toFixed(0)+'%', sortVal:o.c5pct, bg:heatColor(o.c5pct,false,mxColorblind) },
      { text:o.taux!=null?o.taux.toFixed(0)+'%':'—', sortVal:o.taux??-1, bg:o.taux!=null?heatColor(o.taux,false,mxColorblind):undefined },
      { text:o.hors, sortVal:o.hors, bg:heatColor(horsPct,true,mxColorblind), title:`${o.hors} personne(s) hors couverture 15 min (${horsPct.toFixed(0)}% du quartier)` },
      { text:o.recDom, sortVal:o.recDom },
      { text:o.satisfaction!=null?o.satisfaction.toFixed(0)+'%':'—', sortVal:o.satisfaction??-1, bg:o.satisfaction!=null?heatColor(o.satisfaction,false,mxColorblind):undefined },
      { text:o.vulnerabilite.toFixed(0), sortVal:o.vulnerabilite, bg:heatColor(o.vulnerabilite,true,mxColorblind), title:'Combine couverture, distance, population et recours à la médecine moderne' },
      { html:`<span class="mx-badge" style="background:${o.prioColor}">${o.priorite}</span>`, text:o.priorite, sortVal:o.vulnerabilite }
    ];
    return { label:o.q, cells, onRowClick:()=>zoomToQuartier(o.q) };
  });
  const info=document.getElementById('mxInfo'); if(info) info.textContent=`${qa.length} quartiers — ${recs.length} enquêtés — cliquez une ligne pour zoomer`;
  renderMatriceTable('matriceTable',headers,rows,{sortable:true,searchable:true});
}

// renderMatrice() : dispatcher appele par renderTab() a chaque changement de filtre/onglet
function renderMatrice(recs){
  const mode=document.getElementById('mxMode').value; mxMode=mode;
  const showXY=mode!=='quartier';
  ['mxXlabel','mx','mxYlabel','my'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=showXY?'':'none'; });
  const cbWrap=document.getElementById('mxColorblind'); if(cbWrap&&cbWrap.closest('.switch')) cbWrap.closest('.switch').style.display=mode==='croise'?'none':'';
  if(mode==='croise') renderMatriceCroise(recs,false);
  else if(mode==='heat') renderMatriceCroise(recs,true);
  else renderMatriceQuartier(recs);
}

// Exports du tableau matrice actuellement affiche (texte brut memorise dans mxLastTable)
function exportMatriceCsv(){
  const {headers,rows}=mxLastTable; if(!rows.length) return;
  const lines=[headers.join(';')].concat(rows.map(r=>r.map(v=>{const s=(v==null?'':(''+v)).replace(/"/g,'""'); return /[;"\n]/.test(s)?`"${s}"`:s;}).join(';')));
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tableau_matrice.csv'; a.click();
}
function exportMatriceXlsx(){
  const {headers,rows}=mxLastTable; if(!rows.length || !window.XLSX) return;
  const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Tableau matrice');
  XLSX.writeFile(wb,'tableau_matrice.xlsx');
}
function exportMatricePdf(){
  const {headers,rows}=mxLastTable; if(!rows.length || !window.jspdf) return;
  const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape'});
  doc.setFontSize(12); doc.text("Bakusm@p — Tableau matrice", 14, 12);
  doc.autoTable({ head:[headers], body:rows, startY:18, styles:{fontSize:8}, headStyles:{fillColor:[15,94,143]} });
  doc.save('tableau_matrice.pdf');
}


/* ============================================================================
   12. EXPLORATEUR DE VARIABLE
   ============================================================================ */

function renderExplorer(recs){
  const key=document.getElementById('ex').value;
  document.getElementById('exTitle').textContent=(DIMS[key]||NUM[key]);

  if(NUM[key]){ // cas d'une variable numerique : histogramme + statistiques
    const vals=recs.map(d=>d[key]).filter(v=>typeof v==='number');
    const max=Math.max(...vals,0);const bins=10;const size=Math.ceil((max||1)/bins/500)*500||500; // largeur de classe arrondie a 500
    const edges=[];for(let i=0;i<=bins;i++)edges.push(i*size);
    const counts=new Array(bins).fill(0);vals.forEach(v=>{let b=Math.min(bins-1,Math.floor(v/size));counts[b]++;});
    draw('exChart',{type:'bar',data:{labels:edges.slice(0,bins).map((e,i)=>`${e.toLocaleString('fr-FR')}–${(edges[i+1]).toLocaleString('fr-FR')}`),
      datasets:[{data:counts,backgroundColor:'#0f5e8f',borderRadius:3}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{title:{display:true,text:'Effectif'}}}}});
    const s=[...vals].sort((a,b)=>a-b);const sum=vals.reduce((a,b)=>a+b,0);
    const stat=[['Effectif renseigné',vals.length],['Minimum',s[0]?.toLocaleString('fr-FR')+' F'],['Médiane',median(vals)?.toLocaleString('fr-FR')+' F'],['Moyenne',vals.length?Math.round(sum/vals.length).toLocaleString('fr-FR')+' F':'—'],['Maximum',s[s.length-1]?.toLocaleString('fr-FR')+' F']];
    document.getElementById('exTable').innerHTML='<table class="ct"><tbody>'+stat.map(r=>`<tr><td class="rowh">${r[0]}</td><td>${r[1]}</td></tr>`).join('')+'</tbody></table>';
  }else{ // cas d'une variable categorielle : barres + tableau effectif/%
    const m=countBy(recs,key);const cats=ordered(key,m);const tot=[...m.values()].reduce((a,b)=>a+b,0);
    draw('exChart',{type:'bar',data:{labels:cats,datasets:[{data:cats.map(c=>m.get(c)||0),backgroundColor:cats.map(c=>colorFor(key,c)),borderRadius:3}]},
      options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.x} (${(100*c.parsed.x/tot).toFixed(1)}%)`}}},scales:{y:{ticks:{autoSkip:false}}}}});
    document.getElementById('exTable').innerHTML='<table class="ct"><thead><tr><th>Modalité</th><th>Effectif</th><th>%</th></tr></thead><tbody>'+
      cats.map(c=>`<tr><td class="rowh">${c}</td><td>${m.get(c)||0}</td><td>${(100*(m.get(c)||0)/tot).toFixed(1)}%</td></tr>`).join('')+
      `<tr><td class="rowh"><b>Total</b></td><td><b>${tot}</b></td><td><b>100%</b></td></tr></tbody></table>`;
  }
}


/* ============================================================================
   13. EXPORT CSV DE LA SELECTION
   ============================================================================ */

// exportCsv() : telecharge la selection filtree au format CSV (separateur ;)
function exportCsv(){
  const recs=filtered();if(!recs.length)return;
  const cols=Object.keys(recs[0]);
  const lines=[cols.join(';')].concat(recs.map(r=>cols.map(c=>{let v=r[c]==null?'':(''+r[c]).replace(/"/g,'""');return /[;"\n]/.test(v)?`"${v}"`:v;}).join(';')));
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}); // ﻿ = BOM pour Excel FR
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='selection_enquetes.csv';a.click();
}


/* ============================================================================
   13bis. PANNEAU STATISTIQUE DROIT (etape 3) — regroupe les indicateurs deja
   presents dans les onglets Vue d'ensemble / Recours / Analyse spatiale dans
   un panneau unique, visible en permanence, recalcule a chaque filtre.
   ============================================================================ */

// quartierAgg() : pour chaque quartier de "recs", agrege effectif, couverture
// (temps de marche) et distance moyenne au centre le plus proche.
function quartierAgg(recs){
  const byq={};
  recs.forEach(d=>{
    const q=(d.quartier??'').toString().trim(); if(!q) return;
    const o=byq[q]=byq[q]||{q,n:0,c5:0,c10:0,c15:0,hors:0,distSum:0,distN:0};
    o.n++;
    if(d.coverClass==='5 min')o.c5++;
    else if(d.coverClass==='10 min')o.c10++;
    else if(d.coverClass==='15 min')o.c15++;
    else if(d.coverClass==='Hors 15 min')o.hors++;
    if(typeof d.nearestDist==='number'){ o.distSum+=d.nearestDist; o.distN++; }
  });
  return Object.values(byq).map(o=>({
    q:o.q, n:o.n, hors:o.hors,
    taux: (o.c5+o.c10+o.c15+o.hors)? 100*(o.c5+o.c10+o.c15)/(o.c5+o.c10+o.c15+o.hors) : null,
    distMoy: o.distN? o.distSum/o.distN : null
  }));
}

// spBadgeColor() : couleur d'une pastille de classement selon la valeur et le sens
// (bon = vert -> mauvais = rouge, ou l'inverse pour les distances/priorites).
function spBadgeColor(pct,invert){
  const p = invert ? 100-pct : pct;
  if(p>=66) return 'var(--ok, #4c9a4c)';
  if(p>=33) return '#e8813a';
  return 'var(--danger, #d9534f)';
}

// renderRankList() : affiche un classement (top 5) dans un conteneur #id
function renderRankList(id, items, valueFn, badgeFn){
  const el=document.getElementById(id); if(!el) return;
  if(!items.length){ el.innerHTML='<div class="sp-empty">Pas assez de données (min. 3 enquêtés/quartier)</div>'; return; }
  el.innerHTML=items.map((o,i)=>`<div class="sprow"><span class="rk">${i+1}</span><span class="nm" title="${esc(o.q)}">${o.q}</span><span class="bd" style="background:${badgeFn(o)}">${valueFn(o)}</span></div>`).join('');
}

// renderStatsPanel() : (re)calcule tous les indicateurs du panneau de droite.
// Appelee par refresh() a chaque changement de filtre, quel que soit l'onglet actif.
function renderStatsPanel(recs){
  const panel=document.getElementById('statsPanel'); if(!panel) return;
  const setv=(id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
  const n=recs.length;

  // --- Population ---
  setv('sp-n', n);
  setv('sp-h', recs.filter(d=>d.sexe==='Masculin').length);
  setv('sp-f', recs.filter(d=>d.sexe==='Feminin').length);
  const quartiers=new Set(recs.map(d=>(d.quartier??'').toString().trim()).filter(Boolean));
  setv('sp-quart', quartiers.size);
  const centresT=document.getElementById('centresToggle');
  setv('sp-centres', (centresT && centresT.checked) ? CENTRES.length : 0);

  // --- Accessibilite : distances au centre le plus proche (mises a jour par computeNearest) ---
  const dists=recs.map(d=>d.nearestDist).filter(x=>typeof x==='number');
  const dMoy=dists.length? dists.reduce((a,b)=>a+b,0)/dists.length : null;
  setv('sp-dmoy', dMoy!=null?Math.round(dMoy)+' m':'—');
  setv('sp-dmin', dists.length?Math.round(Math.min(...dists))+' m':'—');
  setv('sp-dmax', dists.length?Math.round(Math.max(...dists))+' m':'—');
  const covRadius=thr=> dists.length? 100*dists.filter(x=>x<thr).length/dists.length : 0;
  setv('sp-cov500', covRadius(500).toFixed(0)+'%');
  setv('sp-cov1000', covRadius(1000).toFixed(0)+'%');
  const wc=recs.filter(d=>d.coverClass);
  const cAt=v=>wc.filter(d=>d.coverClass===v).length;
  const c5=cAt('5 min'), c10=cAt('10 min'), c15=cAt('15 min'), hors=cAt('Hors 15 min');
  setv('sp-c5', wc.length?(100*c5/wc.length).toFixed(0)+'%':'—');
  setv('sp-c10', wc.length?(100*(c5+c10)/wc.length).toFixed(0)+'%':'—');
  setv('sp-c15', wc.length?(100*(c5+c10+c15)/wc.length).toFixed(0)+'%':'—');
  setv('sp-hors', hors);

  // --- Recours aux soins ---
  const recTop=[...countBy(recs,'premierRecoursCat').entries()].sort((a,b)=>b[1]-a[1])[0];
  setv('sp-rectop', recTop?`${recTop[0]} (${(100*recTop[1]/n||0).toFixed(0)}%)`:'—');
  setv('sp-pmod', rate(recs,'premierRecoursCat',['Médecine moderne']).toFixed(0)+'%');
  setv('sp-ptrad', rate(recs,'premierRecoursCat',['Médecine traditionnelle']).toFixed(0)+'%');
  setv('sp-pauto', rate(recs,'premierRecoursCat',['Automédication']).toFixed(0)+'%');
  const qSorted=[...countBy(recs,'quartier').entries()].sort((a,b)=>b[1]-a[1]);
  setv('sp-qmax', qSorted.length?`${qSorted[0][0]} (${qSorted[0][1]})`:'—');
  setv('sp-qmin', qSorted.length?`${qSorted[qSorted.length-1][0]} (${qSorted[qSorted.length-1][1]})`:'—');

  // --- Classements par quartier (n >= 3 pour eviter le bruit statistique) ---
  const qa=quartierAgg(recs).filter(o=>o.n>=3);

  renderRankList('sp-rank-pop', [...qa].sort((a,b)=>b.n-a.n).slice(0,5),
    o=>o.n, o=>'var(--brand)');

  renderRankList('sp-rank-far', qa.filter(o=>o.distMoy!=null).sort((a,b)=>b.distMoy-a.distMoy).slice(0,5),
    o=>Math.round(o.distMoy)+' m', o=>spBadgeColor(Math.min(100,o.distMoy/15),true));

  renderRankList('sp-rank-best', qa.filter(o=>o.taux!=null).sort((a,b)=>b.taux-a.taux).slice(0,5),
    o=>o.taux.toFixed(0)+'%', o=>spBadgeColor(o.taux,false));

  renderRankList('sp-rank-worst', qa.filter(o=>o.taux!=null).sort((a,b)=>a.taux-b.taux).slice(0,5),
    o=>o.taux.toFixed(0)+'%', o=>spBadgeColor(o.taux,false));

  // priorite = quartiers ou le plus de personnes sont hors couverture (population affectee),
  // departagees par le taux de couverture le plus faible
  renderRankList('sp-rank-priority', [...qa].filter(o=>o.hors>0).sort((a,b)=>b.hors-a.hors || (a.taux??0)-(b.taux??0)).slice(0,5),
    o=>o.hors+' pers.', o=>'var(--danger, #d9534f)');
}

// initStatsPanel() : branche le bouton reduire/agrandir et restaure l'etat memorise
function initStatsPanel(){
  const panel=document.getElementById('statsPanel'), wrap=document.querySelector('.wrap'), btn=document.getElementById('spToggle');
  if(!panel||!wrap||!btn) return;
  const setCollapsed=c=>{ panel.classList.toggle('collapsed',c); wrap.classList.toggle('sp-collapsed',c);
    btn.textContent=c?'«':'»'; localStorage.setItem('sp_collapsed',c?'1':'0'); };
  setCollapsed(localStorage.getItem('sp_collapsed')==='1');
  btn.addEventListener('click',()=>setCollapsed(!panel.classList.contains('collapsed')));
  // le changement de visibilite des centres impacte "Centres de sante visibles"
  const ct=document.getElementById('centresToggle'); if(ct) ct.addEventListener('change',()=>renderStatsPanel(filtered()));
}


/* ============================================================================
   14. ORCHESTRATION ET DEMARRAGE
   ============================================================================ */

// refresh() : LE point central. A chaque changement de filtre, on recalcule la
// selection puis on met a jour les pastilles, les KPIs, l'onglet visible et le
// panneau statistique de droite (etape 3, toujours visible quel que soit l'onglet).
function refresh(){ const recs=filtered(); renderChips(); renderKPIs(recs); renderTab(recs); renderStatsPanel(recs); }

// switchTab() : change d'onglet (affiche/masque les sections, redessine)
// lastContentTab : dernier onglet d'ANALYSE visite (hors Exports), pour que l'onglet
// Exports sache quels graphiques/tableaux exporter (etape 5f).
let lastContentTab='apercu';
function switchTab(t){
  if(t!=='exports') lastContentTab=t;
  currentTab=t;
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));
  ['carte','apercu','recours','determinants','percept','spatial','croise','matrice','explor','donnees','exports'].forEach(id=>{const el=document.getElementById('tab-'+id);if(el)el.classList.toggle('hidden',id!==t);});
  const sec=document.getElementById('tab-'+t); if(sec){ sec.classList.remove('anim'); void sec.offsetWidth; sec.classList.add('anim'); } // re-declenche l'animation d'apparition
  renderTab(filtered());
  if(t==='carte') setTimeout(()=>map.invalidateSize(),80); // Leaflet doit recalculer sa taille quand on revient sur la carte
}

// Au chargement de la page : on branche tout
document.addEventListener('DOMContentLoaded',async ()=>{
  // 0. si une base complete existe en ligne (table `enquetes`), on la charge d'abord
  //    -> toute modif faite dans pgAdmin/Supabase agit directement sur la plateforme
  const cloudFull = await loadFullDataFromCloud();
  document.getElementById('nTotal').textContent=DATA.length;
  // memoriser les positions d'origine (pour le bouton Reinitialiser du mode edition)
  DATA.forEach(d=>{ d._gLat0=d.gLat; d._gLon0=d.gLon; d._cellId0=d.cellId; d._lat0=d.lat; d._lng0=d.lng; });
  computeNearest(); // centre le plus proche + temps de marche + classe de couverture
  initMap();       // 1. la carte
  buildFilters();  // 2. la barre de filtres
  if(cloudFull){
    if(gridLayer) gridLayer.setStyle(styleCell);
  } else {
    // donnees locales (data.js) + eventuels deplacements enregistres dans ce navigateur
    const nEdits=applySavedEdits(); if(gridLayer) gridLayer.setStyle(styleCell);
    if(nEdits) document.getElementById('editInfo').textContent=`${nEdits} déplacement(s) restauré(s) depuis ce navigateur.`;
  }
  // dans tous les cas : appliquer les surcharges de positions publiees (points_overrides)
  cloudLoad().then(n=>{ if(n){ computeNearest(); recomputeGridCounts(); if(gridLayer) gridLayer.setStyle(styleCell); renderMap(filtered()); if(currentTab==='spatial')renderGridPlan(); setEditInfo(n+' point(s) synchronisé(s) depuis le cloud.'); }});

  // 3. menu "colorer la carte par"
  fillSelect(document.getElementById('colorBy'),['coverClass','premierRecours','premierRecoursCat','bandPrim','sexe','age','assurance','frequentation','maladieCat','revenu','instruction','professionCat','resultatTraitement','satisfaitMedecin','quartier'],'coverClass');
  document.getElementById('colorBy').addEventListener('change',()=>renderMap(filtered()));

  // 4. menus de l'analyse croisee (valeurs de depart : age x premier recours)
  document.getElementById('cx').innerHTML=optgroupedDims();
  document.getElementById('cy').innerHTML=optgroupedDims();
  document.getElementById('cx').value='age'; document.getElementById('cy').value='premierRecours';

  // 4bis. menus du tableau matrice (etape 4) : quartier x couverture par defaut
  document.getElementById('mx').innerHTML=optgroupedDims();
  document.getElementById('my').innerHTML=optgroupedDims();
  document.getElementById('mx').value='quartier'; document.getElementById('my').value='coverClass';
  ['mx','my'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderMatrice(filtered())));
  document.getElementById('mxMode').addEventListener('change',()=>{ mxSort={key:null,dir:1}; renderMatrice(filtered()); });
  document.getElementById('mxColorblind').addEventListener('change',e=>{ mxColorblind=e.target.checked; renderMatrice(filtered()); });
  document.getElementById('mxSearch').addEventListener('input',e=>{ mxSearch=e.target.value; renderMatrice(filtered()); });
  document.getElementById('mxExportCsv').addEventListener('click',exportMatriceCsv);
  document.getElementById('mxExportXlsx').addEventListener('click',exportMatriceXlsx);
  document.getElementById('mxExportPdf').addEventListener('click',exportMatricePdf);

  // 5. menu de l'explorateur (variables categorielles + numeriques)
  document.getElementById('ex').innerHTML=optgroupedDims()+`<optgroup label="Variables numériques">`+Object.keys(NUM).map(k=>`<option value="${k}">${NUM[k]}</option>`).join('')+`</optgroup>`;
  document.getElementById('ex').value='maladieCat';

  // 6. branchements des menus et boutons
  ['cx','cy','cmode'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderCross(filtered())));
  document.getElementById('swapXY').addEventListener('click',()=>{const a=document.getElementById('cx'),b=document.getElementById('cy');const t=a.value;a.value=b.value;b.value=t;renderCross(filtered());});
  document.getElementById('ex').addEventListener('change',()=>renderExplorer(filtered()));
  // menus de l'onglet Determinants
  document.getElementById('detFactor').innerHTML=DET_FACTORS.map(f=>`<option value="${f}">${DIMS[f]}</option>`).join('');
  document.getElementById('detFactor').value='instruction';
  document.getElementById('detFactor').addEventListener('change',()=>renderDeterminants(filtered()));
  document.getElementById('detTarget').addEventListener('change',()=>renderDeterminants(filtered()));
  document.getElementById('exportCsv').addEventListener('click',exportCsv);
  document.getElementById('resetFilters').addEventListener('click',resetFilters);
  // --- mode edition : activation, export, reinitialisation ---
  document.getElementById('editToggle').addEventListener('change',e=>{
    editMode=e.target.checked;
    if(editMode){ // on force la vue echantillonnage + la grille, on desactive le cluster
      gridView=true; document.getElementById('gridViewToggle').checked=true;
      const gt=document.getElementById('gridToggle'); if(!gt.checked){ gt.checked=true; gridLayer.addTo(map); gridLayer.bringToBack(); }
      const cl=document.getElementById('clusterToggle'); if(cl.checked){ cl.checked=false; }
      document.getElementById('editInfo').textContent='Mode édition activé : glissez les points vers les zones habitées.';
    } else { document.getElementById('editInfo').textContent=''; }
    renderMap(filtered());
  });
  // isochrones : activation + memorisation de la cle ORS
  const isoT=document.getElementById('isoToggle');
  if(isoT) isoT.addEventListener('change',e=>{ isoMode=e.target.checked;
    if(isoMode){ const gt=document.getElementById('centresToggle'); if(!gt.checked){gt.checked=true;centresLayer.addTo(map);} setIsoInfo('Cliquez un centre de santé pour voir son isochrone.'); }
    else { isoLayer.clearLayers(); setIsoInfo(''); } });
  // selecteur de centre pour afficher SES isochrones uniquement
  const isoC=document.getElementById('isoCentre');
  if(isoC){ isoC.innerHTML='<option value="">— Choisir un centre de santé —</option>'+CENTRES.map((c,i)=>`<option value="${i}">${c.nom}</option>`).join('');
    isoC.addEventListener('change',()=>{ const i=isoC.value; if(i!==''){ isoMode=true; const t=document.getElementById('isoToggle'); if(t)t.checked=true;
      const c=CENTRES[+i]; computeIsochrone(c); map.setView([c.lat,c.lon],15); } }); }
  // couche zones faiblement desservies (hors 15 min)
  const underT=document.getElementById('underToggle');
  if(underT) underT.addEventListener('change',()=>renderMap(filtered()));
  const ors=document.getElementById('orsKey');
  if(ors){ ors.value=localStorage.getItem('ors_key')||''; ors.addEventListener('change',()=>localStorage.setItem('ors_key',ors.value.trim())); }
  // configuration de l'enregistrement en ligne (Supabase)
  const su=document.getElementById('sbUrl'), sk=document.getElementById('sbKey');
  if(su){ su.value=localStorage.getItem('sb_url')||''; su.addEventListener('change',()=>localStorage.setItem('sb_url',su.value.trim())); }
  if(sk){ sk.value=localStorage.getItem('sb_key')||''; sk.addEventListener('change',()=>localStorage.setItem('sb_key',sk.value.trim())); }
  const cp=document.getElementById('cloudPublish'); if(cp) cp.addEventListener('click',cloudPublish);
  document.getElementById('exportPositions').addEventListener('click',exportPositions);
  const ej=document.getElementById('exportDataJs'); if(ej) ej.addEventListener('click',exportDataJs);
  const ip=document.getElementById('importPositions'); if(ip) ip.addEventListener('change',e=>{ if(e.target.files[0]){ importPositions(e.target.files[0]); e.target.value=''; } });
  document.getElementById('resetPositions').addEventListener('click',()=>{ if(confirm('Annuler tous vos déplacements et revenir aux positions d\'origine ?')) resetPositions(); });
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));

  // 7. premier affichage
  refresh();

  // 8. lien profond depuis la page d'accueil : #onglet ouvre directement le bon onglet,
  //    #story lance directement la visite guidee (etape 5e)
  const h=(location.hash||'').replace('#','');
  if(h==='story'){ /* geree plus bas, une fois initStoryWidget() branche */ }
  else if(h && document.getElementById('tab-'+h)) switchTab(h);

  // 9. apparence : theme clair/sombre + 3 couleurs d'interface + aide + export rapide
  initAppearance();

  // 10. panneau statistique de droite (etape 3)
  initStatsPanel();

  // 11. style cartographique (etape 5b)
  initMapStyleUI();

  // 12. gestion des donnees importees (etape 5c)
  initImportUI();

  // 13. assistant conversationnel a regles (etape 5d)
  initChatWidget();

  // 14. storytelling — visite guidee en 8 etapes (etape 5e)
  initStoryWidget();
  if(h==='story') startStory();

  // 15. exports professionnels (etape 5f)
  initExportsUI();
});

// initMapStyleUI() : synchronise les controles du panneau « Style cartographique »
// avec l'etat courant de mapStyle (deja charge depuis localStorage), puis les branche.
function initMapStyleUI(){
  const $=id=>document.getElementById(id);
  $('mapPalette').value=mapStyle.palette;
  $('mapOpacity').value=Math.round(mapStyle.layerOpacity*100); $('mapOpacityVal').textContent=$('mapOpacity').value;
  $('mapPointSize').value=mapStyle.pointSize; $('mapPointSizeVal').textContent=mapStyle.pointSize;
  $('colCentres').value=mapStyle.colorCentres; $('colQuartier').value=mapStyle.colorQuartier;
  $('colCouverture').value=mapStyle.colorCouverture; $('colGrille').value=mapStyle.colorGrille; $('colIsochrones').value=mapStyle.colorIsochrones;
  $('mapDarkToggle').checked = document.documentElement.getAttribute('data-theme')==='dark';

  $('mapPalette').addEventListener('change',e=>{ mapStyle.palette=e.target.value; applyMapStyle(); });
  $('mapDarkToggle').addEventListener('change',e=>{ applyAppearance(e.target.checked?'dark':'light', document.documentElement.getAttribute('data-accent')); });
  $('mapOpacity').addEventListener('input',e=>{ mapStyle.layerOpacity=(+e.target.value)/100; $('mapOpacityVal').textContent=e.target.value; applyMapStyle(); });
  $('mapPointSize').addEventListener('input',e=>{ mapStyle.pointSize=+e.target.value; $('mapPointSizeVal').textContent=e.target.value; renderMap(filtered()); localStorage.setItem('map_style_v1',JSON.stringify(mapStyle)); });
  [['colCentres','colorCentres'],['colQuartier','colorQuartier'],['colCouverture','colorCouverture'],['colGrille','colorGrille'],['colIsochrones','colorIsochrones']].forEach(([id,key])=>{
    $(id).addEventListener('input',e=>{ mapStyle[key]=e.target.value; applyMapStyle(); });
  });
  $('resetMapStyle').addEventListener('click',()=>{
    Object.assign(mapStyle, DEFAULT_MAP_STYLE);
    localStorage.removeItem('map_style_v1');
    $('mapPalette').value=mapStyle.palette;
    $('mapOpacity').value=Math.round(mapStyle.layerOpacity*100); $('mapOpacityVal').textContent=$('mapOpacity').value;
    $('mapPointSize').value=mapStyle.pointSize; $('mapPointSizeVal').textContent=mapStyle.pointSize;
    $('colCentres').value=mapStyle.colorCentres; $('colQuartier').value=mapStyle.colorQuartier;
    $('colCouverture').value=mapStyle.colorCouverture; $('colGrille').value=mapStyle.colorGrille; $('colIsochrones').value=mapStyle.colorIsochrones;
    applyAppearance('light', document.documentElement.getAttribute('data-accent'));
    applyMapStyle();
  });
}


/* ============================================================================
   15. GESTION DES DONNEES IMPORTEES (etape 5c)
   Ajoute une couche cartographique a partir d'un fichier externe (CSV, Excel,
   GeoJSON, JSON), SANS toucher aux donnees de l'enquete (DATA) : les autres
   onglets (Vue d'ensemble, Recours, Analyse croisee...) restent bases sur
   l'enquete de 726 personnes. C'est une couche complementaire, comparable a
   ce qu'on ferait en ajoutant une couche dans un vrai SIG.
   ============================================================================ */
const IMPORT_ROLES = [
  { key:'id',       label:'Identifiant',          guesses:['id','identifiant','code','num','no','n°'] },
  { key:'quartier', label:'Quartier',              guesses:['quartier','zone','localite','localité','commune','secteur'] },
  { key:'lat',      label:'Latitude',              guesses:['lat','latitude','y'] },
  { key:'lng',      label:'Longitude',             guesses:['lon','lng','long','longitude','x'] },
  { key:'label',    label:'Libellé / nom',         guesses:['nom','label','name','titre','libelle','libellé'] },
  { key:'value',    label:'Champ à cartographier', guesses:['valeur','value','categorie','catégorie','type','classe'] },
  { key:'stat',     label:'Champ statistique',     guesses:['stat','montant','effectif','score','indice','nombre','total'] },
  { key:'temporal', label:'Champ temporel',        guesses:['date','annee','année','periode','période','campagne','vague'] },
  { key:'join',     label:'Champ de jointure',     guesses:['id','identifiant','code','cle','clé','key'] }
];

let importRaw=[];      // lignes brutes telles que parsees dans le fichier
let importHeaders=[];  // en-tetes/colonnes detectees
let importMapping={};  // role -> nom de colonne choisi (ou '' si aucun)
let importedData=[];   // lignes normalisees apres validation, utilisees pour la couche carte
let importedLayer=null;

// guessColumn() : essaie de retrouver la colonne correspondant a un role a partir de mots-cles
function guessColumn(headers,guesses){
  const norm=s=>s.toString().trim().toLowerCase();
  for(const g of guesses){ const hit=headers.find(h=>norm(h)===g); if(hit) return hit; }
  for(const g of guesses){ const hit=headers.find(h=>norm(h).includes(g)); if(hit) return hit; }
  return '';
}

// parseCsv() : petit parseur CSV tolerant (detecte , ou ; comme separateur, gere les guillemets)
function parseCsv(text){
  const rows=[]; let row=[],field='',inQ=false;
  const sampleLine=text.slice(0,2000).split('\n')[0]||'';
  const sep=(sampleLine.split(';').length>sampleLine.split(',').length)?';':',';
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQ=false; }
      else field+=c;
    } else {
      if(c==='"') inQ=true;
      else if(c===sep){ row.push(field); field=''; }
      else if(c==='\n' || c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(field); field=''; rows.push(row); row=[]; }
      else field+=c;
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  const clean=rows.filter(r=>r.some(v=>v!==''));
  if(!clean.length) return [];
  const headers=clean[0].map(h=>h.trim());
  return clean.slice(1).map(r=>{ const o={}; headers.forEach((h,i)=>o[h]=(r[i]??'').trim()); return o; });
}

// parseGeoJsonLike() : extrait les enregistrements d'un GeoJSON (FeatureCollection de points) ou d'un JSON generique
function parseGeoJsonLike(obj){
  if(obj && obj.type==='FeatureCollection' && Array.isArray(obj.features)){
    return obj.features.map(f=>{
      const props=Object.assign({},f.properties||{});
      if(f.geometry && f.geometry.type==='Point' && Array.isArray(f.geometry.coordinates)){
        props.__geoLng=f.geometry.coordinates[0]; props.__geoLat=f.geometry.coordinates[1];
      }
      return props;
    });
  }
  if(Array.isArray(obj)) return obj;
  const arrProp=Object.keys(obj||{}).find(k=>Array.isArray(obj[k])); // ex: { data:[...] }
  if(arrProp) return obj[arrProp];
  return [];
}

// handleImportFile() : lit le fichier choisi selon son extension puis lance la detection des champs
function handleImportFile(file){
  const msg=document.getElementById('importMsg');
  document.getElementById('importFileName').textContent=file.name;
  const ext=file.name.split('.').pop().toLowerCase();
  const reader=new FileReader();
  reader.onerror=()=>{ msg.innerHTML=`<div class="note" style="color:var(--danger)">Le fichier n'a pas pu être lu.</div>`; };
  reader.onload=e=>{
    try{
      let records=[];
      if(ext==='csv'){ records=parseCsv(e.target.result); }
      else if(ext==='xlsx'||ext==='xls'){
        const wb=XLSX.read(e.target.result,{type:'array'});
        records=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
      } else if(ext==='geojson'||ext==='json'){
        records=parseGeoJsonLike(JSON.parse(e.target.result));
      } else { msg.innerHTML=`<div class="note" style="color:var(--danger)">Format non pris en charge (utilisez .csv, .xlsx, .geojson ou .json).</div>`; return; }
      if(!records.length){ msg.innerHTML=`<div class="note" style="color:var(--danger)">Aucune ligne de données trouvée dans ce fichier.</div>`; return; }
      importRaw=records;
      importHeaders=[...new Set(records.flatMap(r=>Object.keys(r)))];
      importMapping={}; IMPORT_ROLES.forEach(r=>importMapping[r.key]=guessColumn(importHeaders,r.guesses));
      renderImportMapping();
      msg.innerHTML=`<div class="note">${records.length} ligne(s), ${importHeaders.length} colonne(s) détectée(s). Vérifiez la correspondance des champs ci-dessous puis cliquez sur « Prévisualiser » ou « Valider ».</div>`;
    }catch(err){ msg.innerHTML=`<div class="note" style="color:var(--danger)">Erreur de lecture : ${err.message}</div>`; }
  };
  if(ext==='xlsx'||ext==='xls') reader.readAsArrayBuffer(file); else reader.readAsText(file,'utf-8');
}

// renderImportMapping() : construit les menus de correspondance des champs (detection auto, modifiable)
function renderImportMapping(){
  document.getElementById('importMappingBox').classList.remove('hidden');
  const grid=document.getElementById('importMappingGrid');
  grid.innerHTML=IMPORT_ROLES.map(r=>{
    const opts=['<option value="">— aucun —</option>'].concat(importHeaders.map(h=>`<option value="${esc(h)}"${importMapping[r.key]===h?' selected':''}>${esc(h)}</option>`)).join('');
    return `<div><label class="lbl">${r.label}</label><select class="sel" data-role="${r.key}" style="width:100%;margin-top:3px">${opts}</select></div>`;
  }).join('');
  grid.querySelectorAll('select[data-role]').forEach(sel=>sel.addEventListener('change',e=>{ importMapping[e.target.dataset.role]=e.target.value; }));
}

// checkImportIssues() : messages d'alerte si un champ essentiel est manquant ou incompatible
function checkImportIssues(){
  const issues=[];
  if(!importMapping.lat || !importMapping.lng){
    issues.push("Aucun champ latitude/longitude sélectionné : les données pourront être exportées mais pas affichées sur la carte.");
  } else {
    const bad=importRaw.filter(r=>{ const la=+r[importMapping.lat], ln=+r[importMapping.lng]; return isNaN(la)||isNaN(ln)||(la===0&&ln===0); }).length;
    if(bad===importRaw.length) issues.push("Le champ latitude/longitude sélectionné ne contient aucune coordonnée numérique valide.");
    else if(bad>0) issues.push(`${bad} ligne(s) sur ${importRaw.length} ont des coordonnées manquantes ou invalides et ne seront pas affichées sur la carte.`);
  }
  if(!importMapping.id) issues.push("Aucun identifiant sélectionné : un numéro de ligne sera utilisé automatiquement.");
  if(!importMapping.label) issues.push("Aucun libellé sélectionné : les popups afficheront l'identifiant.");
  return issues;
}

// renderImportPreview() : apercu (10 premieres lignes) + alertes de coherence
function renderImportPreview(){
  const box=document.getElementById('importPreview');
  const issues=checkImportIssues();
  const cols=['id','quartier','lat','lng','label','value','stat','temporal'].map(k=>importMapping[k]).filter((v,i,a)=>v && a.indexOf(v)===i);
  const shown=cols.length?cols:importHeaders.slice(0,6);
  const rows=importRaw.slice(0,10);
  let html = issues.length? `<div class="note" style="color:var(--accent);margin-bottom:8px">⚠ ${issues.join('<br>⚠ ')}</div>` : `<div class="note" style="color:var(--ok, #4c9a4c);margin-bottom:8px">✓ Tous les champs essentiels sont correctement mappés.</div>`;
  html += `<table class="ct"><thead><tr>${shown.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`+
    rows.map(r=>`<tr>${shown.map(c=>`<td>${esc(r[c]??'')}</td>`).join('')}</tr>`).join('')+
    `</tbody></table><div class="note">Aperçu limité aux 10 premières lignes sur ${importRaw.length}.</div>`;
  box.innerHTML=html;
}

// validateImport() : normalise les lignes selon le mapping choisi et cree la couche carte « Données importées »
function validateImport(){
  if(!importRaw.length){ document.getElementById('importMsg').innerHTML=`<div class="note" style="color:var(--danger)">Importez d'abord un fichier.</div>`; return; }
  const m=importMapping;
  importedData=importRaw.map((r,i)=>({
    id: m.id? r[m.id] : (i+1),
    quartier: m.quartier? r[m.quartier] : '',
    lat: m.lat? +r[m.lat] : (r.__geoLat!=null? +r.__geoLat : null),
    lng: m.lng? +r[m.lng] : (r.__geoLng!=null? +r.__geoLng : null),
    label: m.label? r[m.label] : (m.id? r[m.id] : `Ligne ${i+1}`),
    value: m.value? r[m.value] : '',
    stat: m.stat? +r[m.stat] : null,
    temporal: m.temporal? r[m.temporal] : '',
    join: m.join? r[m.join] : (m.id? r[m.id] : '')
  }));
  buildImportedLayer();
  renderImportSummary();
  try{ if(JSON.stringify(importedData).length<3000000) localStorage.setItem('imported_data_v1', JSON.stringify({mapping:importMapping,data:importedData})); }catch(e){}
  document.getElementById('importMsg').innerHTML=`<div class="note" style="color:var(--ok, #4c9a4c)">✓ ${importedData.length} ligne(s) validée(s) et ajoutée(s) comme couche « Données importées » sur la carte.</div>`;
}

// buildImportedLayer() : (re)construit la couche Leaflet des donnees importees (losanges distincts des points de l'enquete)
function buildImportedLayer(){
  if(!importedLayer) importedLayer=L.layerGroup();
  importedLayer.clearLayers();
  const pts=importedData.filter(d=>typeof d.lat==='number' && typeof d.lng==='number' && !isNaN(d.lat) && !isNaN(d.lng) && !(d.lat===0&&d.lng===0));
  pts.forEach(d=>{
    const mk=L.marker([d.lat,d.lng],{icon:L.divIcon({className:'',iconSize:[14,14],iconAnchor:[7,7],
      html:`<div style="width:11px;height:11px;background:${mapStyle.colorQuartier};border:2px solid #fff;box-shadow:0 0 3px rgba(0,0,0,.6);transform:rotate(45deg)"></div>`})});
    const rows=[['Libellé',d.label],['Quartier',d.quartier],['Valeur',d.value],['Statistique',d.stat],['Champ temporel',d.temporal]].filter(r=>r[1]!=null && r[1]!=='');
    mk.bindPopup(`<div class="pop"><span class="ttl">📥 ${esc(d.label||d.id)}</span><table>${rows.map(r=>`<tr><td class="k">${r[0]}</td><td class="v">${esc(r[1])}</td></tr>`).join('')}</table></div>`);
    importedLayer.addLayer(mk);
  });
  if(pts.length && !map.hasLayer(importedLayer)) importedLayer.addTo(map);
}

// renderImportSummary() : petit resume statistique de la couche importee (effectif + min/moyenne/max du champ statistique)
function renderImportSummary(){
  const box=document.getElementById('importSummary'); if(!importedData.length){ box.innerHTML=''; return; }
  const withGeo=importedData.filter(d=>typeof d.lat==='number' && !isNaN(d.lat)).length;
  const stats=importedData.map(d=>d.stat).filter(v=>typeof v==='number' && !isNaN(v));
  let statLine='';
  if(stats.length){
    const min=Math.min(...stats), max=Math.max(...stats), moy=stats.reduce((a,b)=>a+b,0)/stats.length;
    statLine=`<div class="kpis" style="margin-top:8px">
      <div class="kpi"><div class="v">${stats.length}</div><div class="l">Valeurs statistiques renseignées</div></div>
      <div class="kpi"><div class="v">${min.toLocaleString('fr-FR')}</div><div class="l">Minimum</div></div>
      <div class="kpi"><div class="v">${moy.toFixed(1)}</div><div class="l">Moyenne</div></div>
      <div class="kpi"><div class="v">${max.toLocaleString('fr-FR')}</div><div class="l">Maximum</div></div></div>`;
  }
  box.innerHTML=`<h3>Résumé de la couche importée</h3><div class="note">${importedData.length} ligne(s) au total, dont ${withGeo} affichée(s) sur la carte (coordonnées valides).</div>${statLine}`;
}

// exportImportedData() : reexporte les donnees importees normalisees (CSV)
function exportImportedData(){
  if(!importedData.length){ document.getElementById('importMsg').innerHTML=`<div class="note" style="color:var(--danger)">Rien à exporter : validez d'abord un import.</div>`; return; }
  const cols=['id','quartier','lat','lng','label','value','stat','temporal','join'];
  const lines=[cols.join(';')].concat(importedData.map(d=>cols.map(c=>{const v=d[c]==null?'':(''+d[c]).replace(/"/g,'""'); return /[;"\n]/.test(v)?`"${v}"`:v;}).join(';')));
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='donnees_importees.csv'; a.click();
}

// resetImportedData() : efface completement l'import courant (couche carte, memoire, stockage local)
function resetImportedData(){
  importRaw=[]; importHeaders=[]; importMapping={}; importedData=[];
  if(importedLayer){ importedLayer.clearLayers(); if(map.hasLayer(importedLayer)) map.removeLayer(importedLayer); }
  document.getElementById('importMappingBox').classList.add('hidden');
  document.getElementById('importPreview').innerHTML='';
  document.getElementById('importSummary').innerHTML='';
  document.getElementById('importFileName').textContent='';
  document.getElementById('importFile').value='';
  document.getElementById('importMsg').innerHTML=`<div class="note">Données importées réinitialisées.</div>`;
  localStorage.removeItem('imported_data_v1');
}

// restoreImportedData() : recharge un import precedent depuis ce navigateur au demarrage
function restoreImportedData(){
  try{
    const raw=localStorage.getItem('imported_data_v1'); if(!raw) return;
    const saved=JSON.parse(raw);
    importMapping=saved.mapping||{}; importedData=saved.data||[];
    if(importedData.length){
      buildImportedLayer(); renderImportSummary();
      document.getElementById('importMsg').innerHTML=`<div class="note">${importedData.length} ligne(s) restaurée(s) depuis un import précédent (ce navigateur). Importez un nouveau fichier pour les remplacer.</div>`;
    }
  }catch(e){}
}

// initImportUI() : branche les boutons/fichier de l'onglet « Données »
function initImportUI(){
  document.getElementById('importFile').addEventListener('change',e=>{ if(e.target.files[0]) handleImportFile(e.target.files[0]); });
  document.getElementById('importPreviewBtn').addEventListener('click',renderImportPreview);
  document.getElementById('importValidateBtn').addEventListener('click',validateImport);
  document.getElementById('importExportBtn').addEventListener('click',exportImportedData);
  document.getElementById('importResetBtn').addEventListener('click',resetImportedData);
  restoreImportedData();
}


/* ============================================================================
   16. ASSISTANT CONVERSATIONNEL A REGLES (etape 5d)
   Panneau flottant, pas d'API IA : chaque reponse est generee localement en
   reappelant les memes fonctions d'agregation que le reste du tableau de bord
   (quartierAgg, quartierMatrixAgg, countBy, rate...), evaluees sur la
   selection courante (filtered()) pour rester coherentes avec ce que l'utilisateur voit.
   ============================================================================ */
const CHAT_QUICK_QUESTIONS = [
  "Quel quartier est le moins bien couvert ?",
  "Quel quartier est prioritaire pour l'intervention ?",
  "Quel est le recours aux soins dominant ?",
  "Combien de personnes sont hors couverture à 15 min ?",
  "Quelle est la distance moyenne au centre le plus proche ?",
  "Quel quartier est le plus représenté ?",
  "Quel est le niveau de satisfaction envers le médecin ?",
  "Résume la sélection actuelle"
];

function ansWorstCoverage(recs){
  const qa=quartierAgg(recs).filter(o=>o.n>=3 && o.taux!=null).sort((a,b)=>a.taux-b.taux);
  if(!qa.length) return "Pas assez de données par quartier sur la sélection actuelle (minimum 3 enquêtés/quartier).";
  const w=qa[0];
  return `Sur la sélection actuelle, <b>${esc(w.q)}</b> est le quartier le moins bien couvert : seulement <b>${w.taux.toFixed(0)}%</b> des personnes y sont couvertes à 15 min de marche (${w.n} enquêté(s), distance moyenne ${Math.round(w.distMoy||0)} m). Voir l'onglet <b>Analyse spatiale</b> pour le détail.`;
}
function ansPriority(recs){
  const qa=quartierMatrixAgg(recs).filter(o=>o.n>=3).sort((a,b)=>b.vulnerabilite-a.vulnerabilite);
  if(!qa.length) return "Pas assez de données par quartier sur la sélection actuelle (minimum 3 enquêtés/quartier).";
  const p=qa[0];
  return `<b>${esc(p.q)}</b> ressort comme le quartier le plus prioritaire (score de vulnérabilité <b>${p.vulnerabilite.toFixed(0)}/100</b>, priorité « ${p.priorite} »), combinant faible couverture, distance élevée, population et faible recours à la médecine moderne. Détail dans l'onglet <b>Tableau matrice</b>, mode « Aide à la décision ».`;
}
function ansDominantRecourse(recs){
  const m=countBy(recs,'premierRecoursCat'); const top=[...m.entries()].sort((a,b)=>b[1]-a[1])[0];
  if(!top) return "Aucune donnée de recours aux soins sur la sélection actuelle.";
  const n=recs.length;
  const pMod=rate(recs,'premierRecoursCat',['Médecine moderne']), pTrad=rate(recs,'premierRecoursCat',['Médecine traditionnelle']), pAuto=rate(recs,'premierRecoursCat',['Automédication']);
  return `Le recours dominant est <b>${esc(top[0])}</b> (${(100*top[1]/n).toFixed(0)}% de la sélection). Répartition : médecine moderne <b>${pMod.toFixed(0)}%</b>, médecine traditionnelle <b>${pTrad.toFixed(0)}%</b>, automédication <b>${pAuto.toFixed(0)}%</b>.`;
}
function ansHorsCouverture(recs){
  const wc=recs.filter(d=>d.coverClass); const hors=wc.filter(d=>d.coverClass==='Hors 15 min').length;
  if(!wc.length) return "Aucune donnée de couverture sur la sélection actuelle.";
  return `<b>${hors}</b> personne(s) sur ${wc.length} sont situées hors de la zone des 15 min de marche (${(100*hors/wc.length).toFixed(0)}%).`;
}
function ansDistance(recs){
  const dists=recs.map(d=>d.nearestDist).filter(x=>typeof x==='number');
  if(!dists.length) return "Aucune distance calculée sur la sélection actuelle.";
  const moy=dists.reduce((a,b)=>a+b,0)/dists.length;
  const qa=quartierAgg(recs).filter(o=>o.n>=3 && o.distMoy!=null).sort((a,b)=>b.distMoy-a.distMoy);
  const far=qa[0];
  return `La distance moyenne au centre de santé le plus proche est de <b>${Math.round(moy)} m</b> sur la sélection actuelle.${far?` Le quartier le plus éloigné en moyenne est <b>${esc(far.q)}</b> (${Math.round(far.distMoy)} m).`:''}`;
}
function ansTopQuartier(recs){
  const m=countBy(recs,'quartier'); const top=[...m.entries()].sort((a,b)=>b[1]-a[1])[0];
  if(!top) return "Aucune donnée de quartier sur la sélection actuelle.";
  return `Le quartier le plus représenté est <b>${esc(top[0])}</b> avec <b>${top[1]}</b> enquêté(s) sur ${recs.length}.`;
}
function ansSatisfaction(recs){
  const p=rate(recs,'satisfaitMedecin',['Oui']);
  return `<b>${p.toFixed(0)}%</b> des personnes de la sélection actuelle se disent satisfaites de leur médecin traitant.`;
}
function ansSummary(recs){
  const n=recs.length;
  const quartiers=new Set(recs.map(d=>(d.quartier??'').toString().trim()).filter(Boolean)).size;
  const m=countBy(recs,'premierRecoursCat'); const top=[...m.entries()].sort((a,b)=>b[1]-a[1])[0];
  const wc=recs.filter(d=>d.coverClass); const c15=wc.filter(d=>d.coverClass!=='Hors 15 min').length;
  const qa=quartierMatrixAgg(recs).filter(o=>o.n>=3).sort((a,b)=>b.vulnerabilite-a.vulnerabilite);
  return `Sur la sélection actuelle : <b>${n}</b> enquêté(s) répartis dans <b>${quartiers}</b> quartier(s). Recours dominant : <b>${top?esc(top[0]):'—'}</b>. Couverture à 15 min : <b>${wc.length?(100*c15/wc.length).toFixed(0):'—'}%</b>. Quartier le plus prioritaire : <b>${qa.length?esc(qa[0].q):'—'}</b>.`;
}
function chatFallback(){
  return "Je n'ai pas de réponse automatique toute prête à cette question. Essayez une des questions rapides ci-dessous, ou reformulez avec des mots comme « couverture », « distance », « recours », « quartier », « priorité » ou « satisfaction ».";
}

// deaccent() : enleve les accents pour une recherche de mots-cles plus tolerante
function deaccent(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

// CHAT_RULES : chaque regle porte une liste de mots-cles (deja sans accents) et une
// fonction reponse(recs). Evaluees dans l'ordre, la premiere qui matche l'emporte.
const CHAT_RULES = [
  { kws:['moins bien couvert','pire couverture','faible couverture','mal desservi','moins desservi','moins couvert'], fn:ansWorstCoverage },
  { kws:['prioritaire','priorite','vulnerable'], fn:ansPriority },
  { kws:['recours dominant','recours aux soins','type de recours','quel recours','premier recours'], fn:ansDominantRecourse },
  { kws:['hors couverture','non couvert','non desservi','pas couvert'], fn:ansHorsCouverture },
  { kws:['distance moyenne','distance','loin','eloigne'], fn:ansDistance },
  { kws:['plus represente','plus nombreux','population','quartier le plus'], fn:ansTopQuartier },
  { kws:['satisfaction','satisfait'], fn:ansSatisfaction },
  { kws:['resume','synthese',"vue d'ensemble",'general'], fn:ansSummary }
].map(r=>({ kws:r.kws.map(deaccent), fn:r.fn }));

// answerChat() : trouve la premiere regle dont un mot-cle apparait dans le texte, sinon repli
function answerChat(text){
  const norm=deaccent(text);
  const recs=filtered();
  for(const rule of CHAT_RULES){ if(rule.kws.some(k=>norm.includes(k))) return rule.fn(recs); }
  return chatFallback();
}

// addChatMsg() : ajoute une bulle au fil de discussion et fait defiler vers le bas
function addChatMsg(role,html){
  const body=document.getElementById('chatBody');
  const div=document.createElement('div'); div.className='chat-msg '+role; div.innerHTML=html;
  body.appendChild(div); body.scrollTop=body.scrollHeight;
}
// sendChat() : affiche la question de l'utilisateur puis la reponse generee localement
function sendChat(text){
  text=(text||'').trim(); if(!text) return;
  addChatMsg('user', esc(text));
  const answer=answerChat(text);
  setTimeout(()=>addChatMsg('bot', answer), 200); // petit delai pour un effet de "reflexion"
}

// initChatWidget() : branche le panneau flottant (ouverture/fermeture memorisee, questions rapides, saisie libre)
function initChatWidget(){
  const widget=document.getElementById('chatWidget'), body=document.getElementById('chatBody');
  const setOpen=o=>{
    widget.classList.toggle('collapsed',!o); localStorage.setItem('chat_open',o?'1':'0');
    if(o && !body.dataset.greeted){
      addChatMsg('bot',"Bonjour 👋 Je suis l'assistant de Bakusm@p. Posez-moi une question sur la carte, les statistiques, les graphiques ou les tableaux — je réponds à partir des données actuellement filtrées. Vous pouvez aussi cliquer une question rapide ci-dessous.");
      body.dataset.greeted='1';
    }
  };
  document.getElementById('chatToggle').addEventListener('click',()=>setOpen(widget.classList.contains('collapsed')));
  document.getElementById('chatClose').addEventListener('click',()=>setOpen(false));
  document.getElementById('chatQuick').innerHTML=CHAT_QUICK_QUESTIONS.map(q=>`<button class="chat-chip" data-q="${esc(q)}">${q}</button>`).join('');
  document.getElementById('chatQuick').querySelectorAll('.chat-chip').forEach(b=>b.addEventListener('click',()=>sendChat(b.dataset.q)));
  document.getElementById('chatSend').addEventListener('click',()=>{ const inp=document.getElementById('chatInput'); sendChat(inp.value); inp.value=''; });
  document.getElementById('chatInput').addEventListener('keydown',e=>{ if(e.key==='Enter'){ sendChat(e.target.value); e.target.value=''; } });
  setOpen(localStorage.getItem('chat_open')==='1');
}


/* ============================================================================
   17. STORYTELLING — VISITE GUIDEE EN 8 ETAPES (etape 5e)
   Chaque etape change d'onglet/couche et zoome la carte automatiquement, avec
   un texte court genere a partir des memes fonctions d'agregation que le
   reste de l'application (donc toujours coherent avec la selection courante).
   ============================================================================ */
let storyIndex=-1;

// storyCoverage15() : % de couverture cumulee a 15 min sur "recs"
function storyCoverage15(recs){
  const wc=recs.filter(d=>d.coverClass);
  return wc.length? (100*wc.filter(d=>d.coverClass!=='Hors 15 min').length/wc.length).toFixed(0) : '—';
}
// storyTopDeterminant() : facteur qui differencie le plus le recours a la medecine moderne (meme logique que renderDeterminants)
function storyTopDeterminant(recs){
  const tgt=DET_TARGET.mod;
  const rank=DET_FACTORS.map(f=>{
    const cats=ordered(f,countBy(recs,f)); const rates=[];
    cats.forEach(c=>{ const g=recs.filter(d=>(d[f]??'').toString().trim()===c); const r=targetRate(g,tgt); if(r.n>=10&&r.rate!=null) rates.push(r.rate); });
    return rates.length<2 ? {f,spread:0} : {f,spread:Math.max(...rates)-Math.min(...rates)};
  }).filter(x=>x.spread>0).sort((a,b)=>b.spread-a.spread);
  return rank[0]||null;
}

const STORY_STEPS=[
  { title:"Bienvenue sur Bakusm@p",
    text:()=>`Cette plateforme présente les résultats d'une enquête de terrain sur le recours aux soins de <b>${DATA.length}</b> personnes âgées de la commune de Yopougon, réparties dans <b>${new Set(DATA.map(d=>(d.quartier||'').toString().trim())).size}</b> quartiers. Suivez cette visite guidée en 8 étapes pour découvrir les principaux résultats.`,
    run(){ resetFilters(); switchTab('carte'); document.getElementById('colorBy').value='coverClass'; renderMap(filtered()); if(homeBounds) map.flyToBounds(homeBounds,{padding:[20,20]}); } },

  { title:"Répartition spatiale des enquêtés",
    text:()=>`Chaque point représente une personne enquêtée, coloré ici selon son <b>quartier</b>. La répartition suit celle de la population âgée réellement rencontrée sur le terrain — certains quartiers concentrent davantage d'enquêtés que d'autres.`,
    run(){ switchTab('carte'); document.getElementById('colorBy').value='quartier'; renderMap(filtered()); if(homeBounds) map.flyToBounds(homeBounds,{padding:[20,20]}); } },

  { title:"Les centres de santé",
    text:()=>`<b>${CENTRES.length}</b> établissements de santé ont été recensés à Yopougon (hôpitaux, cliniques, centres de premier contact…). Ils sont représentés par les icônes en croix sur la carte.`,
    run(){ switchTab('carte'); const ct=document.getElementById('centresToggle'); if(ct && !ct.checked){ ct.checked=true; centresLayer.addTo(map); } if(homeBounds) map.flyToBounds(homeBounds,{padding:[20,20]}); } },

  { title:"Accessibilité aux soins",
    text:()=>{ const recs=filtered(); const dists=recs.map(d=>d.nearestDist).filter(x=>typeof x==='number');
      const moy=dists.length? Math.round(dists.reduce((a,b)=>a+b,0)/dists.length) : '—';
      return `La distance moyenne entre une personne âgée et le centre de santé le plus proche est de <b>${moy} m</b>. <b>${storyCoverage15(recs)}%</b> des personnes sont couvertes en 15 minutes de marche.`; },
    run(){ switchTab('spatial'); } },

  { title:"Recours aux soins",
    text:()=>{ const recs=filtered();
      return `<b>${rate(recs,'premierRecoursCat',['Médecine moderne']).toFixed(0)}%</b> des personnes âgées se tournent en premier vers la médecine moderne, <b>${rate(recs,'premierRecoursCat',['Médecine traditionnelle']).toFixed(0)}%</b> vers la médecine traditionnelle et <b>${rate(recs,'premierRecoursCat',['Automédication']).toFixed(0)}%</b> pratiquent l'automédication.`; },
    run(){ switchTab('recours'); } },

  { title:"Les déterminants du recours",
    text:()=>{ const top=storyTopDeterminant(filtered());
      return top? `Le facteur qui différencie le plus le recours à la médecine moderne est <b>${DIMS[top.f]}</b>, avec un écart de <b>${top.spread.toFixed(0)} points</b> entre les catégories les plus extrêmes.` : `Plusieurs facteurs socio-économiques (instruction, revenu, assurance…) influencent le recours à la médecine moderne.`; },
    run(){ switchTab('determinants'); } },

  { title:"Quartiers vulnérables",
    text:()=>{ const qa=quartierMatrixAgg(filtered()).filter(o=>o.n>=3).sort((a,b)=>b.vulnerabilite-a.vulnerabilite);
      return qa.length? `<b>${esc(qa[0].q)}</b> est le quartier le plus prioritaire pour l'amélioration de l'offre sanitaire (score de vulnérabilité <b>${qa[0].vulnerabilite.toFixed(0)}/100</b>), combinant faible couverture, distance élevée et faible recours à la médecine moderne.` : `Pas assez de données par quartier sur la sélection actuelle.`; },
    run(){ const qa=quartierMatrixAgg(filtered()).filter(o=>o.n>=3).sort((a,b)=>b.vulnerabilite-a.vulnerabilite);
      if(qa.length) zoomToQuartier(qa[0].q); else switchTab('carte'); } },

  { title:"Synthèse",
    text:()=>ansSummary(filtered())+" Merci d'avoir suivi cette visite guidée — explorez librement les filtres et les onglets pour approfondir l'analyse.",
    run(){ switchTab('apercu'); } }
];

// renderStoryPanel() : met a jour le texte, la progression et les boutons du panneau
function renderStoryPanel(){
  const step=STORY_STEPS[storyIndex];
  document.getElementById('storyProgress').textContent=`Étape ${storyIndex+1}/${STORY_STEPS.length}`;
  document.getElementById('storyTitle').textContent=step.title;
  document.getElementById('storyText').innerHTML=step.text();
  document.getElementById('storyPrev').disabled=(storyIndex===0);
  document.getElementById('storyNext').textContent = storyIndex===STORY_STEPS.length-1 ? 'Terminer ✓' : 'Suivant →';
  document.getElementById('storyDots').innerHTML=STORY_STEPS.map((_,i)=>`<span class="${i===storyIndex?'on':''}"></span>`).join('');
}
// goToStory() : joue les effets (onglet/carte) de l'etape i puis affiche son texte
function goToStory(i){
  if(i<0||i>=STORY_STEPS.length) return;
  storyIndex=i;
  STORY_STEPS[i].run();
  setTimeout(renderStoryPanel,90); // laisse switchTab()/renderMap() se terminer avant d'afficher le texte
}
function startStory(){
  document.getElementById('storyWidget').classList.remove('hidden');
  const chatW=document.getElementById('chatWidget'); if(chatW) chatW.classList.add('collapsed'); // evite le chevauchement avec le chat
  goToStory(0);
}
function quitStory(){
  storyIndex=-1;
  document.getElementById('storyWidget').classList.add('hidden');
}
// initStoryWidget() : branche le bouton de lancement et la navigation Precedent/Suivant/Quitter
function initStoryWidget(){
  document.getElementById('storyBtn').addEventListener('click',startStory);
  document.getElementById('storyNext').addEventListener('click',()=>{ storyIndex===STORY_STEPS.length-1 ? quitStory() : goToStory(storyIndex+1); });
  document.getElementById('storyPrev').addEventListener('click',()=>goToStory(storyIndex-1));
  document.getElementById('storyQuit').addEventListener('click',quitStory);
}


/* ============================================================================
   18. EXPORTS PROFESSIONNELS (etape 5f)
   Carte en PNG/PDF (titre, legende, echelle, date, source), donnees filtrees
   en CSV/Excel/GeoJSON, graphiques et tableaux de l'onglet d'analyse courant,
   et un rapport de synthese PDF complet. Rien ne modifie l'app elle-meme :
   tout part de ce qui est deja affiche/calcule (filtered(), charts, tables).
   ============================================================================ */

// exportStatus() : message d'etat/erreur affiche sous le selecteur de portee
function exportStatus(msg,isErr){ const el=document.getElementById('exportStatus'); if(el) el.innerHTML = isErr? `<span style="color:var(--danger)">⚠ ${msg}</span>` : msg; }
// tabLabel() : libelle lisible d'un onglet a partir de son id (pour les messages)
function tabLabel(id){ const t=document.querySelector(`.tab[data-tab="${id}"]`); return t?t.textContent.trim():id; }
// withTimeout() : borne la duree d'une promesse (ex : capture de carte trop lente/bloquee)
function withTimeout(promise,ms,msg){ return Promise.race([promise,new Promise((_,rej)=>setTimeout(()=>rej(new Error(msg)),ms))]); }

// captureMapCanvas() : capture la carte (fond, points, legende, echelle) en <canvas> via html2canvas
async function captureMapCanvas(){
  if(typeof html2canvas==='undefined') throw new Error("La bibliothèque de capture (html2canvas) n'a pas pu être chargée — vérifiez votre connexion.");
  const mapEl=document.getElementById('map');
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  return withTimeout(
    html2canvas(mapEl,{useCORS:true,allowTaint:false,logging:false,scale:Math.min(2,window.devicePixelRatio||1),
      // html2canvas clone tout le document pour resoudre les styles ; on exclut les <input type=color/range>
      // (panneau Style cartographique, etape 5b), et on neutralise le fond en color-mix() de la legende
      // flottante (.legendbox, non pris en charge par l'analyseur de couleurs CSS de html2canvas) —
      // uniquement dans le CLONE utilise pour la capture, la page reelle n'est jamais modifiee.
      ignoreElements:el=>el.tagName==='INPUT' && (el.type==='color' || el.type==='range'),
      onclone:clonedDoc=>{
        // le reste de la page (entetes, cartes KPI, panneau stats...) utilise des degrades CSS et du
        // color-mix() : html2canvas les clone/analyse meme s'ils ne seront jamais peints (hors de #map),
        // et son analyseur de couleurs plante dessus. On neutralise donc tout arriere-plan HORS de la
        // carte dans le clone (aucun impact visuel puisque seul #map est rendu dans l'image finale).
        const clonedMap=clonedDoc.getElementById('map');
        clonedDoc.querySelectorAll('*').forEach(el=>{
          if(!el.style) return;
          if(!(clonedMap && clonedMap.contains(el))) el.style.backgroundImage='none';
          el.style.boxShadow='none'; // les ombres portees font parfois planter le rendu des degrades internes de html2canvas
        });
        clonedDoc.querySelectorAll('.legendbox').forEach(el=>{
          el.style.background = isDark ? 'rgba(15,23,42,0.94)' : 'rgba(255,255,255,0.94)';
          el.style.backdropFilter='none'; el.style.webkitBackdropFilter='none';
        });
      }}),
    15000,
    "La capture de la carte a pris trop de temps (fond de carte trop lourd ou connexion lente). Réessayez, ou changez de fond de carte."
  );
}

// buildExportMapImage() : compose l'image finale (bandeau titre + carte capturee + bandeau date/source)
function buildExportMapImage(baseCanvas){
  const padTop=54, padBottom=40;
  const out=document.createElement('canvas');
  out.width=baseCanvas.width; out.height=baseCanvas.height+padTop+padBottom;
  const ctx=out.getContext('2d');
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,out.width,out.height);
  ctx.fillStyle='#0f5e8f'; ctx.fillRect(0,0,out.width,padTop);
  ctx.fillStyle='#ffffff'; ctx.font='bold '+Math.round(padTop*0.32)+'px Arial,sans-serif'; ctx.textBaseline='middle';
  ctx.fillText('Bakusm@p — Recours aux soins des personnes du 3e âge, Yopougon',16,padTop/2);
  ctx.drawImage(baseCanvas,0,padTop);
  const y0=padTop+baseCanvas.height;
  ctx.fillStyle='#f3f7fb'; ctx.fillRect(0,y0,out.width,padBottom);
  ctx.strokeStyle='#dbe4ee'; ctx.beginPath(); ctx.moveTo(0,y0); ctx.lineTo(out.width,y0); ctx.stroke();
  ctx.fillStyle='#334155'; ctx.font=Math.round(padBottom*0.3)+'px Arial,sans-serif'; ctx.textBaseline='middle';
  const dateStr=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  ctx.fillText(`Généré le ${dateStr} — Source : enquête de terrain, thèse de doctorat (UFHB Cocody) — Fond de carte © OpenStreetMap/CARTO`,16,y0+padBottom/2);
  return out;
}

async function exportMapPng(){
  exportStatus('Capture de la carte en cours…');
  try{ const out=buildExportMapImage(await captureMapCanvas());
    const a=document.createElement('a'); a.href=out.toDataURL('image/png'); a.download='carte_bakusmap.png'; a.click();
    exportStatus('✓ Carte exportée en PNG.');
  }catch(err){ exportStatus('Échec de l\'export de la carte : '+err.message,true); }
}
async function exportMapPdf(){
  exportStatus('Capture de la carte en cours…');
  try{
    const out=buildExportMapImage(await captureMapCanvas());
    const {jsPDF}=window.jspdf;
    const orient = out.width>=out.height ? 'landscape' : 'portrait';
    const doc=new jsPDF({orientation:orient,unit:'pt',format:'a4'});
    const pageW=doc.internal.pageSize.getWidth(), pageH=doc.internal.pageSize.getHeight();
    const ratio=Math.min((pageW-40)/out.width,(pageH-40)/out.height);
    const w=out.width*ratio, h=out.height*ratio;
    doc.addImage(out.toDataURL('image/jpeg',0.92),'JPEG',(pageW-w)/2,(pageH-h)/2,w,h);
    doc.save('carte_bakusmap.pdf');
    exportStatus('✓ Carte exportée en PDF.');
  }catch(err){ exportStatus('Échec de l\'export de la carte : '+err.message,true); }
}

// exportDonneesXlsx() : donnees filtrees (memes colonnes que exportCsv) en Excel
function exportDonneesXlsx(){
  const recs=filtered(); if(!recs.length){ exportStatus('Aucune donnée dans la sélection actuelle.',true); return; }
  const cols=Object.keys(recs[0]);
  const ws=XLSX.utils.aoa_to_sheet([cols,...recs.map(r=>cols.map(c=>r[c]??''))]);
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Données filtrées');
  XLSX.writeFile(wb,'donnees_filtrees.xlsx');
  exportStatus(`✓ ${recs.length} ligne(s) exportée(s) (Excel).`);
}
// exportDonneesGeojson() : points actuellement visibles (enquete filtree + couche importee) en GeoJSON
function exportDonneesGeojson(){
  const recs=filtered();
  const features=recs.filter(d=>typeof d.lat==='number' && d.lat).map(d=>({
    type:'Feature', geometry:{type:'Point',coordinates:[d.lng,d.lat]},
    properties:{ source:'enquete', id:d.id, quartier:d.quartier, sexe:d.sexe, age:d.age,
      premierRecours:d.premierRecours, coverClass:d.coverClass, nearestDist:d.nearestDist }
  }));
  if(typeof importedData!=='undefined' && importedData.length){
    importedData.filter(d=>typeof d.lat==='number' && !isNaN(d.lat)).forEach(d=>features.push({
      type:'Feature', geometry:{type:'Point',coordinates:[d.lng,d.lat]},
      properties:{ source:'import', id:d.id, quartier:d.quartier, label:d.label, value:d.value, stat:d.stat }
    }));
  }
  if(!features.length){ exportStatus('Aucun point géolocalisé dans la sélection actuelle.',true); return; }
  const blob=new Blob([JSON.stringify({type:'FeatureCollection',features},null,1)],{type:'application/geo+json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='couches_visibles.geojson'; a.click();
  exportStatus(`✓ ${features.length} point(s) exporté(s) (GeoJSON).`);
}

// exportGraphiquesPng() : chaque graphique Chart.js visible dans le dernier onglet d'analyse, en PNG
function exportGraphiquesPng(){
  const sec=document.getElementById('tab-'+lastContentTab);
  const canvases=sec? [...sec.querySelectorAll('canvas')].filter(c=>charts[c.id]) : [];
  if(!canvases.length){ exportStatus(`L'onglet « ${tabLabel(lastContentTab)} » ne contient pas de graphique à exporter. Consultez un onglet avec des graphiques (Vue d'ensemble, Recours, Analyse croisée…) puis revenez sur Exports.`,true); return; }
  canvases.forEach((c,i)=>{ const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download=`graphique_${lastContentTab}_${i+1}.png`; a.click(); });
  exportStatus(`✓ ${canvases.length} graphique(s) exporté(s) depuis « ${tabLabel(lastContentTab)} ».`);
}

// extractTablesFromSection() : lit generiquement les tableaux HTML (table.ct) d'une section -> {headers,rows}
function extractTablesFromSection(sec){
  return [...sec.querySelectorAll('table.ct')].map(table=>({
    headers:[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim()),
    rows:[...table.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()))
  })).filter(t=>t.rows.length);
}
function getVisibleTables(){
  const sec=document.getElementById('tab-'+lastContentTab);
  return sec? extractTablesFromSection(sec) : [];
}
function exportTableauxCsv(){
  const tables=getVisibleTables();
  if(!tables.length){ exportStatus(`Aucun tableau visible dans « ${tabLabel(lastContentTab)} » à exporter.`,true); return; }
  tables.forEach((t,i)=>{
    const lines=[t.headers.join(';')].concat(t.rows.map(r=>r.map(v=>{const s=(v||'').replace(/"/g,'""'); return /[;"\n]/.test(s)?`"${s}"`:s;}).join(';')));
    const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`tableau_${lastContentTab}_${i+1}.csv`; a.click();
  });
  exportStatus(`✓ ${tables.length} tableau(x) exporté(s) (CSV) depuis « ${tabLabel(lastContentTab)} ».`);
}
function exportTableauxXlsx(){
  const tables=getVisibleTables();
  if(!tables.length){ exportStatus(`Aucun tableau visible dans « ${tabLabel(lastContentTab)} » à exporter.`,true); return; }
  const wb=XLSX.utils.book_new();
  tables.forEach((t,i)=>{ const ws=XLSX.utils.aoa_to_sheet([t.headers,...t.rows]); XLSX.utils.book_append_sheet(wb,ws,`Tableau ${i+1}`.slice(0,31)); });
  XLSX.writeFile(wb,`tableaux_${lastContentTab}.xlsx`);
  exportStatus(`✓ ${tables.length} tableau(x) exporté(s) (Excel) depuis « ${tabLabel(lastContentTab)} ».`);
}
function exportTableauxPdf(){
  const tables=getVisibleTables();
  if(!tables.length){ exportStatus(`Aucun tableau visible dans « ${tabLabel(lastContentTab)} » à exporter.`,true); return; }
  const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape'});
  tables.forEach((t,i)=>{
    if(i>0) doc.addPage('a4','landscape');
    doc.setFontSize(11); doc.text(`Tableau ${i+1} — onglet ${tabLabel(lastContentTab)}`,14,12);
    doc.autoTable({head:[t.headers],body:t.rows,startY:18,styles:{fontSize:7},headStyles:{fillColor:[15,94,143]}});
  });
  doc.save(`tableaux_${lastContentTab}.pdf`);
  exportStatus(`✓ ${tables.length} tableau(x) exporté(s) (PDF) depuis « ${tabLabel(lastContentTab)} ».`);
}

// exportRapportComplet() : rapport PDF automatique (indicateurs, interpretation, carte, quartiers prioritaires)
async function exportRapportComplet(){
  const status=document.getElementById('exportRapportStatus');
  status.textContent='Génération du rapport en cours…';
  try{
    const recs=filtered();
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'pt',format:'a4'});
    const pageW=doc.internal.pageSize.getWidth(), pageH=doc.internal.pageSize.getHeight();
    let y=40;
    doc.setFontSize(16); doc.setTextColor(15,94,143); doc.text('Bakusm@p — Rapport de synthèse',40,y); y+=20;
    doc.setFontSize(10); doc.setTextColor(90,90,90);
    doc.text('Recours aux soins des personnes du 3e âge — commune de Yopougon',40,y); y+=14;
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})} — ${recs.length} enquêté(s) sur la sélection courante`,40,y); y+=24;

    doc.setFontSize(12); doc.setTextColor(15,94,143); doc.text('Indicateurs clés',40,y); y+=6;
    const kMod=rate(recs,'premierRecoursCat',['Médecine moderne']), kPub=rate(recs,'premierRecours',['La formation sanitaire publique']),
      kTradi=rate(recs,'premierRecoursCat',['Médecine traditionnelle']), kSat=rate(recs,'satisfaitMedecin',['Oui']);
    const wc=recs.filter(d=>d.coverClass); const c15=wc.length?(100*wc.filter(d=>d.coverClass!=='Hors 15 min').length/wc.length).toFixed(0):'—';
    doc.autoTable({startY:y+8, body:[
      ['Enquêtés',recs.length],["1er recours = hôpital public",kPub.toFixed(0)+'%'],['Médecine moderne',kMod.toFixed(0)+'%'],
      ['Médecine traditionnelle',kTradi.toFixed(0)+'%'],['Satisfaits du médecin traitant',kSat.toFixed(0)+'%'],['Couverture à 15 min de marche',c15+'%']
    ], styles:{fontSize:9}, theme:'plain', columnStyles:{0:{fontStyle:'bold'}}});
    y=doc.lastAutoTable.finalY+16;

    doc.setFontSize(12); doc.setTextColor(15,94,143); doc.text('Interprétation',40,y); y+=16;
    doc.setFontSize(9.5); doc.setTextColor(30,30,30);
    const interp=ansSummary(recs).replace(/<\/?b>/g,''); // texte brut, sans balises HTML
    const lines=doc.splitTextToSize(interp,pageW-80);
    doc.text(lines,40,y); y+=lines.length*12+16;

    try{
      const base=await captureMapCanvas();
      const imgW=pageW-80, imgH=base.height*(imgW/base.width);
      if(y+imgH>pageH-60){ doc.addPage(); y=40; }
      doc.setFontSize(12); doc.setTextColor(15,94,143); doc.text('Carte',40,y); y+=14;
      doc.addImage(base.toDataURL('image/jpeg',0.9),'JPEG',40,y,imgW,imgH); y+=imgH+18;
    }catch(e){ /* la carte n'est pas bloquante : le reste du rapport se genere quand meme */ }

    const qa=quartierMatrixAgg(recs).filter(o=>o.n>=3).sort((a,b)=>b.vulnerabilite-a.vulnerabilite).slice(0,10);
    if(qa.length){
      if(y>pageH-140){ doc.addPage(); y=40; }
      doc.setFontSize(12); doc.setTextColor(15,94,143); doc.text('Quartiers prioritaires (top 10)',40,y);
      doc.autoTable({startY:y+8, head:[['Quartier','Enquêtés','Couverture 15 min','Score vulnérabilité','Priorité']],
        body:qa.map(o=>[o.q,o.n,o.taux!=null?o.taux.toFixed(0)+'%':'—',o.vulnerabilite.toFixed(0),o.priorite]),
        styles:{fontSize:8}, headStyles:{fillColor:[15,94,143]}});
    }

    const totalPages=doc.internal.getNumberOfPages();
    for(let p=1;p<=totalPages;p++){ doc.setPage(p); doc.setFontSize(7.5); doc.setTextColor(150,150,150);
      doc.text('Source : enquête de terrain, thèse de doctorat en géographie de la population (UFHB Cocody) — Bakusm@p',40,pageH-20); }

    doc.save('rapport_synthese_bakusmap.pdf');
    status.textContent='✓ Rapport généré et téléchargé.';
  }catch(err){ status.innerHTML=`<span style="color:var(--danger)">⚠ Échec de la génération du rapport : ${err.message}</span>`; }
}

// initExportsUI() : bascule le panneau selon la portee choisie, branche tous les boutons
function initExportsUI(){
  const scopeSel=document.getElementById('exportScope');
  const panels={carte:'exportPanelCarte',donnees:'exportPanelDonnees',graphiques:'exportPanelGraphiques',tableaux:'exportPanelTableaux',rapport:'exportPanelRapport'};
  const updatePanels=()=>{
    Object.entries(panels).forEach(([k,id])=>document.getElementById(id).classList.toggle('hidden',k!==scopeSel.value));
    exportStatus('');
    const gi=document.getElementById('exportGraphInfo'); if(gi) gi.textContent=`Exporte les graphiques actuellement visibles dans l'onglet « ${tabLabel(lastContentTab)} ».`;
    const ti=document.getElementById('exportTableInfo'); if(ti) ti.textContent=`Exporte les tableaux actuellement visibles dans l'onglet « ${tabLabel(lastContentTab)} ».`;
  };
  scopeSel.addEventListener('change',updatePanels); updatePanels();

  document.getElementById('exportCartePng').addEventListener('click',exportMapPng);
  document.getElementById('exportCartePdf').addEventListener('click',exportMapPdf);
  document.getElementById('exportDonneesCsv').addEventListener('click',exportCsv);
  document.getElementById('exportDonneesXlsx').addEventListener('click',exportDonneesXlsx);
  document.getElementById('exportDonneesGeojson').addEventListener('click',exportDonneesGeojson);
  document.getElementById('exportGraphiquesPng').addEventListener('click',exportGraphiquesPng);
  document.getElementById('exportTableauxCsv').addEventListener('click',exportTableauxCsv);
  document.getElementById('exportTableauxXlsx').addEventListener('click',exportTableauxXlsx);
  document.getElementById('exportTableauxPdf').addEventListener('click',exportTableauxPdf);
  document.getElementById('exportRapportBtn').addEventListener('click',exportRapportComplet);
}


/* ============================================================================
   APPARENCE : theme (clair/sombre) + accent (cyan/vert/alerte), memorises
   ============================================================================ */
function applyAppearance(theme,accent){
  document.documentElement.setAttribute('data-theme',theme);
  document.documentElement.setAttribute('data-accent',accent);
  localStorage.setItem('ui_theme',theme); localStorage.setItem('ui_accent',accent);
  const tb=document.getElementById('themeBtn'); if(tb) tb.textContent = theme==='dark' ? '☀' : '🌙';
  document.querySelectorAll('.acc').forEach(b=>b.classList.toggle('on',b.dataset.acc===accent));
  const mdt=document.getElementById('mapDarkToggle'); if(mdt) mdt.checked = theme==='dark'; // synchro avec le panneau Style cartographique (etape 5b)
}
function initAppearance(){
  const theme=localStorage.getItem('ui_theme')||'light';
  const accent=localStorage.getItem('ui_accent')||'cyan';
  applyAppearance(theme,accent);
  const tb=document.getElementById('themeBtn');
  if(tb) tb.addEventListener('click',()=>applyAppearance(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark',document.documentElement.getAttribute('data-accent')));
  document.querySelectorAll('.acc').forEach(b=>b.addEventListener('click',()=>applyAppearance(document.documentElement.getAttribute('data-theme'),b.dataset.acc)));
  const ra=document.getElementById('resetAppearance'); if(ra) ra.addEventListener('click',()=>applyAppearance('light','cyan'));
  const eb=document.getElementById('exportBtn'); if(eb) eb.addEventListener('click',exportCsv); // export rapide des donnees filtrees
  const hb=document.getElementById('helpBtn'), hm=document.getElementById('helpModal'), hc=document.getElementById('helpClose');
  if(hb&&hm){ hb.addEventListener('click',()=>hm.classList.remove('hidden')); hc.addEventListener('click',()=>hm.classList.add('hidden'));
    hm.addEventListener('click',e=>{ if(e.target===hm) hm.classList.add('hidden'); }); }
}
