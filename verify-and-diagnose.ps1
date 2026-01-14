$ErrorActionPreference = "Stop"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

function Write-Head($text) {
    Write-Host ""
    Write-Host $text -ForegroundColor Cyan
}

$errors = 0

Write-Host "🔍 VÉRIFICATION ENVIRONNEMENT GASIKARA V2 (PowerShell)"
Write-Host "=========================================="

# --- STEP 1: Git Remote ---
Write-Head "1️⃣  Vérification Git Remote..."
try {
    $remoteUrl = git remote get-url origin
    if ($remoteUrl -match "guide-madagascar-v2") {
        Write-Color "✓ Repository correct: guide-madagascar-v2" Green
    } else {
        Write-Color "✗ ERREUR: Repository incorrect ou absent" Red
        Write-Host "  Remote trouvé: $remoteUrl"
        $errors++
    }
} catch {
    Write-Color "✗ ERREUR verification git" Red
    $errors++
}

# --- STEP 2: Git Branch ---
Write-Head "2️⃣  Vérification branche Git..."
try {
    $currentBranch = git branch --show-current
    if ([string]::IsNullOrWhiteSpace($currentBranch)) {
        Write-Color "⚠ Pas de branche Git active" Yellow
    } else {
        Write-Color "✓ Branche active: $currentBranch" Green
        if ($currentBranch -eq "main") {
            Write-Color "⚠ Tu es sur la branche principale" Yellow
        }
    }
} catch {
    Write-Color "⚠ Erreur branche" Yellow
}

# --- STEP 3: Localhost ---
Write-Head "3️⃣  Vérification serveur local..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/" -Method Head -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Color "✓ Serveur accessible: http://localhost:8081/" Green
    } else {
        Write-Color "✗ ERREUR: Code $($response.StatusCode)" Red
        $errors++
    }
} catch {
    Write-Color "✗ ERREUR: Serveur non accessible (http://localhost:8081/)" Red
    $errors++
}

# --- STEP 4: Structure ---
Write-Head "4️⃣  Vérification structure projet..."
$requiredFiles = @("index.html", "manifest.json")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Color "  ✓ $file" Green
    } else {
        Write-Color "  ✗ $file MANQUANT" Red
        $errors++
    }
}

# --- STEP 5: JS Folder ---
Write-Head "5️⃣  Vérification dossier JavaScript..."
if (Test-Path "js") {
    $jsFiles = Get-ChildItem "js" -Filter "*.js" -Recurse
    Write-Color "✓ Dossier 'js/' trouvé ($($jsFiles.Count) fichiers)" Green
    Write-Host "  Fichiers JS trouvés:"
    $jsFiles | Select-Object -First 10 | ForEach-Object { Write-Host "    - $($_.Name)" }
} else {
    Write-Color "⚠ Dossier 'js/' non trouvé" Yellow
    $altJs = Get-ChildItem . -Include "app.js","main.js" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($altJs) {
        Write-Color "  → Fichiers JS trouvés dans: $($altJs.DirectoryName)" Green
    } else {
        Write-Color "✗ Aucun fichier JavaScript trouvé!" Red
        $errors++
    }
}

# --- STEP 6: HTML Title ---
Write-Head "6️⃣  Vérification identité projet..."
if (Test-Path "index.html") {
    $content = Get-Content "index.html" -Raw
    if ($content -match "<title>(.*?)</title>") {
        $title = $matches[1]
        if ($title -match "Madagascar" -or $title -match "Gasikara") {
            Write-Color "✓ Titre HTML cohérent: $title" Green
        } else {
            Write-Color "⚠ Titre HTML inattendu: $title" Yellow
        }
    }
}

Write-Host ""
if ($errors -eq 0) {
    Write-Color "✅ VALIDATION RÉUSSIE - Prêt à optimiser" Green
} else {
    Write-Color "❌ $errors ERREUR(S)" Red
}

# --- DIAGNOSTICS ---
Write-Host ""
Write-Host "🔍 DIAGNOSTIC GASIKARA EXPLORER V2"
Write-Host "==================================="

Write-Head "📄 ÉTAPE 1: Fichier HTML"
$mainHtml = ""
if (Test-Path "index.html") { $mainHtml = "index.html" }
elseif (Test-Path "./index.html") { $mainHtml = "./index.html" }
else { 
    $found = Get-ChildItem . -Filter "*.html" | Select-Object -First 1
    if ($found) { $mainHtml = $found.FullName }
}

