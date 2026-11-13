#!/usr/bin/env node
/** Régénère scripts/images-a-creer.md depuis data/lieux.js : node scripts/generer-liste-images.js */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data/lieux.js'), 'utf8'))(w); const L = w.LIEUX_DATA;
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const AMB = { 'Hôtel': 'façade ou piscine d’un hôtel tropical, lumière dorée de fin de journée', 'Restaurant': 'table dressée en terrasse, cuisine malgache (poisson grillé, riz, achards), ambiance chaleureuse', 'Bar & Sortir': 'bar tropical en soirée, guirlandes lumineuses, comptoir en bois, sans client reconnaissable', 'Nature': 'paysage naturel, végétation tropicale, lumière du matin', 'Plage': 'plage de sable clair, cocotiers, lagon turquoise', 'Culture': 'scène de rue ou bâtiment patrimonial, couleurs chaudes', 'Spot Local': 'lieu confidentiel vu à hauteur d’homme, ambiance authentique', 'Incontournable': 'vue large et spectaculaire, ciel dégagé', 'Excursion': 'bateau ou sentier d’excursion, vue d’ensemble', 'Ville': 'vue d’ensemble de la ville' };
const DOS = { 'Hôtel': 'hotels', 'Restaurant': 'restaurants', 'Bar & Sortir': 'nightlife' };
const prompt = (sujet, ville, type) => `Photo réaliste, style reportage de voyage : ${sujet}, ${ville}, Madagascar. ${AMB[type] || AMB.Nature}. Aucune personne identifiable, aucun texte, logo ni filigrane. Ratio 4:3, 1600 × 1200 px.`;
let md = `# Images à créer ou à remplacer

Liste régénérée le ${new Date().toISOString().slice(0, 10)} (\`node scripts/generer-liste-images.js\`). Aucune photo n'a été récupérée ni générée à ce stade.

**Avant de générer.** Pour un établissement réel (hôtel, restaurant, bar), une image générée par IA n'est pas une photo du lieu : à présenter comme « illustration », ou mieux, à remplacer par une vraie photo (la vôtre, celle de l'établissement avec son accord, ou une photo sous licence libre avec le champ \`credit\` renseigné). Les prompts conviennent sans réserve aux paysages et aux ambiances génériques.

Une fois le fichier déposé : dans \`data/lieux.js\`, mettre le chemin dans \`image\` et \`galerie_photos\`, supprimer \`image_provisoire\` (ou l'entrée de \`galerie_a_creer\`), puis lancer \`node scripts/audit.js\`.

## 1. Photos de galerie attendues mais absentes

| Fichier attendu | Lieu | Prompt |
|---|---|---|
`;
L.filter(l => l.galerie_a_creer).forEach(l => l.galerie_a_creer.forEach(f => { md += `| \`${f}\` | #${l.id} ${l.nom} | ${prompt(`${l.nom} (${path.basename(f, '.jpg').replace(/-/g, ' ')})`, l.ville, l.type)} |\n`; }));
const prov = L.filter(l => l.image_provisoire);
md += `\n## 2. Lieux affichés avec une image provisoire (${prov.length})\n\n| Lieu | Ville | Type | Fichier proposé | Prompt |\n|---|---|---|---|---|\n`;
prov.forEach(l => { md += `| #${l.id} ${l.nom} | ${l.ville} | ${l.type} | \`images/${DOS[l.type] || 'spots'}/${slug(l.ville)}-${slug(l.nom).slice(0, 40)}.jpg\` | ${prompt(l.nom, l.ville, l.type)} |\n`; });
md += `\n## 3. Photos existantes à remplacer\n\n| Fichier | Problème |\n|---|---|\n| \`images/villes/diego-suarez.jpg\` | filigrane d'une banque d'images (Alamy) |\n| \`images/iles/nosy-komba.jpg\` | filigrane « nosykomba.com » |\n| \`images/toliara/toliara_saint_augustin.png\` | montre une ville des Hautes Terres, pas la baie de Saint-Augustin |\n| \`images/circuits/circuit-cacao.jpg\` | utilisée pour 4 restaurants de Sainte-Marie sans rapport avec le cacao |\n| \`images/logo/favicon.png\` | porte le nom « Jewel of Madagascar » |\n`;
fs.writeFileSync(path.join(__dirname, 'images-a-creer.md'), md);
console.log(`images-a-creer.md : ${prov.length} lieux en image provisoire`);
