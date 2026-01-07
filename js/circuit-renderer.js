document.addEventListener('DOMContentLoaded', () => {
  // 1. Identification
  const circuitId = window.CIRCUIT_ID;
  const container = document.getElementById('circuit-content');
  const loader = document.getElementById('loading');

  // Robustness check
  if (!window.ITINERAIRES_DATA || !window.ITINERAIRES_DATA[circuitId]) {
    if (loader) loader.innerHTML = '<p style="color:red; padding:20px; text-align:center;">Données du circuit introuvables.<br><a href="../index.html">Retour Accueil</a></p>';
    return;
  }

  const circuit = window.ITINERAIRES_DATA[circuitId];

  // --- THEME INITIALIZATION (Fix 2026) ---
  function initCircuitTheme() {
    try {
      const savedTheme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const currentTheme = savedTheme || (systemDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', currentTheme);
      if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    } catch (e) {
      console.warn("Theme init failed", e);
    }
  }
  initCircuitTheme(); // Run immediately


  // 2. Render Functions
  function render() {
    document.title = `${circuit.nom} - Madagascar du Nord`;

    // Image Path Correction for Subfolder: ../images/...
    // But data has "images/..." -> we need "../images/..."
    const bgImage = '../' + circuit.image;

    let html = `
            <div class="circuit-detail-banner city-header" style="background-image: url('${bgImage}'); height: 60vh; position: relative;">
                <div class="banner-overlay" style="background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7));"></div>
                <div class="banner-content" style="position: absolute; bottom: 40px; left: 20px; right: 20px; text-align: center; color: white;">
                    <h1 class="city-title" style="font-size: 2.5rem; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${circuit.nom}</h1>
                    <p class="city-desc" style="font-size: 1.1rem; opacity: 0.95; max-width: 600px; margin: 10px auto;">${circuit.description}</p>
                </div>
            </div>

            <div style="padding: 20px; max-width: 800px; margin: -40px auto 0; position: relative; z-index: 10; background: var(--bg-primary); border-radius: 20px 20px 0 0; box-shadow: 0 -4px 20px rgba(0,0,0,0.05);">
                
                <!-- META -->
                <div style="display:flex; gap:15px; margin-bottom:30px; flex-wrap:wrap; justify-content: center;">
                    <span class="meta-tag" style="background: var(--bg-secondary); padding: 8px 15px; border-radius: 50px; box-shadow: var(--shadow); border: 1px solid var(--border-color); display:flex; gap:8px; align-items:center;">
                        <i class="far fa-clock" style="color:var(--laterite);"></i> ${circuit.duree}
                    </span>
                    <span class="meta-tag" style="background: var(--bg-secondary); padding: 8px 15px; border-radius: 50px; box-shadow: var(--shadow); border: 1px solid var(--border-color); display:flex; gap:8px; align-items:center;">
                        <i class="fas fa-shield-alt" style="color:var(--gratuit);"></i> Sécu: ${circuit.infos.securite_level}
                    </span>
                     <span class="meta-tag" style="background: var(--bg-secondary); padding: 8px 15px; border-radius: 50px; box-shadow: var(--shadow); border: 1px solid var(--border-color); display:flex; gap:8px; align-items:center;">
                        <i class="fas fa-sun" style="color:var(--abordable);"></i> ${(circuit.logistique_generale || {}).saison_ideale || 'Toute année'}
                    </span>
                </div>

                <!-- MOT DU GUIDE -->
                <div style="background: linear-gradient(135deg, rgba(176, 48, 48, 0.05), rgba(176, 48, 48, 0.01)); border-left: 4px solid var(--laterite); padding: 20px; border-radius: 12px; margin-bottom: 40px;">
                    <h3 style="color: var(--laterite); display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fas fa-quote-left"></i> Le Mot du Guide
                    </h3>
                    <p style="font-style: italic; color: var(--text-primary); margin-bottom: 15px;">"${circuit.infos.description_fun}"</p>
                    <div style="border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 10px; font-size: 0.9rem; color: var(--text-secondary);">
                        <div><i class="fas fa-road"></i> Route: ${(circuit.logistique_generale || {}).route_etat}</div>
                        <div><i class="fas fa-car-side"></i> Véhicule: ${(circuit.logistique_generale || {}).vehicule_conseil}</div>
                    </div>
                </div>

                <!-- PROGRAMME -->
                <h2 style="font-family: var(--font-display); margin-bottom: 25px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">Votre Programme</h2>
                <div class="timeline-container">
                    ${renderTimeline()}
                </div>

                <!-- BUDGET -->
                ${renderBudget()}

                <br><br>
                <a href="../index.html#itineraires" style="display: block; text-align: center; background: var(--text-primary); color: var(--bg-primary); padding: 15px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-bottom: 40px; box-shadow: var(--shadow-lg);">
                    Voir d'autres circuits
                </a>

            </div>
        `;
    container.innerHTML = html;
    if (loader) loader.style.display = 'none';
    container.style.display = 'block';
  }

  function renderTimeline() {
    if (!circuit.etapes) return '';
    return circuit.etapes.map(step => `
            <div style="position: relative; padding-left: 30px; margin-bottom: 30px; border-left: 2px solid var(--border-color);">
                <div style="position: absolute; left: -9px; top: 0; width: 16px; height: 16px; background: var(--laterite); border-radius: 50%; border: 3px solid var(--bg-primary);"></div>
                
                <div style="margin-bottom: 5px;">
                    <span style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: var(--laterite); font-weight: 700;">Jour ${step.jour}</span>
                    <h3 style="font-size: 1.3rem; margin: 5px 0;">${step.titre}</h3>
                </div>

                ${step.logistique ? `
                <div style="display: flex; gap: 10px; align-items: center; background: var(--bg-secondary); padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 10px; border: 1px solid var(--border-color);">
                    <span>${step.logistique.depart}</span>
                    <i class="fas fa-long-arrow-alt-right" style="color: var(--text-secondary);"></i>
                    <span>${step.logistique.arrivee}</span>
                    <span style="margin-left: auto; font-weight: 600;">${step.logistique.duree_totale_transport}</span>
                </div>` : ''}

                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 15px;">${step.description}</p>

                ${step.incontournables ? `
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                    ${step.incontournables.map(i => `<span style="background: rgba(22, 163, 74, 0.1); color: var(--gratuit); padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;"><i class="fas fa-check"></i> ${typeof i === 'object' ? i.label : i}</span>`).join('')}
                </div>` : ''}

                ${window.generateStepPracticalInfo ? window.generateStepPracticalInfo(step) : ''}
            </div>
        `).join('');
  }

  /**
   * Génère l'accordéon Infos Pratiques Premium - FULL WIDTH
   * Compatible avec les styles ajoutés dans css/styles-premium.css (Step 603)
   */
  /**
   * Génère l'accordéon Infos Pratiques Premium - FULL WIDTH (Refactor V4)
   * Utilise <details> et <summary> pour les sous-sections
   */
  // Gestionnaire d'observateurs pour nettoyer proprement (Scope local au module)
  const accordionObservers = new WeakMap();

  window.generateStepPracticalInfo = function (day) {
    const hasFood = day.gourmandise;
    const hasAccom = day.hebergement_options && (
      typeof day.hebergement_options === 'string' ||
      (Array.isArray(day.hebergement_options) ? day.hebergement_options.length > 0 : Object.keys(day.hebergement_options).length > 0)
    );
    const hasAdvice = day.astuce;

    // Si aucune info pratique, ne rien afficher
    if (!hasFood && !hasAccom && !hasAdvice) {
      return '';
    }

    const title = "Infos Pratiques de l'Étape";

    return `
        <div class="step-accordion step-accordion-premium">
          <button class="step-accordion-toggle-btn step-accordion-header">
            <div class="step-accordion-header-main">
              <div class="step-accordion-icon step-accordion-icon-premium">
                <i class="fas fa-info"></i>
              </div>
              <div class="step-accordion-text">
                <h3 class="step-accordion-title">${title}</h3>
                <p class="step-accordion-subtitle">
                  Les bons plans de ton guide local pour profiter à fond de cette journée.
                </p>
              </div>
            </div>
            <i class="fas fa-chevron-down step-accordion-chevron"></i>
          </button>

          <div class="step-accordion-outer">
            <div class="step-accordion-inner step-practical-content step-practical-content-premium">
            ${hasFood ? `
              <details class="step-sub-accordion" open>
                <summary class="step-sub-header">
                  <div class="step-sub-header-main">
                    <span class="step-info-badge step-info-badge-food">
                      <span class="step-info-icon">🍽️</span>
                    </span>
                    <div>
                      <span class="step-info-title">Instant Gourmand</span>
                      <span class="step-info-kicker">Où bien manger sans se tromper</span>
                    </div>
                  </div>
                  <i class="fas fa-chevron-down step-sub-chevron"></i>
                </summary>
                <div class="step-sub-body">
                  <p class="step-info-text">${day.gourmandise}</p>
                </div>
              </details>
            ` : ''}

            ${hasAccom ? `
              <details class="step-sub-accordion">
                <summary class="step-sub-header">
                  <div class="step-sub-header-main">
                    <span class="step-info-badge step-info-badge-hotel">
                      <span class="step-info-icon">🏨</span>
                    </span>
                    <div>
                      <span class="step-info-title">Où poser ses valises ?</span>
                      <span class="step-info-kicker">Nos adresses testées et approuvées</span>
                    </div>
                  </div>
                  <i class="fas fa-chevron-down step-sub-chevron"></i>
                </summary>
                <div class="step-sub-body">
                  <p class="step-info-text">${window.getAccomPreviewText
          ? window.getAccomPreviewText(day.hebergement_options)
          : (typeof day.hebergement_options === 'string'
            ? day.hebergement_options
            : 'Voir les options')
        }</p>
                </div>
              </details>
            ` : ''}

            ${hasAdvice ? `
              <details class="step-sub-accordion">
                <summary class="step-sub-header">
                  <div class="step-sub-header-main">
                    <span class="step-info-badge step-info-badge-tip">
                      <span class="step-info-icon">💡</span>
                    </span>
                    <div>
                      <span class="step-info-title">Le Conseil Expert</span>
                      <span class="step-info-kicker">Le petit hack qui change tout</span>
                    </div>
                  </div>
                  <i class="fas fa-chevron-down step-sub-chevron"></i>
                </summary>
                <div class="step-sub-body">
                  <p class="step-info-text">${day.astuce}</p>
                </div>
              </details>
            ` : ''}
            </div>
          </div>
        </div>
      `;
  };

  // GLOBAL: Expose for setInterval usage
  window.forceRecalculateHeight = function (container) {
    const outer = container.querySelector('.step-accordion-outer');
    const inner = container.querySelector('.step-accordion-inner');

    if (!container.classList.contains('open') || !outer || !inner) return;

    void inner.offsetHeight; // Force reflow
    const newHeight = inner.scrollHeight;
    outer.style.maxHeight = (newHeight + 50) + 'px';
  };

  const forceRecalculateHeight = window.forceRecalculateHeight;

  function attachAccordionListeners() {
    document.querySelectorAll('.step-accordion-toggle-btn').forEach(btn => {
      // Prevent multiple attachments
      if (btn.dataset.hasListener) return;
      btn.dataset.hasListener = 'true';

      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // SOL 1: ISOLATION
        toggleStepAccordion(btn);
      });
    });

    // Écouter TOUS les <details> pour les sous-accordéons
    document.querySelectorAll('.step-sub-accordion').forEach(details => {
      if (details.dataset.hasListener) return;
      details.dataset.hasListener = 'true';

      details.addEventListener('toggle', (e) => {
        e.stopPropagation();

        const parentAccordion = details.closest('.step-accordion');
        if (!parentAccordion) return;

        setTimeout(() => {
          forceRecalculateHeight(parentAccordion);
        }, 50);

        requestAnimationFrame(() => {
          forceRecalculateHeight(parentAccordion);
        });
      });
    });
  }

  // Toggle Function for new Premium Accordion with ResizeObserver
  function toggleStepAccordion(btn) {
    const container = btn.closest('.step-accordion');
    if (!container) return;

    const outer = container.querySelector('.step-accordion-outer');
    const inner = container.querySelector('.step-accordion-inner');
    // Safety check: if outer/inner not found (old HTML), fallback to old toggle
    if (!outer || !inner) {
      container.classList.toggle('open');
      return;
    }

    const isOpen = container.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);

    if (isOpen) {
      // 1. Initial set to allow measurement
      outer.style.maxHeight = 'none';

      // 2. Setup ResizeObserver
      if (!accordionObservers.has(container)) {
        const observer = new ResizeObserver(entries => {
          for (let entry of entries) {
            requestAnimationFrame(() => {
              if (!container.classList.contains('open')) return;
              // On mobile, CSS override handles this, but for desktop/tablet we keep precise calc
              const height = inner.scrollHeight;
              outer.style.maxHeight = (height + 30) + 'px';
            });
          }
        });
        observer.observe(inner);
        accordionObservers.set(container, observer);
      }

      // Surveillance continue sur mobile
      if (window.innerWidth <= 768) {
        // FORCE STATIC CARDS MODE: Open all sub-details
        container.querySelectorAll('.step-sub-accordion').forEach(details => {
          details.open = true;
        });

        let iterations = 0;
        const mobileInterval = setInterval(() => {
          forceRecalculateHeight(container);
          iterations++;
          if (iterations >= 10) {
            clearInterval(mobileInterval);
          }
        }, 100);
      }

    } else {
      // 1. Clean up
      const observer = accordionObservers.get(container);
      if (observer) {
        observer.disconnect();
        accordionObservers.delete(container);
      }
      // 2. Force close
      outer.style.maxHeight = '0px';
    }
  };

  // Expose for compatibility if needed elsewhere, but internal usage is preferred
  window.toggleStepAccordion = toggleStepAccordion;
  window.attachAccordionListeners = attachAccordionListeners; // For manual re-attachment

  function renderBudget() {
    if (!circuit.budgets) return '';
    return `
            <h2 style="font-family: var(--font-display); margin: 40px 0 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">Budget Estimé</h2>
            <div style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                ${Object.entries(circuit.budgets).map(([key, data]) => `
                    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow);">
                        <h4 style="text-transform: capitalize; color: var(--laterite); margin-bottom: 5px;">${key}</h4>
                        <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 10px;">${data.price}</div>
                        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 15px; min-height: 40px;">${data.desc}</p>
                        <ul style="padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary);">
                            ${data.inclus ? data.inclus.slice(0, 3).map(i => `<li>${i}</li>`).join('') : ''}
                        </ul>
                    </div>
                `).join('')}
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 15px; text-align: center;">* Prix par personne sur base double. Hors vols internationaux.</p>
        `;
  }

  function getAccomText(options) {
    if (typeof options === 'object' && !Array.isArray(options)) {
      return Object.values(options).map(v => (typeof v === 'object' ? v.text : v).split('(')[0]).join(' / ');
    }
    return options;
  }

  render();
});