if (-not $mainHtml) {
    Write-Color "✗ Aucun fichier HTML trouvé" Red
    exit 1
}
Write-Color "✓ HTML principal: $mainHtml" Green

Write-Head "📜 ÉTAPE 2: Scripts JavaScript"
$htmlContent = Get-Content $mainHtml -Raw
# Regex using double quotes to avoid confusion
$scriptRegex = "src=[""']([^""']+\.js)[""']"
$scripts = [regex]::Matches($htmlContent, $scriptRegex) | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -notmatch "http|cdn" }

if (-not $scripts) {
    Write-Color "✗ Aucun script local trouvé dans $mainHtml" Red
} else {
    Write-Host "Scripts référencés dans HTML:"
    $scripts | ForEach-Object { Write-Host "  - $_" }
}

Write-Head "⚖️  ÉTAPE 3: Identification script principal"
$largestScript = ""
$largestSize = 0
$largestLines = 0

foreach ($scriptPath in $scripts) {
    $cleanPath = $scriptPath -replace "^\./", ""
    $cleanPath = $cleanPath -replace "\?.*$", "" 

    if (Test-Path $cleanPath) {
        $fileObj = Get-Item $cleanPath
        $size = $fileObj.Length
        $lines = (Get-Content $cleanPath | Measure-Object -Line).Lines
        $sizeKb = [math]::Round($size / 1024)
        
        Write-Host "  📦 $cleanPath"
        Write-Host "      Taille: $sizeKb KB | Lignes: $lines"
        
        if ($size -gt $largestSize) {
            $largestSize = $size
            $largestScript = $cleanPath
            $largestLines = $lines
        }
    } else {
        Write-Color "  ✗ $cleanPath - INTROUVABLE" Red
    }
}

if ($largestScript) {
    $mainJsSizeKb = [math]::Round($largestSize / 1024)
    Write-Host ""
    Write-Color "✓ Script principal identifié:" Green
    Write-Color "  $largestScript" Yellow
    Write-Host "  Taille: $mainJsSizeKb KB ($largestLines lignes)"
} else {
    Write-Color "✗ Impossible d'identifier le script principal" Red
}

Write-Head "🎨 ÉTAPE 4: Feuilles de style"
$cssRegex = "href=[""']([^""']+\.css)[""']"
$cssMatch = [regex]::Match($htmlContent, $cssRegex)
if ($cssMatch.Success) {
    $css = $cssMatch.Groups[1].Value
    if ($css -notmatch "http|cdn") {
        Write-Color "✓ CSS principal: $css" Green
        $cleanCss = $css -replace "^\./", ""
        $cleanCss = $cleanCss -replace "\?.*$", ""
        
        if (Test-Path $cleanCss) {
            $cssSize = (Get-Item $cleanCss).Length
            $cssSizeKb = [math]::Round($cssSize / 1024)
            Write-Host "  Taille: $cssSizeKb KB"
        }
    } else {
        Write-Color "⚠ Aucun CSS local trouvé dans HTML" Yellow
    }
} else {
    Write-Color "⚠ Aucun CSS trouvé dans HTML" Yellow
}

Write-Head "🔧 ÉTAPE 5: Service Worker"
$swCandidates = Get-ChildItem . -Include "sw.js","service-worker.js" -Recurse -Depth 0
if ($swCandidates) {
    $swFile = $swCandidates[0]
    Write-Color "✓ Service Worker trouvé: $($swFile.Name)" Green
    
    try {
        $swUrl = "http://localhost:8081/$($swFile.Name)"
        $swResp = Invoke-WebRequest -Uri $swUrl -Method Head -ErrorAction SilentlyContinue
        if ($swResp.StatusCode -eq 200) {
            Write-Color "  ✓ Accessible via HTTP (code 200)" Green
        } else {
            Write-Color "  ✗ Non accessible (HTTP $($swResp.StatusCode))" Red
        }
    } catch {
        Write-Color "  ✗ Non accessible (Erreur connexion)" Red
    }
} else {
    Write-Color "✗ Service Worker NON trouvé à la racine" Red
}
