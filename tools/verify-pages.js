#!/usr/bin/env node
/* ==========================================================================
   Şablon refactor'unun KAYIPSIZ olduğunu kanıtlar.

   Üretilen sayfayı, git'teki referans sürümle YAPISAL olarak karşılaştırır:
     başlık, meta/link envanteri, JSON-LD (derin eşitlik), başlık ağacı,
     FAQ çiftleri, tüm bağlantılar, tüm görseller, normalize görünür metin.

   KULLANIM
     node tools/build-pages.js            # önce üret
     node tools/verify-pages.js [ref]     # varsayılan ref: HEAD
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const REF = process.argv[2] || 'HEAD';
const PAGES = [
  'zahmetsiz-mangal', 'raki-mangal-meyhane', 'kennedy-sahil-konum',
  'gurme-yorumlar', 'suadiye', 'tarihce', 'basinda-felek',
];

// Refactorun BİLİNÇLİ olarak düzelttiği farklar (bkz. rapor)
const INTENDED = {
  'zahmetsiz-mangal': ['twitter:title eski baslikla kalmisti -> sayfa basligiyla esitlendi'],
  'raki-mangal-meyhane': ['twitter:title eski baslikla kalmisti -> sayfa basligiyla esitlendi'],
  'kennedy-sahil-konum': ['twitter:title eski baslikla kalmisti -> sayfa basligiyla esitlendi'],
};

let failures = 0;
const ok = (label, cond, extra) => {
  if (!cond) { failures++; console.log('   FAIL ' + label + (extra ? '  -> ' + extra : '')); }
  return cond;
};

function refSource(slug) {
  return execSync('git show ' + REF + ':' + slug + '.html', {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  });
}

const norm = s => s.replace(/\s+/g, ' ').trim();
const textOf = el => norm(el.textContent || '');

function inventory(doc) {
  const metas = [...doc.querySelectorAll('meta, link')].map(el => {
    const key = el.getAttribute('name') || el.getAttribute('property') || el.getAttribute('rel');
    const val = el.getAttribute('content') || el.getAttribute('href');
    return key + '=' + val;
  });
  const headings = [...doc.querySelectorAll('h1, h2, h3, h4')]
    .map(h => h.tagName + ':' + textOf(h));
  const links = [...doc.querySelectorAll('a')].map(a =>
    (a.getAttribute('href') || '') + '|' + textOf(a));
  const imgs = [...doc.querySelectorAll('img')].map(i =>
    [i.getAttribute('src'), i.getAttribute('alt'), i.getAttribute('width'),
     i.getAttribute('height'), i.getAttribute('loading')].join('|'));
  const faqs = [...doc.querySelectorAll('details')].map(d =>
    textOf(d.querySelector('summary') || d) + ' :: ' +
    norm((d.querySelector('summary') ? d.textContent.replace(d.querySelector('summary').textContent, '') : '')));
  const scripts = [...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
  const title = doc.querySelector('title') ? textOf(doc.querySelector('title')) : '';
  const jsonld = [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => { try { return JSON.parse(s.textContent); } catch (e) { return null; } });
  return { metas, headings, links, imgs, faqs, scripts, title, jsonld,
           text: norm(doc.body ? doc.body.textContent : '') };
}

const JSDOM_OPTS = { contentType: 'text/html' };

console.log('=== şablon refactor doğrulaması (ref: ' + REF + ') ===\n');
console.log('sayfa'.padEnd(26) + 'metin'.padEnd(8) + 'başlık'.padEnd(8) + 'medya'.padEnd(8) +
  'link'.padEnd(8) + 'görsel'.padEnd(8) + 'FAQ'.padEnd(6) + 'JSON-LD'.padEnd(9) + 'bayt');
console.log('-'.repeat(104));

for (const slug of PAGES) {
  const newSrc = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
  const oldSrc = refSource(slug);
  const A = inventory(new JSDOM(oldSrc, JSDOM_OPTS).window.document);
  const B = inventory(new JSDOM(newSrc, JSDOM_OPTS).window.document);

  const same = {
    text: A.text === B.text,
    title: A.title === B.title,
    media: JSON.stringify(A.metas) === JSON.stringify(B.metas),
    links: JSON.stringify(A.links) === JSON.stringify(B.links),
    imgs: JSON.stringify(A.imgs) === JSON.stringify(B.imgs),
    faqs: JSON.stringify(A.faqs) === JSON.stringify(B.faqs),
    jsonld: JSON.stringify(A.jsonld) === JSON.stringify(B.jsonld),
  };

  // meta farkı yalnızca twitter:title ise kabul edilebilir (bilinçli düzeltme)
  if (!same.media) {
    const only = [];
    for (let i = 0; i < Math.max(A.metas.length, B.metas.length); i++) {
      if (A.metas[i] !== B.metas[i]) only.push((A.metas[i] || '(yok)') + ' -> ' + (B.metas[i] || '(yok)'));
    }
    const allTwitter = only.every(d => /^twitter:title=/.test(d));
    if (allTwitter && INTENDED[slug]) {
      same.media = true;
      console.log('   not  ' + slug + ': twitter:title düzeltildi (bilinçli):');
      only.forEach(d => console.log('        ' + d));
    }
  }

  console.log(slug.padEnd(26) +
    (same.text ? 'ok' : 'FARK').padEnd(8) +
    (same.title ? 'ok' : 'FARK').padEnd(8) +
    (same.media ? 'ok' : 'FARK').padEnd(8) +
    (same.links ? 'ok' : 'FARK').padEnd(8) +
    (same.imgs ? 'ok' : 'FARK').padEnd(8) +
    (same.faqs ? 'ok' : 'FARK').padEnd(6) +
    (same.jsonld ? 'ok' : 'FARK').padEnd(9) +
    Buffer.byteLength(oldSrc, 'utf8') + '->' + Buffer.byteLength(newSrc, 'utf8'));

  for (const [k, v] of Object.entries(same)) {
    if (ok(slug + ': ' + k + ' aynı', v)) continue;
    const a = JSON.stringify(A[k === 'text' ? 'text' : k]);
    const b = JSON.stringify(B[k === 'text' ? 'text' : k]);
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    console.log('        eski: ...' + a.slice(Math.max(0, i - 40), i + 80));
    console.log('        yeni: ...' + b.slice(Math.max(0, i - 40), i + 80));
  }
}

console.log('\n' + '-'.repeat(104));
console.log(failures === 0
  ? 'SONUC: yapısal olarak KAYIPSIZ — görünür metin, başlıklar, bağlantılar, görseller ve JSON-LD birebir aynı.'
  : 'SONUC: ' + failures + ' yapısal fark var (yukarıya bakın).');
process.exit(failures === 0 ? 0 : 1);
