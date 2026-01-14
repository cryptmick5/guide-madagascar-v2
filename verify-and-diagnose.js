const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    NC: '\x1b[0m'
};

let errors = 0;

function log(msg, color = COLORS.NC) {
    console.log(`${color}${msg}${COLORS.NC}`);
}

function header(msg) {
    console.log(`\n${COLORS.BLUE}${msg}${COLORS.NC}`);
}

console.log("🔍 VÉRIFICATION ENVIRONNEMENT GASIKARA V2 (Node.js)");
console.log("==========================================");

// --- STEP 1: Git Remote ---
header("1️⃣  Vérification Git Remote...");
try {
    const remote = execSync('git remote get-url origin').toString().trim();
    if (remote.includes('guide-madagascar-v2')) {
        log(`✓ Repository correct: guide-madagascar-v2`, COLORS.GREEN);
    } else {
        log(`✗ ERREUR: Repository incorrect ou absent`, COLORS.RED);
        console.log(`  Remote trouvé: ${remote}`);
        errors++;
    }
} catch (e) {
    log(`✗ ERREUR verification git: ${e.message}`, COLORS.RED);
    errors++;
}

// --- STEP 2: Git Branch ---
header("2️⃣  Vérification branche Git...");
try {
    const branch = execSync('git branch --show-current').toString().trim();
    if (!branch) {
        log(`⚠ Pas de branche Git active`, COLORS.YELLOW);
    } else {
        log(`✓ Branche active: ${branch}`, COLORS.GREEN);
        if (branch === 'main' || branch === 'master') {
            log(`⚠ Tu es sur la branche principale`, COLORS.YELLOW);
        }
    }
} catch (e) {
    log(`⚠ Erreur branche`, COLORS.YELLOW);
}

// --- STEP 3: Localhost ---
header("3️⃣  Vérification serveur local...");
const req = http.request({
    hostname: 'localhost',
    port: 8081,
    path: '/',
    method: 'HEAD'
}, (res) => {
    if (res.statusCode === 200) {
        log(`✓ Serveur accessible: http://localhost:8081/`, COLORS.GREEN);
    } else {
        log(`✗ ERREUR: Code ${res.statusCode}`, COLORS.RED);
        errors++;
    }
    continueChecks();
});

req.on('error', (e) => {
    log(`✗ ERREUR: Serveur non accessible (http://localhost:8081/)`, COLORS.RED);
    errors++;
    continueChecks();
});
req.end();

function continueChecks() {
    // --- STEP 4: Structure ---
    header("4️⃣  Vérification structure projet...");
    ['index.html', 'manifest.json'].forEach(file => {
        if (fs.existsSync(file)) {
            log(`  ✓ ${file}`, COLORS.GREEN);
        } else {
            log(`  ✗ ${file} MANQUANT`, COLORS.RED);
            errors++;
        }
    });

    // --- STEP 5: JS Folder ---
    header("5️⃣  Vérification dossier JavaScript...");
    if (fs.existsSync('js')) {
        const jsFiles = fs.readdirSync('js').filter(f => f.endsWith('.js'));
        log(`✓ Dossier 'js/' trouvé (${jsFiles.length} fichiers)`, COLORS.GREEN);
        console.log("  Fichiers JS trouvés:");
        jsFiles.slice(0, 10).forEach(f => console.log(`    - ${f}`));
    } else {
        log(`⚠ Dossier 'js/' non trouvé`, COLORS.YELLOW);
        // Fallback search
        const rootFiles = fs.readdirSync('.').filter(f => f === 'app.js' || f === 'main.js');
        if (rootFiles.length > 0) {
            log(`  → Fichiers JS trouvés à la racine`, COLORS.GREEN);
        } else {
            log(`✗ Aucun fichier JavaScript trouvé!`, COLORS.RED);
            errors++;
        }
    }

    // --- STEP 6: HTML Title ---
    header("6️⃣  Vérification identité projet...");
    if (fs.existsSync('index.html')) {
        const content = fs.readFileSync('index.html', 'utf8');
        const match = content.match(/<title>(.*?)<\/title>/);
        if (match) {
            const title = match[1];
            if (title.includes('Madagascar') || title.includes('Gasikara')) {
                log(`✓ Titre HTML cohérent: ${title}`, COLORS.GREEN);
            } else {
                log(`⚠ Titre HTML inattendu: ${title}`, COLORS.YELLOW);
            }
        }
    }

    console.log("\n==========================================");
    if (errors === 0) {
        log(`✅ VALIDATION RÉUSSIE - Prêt à optimiser`, COLORS.GREEN);
    } else {
        log(`❌ ${errors} ERREUR(S)`, COLORS.RED);
    }

    runDiagnostics();
}

