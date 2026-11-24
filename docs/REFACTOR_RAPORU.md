# Kapsamlı Refactoring Raporu — Felek Mangalbaşı

**Tarih:** 18 Eylül 2026
**Branch:** `arena/01a0a27c-felektest` (taban: `main` @ `5dcc967`)
**Commit'ler:** `b488d44` → `adf74d7` → `bbcaae0` → `2a03561`

> **Not:** GitHub erişimi bu oturumda kapalı olduğu için commit'ler yalnızca
> yerelde. Push ve PR için yeni bir oturum açmanız gerekiyor.

---

## 1. Özet

Dört faz halinde çalışıldı. Her fazda **önce test ağı kuruldu, sonra kod
değiştirildi, sonra kayıpsızlık kanıtlandı.**

| Faz | Konu | Sonuç |
|---|---|---|
| 0 | Test altyapısı | 5 suite, **379 kontrol**, `npm test` |
| 1 | Güvenlik temizliği | Tüm sırlar koddan ve dokümantasyondan çıkarıldı |
| 2 | JS modülerleşmesi | 1133 satırlık tek dosya → 10 kaynak parça + derleyici |
| 3 | Sayfa şablonu | 7 sayfa → 1 ortak kabuk + 7 sayfa verisi |

**Yol boyunca bulunan ve düzeltilen 5 gerçek hata** (§4).

---

## 2. Faz 0 — Test altyapısı

`js/script.js` canlı, gelir üreten bir sayfayı çalıştırıyor ve hiçbir davranış
testi yoktu. Refactor'a dokunmadan önce menü davranışını kilitleyen bir ağ
kuruldu.

### `tests/check-menu.js` (81 kontrol, 2 katman)

**Katman 1 — statik (Supabase kapalı):** kategori/kalem render'ı, event
delegation + çift `requestAnimationFrame` yolu, `history.back()` ile geri
dönüş, dil değiştirme (`<select>` → localStorage → `dir=rtl`), `Menu` JSON-LD
şeması (10 bölüm, her kalemde `offers`), `escapeHtml`, LCP/CLS görsel
stratejisi (ilk 2 kart `eager` + `fetchpriority=high`), GA4 `wa.me` / `tel:` /
`maps` dönüşümleri, footer yılı.

**Katman 2 — Supabase REST:** DB → UI eşlemesi, `localStorage` v6 önbelleği,
eski önbellek anahtarlarının temizliği, `supabase.co` → site CDN normalizasyonu,
`(1 Kg)` temizliği, `tr-TR` para biçimi, `cat_*` sözlük enjeksiyonu.

**Katman 3 — geri bildirim formu:** boş mesajda istek atılmaması, karakter
sayacı, istek gövdesi, başarı/hata/404/503/ağ hatası yolları, butonun kilitli
kalmaması, hata yollarının loglanması.

### Diğer suite'ler

- `tests/check-pages.js` (212) — mevcut yapı/erişilebilirlik testleri
- `tests/check-build.js` (20) — kaynak ↔ bundle ayrışması denetimi
- `tests/check-faq.js` (20) — görünür FAQ ↔ `FAQPage` paritesi
- `tests/check-security.js` (46) — sır taraması, kimlik dosyaları, deploy allowlist

---

## 3. Faz 1 — Güvenlik

### Çıkarılan sırlar

| Sır | Bulunduğu yerler | Yeni yer |
|---|---|---|
| Telegram bot token'ı | `menu.html`, `api/feedback.php`, `ga4_tool.py`, `report_tool.py`, `.agents/AGENTS.md`, `SEO_GEO_STRATEGY.md`, `AUDIT.md` | `.env` (git dışı) + sunucu ortam değişkeni |
| FTP şifresi | `deploy_ftp.py`, `AGENTS.md`, `SEO_GEO_STRATEGY.md` | `.env` |
| Supabase secret key | `AGENTS.md`, `SEO_GEO_STRATEGY.md` | kaldırıldı |
| Google servis hesabı (`service_account.json`) | git'te **takipli** | takipten çıkarıldı, `.gitignore` devrede |

