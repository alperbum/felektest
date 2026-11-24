/* ==========================================================================
   07-menu-render.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   MENU BLOGU — 2/3: cizim.
   DIKKAT: 06-menu-state.js ile ayni `if (menuGrid)` blogunun parcasi.
   - escapeHtml / getLocalized yardimcilari
   - revealCardsWhenReady: gorseller hazir olunca kartlari acar
   - renderCategories: kategori kart izgarasi (ilk 2 gorsel eager = LCP)
   - renderMenu: secili kategorinin urunleri (DocumentFragment ile tek yazim)
   Bagimlilik: categories, menuData, translations, escapeHtml.
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */
        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Localized veriyi çeken yardımcı fonksiyon
        function getLocalized(obj) {
            if (!obj) return '';
            if (typeof obj === 'string') return obj;
            const lang = (typeof currentLang !== 'undefined') ? currentLang : 'tr';
            return obj[lang] || obj['tr'] || '';
        }

        // Görselleri ve kartları asenkron ve bağımsız olarak yükle
        function revealCardsWhenReady(container, imageSelector) {
            return new Promise(resolve => {
                // Kartları hemen görünür yap (CSS transition-delay ile stagger efekti korunur)
                container.querySelectorAll('.qr-category-card, .qr-card').forEach(c => {
                    c.classList.add('visible');
                });

                const images = container.querySelectorAll(imageSelector);
                if (images.length === 0) {
                    resolve();
                    return;
                }

                images.forEach(img => {
                    const wrapper = img.closest('.qr-card-img-wrapper') || img.closest('.qr-category-card');
                    
                    function handleImgLoad() {
                        img.classList.add('loaded');
                        if (wrapper) {
                            wrapper.classList.remove('loading');
                        }
                    }

                    if (img.complete) {
                        handleImgLoad();
                    } else {
                        img.addEventListener('load', handleImgLoad, { once: true });
                        img.addEventListener('error', () => {
                            if (wrapper) {
                                wrapper.classList.remove('loading');
                            }
                        }, { once: true });
                    }
                });
                resolve();
            });
        }

        // Ana Menü (Kategoriler Kart Grid)
        function renderCategories() {
            currentView = 'categories';

            // Sticky back bar'u kaldır
            const stickyBar = document.getElementById('qr-sticky-back');
            if (stickyBar) stickyBar.remove();
            document.body.classList.remove('has-sticky-back');

            // UX optimization: Reset scroll to top asynchronously to avoid forced reflow
            if (window.scrollY > 0) {
                requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                });
            }

            // Restore from cache for instant back-navigation (fixes iOS swipe-back flicker)
            if (categoriesDomCache) {
                menuGrid.innerHTML = categoriesDomCache;
                categoriesDomCache = null;
                // Images already have .loaded class from cache, re-setup load handlers for safety
                revealCardsWhenReady(menuGrid, '.qr-category-card img');
                return;
            }

            // If already rendered in target language (SSR / instant paint), reveal cards immediately without wipe
            if (menuGrid.children.length >= 10 && !categoriesDomCache && renderedCategoriesLang === currentLang) {
                revealCardsWhenReady(menuGrid, '.qr-category-card img');
                return;
            }

            menuGrid.innerHTML = '';
            const fragment = document.createDocumentFragment();
            
            categories.forEach((cat, index) => {
                const card = document.createElement('div');
                card.className = 'qr-category-card';
                
                const catName = (typeof currentLang !== 'undefined' && translations[currentLang] && translations[currentLang]['cat_' + cat.id]) 
                                ? translations[currentLang]['cat_' + cat.id] 
                                : cat.id;
                
                const hasImage = cat.image && cat.image !== '';
                if (hasImage) {
                    card.classList.add('loading');
                }
                                
                // Above-the-fold: only first 2 categories load eagerly with high fetch priority; rest are lazy
                const isAboveFold = index < 2;
                const priorityAttr = isAboveFold ? ' fetchpriority="high"' : '';
                const loadingAttr = isAboveFold ? 'loading="eager"' : 'loading="lazy"';
                const imgHtml = hasImage 
                                ? `<img src="${escapeHtml(cat.image)}" alt="${escapeHtml(catName)}" decoding="async" ${loadingAttr} width="600" height="400"${priorityAttr}>` 
                                : ``;

                card.dataset.categoryId = cat.id;
                card.innerHTML = `
                    ${imgHtml}
                    <h2 class="qr-category-card-title">${escapeHtml(catName)}</h2>
                `;

                // Prefetch first 4 item images on hover/touch (preloads before click)
                const prefetchHandler = () => {
                    const catItems = menuData.filter(i => i.categoryId === cat.id);
                    prefetchImages(catItems.slice(0, 4).map(i => i.image).filter(Boolean));
                };
                card.addEventListener('mouseenter', prefetchHandler, { once: true });
                card.addEventListener('touchstart', prefetchHandler, { once: true, passive: true });

                fragment.appendChild(card);
            });

            menuGrid.appendChild(fragment);
            renderedCategoriesLang = (typeof currentLang !== 'undefined') ? currentLang : 'tr';

            // Görseller hazır olunca kartları göster
            revealCardsWhenReady(menuGrid, '.qr-category-card img');
        }

        // iOS Safari swipe-back önleme + touch ile geri navigasyon
        let touchStartX = 0;
        let touchStartY = 0;
        const SWIPE_THRESHOLD = 60;   // px - ne kadar kaydırılırsa tetiklensin
        const EDGE_ZONE = 40;         // px - ekranın sol kenarından bu kadar içeride başlarsa edge swipe sayılır

        document.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            if (currentView !== 'items') return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            // Yatay hareket baskın, soldan sağa, yeterli mesafe
            if (dx > SWIPE_THRESHOLD && Math.abs(dy) < Math.abs(dx) * 0.6) {
                if (touchStartX < EDGE_ZONE) {
                    // Edge swipe: Native tarayıcı geri gitme hareketini tetikler.
                    // Çift gitmeyi (double-back) önlemek için burada history.back() çağırmıyoruz,
                    // tarayıcının popstate tetiklemesini bekliyoruz.
                    return;
                }
                // Ekranın ortasından kaydırma: Tarayıcı bunu algılamaz, biz manuel tetikleriz.
                renderCategories();
            }
        }, { passive: true });

        // History API: Tarayıcı geri/ileri ve iOS swipe-back (cache-aware)
        window.addEventListener('popstate', function(e) {
            const state = e.state;
            if (state && state.view === 'items') {
                activeCategory = state.categoryId;
                renderMenu();
            } else {
                renderCategories();
            }
        });

        // Alt Menü (Seçili Kategorinin Ürünleri)
        function renderMenu() {
            // Cache categories DOM for instant back-navigation (iOS swipe-back fix)
            if (currentView === 'categories' && menuGrid.children.length > 0) {
                categoriesDomCache = menuGrid.innerHTML;
            }

            currentView = 'items';
            if (lazyImageObserver) lazyImageObserver.disconnect();
            menuGrid.innerHTML = '';

            // UX optimization: Reset scroll to top asynchronously to avoid forced reflow
            if (window.scrollY > 0) {
                requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                });
            }

            // History state push: Safari swipe-back bu state'i poplatır
            if (!history.state || history.state.view !== 'items' || history.state.categoryId !== activeCategory) {
                history.pushState({ view: 'items', categoryId: activeCategory }, '');
            }

            // Sticky geri dön butonu (mobil için)
            const backBtnText = (typeof currentLang !== 'undefined' && translations[currentLang]) ? translations[currentLang].btn_back : '← Geri Dön';
            if (window.matchMedia('(max-width: 768px)').matches) {
                // Var olan sticky barı kaldır
                const existingBar = document.getElementById('qr-sticky-back');
                if (existingBar) existingBar.remove();

                const stickyBar = document.createElement('div');
                stickyBar.id = 'qr-sticky-back';
                stickyBar.className = 'qr-sticky-back';
                const waBtnText = (typeof currentLang !== 'undefined' && translations[currentLang] && translations[currentLang].nav_reservation) || 'Rezervasyon';
                stickyBar.innerHTML = `<button class="qr-back-btn" onclick="renderCategories()">${backBtnText}</button><a href="https://wa.me/905397776067?text=Merhaba%2C%20Felek%20Mangalba%C5%9F%C4%B1%20i%C3%A7in%20masa%20rezervasyonu%20yapmak%20istiyorum." target="_blank" rel="noopener noreferrer" class="qr-sticky-wa">${waBtnText}</a>`;
                document.body.appendChild(stickyBar);
                document.body.classList.add('has-sticky-back');
            }
            
            // Geri Dön Butonu - grid içinde üstte (desktop)
            const fragment = document.createDocumentFragment();
            const backBtnContainer = document.createElement('div');
            backBtnContainer.style.gridColumn = '1 / -1';
            backBtnContainer.className = 'qr-back-desktop';
            backBtnContainer.innerHTML = `<button class="qr-back-btn" onclick="renderCategories()">${backBtnText}</button>`;
            fragment.appendChild(backBtnContainer);

            const filteredItems = menuData.filter(item => item.categoryId === activeCategory);
            
            if (filteredItems.length === 0) {
                const emptyMsg = (typeof currentLang !== 'undefined' && translations[currentLang]) ? translations[currentLang].empty_category : 'Bu kategoride henüz ürün bulunmamaktadır.';
                menuGrid.innerHTML += `<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1; padding: 2rem;">${emptyMsg}</p>`;
                return;
            }

            // --- GRUPLAMA MANTIĞI ---
            const groupableCategories = ['raki', 'viski', 'votka_cin', 'sarap', 'biralar'];
            let groupedItems = [];
            
            if (groupableCategories.includes(activeCategory)) {
                let groups = {};
                
                function cleanClSuffix(name) {
                    if (!name) return '';
                    let cleaned = name.replace(/\s*\b(?:\(?\d+(?:,\d+)?\s*(?:cl|kg|l|litre|сл|سل)\.?\)?)\b/gi, '');
                    cleaned = cleaned.replace(/\s*\(\s*Kg\s*\)/gi, '');
                    return cleaned.replace(/\s+/g, ' ').trim();
                }

                filteredItems.forEach(item => {
                    const titleTr = item.title.tr || '';
                    const clMatch = titleTr.match(/\s+(\d+(?:,\d+)?\s*(?:cl|сл|سل)\.?)\b/i);
                    
                    if (clMatch) {
                        const sizeStr = clMatch[1].trim();
                        const baseName = cleanClSuffix(titleTr);
                        
                        if (!groups[baseName]) {
                            groups[baseName] = {
                                isGroup: true,
                                baseName: baseName,
                                title: {
                                    tr: baseName,
                                    en: cleanClSuffix(item.title.en) || baseName,
                                    ar: cleanClSuffix(item.title.ar) || baseName,
                                    ru: cleanClSuffix(item.title.ru) || baseName
                                },
                                image: item.image,
                                categoryId: item.categoryId,
                                variants: []
                            };
                        }
                        groups[baseName].variants.push({
                            size: sizeStr,
                            price: item.price,
                            extras: item.extras,
                            originalItem: item
                        });
                    } else {
                        groupedItems.push(item);
                    }
                });
                
                for (let key in groups) {
                    let group = groups[key];
                    if (group.variants.length >= 2) {
                        group.variants.sort((a, b) => {
                            let aVal = parseFloat(a.size.replace(',', '.'));
                            let bVal = parseFloat(b.size.replace(',', '.'));
                            return bVal - aVal;
                        });
                        groupedItems.push(group);
                    } else if (group.variants.length === 1) {
                        groupedItems.push(group.variants[0].originalItem);
                    }
                }
            } else {
                groupedItems = filteredItems;
            }
            
            // Helper to parse price string for sorting
            function parsePrice(item) {
                let priceStr = '';
                if (item.isGroup && item.variants && item.variants.length > 0) {
                    priceStr = item.variants[0].price;
                } else if (item.price) {
                    priceStr = item.price;
                }
                if (!priceStr) return 0;
                // e.g. "₺3.000,00" -> 3000.00
                return parseFloat(priceStr.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
            }

            // Sort by custom order for Raki, fallback to price descending (Pahalıdan ucuza)
            const customRakiOrder = [
                "Beylerbeyi Göbek",
                "Altın Seri",
                "Efe Gold",
                "Yeni Rakı",
                "Sarı Zeybek",
                "Yeni Seri",
                "Kulüp Rakı"
            ];

            groupedItems.sort((a, b) => {
                if (activeCategory === 'raki') {
                    let nameA = a.isGroup ? a.baseName : (a.title.tr || '');
                    let nameB = b.isGroup ? b.baseName : (b.title.tr || '');
                    
                    let idxA = customRakiOrder.findIndex(r => nameA.includes(r));
                    let idxB = customRakiOrder.findIndex(r => nameB.includes(r));
                    
                    if (idxA === -1) idxA = 999;
                    if (idxB === -1) idxB = 999;
                    
                    if (idxA !== idxB) {
                        return idxA - idxB;
                    }
                }
                return parsePrice(b) - parsePrice(a);
            });

            groupedItems.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'qr-card';
                
                const title = getLocalized(item.title);
                const desc = getLocalized(item.desc);
                const ingredients = getLocalized(item.ingredients);

                let imageHtml = '';
                const hasItemImage = item.image && item.image.trim() !== '';
                if (hasItemImage) {
                    const tier = getNetworkTier();
                    const eagerCount = tier === 'slow' ? 2 : tier === 'medium' ? 3 : 4;
                    const staggerCount = tier === 'slow' ? 4 : 8;

                    if (index < eagerCount) {
                        // First batch: load immediately with high priority
                        const priorityAttr = index < 2 ? ' fetchpriority="high"' : '';
                        imageHtml = `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" class="qr-card-img" decoding="async" loading="eager" width="600" height="450"${priorityAttr}>`;
                    } else if (index < staggerCount) {
                        // Second batch: eager but normal priority
                        imageHtml = `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" class="qr-card-img" decoding="async" loading="eager" width="600" height="450">`;
                    } else {
                        // Third batch: lazy via IntersectionObserver with adaptive rootMargin
                        imageHtml = `<img data-src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" class="qr-card-img" decoding="async" width="600" height="450">`;
                    }
                } else {
                    const placeholderTxt = (typeof currentLang !== 'undefined' && translations[currentLang]) ? translations[currentLang].placeholder_image : 'Görsel Bekleniyor';
                    imageHtml = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.2); font-family:var(--font-heading);">${placeholderTxt}</div>`;
                }

                if (item.isGroup) {
                    let variantsHtml = item.variants.map(v => 
                        `<span class="qr-variant-inline-item"><span style="color:#aaa;">${v.size}</span> <span style="color:var(--primary-color);">${v.price}</span></span>`
                    ).join('<span class="qr-variant-separator">•</span>');

                    card.innerHTML = `
                        <div class="qr-card-img-wrapper${hasItemImage ? ' loading' : ''}">
                            ${imageHtml}
                        </div>
                        <div class="qr-card-content">
                            <div class="qr-card-header">
                                <h3 class="qr-card-title">${title}</h3>
                            </div>
                            <div class="qr-variant-inline-list">
                                ${variantsHtml}
                            </div>
                        </div>
                    `;
                } else {
                    const allergens = getLocalized(item.allergens);
                    let extrasObj = item.extras;
                    let extrasStr = '';
                    if (extrasObj && typeof extrasObj === 'object') {
                       extrasStr = getLocalized(extrasObj);
                    } else if (extrasObj) {
                       extrasStr = extrasObj;
                    }

                    card.innerHTML = `
                        <div class="qr-card-img-wrapper${hasItemImage ? ' loading' : ''}">
                            ${imageHtml}
                            ${item.calories ? `<span class="qr-card-cal">${item.calories}</span>` : ''}
                        </div>
                        <div class="qr-card-content">
                            <div class="qr-card-header">
                                <h3 class="qr-card-title">${title}</h3>
                                ${item.price ? `<span class="qr-card-price">${item.price}</span>` : ''}
                            </div>
                            ${desc ? `<p class="qr-card-desc">${desc}</p>` : ''}
                            ${(ingredients || allergens || (extrasStr && extrasStr.trim() !== '' && extrasStr !== 'undefined')) ? `
                            <div class="qr-card-ingredients">
                                ${ingredients ? `<strong>${(typeof currentLang !== 'undefined' && translations[currentLang]) ? translations[currentLang].ingredients_label : 'İçindekiler:'}</strong> ${ingredients}${(allergens || (extrasStr && extrasStr.trim() !== '' && extrasStr !== 'undefined')) ? '<br>' : ''}` : ''}
                                ${allergens ? `<strong style="color: #ffb44d;">${(typeof currentLang !== 'undefined' && translations[currentLang]) ? translations[currentLang].allergen_label : '⚠️ Alerjen Uyarısı:'}</strong> ${allergens}` : ''}
                                ${extrasStr && extrasStr.trim() !== '' && extrasStr !== 'undefined' ? `<div style="color: #ccc; ${(ingredients || allergens) ? 'margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1);' : ''}"><em>${extrasStr}</em></div>` : ''}
                            </div>` : ''}
                        </div>
                    `;
                }
                fragment.appendChild(card);
            });

            menuGrid.appendChild(fragment);

            // Görseller hazır olunca kartları göster
            revealCardsWhenReady(menuGrid, '.qr-card-img');

            // Setup IntersectionObserver for lazy images (data-src → src when near viewport)
            setupLazyImages(menuGrid);
        }
