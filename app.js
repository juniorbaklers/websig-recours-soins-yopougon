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
  bandAny:['Moins de 500 m','500 m a 1 km','1 a 1,5 km','Plus de 1,5 km']
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
  bandPrim:'Distance réelle au 1er contact', bandAny:'Distance réelle (tout centre)'
};

// NUM = les variables numeriques (montants + distances calculees en SIG). Traitees a part car on calcule
// des statistiques (mediane, moyenne) et un histogramme, pas des categories.
const NUM = { coutConsultation:'Coût de la consultation (FCFA)', coutMax:'Coût max. accepté (FCFA)', loyer:'Loyer mensuel (FCFA)',
  dAny:'Distance au centre le plus proche (m)', dPub:'Distance au centre public le plus proche (m)', dPrim:'Distance au 1er contact le plus proche (m)' };

// Couches spatiales injectees par centres.js et yopougon.js
const CENTRES = window.CENTRES || [];
const YOP = window.YOP_BOUNDARY || null;

// FILTER_GROUPS = quelles variables apparaissent dans la barre de filtres a
// gauche, et sous quel intitule de groupe. On ne met pas TOUT pour ne pas
// surcharger ; les 70+ variables restent accessibles dans les onglets.
const FILTER_GROUPS = [
  { g:'Profil', keys:['sexe','age','nationalite','ethnie','matrimonial','religion','instruction','professionCat','cadreProfession'] },
  { g:'Localisation', keys:['quartier','lieuNaissance'] },
  { g:'Ménage & économie', keys:['statutLogement','typeConstruction','nbPieces','revenu','depenses','nbEnfantsCat','personnesCharge','autreRevenu'] },
  { g:'Accès aux soins', keys:['existenceCentre','frequentation','distancePublique','bandPrim','tempsMis','opinionDistance','coutTransport'] },
  { g:'Recours & assurance', keys:['premierRecours','premierRecoursCat','assurance','seulAccompagne'] },
  { g:'Santé & résultats', keys:['maladieCat','resultatTraitement','retourneMemeStructure','satisfaitMedecin'] }
];


/* ============================================================================
   2. PALETTE DE COULEURS
   ============================================================================ */

// Palette categorielle, choisie pour rester lisible (y compris pour la plupart
// des daltoniens) et coherente entre la carte et les graphiques.
const PAL = ['#0f5e8f','#e8813a','#12a08a','#b0568f','#4c9a4c','#d9534f','#6f7fb3','#e6b84c','#7a5c48','#4bb1c9','#9a4c78','#8aa14c'];

// Cas particulier des reponses Oui/Non : vert = Oui, rouge = Non (plus intuitif).
const YESNO = { 'Oui':'#4c9a4c','Non':'#d9534f','OUI':'#4c9a4c','NON':'#d9534f' };

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
  const cats=CATS[key]||catsOf(key);
  if(cats.every(c=>YESNO[c.trim()]!==undefined || ['Oui','Non','OUI','NON'].includes(c.trim())) && YESNO[val.trim()]) return YESNO[val.trim()];
  const i=cats.indexOf(val); return PAL[(i<0?0:i)%PAL.length];
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
}


/* ============================================================================
   7. LA CARTE (Leaflet)
   ============================================================================ */

let map,baseOSM,baseCarto,markerLayer,clusterLayer;
let centresLayer,buffer500Layer,buffer1000Layer,boundaryLayer; // couches de l'analyse spatiale

// Couleur d'un centre de sante selon son type simplifie
const CENTRE_COL={'Hopital':'#b5121b','Clinique privee':'#7a3fa0','Centre de sante (1er contact)':'#0d8a6a','Cabinet / Infirmerie':'#e8813a','Autre / a verifier':'#8a94a6'};