> `.gitignore` zaten bu dosyaları listeliyordu, ama **git zaten izlediği
> dosyaları ignore etmez** — niyet ile gerçek durum uyuşmuyordu.

### Geri bildirim formu yeniden yazıldı

Eskiden tarayıcı **doğrudan** `api.telegram.org`'a gidiyordu ve token sayfa
kaynağında düz metindi: token'ı okuyan herkes işletmenin Telegram'ına sınırsız
mesaj atabilirdi.

- `js/feedback.js` (yeni) → aynı kaynaktaki `api/feedback.php`'ye POST eder
- `api/feedback.php` → token'ı `getenv()` veya git dışı `api/config.php`'den okur
- CORS `*` kaldırıldı → Origin kontrolü (aynı kaynak)
- IP başına hız sınırı (10 dk / 5 istek, dosya tabanlı, bağımlılıksız)
- 2000 karakter sunucu tarafı doğrulama, çok baytlı güvenli kırpma
- Token içermeyen hata logları; istemciye sızdırılmayan hata ayrıntısı
- `deploy_ftp.py` allowlist'ine `api/feedback.php` **eklendi** — eskiden bu
  dosya hiç yüklenmiyordu, yani form zorunlu olarak istemci yolunu kullanıyordu

### Diğer

- `tools_config.py` (yeni) → FTP/Telegram/rapor araçları tek kaynaktan okuyor
- `deploy_ftp.py --check` → bağlanmadan yapılandırmayı doğrular; kimlik yoksa
  net hata verip durur (sessizce başarısız olmaz)
- `.env.example`, `api/config.example.php` → yer tutucu şablonlar
- `_headers` CSP `connect-src`'den `api.telegram.org` çıkarıldı

---

## 4. Bulunan ve düzeltilen gerçek hatalar

### 4.1 `link.innerText.trim()` — WhatsApp dönüşümü hiç ölçülmüyordu

`js/script.js` GA4 blokunda. `innerText` her ortamda tanımlı değil ve **her
çağrıda zorunlu reflow** tetikliyor (INP maliyeti). Satır hata verince
`click_whatsapp_reservation` olayı hiç ateşlenmiyordu.
→ `(link.innerText || link.textContent || '').trim()`

### 4.2 `if (window.translations)` — koşul her zaman `false`

`translations.js` `const translations = {...}` ile tanımlı. Klasik script'te
top-level `const` **`window` üzerinde property oluşturmaz**. Sonuç: Supabase'ten
gelen kategori adları TR/EN/AR/RU sözlüklerine **hiç** işlenmiyordu; panelden
eklenen/değiştirilen bir kategori adı sitede ham id olarak görünürdü.
→ `typeof translations !== 'undefined'` + çıplak tanımlayıcı

### 4.3 `<textarea>` dolu geliyordu

`menu.html` geri bildirim alanı hem `placeholder` hem de **içerik** olarak
"Mesajınızı buraya yazın" taşıyordu. Sayfa açıldığında alan doluydu, `required`
sağlanıyordu ve kullanıcı hiçbir şey yazmadan o metni gönderebiliyordu.
`form.reset()` de alanı temizlemiyordu.
→ İçerik boşaltıldı; `role="status" aria-live="polite"` eklendi.

### 4.4 `twitter:title` üç sayfada eski başlıkla kalmıştı

Pass 3'te `<title>` ve `og:title` güncellendi ama
`zahmetsiz-mangal`, `raki-mangal-meyhane`, `kennedy-sahil-konum` sayfalarının
Twitter kartları eski başlığı gösteriyordu.

