#!/usr/bin/env node
/**
 * Migration « finalisation » de data/lieux.js (novembre 2026). À lancer UNE fois.
 *   node scripts/normaliser-donnees.js
 * - taxonomie courte des types (ancien libellé conservé dans `sous_type`)
 * - fusion des doublons (fiches absorbées conservées en entier dans scripts/fusions-log.json)
 * - ids dupliqués renumérotés, descriptions écrasées restaurées depuis la sauvegarde
 * - villes canoniques, champ `zone` (hub de province) et `depart_de` (excursions)
 * - tags de filtre et de budget cohérents, images cassées remplacées par des placeholders
 * Le script refuse de tourner deux fois (présence de `sous_type`).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const load = (f, k) => { const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, f), 'utf8'))(w); return w[k]; };
const L = load('data/lieux.js', 'LIEUX_DATA');
const I = load('data/itineraires.js', 'ITINERAIRES_DATA');
const BACKUP = load('data/lieux_backup_1767806302561.js', 'LIEUX_DATA'); // lecture seule
if (L.some(l => l.sous_type)) { console.error('Migration déjà appliquée (champ sous_type présent). Abandon.'); process.exit(1); }

const journal = { date: new Date().toISOString().slice(0, 10), fusions: [], ids_renumerotes: [], descriptions_restaurees: [], types_corriges: [], villes_corrigees: [], coords_corrigees: [], budgets_corriges: [], images_provisoires: [] };
const existe = p => fs.existsSync(path.join(ROOT, p));
const get = (id, nom) => { const r = L.filter(l => l.id === id && (!nom || l.nom === nom)); if (r.length !== 1) throw new Error(`Sélection ambiguë : ${id} ${nom || ''} (${r.length})`); return r[0]; };
const setCoords = (l, lat, lng, raison) => {
  journal.coords_corrigees.push({ id: l.id, nom: l.nom, avant: [l.lat, l.lng], apres: [lat, lng], raison });
  l.lat = lat; l.lng = lng;
};

// ---------- 1. Descriptions écrasées (collision d'ids lors d'une réécriture) ----------
[[601, 'Ancien Hôtel de la Marine'], [602, 'Marché Bazarikely'], [603, 'Place Joffre'], [610, 'Gîte du Voyageur'], [201, 'Ravintsara Wellness Hotel']].forEach(([id, nom]) => {
  const l = get(id, nom), b = BACKUP.find(x => x.id === id && x.nom === nom);
  if (!b) throw new Error('Sauvegarde introuvable pour ' + nom);
  l.description = b.description;
  l.description_summary = b.description_summary || b.description.slice(0, 160);
  journal.descriptions_restaurees.push({ id, nom, source: 'data/lieux_backup_1767806302561.js' });
});

// ---------- 2. Fusions ----------
const remapIds = {};
function fusion(garde, absorbes, { coords, nom, raison } = {}) {
  absorbes.forEach(a => {
    journal.fusions.push({ garde: { id: garde.id, nom: garde.nom }, absorbe: { id: a.id, nom: a.nom }, raison: raison || 'même lieu', fiche_absorbee: JSON.parse(JSON.stringify(a)) });
    if (a.nom !== garde.nom) garde.alias = [...new Set([...(garde.alias || []), a.nom])];
    garde.fusion_de = [...(garde.fusion_de || []), a.id];
    // tags génériques (minuscules) : union
    a.tags.filter(t => t === t.toLowerCase() && !/^budget_/.test(t) && !garde.tags.includes(t)).forEach(t => garde.tags.push(t));
    if (a.type === 'Incontournable') garde.type = 'Incontournable';
    // photos supplémentaires
    a.galerie_photos.filter(g => !garde.galerie_photos.some(x => x.url === g.url)).forEach(g => garde.galerie_photos.push({ ...g, type: 'secondaire' }));
    if (/placeholder/.test(garde.image) && !/placeholder/.test(a.image) && existe(a.image)) { garde.image = a.image; garde.galerie_photos = garde.galerie_photos.filter(g => !/placeholder/.test(g.url)); garde.galerie_photos.unshift({ url: a.image, alt: garde.nom, type: 'principale' }); }
    if (!garde.siteWeb && a.siteWeb) garde.siteWeb = a.siteWeb;
    if (a.id !== garde.id) remapIds[a.id] = garde.id;
    L.splice(L.indexOf(a), 1);
  });
  if (coords) setCoords(garde, coords[0], coords[1], 'coordonnées de la fiche fusionnée, plus proches du site réel');
  if (nom) { garde.alias = [...new Set([...(garde.alias || []), garde.nom])]; garde.nom = nom; }
}
const byIdx = (id, n) => L.filter(l => l.id === id)[n];

fusion(get(7), [get(602, "Mer d'Émeraude")], { coords: [-12.164, 49.352] });
fusion(get(10), [get(603, 'Tsingy Rouge')], { coords: [-12.633, 49.483] });
fusion(get(9), [get(604)]);
fusion(byIdx(100, 0), [byIdx(100, 1), get(612)], { raison: 'même hôtel saisi trois fois' });
fusion(get(18), [get(250)]);
fusion(get(19), [get(251), get(619)]);
fusion(get(22), [get(252)]);
fusion(get(20), [get(253)]);
fusion(get(17), [get(255)]);
fusion(get(21), [get(254), get(622)]);
fusion(get(102), [get(611, 'Allamanda Hotel')]);
fusion(get(702, 'Île aux Nattes'), [get(633)], { raison: 'même île ; la fiche 633 était rattachée à Toamasina (134 km)' });
fusion(get(35), [get(627)]);
fusion(get(41), [get(630)], { raison: 'même parc ; la fiche 630 était rattachée à Toamasina (136 km)' });
fusion(get(47), [get(634)]);
fusion(get(50), [get(613), get(617), get(605)], { raison: 'quatre fiches pour le massif de l’Ankarana' });
fusion(get(601, 'Diego-Suarez (Antsiranana)'), [get(614)]);
fusion(get(15), [get(616)]);
fusion(get(13), [get(16, 'Le Melville')], { raison: 'même restaurant (la fiche 16 était typée « Nature »)' });
fusion(get(36), [get(628)]);
fusion(get(535), [get(638)]);
fusion(get(523), [get(624)]);
fusion(get(683), [get(632)], { coords: [-18.6, 49.2] });
fusion(get(410), [get(637)], { raison: 'même établissement (Bakuba / Bakouba)' });
fusion(get(48), [get(635), get(403)], { raison: 'la forêt de baobabs de Mangily est la réserve de Reniala' });

// ---------- 3. Ids dupliqués restants ----------
[[601, 'Ancien Hôtel de la Marine', 801], [610, 'Gîte du Voyageur', 802], [201, 'Ravintsara Wellness Hotel', 803],
 [701, 'Cimetière des Pirates', 804], [702, 'Île aux Nattes', 805], [703, 'Piscine Naturelle Ambodiatafana', 806],
 [704, "Cascade d'Antanandava", 807], [705, 'Safari Baleines', 808]].forEach(([id, nom, nv]) => {
  const l = get(id, nom); l.id = nv; journal.ids_renumerotes.push({ nom, avant: id, apres: nv });
});
// Les circuits pointent vers les fiches conservées
(function remap(o) {
  if (Array.isArray(o)) return o.forEach(remap);
  if (o && typeof o === 'object') for (const k in o) { if (k === 'lieux_ids') o[k] = [...new Set(o[k].map(x => remapIds[x] || x))]; else remap(o[k]); }
})(I);

// ---------- 4. Types ----------
const TAXO = {
  'Ville': ['Ville', 'ville'],
  'Hôtel': ['Hotel', 'Hôtel', 'Hébergement', 'Lodge', 'Guest House', "Chambres d'hôtes", 'Pension', 'Hôtel de Luxe', 'Appartement Hôtel', 'Résidence Meublée', 'Lodge de Charme'],
  'Restaurant': ['Restaurant', 'Gargote', 'Snack', 'Café-Restaurant', 'Restaurant Gastronomique'],
  'Bar & Sortir': ['Bar', 'sortir', 'Boîte de nuit', 'Nightclub', 'Club Premium', 'Bar-Club', 'Bar Lounge', 'Bar Karaoké', 'Bar-Restaurant', 'Bar Tendance', 'Rooftop Bar', 'Beach Bar'],
  'Nature': ['Nature', 'nature', 'Parc Zoologique', 'Parc Naturel', 'Verger', 'Parc Urbain', 'Réserve Privée', 'Jardin Botanique', 'Point de Vue'],
  'Plage': ['Plage', 'plage'],
  'Culture': ['Culture', 'Marché', 'Centre Culturel', 'Visite Guidée'],
  'Spot Local': ['Spot Local', 'spot-local'],
  'Incontournable': ['Incontournable'],
  'Excursion': ['Découverte', 'Aventure', 'Excursion Fluviale', 'Excursion Maritime', 'Excursion Marine', 'Vol Panoramique', 'Pêche Sportive']
};
const VERS = {}; Object.entries(TAXO).forEach(([t, anciens]) => anciens.forEach(a => VERS[a] = t));
// Fiches dont l'ancien type était manifestement faux (ex. un marché typé « Bar »)
const TYPE_FORCE = {
  36: 'Nature', 40: 'Spot Local', 46: 'Spot Local', 210: 'Bar & Sortir', 316: 'Culture', 645: 'Restaurant', 503: 'Hôtel',
  519: 'Hôtel', 28: 'Excursion', 23: 'Nature', 11: 'Culture', 603: 'Culture', 10: 'Incontournable', 7: 'Incontournable'
};
const TAG_CAT = { 'Hôtel': 'dormir', 'Restaurant': 'manger', 'Bar & Sortir': 'sortir', 'Spot Local': 'spots' };
const CATS = ['explorer', 'manger', 'dormir', 'sortir', 'spots'];
L.forEach(l => {
  const ancien = l.type;
  let nv = VERS[ancien];
  if (!nv) throw new Error('Type inconnu : ' + ancien);
  if (TYPE_FORCE[l.id] && TYPE_FORCE[l.id] !== nv) { journal.types_corriges.push({ id: l.id, nom: l.nom, avant: ancien, apres: TYPE_FORCE[l.id] }); nv = TYPE_FORCE[l.id]; }
  l.sous_type = ancien === 'sortir' ? 'Bar' : ancien.charAt(0).toUpperCase() + ancien.slice(1).replace('Spot-local', 'Spot Local');
  l.type = nv; l.categorie = nv;
  // le premier tag reprenait l'ancien type : on l'aligne sur le nouveau
  l.tags = l.tags.filter(t => t !== ancien && !Object.keys(VERS).includes(t));
  l.tags.unshift(nv);
  // tag de filtre : au moins un, cohérent avec le type
  const voulu = TAG_CAT[nv] || 'explorer';
  if (!l.tags.includes(voulu)) l.tags.push(voulu);
  if (nv === 'Spot Local' && !l.tags.includes('explorer') && !l.tags.some(t => ['manger', 'sortir', 'dormir'].includes(t))) l.tags.push('explorer');
  l.tags = [...new Set(l.tags)];
});
// tags de filtre manifestement faux
const retire = (id, tag) => { const l = get(id); l.tags = l.tags.filter(t => t !== tag); };
retire(801, 'dormir');          // ruine, on n'y dort pas
retire(46, 'sortir'); retire(316, 'sortir'); retire(40, 'sortir');
get(309).tags.push('manger');   // restaurant du Zomatel

// ---------- 5. Villes, zone, depart_de ----------
const ZONE = {
  'Diego-Suarez': 'antsiranana', 'Sadjoavato': 'antsiranana', 'Ankarana': 'antsiranana', 'Anivorano': 'antsiranana', 'Ambilobe': 'antsiranana',
  'Ambanja': 'antsiranana', 'Ankify': 'antsiranana', 'Sambava': 'antsiranana', 'Andapa': 'antsiranana', 'Antalaha': 'antsiranana',
  'Nosy Be': 'nosybe',
  'Antananarivo': 'antananarivo', 'Ampefy': 'antananarivo', 'Antsirabe': 'antananarivo',
  'Mahajanga': 'mahajanga', 'Ankarafantsika': 'mahajanga', 'Anjohibe': 'mahajanga',
  'Toamasina': 'toamasina', 'Andasibe': 'toamasina', 'Mananara': 'toamasina', 'Foulpointe': 'toamasina', 'Mahambo': 'toamasina', "Ankanin'ny Nofy": 'toamasina',
  'Fianarantsoa': 'fianarantsoa', 'Ranomafana': 'fianarantsoa',
  'Toliara': 'toliara', 'Ifaty': 'toliara', 'Anakao': 'toliara', 'Isalo': 'toliara',
  'Sainte-Marie': 'saintemarie'
};
const ALIAS_VILLE = { 'Toliara': ['Tuléar', 'Tulear'], 'Diego-Suarez': ['Antsiranana', 'Diego'], 'Toamasina': ['Tamatave'], 'Mahajanga': ['Majunga'], 'Antananarivo': ['Tana', 'Tananarive'], 'Fianarantsoa': ['Fianar'], 'Sainte-Marie': ['Nosy Boraha'], 'Nosy Be': ['Nosy-Be'] };
const ville = (id, v, departDe) => { const l = get(id); journal.villes_corrigees.push({ id, nom: l.nom, avant: l.ville, apres: v, depart_de: departDe || null }); l.ville = v; if (departDe) l.depart_de = departDe; };
L.filter(l => l.ville === 'Tuléar').forEach(l => { l.ville = 'Toliara'; });
journal.villes_corrigees.push({ note: '« Tuléar » (18 fiches) fusionné dans « Toliara » ; « Tuléar » reste un alias de recherche (champ ville_alias).' });
ville(10, 'Sadjoavato', 'Diego-Suarez');
get(50).depart_de = 'Diego-Suarez'; get(51).depart_de = 'Diego-Suarez'; get(52).depart_de = 'Diego-Suarez';
ville(35, 'Ankarafantsika', 'Mahajanga');
ville(37, 'Anjohibe', 'Mahajanga');
ville(684, 'Sainte-Marie', 'Toamasina');
ville(675, 'Foulpointe', 'Toamasina');
ville(682, 'Mahambo', 'Toamasina');
ville(683, "Ankanin'ny Nofy", 'Toamasina');
ville(639, 'Ranomafana', 'Fianarantsoa');
[413, 414, 419].forEach(id => ville(id, 'Ifaty', 'Toliara'));
[402, 409, 412, 636].forEach(id => ville(id, 'Anakao', 'Toliara'));
[41, 42, 43].forEach(id => { get(id).depart_de = 'Antananarivo'; }); // Andasibe se visite depuis Tana (RN2)
L.forEach(l => {
  if (!ZONE[l.ville]) throw new Error('Ville sans zone : ' + l.ville);
  l.zone = ZONE[l.ville];
  if (ALIAS_VILLE[l.ville]) l.ville_alias = ALIAS_VILLE[l.ville];
});

// ---------- 6. Prix / budget ----------
const niveau = n => n < 25000 ? 1 : n <= 80000 ? 2 : 3;
L.forEach(l => {
  if (/^gratuit$/i.test(l.prix)) l.prix = 'Gratuit';
  if (l.prixNum === undefined) l.prixNum = l.prix === 'Gratuit' ? 0 : (parseInt(String(l.prix).replace(/\D/g, ''), 10) || 0);
  const actuel = l.tags.find(t => /^budget_/.test(t));
  if (l.prixNum > 0 && actuel !== 'budget_' + niveau(l.prixNum)) {
    journal.budgets_corriges.push({ id: l.id, nom: l.nom, prix: l.prix, avant: actuel, apres: 'budget_' + niveau(l.prixNum) });
    l.tags = l.tags.map(t => t === actuel ? 'budget_' + niveau(l.prixNum) : t);
  }
});

// ---------- 7. Images cassées → placeholders (aucun 404) ----------
const PH = { 'Hôtel': 'images/placeholder-hotel.jpg', 'Restaurant': 'images/placeholder-restaurant.jpg', 'Bar & Sortir': 'images/placeholder-bar.jpg', 'Spot Local': 'images/placeholder-spot.jpg' };
L.forEach(l => {
  if (!existe(l.image)) {
    const ph = PH[l.type] || 'images/placeholder-nature.jpg';
    journal.images_provisoires.push({ id: l.id, nom: l.nom, manquante: l.image, remplacee_par: ph });
    l.galerie_photos.forEach(g => { if (g.url === l.image) g.url = ph; });
    l.image = ph;
  }
  const absentes = l.galerie_photos.filter(g => !existe(g.url));
  if (absentes.length) {
    l.galerie_a_creer = absentes.map(g => g.url);
    absentes.forEach(g => journal.images_provisoires.push({ id: l.id, nom: l.nom, manquante: g.url, remplacee_par: '(retirée de la galerie, listée dans galerie_a_creer)' }));
    l.galerie_photos = l.galerie_photos.filter(g => existe(g.url));
  }
  if (/placeholder/.test(l.image)) l.image_provisoire = true;
  l.galerie_photos.forEach(g => { if (!g.alt || /placeholder/.test(g.url)) g.alt = `${l.nom}, ${l.ville}` + (/placeholder/.test(g.url) ? ' (photo provisoire)' : ''); });
  l.hasCarousel = l.galerie_photos.length > 1;
  // cohérence des champs dérivés
  l.y_aller = `https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`;
  if (l.carte_interactive) { l.carte_interactive.latitude = l.lat; l.carte_interactive.longitude = l.lng; }
});

// ---------- Écriture ----------
fs.writeFileSync(path.join(ROOT, 'data/lieux.js'), 'window.LIEUX_DATA = ' + JSON.stringify(L, null, 2) + ';');
fs.writeFileSync(path.join(ROOT, 'data/itineraires.js'), 'window.ITINERAIRES_DATA = ' + JSON.stringify(I, null, 2) + ';');
fs.writeFileSync(path.join(__dirname, 'fusions-log.json'), JSON.stringify(journal, null, 2) + '\n');
console.log(`OK : ${L.length} lieux | ${journal.fusions.length} fiches absorbées | ${journal.ids_renumerotes.length} ids renumérotés | ${journal.types_corriges.length} types corrigés à la main | ${journal.budgets_corriges.length} budgets | ${journal.images_provisoires.length} images provisoires`);
