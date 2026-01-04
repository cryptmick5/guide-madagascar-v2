
/* CITIES LOGIC - MODULE EXTRACTED */

window.initCityPages = function () {
    renderCityData();
    const citySections = document.querySelectorAll('.province-section, .page-section');
    citySections.forEach(section => {
        if (!section.id.startsWith('page-')) return;
        const cityKey = section.id.replace('page-', '');
        const ignored = ['circuit', 'itineraires', 'langue', 'outils', 'carte', 'spots'];
        if (ignored.some(k => cityKey.includes(k))) return;

        const btnAll = section.querySelector('.nav-pill');
        if (btnAll) filterProvinceItems(cityKey, 'all', btnAll);

        updatePremiumInfo(getCityNameFromKey(cityKey), cityKey);

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
            const budgets = [
                { level: '1', label: '€', desc: '(- 25k)', icon: 'fa-coins' },
                { level: '2', label: '€€', desc: '(25k-80k)', icon: 'fa-money-bill-wave' },
                { level: '3', label: '€€€', desc: '(+ 80k)', icon: 'fa-gem' }
            ];
            budgets.forEach(b => {
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
    });
};

window.renderCityData = function () {
    let data = window.LIEUX_DATA;
    if (!data || data.length === 0) {
        data = window.LIEUX_DATA || window.initData || [];
    }
    if (!window.LIEUX_DATA) return;

    const citiesStub = {
        'Diego-Suarez': 'Antsiranana',
        'Antsiranana': 'Antsiranana',
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

    Object.values(citiesStub).forEach(id => {
        const el = document.getElementById(`grid-${id}`);
        if (el) el.innerHTML = '';
    });

    if (window.LIEUX_DATA) {
        window.LIEUX_DATA.forEach(lieu => {
            let v = lieu.ville ? lieu.ville.trim() : 'Inconnu';
            let stubKey = Object.keys(citiesStub).find(k => k.toLowerCase() === v.toLowerCase());
            let gridId = citiesStub[v] || (stubKey ? citiesStub[stubKey] : null);

            if (v === 'Diego-Suarez') gridId = 'Antsiranana';
            if (v === 'Nosy Be' || v === 'Nosy-Be') gridId = 'NosyBe';

            if (gridId) {
                const grid = document.getElementById(`grid-${gridId}`);
                if (grid && typeof window.createLieuCard === 'function') {
                    const card = window.createLieuCard(lieu);
                    grid.insertAdjacentHTML('beforeend', card);
                }
            }
        });
    }

    if (window.GasikaraAnimations && typeof window.GasikaraAnimations.init === 'function') {
        window.GasikaraAnimations.init();
    }
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
    const isActive = btn.classList.contains('active');
    container.querySelectorAll('[data-level], .budget-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const activeCatBtn = container.querySelector('.nav-pill.active');
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
