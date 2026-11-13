#!/usr/bin/env node
/** Quatrième passe (13/11/2026) : recherche approfondie, fiche par fiche, sur les 24 lieux restés « non confirmés ». À lancer une fois. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data/lieux.js'), 'utf8'))(w);
const L = w.LIEUX_DATA;
const get = id => { const r = L.filter(l => l.id === id); if (r.length !== 1) throw new Error('id ' + id); return r[0]; };
if (get(530).verification.statut === 'confirme') { console.error('Déjà appliqué.'); process.exit(1); }
const DATE = '2026-11-13';
const ok = (id, note, sources) => { const l = get(id); l.verification = { statut: 'confirme', date: DATE, ...(note ? { note } : {}) }; l.sources = sources; };
const ko = (id, note) => { get(id).verification = { statut: 'non_confirme', date: DATE, note }; };

// Retrouvés
ok(530, 'Bar-restaurant et cabaret à Behoririka, inscrit à l’annuaire du ministère du Tourisme.', ['https://annuaire.tourisme.gov.mg/etablissement-de-restauration/piment-cafe', 'https://www.facebook.com/pimscafe/']);
ok(527, 'Discothèque « Taxi Be Tana », Lot IVG 205 Antanimena, ouverte en 2018.', ['https://www.petitfute.com/v42539-tana-antananarivo/c1169-s-amuser-sortir/c1045-club-discotheque/c214-club-discotheque/1749608-taxi-be-tana.html']);
ok(311, 'Bar référencé par le Petit Futé à Ampasambazaha.', ['https://www.petitfute.com/v57492-fianarantsoa/c1169-s-amuser-sortir/']);
ok(670, 'Chambre d’hôtes à Ivoloina, au nord de la ville (3 chambres) : « simple et conviviale » d’après les annuaires, pas « exclusive ».', ['https://www.petitfute.com/v57563-tamatave-toamasina/c1166-hebergement/c151-chambre-d-hotes/1555405-la-case-a-ianou.html']);
ok(676, 'Éco-site à 30 km au sud de Toamasina par la RN2.', ['https://discovery-tours-toamasina.com/tamatave-et-ses-environs/']);
ok(665, 'Chambres d’hôtes rue Victor Hugo.', ['https://www.petitfute.com/v57563-tamatave-toamasina/c1166-hebergement/c151-chambre-d-hotes/678697-residence-magali.html']);
ok(658, 'Chambres d’hôtes à Salazamay Nord (6 chambres).', ['https://www.petitfute.com/v57563-tamatave-toamasina/c1166-hebergement/c151-chambre-d-hotes/634266-chambres-d-hotes-evasion.html']);
ok(659, 'Un hébergement « Lalao » existe au 71 boulevard Joffre : c’est un appartement meublé, pas la « pension avec jardin fleuri » décrite ici.', ['https://www.booking.com/hotel/mg/lalao.html']);
ok(695, 'Bar-restaurant « La Terrasse », boulevard Joffre : une brasserie de centre-ville, pas un « lounge panoramique avec vue sur l’océan ».', ['https://www.madadecouverte.com/tamatave-madagascar/laterrasse-prestataires-detail_type_etablissement-reg.htm']);
[670, 676, 665, 658, 659, 695].forEach(id => { get(id).position_approx = true; });
get(527).alias = [...new Set([...(get(527).alias || []), 'Taxi Be Tana', 'Taxi Be Tananarive'])];

// Toujours introuvables après recherche approfondie
ko(210, 'Aucun « Bar de la Plage » trouvé ; il s’agit probablement du « Beach Bar Restaurant » d’Ambatoloaka, bien référencé.');
ko(215, 'Introuvable. Le restaurant italien de la plage d’Ambaro s’appelle « Sambatra Beach » ; « Le Safari » est à Ambatoloaka.');
ko(802, 'Aucun « Gîte du Voyageur » à Diego ; l’adresse des petits budgets s’appelle « La Terrasse du Voyageur » (angle rue du Mozambique et Justin Bezara).');
ko(409, 'Aucun restaurant « Le Vezo » à Anakao ; les guides citent Longo Vezo, Safari Vezo, Chez Émile et Chez Lulu.');
ko(415, 'Introuvable sous aucune orthographe ; pour sortir à Tuléar, les sources citent le Zaza Club et le Tam Tam Café.');
ko(419, 'Introuvable ; à Mangily les sources citent Chez Freddy et le Pata-Pata Bar.');
ko(677, 'Aucun verger de ce nom près de Toamasina. Ampasinambo est une commune du district de Nosy Varika, à plusieurs centaines de km.');
ko(679, 'Aucun îlot de ce nom face au port. Les « îlots aux Sables » des guides sont à Sainte-Marie.');
ko(680, 'Cité par un seul site, dont la description (parc de 20 hectares avec lac et pédalos en centre-ville) n’est reprise par aucun guide.');
ko(688, 'Cité par le même site unique que le « Randrianasolo Park » ; aucun guide ne le mentionne. Le Jardin d’Éden connu est à La Réunion.');
[641, 642, 643, 644, 645].forEach(id => ko(id, 'Appellation générique : aucune enseigne de ce nom trouvée. Les gargotes du marché et les brochettes du bord de mer existent bien, mais pas comme établissement identifiable.'));

fs.writeFileSync(path.join(ROOT, 'data/lieux.js'), 'window.LIEUX_DATA = ' + JSON.stringify(L, null, 2) + ';');
const nc = L.filter(l => l.verification && l.verification.statut === 'non_confirme');
console.log('OK', nc.length, 'non confirmés :', nc.map(l => l.nom).join(' | '));
