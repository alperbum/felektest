#!/usr/bin/env python3
"""
Felek Mangalbaşı — FTP dağıtım betiği
===============================================================================
KİMLİK BİLGİLERİ ARTIK KODDA DEĞİL.

Öncelik sırası:
  1) Ortam değişkenleri : FTP_HOST / FTP_USER / FTP_PASS
  2) .env dosyası       : depo kökünde, git'e girmez (bkz. .env.example)

Kullanım:
  python deploy_ftp.py            # dağıtımı başlatır
  python deploy_ftp.py --check    # bağlanmadan yapılandırmayı doğrular

NOT: Bu betik, kimlik bilgileri git geçmişinde düz metin olarak durduğu için
FTP şifresinin DEĞİŞTİRİLMESİNDEN sonra kullanılmalıdır.
===============================================================================
"""

import ftplib
import os
import sys
import time

from tools_config import get, load_env_file

FTP_KEYS = ('FTP_HOST', 'FTP_USER', 'FTP_PASS')


def load_credentials():
    """Ortam değişkeni > .env sırasıyla kimlik bilgilerini çözer."""
    return {key: get(key) for key in FTP_KEYS}


def get_ftp_connection(creds):
    for attempt in range(1, 4):
        try:
            ftp = ftplib.FTP(creds['FTP_HOST'], timeout=30)
            ftp.login(creds['FTP_USER'], creds['FTP_PASS'])
            return ftp
        except Exception as e:
            print(f'FTP baglanti denemesi {attempt} basarisiz: {e}. 3sn sonra tekrar deneniyor...')
            time.sleep(3)
    raise Exception('FTP sunucusuna 3 denemede de baglanilamadi.')


def ensure_ftp_dir(ftp, remote_dir, checked_dirs):
    norm_dir = remote_dir.replace('\\', '/').strip('/')
    if not norm_dir or norm_dir in checked_dirs:
        return
    parts = [p for p in norm_dir.split('/') if p]
    cur = ''
    for p in parts:
        cur += '/' + p
        if cur not in checked_dirs:
            try:
                ftp.cwd(cur)
            except Exception:
                try:
                    ftp.mkd(cur)
                except Exception:
                    pass
            checked_dirs.add(cur)
    ftp.cwd('/')
    checked_dirs.add(norm_dir)


def upload_file_safe(ftp, local_path, remote_path, skip_if_same_size=False, creds=None):
    local_size = os.path.getsize(local_path)
    if skip_if_same_size:
        try:
            remote_size = ftp.size(remote_path)
            if remote_size == local_size:
                return ftp, True  # Skipped (already up to date)
        except Exception:
            pass

    for attempt in range(1, 4):
        try:
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
            return ftp, False
        except Exception as e:
            print(f'  [Uyari] {remote_path} yukleme hatasi ({e}), yeniden baglaniliyor...')
            try:
                ftp.quit()
            except Exception:
                pass
            time.sleep(2)
            ftp = get_ftp_connection(creds)
    raise Exception(f'{remote_path} 3 denemede de yuklenemedi.')


# ---------------------------------------------------------------------------
# Dağıtılacak dosyalar. Şablon/strateji belgeleri (*.md), test harness'ı
# (tests/), Python araçları ve kimlik dosyaları BİLİNÇLİ OLARAK yoktur.
# ---------------------------------------------------------------------------
CORE_FILES = [
    'menu.html',
    'index.html',
    'js/script.js',
    'js/translations.js',
    'js/config.js',
    'js/site.js',
    'js/feedback.js',
    'css/style.css',
    'css/landing.css',
    'api/feedback.php',
    'api/upload-image.php',
    'web.config',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'gurme-yorumlar.html',
    'tarihce.html',
    'basinda-felek.html',
    'kennedy-sahil-konum.html',
    'raki-mangal-meyhane.html',
    'zahmetsiz-mangal.html',
    'suadiye.html',
    '_headers',
    'favicon.png',
    'google815b56b5875fd4cb.html',
]


