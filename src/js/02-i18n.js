/* ==========================================================================
   02-i18n.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   Cok dillilik: TR / EN / AR / RU.
   - ?lang= URL parametresi ve localStorage ("siteLang") okunur
   - window.applyTranslations(lang) tum [data-i18n] dugumlerini gunceller
   - <html lang> ve dir (RTL) ayarlanir, meta description cevrilir
   - lang-switcher <select> olayi ve GA4 change_language
   Bagimlilik: js/translations.js (bare `translations` nesnesi), GA4 gtag.
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */
    // Support ?lang= URL parameter for hreflang SEO (sitemap.xml)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    let currentLang = urlLang || localStorage.getItem('siteLang') || 'tr';
    if (urlLang) localStorage.setItem('siteLang', urlLang);

    window.applyTranslations = function(lang) {
        if (!translations || !translations[lang]) return;
        currentLang = lang;
        
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translations[lang][key];
                } else {
                    el.innerHTML = translations[lang][key];
                }
            }
        });

        // Update SEO meta tags based on language
        const metaDesc = document.getElementById('meta-description');
        if (metaDesc && translations[lang].seo_description) {
            metaDesc.setAttribute('content', translations[lang].seo_description);
        }
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && translations[lang].seo_title) {
            ogTitle.setAttribute('content', translations[lang].seo_title);
        }
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && translations[lang].seo_description) {
            ogDesc.setAttribute('content', translations[lang].seo_description);
        }

        // a11y labels update
        const menuToggleBtn = document.getElementById('menu-toggle');
        if (menuToggleBtn) {
            const isOpen = menuToggleBtn.classList.contains('active');
            const toggleKey = isOpen ? 'aria_menu_toggle_close' : 'aria_menu_toggle_open';
            if (translations[lang][toggleKey]) {
                menuToggleBtn.setAttribute('aria-label', translations[lang][toggleKey]);
            }
        }
        if (langSwitcher) {
            langSwitcher.setAttribute('aria-label', lang === 'tr' ? 'Dil Seçin' : (lang === 'ar' ? 'اختر اللغة' : (lang === 'ru' ? 'Выберите язык' : 'Select Language')));
        }

        // Invalidate category DOM cache on language change
        if (typeof window._invalidateCategoryCache === 'function') {
            window._invalidateCategoryCache();
        }

        // Re-render menu if we are on the menu page and functions exist
        if (typeof window.getCurrentView === 'function') {
            if (window.getCurrentView() === 'categories' && typeof window.renderCategories === 'function') {
                window.renderCategories();
            } else if (window.getCurrentView() === 'items' && typeof window.renderMenu === 'function') {
                window.renderMenu();
            }
        } else if (typeof renderCategories === 'function') {
            // Fallback
            try { renderCategories(); } catch(e) {}
        }
    }

    if (langSwitcher) {
        langSwitcher.value = currentLang;
        langSwitcher.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('siteLang', currentLang);
            window.applyTranslations(currentLang);
            if (typeof gtag === 'function') {
                gtag('event', 'change_language', { language: currentLang });
            }
        });
    }

    // Initial translation apply
    window.applyTranslations(currentLang);