function runDiagnostics() {
    console.log("\n🔍 DIAGNOSTIC GASIKARA EXPLORER V2");
    console.log("===================================");

    header("📄 ÉTAPE 1: Fichier HTML");
    let mainHtml = '';
    if (fs.existsSync('index.html')) mainHtml = 'index.html';
    else {
        const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
        if (htmlFiles.length > 0) mainHtml = htmlFiles[0];
    }

    if (!mainHtml) {
        log(`✗ Aucun fichier HTML trouvé`, COLORS.RED);
        return;
    }
    log(`✓ HTML principal: ${mainHtml}`, COLORS.GREEN);

    header("📜 ÉTAPE 2: Scripts JavaScript");
    const htmlContent = fs.readFileSync(mainHtml, 'utf8');
    // Capture ALL src attributes, then filter
    const scriptRegex = /src=["']([^"']+)["']/g;
    let scripts = [];
    let match;
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
        const src = match[1];
        if (!src.includes('http') && !src.includes('cdn')) {
            // Check if it's a JS file (ignoring query params)
            if (src.split('?')[0].endsWith('.js')) {
                scripts.push(src);
            }
        }
    }

    if (scripts.length === 0) {
        log(`✗ Aucun script local trouvé dans ${mainHtml}`, COLORS.RED);
    } else {
        console.log("Scripts référencés dans HTML:");
        scripts.forEach(s => console.log(`  - ${s}`));
    }

    header("⚖️  ÉTAPE 3: Identification script principal");
    let largestScript = '';
    let largestSize = 0;
    let largestLines = 0;

    scripts.forEach(scriptPath => {
        let cleanPath = scriptPath.replace(/^\.\//, '').split('?')[0];
        if (fs.existsSync(cleanPath)) {
            const stats = fs.statSync(cleanPath);
            const content = fs.readFileSync(cleanPath, 'utf8');
            const lines = content.split('\n').length;
            const sizeKb = Math.round(stats.size / 1024);

            console.log(`  📦 ${cleanPath}`);
            console.log(`      Taille: ${sizeKb} KB | Lignes: ${lines}`);

            if (stats.size > largestSize) {
                largestSize = stats.size;
                largestScript = cleanPath;
                largestLines = lines;
            }
        } else {
            log(`  ✗ ${cleanPath} - INTROUVABLE`, COLORS.RED);
        }
    });

    if (largestScript) {
        log(`\n✓ Script principal identifié:`, COLORS.GREEN);
        log(`  ${largestScript}`, COLORS.YELLOW);
        console.log(`  Taille: ${Math.round(largestSize / 1024)} KB (${largestLines} lignes)`);
    } else {
        log(`✗ Impossible d'identifier le script principal`, COLORS.RED);
    }

    header("🎨 ÉTAPE 4: Feuilles de style");
    // Capture ALL href attributes and filter
    const linkRegex = /href=["']([^"']+)["']/g;
    let cssMatch = null;
    while ((match = linkRegex.exec(htmlContent)) !== null) {
        const href = match[1];
        if (!href.includes('http') && !href.includes('cdn')) {
            if (href.split('?')[0].endsWith('.css')) {
                cssMatch = href;
                break; // Found the first local CSS
            }
        }
    }

    if (cssMatch) {
        log(`✓ CSS principal: ${cssMatch}`, COLORS.GREEN);
        let cleanCss = cssMatch.replace(/^\.\//, '').split('?')[0];
        if (fs.existsSync(cleanCss)) {
            const stats = fs.statSync(cleanCss);
            console.log(`  Taille: ${Math.round(stats.size / 1024)} KB`);
        }
    } else {
        log(`⚠ Aucun CSS local trouvé`, COLORS.YELLOW);
    }

    header("🔧 ÉTAPE 5: Service Worker");
    const swFiles = ['sw.js', 'service-worker.js'];
    let swFound = false;
    for (const f of swFiles) {
        if (fs.existsSync(f)) {
            log(`✓ Service Worker trouvé: ${f}`, COLORS.GREEN);
            swFound = true;

            // Check HTTP
            const swReq = http.request({
                hostname: 'localhost',
                port: 8081,
                path: '/' + f,
                method: 'HEAD'
            }, (res) => {
                if (res.statusCode === 200) {
                    log(`  ✓ Accessible via HTTP (code 200)`, COLORS.GREEN);
                } else {
                    log(`  ✗ Non accessible (HTTP ${res.statusCode})`, COLORS.RED);
                }
            });
            swReq.on('error', () => {
                log(`  ✗ Non accessible (Erreur connexion)`, COLORS.RED);
            });
            swReq.end();
            break;
        }
    }
    if (!swFound) {
        log(`✗ Service Worker NON trouvé à la racine`, COLORS.RED);
    }
}
