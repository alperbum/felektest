/* ==========================================================================
   Felek Mangalbasi — derleme tutarliligi testi
   -------------------------------------------------------------------------
       node tests/check-build.js

   Amac: src/js/*.js (kaynak) ile js/script.js (yayina giden dosya) arasinda
   sessiz ayrisma olusmasini engellemek. Kaynagi duzenleyip derlemeyi unutmak,
   sahada "degisiklik neden gorunmuyor?" sorusunun en sik sebebidir.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
function check(label, cond, extra) {
  checks++;
  if (cond) console.log('   ok   ' + label);
  else { console.log('   FAIL ' + label + (extra !== undefined ? '  -> ' + extra : '')); failures++; }
}
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

console.log('=== derleme tutarliligi testi ===\n');

/* --- 1. kaynak parcalar ------------------------------------------------- */
console.log('--- 1. kaynak parcalari ---');
const manifestPath = path.join(ROOT, 'src', 'js', 'manifest.json');
check('src/js/manifest.json var', fs.existsSync(manifestPath));

let manifest = { fragments: [] };
if (fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (e) {
    check('manifest.json gecerli JSON', false, e.message);
  }
}
check('manifest parca listesi dolu', Array.isArray(manifest.fragments) && manifest.fragments.length > 0,
  manifest.fragments.length);

const missing = manifest.fragments.filter(f => !fs.existsSync(path.join(ROOT, 'src', 'js', f)));
check('manifestteki tum parcalar diskte', missing.length === 0, missing.join(', '));

const stray = fs.existsSync(path.join(ROOT, 'src', 'js'))
  ? fs.readdirSync(path.join(ROOT, 'src', 'js'))
      .filter(f => f.endsWith('.js') && !manifest.fragments.includes(f))
  : [];
check('manifest disi parca dosyasi yok', stray.length === 0, stray.join(', '));

/* --- 2. derleme guncel mi ---------------------------------------------- */
console.log('\n--- 2. derleme guncel mi ---');
const res = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'build.js'), '--check'], {
  cwd: ROOT, encoding: 'utf8',
});
check('js/script.js kaynakla guncel (build --check)', res.status === 0,
  ((res.stderr || '') + (res.stdout || '')).trim().split('\n')[0]);

/* --- 2b. landing sayfalari guncel mi ----------------------------------- */
console.log('\n--- 2b. landing sayfalari guncel mi ---');
const resPages = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'build-pages.js'), '--check'], {
  cwd: ROOT, encoding: 'utf8',
});
check('7 landing sayfasi kaynakla guncel (build-pages --check)', resPages.status === 0,
  ((resPages.stderr || '') + (resPages.stdout || '')).trim().split('\n')[0]);

const LANDING = ['zahmetsiz-mangal', 'raki-mangal-meyhane', 'kennedy-sahil-konum',
  'gurme-yorumlar', 'suadiye', 'tarihce', 'basinda-felek'];
check('src/layouts/landing.html var', fs.existsSync(path.join(ROOT, 'src', 'layouts', 'landing.html')));
const missingSrc = LANDING.filter(s => !fs.existsSync(path.join(ROOT, 'src', 'pages', s + '.html')));
check('her landing sayfasinin kaynagi var (src/pages)', missingSrc.length === 0, missingSrc.join(', '));

// Sayfalar hala duz HTML olarak deploy ediliyor (yol/uzanti degismedi)
for (const s of LANDING) {
  const exists = fs.existsSync(path.join(ROOT, s + '.html'));
  if (!exists) { check(s + '.html kok dizinde', false); }
}
check('7 landing sayfasi kok dizinde uretiliyor', LANDING.every(s => fs.existsSync(path.join(ROOT, s + '.html'))));

/* --- 3. uretilen dosyanin saglamasi ------------------------------------ */
console.log('\n--- 3. uretilen dosya ---');
const built = read('js/script.js');
check('uretilen dosya "elle duzenlemeyin" banneri tasiyor', /OTOMAT[İI]K ÜRET[İI]LM[İI][ŞS]/.test(built));
check('uretilen dosya derlenebilir (sozdizimi)', (() => {
  try { new vm.Script(built, { filename: 'js/script.js' }); return true; } catch (e) { return false; }
})());
check('tek DOMContentLoaded dinleyicisi var', (built.match(/DOMContentLoaded/g) || []).length === 1,
  (built.match(/DOMContentLoaded/g) || []).length);
const openBraces = (built.match(/\{/g) || []).length;
const closeBraces = (built.match(/\}/g) || []).length;
check('parantez dengesi tutarli', Math.abs(openBraces - closeBraces) <= 0,
  openBraces + ' acilis / ' + closeBraces + ' kapanis');

/* --- 4. sayfalar uretilen dosyayi mi yukluyor --------------------------- */
console.log('\n--- 4. sayfa baglantilari ---');
for (const page of ['menu.html', 'index.html']) {
  const html = read(page);
  check(page + ' js/script.js yukluyor', /<script\s+src="js\/script\.js\?v=/.test(html));
  check(page + ' dogrudan src/js/* parca yuklemiyor',
    !/<script\s+src="src\//.test(html));
}

/* --- 5. tek kaynak ilkesi ---------------------------------------------- */
console.log('\n--- 5. tek kaynak ilkesi ---');
// JSON-LD yapisal veri (type="application/ld+json") ve GA4 dataLayer gibi
// KUCUK zorunlu bloklar haric; sayfada buyuk is mantigi inline durmamali.
function inlineScriptSizes(page) {
  const html = read(page);
  return [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(m => !/\bsrc\s*=/.test(m[1]))
    .filter(m => !/application\/ld\+json/.test(m[1]))
    .map(m => ({ lines: m[2].split('\n').length, attrs: m[1].trim() || '(attrsuz)',
                 first: (m[2].split('\n').find(l => l.trim()) || '').trim() }));
}
for (const page of ['menu.html', 'index.html']) {
  const blocks = inlineScriptSizes(page);
  const big = blocks.filter(b => b.lines > 25);
  check(page + ' buyuk inline is mantigi icermiyor (' + blocks.length + ' kucuk blok)',
    big.length === 0, big.map(b => b.lines + ' satir: ' + b.first).join(' | '));
}
const mBlocks = inlineScriptSizes('menu.html');
check('menu.html inline bloklari yalnizca zorunlu isinmalar',
  mBlocks.every(b => /dataLayer|menu-cached/.test(b.first)),
  mBlocks.map(b => b.first).join(' | '));

console.log('\n----------------------------------------');
console.log(checks + ' kontrol, ' + failures + ' basarisiz');
console.log(failures === 0 ? 'TUM KONTROLLER GECTI' : 'BASARISIZ KONTROLLER VAR');
process.exit(failures === 0 ? 0 : 1);
