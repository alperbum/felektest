import os
import ftplib

FTP_HOST = '94.73.146.49'
FTP_USER = 'u0298318'
FTP_PASS = '.bdhq=8@JK0S.6P8'

def ensure_ftp_dir(ftp, remote_dir):
    parts = [p for p in remote_dir.replace('\\', '/').strip('/').split('/') if p]
    cur = ''
    for p in parts:
        cur += '/' + p
        try:
            ftp.cwd(cur)
        except Exception:
            try:
                ftp.mkd(cur)
            except Exception:
                pass
    ftp.cwd('/')

def deploy():
    print(f'Connecting to FTP {FTP_HOST} as {FTP_USER}...')
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    print('Login successful.')

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

    # 1. Upload Core Files
    for rel_path in core_files:
        if os.path.exists(rel_path):
            remote_path = rel_path.replace(os.sep, '/')
            print(f'Uploading {rel_path} -> {remote_path}...')
            with open(rel_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
            print(f'Uploaded: {remote_path}')

    # 2. Upload Optimized Images
    if os.path.exists('images'):
        print('\n--- Uploading Optimized Images ---')
        for root, dirs, files in os.walk('images'):
            for file in files:
                if file.lower().endswith(('.webp', '.png', '.jpg', '.jpeg', '.svg')):
                    local_path = os.path.join(root, file)
                    rel_path = os.path.relpath(local_path, '.')
                    remote_path = rel_path.replace(os.sep, '/')
                    remote_dir = os.path.dirname(remote_path)
                    if remote_dir:
                        ensure_ftp_dir(ftp, remote_dir)
                    print(f'Uploading {rel_path} -> {remote_path}...')
                    with open(local_path, 'rb') as f:
                        ftp.storbinary(f'STOR {remote_path}', f)

    ftp.quit()
    print('\nFTP Deployment finished successfully with all optimized images!')

if __name__ == '__main__':
    deploy()
