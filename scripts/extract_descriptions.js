const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.join(__dirname, '../data');

function loadBrowserDataFile(filename, variableName) {
    const filePath = path.join(DATA_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    try {
        vm.runInContext(content, sandbox);
        return sandbox.window[variableName];
    } catch (e) {
        console.error(`Error parsing ${filename}:`, e);
        return null;
    }
}

const lieux = loadBrowserDataFile('lieux.js', 'LIEUX_DATA');
const itineraires = loadBrowserDataFile('itineraires.js', 'ITINERAIRES_DATA');

const extraction = {
    lieux: lieux.map(l => ({ id: l.id, nom: l.nom, description: l.description })),
    itineraires: []
};

for (const [key, circuit] of Object.entries(itineraires)) {
    extraction.itineraires.push({
        id: circuit.id,
        nom: circuit.nom,
        description: circuit.description,
        type: 'circuit_main'
    });
    if (circuit.etapes) {
        circuit.etapes.forEach((e, idx) => {
            extraction.itineraires.push({
                circuit_id: circuit.id,
                etape_jour: e.jour,
                description: e.description,
                type: 'etape'
            });
        });
    }
}

fs.writeFileSync(path.join(DATA_DIR, '../temp_extraction.json'), JSON.stringify(extraction, null, 2));
console.log('Extraction complete to temp_extraction.json');
