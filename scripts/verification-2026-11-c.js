#!/usr/bin/env node
/** Troisième passe (13/11/2026) : recherches complémentaires sur les établissements non confirmés. À lancer une fois. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data/lieux.js'), 'utf8'))(w);
const L = w.LIEUX_DATA;
const get = id => { const r = L.filter(l => l.id === id); if (r.length !== 1) throw new Error('id ' + id); return r[0]; };
if (get(214).verification.statut === 'confirme') { console.error('Déjà appliqué.'); process.exit(1); }
const DATE = '2026-11-13';
// Retrouvés
Object.assign(get(214), { verification: { statut: 'confirme', date: DATE, note: 'Référencé « Cacao Beach by Loulou » (ou « Chez Loulou »), plage d’Andilana.' }, sources: ['https://wanderlog.com/place/details/2801706/cacao-beach-chez-loulou'] });
get(214).alias = [...new Set([...(get(214).alias || []), 'Chez Loulou', 'Cacao Beach by Loulou'])];
delete get(214).position_approx;
Object.assign(get(693), { verification: { statut: 'confirme', date: DATE, note: 'Référencé « Queens Club » par Lonely Planet (club du centre-ville, dans une ancienne maison à véranda) ; l’adresse et l’ambiance « premium » décrites ici ne sont pas confirmées.' }, sources: ['https://www.lonelyplanet.com/madagascar/eastern-madagascar/toamasina-tamatave/nightlife'] });
// Toujours introuvables : note sur ce qui existe réellement à proximité
get(409).verification.note = 'Aucun restaurant « Le Vezo » trouvé à Anakao ; les guides citent Longo Vezo, Safari Vezo et Chez Émile.';
get(415).verification.note = 'Introuvable en ligne ; les guides citent le Zaza Club et le Tam Tam Café pour sortir à Tuléar.';
get(419).verification.note = 'Introuvable en ligne ; un « Bamboo Club Bar » est référencé à Mangily.';
get(530).verification.note = 'Introuvable en ligne sous ce nom.';
get(311).verification.note = 'Introuvable en ligne sous ce nom.';
fs.writeFileSync(path.join(ROOT, 'data/lieux.js'), 'window.LIEUX_DATA = ' + JSON.stringify(L, null, 2) + ';');
console.log('OK', L.filter(l => l.verification && l.verification.statut === 'non_confirme').length, 'non confirmés restants');
