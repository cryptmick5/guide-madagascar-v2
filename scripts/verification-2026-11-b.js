#!/usr/bin/env node
/**
 * Seconde passe de vérification du 13/11/2026 (à lancer une fois, après verification-2026-11.js).
 * - existence recherchée en ligne pour les établissements douteux hors Toamasina
 * - tags de filtre nettoyés (un bar d'hôtel n'est pas un endroit où dormir, un restaurant n'est pas « à explorer »)
 * - dernières fusions : front de mer de Mahajanga saisi deux fois ; Ankarana renommé en parc national
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data/lieux.js'), 'utf8'))(w);
const L = w.LIEUX_DATA;
const get = id => { const r = L.filter(l => l.id === id); if (r.length !== 1) throw new Error('id ' + id); return r[0]; };
if (get(104).verification) { console.error('Déjà appliqué.'); process.exit(1); }
const DATE = '2026-11-13';

// 1. Établissements retrouvés dans des guides ou annuaires en ligne (Lonely Planet, Petit Futé, Booking, Wanderlog, Trip.com…)
const CONFIRMES = [104, 105, 106, 101,            // Diego : Taxi Be, La Bodega, Nouvel Hôtel, Suarez Hotel
  520, 523, 518, 528, 524,                        // Tana : Nerone, Sakamanga, Kudeta, La Teinturerie, Citizen
  27, 620, 207, 208, 209, 211, 212, 213, 202,     // Nosy Be : L'Heure Bleue, Papillon, Karibo, Pily Pily, Djembe, L'Apero, Beach Klub, Vanila
  502, 503, 505, 508, 511, 512, 513, 514,         // Mahajanga : Le Guest, Coco Lodge, Baobab Tree, Roches Rouges, Club 73, Zebulon, Bar de la Marine, Cotton Club
  305, 306, 307, 308, 309, 310, 321, 322, 323];   // Fianar : Ancre d'Or, Tsara Guest House, La Rizière, Panda, Zomatel, La Chaud'hier, Cotsoyannis, Villa Sylvestre
const NON_CONFIRMES = [802, 527, 530, 210, 214, 215, 311, 415, 419, 409];
CONFIRMES.forEach(id => { get(id).verification = { statut: 'confirme', date: DATE }; });
NON_CONFIRMES.forEach(id => { get(id).verification = { statut: 'non_confirme', date: DATE }; });
get(106).verification.note = 'Référencé en ligne sous le nom « Le Fun (ex Nouvel Hôtel) », 75 rue Colbert.';
get(106).alias = [...new Set([...(get(106).alias || []), 'Le Fun'])];
get(802).verification.note = 'Aucun « Gîte du Voyageur » trouvé à Diego ; il existe un hôtel « La Terrasse du Voyageur ».';
get(215).verification.note = 'Un « Safari Bar Restaurant » existe à Ambatoloaka ; le nom « Safari Ambaro » n’a pas été retrouvé.';
get(27).alias = [...new Set([...(get(27).alias || []), 'Le Deck de l’Heure Bleue'])];

// 2. Front de mer de Mahajanga : même lieu saisi deux fois (#34 et #626, mêmes coordonnées)
const journal = JSON.parse(fs.readFileSync(path.join(__dirname, 'fusions-log.json'), 'utf8'));
{
  const garde = get(34), a = get(626);
  journal.fusions.push({ garde: { id: 34, nom: garde.nom }, absorbe: { id: 626, nom: a.nom }, raison: 'même front de mer, mêmes coordonnées', fiche_absorbee: JSON.parse(JSON.stringify(a)) });
  garde.alias = [...new Set([...(garde.alias || []), a.nom, 'Bord de mer de Majunga'])];
  garde.fusion_de = [...(garde.fusion_de || []), 626];
  if (!garde.tags.includes('sortir')) garde.tags.push('sortir'); // brochettes et ambiance du soir
  L.splice(L.indexOf(a), 1);
}
// 3. Ankarana : parc national (ancien nom conservé en alias de recherche)
{
  const l = get(50);
  l.alias = [...new Set([...(l.alias || []), l.nom])];
  l.nom = 'Parc National de l’Ankarana';
  l.galerie_photos.forEach(g => { if (g.type === 'principale') g.alt = `${l.nom}, ${l.ville}`; });
}

// 4. Tags de filtre
const ETAB = ['Hôtel', 'Restaurant', 'Bar & Sortir'];
let nExp = 0;
L.forEach(l => { if (ETAB.includes(l.type) && l.tags.includes('explorer')) { l.tags = l.tags.filter(t => t !== 'explorer'); nExp++; } l.tags = [...new Set(l.tags)]; });
[106, 312, 313, 314, 416, 309].forEach(id => { const l = get(id); l.tags = l.tags.filter(t => t !== 'dormir'); });

fs.writeFileSync(path.join(ROOT, 'data/lieux.js'), 'window.LIEUX_DATA = ' + JSON.stringify(L, null, 2) + ';');
fs.writeFileSync(path.join(__dirname, 'fusions-log.json'), JSON.stringify(journal, null, 2) + '\n');
console.log(`OK : ${L.length} lieux | +${CONFIRMES.length} confirmés, +${NON_CONFIRMES.length} non confirmés | ${nExp} tags « explorer » retirés d'établissements`);
