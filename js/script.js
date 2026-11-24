/* ==========================================================================
   js/script.js — OTOMATİK ÜRETİLMİŞ DOSYA, ELLE DÜZENLEMEYİN.
   --------------------------------------------------------------------------
   Kaynak : src/js/parça dosyaları (sıra: src/js/manifest.json)
   Derle  : node tools/build.js
   Kontrol: node tools/build.js --check
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

    // iOS Safari active state CSS activation
    document.addEventListener('touchstart', () => {}, { passive: true });

    
    function normalizeImageUrl(url) {
        if (!url) return '';
        if (url.includes('supabase.co/storage/v1/object/public/images/')) {
            return url.replace(/https?:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/images\//, 'https://www.felekmangalbasi.com/images/');
        }
        return url;
    }

    // --- Language Switcher ---
    const langSwitcher = document.getElementById('lang-switcher');
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


    // --- QR Menu Data & Rendering ---
    let categories = [
    { id: "mezeler", image: "https://www.felekmangalbasi.com/images/mezeler/mezeler.webp?v=2" },
    { id: "salatalar", image: "https://www.felekmangalbasi.com/images/salatalar/salatalar.webp?v=2" },
    { id: "ana_yemekler", image: "https://www.felekmangalbasi.com/images/ana_yemekler/kapak.webp?v=2" },
    { id: "alkolsuz", image: "https://www.felekmangalbasi.com/images/alkolsuz/1779226637394_y3s3vj4wj.webp?v=2" },
    { id: "raki", image: "https://www.felekmangalbasi.com/images/raki/raki_cover.webp?v=2" },
    { id: "viski", image: "https://www.felekmangalbasi.com/images/viski/1779226891887_freb083ev.webp?v=2" },
    { id: "sarap", image: "https://www.felekmangalbasi.com/images/sarap/1779226742783_hlawdmksh.webp?v=2" },
    { id: "biralar", image: "https://www.felekmangalbasi.com/images/biralar/biralar.webp?v=2" },
    { id: "votka_cin", image: "https://www.felekmangalbasi.com/images/votka_cin/votka_cin.webp?v=2" },
    { id: "tatli_meyve", image: "https://www.felekmangalbasi.com/images/tatli_meyve/tatli_meyve.webp?v=2" }
];let menuData = [
    {"categoryId":"mezeler","title":{"tr":"Girit Ezmesi","en":"Cretan Cheese Dip (Girit Ezmesi)","ar":"سلطة جبنة كريتية (غريت إزمي)","ru":"Критская сырная закуска (Гирит Эзмеси)"},"price":"₺330,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227341191_qshkm9x2h.webp"},
    {"categoryId":"raki","title":{"tr":"Yeni Seri 20 cl","en":"Yeni Raki Yeni Seri 20 cl","ar":"يني راكي يني سيري 20 سل","ru":"Йени Ракы Йени Сери 20 сл"},"price":"₺950,00","image":"https://www.felekmangalbasi.com/images/raki/yeni_raki_yeni_seri.webp"},
    {"categoryId":"salatalar","title":{"tr":"Peynirli Roka Salata","en":"Arugula Salad with Cheese","ar":"سلطة الجرجير بالجبنة","ru":"Салат из рукколы с сыром"},"price":"₺350,00","image":"https://www.felekmangalbasi.com/images/salatalar/peynirli_roka_salata.webp","extras":{"tr":"+₺120,00 Duble Porsiyon","en":"+₺120,00 Double Portion","ar":"+₺120,00 وجبة مزدوجة","ru":"+₺120,00 Двойная порция"}},
    {"categoryId":"salatalar","title":{"tr":"Çoban Salata","en":"Shepherd's Salad (Coban Salata)","ar":"سلطة الرعاة (شوبان)","ru":"Чобан салат (Пастуший салат)"},"price":"₺350,00","image":"https://www.felekmangalbasi.com/images/salatalar/coban_salata.webp","extras":{"tr":"+₺100,00 Duble Porsiyon","en":"+₺100,00 Double Portion","ar":"+₺100,00 وجبة مزدوجة","ru":"+₺100,00 Двойная порция"}},
    {"categoryId":"mezeler","title":{"tr":"Kırmızı Peynir Dolgulu Biber","en":"Cherry Peppers Stuffed with Cheese","ar":"فلفل أحمر محشي بالجبنة","ru":"Красный перец фаршированный сыром"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227368213_o8clitnz1.webp"},
    {"categoryId":"mezeler","title":{"tr":"Acur Turşusu","en":"Pickled Armenian Cucumber (Acur)","ar":"مخلل القثاء (عجور)","ru":"Маринованные армянские огурцы (Аджур)"},"price":"₺310,00","image":"https://www.felekmangalbasi.com/images/mezeler/acur_tursusu.webp"},
    {"categoryId":"mezeler","title":{"tr":"Kırmızı Acı Biber (Porsiyon)","en":"Red Hot Chili Peppers (Portion)","ar":"فلفل أحمر حار (حصة)","ru":"Красный острый перец (порция)"},"price":"₺90,00","image":"https://www.felekmangalbasi.com/images/mezeler/kirmizi_aci_biber.webp"},
    {"categoryId":"salatalar","title":{"tr":"Kaşık Salata","en":"Spoon Salad (Kasik Salata)","ar":"سلطة الملعقة (كاشيق)","ru":"Кашик салат (мелконарезанный салат)"},"price":"₺350,00","image":"https://www.felekmangalbasi.com/images/salatalar/kasik_salata.webp","extras":{"tr":"+₺100,00 Duble Porsiyon","en":"+₺100,00 Double Portion","ar":"+₺100,00 وجبة مزدوجة","ru":"+₺100,00 Двойная порция"}},
    {"categoryId":"biralar","title":{"tr":"Corona 33 cl","en":"Corona Beer 33 cl","ar":"بيرة كورونا 33 سل","ru":"Пиво Корона 33 сл"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/biralar/corona_33cl.webp"},
    {"categoryId":"raki","title":{"tr":"Yeni Rakı 70 cl","en":"Yeni Raki 70 cl","ar":"يني راكي 70 سل","ru":"Йени Ракы 70 сл"},"price":"₺3.000,00","image":"https://www.felekmangalbasi.com/images/raki/82.webp"},
    {"categoryId":"raki","title":{"tr":"Yeni Rakı 50 cl","en":"Yeni Raki 50 cl","ar":"يني راكي 50 سل","ru":"Йени Ракы 50 сл"},"price":"₺2.200,00","image":"https://www.felekmangalbasi.com/images/raki/82.webp"},
    {"categoryId":"raki","title":{"tr":"Yeni Rakı 35 cl","en":"Yeni Raki 35 cl","ar":"يني راكي 35 سل","ru":"Йени Ракы 35 сл"},"price":"₺1.550,00","image":"https://www.felekmangalbasi.com/images/raki/82.webp"},
    {"categoryId":"raki","title":{"tr":"Yeni Rakı 20 cl","en":"Yeni Raki 20 cl","ar":"يني راكي 20 سل","ru":"Йени Ракы 20 сл"},"price":"₺900,00","image":"https://www.felekmangalbasi.com/images/raki/82.webp"},
    {"categoryId":"mezeler","title":{"tr":"Barbunya Pilaki","en":"Red Kidney Bean Stew (Barbunya Pilaki)","ar":"فاصوليا حمراء بالزيت","ru":"Барбунья пилаки (тушеная фасоль)"},"price":"₺310,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227396709_9wwtso2zr.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Absolut 35 cl","en":"Absolut Vodka 35 cl","ar":"فودكا أبسولوت 35 سل","ru":"Водка Абсолют 35 сл"},"price":"₺2.150,00","image":"https://www.felekmangalbasi.com/images/votka_cin/57.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"Karpuz","en":"Watermelon","ar":"بطيخ (رقّي)","ru":"Арбуз"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/karpuz.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"Kavun","en":"Melon","ar":"شمام (بطيخ أصفر)","ru":"Дыня"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/kavun.webp"},
    {"categoryId":"raki","title":{"tr":"Yeni Seri 70 cl","en":"Yeni Raki Yeni Seri 70 cl","ar":"يني راكي يني سيري 70 سل","ru":"Йени Ракы Йени Сери 70 сл"},"price":"₺3.100,00","image":"https://www.felekmangalbasi.com/images/raki/yeni_raki_yeni_seri.webp"},
    {"categoryId":"raki","title":{"tr":"Yeni Seri 35 cl","en":"Yeni Raki Yeni Seri 35 cl","ar":"يني راكي يني سيري 35 سل","ru":"Йени Ракы Йени Сери 35 сл"},"price":"₺1.600,00","image":"https://www.felekmangalbasi.com/images/raki/yeni_raki_yeni_seri.webp"},
    {"categoryId":"mezeler","title":{"tr":"Köpoğlu","en":"Kopoglu (Eggplant and Yogurt Dip)","ar":"كوب أوغلو","ru":"Кёпоглу (закуска из баклажанов с йогуртом)"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227084285_cnx6wj5k6.webp"},
    {"categoryId":"mezeler","title":{"tr":"Şakşuka","en":"Saksuka (Eggplant in Tomato Sauce)","ar":"شكشوكة (باذنجان بصلصة الطмаطم)","ru":"Шакшука (баклажаны в томатном соусе)"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227103826_zj1ll2mbu.webp"},
    {"categoryId":"mezeler","title":{"tr":"Şakşuka","en":"Saksuka (Eggplant in Tomato Sauce)","ar":"شكشوكة (باذنجان بصلصة الطماطم)","ru":"Шакшука (баклажаны в томатном соусе)"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227103826_zj1ll2mbu.webp"},
    {"categoryId":"mezeler","title":{"tr":"Beyaz Peynir","en":"Feta Cheese","ar":"جبنة بيضاء","ru":"Брынза"},"price":"₺180,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227113199_df0tb1v4j.webp"},
    {"categoryId":"mezeler","title":{"tr":"Humus","en":"Hummus","ar":"حمص","ru":"Хумус"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227358836_l92gtq3dq.webp"},
    {"categoryId":"mezeler","title":{"tr":"Semizotu","en":"Purslane Salad with Yogurt","ar":"بقلة بالزبادي","ru":"Портулак с йогуртом"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227193960_g5dnsb69w.webp"},
    {"categoryId":"salatalar","title":{"tr":"Gavurdağ Salata","en":"Gavurdagi Salad","ar":"سلطة غافورداغي","ru":"Салат Гавурдаг"},"price":"₺370,00","image":"https://www.felekmangalbasi.com/images/salatalar/gavurdag_salata.webp","extras":{"tr":"+₺100,00 Duble Porsiyon","en":"+₺100,00 Double Portion","ar":"+₺100,00 وجبة مزدوجة","ru":"+₺100,00 Двойная порция"}},
    {"categoryId":"mezeler","title":{"tr":"Köz Patlıcan","en":"Roasted Eggplant Salad","ar":"باذنجان مشوي","ru":"Салат из печеных баклажанов"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227219917_rf9anwpox.webp"},
    {"categoryId":"mezeler","title":{"tr":"Hellim Peyniri","en":"Grilled Halloumi Cheese","ar":"جبنة حلوم مشوية","ru":"Сыр Халлуми на гриле"},"price":"₺100,00","image":"https://www.felekmangalbasi.com/images/mezeler/hellim_peyniri.webp"},
    {"categoryId":"mezeler","title":{"tr":"Mantar","en":"Mushrooms","ar":"فطر","ru":"Грибы"},"price":"₺160,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227485432_jlzngqcjk.webp"},
    {"categoryId":"mezeler","title":{"tr":"Çiğköfte","en":"Steak Tartar a la Turca (Cigkofte)","ar":"كبة نية (تشي كوفته)","ru":"Чи кёфте (вегетарианские острые котлеты)"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/mezeler/cigkofte.webp"},
    {"categoryId":"mezeler","title":{"tr":"Havuç Tarator","en":"Carrot Tarator (Carrot Yogurt Dip)","ar":"سلطة الجزر بالزبادي","ru":"Морковный таратор"},"price":"₺320,00","image":"https://www.felekmangalbasi.com/images/mezeler/havuc_tarator.webp"},
    {"categoryId":"mezeler","title":{"tr":"Manda Yoğurdu","en":"Buffalo Yogurt","ar":"زبادي حليب الجواميس","ru":"Йогурт из буйволиного молока"},"price":"₺200,00","image":"https://www.felekmangalbasi.com/images/mezeler/manda_yogurdu.webp"},
    {"categoryId":"ana_yemekler","title":{"tr":"Pirzola (Kg)","en":"Lamb Chops (Kg)","ar":"ريش الغنم (كجم)","ru":"Бараньи отбивные (кг)"},"price":"₺3.200,00","image":"https://www.felekmangalbasi.com/images/ana_yemekler/1779227559639_74pzq0t5r.webp"},
    {"categoryId":"mezeler","title":{"tr":"Sarımsak","en":"Garlic (Portion)","ar":"ثوم","ru":"Чеснок (порция)"},"price":"₺75,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227493729_5foumyvk8.webp"},
    {"categoryId":"ana_yemekler","title":{"tr":"Bonfile (Kg)","en":"Beef Tenderloin (Kg)","ar":"فيليه البقر (كجم)","ru":"Говяжье филе (кг)"},"price":"₺3.750,00","image":"https://www.felekmangalbasi.com/images/ana_yemekler/1779227547438_jzw12uts3.webp"},
    {"categoryId":"ana_yemekler","title":{"tr":"Kırmızı Et Çeşitleri (Kg)","en":"Red Meat Varieties (Kg)","ar":"تشكيلة اللحوم الحمراء (كجم)","ru":"Ассорти из красного мяса (кг)"},"price":"₺2.950,00","image":"https://www.felekmangalbasi.com/images/ana_yemekler/kirmizi_et.webp"},
    {"categoryId":"mezeler","title":{"tr":"Haydari","en":"Haydari (Thick Yogurt Dip with Herbs)","ar":"حيداري (زبادي بالأعشاب)","ru":"Хайдари (густой йогурт с зеленью)"},"price":"₺290,00","image":"https://www.felekmangalbasi.com/images/mezeler/1781181361729_ct0z394n3.webp"},
    {"categoryId":"mezeler","title":{"tr":"Süzme yogurt","en":"Strained Yogurt","ar":"لبنة (زبادي مصفى)","ru":"Сузьме йогурт (процеженный йогурт)"},"price":"₺240,00","image":"https://www.felekmangalbasi.com/images/mezeler/suzme_yogurt.webp"},
    {"categoryId":"salatalar","title":{"tr":"İstanbul Salata","en":"Istanbul Salad","ar":"سلطة اسطنبول","ru":"Стамбульский салат"},"price":"₺350,00","image":"https://www.felekmangalbasi.com/images/salatalar/istanbul_salata.webp","extras":{"tr":"+₺100,00 Duble Porsiyon","en":"+₺100,00 Double Portion","ar":"+₺100,00 وجبة مزدوجة","ru":"+₺100,00 Двойная порция"}},
    {"categoryId":"salatalar","title":{"tr":"Mevsim Salata","en":"Seasonal Salad","ar":"سلطة موسمية","ru":"Сезонный салат"},"price":"₺350,00","image":"https://www.felekmangalbasi.com/images/salatalar/mevsim_salata.webp","extras":{"tr":"+₺100,00 Duble Porsiyon","en":"+₺100,00 Double Portion","ar":"+₺100,00 وجبة مزدوجة","ru":"+₺100,00 Двойная порция"}},
    {"categoryId":"mezeler","title":{"tr":"Izgara Zeytin","en":"Grilled Olives","ar":"زيتون مشوي","ru":"Оливки на гриле"},"price":"₺270,00","image":"https://www.felekmangalbasi.com/images/mezeler/koz_zeytin.webp"},
    {"categoryId":"salatalar","title":{"tr":"Söğüş Salata","en":"Sliced Salad (Tomato & Cucumber Sogus)","ar":"سلطة طماطم وخيار مقطعة (سؤوش)","ru":"Согюш салат (нарезка из свежих огурцов и помидоров)"},"price":"₺280,00","image":"https://www.felekmangalbasi.com/images/salatalar/sogus_salata.webp","extras":{"tr":"+₺100,00 Duble Porsiyon","en":"+₺100,00 Double Portion","ar":"+₺100,00 وجبة مزدوجة","ru":"+₺100,00 Двойная порция"}},
    {"categoryId":"mezeler","title":{"tr":"Cacık","en":"Tzatziki","ar":"جاجيك","ru":"Джаджик (турецкий йогурт с огурцами)"},"price":"₺260,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227204013_0ksqu421u.webp"},
    {"categoryId":"mezeler","title":{"tr":"Pancar Turşusu","en":"Pickled Beetroot","ar":"مخلل الشمندر","ru":"Маринованная свёкла"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227427869_35s4bnpjb.webp"},
    {"categoryId":"mezeler","title":{"tr":"Atom","en":"Atom (Spicy Mixed Dip)","ar":"أتوم (مقبلات حارة)","ru":"Атом (острая закуска)"},"price":"₺330,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227158927_mvagodo4a.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Ayran","en":"Ayran (Traditional Salty Yogurt Drink)","ar":"عيران (لبن مالح)","ru":"آйран (турецкий йогуртовый напиток)"},"price":"₺100,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/ayran.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Ice Tea Limon / Şeftali","en":"Ice Tea (Lemon / Peach)","ar":"آيس تي (ليمون / خوخ)","ru":"Холодный чай (лимон / персик)"},"price":"₺130,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/ice_tea.webp"},
    {"categoryId":"sarap","title":{"tr":"Versus Beyaz 75 cl","en":"Kayra Versus White Wine 75 cl","ar":"نبيذ كايرا فيرسوس أبيض 75 سل","ru":"Белое вино Kayra Versus 75 сл"},"price":"₺2.900,00","image":"https://www.felekmangalbasi.com/images/sarap/versus_beyaz.webp"},
    {"categoryId":"sarap","title":{"tr":"Kadeh Şarap","en":"Glass of Wine (Red/White)","ar":"كأس نبيذ","ru":"Бокал вина"},"price":"₺450,00","image":"https://www.felekmangalbasi.com/images/sarap/kirmizi_kadeh_sarap.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Duble Absolut Votka","en":"Double Absolut Vodka","ar":"ابسولوت فودكا دبل","ru":"Двойная водка Абсолют"},"price":"₺420,00","image":"https://www.felekmangalbasi.com/images/votka_cin/votka_duble.webp"},
    {"categoryId":"raki","title":{"tr":"Beylerbeyi Göbek 70 cl","en":"Beylerbeyi Gobek Raki 70 cl","ar":"بيلربيي غوبيك راكي 70 سل","ru":"Бейлербейи Гёбек Ракы 70 сл"},"price":"₺3.750,00","image":"https://www.felekmangalbasi.com/images/raki/beylerbeyi_gobek.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Smirnoff 70 cl","en":"Smirnoff Vodka 70 cl","ar":"فودكا سميرنوف 70 سل","ru":"Водка Смирнофф 70 сл"},"price":"₺4.200,00","image":"https://www.felekmangalbasi.com/images/votka_cin/smirnoff_70cl.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Duble Cin","en":"Double Gin","ar":"جين دبل","ru":"Двойной джин"},"price":"₺470,00","image":"https://www.felekmangalbasi.com/images/votka_cin/duble_cin.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Tonik","en":"Tonic","ar":"تونيك","ru":"Тоник"},"price":"₺140,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/tonik.webp","extras":{"tr":"+₺260,00 1 Litre","en":"+₺260,00 1 Liter","ar":"+₺260,00 1 لتر","ru":"+₺260,00 1 литр"}},
    {"categoryId":"viski","title":{"tr":"Duble Viski","en":"Double Whiskey","ar":"ويسكي دبل","ru":"Двойной Виски"},"price":"₺650,00","image":"https://www.felekmangalbasi.com/images/viski/duble_viski.webp","extras":{"tr":"Tek Viski: ₺450,00","en":"Single Whiskey: ₺450.00","ar":"ويسكي مفرد: ₺450,00","ru":"Одинарный Виски: ₺450,00"}},
    {"categoryId":"mezeler","title":{"tr":"Zeytinyağlı Enginar","en":"Artichoke in Olive Oil","ar":"أرضي شوكي بزيت الزيتون","ru":"Артишоки в оливковом масле"},"price":"₺340,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227416849_c5ax66k9y.webp"},
    {"categoryId":"sarap","title":{"tr":"Leona Blush 75 cl","en":"Leona Blush Wine 75 cl","ar":"نبيذ ليونا روزيه 75 سل","ru":"Розовое вино Leona Blush 75 сл"},"price":"₺2.300,00","image":"https://www.felekmangalbasi.com/images/sarap/75.webp"},
    {"categoryId":"raki","title":{"tr":"Kulüp Rakı 70 cl","en":"Kulup Raki 70 cl","ar":"كولوب راكي 70 سل","ru":"Кулюп Ракы 70 сл"},"price":"₺3.400,00","image":"https://www.felekmangalbasi.com/images/raki/79.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Soda","en":"Mineral Water / Soda","ar":"مياه معدنية / صودا","ru":"Минеральная вода"},"price":"₺75,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/soda.webp"},
    {"categoryId":"mezeler","title":{"tr":"Zeytinyağlı Yaprak Sarma","en":"Stuffed Grape Leaves in Olive Oil (Sarma)","ar":"ورق عنب بالزيت","ru":"Сарма (фаршированные виноградные листья)"},"price":"₺340,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227457903_dh9v7oic7.webp"},
    {"categoryId":"raki","title":{"tr":"Beylerbeyi Göbek 35 cl","en":"Beylerbeyi Gobek Raki 35 cl","ar":"بيلربيي غوبيك راكي 35 سل","ru":"Бейlerbeyi Gobek Raki 35 cl"},"price":"₺1.950,00","image":"https://www.felekmangalbasi.com/images/raki/beylerbeyi_gobek.webp"},
    {"categoryId":"mezeler","title":{"tr":"Kuru Domates","en":"Sun-Dried Tomatoes","ar":"طماطم مجففة","ru":"Вяленые томаты"},"price":"₺330,00","image":"https://www.felekmangalbasi.com/images/mezeler/1781181314329_aux5wmuu3.webp"},
    {"categoryId":"biralar","title":{"tr":"Efes Pilsen 33 cl","en":"Efes Pilsen Beer 33 cl","ar":"بيرة إيفيس بيلسن 33 سل","ru":"Пиво Эфес Пилсен 33 сл"},"price":"₺250,00","image":"https://www.felekmangalbasi.com/images/biralar/64.webp"},
    {"categoryId":"raki","title":{"tr":"Altın Seri 70 cl","en":"Yeni Raki Altin Seri 70 cl","ar":"يني راكي ألتين سيري 70 سل","ru":"Йени Ракы Алтын Сери 70 сл"},"price":"₺3.600,00","image":"https://www.felekmangalbasi.com/images/raki/80.webp"},
    {"categoryId":"raki","title":{"tr":"Sarı Zeybek 70 cl","en":"Sari Zeybek Raki 70 cl","ar":"ساري زيبك راكي 70 سل","ru":"Сары Зейбек Ракы 70 сл"},"price":"₺3.800,00","image":"https://www.felekmangalbasi.com/images/raki/81.webp"},
    {"categoryId":"raki","title":{"tr":"Efe Gold 35 cl","en":"Efe Gold Raki 35 cl","ar":"إيفي جولد راكي 35 سل","ru":"Эфе Голд Ракы 35 сл"},"price":"₺1.850,00","image":"https://www.felekmangalbasi.com/images/raki/83.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Redbull","en":"Red Bull","ar":"ريد بول","ru":"Ред Булл"},"price":"₺175,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/68.webp","extras":{"tr":"+₺100,00 Büyük Redbull","en":"+₺100,00 Large Redbull","ar":"+₺100,00 ريد بول كبير","ru":"+₺100,00 Большой Ред Булл"}},
    {"categoryId":"tatli_meyve","title":{"tr":"Kabak Tatlısı","en":"Pumpkin Dessert","ar":"حلوى اليقطين","ru":"Тыквенный десерт (Кабак татлысы)"},"price":"₺330,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/29.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"Ayva Tatlısı","en":"Quince Dessert","ar":"حلوى السفرجل","ru":"Десерт из айвы (Айva tatlisi)"},"price":"₺330,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/30.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"Tekli Karışık Meyve","en":"Mixed Fruit Salad (Single)","ar":"سلطة فواكه مشكلة (فردية)","ru":"Смешанные фрукты (индивидуальное ассорти)"},"price":"₺350,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/tekli_karisik_meyve.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"Serpme Meyve","en":"Assorted Fruit Platter","ar":"طبق فواكه مشكلة","ru":"Большое фруктовое ассорти"},"price":"₺450,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/32.webp"},
    {"categoryId":"raki","title":{"tr":"Duble Rakı","en":"Double Raki","ar":"راكي مزدوج","ru":"Двойная Ракы"},"price":"₺380,00","image":"https://www.felekmangalbasi.com/images/raki/duble_raki.webp","extras":{"tr":"Tek Rakı: ₺240,00","en":"Single Raki: ₺240.00","ar":"راكي مفرد: ₺240,00","ru":"Одинарная Ракы: ₺240,00"}},
    {"categoryId":"raki","title":{"tr":"Duble Göbek","en":"Double Gobek","ar":"غوبيك مزدوج","ru":"Двойная Гёбек"},"price":"₺430,00","image":"https://www.felekmangalbasi.com/images/raki/duble_raki.webp","extras":{"tr":"Tek Göbek: ₺290,00","en":"Single Gobek: ₺290.00","ar":"غوبيك مفرد: ₺290,00","ru":"Одинарная Гёбек: ₺290,00"}},
    {"categoryId":"mezeler","title":{"tr":"Acılı Ezme","en":"Spicy Turkish Tomato Dip (Acili Ezme)","ar":"سلطة حارة (إزمي)","ru":"Аджика по-турецки (Аджилы эзме)"},"price":"₺290,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227283165_jff5xuqx0.webp"},
    {"categoryId":"biralar","title":{"tr":"Patates Tava","en":"French Fries","ar":"بطاطس مقلية","ru":"Картофель фри"},"price":"₺240,00","image":"https://www.felekmangalbasi.com/images/biralar/patates_tava.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Acılı / Acısız Şalgam","en":"Turnip Juice (Spicy / Mild)","ar":"عصير اللفت (حار / بارد)","ru":"Шалгам (Острый / Мягкий)"},"price":"₺110,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/salgam.webp","extras":{"tr":"+₺290,00 1 Litre","en":"+₺290,00 1 Liter","ar":"+₺290,00 1 لتر","ru":"+₺290,00 1 литр"}},
    {"categoryId":"mezeler","title":{"tr":"Fesleğenli Enginar","en":"Artichoke with Basil","ar":"أرضي شوكي بالريحان","ru":"Артишоки с базиликом"},"price":"₺340,00","image":"https://www.felekmangalbasi.com/images/mezeler/1781181200251_zd9ee47pn.webp"},
    {"categoryId":"sarap","title":{"tr":"Versus Dedeçeşme 75 cl","en":"Kayra Versus Dedecesme Red Wine 75 cl","ar":"نبيذ كايرا فيرسوس ديديجيشمي أحمر 75 سل","ru":"Красное вино Kayra Versus Dedecesme 75 сл"},"price":"₺3.000,00","image":"https://www.felekmangalbasi.com/images/sarap/kayra_versus_kirmizi.webp"},
    {"categoryId":"sarap","title":{"tr":"Terra 75 cl (Öküzgözü/Kalecik Karası/Rose/Shiraz)","en":"Kayra Terra 75 cl (Okuzgozu/Kalecik Karasi/Rose/Shiraz)","ar":"نبيذ كايرا تيرا 75 سل (أوكوزغوزو/كاليجيك كاراسي/روز/شيراز)","ru":"Вино Kayra Terra 75 сл (Окюзгюзю/Каледжик Карасы/Розе/Шираз)"},"price":"₺2.300,00","image":"https://www.felekmangalbasi.com/images/sarap/terra_kirmizi.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"İrmik Helvası","en":"Semolina Halva","ar":"حلوى السميد","ru":"Халва из манной крупы"},"price":"₺250,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/31.webp","extras":{"tr":"+₺80,00 Dondurmalı","en":"+₺80,00 with Ice Cream","ar":"+₺80,00 مع الآيس كريم","ru":"+₺80,00 с мороженым"}},
    {"categoryId":"alkolsuz","title":{"tr":"Churchill","en":"Churchill (Mineral Water with Lemon & Salt)","ar":"تشيرشل (مياه فوارة بالليمون والملح)","ru":"Черчилль (минералка с лимоном и солью)"},"price":"₺130,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/churchill.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"İncir Tatlısı","en":"Fig Dessert (Incir Tatlisi)","ar":"حلوى التين","ru":"Десерт из инжира (Инджир татлысы)"},"price":"₺330,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/28.webp"},
    {"categoryId":"tatli_meyve","title":{"tr":"Dondurma (Porsiyon)","en":"Ice Cream (Portion)","ar":"آيس كريم (حصة)","ru":"Мороженое (порция)"},"price":"₺150,00","image":"https://www.felekmangalbasi.com/images/tatli_meyve/dondurma.webp"},
    {"categoryId":"mezeler","title":{"tr":"Fava","en":"Fava (Broad Bean Puree)","ar":"فافا (متبل الفول)","ru":"Фава (пюре из бобов)"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/mezeler/1779227239999_5pf93q7r8.webp"},
    {"categoryId":"biralar","title":{"tr":"Tuborg 50 cl","en":"Tuborg Beer 50 cl","ar":"بيرة توبورج 50 سل","ru":"Пиво Туборг 50 сл"},"price":"₺420,00","image":"https://www.felekmangalbasi.com/images/biralar/63.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Absolut 70 cl","en":"Absolut Vodka 70 cl","ar":"فودكا أبسولوت 70 سل","ru":"Водка Абсолют 70 сл"},"price":"₺4.200,00","image":"https://www.felekmangalbasi.com/images/votka_cin/57.webp"},
    {"categoryId":"viski","title":{"tr":"Chivas 12 35 cl","en":"Chivas Regal 12 Years Old 35 cl","ar":"شيفاز ريغال 12 سنة 35 سل","ru":"Чивас Ригал 12 лет 35 сл"},"price":"₺2.900,00","image":"https://www.felekmangalbasi.com/images/viski/59.webp"},
    {"categoryId":"biralar","title":{"tr":"Tuborg 33 cl","en":"Tuborg Beer 33 cl","ar":"بيرة توبورج 33 سل","ru":"Пиво Туборг 33 сл"},"price":"₺250,00","image":"https://www.felekmangalbasi.com/images/biralar/63.webp"},
    {"categoryId":"biralar","title":{"tr":"Efes Pilsen 50 cl","en":"Efes Beer 50 cl","ar":"بيرة إيفيس 50 سل","ru":"Пиво Эфес 50 сл"},"price":"₺420,00","image":"https://www.felekmangalbasi.com/images/biralar/64.webp"},
    {"categoryId":"biralar","title":{"tr":"Miller 33 cl","en":"Miller Beer 33 cl","ar":"بيرة ميلر 33 سل","ru":"Пиво Миллер 33 сл"},"price":"₺275,00","image":"https://www.felekmangalbasi.com/images/biralar/65.webp"},
    {"categoryId":"biralar","title":{"tr":"Antep Çerez","en":"Antep Style Mixed Nuts","ar":"مكسرات مشكلة على طريقة عنتاب","ru":"Ассорти из орехов (по-антепски)"},"price":"₺245,00","image":"https://www.felekmangalbasi.com/images/biralar/antep_cerez.webp"},
    {"categoryId":"raki","title":{"tr":"Kulüp Rakı 35 cl","en":"Kulup Raki 35 cl","ar":"كولوب راكي 35 سل","ru":"Кулюп Ракы 35 сл"},"price":"₺1.750,00","image":"https://www.felekmangalbasi.com/images/raki/79.webp"},
    {"categoryId":"raki","title":{"tr":"Altın Seri 35 cl","en":"Yeni Raki Altin Seri 35 cl","ar":"يني راكي ألتين سيري 35 سل","ru":"Йени Ракы Алтын Сери 35 сл"},"price":"₺1.850,00","image":"https://www.felekmangalbasi.com/images/raki/80.webp"},
    {"categoryId":"raki","title":{"tr":"Altın Seri 20 cl","en":"Yeni Raki Altin Seri 20 cl","ar":"يني راكي ألتين سيري 20 سل","ru":"Йени Ракы Алтын Сери 20 сл"},"price":"₺1.050,00","image":"https://www.felekmangalbasi.com/images/raki/80.webp"},
    {"categoryId":"raki","title":{"tr":"Sarı Zeybek 35 cl","en":"Sari Zeybek Raki 35 cl","ar":"ساري زيبك راكي 35 سل","ru":"Сары Зейбек Ракы 35 сл"},"price":"₺1.950,00","image":"https://www.felekmangalbasi.com/images/raki/81.webp"},
    {"categoryId":"raki","title":{"tr":"Efe Gold 70 cl","en":"Efe Gold Raki 70 cl","ar":"إيفي جولد راكي 70 سل","ru":"Эфе Голд Ракы 70 сл"},"price":"₺3.600,00","image":"https://www.felekmangalbasi.com/images/raki/83.webp"},
    {"categoryId":"raki","title":{"tr":"Beylerbeyi Göbek 20 cl","en":"Beylerbeyi Gobek Raki 20 cl","ar":"بيلربيي غوبيك راكي 20 سل","ru":"Бейлербейи Гёбек Ракы 20 сл"},"price":"₺1.100,00","image":"https://www.felekmangalbasi.com/images/raki/beylerbeyi_gobek.webp"},
    {"categoryId":"sarap","title":{"tr":"Vintage Beyaz 75 cl","en":"Kayra Vintage White Wine 75 cl","ar":"نبيذ كايرا فينتاج أبيض 75 سل","ru":"Белое вино Kayra Vintage 75 сл"},"price":"₺3.000,00","image":"https://www.felekmangalbasi.com/images/sarap/77.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Sprite","en":"Sprite","ar":"سبرايت","ru":"Спрайт"},"price":"₺145,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/69.webp"},
    {"categoryId":"sarap","title":{"tr":"Ruffino Prosecco 75 cl","en":"Prosecco / Sparkling Wine 75 cl","ar":"بروسيكو / نبيذ فوار 75 سل","ru":"Просекко / Игристое вино 75 сл"},"price":"₺5.000,00","image":"https://www.felekmangalbasi.com/images/sarap/74.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Fanta","en":"Fanta","ar":"فانتا","ru":"Фанта"},"price":"₺145,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/70.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Kola","en":"Coca-Cola","ar":"كولا","ru":"Кола"},"price":"₺145,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/71.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Kola (Zero)","en":"Coca-Cola Zero Sugar","ar":"كولا زيرو","ru":"Кола Зеро"},"price":"₺145,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/71.webp"},
    {"categoryId":"viski","title":{"tr":"Black Label 70 cl","en":"Black Label 70 cl","ar":"بلاك ليبل 70 سل","ru":"Блэк Лейбл 70 сл"},"price":"₺5.700,00","image":"https://www.felekmangalbasi.com/images/viski/60.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Belvedere 70 cl","en":"Belvedere 70 cl","ar":"بيلفيدير 70 سل","ru":"Бельведер 70 сл"},"price":"₺8.500,00","image":"https://www.felekmangalbasi.com/images/votka_cin/56.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Kayısı Suyu","en":"Apricot Juice","ar":"عصير المشمش","ru":"Абрикосовый сок"},"price":"₺130,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/72.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Vişne Suyu","en":"Sour Cherry Juice","ar":"عصير الكرز","ru":"Вишневый сок"},"price":"₺130,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/73.webp"},
    {"categoryId":"raki","title":{"tr":"Beylerbeyi Teragold 35 cl","en":"Beylerbeyi Teragold Raki 35 cl","ar":"بيلربيي تيراغولد راكي 35 سل","ru":"Бейлербейи Тераголд Ракы 35 сл"},"price":"₺1.850,00","image":"https://www.felekmangalbasi.com/images/raki/78.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Şeftali Suyu","en":"Peach Juice","ar":"عصير الخوخ","ru":"Персиковый сок"},"price":"₺130,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/cappy_seftali.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Tanqueray No. TEN 70 cl","en":"Tanqueray No. TEN 70 cl","ar":"تانكيراي رقم 10 70 سل","ru":"Танкерей №10 70 сл"},"price":"₺5.500,00","image":"https://www.felekmangalbasi.com/images/votka_cin/58.webp"},
    {"categoryId":"viski","title":{"tr":"Chivas 18 70 cl","en":"Chivas 18 70 cl","ar":"شيفاز 18 70 سل","ru":"Чивас 18 70 сл"},"price":"₺11.000,00","image":"https://www.felekmangalbasi.com/images/viski/61.webp"},
    {"categoryId":"alkolsuz","title":{"tr":"Portakal Suyu","en":"Orange Juice","ar":"عصير البرتقال","ru":"Апельсиновый сок"},"price":"₺130,00","image":"https://www.felekmangalbasi.com/images/alkolsuz/cappy_portakal.webp"},
    {"categoryId":"votka_cin","title":{"tr":"Gordon's 70 cl","en":"Gordon's 70 cl","ar":"جوردونز 70 سل","ru":"Гордонс 70 сл"},"price":"₺4.200,00","image":"https://www.felekmangalbasi.com/images/votka_cin/62.webp"},
    {"categoryId":"sarap","title":{"tr":"La Sastreria 75 cl","en":"La Sastreria Garnacha Red Wine 75 cl","ar":"نبيذ لا ساستريرا غارناتشا أحمر 75 سل","ru":"Красное вино La Sastreria Garnacha 75 сл"},"price":"₺3.800,00","image":"https://www.felekmangalbasi.com/images/sarap/la_sastrera.webp"},
    {"categoryId":"mezeler","title":{"tr":"Köz Biber","en":"Roasted Red Peppers","ar":"فلفل أحمر مشوي","ru":"Жареный красный перец"},"price":"₺290,00","image":"https://www.felekmangalbasi.com/images/mezeler/koz_biber.webp"},
    {"categoryId":"mezeler","title":{"tr":"Beyin Söğüş","en":"Cold Brain Salad","ar":"سلطة المخ الباردة","ru":"Холодный салат из мозгов"},"price":"₺340,00","image":"https://www.felekmangalbasi.com/images/mezeler/sogus_beyin.webp"},
    {"categoryId":"mezeler","title":{"tr":"Brokoli","en":"Broccoli Salad","ar":"سلطة البروكلي","ru":"Салат из брокколи"},"price":"₺310,00","image":"https://www.felekmangalbasi.com/images/mezeler/brokoli_salatasi.webp"},
    {"categoryId":"mezeler","title":{"tr":"Brüksel Lahanası","en":"Brussels Sprouts in Olive Oil","ar":"بروكسل نبتة في زيت زيتون","ru":"Брюссельская капуста в оливковом масле"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/mezeler/bruksel_lahanasi.webp"},
    {"categoryId":"mezeler","title":{"tr":"Soğan Dolması","en":"Stuffed Onion in Olive Oil","ar":"محشي بصل بزيت الزيتون","ru":"Фаршированный лук в оливковом масле"},"price":"₺330,00","image":"https://www.felekmangalbasi.com/images/mezeler/sogan_dolmasi.webp"},
    {"categoryId":"mezeler","title":{"tr":"Pembe Sultan","en":"Pembe Sultan (Beetroot Yogurt Dip)","ar":"بيمبه سلطان","ru":"Пембе Султан (йогурт со свеклой)"},"price":"₺300,00","image":"https://www.felekmangalbasi.com/images/mezeler/pembe_sultan.webp"}
];

    // --- Generate and Append JSON-LD Restaurant Menu Schema ---
    function generateMenuSchema() {
        const categoriesMap = {
            "mezeler": "Mezeler",
            "salatalar": "Salatalar",
            "ana_yemekler": "Et Çeşitleri",
            "tatli_meyve": "Tatlılar",
            "alkolsuz": "Alkolsüz İçecekler",
            "raki": "Rakılar",
            "viski": "Viskiler",
            "sarap": "Şaraplar",
            "biralar": "Biralar & Atıştırmalıklar",
            "votka_cin": "Votka & Cin"
        };

        const schema = {
            "@context": "https://schema.org",
            "@type": "Menu",
            "name": "Felek Mangalbaşı Menüsü",
            "description": "Felek Mangalbaşı'nın eşsiz et çeşitleri, özenle hazırlanan mezeleri, salataları ve içecek çeşitlerini içeren zengin menüsü.",
            "inLanguage": "tr",
            "hasMenuSection": []
        };

        const sections = {};
        for (const [key, value] of Object.entries(categoriesMap)) {
            sections[key] = {
                "@type": "MenuSection",
                "name": value,
                "hasMenuItem": []
            };
        }

        menuData.forEach(item => {
            const catId = item.categoryId;
            if (sections[catId]) {
                let rawPrice = item.price.replace(/[^\d,]/g, '').replace(',', '.');
                let parsedPrice = parseFloat(rawPrice);
                
                const menuItem = {
                    "@type": "MenuItem",
                    "name": item.title.tr || item.title
                };

                if (item.image) {
                    menuItem.image = item.image;
                }

                if (!isNaN(parsedPrice)) {
                    menuItem.offers = {
                        "@type": "Offer",
                        "price": parsedPrice.toFixed(2),
                        "priceCurrency": "TRY"
                    };
                }
                
                sections[catId].hasMenuItem.push(menuItem);
            }
        });

        schema.hasMenuSection = Object.values(sections).filter(sec => sec.hasMenuItem.length > 0);

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'restaurant-menu-jsonld';
        script.text = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }
    
    try {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => generateMenuSchema());
        } else {
            setTimeout(generateMenuSchema, 1200);
        }
    } catch (e) {
        console.error("Schema generation error:", e);
    }

    const menuGrid = document.getElementById('qr-menu-grid');

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
                    const waBtnText = (typeof currentLang !== 'undefined' && translations[currentLang] && translations[currentLang].nav_reservation) || 'Rezervasyon';
                    stickyBar.innerHTML = `<button class="qr-back-btn" onclick="renderCategories()">${backBtnText}</button><a href="https://wa.me/905397776067?text=Merhaba%2C%20Felek%20Mangalba%C5%9F%C4%B1%20i%C3%A7in%20masa%20rezervasyonu%20yapmak%20istiyorum." target="_blank" rel="noopener noreferrer" class="qr-sticky-wa">${waBtnText}</a>`;
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

    // --- Google Analytics 4 (GA4) Unified Conversion Tracking ---
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        
        // 1. WhatsApp Reservation Tracking
        if (href.includes('wa.me') || href.includes('whatsapp.com')) {
            if (typeof gtag === 'function') {
                gtag('event', 'click_whatsapp_reservation', {
                    event_category: 'conversion',
                    event_label: (link.innerText || link.textContent || '').trim() || 'WhatsApp Rezervasyon',
                    page_location: window.location.href
                });
            }
        }
        // 2. Phone Call Tracking
        else if (href.startsWith('tel:')) {
            if (typeof gtag === 'function') {
                gtag('event', 'click_phone_call', {
                    event_category: 'conversion',
                    event_label: href.replace('tel:', ''),
                    page_location: window.location.href
                });
            }
        }
        // 3. Google Maps / Direction Tracking
        else if (href.includes('maps.google') || href.includes('goo.gl/maps') || href.includes('maps.app.goo.gl') || href.includes('google.com/maps')) {
            if (typeof gtag === 'function') {
                gtag('event', 'click_google_maps_direction', {
                    event_category: 'engagement',
                    event_label: 'Google Maps Yol Tarifi',
                    page_location: window.location.href
                });
            }
        }
    }, { passive: true });
});

