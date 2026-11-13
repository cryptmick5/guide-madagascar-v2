#!/usr/bin/env node
/**
 * Audit du guide Gasikara Explorer.
 * Usage : node scripts/audit.js [--json] [--verbose]
 *   --json    : écrit aussi data/audit_report.json
 *   --verbose : liste complète (sinon 15 lignes max par section)
 * Code de sortie : 1 s'il reste des erreurs bloquantes (fichier manquant, coordonnée
 * hors Madagascar, id dupliqué, type hors taxonomie), 0 sinon.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');
const WRITE_JSON = process.argv.includes('--json');

// Taxonomie officielle (champ `type`). L'ancien libellé est conservé dans `sous_type`.
const TAXONOMIE = ['Ville', 'Hôtel', 'Restaurant', 'Bar & Sortir', 'Nature', 'Plage',
  'Culture', 'Spot Local', 'Incontournable', 'Excursion'];
const BBOX = { latMin: -25.7, latMax: -11.8, lngMin: 43, lngMax: 50.6 };
const RAYON_VILLE_KM = 60;
const SCAN = ['index.html', 'circuit.html', 'manifest.json', 'sw.js', 'js', 'data', 'css', 'circuits'];
const IGNORER = /(_backup_|\/backups?\/|ARCHIVE_OLD|\.min\.js|\.map$|audit_report\.json|itineraires\.json|spots\.json)/;

// ---------- utilitaires ----------
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = s => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
function km(a, b) {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const mediane = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
function walk(p, out = []) {
  if (!fs.existsSync(p)) return out;
  const st = fs.statSync(p);
  if (st.isDirectory()) fs.readdirSync(p).forEach(f => walk(path.join(p, f), out));
  else out.push(p);
  return out;
}
function loadLieux() {
  const sandbox = { window: {} };
  new Function('window', fs.readFileSync(path.join(ROOT, 'data/lieux.js'), 'utf8'))(sandbox.window);
  return sandbox.window.LIEUX_DATA;
}

const rapport = { date: new Date().toISOString().slice(0, 10), sections: {} };
let erreurs = 0;
function section(cle, titre, lignes, { bloquant = false } = {}) {
  rapport.sections[cle] = { titre, total: lignes.length, bloquant, items: lignes };
  if (bloquant) erreurs += lignes.length;
  const marque = lignes.length === 0 ? 'OK ' : (bloquant ? 'ERR' : 'AVT');
  console.log(`\n[${marque}] ${titre} : ${lignes.length}`);
  const max = VERBOSE ? lignes.length : 15;
  lignes.slice(0, max).forEach(l => console.log('   - ' + l));
  if (lignes.length > max) console.log(`   … ${lignes.length - max} de plus (--verbose)`);
}

// ---------- 1. Références de médias ----------
const fichiers = SCAN.flatMap(s => walk(path.join(ROOT, s)))
  .filter(f => /\.(html|js|json|css)$/.test(f) && !IGNORER.test(rel(f)));
const RE_MEDIA = /(?:\.\.\/|\.\/|\/)?((?:images|audio|icons)\/[^"'`)\s?#<>\\]+?\.(?:jpe?g|png|webp|svg|gif|ico|mp3|ogg|wav|m4a|mp4|webm))/gi;
const refs = new Map(); // chemin -> Set(fichiers sources)
for (const f of fichiers) {
  // `galerie_a_creer` liste volontairement des photos qui n'existent pas encore : hors périmètre
  const txt = fs.readFileSync(f, 'utf8').replace(/"galerie_a_creer": \[[^\]]*\]/g, '');
  let m;
  while ((m = RE_MEDIA.exec(txt))) {
    if (m[1].includes('${')) continue; // chemin construit dynamiquement
    const p = decodeURIComponent(m[1]);
    if (!refs.has(p)) refs.set(p, new Set());
    refs.get(p).add(rel(f));
  }
}
// Audio des phrases : le chemin est construit à l'exécution (audio/<fichier>)
{
  const txt = fs.readFileSync(path.join(ROOT, 'data/phrases.js'), 'utf8');
  let m; const re = /audio:\s*["']([^"']+)["']/g;
  while ((m = re.exec(txt))) { const p = 'audio/' + m[1]; if (!refs.has(p)) refs.set(p, new Set()); refs.get(p).add('data/phrases.js'); }
}
const manquants = [...refs.keys()].filter(p => !fs.existsSync(path.join(ROOT, p))).sort();
section('medias_manquants', `Médias référencés mais absents (sur ${refs.size} références uniques)`,
  manquants.map(p => `${p}  ← ${[...refs.get(p)].join(', ')}`), { bloquant: true });

const surDisque = ['images', 'audio'].flatMap(d => walk(path.join(ROOT, d))).map(rel)
  .filter(p => /\.(jpe?g|png|webp|svg|gif|mp3|ogg|wav|m4a)$/i.test(p));
section('medias_inutilises', 'Médias présents sur le disque mais jamais référencés',
  surDisque.filter(p => !refs.has(p)).sort());

// ---------- 2. Coordonnées ----------
const L = loadLieux();
const desc = l => `#${l.id} ${l.nom} (${l.ville})`;
section('coords_hors_madagascar', 'Coordonnées absentes ou hors Madagascar',
  L.filter(l => !(l.lat >= BBOX.latMin && l.lat <= BBOX.latMax && l.lng >= BBOX.lngMin && l.lng <= BBOX.lngMax)).map(l => `${desc(l)} → ${l.lat}, ${l.lng}`),
  { bloquant: true });

const parVille = {};
L.forEach(l => (parVille[l.ville] = parVille[l.ville] || []).push(l));
const loin = [];
for (const [ville, ls] of Object.entries(parVille)) {
  if (ls.length < 3) continue;
  const c = { lat: mediane(ls.map(l => l.lat)), lng: mediane(ls.map(l => l.lng)) };
  ls.forEach(l => {
    const d = km(l, c);
    // Un lieu d'excursion assumé (champ `zone` + `depart_de`) n'est pas une anomalie.
    if (d > RAYON_VILLE_KM && !(l.zone && l.depart_de)) loin.push(`${desc(l)} → ${Math.round(d)} km de la médiane`);
  });
}
section('coords_loin_ville', `Lieux à plus de ${RAYON_VILLE_KM} km de la médiane de leur ville (hors excursions déclarées)`, loin);
const ZONES = ['antananarivo', 'antsiranana', 'nosybe', 'mahajanga', 'toamasina', 'fianarantsoa', 'toliara', 'saintemarie'];
section('zone_manquante', 'Lieux sans champ `zone` valide (absents des pages villes et des filtres de la carte)',
  L.filter(l => !ZONES.includes(l.zone)).map(desc));
section('coords_arrondies', 'Coordonnées arrondies à une décimale (position à ±5 km, à préciser)',
  L.filter(l => Number.isInteger(l.lat * 10) && Number.isInteger(l.lng * 10)).map(l => `${desc(l)} → ${l.lat}, ${l.lng}`));
const parCoord = {};
L.forEach(l => (parCoord[l.lat + ',' + l.lng] = parCoord[l.lat + ',' + l.lng] || []).push(l));
section('coords_identiques', 'Lieux différents posés exactement au même point',
  Object.entries(parCoord).filter(([, v]) => v.length > 1).map(([c, v]) => `${c} ← ${v.map(l => `#${l.id} ${l.nom}`).join(' | ')}`));
section('y_aller_incoherent', 'Lien « Y aller » dont les coordonnées diffèrent de lat/lng',
  L.filter(l => { const m = /query=(-?[\d.]+),(-?[\d.]+)$/.exec(l.y_aller || ''); if (m) return Math.abs(+m[1] - l.lat) > 1e-4 || Math.abs(+m[2] - l.lng) > 1e-4; return !/query=[^&]*Madagascar/.test(l.y_aller || ''); /* recherche par nom acceptée */ }).map(desc));

