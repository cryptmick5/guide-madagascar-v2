const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ ERREUR : La variable d'environnement GEMINI_API_KEY n'est pas définie.");
    console.error("👉 Usage : set GEMINI_API_KEY=votre_cle && node scripts/rewrite_content.js");
    process.exit(1);
}

const GEN_AI = new GoogleGenerativeAI(API_KEY);
const MODEL = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(__dirname, '../data_rewrite_v4.json');

// --- SYSTEM PROMPT ---
const SYSTEM_PROMPT = `
RÔLE : Tu es l'auteur de "Gasikara Explorer". Tu es un guide malgache qui initie ses amis étrangers à la vraie vie locale.

RÈGLE D'OR : **L'IMMERSION PÉDAGOGIQUE**
Tu dois utiliser les termes locaux (c'est ton identité), mais tu dois TOUJOURS les expliquer subtilement pour que le touriste comprenne et apprenne.

COMMENT GÉRER LE VOCABULAIRE :
1.  **Bajaj :** N'utilise pas juste "Tuk-tuk". Utilise **"Bajaj"** mais précise ce que c'est.
    * *Mauvais :* "Prends un Bajaj pour y aller." (Le touriste ne comprend pas).
    * *Bon :* "Saute dans un **Bajaj** (ces fameux tuk-tuks jaunes) pour y aller."
2.  **Taxi-Brousse :** Parle de **"Taxi-brousse"** ou de **"Cotisse"** (pour le premium), mais explique l'ambiance.
3.  **Expressions :** Place un petit "Mora Mora" (doucement) ou "Tsara" (bien/beau) si le contexte s'y prête, avec la traduction entre parenthèses.

STYLE GÉNÉRAL :
* Ton : Connivent, sensoriel (odeurs, bruits) et honnête.
* Interdit : Les mots clichés ("écrin", "havre de paix").
* Format : Accroche + 3 Points clés (Emojis) + Conclusion.

SÉCURITÉ ANTI-HALLUCINATION :
* Base-toi UNIQUEMENT sur les faits du texte original. N'invente jamais d'équipements (Wifi, Piscine) s'ils ne sont pas cités.

EXEMPLE (Few-Shot) :
🔴 Original : "Il y a beaucoup de tuk-tuks en ville."
🟢 Résultat : "Ici, les rois de la route, ce sont les **Bajajs** 🛺 ! Ces petits tuk-tuks jaunes se faufilent partout. C'est le moyen idéal pour découvrir la ville à la malgache : cheveux au vent et musique à fond !"
`;

// --- HELPERS ---

// Fonction pour charger les fichiers JS "browser-side" dans Node
function loadBrowserDataFile(filename, variableName) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier introuvable : ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');

    // Sandbox pour émuler 'window'
    const sandbox = { window: {} };
    vm.createContext(sandbox);

    try {
        vm.runInContext(content, sandbox);
        return sandbox.window[variableName];
    } catch (e) {
        console.error(`Erreur lors du parsing de ${filename}:`, e);
        return null;
    }
}

// Fonction pour appeler Gemini
async function rewriteDescription(originalText, contextInfo) {
    if (!originalText || originalText.length < 10) return originalText; // Ignorer les textes trop courts

    console.log(`🤖 Réécriture : ${contextInfo}...`);

    try {
        const result = await MODEL.generateContent({
            contents: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n--- TEXTE À RÉÉCRIRE ---\n" + originalText }] }
            ]
        });
        const response = result.response;
        return response.text().trim();
    } catch (error) {
        console.error(`❌ Erreur Gemini pour ${contextInfo}:`, error.message);
        return originalText; // Fallback sur l'original en cas d'erreur
    }
}

// --- MAIN ---
async function main() {
    console.log("🚀 Démarrage de la migration de contenu via Gemini...");

    // 1. Charger les données
    console.log("📂 Chargement des données...");
    const lieux = loadBrowserDataFile('lieux.js', 'LIEUX_DATA');
    const itineraires = loadBrowserDataFile('itineraires.js', 'ITINERAIRES_DATA');

    if (!lieux || !itineraires) {
        console.error("❌ Impossible de charger les données source.");
        return;
    }

    const outputData = {
        lieux: [],
        itineraires: {}
    };

    // 2. Traiter les LIEUX
    console.log(`\n🌍 Traitement de ${lieux.length} lieux...`);
    for (let i = 0; i < lieux.length; i++) {
        const lieu = lieux[i];
        const newLieu = { ...lieu }; // Copie superficielle

        if (lieu.description) {
            newLieu.description = await rewriteDescription(lieu.description, `Lieu: ${lieu.nom}`);
            // Petit délai pour éviter le rate-limiting si nécessaire (ajuster selon quota)
            // await new Promise(r => setTimeout(r, 1000)); 
        }
        outputData.lieux.push(newLieu);
    }

    // 3. Traiter les ITINÉRAIRES
    console.log(`\n🗺️ Traitement des circuits...`);
    for (const [key, circuit] of Object.entries(itineraires)) {
        console.log(`   > Circuit : ${circuit.nom}`);
        const newCircuit = { ...circuit };

        // Description principale du circuit
        if (circuit.description) {
            newCircuit.description = await rewriteDescription(circuit.description, `Circuit Main: ${circuit.nom}`);
        }

        // Description des étapes
        if (newCircuit.etapes && Array.isArray(newCircuit.etapes)) {
            for (let j = 0; j < newCircuit.etapes.length; j++) {
                const etape = newCircuit.etapes[j];
                if (etape.description) {
                    etape.description = await rewriteDescription(etape.description, `Circuit ${circuit.nom} - Étape ${etape.jour}`);
                }
            }
        }
        outputData.itineraires[key] = newCircuit;
    }

    // 4. Sauvegarder
    console.log(`\n💾 Sauvegarde dans ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log("✅ Terminé !");
}

main().catch(console.error);
