/* ==========================================================================
   06-menu-state.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   MENU BLOGU — 1/3: durum, ag katmani ve gorsel tembelligi.
   DIKKAT: Bu dosya `if (menuGrid) {` blogunun bir parcasidir;
   blogun kapanisi 08-menu-boot.js dosyasindadir. Tek basina
   calistirilamaz, build.js tarafindan birlestirilir.
   - menuGrid / menuItems referanslari, currentView, kategori DOM onbellegi
   - Ag hizina gore gorsel kalitesi (getNetworkTier)
   - prefetchImages (hover/touch oncesi on yukleme)
   - setupLazyImages (data-src -> src, IntersectionObserver)
   Bagimlilik: normalizeImageUrl.
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */

    if (menuGrid) {
        let currentView = 'categories';
        let activeCategory = null;
        let categoriesDomCache = null; // HTML cache for instant back-navigation
        let renderedCategoriesLang = 'tr'; // menu.html SSR baslangicta Turkce basilir
        window._invalidateCategoryCache = function() {
            categoriesDomCache = null;
            renderedCategoriesLang = null;
        };

        // Network-aware loading tier detection
        function getNetworkTier() {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!conn) return 'fast';
            if (conn.saveData) return 'save-data';
            const ect = conn.effectiveType;
            if (ect === 'slow-2g' || ect === '2g') return 'slow';
            if (ect === '3g') return 'medium';
            return 'fast';
        }

        // Prefetch images in background (lightweight & non-blocking)
        const prefetchedUrls = new Set();
        function prefetchImages(urls) {
            if (!urls || urls.length === 0) return;
            const doPrefetch = () => {
                urls.forEach(url => {
                    if (!url || url.trim() === '' || prefetchedUrls.has(url)) return;
                    prefetchedUrls.add(url);
                    const img = new Image();
                    img.src = url;
                });
            };
            if ('requestIdleCallback' in window) {
                requestIdleCallback(doPrefetch);
            } else {
                setTimeout(doPrefetch, 60);
            }
        }

        // IntersectionObserver for staggered lazy image loading
        let lazyImageObserver = null;
        function setupLazyImages(container) {
            if (lazyImageObserver) lazyImageObserver.disconnect();
            const tier = getNetworkTier();
            const rootMargin = tier === 'slow' ? '600px' : tier === 'medium' ? '400px' : '300px';

            lazyImageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        lazyImageObserver.unobserve(img);
                    }
                });
            }, { rootMargin });

            container.querySelectorAll('img[data-src]').forEach(img => {
                lazyImageObserver.observe(img);
            });
        }

        // Event delegation for category card clicks (persists across DOM cache restore)
        menuGrid.addEventListener('click', (e) => {
            if (currentView !== 'categories') return;
            const card = e.target.closest('.qr-category-card[data-category-id]');
            if (card) {
                activeCategory = card.dataset.categoryId;
                // Main thread'i serbest bırakıp INP'yi iyileştirmek için asenkron çağrı
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        renderMenu();
                    });
                });
            }
        });

        // HTML sanitizasyon helper