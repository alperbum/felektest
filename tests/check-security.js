/* ==========================================================================
   Felek Mangalbasi — guvenlik ve paketleme butunlugu testi
   -------------------------------------------------------------------------
       node tests/check-security.js

   Neyi korur:
     1) Yayina giden dosyalarda hardcoded sir (token/sifre/ozel anahtar) olmasi
     2) Kimlik dosyalarinin git tarafindan takip edilmesi
     3) Sayfalarin isaret ettigi yerel varliklarin (js/css) var olmasi
     4) deploy_ftp.py'nin yeni dosyalari allowlist'e almis olmasi
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
function check(label, cond, extra) {
  checks++;
  if (cond) console.log('   ok   ' + label);
  else { console.log('   FAIL ' + label + (extra !== undefined ? '  -> ' + extra : '')); failures++; }
}
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* --- 1. Yayina giden dosya kumesi --------------------------------------- */
const deployed = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter(f => !f.startsWith('tests/'))
  // .md dahil: sir sizintisi en cok dokumantasyonda olur (bkz. .agents/AGENTS.md)
  .filter(f => /\.(html|js|css|php|py|xml|txt|json|md|config)$/.test(f) || f === '_headers' || f === 'robots.txt');

console.log('=== guvenlik ve paketleme testi ===\n');
console.log('--- 1. hardcoded sir taramasi (' + deployed.length + ' dosya) ---');