| Sayfa | Twitter'da görünen (eski) |
|---|---|
| zahmetsiz-mangal | Bakırköy Sahil Ocakbaşı & Mangalbaşı |
| raki-mangal-meyhane | Bakırköy Sahil Meyhane & Rakı Kültürü |
| kennedy-sahil-konum | Bakırköy Sahil Konum & Tarihi Taş Bina |

→ Şablon `twitter:title` ve `og:title`'ı tek kaynağa (`front matter title`)
bağladı; bir daha kayamaz.

### 4.5 Test harness'ında çift init

`jsdom` `DOMContentLoaded`'ı kendisi ateşliyor; testin elle ateşlemesi tüm init
kodunu iki kez çalıştırıyordu (iki kat event listener, iki kat fetch).
Test tarafında düzeltildi.

---

## 5. Faz 2 — `js/script.js` modülerleşmesi

**Önce:** 1133 satır, tek `DOMContentLoaded` closure'ı, 18 event listener,
iç içe fonksiyon tanımları, `window`'a sızan global'ler, en uzun satır 430
karakter.

**Sonra:** `src/js/` altında 10 parça + `tools/build.js` (bağımlılıksız).

| Parça | Sorumluluk |
|---|---|
| `00-bootstrap` | iOS `touchstart` ısınması |
| `01-media-url` | Supabase Storage → site CDN normalizasyonu |
| `02-i18n` | TR/EN/AR/RU, `?lang=`, `applyTranslations`, `dir=rtl` |
| `03-ui` | karuseller, hamburger menü, header scroll, `.reveal` |
| `04-menu-data` | statik yedek menü verisi |
| `05-menu-schema` | `Menu` JSON-LD üretimi |
| `06-menu-state` | ağ katmanı, prefetch, lazy images |
| `07-menu-render` | `escapeHtml`, `renderCategories`, `renderMenu` |
| `08-menu-boot` | public API, history, `initMenuData` |
| `09-analytics` | GA4 dönüşüm takibi |

### Neden "modül" değil "parça"?

