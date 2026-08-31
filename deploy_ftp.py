import os
import ftplib
import time

FTP_HOST = '94.73.146.49'
FTP_USER = 'u0298318'
FTP_PASS = '.bdhq=8@JK0S.6P8'

def get_ftp_connection():
    for attempt in range(1, 4):
        try:
            ftp = ftplib.FTP(FTP_HOST, timeout=30)
            ftp.login(FTP_USER, FTP_PASS)
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

def upload_file_safe(ftp, local_path, remote_path, skip_if_same_size=False):
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
            ftp = get_ftp_connection()
    raise Exception(f'{remote_path} 3 denemede de yuklenemedi.')

def deploy():
    print(f'Connecting to FTP {FTP_HOST} as {FTP_USER}...')
    ftp = get_ftp_connection()
    print('Login successful.\n')

    core_files = [
        'menu.html',
        'index.html',
        'js/script.js',
        'js/translations.js',
        'js/config.js',
        'css/style.css',
        'web.config',
        'robots.txt',
        'sitemap.xml',
        'llms.txt',
        'gurme-yorumlar.html',
        'kennedy-sahil-konum.html',
        'raki-mangal-meyhane.html',
        'zahmetsiz-mangal.html',
        'suadiye.html',
        '_headers',
        'favicon.png',
        'google815b56b5875fd4cb.html'
    ]

    # 1. Upload Core Files (Always overwrite)
    print('--- 1. Ana Kod Dosyalari Yukleniyor ---')
    checked_dirs = set()
    for rel_path in core_files:
        if os.path.exists(rel_path):
            remote_path = rel_path.replace(os.sep, '/')
            remote_dir = os.path.dirname(remote_path)
            if remote_dir:
                ensure_ftp_dir(ftp, remote_dir, checked_dirs)
            print(f'Uploading {rel_path} -> {remote_path}...')
            ftp, _ = upload_file_safe(ftp, rel_path, remote_path, skip_if_same_size=False)
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
                    ftp, skipped = upload_file_safe(ftp, local_path, remote_path, skip_if_same_size=True)
                    if not skipped:
                        print(f'  [Yuklendi] {remote_path}')

    try:
        ftp.quit()
    except Exception:
        pass
    print('\n[BASARILI] Tum dosyalar ve GA4 guncellemeleri canli sunucuya eksiksiz yuklendi!')

if __name__ == '__main__':
    deploy()
