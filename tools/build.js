#!/usr/bin/env node
/* ==========================================================================
   Felek Mangalbaşı — derleme adımı (bağımlılık yok, saf Node)
   --------------------------------------------------------------------------
   src/js/*.js parçalarını tek bir js/script.js dosyasında birleştirir.

   NEDEN PARÇA (FRAGMENT)?
   js/script.js'in tamamı tek bir DOMContentLoaded closure'ı içinde çalışır ve
   iç durumu (categories, menuData, currentView, activeCategory, translations
   sözlüğü) o kapsamda paylaşılır. Parçaları ayrı IIFE'lere çevirmek kapsamı
   böler ve davranışı değiştirir (örn. 02-i18n.js içindeki
   `typeof renderCategories === 'function'` yedeği erişilemez hâle gelir).
   Bu yüzden parçalar aynı kapsamı paylaşır; birleştirme sırası korunur.

   KULLANIM
     node tools/build.js                 # js/script.js'i yeniden üret
     node tools/build.js --check         # çıktı güncel mi? (CI/test için)
     node tools/build.js --verify <ref>  # git ref'e göre fark raporu

   ÇIKTI
     js/script.js  — sayfaların yüklediği tek dosya (yol ve ad değişmez,
     böylece HTML, önbellek (?v=5.1) ve FTP dağıtımı etkilenmez).
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'js');
const OUT_FILE = path.join(ROOT, 'js', 'script.js');
const MANIFEST = path.join(SRC_DIR, 'manifest.json');

/* js/script.js'in 1. satırı bu banner ile değiştirilir; kalan satırların
   kaynakla byte-byte aynı olması --verify ile kanıtlanır. */
const BANNER_LINES = [
  '/* ==========================================================================',
  '   js/script.js — OTOMATİK ÜRETİLMİŞ DOSYA, ELLE DÜZENLEMEYİN.',
  '   --------------------------------------------------------------------------',
  '   Kaynak : src/js/parça dosyaları (sıra: src/js/manifest.json)',
  '   Derle  : node tools/build.js',
  '   Kontrol: node tools/build.js --check',
  '   ========================================================================== */',
];

const CLOSER = '});';

/** Parçanın başındaki başlık yorum bloğunu (ve hemen ardındaki tek boş satırı) atar. */
function stripHeaderBlock(text) {
  const lines = text.split('\n');
  if (!lines[0] || !lines[0].startsWith('/*')) return lines;
  let i = 0;
  while (i < lines.length && !lines[i].trimEnd().endsWith('*/')) i++;
  i++; // kapanış satırını da atla
  // DİKKAT: gövdenin kendi boş satırları KORUNMALI (byte-byte eşitlik için).
  return lines.slice(i);
}

function readManifest() {
  if (!fs.existsSync(MANIFEST)) {
    throw new Error('manifest bulunamadı: src/js/manifest.json');
  }
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  if (!Array.isArray(m.fragments) || m.fragments.length === 0) {
    throw new Error('manifest.json içinde "fragments" listesi boş');
  }
  return m;
}

function build() {
  const manifest = readManifest();
  const body = [];

  for (const rel of manifest.fragments) {
    const file = path.join(SRC_DIR, rel);
    if (!fs.existsSync(file)) {
      throw new Error('parça bulunamadı: src/js/' + rel);
    }
    const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    body.push(...stripHeaderBlock(text));
  }

  // Orijinal dosyanın 1. satırı (Supabase notu) yerine üretilmiş-dosya bannerı.
  const out = [
    ...BANNER_LINES,
    "document.addEventListener('DOMContentLoaded', () => {",
    ...body,
    CLOSER,
    '',
    '',
  ].join('\n');

  return out;
}

function syntaxCheck(source) {
  // Tarayıcı bağlamı olmadan derlenebilirliğini doğrula
  new vm.Script(source, { filename: 'js/script.js' });
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const verifyIdx = args.indexOf('--verify');
  const verifyRef = verifyIdx >= 0 ? args[verifyIdx + 1] : null;

  let output;
  try {
    output = build();
    syntaxCheck(output);
  } catch (e) {
    console.error('[HATA] Derleme başarısız: ' + e.message);
    process.exit(1);
  }

  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : null;

  if (checkOnly) {
    if (current === output) {
      console.log('[OK] js/script.js kaynakla güncel (' + output.split('\n').length + ' satır).');
      process.exit(0);
    }
    console.error('[HATA] js/script.js kaynakla GÜNCEL DEĞİL.');
    console.error('       Düzeltmek için: node tools/build.js');
    const curLines = (current || '').split('\n');
    const outLines = output.split('\n');
    for (let i = 0; i < Math.max(curLines.length, outLines.length); i++) {
      if (curLines[i] !== outLines[i]) {
        console.error('       İlk fark ' + (i + 1) + '. satırda:');
        console.error('         disk : ' + JSON.stringify((curLines[i] || '').slice(0, 70)));
        console.error('         kaynak: ' + JSON.stringify((outLines[i] || '').slice(0, 70)));
        break;
      }
    }
    process.exit(1);
  }

  if (verifyRef) {
    const refSource = execSync('git show ' + verifyRef + ':js/script.js', {
      cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    });
    // 1. satır banner ile değiştirildi; kalan her şey byte-byte aynı olmalı.
    const refTail = refSource.split('\n').slice(1).join('\n');
    const outTail = output.split('\n').slice(BANNER_LINES.length).join('\n');
    if (refTail === outTail) {
      console.log('[OK] Derlenen çıktı ' + verifyRef + ' ile BYTE-BYT AYNI.');
      console.log('     -> Parçalama işlemi davranışı değiştirmedi (kanıt).');
      process.exit(0);
    }
    console.error('[FARK] Çıktı ' + verifyRef + ' ile aynı değil (banner sonrası).');
    const a = refTail.split('\n'), b = outTail.split('\n');
    let diffs = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        if (diffs < 5) {
          console.error('  satır ' + (i + 1) + ':');
          console.error('    ref    : ' + JSON.stringify((a[i] || '').slice(0, 80)));
          console.error('    derlenen: ' + JSON.stringify((b[i] || '').slice(0, 80)));
        }
        diffs++;
      }
    }
    console.error('  toplam farklı satır: ' + diffs);
    process.exit(1);
  }

  if (current === output) {
    console.log('[OK] Değişiklik yok; js/script.js zaten güncel.');
    process.exit(0);
  }

  fs.writeFileSync(OUT_FILE, output, 'utf8');
  const lines = output.split('\n').length;
  console.log('[YAZILDI] js/script.js  (' + lines + ' satır, ' + Buffer.byteLength(output, 'utf8') + ' bayt)');
  const manifest = readManifest();
  console.log('           ' + manifest.fragments.length + ' parça birleştirildi: ' + manifest.fragments.join(', '));
}

main();
