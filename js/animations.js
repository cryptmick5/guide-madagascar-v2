/**
 * 🎨 GASIKARA ANIMATIONS
 * Professional animation manager using GSAP
 */

class GasikaraAnimations {

    // ==========================================
    // INITIALIZATION
    // ==========================================

    static init() {
        console.log('🎨 Initializing Gasikara Animations...');

        // Check for reduced motion
        if (shouldReduceMotion()) {
            console.log(' ⚠️ Reduced motion enabled - animations disabled');
            gsap.globalTimeline.timeScale(0);
            return;
        }

        // (force3D retiré : une couche GPU par carte × 260 cartes ralentissait les mobiles)

        // Initialize all animation systems
        this.initCardHovers();
        this.initScrollReveals();

        console.log('✅ Animations initialized');
    }

    /**
     * Refresh animations for dynamically loaded cards
     * Call this after filtering or page navigation
     */
    static refresh() {
        console.log('🔄 Refreshing animations...');

        // Kill existing ScrollTriggers
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());

        // Re-initialize (les survols ne sont branchés qu'une fois)
        this.initCardHovers();
        this.initScrollReveals();

        console.log('✅ Animations refreshed');
    }

    // ==========================================
    // CARD ANIMATIONS
    // ==========================================

    /**
     * Initialize hover effects on location cards
     */
    static initCardHovers() {
        // Une seule paire d'écouteurs pour toutes les cartes (délégation), et seulement
        // sur les appareils qui ont un vrai survol (pas les écrans tactiles).
        if (this._hoversReady) return;
        this._hoversReady = true;
        if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;

        const carte = e => (e.target && e.target.closest) ? e.target.closest('.lieu-card') : null;

        document.addEventListener('mouseover', e => {
            const card = carte(e);
            if (!card || (e.relatedTarget && card.contains(e.relatedTarget)) || shouldReduceMotion()) return;
            gsap.to(card, {
                y: GSAP_CONFIG.cards.hoverLift,
                scale: GSAP_CONFIG.cards.hoverScale,
                boxShadow: GSAP_CONFIG.cards.hoverShadow,
                duration: GSAP_CONFIG.cards.hoverDuration,
                ease: GSAP_CONFIG.cards.hoverEase
            });
        });

        document.addEventListener('mouseout', e => {
            const card = carte(e);
            if (!card || (e.relatedTarget && card.contains(e.relatedTarget)) || shouldReduceMotion()) return;
            gsap.to(card, {
                y: 0,
                scale: 1,
                boxShadow: 'var(--shadow)',
                duration: GSAP_CONFIG.cards.hoverDuration,
                ease: GSAP_CONFIG.cards.hoverEase
            });
        });
    }

    /**
     * Stagger reveal animation for cards
     * @param {string} selector - Cards selector
     */
    static revealCards(selector = '.lieu-card') {
        if (shouldReduceMotion()) return;

        const cards = document.querySelectorAll(selector);

        gsap.from(cards, {
            opacity: 0,
            y: GSAP_CONFIG.cards.revealY,
            stagger: {
                amount: GSAP_CONFIG.cards.staggerAmount,
                from: GSAP_CONFIG.cards.staggerFrom,
                ease: 'power1.out'
            },
            duration: GSAP_CONFIG.cards.revealDuration,
            ease: GSAP_CONFIG.cards.hoverEase,
            clearProps: 'all' // Clean up inline styles after animation
        });

        console.log(`  ✓ Revealed ${cards.length} cards with stagger`);
    }

    // ==========================================
    // MODAL ANIMATIONS
    // ==========================================

    /**
     * Animate modal opening with orchestrated timeline
     * @param {HTMLElement} modal - Modal element
     */
    static openModal(modal) {
        if (shouldReduceMotion()) {
            modal.style.display = 'flex';
            return;
        }

        const tl = gsap.timeline();
        const overlay = modal;
        const content = modal.querySelector('.modal-content');
        const header = modal.querySelector('.modal-hero-header, .modal-header-image');
        const infoItems = modal.querySelectorAll('.modal-info-grid > *, .modal-meta-row > *');
        const buttons = modal.querySelectorAll('.btn-action-primary, .btn-action-green, .btn-action-red');

        // Ensure modal is visible
        modal.style.display = 'flex';

        tl.from(overlay, {
            opacity: 0,
            duration: GSAP_CONFIG.modal.backdropFade,
            ease: 'none'
        }, 0)
            .from(content, {
                scale: GSAP_CONFIG.modal.contentScale.from,
                opacity: 0,
                y: GSAP_CONFIG.modal.contentY,
                duration: GSAP_CONFIG.modal.openDuration,
                ease: GSAP_CONFIG.modal.ease.open
            }, '-=0.2')
            .from(header, {
                opacity: 0,
                y: -20,
                duration: 0.3
            }, '-=0.2')
            // CRITICAL FIX: Ensure final opacity is explicitly set
            .set(overlay, { opacity: 1 })
            .set(content, { opacity: 1 });

        // Stagger info items if they exist
        if (infoItems.length > 0) {
            tl.from(infoItems, {
                opacity: 0,
                y: 15,
                stagger: GSAP_CONFIG.modal.stagger,
                duration: 0.3
            }, '-=0.15');
        }

        // Animate buttons if they exist
        if (buttons.length > 0) {
            tl.from(buttons, {
                opacity: 0,
                scale: 0.9,
                stagger: 0.1,
                duration: 0.2
            }, '-=0.1');
        }

        console.log('  ✓ Modal opened with animation');
    }

    /**
     * Animate modal closing
     * @param {HTMLElement} modal - Modal element
     * @param {Function} callback - Callback after animation
     */
    static closeModal(modal, callback) {
        if (shouldReduceMotion()) {
            modal.style.display = 'none';
            if (callback) callback();
            return;
        }

        const content = modal.querySelector('.modal-content');

        gsap.to(content, {
            scale: 0.9,
            opacity: 0,
            duration: GSAP_CONFIG.modal.closeDuration,
            ease: GSAP_CONFIG.modal.ease.close,
            onComplete: () => {
                modal.style.display = 'none';
                if (callback) callback();
            }
        });

        gsap.to(modal, {
            opacity: 0,
            duration: GSAP_CONFIG.modal.closeDuration,
            ease: 'none'
        });

        console.log('  ✓ Modal closed with animation');
    }

    // ==========================================
    // FILTER TRANSITIONS
    // ==========================================

    /**
     * Smooth transition when switching filters
     * @param {Function} updateCallback - Function to update DOM
     * @param {string} cardSelector - Cards selector
     */
    static filterTransition(updateCallback, cardSelector = '.lieu-card') {
        if (shouldReduceMotion()) {
            updateCallback();
            return;
        }

        const cards = document.querySelectorAll(cardSelector);
        const tl = gsap.timeline();

        // Fade out current cards
        tl.to(cards, {
            opacity: 0,
            scale: GSAP_CONFIG.filters.fadeOutScale,
            stagger: 0.03,
            duration: GSAP_CONFIG.filters.fadeOutDuration,
            ease: 'power2.in'
        })
            // Update DOM
            .call(updateCallback)
            // Fade in new cards
            .to(cardSelector, {
                opacity: 1,
                scale: 1,
                stagger: {
                    amount: GSAP_CONFIG.filters.staggerAmount,
                    from: GSAP_CONFIG.filters.staggerFrom
                },
                duration: GSAP_CONFIG.filters.fadeInDuration,
                ease: GSAP_CONFIG.filters.badgeBounce
            });

        console.log('  ✓ Filter transition animated');
    }

    /**
     * Animate filter badge activation
     * @param {HTMLElement} badge - Badge element
     */
    static activateFilterBadge(badge) {
        if (shouldReduceMotion()) return;

        gsap.fromTo(badge,
            { scale: 0.95 },
            {
                scale: 1,
                duration: 0.3,
                ease: GSAP_CONFIG.filters.badgeBounce
            }
        );
    }

    // ==========================================
    // MICRO-INTERACTIONS
    // ==========================================

    /**
     * Button pulse effect on click
     * @param {HTMLElement} button - Button element
     */
    static buttonPulse(button) {
        if (shouldReduceMotion()) return;

        gsap.fromTo(button,
            { scale: 0.95 },
            {
                scale: 1,
                duration: GSAP_CONFIG.buttons.duration,
                ease: GSAP_CONFIG.buttons.ease
            }
        );
    }

    /**
     * Tag hover pulse
     * @param {HTMLElement} tag - Tag element
     */
    static tagHover(tag, isEnter) {
        if (shouldReduceMotion()) return;

        gsap.to(tag, {
            scale: isEnter ? 1.05 : 1,
            duration: 0.2,
            ease: 'power2.out'
        });
    }

    // ==========================================
    // SCROLL ANIMATIONS
    // ==========================================

    /**
     * Initialize scroll-triggered reveals
     */
    static initScrollReveals() {
        if (shouldReduceMotion()) return;

        // Uniquement les cartes de la page affichée, et jamais deux fois la même carte
        const cards = Array.from(document.querySelectorAll('.page-section.active .lieu-card'))
            .filter(c => !c.dataset.revealed && c.offsetParent !== null);
        if (!cards.length) return;
        cards.forEach(c => { c.dataset.revealed = '1'; });

        ScrollTrigger.batch(cards, {
            onEnter: batch => {
                gsap.from(batch, {
                    opacity: 0,
                    y: GSAP_CONFIG.cards.revealY,
                    stagger: {
                        amount: GSAP_CONFIG.cards.staggerAmount,
                        from: GSAP_CONFIG.cards.staggerFrom,
                        ease: 'power1.out'
                    },
                    duration: GSAP_CONFIG.cards.revealDuration,
                    ease: GSAP_CONFIG.cards.hoverEase,
                    overwrite: 'auto'
                });
            },
            start: 'top 85%',
            once: true // Only animate once
        });

        console.log('  ✓ Scroll reveals initialized for cards');
    }

    // ==========================================
    // UTILITY
    // ==========================================

    /**
     * Kill all animations (cleanup)
     */
    static killAll() {
        gsap.killTweensOf('*');
        console.log('  ✓ All animations killed');
    }
}

// ==========================================
// AUTO-INITIALIZATION
// ==========================================
// Sans GSAP (hors ligne au premier lancement, CDN bloqué), on n'exporte rien :
// app.js bascule alors sur ses replis sans animation et tout reste cliquable.
if (window.GSAP_DISPONIBLE) {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            GasikaraAnimations.init();
        }, 100);
    });

    // ==========================================
    // EXPORT
    // ==========================================
    window.GasikaraAnimations = GasikaraAnimations;
} else {
    console.warn('GSAP indisponible : animations désactivées');
}

console.log('🎨 Gasikara Animations loaded - Version 1.0');