// ---------- 3. Types, doublons, ids ----------
const horsTaxo = {};
L.filter(l => !TAXONOMIE.includes(l.type)).forEach(l => (horsTaxo[l.type] = horsTaxo[l.type] || []).push(l.id));
section('types_non_normalises', `Types hors taxonomie (${TAXONOMIE.join(', ')})`,
  Object.entries(horsTaxo).map(([t, ids]) => `« ${t} » × ${ids.length} (ids ${ids.slice(0, 8).join(', ')}${ids.length > 8 ? '…' : ''})`), { bloquant: true });
section('type_categorie_divergents', 'Lieux dont `categorie` diffère de `type`', L.filter(l => l.categorie !== l.type).map(desc));

const CAT_TAGS = ['explorer', 'manger', 'dormir', 'sortir', 'spots'];
section('sans_tag_categorie', `Lieux sans tag de filtre (${CAT_TAGS.join('/')}) : invisibles dans les filtres`,
  L.filter(l => !(l.tags || []).some(t => CAT_TAGS.includes(t))).map(l => `${desc(l)} [${l.type}]`));
const niveau = n => n < 25000 ? 1 : n <= 80000 ? 2 : 3;
section('budget_incoherent', 'Tag budget incohérent avec le prix (€ < 25 000 Ar ≤ €€ ≤ 80 000 Ar < €€€)',
  L.filter(l => l.prixNum > 0 && !(l.tags || []).includes('budget_' + niveau(l.prixNum))).map(l => `${desc(l)} → ${l.prix}`));
