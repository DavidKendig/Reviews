// ============================================================
// DAVID KENDIG MEDIA REVIEWS - Ultra Modern Effects
// ============================================================
// Features:
// 1. Dynamic tab content loading from tabs/ directory
// 2. Animated particle canvas background (subtle floating dots)
// 3. Scroll-reveal with staggered card entrance animations
// 4. 3D tilt effect on card hover (follows mouse position)
// 5. Animated tab indicator that slides between tabs
// 6. Cursor glow trail that follows mouse
// 7. Smooth tab content transitions
// 8. Image lazy load fade-in
//
// NOTE: This file is loaded by index.html with defer.
//       All DOM elements are available when this runs.
//       Tab content is fetched from tabs/*.html files.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const isMobile = window.innerWidth < 768;

    // ============================================================
    // 1. PARTICLE CANVAS BACKGROUND
    //    - Subtle floating connected particles
    //    - Lines drawn between nearby particles
    //    - Reduced count on mobile for performance
    // ============================================================
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = isMobile ? 25 : 60;
    const MAX_DIST = isMobile ? 80 : 120;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.3 + 0.1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(88, 166, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    const alpha = (1 - dist / MAX_DIST) * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(88, 166, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ============================================================
    // 2. CURSOR GLOW TRAIL
    //    - Soft radial glow follows the mouse
    //    - Disabled on touch devices (no hover)
    // ============================================================
    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow && !isMobile) {
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
        });
    } else if (cursorGlow) {
        cursorGlow.style.display = 'none';
    }

    // ============================================================
    // 3. ANIMATED TAB INDICATOR (sliding bar)
    // ============================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabIndicator = document.getElementById('tabIndicator');
    const tabNav = document.getElementById('tabNav');

    function moveIndicator(btn) {
        if (!tabIndicator || !tabNav) return;
        const navRect = tabNav.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        tabIndicator.style.left = (btnRect.left - navRect.left + tabNav.scrollLeft) + 'px';
        tabIndicator.style.width = btnRect.width + 'px';
    }

    // Initialize indicator on the active tab
    const initialActive = document.querySelector('.tab-btn.active');
    if (initialActive) {
        requestAnimationFrame(() => moveIndicator(initialActive));
    }

    // Update tab counts based on number of media-cards in each tab
    function updateCounts() {
        tabBtns.forEach(btn => {
            const tabId = btn.dataset.tab;
            const content = document.getElementById(tabId);
            if (content) {
                const count = content.querySelectorAll('.media-card').length;
                btn.querySelector('.tab-count').textContent = count;
            }
        });
    }

    // Tab switching with animation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            moveIndicator(btn);

            // On mobile, scroll the active tab button into view
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

            tabContents.forEach(c => c.classList.remove('active'));
            const target = document.getElementById(btn.dataset.tab);
            if (target) {
                target.classList.add('active');
                // Re-trigger scroll reveal for newly visible cards
                revealCards(target);
                // Re-animate header
                const header = target.querySelector('.tab-header');
                if (header) {
                    header.style.animation = 'none';
                    header.offsetHeight; // force reflow
                    header.style.animation = 'slideUp 0.5s ease forwards';
                }
                // Scroll to top of content on mobile
                if (isMobile) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        });
    });

    // Recalc indicator on resize
    window.addEventListener('resize', () => {
        const active = document.querySelector('.tab-btn.active');
        if (active) moveIndicator(active);
    });

    // ============================================================
    // 4. SCROLL REVEAL - Staggered card entrance
    //    - Cards fade/slide up as they enter viewport
    //    - Staggered delay per card for cascade effect
    // ============================================================
    function revealCards(container) {
        const cards = (container || document).querySelectorAll('.media-card:not(.revealed)');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const siblings = Array.from(card.parentElement.children);
                    const idx = siblings.indexOf(card);
                    const delay = idx * 60;

                    setTimeout(() => {
                        card.classList.add('revealed');
                    }, delay);

                    observer.unobserve(card);
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: '0px 0px -30px 0px'
        });

        cards.forEach(card => observer.observe(card));
    }

    // ============================================================
    // 5. 3D TILT EFFECT ON CARD HOVER
    //    - Card rotates slightly based on mouse position
    //    - Creates depth/parallax feel
    //    - Disabled on mobile (touch devices)
    // ============================================================
    function applyTiltEffect(container) {
        if (isMobile) return;
        (container || document).querySelectorAll('.media-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -3;
                const rotateY = ((x - centerX) / centerX) * 3;

                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }

    // ============================================================
    // 6. IMAGE LAZY LOAD FADE-IN
    //    - Images fade in smoothly when loaded
    //    - Graceful fallback on error
    // ============================================================
    function applyImageFadeIn(container) {
        (container || document).querySelectorAll('.media-poster img').forEach(img => {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.6s ease, transform 0.5s cubic-bezier(0.2, 0, 0.2, 1), filter 0.5s ease';

            if (img.complete) {
                img.style.opacity = '1';
            } else {
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
                img.addEventListener('error', () => {
                    img.parentElement.style.background = 'linear-gradient(135deg, #1a1f2e, #2a3040)';
                    img.style.display = 'none';
                });
            }
        });
    }

    // ============================================================
    // 7. DYNAMIC TAB CONTENT LOADING
    //    - Fetches HTML content from tabs/ directory
    //    - Injects into tab containers
    //    - Applies all effects after content is loaded
    // ============================================================
    const tabFiles = {
        movies: 'tabs/movies.html',
        tv: 'tabs/tv.html',
        books: 'tabs/books.html',
        comics: 'tabs/comics.html',
        videogames: 'tabs/videogames.html',
        boardgames: 'tabs/boardgames.html',
        cardgames: 'tabs/cardgames.html',
        ttrpgs: 'tabs/ttrpgs.html'
    };

    async function loadAllTabs() {
        const loadPromises = Object.entries(tabFiles).map(async ([tabId, filePath]) => {
            const container = document.getElementById(tabId);
            if (!container) return;

            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Failed to load ${filePath}`);
                const html = await response.text();
                container.innerHTML = html;
            } catch (err) {
                console.error(`Error loading tab "${tabId}":`, err);
                container.innerHTML = `<div class="tab-header"><h2>Error</h2><p>Could not load content.</p></div>`;
            }
        });

        await Promise.all(loadPromises);

        // After all tabs are loaded, apply effects
        updateCounts();
        revealCards();
        applyTiltEffect();
        applyImageFadeIn();
    }

    // Load all tab content on startup
    loadAllTabs();

});
