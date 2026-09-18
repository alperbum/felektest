#!/usr/bin/env node
/* ==========================================================================
   Tum test suite'lerini sirayla calistirir.
       npm test        (veya)   node tests/run-all.js
   ========================================================================== */
const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = [
  { file: 'check-build.js', label: 'derleme tutarliligi (src/js -> js/script.js)' },
  { file: 'check-pages.js', label: 'sayfa yapisi ve erisilebilirlik' },
  { file: 'check-faq.js', label: 'FAQ paritesi (gorunur metin <-> sema)' },
  { file: 'check-menu.js', label: 'menu davranisi (jsdom)' },
  { file: 'check-security.js', label: 'guvenlik ve paketleme' },
];

let failed = 0;
const results = [];

for (const suite of SUITES) {
  console.log('\n' + '='.repeat(70));
  console.log('SUITE: ' + suite.file + '  —  ' + suite.label);
  console.log('='.repeat(70));
  const res = spawnSync(process.execPath, [path.join(__dirname, suite.file)], {
    stdio: 'inherit',
  });
  const ok = res.status === 0;
  if (!ok) failed++;
  results.push({ file: suite.file, ok });
}

console.log('\n' + '='.repeat(70));
console.log('OZET');
console.log('='.repeat(70));
for (const r of results) {
  console.log('  ' + (r.ok ? 'GECTI' : 'BASARISIZ') + '  ' + r.file);
}
console.log('\n' + (failed === 0
  ? 'TUM SUITE\'LER GECTI'
  : failed + ' suite basarisiz'));
process.exit(failed === 0 ? 0 : 1);
