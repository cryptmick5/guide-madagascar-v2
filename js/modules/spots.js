
/* SPOTS LOGIC - MODULE EXTRACTED */

window.initSpotsPage = function () {
    console.log("🔍 Init Spots Page");
    const grid = document.getElementById('spotsContainer'); // FIX: was 'spots-grid'
    if (!grid) return;

    // Clear existing
    grid.innerHTML = '';

    // Filter by spotLocal property OR tags containing 'spot'
    const spots = (window.LIEUX_DATA || []).filter(lieu =>
        lieu.spotLocal === true ||
        (lieu.tags && lieu.tags.some(t => t.toLowerCase().includes('spot')))
    );

    if (spots.length === 0) {
        grid.innerHTML = '<p class="empty-message">Aucun spot local trouvé pour le moment.</p>';
        return;
    }

    // Render cards
    spots.forEach(spot => {
        if (typeof window.createLieuCard === 'function') {
            const card = window.createLieuCard(spot);
            grid.insertAdjacentHTML('beforeend', card);
        }
    });

    // Init region filter if exists
    const filterBtns = document.querySelectorAll('.region-filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const region = btn.dataset.region;
                filterSpotsByRegion(region, btn);
            });
        });
    }

    // GSAP Animations
    if (window.GasikaraAnimations && typeof window.GasikaraAnimations.init === 'function') {
        window.GasikaraAnimations.init();
    }
};

window.filterSpotsByRegion = function (region, btn) {
    const grid = document.getElementById('spotsContainer'); // FIX: was 'spots-grid'
    if (!grid) return;

    // Toggle active button
    document.querySelectorAll('.region-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const allCards = grid.querySelectorAll('.lieu-card');

    allCards.forEach(card => {
        const ville = (card.dataset.ville || '').toLowerCase();
        const zoneVoulue = Object.keys(window.GASIKARA_ZONES).find(k => window.GASIKARA_ZONES[k].nom.toLowerCase() === region.toLowerCase());

        if (region === 'all') {
            card.style.display = 'flex';
        } else if (zoneVoulue && card.dataset.zone) {
            // La zone du lieu fait foi (Ifaty, Isalo… → Toliara)
            card.style.display = card.dataset.zone.split(' ')[0] === zoneVoulue ? 'flex' : 'none';
        } else {
            // Simple matching (extend with more advanced logic if needed)
            const match = ville.includes(region.toLowerCase());
            card.style.display = match ? 'flex' : 'none';
        }
    });
};
