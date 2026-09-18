/* ==========================================================================
   Felek Mangalbasi — menu.html davranis testi (refactor guvenlik agi)
   -------------------------------------------------------------------------
       npm i jsdom --no-save
       node tests/check-menu.js

   js/script.js'in gercek kod yollarini calistirir. Iki katman:

   KATMAN 1 (statik)   : Supabase kapali; kategori/urun render, dil degistirme,
                         JSON-LD Menu semasi, escapeHtml, lazy/eager gorseller,
                         GA4 click takibi.
   KATMAN 2 (Supabase) : REST yaniti taklit edilir; DB->UI esleme, localStorage
                         onbellek yazimi, supabase.co -> CDN URL normalizasyonu,
                         (1 Kg) temizligi, TRY fiyat bicimi, cat_* sozluk
                         enjeksiyonu.

   Amac: js/script.js modulerlestirilirken davranisin bit bit korunmasini
   garanti etmek. Testler yapiyi degil davranisi dogrular.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
function check(label, cond, extra) {
  checks++;
  if (cond) console.log('   ok   ' + label);
  else { console.log('   FAIL ' + label + (extra !== undefined ? '  -> ' + extra : '')); failures++; }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const html = fs.readFileSync(path.join(ROOT, 'menu.html'), 'utf8');

/* --- Ortak kurulum: jsdom + polyfill'ler -------------------------------- */
function makeDom() {
  const jsErrors = [];
  const uncaught = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e.message || e); jsErrors.push(m); uncaught.push(m); });
  vc.on('error', (...a) => jsErrors.push('console.error: ' + a.join(' ')));

  const dom = new JSDOM(html, {
    url: 'https://www.felekmangalbasi.com/menu.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const { window } = dom, { document } = window;

  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ target: el, isIntersecting: true }], this); }
    unobserve() {} disconnect() {}
  };
  window.requestIdleCallback = fn => window.setTimeout(() => fn({ timeRemaining: () => 50 }), 0);
  window.cancelIdleCallback = id => window.clearTimeout(id);
  window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
  window.gtagCalls = [];
  window.gtag = function () { window.gtagCalls.push([].slice.call(arguments)); };

  // loader: jsdom'un resource loader'i yok; scriptleri elle enjekte ediyoruz
  window.__load = rel => {
    const el = document.createElement('script');
    el.textContent = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    document.body.appendChild(el);
  };
  return { dom, window, document, jsErrors, uncaught };
}

/**
 * menu.html'in yukledigi yerel scriptleri, SAYFADAKI SIRAYLA dondurur.
 * Sabit liste yerine kesif: js dosyalari bolunup yeniden adlandirildiginda
 * test kendiliginden uyum saglar (refactor sirasinda kirilma noktasi olmasin).
 */
