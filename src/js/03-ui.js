/* ==========================================================================
   03-ui.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   Sayfa iskeleti etkilesimleri:
   - Vitrin karuselleri (initCarousel) ve bfcache temizligi
   - Mobil hamburger menu (<details> + aria-expanded + Escape)
   - Kaydirinca header'in kuculmesi (tek rAF ile, INP dostu)
   - IntersectionObserver ile .reveal animasyonlari ve hero fallback
   Bagimlilik: yok.
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */

    // --- Carousel Sliders ---
    let carouselIntervals = [];

    function initCarousel(trackId, interval) {
        const track = document.getElementById(trackId);
        if (track) {
            const slides = track.querySelectorAll('.carousel-img');
            if (slides.length <= 1) return;
            let currentIndex = 0;
            
            const intervalId = setInterval(() => {
                currentIndex = (currentIndex + 1) % slides.length;
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
            }, interval);
            carouselIntervals.push(intervalId);
        }
    }

    // Cleanup carousel intervals on page hide (preserves bfcache)
    window.addEventListener('pagehide', () => {
        carouselIntervals.forEach(id => clearInterval(id));
    });
    
    // Init venue carousel with 3s interval
    initCarousel('carousel-track', 3000);
    
    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const headerNav = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-links a');

    if (menuToggle && headerNav) {
        menuToggle.addEventListener('click', () => {
            headerNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
            const isOpen = menuToggle.classList.contains('active');
            
            // Dynamic a11y label toggle on click
            const toggleKey = isOpen ? 'aria_menu_toggle_close' : 'aria_menu_toggle_open';
            if (translations[currentLang] && translations[currentLang][toggleKey]) {
                menuToggle.setAttribute('aria-label', translations[currentLang][toggleKey]);
            } else {
                menuToggle.setAttribute('aria-expanded', isOpen);
            }
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                headerNav.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    // --- Footer year (kept in sync with js/site.js used on the landing pages) ---
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // --- Sticky Header ---
    const header = document.getElementById('header');
    
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

    // --- Reveal Animations ---
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));

    // Hero instant reveal on load
    window.addEventListener('load', () => {
      document.querySelectorAll('.hero .reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 200 + i * 150);
      });
    });

