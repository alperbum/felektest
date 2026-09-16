/* ==========================================================================
   Felek Mangalbasi — sayfa dogrulama testi
   -------------------------------------------------------------------------
   Kurulum ve calistirma:
       npm i jsdom --no-save
       node tests/check-pages.js

   Ne yapar:
   1. Her sayfayi jsdom icinde gercek DOM olarak yukler.
   2. js/site.js'i calistirir ve su kod yollarini dogrular:
      - #year (footer yili)
      - IntersectionObserver olmadiginda reveal fallback'i
      - #menu-toggle click -> #header.active + aria-expanded
      - nav link click / Escape -> menu kapanmasi
      - aria-current="page" eslesmesi
      - .land-faq-item 'toggle' -> tek acik akordeon
   3. Yapi denetimi: tek <h1>, skip link, 3 sutunlu footer, inline style yok,
      <style> blogu yok, emoji yok, JSON-LD semasi mevcut.

   Not: IntersectionObserver'li (gercek tarayici) dal icin
        tests/check-observer.js kullanilir.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const SITE_JS = fs.readFileSync(path.join(ROOT, 'js/site.js'), 'utf8');

const LANDING = ['zahmetsiz-mangal.html', 'raki-mangal-meyhane.html', 'kennedy-sahil-konum.html',
                 'gurme-yorumlar.html', 'suadiye.html', 'tarihce.html', 'basinda-felek.html'];
const PAGES = ['index.html', 'menu.html', ...LANDING];

const PICTOGRAPH = /[\u{1F000}-\u{1FAFF}\u2300-\u27BF\u2B00-\u2BFF\uFE0F]/u;

let failures = 0;
function check(label, cond, extra) {
  if (cond) console.log('   ok   ' + label);
  else { console.log('   FAIL ' + label + (extra ? '  -> ' + extra : '')); failures++; }
}

for (const page of PAGES) {
  console.log('\n=== ' + page + ' ===');
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://www.felekmangalbasi.com/' + page,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const { document } = window;
  const errors = [];
  window.addEventListener('error', e => errors.push(String(e.message)));

  window.eval('document.documentElement.classList.add("js");');
  window.eval(SITE_JS);
  document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

  // --- js/site.js code paths ------------------------------------------- //
  const yearEl = document.getElementById('year');
  if (yearEl) {
    check('footer yili guncel yila ayarlandi',
      yearEl.textContent === String(new Date().getFullYear()), '"' + yearEl.textContent + '"');
  }
  const reveals = document.querySelectorAll('.reveal');
  const visible = document.querySelectorAll('.reveal.visible');
  check('reveal fallback: ' + reveals.length + ' oge gorunur',
    reveals.length === 0 || reveals.length === visible.length,
    reveals.length + ' vs ' + visible.length);
  check('html.js sinifi eklendi', document.documentElement.classList.contains('js'));

  const header = document.getElementById('header');
  const toggle = document.getElementById('menu-toggle');
  if (toggle && header) {
    check('nav kapali basliyor',
      !header.classList.contains('active') && toggle.getAttribute('aria-expanded') === 'false');
    toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('hamburger menuyu aciyor',
      header.classList.contains('active') && toggle.classList.contains('active') &&
      toggle.getAttribute('aria-expanded') === 'true');
    toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('hamburger menuyu kapatiyor',
      !header.classList.contains('active') && toggle.getAttribute('aria-expanded') === 'false');
    toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    header.querySelector('.nav-links a').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('nav linki tiklaninca menu kapaniyor', !header.classList.contains('active'));
    toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('Escape menuyu kapatiyor', !header.classList.contains('active'));
  } else {
    check('hamburger butonu mevcut', false, '#menu-toggle veya #header yok');
  }

  const links = [...(header ? header.querySelectorAll('.nav-links a') : [])];
  const expected = links.filter(a =>
    (a.getAttribute('href') || '').split('/').pop().split('#')[0] === page).length;
  const actual = header ? header.querySelectorAll('.nav-links a[aria-current="page"]').length : -1;
  check('aria-current guncel sayfayla eslesiyor (' + expected + ' beklenen)', actual === expected,
    'bulunan ' + actual);

  const items = document.querySelectorAll('.land-faq .land-faq-item');
  if (items.length > 1) {
    items[0].open = true; items[0].dispatchEvent(new window.Event('toggle'));
    items[1].open = true; items[1].dispatchEvent(new window.Event('toggle'));
    const openCount = [...items].filter(i => i.open).length;
    check('FAQ akordeonu tek acik tutuyor', openCount === 1, openCount + ' acik');
  }

  // --- structure --------------------------------------------------------- //
  check('<main> mevcut', !!document.querySelector('main[id]'));
  check('skip link mevcut', !!document.querySelector('.skip-link'));
  check('tek <h1>', document.querySelectorAll('h1').length === 1,
    String(document.querySelectorAll('h1').length));
  check('footer 3 sutun', document.querySelectorAll('footer > div').length === 3);
  check('footer site haritasi >= 7 ic link',
    document.querySelectorAll('.footer-links a').length >= 7,
    String(document.querySelectorAll('.footer-links a').length));
  check('inline style yok', !/\sstyle=/.test(html));
  check('<style> blogu yok', !/<style/.test(html));
  check('emoji/piktograf yok', !PICTOGRAPH.test(
    html.replace(/<script[\s\S]*?<\/script>/g, '')));
  check('JSON-LD semasi var', /application\/ld\+json/.test(html));
  check('cikis yapan bare & yok',
    !/&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,30}|#\d{1,6}|#x[0-9a-fA-F]{1,6});)/
      .test(html.replace(/<script[\s\S]*?<\/script>/g, '')));

  if (LANDING.includes(page)) {
    check('css/landing.css yukleniyor', /css\/landing\.css/.test(html));
    check('js/site.js yukleniyor', /js\/site\.js/.test(html));
    check('BreadcrumbList semasi var', /BreadcrumbList/.test(html));
    check('WebPage/AboutPage/CollectionPage semasi var',
      /"@type":\s*"(WebPage|AboutPage|CollectionPage)"/.test(html));
  }

  check('JS calisma zamani hatasi yok', errors.length === 0, errors.join(' | '));
  window.close();
}

console.log('\n----------------------------------------');
console.log(failures === 0 ? 'TUM KONTROLLER GECTI' : failures + ' KONTROL BASARISIZ');
process.exit(failures === 0 ? 0 : 1);