// initMap() : cree la carte une seule fois, centree sur Yopougon
function initMap(){
  map=L.map('map',{preferCanvas:true}).setView([5.345,-4.075],13);
  // deux fonds de carte possibles
  baseOSM=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  baseCarto=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'});
  markerLayer=L.layerGroup().addTo(map); // couche qui contiendra les enquetes

  buildSpatialLayers(); // cree les couches centres / buffers / limite

  // bascule du fond de carte
  document.getElementById('basemapToggle').addEventListener('change',e=>{
    if(e.target.checked){map.removeLayer(baseOSM);baseCarto.addTo(map);}else{map.removeLayer(baseCarto);baseOSM.addTo(map);}});
  // bascule du regroupement (cluster)
  document.getElementById('clusterToggle').addEventListener('change',()=>renderMap(filtered()));
  // bascules des couches spatiales : on affiche/masque la couche correspondante
  const tog=(id,layer)=>document.getElementById(id).addEventListener('change',e=>{e.target.checked?layer.addTo(map):map.removeLayer(layer);});
  tog('centresToggle',centresLayer); tog('buffer500Toggle',buffer500Layer); tog('buffer1000Toggle',buffer1000Layer); tog('boundaryToggle',boundaryLayer);
}

// buildSpatialLayers() : construit une fois pour toutes les couches SIG
function buildSpatialLayers(){
  // 1) limite communale de Yopougon (contour)
  if(YOP){ boundaryLayer=L.geoJSON(YOP,{style:{color:'#0f5e8f',weight:2,fill:false,dashArray:'4 3'}}).addTo(map); }
  else boundaryLayer=L.layerGroup();

  // 2) centres de sante : petit carre colore selon le type
  centresLayer=L.layerGroup();
  buffer500Layer=L.layerGroup(); buffer1000Layer=L.layerGroup();
  CENTRES.forEach(c=>{
    const col=CENTRE_COL[c.type]||'#8a94a6';
    const icon=L.divIcon({className:'',iconSize:[12,12],iconAnchor:[6,6],
      html:`<div style="width:11px;height:11px;background:${col};border:1.5px solid #fff;box-shadow:0 0 2px rgba(0,0,0,.5);transform:rotate(45deg)"></div>`});
    const mk=L.marker([c.lat,c.lon],{icon});
    mk.bindPopup(`<div class="pop"><b>${c.nom}</b><table><tr><td class="k">Catégorie</td><td>${c.categorie}</td></tr><tr><td class="k">Niveau</td><td>${c.niveau}</td></tr><tr><td class="k">Secteur</td><td>${c.secteur}</td></tr></table></div>`);
    centresLayer.addLayer(mk);
    // zones de couverture autour des centres de PREMIER CONTACT uniquement
    if(c.type==='Centre de sante (1er contact)'){
      buffer500Layer.addLayer(L.circle([c.lat,c.lon],{radius:500,color:'#0d8a6a',weight:1,fillColor:'#0d8a6a',fillOpacity:.08}));
      buffer1000Layer.addLayer(L.circle([c.lat,c.lon],{radius:1000,color:'#12a08a',weight:1,fillColor:'#12a08a',fillOpacity:.05}));
    }
  });
  centresLayer.addTo(map); // affiches par defaut (case cochee)
}

// popupHtml() : contenu de la fiche affichee quand on clique un point
function popupHtml(d){
  const rows=[['Quartier',d.quartier],['Sexe',d.sexe],['Âge',d.age],['Profession',d.professionRaw],
    ['Instruction',d.instruction],['Revenu',d.revenu],['Assurance',d.assurance],
    ['1er recours',d.premierRecours],['Maladie',d.maladieCat],['Résultat',d.resultatTraitement],
    ['Dist. 1er contact',d.dPrim!=null?d.dPrim+' m':'—'],['Dist. centre public',d.dPub!=null?d.dPub+' m':'—']];
  return `<div class="pop"><b>Enquêté n°${d.id}</b><table>${rows.map(r=>`<tr><td class="k">${r[0]}</td><td>${r[1]||'—'}</td></tr>`).join('')}</table></div>`;
}

// renderMap() : (re)dessine les points selon la selection et la variable choisie
function renderMap(recs){
  const key=document.getElementById('colorBy').value;      // variable qui donne la couleur
  markerLayer.clearLayers(); if(clusterLayer){map.removeLayer(clusterLayer);clusterLayer=null;}
  const cluster=document.getElementById('clusterToggle').checked && L.markerClusterGroup;
  const target = cluster ? (clusterLayer=L.markerClusterGroup({maxClusterRadius:45})) : markerLayer;
  recs.forEach(d=>{
    if(typeof d.lat!=='number'||typeof d.lng!=='number'||!d.lat) return; // ignorer les points sans coordonnees
    const val=(d[key]??'').toString().trim()||'(non renseigné)';
    const col=val==='(non renseigné)'?'#9aa5b1':colorFor(key,val);
    const mk=L.circleMarker([d.lat,d.lng],{radius:5,color:'#fff',weight:1,fillColor:col,fillOpacity:.85});
    mk.bindPopup(popupHtml(d)); target.addLayer(mk);
  });
  if(cluster) map.addLayer(clusterLayer);
  renderLegend(key,recs);
}