section('contacts_fictifs', 'Fiches dont un bouton pointe vers « /contact » (page inexistante) ou vers le numéro WhatsApp d’exemple (boutons neutralisés à l’affichage)',
  L.filter(l => /"\/contact"|261340001234/.test(JSON.stringify(l.actions_principales || {}))).map(desc));
section('sans_tag_budget', 'Lieux sans tag budget_1/2/3', L.filter(l => !(l.tags || []).some(t => /^budget_[123]$/.test(t))).map(desc));

const idc = {}; L.forEach(l => (idc[l.id] = idc[l.id] || []).push(l.nom));
section('ids_dupliques', 'Ids dupliqués', Object.entries(idc).filter(([, v]) => v.length > 1).map(([k, v]) => `${k} : ${v.join(' | ')}`), { bloquant: true });

const nomc = {}; L.forEach(l => (nomc[slug(l.nom)] = nomc[slug(l.nom)] || []).push(l));
section('noms_dupliques', 'Noms identiques', Object.values(nomc).filter(v => v.length > 1).map(v => v.map(desc).join('  ==  ')));

// Quasi-doublons : même mot-clé distinctif + moins de 5 km
const VIDES = new Set(['hotel', 'restaurant', 'bar', 'parc', 'national', 'reserve', 'plage', 'le', 'la', 'les', 'de', 'du', 'des', 'chez', 'et', 'ile', 'nosy', 'lodge', 'club', 'beach', 'excursion', 'marche', 'grand', 'cafe', 'the', 'aux', 'en', 'a', 'd', 'l', 'resort', 'spa', 'baie', 'lac', 'village', 'palace', 'royal', 'ville', 'centre', 'sainte', 'marie', 'petit', 'petite', 'saint', 'point', 'vue', 'ex', 'new', 'bord', 'mer', 'sur', 'local', 'route', 'visite', 'tour', 'bateau', 'maison', 'jardin', 'place', 'mont', 'montagne', 'cascade', 'foret', 'port']);
const mots = l => new Set(slug(l.nom).split(' ').filter(w => w.length > 3 && !VIDES.has(w)));
const quasi = [];
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const a = L[i], b = L[j];
  if (slug(a.nom) === slug(b.nom)) continue;
  const commun = [...mots(a)].filter(w => mots(b).has(w));
  if (commun.length && km(a, b) < 5 && a.type === b.type) quasi.push(`${desc(a)}  ~  ${desc(b)}  [« ${commun.join(' ')} », ${km(a, b).toFixed(1)} km]`);
}
section('quasi_doublons', 'Doublons probables (mot-clé commun, même type, moins de 5 km)', quasi);

const villes = Object.keys(parVille);
section('villes', 'Villes distinctes (contrôle visuel des variantes)', villes.sort().map(v => `${v} × ${parVille[v].length}`));

// Circuits : chaque étape doit pointer vers une fiche existante
{
  const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data/itineraires.js'), 'utf8'))(w);
  const ids = new Set(L.map(l => l.id)), orphelins = [];
  (function parcours(o, circuit) {
    if (Array.isArray(o)) return o.forEach(x => parcours(x, circuit));
    if (o && typeof o === 'object') for (const k in o) { if (k === 'lieux_ids') o[k].filter(x => !ids.has(x)).forEach(x => orphelins.push(`${circuit} → lieu #${x} introuvable`)); else parcours(o[k], o.id && typeof o.id === 'string' ? o.id : circuit); }
  })(w.ITINERAIRES_DATA, '?');
  section('circuits_lieux_introuvables', 'Étapes de circuits pointant vers une fiche inexistante', orphelins, { bloquant: true });
}

