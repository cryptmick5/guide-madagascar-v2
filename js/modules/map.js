
/* MAP LOGIC - MODULE EXTRACTED */
const CITY_COORDINATES = { 'antananarivo': [-18.8792, 47.5079, 12], 'antsiranana': [-12.2797, 49.2917, 12], 'mahajanga': [-15.7167, 46.3167, 12], 'toamasina': [-18.1492, 49.4023, 12], 'toliara': [-23.3500, 43.6667, 12], 'fianarantsoa': [-21.4333, 47.0833, 12] };
window.leafletMap = null; let markersLayer = null;

// FONCTION CRITIQUE : Nettoie tout ce qui peut casser le HTML
function safeStr(str) {
    if (!str) return '';
    return String(str)
        .replace(/'/g, "\\'").replace(/"/g, '&quot;')
        .replace(/\n/g, ' ');
}

window.initMap = function () {
    console.log("🚀 Map Start");
    if (window.leafletMap) return; // Prevent double init
    window.leafletMap = L.map('map').setView([-18.8792, 47.5079], 6);
    // CartoDB Voyager
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(window.leafletMap);
    markersLayer = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
    window.leafletMap.addLayer(markersLayer);

    window.leafletMap._isMapMoving = false;
    window.leafletMap.on('movestart', () => window.leafletMap._isMapMoving = true);
    window.leafletMap.on('moveend', () => window.leafletMap._isMapMoving = false);

    updateMapMarkers();

    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.addEventListener('change', updateMapMarkers));
};

window.updateMapMarkers = function () {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    const checkboxes = document.querySelectorAll('.filter-checkbox:checked');
    const activeFilters = Array.from(checkboxes).map(cb => {
        let filterText = cb.parentElement.innerText.trim().toLowerCase();
        if (filterText === '€') return 'budget_1';
        if (filterText === '€€') return 'budget_2';
        if (filterText === '€€€') return 'budget_3';
        return filterText;
    });

    const data = window.LIEUX_DATA || [];

    const filtered = data.filter(item => {
        if (activeFilters.length === 0) return true;
        if (!item.tags) return false;
        const itemTagsLower = item.tags.map(t => t.toLowerCase());
        return activeFilters.some(f => itemTagsLower.includes(f));
    });

    console.log(`Map: ${filtered.length} lieux affichés`);

    filtered.forEach(lieu => {
        if (!lieu.lat || !lieu.lng) return;

        const icon = L.divIcon({ className: 'custom-marker', html: lieu.spotLocal ? '📍' : '📌', iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });
        const marker = L.marker([lieu.lat, lieu.lng], { icon });

        const sImg = safeStr(lieu.image || 'images/placeholders/default.jpg');
        const sNom = safeStr(lieu.nom);
        const sId = String(lieu.id);
        const sVille = safeStr(lieu.ville);
        const sPrix = safeStr(lieu.prix);

        const categoryTags = ['manger', 'dormir', 'explorer', 'sortir', 'spots'];
        const lieuCategoryTags = (lieu.tags || []).filter(t => categoryTags.includes(t));

        const tagsHtml = lieuCategoryTags.map(tag => {
            const sTag = safeStr(tag);
            return `<span class="popup-tag" style="background:rgba(0,0,0,0.75); color:#ffffff; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:600; margin-right:4px; display:inline-block; backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.2); box-shadow:0 2px 4px rgba(0,0,0,0.2); text-transform:capitalize;">${sTag}</span>`;
        }).join('');

        const html = `
            <div class="popup-wrapper">
                <div class="popup-image-container" style="background-image: url('${sImg}');">
                    <div class="popup-tags-container" style="position:absolute; top:8px; left:8px; right:8px;">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="popup-body">
                    <h3 class="popup-title">${sNom}</h3>
                    <div class="popup-subtitle">📍 ${sVille}</div>
                    <div class="popup-meta">
                        <div class="popup-price">${sPrix}</div>
                        <div class="popup-rating">⭐ ${lieu.note}</div>
                    </div>
                    <button onclick="showLieuDetailsByID('${sId}')" class="btn-popup-details">Voir détails</button>
                </div>
            </div>`;

        marker.bindPopup(html, { autoClose: false, minWidth: 260, maxWidth: 260 });

        marker.on('click', function () {
            this._locked = true;
            this.openPopup();
            const map = window.leafletMap;
            const targetLatLng = L.latLng(lieu.lat, lieu.lng);
            const zoom = map.getZoom();
            const point = map.project(targetLatLng, zoom);
            const offsetPoint = point.subtract([0, 150]);
            const newCenter = map.unproject(offsetPoint, zoom);
            map.setView(newCenter, zoom, { animate: true, duration: 0.5 });
        });

        marker.on('mouseover', function () {
            this.openPopup();
        });

        marker.on('mouseout', function () {
            const map = window.leafletMap;
            if (!this._locked && !map._isMapMoving) {
                this.closePopup();
            }
        });

        marker.on('popupclose', function () {
            this._locked = false;
        });

        markersLayer.addLayer(marker);
        marker._lieuId = lieu.id;
    });

    markersLayer.on('spiderfied', function (a) {
        a.markers.forEach(function (marker) {
            marker.openPopup();
        });
    });
};

window.openMapMarker = function (id) {
    if (!markersLayer) return;
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = true);
    document.querySelectorAll('.filter-chip-map').forEach(chip => chip.classList.add('active'));
    updateMapMarkers();
    const layers = markersLayer.getLayers();
    const marker = layers.find(l => l._lieuId == id);
    if (marker) {
        markersLayer.zoomToShowLayer(marker, function () {
            marker.openPopup();
        });
    }
};

window.toggleFilter = function (chip, type) {
    if (!chip) return;
    const cb = chip.querySelector('input');
    if (event.target !== cb) cb.checked = !cb.checked;

    if (cb.checked) chip.classList.add('active');
    else chip.classList.remove('active');

    if (CITY_COORDINATES[type] && cb.checked) {
        window.leafletMap.setView([CITY_COORDINATES[type][0], CITY_COORDINATES[type][1], CITY_COORDINATES[type][2]);
    }
    updateMapMarkers();
};

window.initGeolocation = function () {
    const btn = document.getElementById('btnLocateMe');
    if (btn) btn.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(p => {
            window.leafletMap.setView([p.coords.latitude, p.coords.longitude], 13);
            L.marker([p.coords.latitude, p.coords.longitude]).addTo(window.leafletMap).bindPopup("Vous").openPopup();
        });
    });
};