// renderLegend() : legende des couleurs de la carte, avec effectifs
function renderLegend(key,recs){
  const m=countBy(recs,key); const cats=ordered(key,m);
  document.getElementById('mapLegend').innerHTML=
    `<b>${DIMS[key]||key}</b>`+cats.map(c=>`<div class="li"><span class="sw" style="background:${colorFor(key,c)}"></span>${c} <span class="cnt" style="margin-left:auto;color:#94a3b8">${m.get(c)||0}</span></div>`).join('')
    +(m.size?'':'<div class="muted">Aucune donnée</div>');
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
  }).join('');
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
  `<optgroup label="Accès & recours">`+['existenceCentre','frequentation','distancePublique','tempsMis','opinionDistance','coutTransport','opinionTransport','premierRecours','premierRecoursCat','assurance','seulAccompagne','accompagnePar'].map(o=>`<option value="${o}">${DIMS[o]}</option>`).join('')+`</optgroup>`+
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

  if(currentTab==='spatial'){ renderSpatial(recs); } // analyse spatiale (distances SIG)
  if(currentTab==='croise'){ renderCross(recs); }   // analyse croisee libre
  if(currentTab==='explor'){ renderExplorer(recs); } // explorateur de variable
}

/* --- Rendu de l'onglet Analyse spatiale --- */
function renderSpatial(recs){
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
   14. ORCHESTRATION ET DEMARRAGE
   ============================================================================ */

// refresh() : LE point central. A chaque changement de filtre, on recalcule la
// selection puis on met a jour les pastilles, les KPIs et l'onglet visible.
function refresh(){ const recs=filtered(); renderChips(); renderKPIs(recs); renderTab(recs); }

// switchTab() : change d'onglet (affiche/masque les sections, redessine)
function switchTab(t){
  currentTab=t;
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));
  ['carte','apercu','recours','percept','spatial','croise','explor'].forEach(id=>{const el=document.getElementById('tab-'+id);if(el)el.classList.toggle('hidden',id!==t);});
  renderTab(filtered());
  if(t==='carte') setTimeout(()=>map.invalidateSize(),80); // Leaflet doit recalculer sa taille quand on revient sur la carte
}

// Au chargement de la page : on branche tout
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('nTotal').textContent=DATA.length;
  initMap();       // 1. la carte
  buildFilters();  // 2. la barre de filtres

  // 3. menu "colorer la carte par"
  fillSelect(document.getElementById('colorBy'),['premierRecours','premierRecoursCat','bandPrim','sexe','age','assurance','frequentation','maladieCat','revenu','instruction','professionCat','resultatTraitement','satisfaitMedecin','quartier'],'premierRecours');
  document.getElementById('colorBy').addEventListener('change',()=>renderMap(filtered()));

  // 4. menus de l'analyse croisee (valeurs de depart : age x premier recours)
  document.getElementById('cx').innerHTML=optgroupedDims();
  document.getElementById('cy').innerHTML=optgroupedDims();
  document.getElementById('cx').value='age'; document.getElementById('cy').value='premierRecours';

  // 5. menu de l'explorateur (variables categorielles + numeriques)
  document.getElementById('ex').innerHTML=optgroupedDims()+`<optgroup label="Variables numériques">`+Object.keys(NUM).map(k=>`<option value="${k}">${NUM[k]}</option>`).join('')+`</optgroup>`;
  document.getElementById('ex').value='maladieCat';

  // 6. branchements des menus et boutons
  ['cx','cy','cmode'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderCross(filtered())));
  document.getElementById('swapXY').addEventListener('click',()=>{const a=document.getElementById('cx'),b=document.getElementById('cy');const t=a.value;a.value=b.value;b.value=t;renderCross(filtered());});
  document.getElementById('ex').addEventListener('change',()=>renderExplorer(filtered()));
  document.getElementById('exportCsv').addEventListener('click',exportCsv);
  document.getElementById('resetFilters').addEventListener('click',resetFilters);
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));

  // 7. premier affichage
  refresh();
});