section('non_confirmes', 'Lieux dont l’existence n’a pas pu être confirmée (pastille « À confirmer sur place »)',
  L.filter(l => l.verification && l.verification.statut === 'non_confirme').map(l => desc(l) + (l.verification.note ? ' — ' + l.verification.note : '')));
section('position_approx', 'Lieux à position approximative (signalée dans la fiche)', L.filter(l => l.position_approx).map(desc));
section('avis_generes', 'Fiches contenant encore des avis générés', L.filter(l => l.avis).map(desc), { bloquant: true });
{
  const parZone = {}; ZONES.forEach(z => parZone[z] = 0);
  L.filter(l => (l.tags || []).includes('spots')).forEach(l => parZone[l.zone]++);
  section('spots_par_destination', 'Destinations avec moins de 5 spots', Object.entries(parZone).filter(([, n]) => n < 5).map(([z, n]) => `${z} : ${n}`));
  console.log('   Spots par destination : ' + Object.entries(parZone).map(([z, n]) => `${z} ${n}`).join(', '));
}

// ---------- 4. Images des lieux ----------
const estPlaceholder = p => /placeholder/i.test(p || '');
section('lieux_sans_image', 'Lieux sans image', L.filter(l => !l.image).map(desc));
section('lieux_placeholder', 'Lieux avec image placeholder / provisoire',
  L.filter(l => l.image && (estPlaceholder(l.image) || l.image_provisoire)).map(l => `${desc(l)} → ${l.image}`));
section('lieux_image_absente', 'Lieux dont le fichier image (principale ou galerie) est absent',
  L.flatMap(l => [l.image, ...(l.galerie_photos || []).map(g => g.url)].filter(Boolean).filter(u => !/^https?:/.test(u) && !fs.existsSync(path.join(ROOT, u))).map(u => `${desc(l)} → ${u}`)),
  { bloquant: true });
section('galerie_alt_vide', 'Photos de galerie sans texte alternatif',
  L.filter(l => (l.galerie_photos || []).some(g => !g.alt || !String(g.alt).trim())).map(desc));

// ---------- 5. Images partagées / sans rapport ----------
const parImage = {};
L.filter(l => l.image && !estPlaceholder(l.image)).forEach(l => (parImage[l.image] = parImage[l.image] || []).push(l));
section('images_partagees', 'Images utilisées par plusieurs lieux différents',
  Object.entries(parImage).filter(([, v]) => v.length > 1).map(([img, v]) => `${img} ← ${v.map(l => `#${l.id} ${l.nom}`).join(' | ')}`));
const GENERIQUES = new Set(['hotel', 'restaurant', 'bar', 'spot', 'image', 'photo', 'jpg', 'png', 'webp', 'premium', 'main', 'vue', 'plage', 'parc', 'nosy', 'ile', 'les', 'des', 'the']);
section('images_sans_rapport', 'Images dont le nom de fichier ne partage aucun mot avec le nom ou la ville du lieu',
  L.filter(l => l.image && !estPlaceholder(l.image)).filter(l => {
    const f = new Set(slug(path.basename(l.image).replace(/\.\w+$/, '')).split(' ').filter(w => w.length > 2 && !GENERIQUES.has(w)));
    const n = slug(`${l.nom} ${l.ville}`).split(' ').filter(w => w.length > 2);
    return f.size > 0 && !n.some(w => [...f].some(x => x.includes(w) || w.includes(x)));
  }).map(l => `${desc(l)} → ${l.image}`));

// ---------- Synthèse ----------
console.log('\n================ SYNTHÈSE ================');
console.log(`Lieux : ${L.length} | Villes : ${villes.length} | Types distincts : ${new Set(L.map(l => l.type)).size}`);
Object.values(rapport.sections).forEach(s => console.log(`${String(s.total).padStart(4)}  ${s.bloquant && s.total ? '(bloquant) ' : ''}${s.titre.split(' (')[0]}`));
console.log(`\nErreurs bloquantes : ${erreurs}`);
rapport.total_lieux = L.length; rapport.erreurs_bloquantes = erreurs;
if (WRITE_JSON) {
  fs.writeFileSync(path.join(ROOT, 'data/audit_report.json'), JSON.stringify(rapport, null, 2) + '\n');
  console.log('→ data/audit_report.json mis à jour');
}
process.exit(erreurs ? 1 : 0);
