
/* CITIES LOGIC - MODULE EXTRACTED */

/* ============================================
   PAGES VILLES — rendu à la demande
   Seule la destination ouverte est construite (≈30 cartes au lieu de 260).
   ============================================ */
window._cityPagesReady = window._cityPagesReady || {};

// Grille (id sans le préfixe "grid-") → lieux, calculé une seule fois
window.getLieuxParGrille = function () {
    if (window._lieuxParGrille) return window._lieuxParGrille;
    const citiesStub = {
        'Diego-Suarez': 'Antsiranana', 'Antsiranana': 'Antsiranana',
        'Nosy Be': 'NosyBe', 'Nosy-Be': 'NosyBe',
        'Mahajanga': 'Mahajanga', 'Majunga': 'Mahajanga',
        'Antananarivo': 'Antananarivo', 'Tana': 'Antananarivo',
        'Toamasina': 'Toamasina', 'Tamatave': 'Toamasina',
        'Fianarantsoa': 'Fianarantsoa', 'Fianar': 'Fianarantsoa',
        'Toliara': 'Toliara', 'Tuléar': 'Toliara', 'Tulear': 'Toliara',
        'Isalo': 'Toliara', 'Ifaty': 'Toliara', 'Anakao': 'Toliara',
        'Andasibe': 'Toamasina', 'Mananara': 'Toamasina',
        'Sainte-Marie': 'Saintemarie', 'Ile aux Nattes': 'Saintemarie',
        'Ankarana': 'Antsiranana', 'Sambava': 'Antsiranana', 'Antalaha': 'Antsiranana', 'Vohémar': 'Antsiranana', 'Ambilobe': 'Antsiranana',
        'Ampefy': 'Antananarivo', 'Antsirabe': 'Antananarivo',
        'Anivorano': 'Antsiranana', 'Ambanja': 'Antsiranana',
        'Ramena': 'Antsiranana', 'Joffreville': 'Antsiranana'
    };
    const index = {};
    (window.LIEUX_DATA || []).forEach(lieu => {
        const v = lieu.ville ? lieu.ville.trim() : 'Inconnu';
        const stubKey = Object.keys(citiesStub).find(k => k.toLowerCase() === v.toLowerCase());
        const repli = citiesStub[v] || (stubKey ? citiesStub[stubKey] : null);
        // La zone fait foi ; une excursion apparaît aussi dans sa ville de départ
        window.getLieuGridIds(lieu, repli).filter(Boolean).forEach(gridId => {
            (index[gridId] = index[gridId] || []).push(lieu);
        });
    });
    window._lieuxParGrille = index;
    return index;
};

// Construit la grille d'une destination en une seule écriture dans le DOM
window.renderCityGrid = function (cityKey) {
    const zone = (window.GASIKARA_ZONES || {})[cityKey];
    if (!zone || !window.LIEUX_DATA || typeof window.createLieuCard !== 'function') return false;
    const grid = document.getElementById(`grid-${zone.grid}`);
    if (!grid) return false;
    const lieux = window.getLieuxParGrille()[zone.grid] || [];
    grid.innerHTML = lieux.map(l => window.createLieuCard(l)).join('');
    return true;
};

window.ensureCityPage = function (cityKey) {
    if (window._cityPagesReady[cityKey]) return true;
    const section = document.getElementById(`page-${cityKey}`);
    if (!section || !window.renderCityGrid(cityKey)) return false;
    window._cityPagesReady[cityKey] = true;

    const navPills = section.querySelector('.nav-pills');
    if (navPills && !section.querySelector('.budget-pills-container')) {
        const budgetContainer = document.createElement('div');
        budgetContainer.className = 'budget-pills-container';
        budgetContainer.style.cssText = 'margin-top: 16px; margin-bottom: 20px;';
        const title = document.createElement('div');
        title.className = 'filter-title';
        title.style.cssText = 'font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; text-align: center;';
        title.innerHTML = '<i class="fas fa-wallet"></i> Budget';
        budgetContainer.appendChild(title);
        const pills = document.createElement('div');
        pills.className = 'nav-pills';
        pills.style.justifyContent = 'center';
        [
            { level: '1', label: '€', desc: '(- 25k)', icon: 'fa-coins' },
            { level: '2', label: '€€', desc: '(25k-80k)', icon: 'fa-money-bill-wave' },
            { level: '3', label: '€€€', desc: '(+ 80k)', icon: 'fa-gem' }
        ].forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'budget-btn nav-pill';
            btn.setAttribute('data-level', b.level);
            btn.onclick = function () { toggleProvinceBudget(cityKey, b.level, this); };
            btn.innerHTML = `<i class="fas ${b.icon}"></i> ${b.label} <span style="font-size: 0.75rem; opacity: 0.8;">${b.desc}</span>`;
            pills.appendChild(btn);
        });
        budgetContainer.appendChild(pills);
        navPills.parentNode.insertBefore(budgetContainer, navPills.nextSibling);
    }

    const btnAll = section.querySelector('.nav-pill');
    if (btnAll) filterProvinceItems(cityKey, 'all', btnAll);
    updatePremiumInfo(getCityNameFromKey(cityKey), cityKey);
    return true;
};

// Compatibilité : sans argument, prépare toutes les destinations
window.initCityPages = function (cityKey) {
    if (cityKey) return window.ensureCityPage(cityKey);
    Object.keys(window.GASIKARA_ZONES || {}).forEach(k => window.ensureCityPage(k));
};

