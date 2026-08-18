import os
import re
import uuid
import json
import urllib.request
import urllib.error
import sys

# Windows terminal UTF-8 desteği
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Felek Mangalbaşı için Bing (ve Yandex/Seznam) IndexNow Entegrasyonu
# IndexNow, arama motorlarına yeni veya güncellenen içerikleri anında bildirmenin en hızlı yoludur.

DOMAIN = "www.felekmangalbasi.com"
SITEMAP_PATH = "sitemap.xml"
KEY_FILE_PREFIX = "bing_indexnow_key_"

def get_or_create_key():
    # Mevcut bir key dosyası var mı kontrol et
    for filename in os.listdir('.'):
        if filename.endswith('.txt') and (len(filename) == 36 or len(filename) == 32+4):
            # Örnek bir UUID formati: 550e8400-e29b-41d4-a716-446655440000.txt veya tire içermeyen hali
            with open(filename, 'r') as f:
                key = f.read().strip()
                if key == filename[:-4]:
                    return key

    # Yoksa yeni bir key oluştur (UUID v4)
    new_key = str(uuid.uuid4()).replace('-', '')
    key_filename = f"{new_key}.txt"
    
    with open(key_filename, 'w') as f:
        f.write(new_key)
    
    print(f"\n[YENİ API KEY OLUŞTURULDU] {key_filename}")
    print(f"Lütfen bu dosyayı sunucuya (FTP) ana dizine yüklediğinizden emin olun.")
    print(f"URL: https://{DOMAIN}/{key_filename}")
    print("--------------------------------------------------\n")
    return new_key

def get_urls_from_sitemap():
    if not os.path.exists(SITEMAP_PATH):
        print(f"HATA: {SITEMAP_PATH} bulunamadı!")
        return []
        
    with open(SITEMAP_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Regex ile <loc> etiketleri içindeki URL'leri çıkar
    urls = re.findall(r'<loc>(.*?)</loc>', content)
    return urls

def submit_to_indexnow(host, key, url_list):
    endpoint = "https://api.indexnow.org/indexnow"
    
    payload = {
        "host": host,
        "key": key,
        "keyLocation": f"https://{host}/{key}.txt",
        "urlList": url_list
    }
    
    data = json.dumps(payload).encode('utf-8')
    headers = {
        'Content-Type': 'application/json; charset=utf-8'
    }
    
    req = urllib.request.Request(endpoint, data=data, headers=headers, method='POST')
    
    print(f"IndexNow API'ye {len(url_list)} adet URL gönderiliyor...")
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            if status == 200 or status == 202:
                print("✅ BAŞARILI! URL'ler anında Bing (ve IndexNow destekleyen diğer arama motorlarına) bildirildi.")
                print("ChatGPT ve Bing kısa süre içinde güncellemeleri fark edecektir.")
            else:
                print(f"⚠️ Uyarı: API'den beklenmeyen yanıt döndü. HTTP {status}")
                print(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"❌ HATA: HTTP {e.code} - {e.reason}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ BEKLENMEYEN HATA: {e}")

if __name__ == "__main__":
    print("=== BING & INDEXNOW SEO ARACI ===")
    
    key = get_or_create_key()
    
    urls = get_urls_from_sitemap()
    if not urls:
        print("Sitemap'ten hiç URL okunamadı. Çıkılıyor.")
        exit(1)
        
    print(f"Sitemap'ten {len(urls)} URL bulundu:\n - " + "\n - ".join(urls[:3]) + ("\n - ..." if len(urls) > 3 else ""))
    print()
    
    user_input = input(f"Devam etmek ve Bing'e bildirim göndermek istiyor musunuz? (E/H): ")
    if user_input.lower() == 'e':
        submit_to_indexnow(DOMAIN, key, urls)
    else:
        print("İptal edildi.")
