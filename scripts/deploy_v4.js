const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const V4_DATA_FILE = path.join(__dirname, '../data_rewrite_v4.json');
const LIEUX_FILE = path.join(DATA_DIR, 'lieux.js');
const ITINERAIRES_FILE = path.join(DATA_DIR, 'itineraires.js');

// Backup Function
function backupFile(filePath) {
    if (fs.existsSync(filePath)) {
        const backupPath = filePath.replace('.js', `_backup_${Date.now()}.js`);
        fs.copyFileSync(filePath, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);
    }
}

async function deploy() {
    console.log("🚀 Deploying V4 Data to application...");

    if (!fs.existsSync(V4_DATA_FILE)) {
        console.error("❌ Error: data_rewrite_v4.json not found!");
        process.exit(1);
    }

    const v4Data = JSON.parse(fs.readFileSync(V4_DATA_FILE, 'utf8'));

    // 1. Deploy Lieux
    console.log("📦 Updating lieux.js...");
    backupFile(LIEUX_FILE);
    const lieuxContent = `window.LIEUX_DATA = ${JSON.stringify(v4Data.lieux, null, 2)};`;
    fs.writeFileSync(LIEUX_FILE, lieuxContent);

    // 2. Deploy Itineraires
    console.log("📦 Updating itineraires.js...");
    backupFile(ITINERAIRES_FILE);
    const itinerairesContent = `window.ITINERAIRES_DATA = ${JSON.stringify(v4Data.itineraires, null, 2)};`;
    fs.writeFileSync(ITINERAIRES_FILE, itinerairesContent);

    console.log("🎉 Deployment complete! Refresh your browser.");
}

deploy();
