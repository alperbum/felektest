#!/usr/bin/env node
/* ==========================================================================
   Felek Mangalbaşı — landing sayfaları derleyicisi (bağımlılık yok)

   KULLANIM
     node tools/build-pages.js            # 7 landing sayfasını üret
     node tools/build-pages.js --check    # çıktı güncel mi? (test için)

   GİRDİ
     src/layouts/landing.html   ortak kabuk (head iskeleti, skip-link, nav,
                                footer, GA4). 7 sayfada birebir aynıydı.
     src/pages/<sayfa>.html     front matter (JSON) + sayfaya özel içerik

   ÇIKTI
     <sayfa>.html  (depo kökü)  — yol ve ad değişmez; web.config, sitemap.xml,
     FTP allowlist ve tüm iç bağlantılar aynı kalır.

   JSON-LD
     @graph sırası: main → BreadcrumbList → Restaurant → FAQPage → extra
     BreadcrumbList canonical + sayfa adından ÜRETİLİR (elle bakım yok).
     FAQPage görünür <details> metniyle birebir aynı kalmalıdır; olduğu gibi
     saklanır ve paritesi tests/check-faq.js tarafından denetlenir.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const LAYOUT = path.join(ROOT, 'src', 'layouts', 'landing.html');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const SITE = 'https://www.felekmangalbasi.com/';
const MACRO_RE = /\{\{[A-Z_]+\}\}/g;

const readFrontMatter = (text, file) => {
  if (!text.startsWith('---\n')) throw new Error(file + ': front matter (---) ile başlamıyor');
  const end = text.indexOf('\n---\n', 3);
  if (end < 0) throw new Error(file + ': front matter kapanışı (---) yok');
  const json = text.slice(4, end + 1);
  const body = text.slice(end + 5);
  let meta;
  try { meta = JSON.parse(json); } catch (e) {
    throw new Error(file + ': front matter JSON hatası -> ' + e.message);
  }
  return { meta, body };
};

/** @graph düğümlerini sıralı ve eksiksiz üretir. */
function buildGraph(meta, canonical) {
  const graph = [];
  if (meta.jsonld && meta.jsonld.main) graph.push(meta.jsonld.main);
  graph.push({
    '@type': 'BreadcrumbList',
    '@id': canonical + '#breadcrumb',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE },
      { '@type': 'ListItem', position: 2, name: meta.pageName, item: canonical },
    ],
  });
  if (meta.jsonld && meta.jsonld.restaurant) graph.push(meta.jsonld.restaurant);
  if (meta.jsonld && meta.jsonld.faq) graph.push(meta.jsonld.faq);
  for (const node of (meta.jsonld && meta.jsonld.extra) || []) graph.push(node);
  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * JSON-LD'yi TEK SATIR üretir.
 * JSON-LD makine tarafından okunur, girinti yalnızca sayfa ağırlığı ekler.
 * (Orijinal dosyalarda 2 boşluk girinti + satır içi nesneler karışıktı;
 * tek satır hem daha küçük hem tutarlı. İçerik birebir aynı kalır —
 * tools/verify-pages.js JSON-LD'yi derin eşitlikle karşılaştırır.)
 * Elle okunabilir sürüm src/pages/<sayfa>.html front matter'ındadır.
 */
const indentJson = obj => JSON.stringify(obj);

function renderPage(slug, layout) {
  const file = path.join(PAGES_DIR, slug + '.html');
  const { meta, body } = readFrontMatter(fs.readFileSync(file, 'utf8'), slug + '.html');

  const canonical = SITE + slug + '.html';
  const values = {
    TITLE: meta.title,
    DESCRIPTION: meta.description,
    KEYWORDS: meta.keywords,
    CANONICAL: canonical,
    JSONLD: indentJson(buildGraph(meta, canonical)),
    CONTENT: body,
  };

  let out = layout;
  for (const [key, value] of Object.entries(values)) {
    // replaceAll sart: TITLE/DESCRIPTION/CANONICAL birden fazla yerde gecer
    // (title, og:title, twitter:title ...)
    out = out.split('{{' + key + '}}').join(value);
  }
  const leftover = out.match(MACRO_RE);
  if (leftover) throw new Error(slug + ': doldurulmamış yer tutucu -> ' + leftover.join(', '));

  // HTML/CSS guvenlik agi: ampul kacislari ve JSON-LD butunlugu
  checkHtml(out, slug);
  return out;
}

function checkHtml(html, slug) {
  const jsonld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!jsonld) throw new Error(slug + ': JSON-LD bloğu yok');
  try {
    const parsed = JSON.parse(jsonld[1]);
    if (!parsed['@graph'] || !parsed['@graph'].length) throw new Error('@graph boş');
  } catch (e) {
    throw new Error(slug + ': JSON-LD geçersiz -> ' + e.message);
  }
  // Kaçırılmamış & (entity'ler hariç).
  // NOT: <script> içeriği HTML olarak ÇÖZÜMLENMEZ; JSON-LD'de düz & doğrudur
  // (orijinal dosyalarda da böyleydi). Bu yüzden JSON-LD bloğu hariç taranır.
  const htmlWithoutJsonLd = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const badAmp = [...htmlWithoutJsonLd.matchAll(/&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#x[0-9a-fA-F]{1,6});)/g)];
  if (badAmp.length) {
    throw new Error(slug + ': kaçırılmamış & karakteri (' + badAmp.length + ' adet)');
  }
  const singleH1 = (html.match(/<h1[\s>]/g) || []).length;
  if (singleH1 !== 1) throw new Error(slug + ': <h1> sayısı ' + singleH1 + ' (1 olmalı)');
}

function buildAll() {
  const layout = fs.readFileSync(LAYOUT, 'utf8');
  const slugs = fs.readdirSync(PAGES_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace(/\.html$/, ''))
    .sort();
  const out = {};
  for (const slug of slugs) out[slug] = renderPage(slug, layout);
  return out;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  let pages;
  try {
    pages = buildAll();
  } catch (e) {
    console.error('[HATA] ' + e.message);
    process.exit(1);
  }

  let stale = 0;
  const names = Object.keys(pages);
  for (const slug of names) {
    const target = path.join(ROOT, slug + '.html');
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    if (checkOnly) {
      if (current !== pages[slug]) {
        stale++;
        console.error('[BAYAT] ' + slug + '.html kaynakla güncel değil.');
        if (current !== null) {
          const a = current.split('\n'), b = pages[slug].split('\n');
          for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if (a[i] !== b[i]) {
              console.error('        ilk fark ' + (i + 1) + '. satırda:');
              console.error('          disk  : ' + JSON.stringify((a[i] || '').slice(0, 70)));
              console.error('          kaynak: ' + JSON.stringify((b[i] || '').slice(0, 70)));
              break;
            }
          }
        }
      }
      continue;
    }
    if (current !== pages[slug]) {
      fs.writeFileSync(target, pages[slug], 'utf8');
      console.log('[YAZILDI] ' + slug + '.html  (' + Buffer.byteLength(pages[slug], 'utf8') + ' bayt)');
    } else {
      console.log('[AYNI]    ' + slug + '.html');
    }
  }

  if (checkOnly) {
    if (stale) {
      console.error('\n[HATA] ' + stale + ' sayfa bayat. Düzeltmek için: node tools/build-pages.js');
      process.exit(1);
    }
    console.log('[OK] 7 landing sayfası kaynakla güncel.');
    process.exit(0);
  }

  console.log('\n' + names.length + ' sayfa üretildi. Şablon: src/layouts/landing.html');
}

main();
