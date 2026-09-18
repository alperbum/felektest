"""
Felek Mangalbaşı — geliştirme araçları için ortak yapılandırma
===============================================================================
Bu modül, kimlik bilgilerinin TEK kaynaktan okunmasını sağlar. Daha önce
Telegram bot token'ı ve FTP şifresi şu dosyalarda düz metin olarak tekrar
ediyordu:

    deploy_ftp.py, ga4_tool.py, report_tool.py, menu.html, api/feedback.php

Artık tüm araçlar buradan okur; değerler depoya girmez.

Öncelik sırası:
    1) Ortam değişkeni
    2) Depo kökündeki .env dosyası   (bkz. .env.example)

Kullanım:
    from tools_config import get, require

    token = get('TG_BOT_TOKEN')
    host, user, password = require('FTP_HOST', 'FTP_USER', 'FTP_PASS')
"""

import os
import sys

ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')

# Aynı anlamı taşıyan alternatif anahtar adları (geriye dönük uyumluluk)
ALIASES = {
    'TG_BOT_TOKEN': ('TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN'),
    'TG_CHAT_ID': ('TELEGRAM_CHAT_ID', 'TELEGRAM_CHAT_ID'),
}


def load_env_file(path=ENV_FILE):
    """Basit .env okuyucu. Bağımlılık yok; KEY=VALUE satırlarını okur."""
    values = {}
    if not os.path.isfile(path):
        return values
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            if line.startswith('export '):
                line = line[len('export '):]
            key, _, value = line.partition('=')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key:
                values[key] = value
    return values


_ENV_CACHE = None


def _env():
    global _ENV_CACHE
    if _ENV_CACHE is None:
        _ENV_CACHE = load_env_file()
    return _ENV_CACHE


def get(key, default=''):
    """Ortam değişkeni -> .env -> alias -> default sırasıyla değeri çözer."""
    value = os.environ.get(key)
    if value:
        return value
    value = _env().get(key)
    if value:
        return value
    for alias in ALIASES.get(key, ()):
        value = os.environ.get(alias) or _env().get(alias)
        if value:
            return value
    return default


def require(*keys):
    """
    Anahtarları zorunlu olarak çözer. Eksikse anlaşılır bir hata basıp
    çıkış yapar (sessizce yanlış davranmak yerine).
    """
    values = []
    missing = []
    for key in keys:
        value = get(key)
        if not value:
            missing.append(key)
        values.append(value)
    if missing:
        print('[HATA] Eksik yapilandirma: ' + ', '.join(missing), file=sys.stderr)
        print('       Ortam degiskeni tanimlayin ya da .env dosyasi olusturun.', file=sys.stderr)
        print('       Ornek icin bkz. .env.example', file=sys.stderr)
        sys.exit(1)
    return values


def masked(value):
    """Loglara yazılabilir maskeli gösterim."""
    if not value:
        return '(tanimsiz)'
    if len(value) <= 8:
        return '*' * len(value)
    return value[:4] + '*' * (len(value) - 8) + value[-4:]
