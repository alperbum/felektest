/* ==========================================================================
   Felek Mangalbasi — FAQ parite testi
   -------------------------------------------------------------------------
       node tests/check-faq.js

   KABUL KRİTERİ: gorunur <details> metni ile FAQPage semasindaki
   Question/Answer metinleri BIREBIR ayni olmalidir. Google, yapisal veriyi
   gorunur icerikle karsilastirir; uyumsuzluk zengin sonuc kaybi demektir.

   Ayrica her sayfada:
     - gorunur FAQ sayisi = sema sorusu sayisi
     - soru sirasi ayni
     - soru ve cevap metinleri (varliklar cozulmus, bosluklar normalize) ayni
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
function check(label, cond, extra) {
  checks++;
  if (cond) console.log('   ok   ' + label);
  else { console.log('   FAIL ' + label + (extra !== undefined ? '  -> ' + extra : '')); failures++; }
}

const PAGES = [
  'zahmetsiz-mangal.html', 'raki-mangal-meyhane.html', 'kennedy-sahil-konum.html',
  'gurme-yorumlar.html', 'suadiye.html', 'tarihce.html', 'basinda-felek.html',
];

const norm = s => String(s).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

console.log('=== FAQ parite testi (gorunur metin <-> FAQPage) ===\n');

let totalVisible = 0, totalSchema = 0;

for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const doc = new JSDOM(html).window.document;

  // Gorunur FAQ'lar
  const details = [...doc.querySelectorAll('details')];
  const visible = details.map(d => {
    const summary = d.querySelector('summary');
    const q = summary ? norm(summary.textContent) : '';
    const clone = d.cloneNode(true);
    const s2 = clone.querySelector('summary');
    if (s2) s2.remove();
    // cevap: summary disindaki metin (acceptedAnswer ile ayni kapsam)
    const a = norm(clone.textContent.replace(/^\s*[+▾-]\s*/, ''));
    return { q, a };
  });

  // Sema
  const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => { try { return JSON.parse(s.textContent); } catch (e) { return null; } })
    .filter(Boolean);
  const faqNodes = schemas
    .flatMap(d => (d['@graph'] || [d]))
    .filter(n => n && n['@type'] === 'FAQPage');
  const schema = faqNodes.flatMap(n => n.mainEntity || []);

  totalVisible += visible.length;
  totalSchema += schema.length;

  if (visible.length === 0 && schema.length === 0) {
    check(page + ': FAQ yok (gorunur de sema de) — tutarli', true);
    continue;
  }

  check(page + ': gorunur FAQ sayisi = sema sorusu sayisi (' + visible.length + ')',
    visible.length === schema.length, visible.length + ' vs ' + schema.length);

  const mismatches = [];
  const n = Math.min(visible.length, schema.length);
  for (let i = 0; i < n; i++) {
    const sq = norm(schema[i].name);
    const sa = norm(schema[i].acceptedAnswer && schema[i].acceptedAnswer.text);
    if (sq !== visible[i].q) mismatches.push('S' + (i + 1) + ' soru:\n        gorunur: ' + visible[i].q + '\n        sema   : ' + sq);
    if (sa !== visible[i].a) mismatches.push('S' + (i + 1) + ' cevap:\n        gorunur: ' + visible[i].a + '\n        sema   : ' + sa);
  }
  check(page + ': soru/cevap metinleri birebir ayni', mismatches.length === 0,
    mismatches.length ? '\n      ' + mismatches.join('\n      ') : undefined);

  // Sema alan butunlugu
  const badType = schema.filter(q => q['@type'] !== 'Question' ||
    !q.acceptedAnswer || q.acceptedAnswer['@type'] !== 'Answer');
  check(page + ': her mainEntity Question + Answer yapisinda', badType.length === 0,
    badType.length + ' hatali dugum');
}

console.log('\n--- ozet ---');
console.log('   toplam gorunur FAQ: ' + totalVisible + ' | toplam sema sorusu: ' + totalSchema);
check('gorunur ve sema toplamlari esit', totalVisible === totalSchema);
check('sitede FAQ icerigi var (bos regresyonu yok)', totalVisible > 0, totalVisible);

const inJsonLd = PAGES.filter(p => fs.readFileSync(path.join(ROOT, p), 'utf8')
  .includes('"FAQPage"'));
check('FAQPage semasi en az 5 sayfada', inJsonLd.length >= 5, inJsonLd.length + '/7');

console.log('\n----------------------------------------');
console.log(checks + ' kontrol, ' + failures + ' basarisiz');
console.log(failures === 0 ? 'TUM KONTROLLER GECTI' : 'BASARISIZ KONTROLLER VAR');
process.exit(failures === 0 ? 0 : 1);