// Compatibilité : reconstruit les grilles déjà affichées (ex. après changement de données)
window.renderCityData = function () {
    window._lieuxParGrille = null;
    Object.keys(window._cityPagesReady).forEach(k => window.renderCityGrid(k));
};

window.getCityNameFromKey = function (key) {
    const map = {
        'antananarivo': 'Antananarivo',
        'antsiranana': 'Diego-Suarez',
        'nosybe': 'Nosy Be',
        'mahajanga': 'Mahajanga',
        'toamasina': 'Toamasina',
        'fianarantsoa': 'Fianarantsoa',
        'toliara': 'Toliara',
        'saintemarie': 'Sainte Marie'
    };
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

window.filterProvinceItems = function (cityKey, filterType, btn) {
    const container = document.getElementById(`page-${cityKey}`);
    if (!container) return;

    const allPills = container.querySelectorAll('.nav-pill');
    allPills.forEach(b => {
        const onClickFn = b.getAttribute('onclick') || '';
        if (onClickFn.includes('filterProvinceItems')) {
            b.classList.remove('active');
        }
    });

    if (btn) btn.classList.add('active');

    const items = container.querySelectorAll('.lieu-card');
    let count = 0;

    items.forEach(item => {
        const rawTags = (item.dataset.tags || '').toLowerCase();
        const tags = rawTags.split(',');
        let isMatch = false;

        if (filterType === 'all') isMatch = true;
        else if (filterType === 'voir' || filterType === 'explorer') isMatch = tags.includes('explorer');
        else if (filterType === 'manger') isMatch = tags.includes('manger');
        else if (filterType === 'dodo' || filterType === 'dormir') isMatch = tags.includes('dormir');
        else if (filterType === 'sortir') isMatch = tags.includes('sortir');
        else if (filterType === 'spot') isMatch = tags.includes('spots');

        if (isMatch) {
            const activeBudgetBtn = container.querySelector('[data-level].active');
            if (activeBudgetBtn) {
                const budgetLevel = activeBudgetBtn.dataset.level;
                const targetTag = budgetLevel === '1' ? 'budget_1' : (budgetLevel === '2' ? 'budget_2' : 'budget_3');
                if (!tags.includes(targetTag.toLowerCase())) {
                    isMatch = false;
                }
            }
        }

        if (isMatch) {
            item.style.display = 'flex';
            count++;
        } else {
            item.style.display = 'none';
        }
    });

    const emptyMsg = container.querySelector('.empty-state-msg');
    if (count === 0) {
        if (!emptyMsg) {
            const msg = document.createElement('div');
            msg.className = 'empty-state-msg';
            msg.style.gridColumn = '1/-1';
            msg.style.padding = '40px';
            msg.style.textAlign = 'center';
            msg.innerHTML = '<i class="fas fa-search" style="font-size:3rem; color:var(--text-secondary); margin-bottom:15px;"></i><p>Aucune pépite trouvée dans cette catégorie.</p>';
            const grid = container.querySelector('.lieux-grid');
            if (grid) grid.appendChild(msg);
        } else {
            emptyMsg.style.display = 'block';
        }
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
    }
};

window.toggleProvinceBudget = function (cityKey, level, btn) {
    const container = document.getElementById(`page-${cityKey}`);
    if (!container) return;
    // Un second clic sur le budget actif le désactive (retour à tous les budgets)
    const isActive = btn.classList.contains('active');
    container.querySelectorAll('[data-level], .budget-btn').forEach(b => b.classList.remove('active'));
    if (!isActive) btn.classList.add('active');

    // Catégorie active : uniquement parmi les boutons de catégorie (les boutons budget sont aussi des .nav-pill)
    const activeCatBtn = [...container.querySelectorAll('.nav-pill.active')].find(b => (b.getAttribute('onclick') || '').includes('filterProvinceItems'));
    let filterType = 'all';
    if (activeCatBtn) {
        const txt = activeCatBtn.innerText.toLowerCase().trim();
        if (txt.includes('explorer')) filterType = 'explorer';
        else if (txt.includes('manger')) filterType = 'manger';
        else if (txt.includes('dormir')) filterType = 'dormir';
        else if (txt.includes('sortir')) filterType = 'sortir';
        else if (txt.includes('spots')) filterType = 'spot';
        else if (txt.includes('tout')) filterType = 'all';
    }
    filterProvinceItems(cityKey, filterType, activeCatBtn);
};

window.updatePremiumInfo = function (city, provinceKey) {
    const container = document.getElementById(`premium-container-${provinceKey}`);
    if (!container) return;
    const zoneData = (window.ZONES_DATA || {})[city];
    if (!zoneData) { container.innerHTML = ''; return; }

    let html = '';
    if (zoneData.logistique) {
        const { route_etat, transport_conseil } = zoneData.logistique;
        html += `
            <div class="logistique-container">
                 <div class="logistique-header" onclick="this.nextElementSibling.classList.toggle('active')">
                    <h3><i class="fas fa-truck-monster"></i> Infos Route (${city})</h3>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="logistique-content">
                    <div class="logistique-item"><div>Route:</div><div>${route_etat}</div></div>
                    <div class="logistique-item"><div>Transport:</div><div>${transport_conseil}</div></div>
                </div>
            </div>`;
    }
    container.innerHTML = html;
};
