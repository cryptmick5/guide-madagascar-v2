const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.join(__dirname, '../data');

// Helper to load browser JS files
function loadBrowserDataFile(filename) {
    const filePath = path.join(DATA_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    try {
        vm.runInContext(content, sandbox);
        // Determine variable name based on filename
        if (filename.includes('lieux')) return sandbox.window.LIEUX_DATA;
        if (filename.includes('itineraires')) return sandbox.window.ITINERAIRES_DATA;
    } catch (e) {
        console.error(`Error parsing ${filename}:`, e);
        return null;
    }
}

function processLieux() {
    console.log("🔄 Processing Lieux Data...");
    let lieux = loadBrowserDataFile('lieux.js');
    if (!lieux) return;

    let updatedCount = 0;

    lieux = lieux.map(lieu => {
        if (lieu.description) {
            // 1. Clean Asterisks
            // Remove ** but keep the text inside.
            let cleanDesc = lieu.description.replace(/\*\*/g, '');

            // 2. Generate Summary
            // Strategy: Take the first paragraph (split by \n\n)
            // If only one paragraph, take first 3 sentences or 350 chars.
            let summary = '';
            const parts = cleanDesc.split(/\n\n/);

            if (parts.length > 1) {
                summary = parts[0].trim();
            } else {
                // Fallback: Split by sentences
                // Match dot followed by space or end of string
                const sentences = cleanDesc.match(/[^\.!\?]+[\.!\?]+[\s$]*/g);
                if (sentences && sentences.length > 0) {
                    // Take first 3 sentences or up to 300 chars
                    let tempSum = '';
                    for (let s of sentences) {
                        if ((tempSum + s).length < 350) {
                            tempSum += s;
                        } else {
                            break;
                        }
                    }
                    summary = tempSum.trim();
                } else {
                    summary = cleanDesc.substring(0, 300) + '...';
                }
            }

            // Update Fields
            lieu.description = cleanDesc; // Cleaned full description
            lieu.description_summary = summary;
            lieu.has_expandable_description = true;

            updatedCount++;
        }
        return lieu;
    });

    // Write back
    const fileContent = `window.LIEUX_DATA = ${JSON.stringify(lieux, null, 2)};`;
    fs.writeFileSync(path.join(DATA_DIR, 'lieux.js'), fileContent);
    console.log(`✅ Updated ${updatedCount} locations in lieux.js`);
}

processLieux();