const SECRET_PATTERNS = [
  { name: 'Telegram bot token', re: /\d{9,10}:[A-Za-z0-9_-]{30,}/ },
  { name: 'Google ozel anahtar blogu', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'JSON private_key alani', re: /"private_key"\s*:/ },
  { name: 'client_email (service account)', re: /"client_email"\s*:\s*"[^"]+@[^"]+\.iam\.gserviceaccount\.com"/ },
  { name: 'FTP_PASS sabiti', re: /FTP_PASS\s*=\s*['"][^'"]+['"]/ },
  // Ornek dosyalardaki yer tutucular (BURAYA_*, YOUR_*, CHANGE_ME, ...) sir degildir;
  // gercek bir token yazilirsa kural yine yakalar.
  { name: 'gizli anahtar tanimi (const/define)',
    re: /(?:define|const)\s*\(\s*['"](?:TG_BOT_TOKEN|TG_CHAT_ID)['"]\s*,\s*['"](?!(?:BURAYA|YOUR_|CHANGE|ORNEK|PLACEHOLDER|xxx|XXX))[^'"]+['"]/ },
];

for (const rule of SECRET_PATTERNS) {
  const hits = [];
  for (const rel of deployed) {
    let content;
    try { content = read(rel); } catch (e) { continue; }
    if (rule.re.test(content)) hits.push(rel);
  }
  check('sir taramasi: ' + rule.name + ' yok', hits.length === 0, hits.join(', '));
}

// Bilincli istisna: Supabase "publishable" anahtari tarayiciya gitmek uzere
// tasarlanmistir (RLS ile korunur). Sir degildir; sadece yorumla belgelenir.
const cfg = read('js/config.js');
check('Supabase anahtari publishable/anon tipinde (sir degil)',
  /sb_publishable_|anon/.test(cfg) && !/service_role/.test(cfg),
  'service_role anahtari asla istemcide olmamali');

console.log('\n--- 2. kimlik dosyalari git takibinde mi ---');
let tracked = [];
try {
  tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
} catch (e) {
  console.log('   (git yok, atlandi)');
}
for (const sensitive of ['service_account.json', 'keywords.txt', 'gsc_compare.json',
  'gsc_ve_isletme_profili_keywords.txt', '.env', 'api/config.php']) {
  check('git takibinde degil: ' + sensitive, !tracked.includes(sensitive));
}
// Niyet: "bu dosyalari takipten cikarirken kullanicinin diskinden silmedim".
// Ama temiz bir klonda bu dosyalar hic var olmamis olabilir; o durumda
// yokluk bir kayip degildir. Bu yuzden varlik DEGIL, ignore kurali sinanir.
const credOnDisk = ['service_account.json', 'keywords.txt', 'gsc_compare.json',
  'gsc_ve_isletme_profili_keywords.txt'].filter(f => fs.existsSync(path.join(ROOT, f)));
let credAllIgnored = true;
for (const f of credOnDisk) {
  try { execSync('git check-ignore -q ' + f, { cwd: ROOT }); }
  catch (e) { credAllIgnored = false; }
}
check('yerelde varsa git tarafindan ignore ediliyor (temiz klonda bos olabilir)',
  credAllIgnored, credOnDisk.join(', ') || '(bu klonda yok)');

console.log('\n--- 3. .gitignore korumasi ---');
const gitignore = read('.gitignore');
for (const pat of ['service_account.json', '.env', 'api/config.php']) {
  check('.gitignore kapsiyor: ' + pat, gitignore.includes(pat));
}
check('.env.example mevcut (ornek dosya gerekli)', fs.existsSync(path.join(ROOT, '.env.example')));
let envExampleIgnored = false;
try {
  execSync('git check-ignore -q .env.example', { cwd: ROOT });
  envExampleIgnored = true;
} catch (e) { /* ignore edilmemis -> istenen durum */ }
check('.env.example git tarafindan ignore EDILMIYOR', !envExampleIgnored);

console.log('\n--- 4. sayfa varlik referanslari ---');
// admin/ ayri Vite uygulamasi; src/ ise DERLEME KAYNAGI (sablon + front matter).
// Ikisi de bilincli olarak yayinlanmaz, allowlist'te olmamalari dogrudur.
const pages = tracked.filter(f => f.endsWith('.html')
  && !f.startsWith('admin/') && !f.startsWith('src/'));
for (const page of pages) {
  const html = read(page);
  const refs = [
    ...[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]),
    ...[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]),
  ]
    .filter(u => !/^(https?:)?\/\//.test(u) && !u.startsWith('data:'))
    .filter(u => /\.(js|css)(\?.*)?$/.test(u))
    .map(u => u.replace(/\?.*$/, ''));

  const missing = [...new Set(refs)].filter(rel => !fs.existsSync(path.join(ROOT, rel)));
  check(page + ' yerel varlik referanslari mevcut', missing.length === 0, missing.join(', '));
}

console.log('\n--- 5. deploy_ftp.py allowlist kapsamasi ---');
const deployPy = read('deploy_ftp.py');
check('allowlist icinde api/feedback.php', deployPy.includes("'api/feedback.php'"));
check('allowlist icinde js/feedback.js', deployPy.includes("'js/feedback.js'"));
check('deploy_ftp.py hardcoded FTP sifresi icermiyor', !/FTP_PASS\s*=\s*['"]/.test(deployPy));
check('deploy_ftp.py ortam degiskeni/.env okuyor',
  deployPy.includes('os.environ.get') && deployPy.includes('.env'));

// Her sayfa ve her js/css dosyasi allowlist'te mi?
const listBlock = deployPy.slice(deployPy.indexOf('CORE_FILES = ['), deployPy.indexOf(']', deployPy.indexOf('CORE_FILES = [')));
const allowlisted = [...listBlock.matchAll(/'([^']+)'/g)].map(m => m[1]);
const mustDeploy = [
  ...pages,
  ...tracked.filter(f => /^(js|css)\/.*\.(js|css)$/.test(f)),
];
// admin/ Vite uygulamasi kapsam disi (web.config ile korunur, bilincli olarak yayinlanmaz)
const notDeployed = mustDeploy.filter(f => !allowlisted.includes(f));
check('tum sayfalar ve js/css dosyalari allowlist\'te', notDeployed.length === 0, notDeployed.join(', '));

console.log('\n--- 6. istemcide Telegram cagrisi kalmadi ---');
for (const page of pages) {
  const html = read(page);
  check(page + ' dogrudan Telegram API cagirmiyor', !html.includes('api.telegram.org'));
}
check('js/feedback.js ayni kaynak uca POST ediyor',
  read('js/feedback.js').includes("api/feedback.php"));
check('_headers CSP connect-src Telegram icermiyor',
  !/_headers CSP|connect-src[^;\n]*api\.telegram\.org/.test(read('_headers')));

console.log('\n----------------------------------------');
console.log(checks + ' kontrol, ' + failures + ' basarisiz');
console.log(failures === 0 ? 'TUM KONTROLLER GECTI' : 'BASARISIZ KONTROLLER VAR');
process.exit(failures === 0 ? 0 : 1);
