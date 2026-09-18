/* ==========================================================================
   08-menu-boot.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   MENU BLOGU — 3/3: dis arayuz ve baslatma.
   Bu dosya `if (menuGrid) {` blogunu KAPATIR.
   - window.renderCategories / renderMenu / getCurrentView (onclick uyumu)
   - history/popstate ile geri tusu davranisi (kategori onbellegi ile aninda donus)
   - Yükleme katmanini gizleme, mobil yapiskan geri cubugu
   - initMenuData: localStorage onbellegi (v6) + Supabase REST tazeleme
   Bagimlilik: renderCategories, renderMenu, categories, menuData.
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */
        // Public API: history-aware wrapper for back button / onclick handlers
        window.renderCategories = function() {
            if (currentView === 'items') {
                history.back(); // triggers popstate → renderCategories() with cache restore
            } else {
                renderCategories();
            }
        };

        // Global functions for onclick and language switcher
        window.renderMenu = renderMenu;
        window.getCurrentView = () => currentView;

        // Loading overlay'i gizle
        function hideLoadingOverlay() {
            const overlay = document.getElementById('page-loading-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
                // Animasyon bitince DOM'dan kaldır
                setTimeout(() => overlay.remove(), 600);
            }
        }

        // Resize listener to handle responsive sticky bar cleanup
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                const stickyBar = document.getElementById('qr-sticky-back');
                if (stickyBar) stickyBar.remove();
                document.body.classList.remove('has-sticky-back');
            } else if (currentView === 'items') {
                const existingBar = document.getElementById('qr-sticky-back');
                if (!existingBar) {
                    const backBtnText = (typeof currentLang !== 'undefined' && translations[currentLang]) ? translations[currentLang].btn_back : '← Geri Dön';
                    const stickyBar = document.createElement('div');
                    stickyBar.id = 'qr-sticky-back';
                    stickyBar.className = 'qr-sticky-back';
                    stickyBar.innerHTML = `<button class="qr-back-btn" onclick="renderCategories()">${backBtnText}</button>`;
                    document.body.appendChild(stickyBar);
                    document.body.classList.add('has-sticky-back');
                }
            }
        });

        // Prefetch all remaining menu and category images when browser is idle
        function triggerIdlePrefetch() { /* on-demand only */ }



        // Initialize with Supabase (if configured) or fallback to static with caching (Stale-While-Revalidate)
        async function initMenuData() {
            // Clean up legacy cache keys to prevent stale menu presentation
            ['felek_categories', 'felek_menu_items', 'felek_categories_v2', 'felek_menu_items_v2', 'felek_categories_v3', 'felek_menu_items_v3', 'felek_categories_v5', 'felek_menu_items_v5'].forEach(k => localStorage.removeItem(k));

            const cachedCats = localStorage.getItem('felek_categories_v6');
            const cachedItems = localStorage.getItem('felek_menu_items_v6');
            if (cachedCats && cachedItems) {
                try {
                    categories = JSON.parse(cachedCats);
                    menuData = JSON.parse(cachedItems);
                    // Ana yemekler için tekrarlanan (Kg) veya (1 Kg) takılarını temizle
                    menuData.forEach(item => {
                        if (item.categoryId === 'ana_yemekler' && item.title) {
                            if (item.title.tr) item.title.tr = item.title.tr.replace(/\s*\(\s*(?:1\s*)?kg\s*\)/gi, '').trim() + ' (Kg)';
                            if (item.title.en) item.title.en = item.title.en.replace(/\s*\(\s*(?:1\s*)?kg\s*\)/gi, '').trim() + ' (Kg)';
                            if (item.title.ar) item.title.ar = item.title.ar.replace(/\s*\(\s*(?:1\s*)?كجم\s*\)/gi, '').trim() + ' (كجم)';
                            if (item.title.ru) item.title.ru = item.title.ru.replace(/\s*\(\s*(?:1\s*)?кг\s*\)/gi, '').trim() + ' (кг)';
                        }
                    });
                } catch(e) {
                    console.error('Error loading cached data:', e);
                }
            }

            // Çizimi hemen başlat ve yükleme ekranını hemen kaldır (Gecikme 0'a indirilir)
            renderCategories();
            hideLoadingOverlay();
            triggerIdlePrefetch(); // Start prefetching cached images immediately

            
            async function fetchSupabaseViaRest() {
                if (!window.SUPABASE_URL || window.SUPABASE_URL === 'BURAYA_SUPABASE_URL_GELECEK') return;
                
                const headers = {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                };
                const baseUrl = `${window.SUPABASE_URL}/rest/v1`;

                try {
                    const [catRes, itemRes] = await Promise.all([
                        fetch(`${baseUrl}/categories?select=*&order=sort_order.asc`, { headers }),
                        fetch(`${baseUrl}/menu_items?select=*&is_active=eq.true&order=sort_order.asc`, { headers })
                    ]);

                    if (!catRes.ok || !itemRes.ok) {
                        console.error('Supabase REST Hatası');
                        return;
                    }

                    const catData = await catRes.json();
                    const itemData = await itemRes.json();

                    if (catData && itemData) {
                        const newCategories = catData.map(c => ({
                            id: c.id,
                            image: normalizeImageUrl(c.image)
                        }));
                        
                        const newMenuData = itemData.map(item => {
                            let nameTr = item.name_tr || '';
                            let nameEn = item.name_en || '';
                            let nameAr = item.name_ar || '';
                            let nameRu = item.name_ru || '';

                            if (item.category_id === 'ana_yemekler') {
                                if (nameTr) nameTr = nameTr.replace(/\s*\(\s*(?:1\s*)?kg\s*\)/gi, '').trim() + ' (Kg)';
                                if (nameEn) nameEn = nameEn.replace(/\s*\(\s*(?:1\s*)?kg\s*\)/gi, '').trim() + ' (Kg)';
                                if (nameAr) nameAr = nameAr.replace(/\s*\(\s*(?:1\s*)?كجم\s*\)/gi, '').trim() + ' (كجم)';
                                if (nameRu) nameRu = nameRu.replace(/\s*\(\s*(?:1\s*)?кг\s*\)/gi, '').trim() + ' (кг)';
                            }

                            return {
                                categoryId: item.category_id,
                                title: { tr: nameTr, en: nameEn, ar: nameAr, ru: nameRu },
                                price: item.price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.price) : '',
                                extras: { tr: item.extras_tr, en: item.extras_en, ar: item.extras_ar, ru: item.extras_ru },
                                image: normalizeImageUrl(item.image)
                            };
                        });

                        const catsStr = JSON.stringify(newCategories);
                        const itemsStr = JSON.stringify(newMenuData);

                        if (catsStr !== cachedCats || itemsStr !== cachedItems) {
                            categories = newCategories;
                            menuData = newMenuData;
                            localStorage.setItem('felek_categories_v6', catsStr);
                            localStorage.setItem('felek_menu_items_v6', itemsStr);
                            
                            // translations.js top-level `const` ile tanimli oldugu icin
                            // window.translations HER ZAMAN undefined'dir; sozluge ancak
                            // bare identifier ile erisilebilir (bkz. menu.html inline script).
                            if (typeof translations !== 'undefined') {
                                catData.forEach(c => {
                                    if (translations.tr && c.name_tr) translations.tr['cat_' + c.id] = c.name_tr;
                                    if (translations.en && c.name_en) translations.en['cat_' + c.id] = c.name_en;
                                    if (translations.ar && c.name_ar) translations.ar['cat_' + c.id] = c.name_ar;
                                    if (translations.ru && c.name_ru) translations.ru['cat_' + c.id] = c.name_ru;
                                });
                            }
                            
                            if (currentView === 'categories') {
                                renderCategories();
                            } else if (currentView === 'items') {
                                renderMenu();
                            }
                            triggerIdlePrefetch(); // Restart prefetching with updated database content
                        }
                    }
                } catch(e) {
                    console.error("Supabase REST bağlantı hatası:", e);
                }
            }

            if (window.SUPABASE_URL && window.SUPABASE_URL !== 'BURAYA_SUPABASE_URL_GELECEK') {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(fetchSupabaseViaRest);
                } else {
                    setTimeout(fetchSupabaseViaRest, 1000);
                }
            }
        }

        initMenuData();
    }