Tüm kod tek bir kapsamı paylaşıyor: `categories`, `menuData`, `currentView`,
`activeCategory`, `translations`. Parçaları ayrı IIFE'lere çevirmek kapsamı
böler ve **davranışı değiştirirdi** — örneğin `02-i18n.js` içindeki
`typeof renderCategories === 'function'` yedeği erişilemez hâle gelirdi
(`renderCategories` şu an aynı closure'da hoisted bir fonksiyon bildirimi).
Bu yüzden parçalar aynı kapsamı paylaşır; sıra `src/js/manifest.json`'da.

### Kayıpsızlık kanıtı

```
$ node tools/build.js --verify HEAD
[OK] Derlenen çıktı HEAD ile BYTE-BYT AYNI.
     -> Parçalama işlemi davranışı değiştirmedi (kanıt).
```

Tek fark 1. satır: eski Supabase notu yerine "elle düzenlemeyin" bannerı.

### Koruma

`tests/check-build.js` kaynağı değiştirip derlemeyi unutmayı engeller:
`js/script.js` bayatsa test kırmızı olur.

---

## 6. Faz 3 — Landing sayfaları şablonu

### Ölçüm (refactor öncesi)

7 sayfada **birebir aynı** olan bloklar:

| Blok | Varyant |
|---|---|
| head iskeleti (22 meta/link) | **1/7** |
| skip-link | 1/7 |
| nav | 1/7 |
| footer | 1/7 |
| GA4 + font + CSS bloğu | 1/7 |
| `<body>` açılış etiketi | 1/7 |

Yani sayfa başına ~1.6 KB salt tekrar + head'in tamamı kopyaydı.

### Sonuç

```
src/layouts/landing.html    ortak kabuk, 120 satır — TEK KAYNAK
src/pages/<sayfa>.html      front matter (JSON) + sayfaya özel body
tools/build-pages.js        bağımlılıksız derleyici
```

Çıktı yine **depo kökünde `<sayfa>.html`** olarak üretiliyor. Yol, uzantı,
canonical, `web.config` kuralları, `sitemap.xml`, FTP allowlist ve tüm iç
bağlantılar **değişmedi** — sunucu tarafında hiçbir şey yapılması gerekmiyor.

### JSON-LD

- `@graph` sırası korunuyor: `main` → `BreadcrumbList` → `Restaurant` → `FAQPage` → `extra`
- **`BreadcrumbList` artık üretiliyor** (canonical + sayfa adından) — elle bakım bitti
- `Restaurant` / `main` / `FAQPage` sayfaya özel olduğu için olduğu gibi saklanıyor
- JSON-LD tek satır üretiliyor (makine okur; girinti yalnızca sayfa ağırlığı ekliyordu)

### Kayıpsızlık kanıtı — `tools/verify-pages.js`

Üretilen sayfa, git referansıyla **yapısal** olarak karşılaştırıldı:

| Sayfa | görünür metin | başlıklar | meta | linkler | görseller | FAQ | JSON-LD |
|---|---|---|---|---|---|---|---|
| zahmetsiz-mangal | ok | ok | ok* | ok | ok | ok | ok |
| raki-mangal-meyhane | ok | ok | ok* | ok | ok | ok | ok |
| kennedy-sahil-konum | ok | ok | ok* | ok | ok | ok | ok |
| gurme-yorumlar | ok | ok | ok | ok | ok | ok | ok |
| suadiye | ok | ok | ok | ok | ok | ok | ok |
| tarihce | ok | ok | ok | ok | ok | ok | ok |
| basinda-felek | ok | ok | ok | ok | ok | ok | ok |

\* yalnızca bilinçli `twitter:title` düzeltmesi (§4.4)

### Bonus: sayfalar küçüldü

| Sayfa | Önce | Sonra | Fark |
|---|---|---|---|
| zahmetsiz-mangal | 27.191 B | 25.367 B | −1.824 |
| raki-mangal-meyhane | 25.434 B | 23.990 B | −1.444 |
| kennedy-sahil-konum | 23.048 B | 21.719 B | −1.329 |
| gurme-yorumlar | 19.497 B | 18.631 B | −866 |
| suadiye | 22.368 B | 21.265 B | −1.103 |
| tarihce | 23.143 B | 22.285 B | −858 |
| basinda-felek | 31.207 B | 29.680 B | −1.527 |
| **Toplam** | **144.697 B** | **137.570 B** | **−7.127** |

### Kabuk kriteri artık mekanik

`tests/check-faq.js`: görünür `<details>` metni ile `FAQPage.mainEntity`
metinleri birebir aynı olmalı. Şu an **20 görünür / 20 şema, parite tam.**
Elle senkron tutulması gereken bir kural artık testle korunuyor.

---

## 7. Yeni çalışma akışı

```bash
npm install            # jsdom (yalnızca test için)

npm run build          # js/script.js + 7 landing sayfasını üret
npm run build:check    # bayat mı? (test bunu zaten çalıştırır)
npm test               # 5 suite, 379 kontrol

npm run verify:pages <ref>   # şablon refactor'u kayıpsız mıydı?
```

**Altın kural:** `js/script.js` ve 7 landing sayfası **üretilmiş** dosyalardır.
Elle düzenlemeyin. Kaynaklar:

- JS → `src/js/*.js` (sıra: `src/js/manifest.json`)
- Sayfalar → `src/pages/<sayfa>.html` + `src/layouts/landing.html`

Bu kural `.agents/AGENTS.md`'ye de yazıldı.

---

## 8. Sizin yapmanız gerekenler

### Acil — yenilenmesi gereken kimlik bilgileri

Bu değerler **git geçmişinde açıkta** kaldı. Yerel `.env` dosyasına taşındım
ama geçmiş temizlenmediği sürece geçersiz sayılmalıdırlar.

1. **Telegram bot token'ı** → BotFather `/revoke`, yeni değeri `.env`'e yazın.
   Eski token tarayıcıya da iniyordu; en kritik olan bu.
2. **FTP şifresi** → hosting panelinden değiştirin, `.env`'e yazın.
3. **Supabase secret key** → panelden rotate edin (bu anahtar istemciye hiç
   gitmiyordu ama depoda duruyordu).
4. **Admin paneli** hâlâ `test@test.com` / `123456` — değiştirin.

### Doğrulanması gereken

5. **Sunucuda PHP çalışıyor mu?** Form artık `api/feedback.php`'ye POST ediyor.
   IIS'te PHP FastCGI kurulu değilse form çalışmaz. PHP yoksa ya PHP kurun ya da
   Cloudflare'e taşıyıp `functions/api/feedback.js` yolunu kullanın.
6. **`api/feedback.php`'ye token'ı nasıl vereceğinize karar verin:**
   ortam değişkeni (`web.config` `<fastCgi><applicationSettings>`) veya
   sunucuya elle bırakılacak `api/config.php`. İkisi de `.env.example` ve
   `api/config.example.php` içinde örnekli.
7. **`og:image` gerçekten 200 dönüyor mu?** Tüm sayfalar
   `assets/images/SnapInsta.to_..._n.webp` kullanıyor ve `deploy_ftp.py`
   `assets/` altını **hiç yüklemiyor**. Tarayıcıda açıp doğrulayın.

### Sonra

8. **Deploy:** değişiklikleri yüklemek için onayınızı bekliyorum (AGENTS.md
   kuralı). Yüklendikten sonra `/menu.html`'in **200** döndüğünü (301 değil)
   doğrulamak gerekir.
9. **GA4 olayları:** `?src=masa-qr` QR kartları hâlâ yapılmadı
   (`SEO_GEO_EYLEM_PLANI.md` §6).
10. **14 gün sonra GSC ölçümü** — Faz 3 başlık değişikliklerinin CTR etkisi.

---

## 9. Değişmeyen taahhütler

- Suadiye şubesi kalıcı olarak kapalı; `suadiye.html` bilinçli bir trafik köprüsü
  olarak korundu.
- Canlı müzik / fasıl programı **yok** — hiçbir metne eklenmedi.
- Basın alıntıları ve atıflı misafir yorumları kelimesi kelimesine korundu
  (`verify-pages.js` görünür metni birebir karşılaştırdı).
- LCP/INP/CLS kuralları: `fetchpriority=high` + ilk 2 görsel `eager`, çift
  `requestAnimationFrame`, `DocumentFragment` ile tek yazım, tüm `<img>`'lerde
  `width`/`height` — hepsi test altında.
- `?v=2` menü görsel önbellek kırıcısı `js/script.js` ile birebir eşleşiyor;
  dokunulmadı.
- `deploy_ftp.py` allowlist'i `src/`, `tools/`, `tests/` ve `*.md` dosyalarını
  yüklemez.

---

## 10. Dosya haritası (yeni)

```
src/
  js/            10 kaynak parça + manifest.json   -> js/script.js
  layouts/       landing.html (ortak kabuk)
  pages/         7 sayfa kaynağı (front matter + body) -> kok *.html
tools/
  build.js             js/script.js derleyicisi
  build-pages.js       landing sayfaları derleyicisi
  verify-pages.js      şablon refactor'u kayıpsız mı? (kalıcı araç)
tests/
  run-all.js           hepsini çalıştırır (npm test)
  check-build.js       kaynak ↔ çıktı ayrışması
  check-pages.js       sayfa yapısı + erişilebilirlik
  check-faq.js         görünür FAQ ↔ FAQPage paritesi
  check-menu.js        menü davranışı (3 katman, jsdom)
  check-security.js    sır taraması + paketleme bütünlüğü
tools_config.py        araçlar için ortak yapılandırma okuyucu
.env                   gerçek kimlik bilgileri (GIT'E GİRMEZ)
.env.example           anahtar şablonu (git'te)
```
