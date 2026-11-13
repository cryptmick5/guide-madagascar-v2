#!/usr/bin/env node
/**
 * Passe de vérification du 13/11/2026 (à lancer une fois, après normaliser-donnees.js).
 * - supprime les avis générés (512 avis, 14 textes types) et les contacts fictifs (/contact, WhatsApp d'exemple)
 * - statut de vérification des établissements de Toamasina (recherche d'existence en ligne)
 * - spots : même définition partout (tag `spots`), 4 lieux réels ajoutés (Sainte-Marie, Nosy Be)
 * - positions corrigées pour deux sites naturels, positions approximatives signalées
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data/lieux.js'), 'utf8'))(w);
const L = w.LIEUX_DATA;
if (L.some(l => l.verification)) { console.error('Déjà appliqué.'); process.exit(1); }
const get = id => { const r = L.filter(l => l.id === id); if (r.length !== 1) throw new Error('id ' + id); return r[0]; };
const DATE = '2026-11-13';

// 1. Avis générés et contacts fictifs
let nAvis = 0, nCta = 0;
L.forEach(l => {
  if (l.avis) { nAvis += (l.avis.avis_recents || []).length; delete l.avis; }
  if (l._metadata && Array.isArray(l._metadata.features)) l._metadata.features = l._metadata.features.filter(f => f !== 'avis');
  const a = l.actions_principales;
  if (a) {
    if (a.cta_principal && a.cta_principal.url === '/contact') { delete a.cta_principal; nCta++; }
    if (a.cta_secondaire && (/261340001234/.test(a.cta_secondaire.url) || a.cta_secondaire.url === '/contact')) { delete a.cta_secondaire; nCta++; }
  }
  // lien « site web » qui ne mène qu'à la page d'accueil d'un réseau social : inutile
  if (/^https?:\/\/(www\.)?(facebook|tripadvisor)\.(com|fr)\/?$/.test(l.siteWeb || '')) delete l.siteWeb;
});

// 2. Établissements de Toamasina : existence recherchée en ligne (fiche d'établissement trouvée ou non)
const CONFIRMES = [656, 646, 692, 654, 660, 647, 648, 649, 650, 651, 652, 653, 655, 657, 661, 662, 663, 664, 666, 667, 668, 669, 691, 696, 697, 698, 699, 700, 681, 673, 694, 671, 674];
const NON_CONFIRMES = [693, 676, 670, 688, 644, 659, 665, 658, 641, 642, 643, 645, 679, 680, 695, 677];
const ETABLISSEMENT = ['Hôtel', 'Restaurant', 'Bar & Sortir'];
CONFIRMES.forEach(id => {
  const l = get(id);
  l.verification = { statut: 'confirme', date: DATE };
  if (ETABLISSEMENT.includes(l.type)) {
    // Les coordonnées de ce lot étaient génériques (regroupées au centre-ville) : le lien « Y aller »
    // cherche l'établissement par son nom, le marqueur reste indicatif.
    l.position_approx = true;
    l.y_aller = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${l.nom.split(' - ')[0]}, Toamasina, Madagascar`);
  }
});
NON_CONFIRMES.forEach(id => { const l = get(id); l.verification = { statut: 'non_confirme', date: DATE }; l.position_approx = true; });
get(652).verification.note = 'Restaurant de l’hôtel Anjara ; un avis en ligne indique qu’il n’existe plus sous cette forme.';
get(677).verification.note = 'Un « Ampasinambo Agro camping » existe à Fanandrana, à une vingtaine de km de la ville ; le « verger » décrit ici n’a pas été retrouvé.';
get(688).verification.note = 'Aucun jardin de ce nom trouvé à Toamasina (un « Eden Botanical Garden » existe à Toliara).';

// 3. Positions de sites naturels (repères géographiques recoupés)
const pos = (id, lat, lng) => { const l = get(id); l.lat = lat; l.lng = lng; l.y_aller = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`; if (l.carte_interactive) { l.carte_interactive.latitude = lat; l.carte_interactive.longitude = lng; } };
pos(674, -18.05, 49.46);   // Île aux Prunes (Nosy Alanana), au nord-est du port
pos(671, -18.06, 49.36);   // Parc Ivoloina, à une douzaine de km au nord de la ville
L.filter(l => Number.isInteger(l.lat * 10) && Number.isInteger(l.lng * 10)).forEach(l => { l.position_approx = true; });

// 4. Spots : une seule définition (tag `spots`). Sainte-Marie n'en avait qu'un.
[806, 807].forEach(id => { const l = get(id); if (!l.tags.includes('spots')) l.tags.push('spots'); }); // piscines naturelles d'Ambodiatafana, cascade d'Antanandava
const modele = get(805);
let nextId = 820;
function nouveauSpot({ nom, ville, zone, lat, lng, description, conseil, acces, duree, tags, sources, depart_de }) {
  const l = JSON.parse(JSON.stringify(modele));
  ['alias', 'fusion_de', 'siteWeb', 'contactLocal', 'spotLocal', 'humour_grok', 'respect', 'galerie_a_creer', 'ville_alias', 'depart_de'].forEach(k => delete l[k]);
  Object.assign(l, {
    id: nextId++, nom, ville, zone, lat, lng, type: 'Spot Local', categorie: 'Spot Local', sous_type: 'Spot Local',
    description, description_summary: description.split('\n')[0], has_expandable_description: false,
    conseil, acces, duree, duration: duree, horaires: 'En journée',
    prix: 'Selon guide ou piroguier', price: 'Selon guide ou piroguier', prixNum: 0, prixEur: '',
    tags: ['Spot Local', ...tags, 'spots', 'explorer', 'budget_1', 'secret_spot'],
    image: 'images/placeholder-spot.jpg', image_provisoire: true,
    galerie_photos: [{ url: 'images/placeholder-spot.jpg', alt: `${nom}, ${ville} (photo provisoire)`, type: 'principale' }], hasCarousel: false,
    y_aller: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nom + ', ' + ville + ', Madagascar')}`,
    position_approx: true, sources, verification: { statut: 'confirme', date: DATE, note: 'Lieu attesté par les sources citées ; prix, horaires et position exacte à préciser sur place.' },
    actions_principales: { type_lieu: 'general' }
  });
  if (depart_de) l.depart_de = depart_de;
  delete l.note; delete l.rating; // pas de note tant que personne ne l'a visité pour le guide
  if (l.carte_interactive) { l.carte_interactive.latitude = lat; l.carte_interactive.longitude = lng; }
  if (l.infos_pratiques) l.infos_pratiques = { a_prevoir: { equipement: ['Eau', 'Protection solaire', 'Espèces (pas de distributeur sur place)'], conseils: conseil } };
  L.push(l);
}
nouveauSpot({
  nom: 'Île aux Forbans', ville: 'Sainte-Marie', zone: 'saintemarie', lat: -17.006, lng: 49.855, tags: ['saintemarie', 'culture'], duree: '1h à 2h',
  description: 'Un îlot au milieu de la baie d’Ambodifotatra, ancien repaire des pirates qui venaient s’y partager leur butin aux XVIIe et XVIIIe siècles.\n\nOn y accède en pirogue depuis Ambodifotatra, et la visite se combine naturellement avec celle du cimetière des pirates, d’où l’on aperçoit l’îlot.',
  conseil: 'Négociez la pirogue aller-retour avant d’embarquer et combinez avec le cimetière des pirates.', acces: 'Pirogue depuis Ambodifotatra.',
  sources: ['https://www.routard.com/fr/guide/afrique/madagascar/tamatave-toamasina-et-sa-region/ile-sainte-marie-nosy-boraha/ambodifotatra']
});
nouveauSpot({
  nom: 'Baie d’Ampanihy', ville: 'Sainte-Marie', zone: 'saintemarie', lat: -16.87, lng: 49.93, tags: ['saintemarie', 'nature'], duree: 'Une journée',
  description: 'Sur la côte est de l’île, une baie bordée de mangrove qui se découvre en pirogue, loin des hôtels de la côte ouest.\n\nDes tortues marines viennent parfois pondre sur la plage voisine.',
  conseil: 'Partez tôt : la piste qui traverse l’île est lente, et la balade en pirogue dépend de la marée.', acces: 'Piste depuis la côte ouest, puis pirogue dans la mangrove.',
  sources: ['https://madagascartravel.com/guide-madagascar/destination/sainte-marie']
});
nouveauSpot({
  nom: 'Village de Marodoka', ville: 'Nosy Be', zone: 'nosybe', lat: -13.405, lng: 48.3, tags: ['nosybe', 'culture'], duree: '1h à 2h',
  description: 'Le premier village de Nosy Be, ancien comptoir swahili à quelques kilomètres du centre, non loin de la réserve de Lokobe.\n\nUn circuit à pied passe par la « maison des fantômes », l’ancien port et les tombes indiennes, dont l’une porte la date de 1850.',
  conseil: 'Faites la visite avec un guide du village : c’est lui qui raconte les histoires derrière les ruines.', acces: 'Quelques kilomètres à l’est de Hell-Ville, en tuk-tuk ou taxi.',
  sources: ['https://nosybe-tourisme.com/?p=11993', 'https://madagascartravel.com/guide-madagascar/destination/nosy-be']
});
nouveauSpot({
  nom: 'Cascade d’Androadroatra', ville: 'Nosy Be', zone: 'nosybe', lat: -13.33, lng: 48.25, tags: ['nosybe', 'nature'], duree: '2h',
  description: 'Une cascade peu connue, y compris des Malgaches, au bout d’une balade agréable depuis un petit village de l’île.\n\nLa meilleure période va d’avril à novembre.',
  conseil: 'Demandez un guide au village : le sentier n’est pas balisé. Position sur la carte indicative.', acces: 'À pied depuis le village d’Androadroatra.',
  sources: ['https://www.primemedia.international/madagascar-destinations-guide-androadroatra-waterfall.html']
});

fs.writeFileSync(path.join(ROOT, 'data/lieux.js'), 'window.LIEUX_DATA = ' + JSON.stringify(L, null, 2) + ';');
const z = {}; L.filter(l => l.tags.includes('spots')).forEach(l => z[l.zone] = (z[l.zone] || 0) + 1);
console.log(`OK : ${L.length} lieux | ${nAvis} avis générés supprimés | ${nCta} boutons fictifs supprimés | confirmés ${CONFIRMES.length}, non confirmés ${NON_CONFIRMES.length} | spots par zone`, z);