def deploy():
    creds = load_credentials()
    missing = [k for k, v in creds.items() if not v]
    if missing:
        print('[HATA] Eksik FTP kimlik bilgisi: ' + ', '.join(missing))
        print('       Ortam degiskeni tanimlayin ya da .env dosyasi olusturun.')
        print('       Ornek icin bkz. .env.example')
        return 1

    print(f"Connecting to FTP {creds['FTP_HOST']} as {creds['FTP_USER']}...")
    ftp = get_ftp_connection(creds)
    print('Login successful.\n')

    # 1. Upload Core Files (Always overwrite)
    print('--- 1. Ana Kod Dosyalari Yukleniyor ---')
    checked_dirs = set()
    for rel_path in CORE_FILES:
        if os.path.exists(rel_path):
            remote_path = rel_path.replace(os.sep, '/')
            remote_dir = os.path.dirname(remote_path)
            if remote_dir:
                ensure_ftp_dir(ftp, remote_dir, checked_dirs)
            print(f'Uploading {rel_path} -> {remote_path}...')
            ftp, _ = upload_file_safe(ftp, rel_path, remote_path, skip_if_same_size=False, creds=creds)
            print(f'  [Tamam] {remote_path}')
        else:
            print(f'  [Atlandi] {rel_path} (yerelde yok)')

    # 1.1 Sunucu tarafi geri bildirim yapilandirmasi (yerelde varsa guvenle yukle)
    if os.path.exists('api/config.php'):
        remote_path = 'api/config.php'
        remote_dir = os.path.dirname(remote_path)
        if remote_dir:
            ensure_ftp_dir(ftp, remote_dir, checked_dirs)
        print(f'Uploading api/config.php -> {remote_path}...')
        ftp, _ = upload_file_safe(ftp, 'api/config.php', remote_path, skip_if_same_size=False, creds=creds)
        print(f'  [Tamam] {remote_path}')

    # 2. Upload Optimized Images (Skip if size matches)
    if os.path.exists('images'):
        print('\n--- 2. Optimize Gorseller Kontrol Ediliyor & Yukleniyor ---')
        for root, dirs, files in os.walk('images'):
            for file in files:
                if file.lower().endswith(('.webp', '.png', '.jpg', '.jpeg', '.svg')):
                    local_path = os.path.join(root, file)
                    rel_path = os.path.relpath(local_path, '.')
                    remote_path = rel_path.replace(os.sep, '/')
                    remote_dir = os.path.dirname(remote_path)
                    if remote_dir:
                        ensure_ftp_dir(ftp, remote_dir, checked_dirs)
                    ftp, skipped = upload_file_safe(
                        ftp, local_path, remote_path, skip_if_same_size=True, creds=creds
                    )
                    if not skipped:
                        print(f'  [Yuklendi] {remote_path}')

    try:
        ftp.quit()
    except Exception:
        pass
    print('\n[BASARILI] Tum dosyalar ve GA4 guncellemeleri canli sunucuya eksiksiz yuklendi!')
    return 0


def check_config():
    creds = load_credentials()
    print('--- Yapilandirma kontrolu ---')
    for key in ('FTP_HOST', 'FTP_USER', 'FTP_PASS'):
        source = 'ortam degiskeni' if os.environ.get(key) else (
            '.env' if load_env_file().get(key) else 'BULUNAMADI'
        )
        shown = ''
        if creds[key]:
            shown = creds[key] if key != 'FTP_PASS' else '*' * 8
        print(f'  {key:<9} {source:<16} {shown}')
    print()
    print('Dagitilacak dosyalar ({0} adet):'.format(len(CORE_FILES)))
    missing_local = []
    for rel_path in CORE_FILES:
        exists = os.path.exists(rel_path)
        if not exists:
            missing_local.append(rel_path)
        print('  [{0}] {1}'.format('x' if exists else ' ', rel_path))
    if missing_local:
        print('\n[UYARI] Yerelde bulunamayan dosyalar: ' + ', '.join(missing_local))
    if any(not creds[k] for k in creds):
        print('\n[UYARI] Eksik kimlik bilgisi var; dagitim yapilamaz.')
        return 1
    return 0


if __name__ == '__main__':
    if '--check' in sys.argv:
        sys.exit(check_config())
    sys.exit(deploy())