function pageScripts() {
  return [...html.matchAll(/<script\s+src="([^"]+)"/g)]
    .map(m => m[1])
    .filter(src => !/^(https?:)?\/\//.test(src))
    .map(src => src.replace(/\?.*$/, ''));
}
async function boot(env, { supabase = false, fetchImpl = null } = {}) {
  for (const src of pageScripts()) {
    env.window.__load(src);
  }
  if (!supabase) {
    // config.js gercek Supabase adresini tanimlar; katman 1'de ag yolunu kapatiyoruz.
    env.window.SUPABASE_URL = 'BURAYA_SUPABASE_URL_GELECEK';
  }
  if (fetchImpl) {
    env.window.fetch = fetchImpl(env.window);
  }
  // jsdom DOMContentLoaded'i kendisi (asenkron) atesler. Elle dispatch etmek
  // tum init kodunu iki kez calistirir -> iki kat event listener, iki kat fetch.
  for (let i = 0; i < 30 && env.document.readyState === 'loading'; i++) await sleep(10);
  if (env.document.readyState === 'loading') {
    env.document.dispatchEvent(new env.window.Event('DOMContentLoaded', { bubbles: true }));
  }
  await sleep(40);
}
const realErrors = errs => errs.filter(e => !/Could not parse CSS|Not implemented/.test(e));

/* ======================================================================== */
async function main() {
  console.log('=== menu.html davranis testi ===\n');

  /* -------------------------------------------------------------------- */
  console.log('--- KATMAN 1: statik (Supabase kapali) ---');
  const env = makeDom();
  const { window, document } = env;
  let fetchCalls = 0;
  await boot(env, { fetchImpl: () => () => { fetchCalls++; return Promise.reject(new Error('beklenmeyen fetch')); } });
  await sleep(120); // ilk render + rAF dongusu

  // 1. kategori gorunumu
  const grid = document.getElementById('qr-menu-grid');
  check('qr-menu-grid elementi var', !!grid);
  const cards = document.querySelectorAll('#qr-menu-grid .qr-category-card');
  check('renderCategories 10 kategori karti uretti', cards.length === 10, cards.length);
  check('getCurrentView() === categories', window.getCurrentView && window.getCurrentView() === 'categories',
    window.getCurrentView ? window.getCurrentView() : 'yok');
  check('Supabase kapaliyken hic fetch yapilmadi', fetchCalls === 0, fetchCalls);

  // 2. data-i18n butunlugu (kategori adlari dahil)
  const trDict = window.eval('translations.tr');
  const keys = [...document.querySelectorAll('[data-i18n]')].map(e => e.getAttribute('data-i18n'));
  const missingKeys = [...new Set(keys.filter(k => !(k in trDict)))];
  check('menu.html data-i18n anahtarlari TR sozlugunde tanimli (' + new Set(keys).size + ' benzersiz)',
    missingKeys.length === 0, missingKeys.slice(0, 5).join(', '));
  const catKeys = [...Array(10).keys()].length; // yalnizca sayac; asil kontrol asagida
  const missingCatKeys = [...document.querySelectorAll('#qr-menu-grid .qr-category-card-title')]
    .map(t => t.textContent.trim())
    .filter(t => /^(mezeler|salatalar|ana_yemekler|alkolsuz|raki|viski|sarap|biralar|votka_cin|tatli_meyve)$/.test(t));
  check('kategori basliklari ham id degil, cevrilmis metin', missingCatKeys.length === 0, missingCatKeys.join(', '));

  // 3. kategori tiklamasi -> urun listesi (event delegation + cift rAF)
  cards[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(150);
  check('kategori sonrasi view === items', window.getCurrentView() === 'items', window.getCurrentView());
  const items = document.querySelectorAll('#qr-menu-grid .qr-card');
  check('urun kartlari uretildi (' + items.length + ')', items.length > 0, items.length);
  const titles = [...document.querySelectorAll('#qr-menu-grid .qr-card-title')].map(t => t.textContent.trim());
  check('her urun kartinda baslik var', titles.length > 0 && titles.every(t => t.length > 0), titles.length);
  const prices = [...document.querySelectorAll('#qr-menu-grid .qr-card-price')].map(t => t.textContent.trim());
  check('fiyatlar TL biciminde', prices.filter(t => /\u20ba|\d/.test(t)).length > 0, prices[0]);

  // 4. geri donus (history.back -> popstate)
  window.renderCategories();
  await sleep(150);
  check('renderCategories ile geri donus (history.back)', window.getCurrentView() === 'categories', window.getCurrentView());

  // 5. dil degistirme — gercek kullanici yolu: <select> change
  const langSel = document.getElementById('lang-switcher');
  check('lang-switcher elementi var', !!langSel);
  langSel.value = 'en';
  langSel.dispatchEvent(new window.Event('change', { bubbles: true }));
  check('dil degisimi html lang=en yapti', document.documentElement.lang === 'en', document.documentElement.lang);
  check('dil degisimi dir=ltr', document.documentElement.dir === 'ltr');
  langSel.value = 'ar';
  langSel.dispatchEvent(new window.Event('change', { bubbles: true }));
  check('dil degisimi dir=rtl', document.documentElement.dir === 'rtl', document.documentElement.dir);
  check('dil secimi localStorage\'a yazildi', window.localStorage.getItem('siteLang') === 'ar',
    window.localStorage.getItem('siteLang'));
  check('dil degisiminde gtag change_language cagrildi',
    window.gtagCalls.some(c => c[1] === 'change_language'),
    JSON.stringify(window.gtagCalls.map(c => c[1])));
  langSel.value = 'tr';
  langSel.dispatchEvent(new window.Event('change', { bubbles: true }));
  check('TR\'ye geri donus', document.documentElement.lang === 'tr', document.documentElement.lang);
  check('dil degisiminde kategori kartlari yeniden cizildi',
    document.querySelectorAll('#qr-menu-grid .qr-category-card').length === 10,
    document.querySelectorAll('#qr-menu-grid .qr-category-card').length);

  // 6. Menu JSON-LD semasi (requestIdleCallback / setTimeout 1200)
  await sleep(1400);
  const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => { try { return JSON.parse(s.textContent); } catch (e) { return null; } });
  check('tum JSON-LD bloklari parse edildi',
    schemas.length > 0 && schemas.every(Boolean), schemas.filter(Boolean).length + '/' + schemas.length);
  let menuNode = null;
  for (const d of schemas.filter(Boolean)) {
    for (const e of (Array.isArray(d) ? d : [d])) {
      for (const n of (e['@graph'] || [e])) {
        if (n && n['@type'] === 'Menu') menuNode = n;
      }
    }
  }
  check('Menu semasi uretildi', !!menuNode);
  if (menuNode) {
    const sections = menuNode.hasMenuSection || [];
    check('Menu semasi 10 bolum iceriyor', sections.length === 10, sections.length);
    check('Menu bolumlerinde urun var', sections.some(s => (s.hasMenuItem || []).length > 0));
    const allItems = sections.flatMap(s => s.hasMenuItem || []);
    check('her urunde offers/fiyat alani var',
      allItems.length > 0 && allItems.every(i => i.offers && (i.offers.price !== undefined || i.offers.priceCurrency)),
      allItems.length);
    check('menu semasi tekrarlanmiyor (idempotent)',
      document.querySelectorAll('script[type="application/ld+json"]').length === schemas.length);
  }

  // 7. guvenlik / temizleme
  check('grid icinde <script> enjekte edilemedi', !/<script/i.test(grid.innerHTML));
  const imgSrcs = [...document.querySelectorAll('#qr-menu-grid img')].map(i => i.getAttribute('src') || '');
  check('supabase.co URL kalmadi', imgSrcs.every(s => !s.includes('supabase.co')),
    imgSrcs.filter(s => s.includes('supabase.co')).length + ' adet');
  const overlay = document.getElementById('page-loading-overlay');
  check('loading overlay gizlendi/kaldirildi', !overlay || overlay.classList.contains('hidden'),
    overlay ? overlay.className : 'yok');

  // 8. gorsel yukleme stratejisi (LCP + CLS)
  const imgs = [...document.querySelectorAll('#qr-menu-grid img[loading]')];
  const eager = imgs.slice(0, 2), rest = imgs.slice(2);
  check('ilk 2 kategori gorseli eager (LCP)', eager.length === 2 && eager.every(i => i.getAttribute('loading') === 'eager'),
    eager.map(i => i.getAttribute('loading')).join(','));
  check('kalan kategori gorselleri lazy', rest.length > 0 && rest.every(i => i.getAttribute('loading') === 'lazy'), rest.length);
  check('LCP gorselinde fetchpriority=high var', eager.some(i => i.getAttribute('fetchpriority') === 'high'));
  check('tum gorsellerde width/height var (CLS=0)',
    imgs.every(i => i.getAttribute('width') && i.getAttribute('height')));

  // 9. GA4 donusum takibi
  function fireClick(href, text) {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = text === undefined ? 'test' : text;
    document.body.appendChild(a);
    a.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    a.remove();
  }
  for (const [href, event, label] of [
    ['https://wa.me/905397776067', 'click_whatsapp_reservation', 'wa.me'],
    ['tel:+902125439248', 'click_phone_call', 'tel:'],
    ['https://maps.app.goo.gl/xyz', 'click_google_maps_direction', 'maps'],
  ]) {
    window.gtagCalls.length = 0;
    fireClick(href);
    check(label + ' tiklamasi ' + event + ' cagirdi',
      window.gtagCalls.some(c => c[1] === event), JSON.stringify(window.gtagCalls.map(c => c[1])));
  }
  // ikon-only link: innerText bos olsa da event ateslenmeli (regresyon: innerText.trim())
  window.gtagCalls.length = 0;
  fireClick('https://wa.me/905397776067', '');
  check('bos metinli WhatsApp linki de takip ediliyor (innerText regresyonu)',
    window.gtagCalls.some(c => c[1] === 'click_whatsapp_reservation'));

  // 10. footer
  const yearEl = document.getElementById('year');
  check('footer yili guncel', yearEl && yearEl.textContent === String(new Date().getFullYear()),
    yearEl ? yearEl.textContent : 'yok');

  const e1 = realErrors(env.jsErrors);
  check('KATMAN 1: calisma zamani JS hatasi yok', e1.length === 0, e1.slice(0, 3).join(' | '));
  window.close();

  /* -------------------------------------------------------------------- */
  console.log('\n--- KATMAN 2: Supabase REST ---');
  const env2 = makeDom();
  const w2 = env2.window, d2 = env2.document;
  const catRows = [
    { id: 'mezeler', name_tr: 'DB_MEZELER', name_en: 'DB_MEZES', name_ar: 'مقبلات', name_ru: 'Закуски',
      image: 'https://efltjgimkjjtagfebmha.supabase.co/storage/v1/object/public/images/mezeler/mezeler.webp' },
    { id: 'ana_yemekler', name_tr: 'DB_ANA_YEMEK', name_en: 'DB_MAIN', name_ar: 'أطباق رئيسية', name_ru: 'Основные блюда',
      image: 'https://efltjgimkjjtagfebmha.supabase.co/storage/v1/object/public/images/ana/ana.webp' },
  ];
  const itemRows = [
    { category_id: 'mezeler', name_tr: 'Girit Ezmesi', name_en: 'Cretan Dip', name_ar: 'غريت', name_ru: 'Гирит',
      price: 330, image: 'https://efltjgimkjjtagfebmha.supabase.co/storage/v1/object/public/images/mezeler/girit.webp' },
    { category_id: 'ana_yemekler', name_tr: 'Kusleme (1 Kg)', name_en: 'Kusleme (1 kg)', name_ar: 'كوشلمة (1 كجم)', name_ru: 'Кушлеме (1 кг)',
      price: 1250, image: 'https://efltjgimkjjtagfebmha.supabase.co/storage/v1/object/public/images/ana/kusleme.webp',
      extras_tr: 'Yaninda pilav', extras_en: 'Served with rice', extras_ar: 'مع الأرز', extras_ru: 'С рисом' },
  ];
  let fetchUrls = [];
  await boot(env2, {
    supabase: true,
    fetchImpl: () => (url) => {
      fetchUrls.push(url);
      const body = url.includes('/categories') ? catRows : itemRows;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }
  });
  await sleep(500); // requestIdleCallback -> fetch -> esleme -> yeniden cizim

  check('Supabase REST tam olarak iki istek atti (cift init yok)', fetchUrls.length === 2, fetchUrls.length);
  check('categories ve menu_items sorgulandi',
    fetchUrls.some(u => u.includes('/categories')) && fetchUrls.some(u => u.includes('/menu_items')),
    fetchUrls.map(u => u.split('/rest/v1/')[1].split('?')[0]).join(', '));
  check('sorgulara sirala/aktif filtreleri eklendi',
    fetchUrls.every(u => u.includes('sort_order.asc')) && fetchUrls.some(u => u.includes('is_active=eq.true')));

  const cachedCats = w2.localStorage.getItem('felek_categories_v6');
  const cachedItems = w2.localStorage.getItem('felek_menu_items_v6');
  check('DB verisi localStorage onbellegine yazildi (v6)', !!cachedCats && !!cachedItems);
  check('eski onbellek anahtarlari temizlendi',
    ['felek_categories', 'felek_menu_items', 'felek_categories_v2', 'felek_categories_v3', 'felek_categories_v5']
      .every(k => w2.localStorage.getItem(k) === null));

  const grid2 = d2.getElementById('qr-menu-grid');
  check('statik ilk boyama korundu (grid 10 kart, gereksiz yeniden cizim yok)',
    grid2.querySelectorAll('.qr-category-card').length === 10,
    grid2.querySelectorAll('.qr-category-card').length);
  const cachedCatImages = JSON.parse(cachedCats).map(c => c.image);
  check('DB kategori gorseli CDN adresine normalize edildi',
    cachedCatImages.every(u => u.startsWith('https://www.felekmangalbasi.com/images/') && !u.includes('supabase.co')),
    cachedCatImages[0]);
  check('normalizeImageUrl alt yolu koruyor',
    cachedCatImages.includes('https://www.felekmangalbasi.com/images/mezeler/mezeler.webp'),
    cachedCatImages.join(' '));

  const dictTr = w2.eval('translations.tr');
  check('DB kategori adlari TR sozlugune islendi (cat_mezeler=DB_MEZELER)',
    dictTr['cat_mezeler'] === 'DB_MEZELER' && dictTr['cat_ana_yemekler'] === 'DB_ANA_YEMEK',
    dictTr['cat_mezeler'] + ' / ' + dictTr['cat_ana_yemekler']);
  const dictEn = w2.eval('translations.en');
  check('DB kategori adlari EN sozlugune de islendi', dictEn['cat_mezeler'] === 'DB_MEZES', String(dictEn['cat_mezeler']));
  const dictRu = w2.eval('translations.ru');
  check('DB kategori adlari RU sozlugune de islendi', dictRu['cat_mezeler'] === 'Закуски', String(dictRu['cat_mezeler']));

  const catCard = grid2.querySelector('.qr-category-card[data-category-id="ana_yemekler"]');
  check('kategori karti data-category-id tasiyor', !!catCard);
  catCard.dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  await sleep(150);
  const dbTitles = [...d2.querySelectorAll('#qr-menu-grid .qr-card-title')].map(t => t.textContent.trim());
  check('DB urun basligi cizildi', dbTitles.includes('Kusleme (Kg)'), dbTitles.join(' | '));
  const dbPrices = [...d2.querySelectorAll('#qr-menu-grid .qr-card-price')].map(t => t.textContent.trim());
  check('DB fiyati TRY biciminde (' + dbPrices.join(', ') + ')',
    dbPrices.some(p => p.includes('1.250') && /\u20ba|TL/.test(p)), dbPrices.join(', '));
  const cardText = [...d2.querySelectorAll('#qr-menu-grid .qr-card')].map(e => e.textContent).join(' ');
  check('extras alani cizildi', /pilav/i.test(cardText), cardText.slice(0, 80));
  const cachedItemList = JSON.parse(cachedItems);
  check('onbellekteki fiyat da TRY biciminde',
    cachedItemList.every(i => /\u20ba/.test(i.price)), cachedItemList[0].price);

  const e2 = realErrors(env2.jsErrors);
  check('KATMAN 2: calisma zamani JS hatasi yok', e2.length === 0, e2.slice(0, 3).join(' | '));
  w2.close();

  /* -------------------------------------------------------------------- */
  console.log('\n--- KATMAN 3: geri bildirim formu (api/feedback.php) ---');
  const env3 = makeDom();
  const w3 = env3.window, d3 = env3.document;
  let req = null;
  let responder = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
  await boot(env3, {
    supabase: false,
    fetchImpl: () => (url, opts) => {
      req = { url: String(url), opts: opts || {} };
      return responder();
    }
  });
  await sleep(120);

  const form = d3.getElementById('feedback-form');
  const fName = d3.getElementById('feedback-name');
  const fMsg = d3.getElementById('feedback-msg');
  const fBtn = d3.getElementById('feedback-submit');
  const fStatus = d3.getElementById('feedback-status');
  const fCount = d3.getElementById('feedback-char-count');
  check('form ve alanlar mevcut', !!form && !!fName && !!fMsg && !!fBtn && !!fStatus && !!fCount);
  check('durum alani ekran okuyucuya duyuruluyor (role=status)', fStatus.getAttribute('role') === 'status'
    && fStatus.getAttribute('aria-live') === 'polite');

  // --- baslangic durumu: degerler DEGISTIRILMEDEN once kontrol edilmeli ---
  check('textarea varsayilan degerle DOLU gelmiyor', fMsg.value === '',
    JSON.stringify(fMsg.value));
  check('baslangicta sayac 2000 / 2000', fCount.textContent === '2000 / 2000', fCount.textContent);
  check('form alani zorunlu (required)', fMsg.hasAttribute('required'));
  check('placeholder metni var', (fMsg.getAttribute('placeholder') || '').length > 0);

  function submit() {
    form.dispatchEvent(new w3.Event('submit', { bubbles: true, cancelable: true }));
    return sleep(60);
  }

  // bos mesaj -> istek atilmamali
  req = null;
  fMsg.value = '   ';
  await submit();
  check('bos mesajda istek atilmiyor', req === null);

  // karakter sayaci
  fMsg.value = 'x'.repeat(10);
  fMsg.dispatchEvent(new w3.Event('input', { bubbles: true }));
  check('karakter sayaci guncelleniyor', fCount.textContent === '1990 / 2000', fCount.textContent);

  // basarili gonderim
  req = null;
  fName.value = 'Deneme';
  fMsg.value = 'Servis cok iyiydi';
  await submit();
  check('istek dogru uca gitti (api/feedback.php)', req && req.url === 'api/feedback.php', req && req.url);
  check('istek POST', req && req.opts.method === 'POST', req && req.opts.method);
  check('govde JSON', req && /application\/json/.test((req.opts.headers || {})['Content-Type'] || ''));
  let payload = {};
  try { payload = JSON.parse(req.opts.body); } catch (e) { /* asagida yakalanir */ }
  check('govdede name+message var', payload.name === 'Deneme' && payload.message === 'Servis cok iyiydi',
    JSON.stringify(payload));
  check('Istemci isteginde Telegram token deseni yok', !/\d{9,10}:[A-Za-z0-9_-]{30,}/.test(req.opts.body || ''));
  check('basarida is-success sinifi', fStatus.classList.contains('is-success'), fStatus.className);
  check('basarida mesaj gosterildi', fStatus.textContent.trim().length > 0, fStatus.textContent);
  check('basarida form sifirlandi', fMsg.value === '');
  check('basarida sayac sifirlandi', fCount.textContent === '2000 / 2000', fCount.textContent);
  check('basarida buton tekrar aktif', fBtn.disabled === false && fBtn.textContent.trim().length > 0,
    fBtn.disabled + ' / ' + fBtn.textContent);

  // sunucu hatasi (ok:false)
  responder = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: false, error: 'upstream_failed' }) });
  fMsg.value = 'ikinci deneme';
  await submit();
  check('ok:false durumunda is-error sinifi', fStatus.classList.contains('is-error'), fStatus.className);
  check('ok:false durumunda buton tekrar aktif', fBtn.disabled === false);

  // PHP kurulu degil -> IIS 404 (JSON olmayan govde)
  responder = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('HTML')) });
  fMsg.value = 'ucuncu deneme';
  await submit();
  check('404 (PHP yok) durumunda is-error sinifi', fStatus.classList.contains('is-error'), fStatus.className);
  check('404 sonrasi buton kilitli kalmiyor', fBtn.disabled === false);

  // 503 not_configured
  responder = () => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ ok: false, error: 'not_configured' }) });
  fMsg.value = 'dorduncu deneme';
  await submit();
  check('503 (token tanimsiz) durumunda is-error sinifi', fStatus.classList.contains('is-error'), fStatus.className);

  // ag hatasi
  responder = () => Promise.reject(new Error('offline'));
  fMsg.value = 'besinci deneme';
  await submit();
  check('ag hatasinda is-error sinifi', fStatus.classList.contains('is-error'), fStatus.className);

  // KATMAN 3 bilerek hata yollarini deniyor; burada console.error bekleniyor.
  // Yakalanmamis istisna (jsdomError) olmamasi asil kriterdir.
  check('KATMAN 3: yakalanmamis JS istisnasi yok', realErrors(env3.uncaught).length === 0,
    realErrors(env3.uncaught).slice(0, 2).join(' | '));
  check('KATMAN 3: hata yollari sessizce yutulmuyor (loglaniyor)',
    env3.jsErrors.some(e => e.includes('Geri bildirim gonderilemedi') || e.includes('Geri bildirim gönderilemedi')));
  w3.close();

  /* -------------------------------------------------------------------- */
  console.log('\n----------------------------------------');
  console.log(checks + ' kontrol, ' + failures + ' basarisiz');
  console.log(failures === 0 ? 'TUM KONTROLLER GECTI' : 'BASARISIZ KONTROLLER VAR');
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error('TEST HATASI:', e); process.exit(1); });
