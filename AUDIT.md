# Felek Mangalbaşı — Site Denetimi ve Yapısal Düzeltme Raporu

**Tarih:** 2026-09-15 · **Branch:** `arena/01a0a27c-felektest` · **Kapsam:** tüm site (9 sayfa, CSS, JS, web.config, sitemap, robots, deploy)

---

## 1. ÖZET

Sitede **iki ayrı tasarım sistemi** yaşıyordu. `index.html` ve `menu.html` "Felek tasarım dili"ni
(Cormorant Garamond başlık + DM Sans gövde, `#0e0c0a` zemin, `#d4a355` altın, hairline çizgiler,
uppercase letter-spaced etiketler, `.reveal` animasyonları) kullanırken; 7 SEO/GEO sayfası
**kendi içine kapalı, birbirinden de farklı** 3 ayrı mini tasarım sistemiyle yazılmıştı.

Denetimde **3 tanesi görünür bozukluk üreten** toplam 24 yapısal sorun tespit edildi; 21'i düzeltildi,
3'ü altyapı/güvenlik kararı gerektirdiği için **bilinçli olarak değiştirilmedi** (bkz. Bölüm 5).

---

## 2. GÖRÜNÜR TASARIM BOZUKLUKLARI (düzeltildi)

### 2.1 — 7 sayfanın mobilde navigasyonu tamamen kayboluyordu ⚠️ (en kritik)

`css/style.css` içindeki `@media (max-width: 900px)` bloğu:

```css
.nav-links { display: none; }
#header.active .nav-links { display: flex; }
.menu-toggle { display: flex; }
```

`.nav-links` bir **element sınıfı** olduğu için kural, landing sayfalarındaki `<div class="nav-links">`
için de geçerliydi. O sayfalarda ne `.menu-toggle` butonu vardı ne de `js/script.js` yüklüydü —
yani `#header.active` hiçbir zaman eklenmiyordu.

**Sonuç:** `suadiye`, `zahmetsiz-mangal`, `raki-mangal-meyhane`, `kennedy-sahil-konum`,
`gurme-yorumlar` (eski `.header-nav` sistemi) ve `tarihce`, `basinda-felek` (`nav#header` var ama
hamburger yok) — **7 sayfanın 7'sinde de 900px altında menü görünmüyor, kullanıcı sitede gezinemiyordu.**

**Düzeltme:** 7 sayfaya da ana sayfadaki nav'ın birebir aynısı (`nav-left` / `nav-links ul` /
`nav-right` + `Rezervasyon` + hamburger) kondu ve `js/site.js` yüklendi.

### 2.2 — Landing sayfalarının nav'ı içeriğin üstüne biniyordu

`style.css` içindeki `nav { position: fixed; top:0; left:0; right:0; z-index:1000; background-color: transparent; }`
kuralı, `<nav class="header-nav">` öğesine de uygulanıyordu. Sayfa içi `<style>` bloğu yalnızca
`display / justify-content / padding` üzerine yazıyordu; `position` hiç sıfırlanmıyordu.

**Sonuç:** nav sabit konumda ve şeffaf duruyor, `.container`'ın `2rem` üst boşluğunun içine,
başlığın üzerine oturuyordu; üstelik hizası konteynerla değil ekranın sol kenarıyla aynıydı.

**Düzeltme:** `style.css`'teki 5 `nav` seçicisi `#header`'a daraltıldı (`#header`,
`#header.scrolled`, `#header.active .nav-links`, mobil `#header`, `[dir="rtl"] #header`).
Böylece `nav` elementi artık "zehirli" değil — breadcrumb için semantik
`<nav aria-label="Breadcrumb">` kullanılabildi.

### 2.3 — İkincil butonlarda yazı görünmüyordu

`style.css`: `@media (hover:hover) { .btn:hover { background: var(--accent); color: var(--bg); } }`
Landing `<style>`: `.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }`

İkisinin özgüllüğü eşit (0,2,0), sayfa içi `<style>` sonra geldiği için `color: var(--accent)`
kazandı; ama `background` sayfa içinde tanımlı olmadığı için `style.css`'ten **altın zemin** geldi.

**Sonuç:** hover'da **altın zemin üzerine altın yazı** — okunamayan buton. 5 sayfada da geçerliydi.

**Düzeltme:** `.btn-primary` / `.btn-secondary` / `.btn-group` kaldırıldı; sitenin kendi
`.btn`'i + tek bir dolu varyant `.btn--solid` kullanıldı.

### 2.4 — Sitenin tipografisi yanlış font ağırlıklarıyla yükleniyordu

`style.css`'te kullanılan ağırlıklar yalnızca **300** ve **400** (13 satırın 11'i `font-weight: 300`),
ama `index.html` / `menu.html` şu URL'yi yüklüyordu:

```
Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500
```

- `body { font-weight: 300 }` → 300 yok → tarayıcı **sahte hafif (faux-light)** üretiyordu.
- `.hero-title em`, `.cta-title em` (`font-style: italic`) → italik yok → **sahte italik**.
- `.stat-number`, `.about-heading`, `.nav-logo`, `.footer-logo` hepsi 300 → sahte hafif.
- Tersine, landing sayfaları `wght@300;400;500;700` yüklediği için **aynı site iki farklı render** ediyordu.

**Düzeltme:** tüm sayfalarda tek URL:
`Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300..700`
(DM Sans değişken font olduğu için 300–700 aralığı tek dosyada gelir.)

### 2.5 — Emoji / tipografi tutarsızlığı

Ana sayfa tipografik işaret kullanırken (`✦`), SEO sayfalarında başlık ve butonlarda
`👑 📰 🏛️ 🥩 🧆 🌊 🌙 🧄 🧀 🍆 🥟 💬 📞 📜 📍 ⭐ 🍷 🌍 🇩🇪 💍` vardı.
Tümü kaldırıldı; test `no emoji in markup` ile doğrulanıyor.

---

## 3. YAPISAL / SEO-GEO SORUNLARI (düzeltildi)

| # | Sorun | Kanıt | Düzeltme |
|---|---|---|---|
| 1 | **`.html` → uzantısız 301 çakışması** | Canlıda doğrulandı: `https://www.felekmangalbasi.com/menu.html` → `/menu` adresine düşüyor. Sitemap, `canonical`, `og:url` ve tüm iç linkler ise `.html` kullanıyordu → sitemap'ten gelen her tarama 301 alıyor, 301'in indiği sayfanın canonical'ı yine `.html`'e işaret ediyordu. | `web.config`'ten `RedirectHTML` kuralı kaldırıldı. `HideHTML` rewrite'ı duruyor, yani `/menu` çalışmaya devam eder — sadece artık 301 üretmez. Tek canonical form: `.html` |
| 2 | **1.608 satır kopya CSS** | 7 sayfanın her birinde 210–305 satırlık `<style>` bloğu; `:root` yeniden tanımlı (`--border` 0.22 vs 0.18) | Tek dosya: `css/landing.css` (17,2 KB). 7 sayfada `<style>` bloğu **sıfır** |
| 3 | **3 ayrı buton sistemi** | `.btn` / `.btn-primary`+`.btn-secondary`+`.btn-group` / `.btn-gold`+`.btn-outline`+`.cta-btns`+`.banner-buttons` | Tek sistem: `.btn` (style.css) + `.btn--solid` (landing.css) |
| 4 | **3 ayrı hero kalıbı** | `.hero-badge`+`h1 span` / `.badge-gold`+`.history-title` / `.press-hero`+`.press-title` / ana sayfa `.hero-eyebrow`+`.hero-title` | Tek kalıp: `.land-eyebrow` + `.land-title` (`<em>` altın italik) + `.land-lede` + `.land-meta` |
| 5 | **Footer'da iç link yoktu** | 7 SEO sayfasının footer'ı tek satır ortalanmış `<p>` idi. Ayrıca `footer { display:grid; grid-template-columns:1fr 1fr 1fr }` kuralı tek çocuklu footer'a uygulanıyordu | Ana sayfadaki 3 sütunlu footer + `.footer-links` site haritası (7 iç link) 7 sayfaya da kopyalandı |
| 6 | **`menu.html`'den iç link çıkmıyordu** | QR menü — sitenin en çok ziyaret edilen sayfası — footer'ında "Hizmetler" metni vardı, tek bir iç link yoktu | Üçüncü sütun "Keşfet & Rehber" site haritasıyla değiştirildi |
| 7 | **`llms.txt` sitemap'teydi** | `sitemap.xml` içinde `<loc>.../llms.txt</loc>` — sitemap'e yalnızca indekslenecek web sayfaları girer | Kaldırıldı; `llms.txt` zaten `robots.txt` + `<link rel="help">` ile duyuruluyor |
| 8 | **Eksik yapısal veri** | `zahmetsiz-mangal`, `raki`, `kennedy`, `gurme`, `suadiye`: FAQPage var ama WebPage/Breadcrumb yok. `tarihce`, `basinda`: Breadcrumb var ama WebPage `@id` bağlantısı eksik | 7 sayfada da: `WebPage`/`AboutPage`/`CollectionPage` + `BreadcrumbList` + `Restaurant` (+ varsa `FAQPage`), hepsi `@graph` içinde `@id` ile birbirine bağlı |
| 9 | **FAQ metin uyuşmazlığı riski** | — | 14 FAQ'nin tamamında görünür metin ile `FAQPage` şeması **birebir aynı** — test ile doğrulandı |
| 10 | **Eksik sosyal meta** | Hiçbir sayfada `twitter:card`, `og:locale`, `og:site_name`, `og:image:alt`, `theme-color` yoktu | 7 landing sayfasına eklendi |
| 11 | **Engellenen Google fontları** | 7 sayfada render'ı bloklayan `<link href=… rel="stylesheet">` | Ana sayfadaki non-blocking desen: `preload` + `media="print" onload` + `<noscript>` fallback |
| 12 | **Tutarsız cache-busting** | 3 sayfada `style.css?v=4.5`, 4 sayfada versiyonsuz → bayat CSS riski | Tümü `?v=5.0` |
| 13 | **Ölü legacy dosyalar** | `ai-*.html` (3 dosya) `web.config`'te zaten 301'leniyordu ama hâlâ depoda; `test.php` debug artığı | Silindi |
| 14 | **`admin/` prod'da çalışmıyor** | `admin/index.html` → `<script type="module" src="/src/main.tsx">` (Vite dev girişi, build çıktısı yok) | ⚠️ Değiştirilmedi — Bölüm 5 |
| 15 | **Skip link yoktu** | `index.html`'de `<main id="main-content">` var ama skip link yok; `menu.html`'de `main`'in id'si bile yoktu | `.skip-link` `style.css`'e eklendi; 9 sayfaya da kondu; `menu.html`'e `id="main-content"` verildi |
| 16 | **`display:none` ile gizlenmiş SEO içeriği** | `menu.html`'de `#ai-seo-menu` → `display:none; aria-hidden="true"` (Google bu içeriği değersizleştirebilir, ekran okuyucu hiç görmez) | `.sr-only`'e çevrildi: görsel olarak gizli, hem tarayıcı hem ekran okuyucu için erişilebilir |
| 17 | **Ölü CSS sınıfları** | `features-title-wrapper`, `qr-category-nav` (boş placeholder, hiçbir JS referansı yok) | Kaldırıldı. Şu an **9 sayfada tanımsız sınıf sayısı: 0** |
| 18 | **`robots.txt` veri sızıntısı** | `service_account.json`, `keywords.txt`, `gsc_compare.json`, `*_report.md` kök dizinde taranabilir durumdaydı | `Disallow` kuralları + `.gitignore` eklendi |
| 19 | **Inline style kirliliği** | `index.html` 31, `menu.html` 11, SEO sayfaları ~90 inline `style=` | **9 sayfanın tamamında inline `style` sayısı: 0** (test ile doğrulanıyor) |
| 20 | **`deploy_ftp.py` eksik dosya yüklüyordu** | Yeni `css/landing.css` ve `js/site.js` listede yoktu | Eklendi |
| 21 | **`og:url` tutarsızlığı** | `index.html` canonical `/` ama `og:url` `/`sız | Düzeltildi |

---

## 4. NE YAPILDI — teknik çıktı

**Yeni dosyalar**
- `css/landing.css` (17,2 KB) — landing/SEO sayfalarının ortak tasarım sistemi. Token'ları
  yeniden tanımlamaz, `style.css`'ten alır. Tüm bileşenler `.land-` önekiyle adlandırılmış,
  böylece `style.css` ile sınıf çakışması imkânsız.
- `js/site.js` (4,4 KB) — paylaşılan site kabuğu. `js/script.js` ~100 KB'lık QR menü verisi
  taşıdığı için landing sayfalarına yüklenmedi; ayrı, menüsüz bir script yazıldı.
  İçerik: sticky header, mobil menü (+ Escape ile kapanma), reveal observer,
  FAQ akordeonu, `aria-current`, footer yılı.

**Değişen dosyalar**
`index.html`, `menu.html`, 7 SEO/GEO sayfası, `css/style.css`, `js/script.js`,
`web.config`, `sitemap.xml`, `robots.txt`, `.gitignore`, `deploy_ftp.py`
**Silinen:** `ai-kennedy-sahil-konum.html`, `ai-raki-mangal-meyhane.html`, `ai-zahmetsiz-mangal.html`, `test.php`

**Kazanım**
- Kopya CSS: **1.608 satır → 0**
- Inline `style=`: **~132 → 0** (9 sayfa)
- Tanımsız CSS sınıfı: **2 → 0**
- Mobilde bozuk navigasyon: **7 sayfa → 0**
- Landing sayfası başına JS: `script.js` (~100 KB, menü verisi dahil) yerine `site.js` (4,4 KB)

---

## 5. ⚠️ DEĞİŞTİRİLMEDİ — sizin kararınız gerekiyor

### 5.1 — Telegram bot token'ı herkese açık (KRİTİK)

`menu.html` içindeki geri bildirim formu token'ı **istemci tarafında, açık metin** taşıyor ve
doğrudan Telegram API'sine istek atıyor:

```js
const token = '8721886347:AAHWTqfUt9AnfJbmIZGeQVkltIrSQ9bo6O4';
const chatId = '1585282829';
```

Aynı token `api/feedback.php` içinde ve `.agents/AGENTS.md` / `SEO_GEO_STRATEGY.md` dosyalarında da var.
Herhangi biri sayfa kaynağından alıp işletme sahibinin Telegram'ına sınırsız mesaj atabilir.

**Doğru çözüm zaten depoda duruyor:** `functions/api/feedback.js` — token'ı ortam değişkeninden
okuyan, rate-limit'li, origin kontrollü bir Cloudflare Pages Function. Ama `menu.html` onu
kullanmıyor ve `deploy_ftp.py` ne `functions/`'ı ne `api/`'yi yüklüyor.

**Neden ben değiştirmedim:** sitenin canlı hedefi belirsiz (hem Cloudflare `_headers` hem IIS
`web.config` var; AGENTS.md FTP/IIS diyor). Yanlış uca yönlendirirsem sitedeki tek geri bildirim
kanalı sessizce kırılır. Üç adım:
1. Hangi host'ta çalıştığınıza karar verin (Cloudflare Pages → `/api/feedback`, IIS → `/api/feedback.php`).
2. `menu.html`'deki `fetch(...api.telegram.org...)` bloğunu o uca çevirin.
3. **Bot token'ını BotFather'dan iptal edip yenisini alın** — eskisi git geçmişine girdi, artık güvenilmez.

### 5.2 — Depoya commit edilmiş kimlik bilgileri

`service_account.json` (Google **private key**), `.agents/AGENTS.md` ve `SEO_GEO_STRATEGY.md`
(FTP şifresi, Supabase **secret** key, Telegram token), `deploy_ftp.py` (FTP şifresi).

`.gitignore`'a ekledim ama bu **geçmişi temizlemez**. Yapılması gerekenler:
- FTP şifresini, Supabase secret key'ini ve Telegram token'ını **rotasyona sokun**.
- `service_account.json`'ı Google Cloud'dan yeniden üretin, eskisini iptal edin.
- Gerekirse `git filter-repo` ile geçmişi temizleyin.

Bunları ben yapmadım: rotasyon yalnızca sizin erişiminizle mümkün, geçmiş temizliği ise
paylaşılan bir repoda koordinasyon gerektiriyor.

### 5.3 — `admin/` paneli prod'da çalışmıyor

`admin/index.html` Vite dev girişi olan `/src/main.tsx`'i çağırıyor; build çıktısı (`dist/`)
depoda yok ve `.gitignore`'da. `deploy_ftp.py` da `admin/`'i yüklemiyor. Yani
`https://www.felekmangalbasi.com/admin/` muhtemelen boş sayfa dönüyor — ama `robots.txt`'te
`Disallow: /admin/` var, yani var olduğu varsayılıyor. `cd admin && npm run build` çıktısının
deploy listesine eklenmesi gerekiyor.

---

## 6. DOĞRULAMA — ne çalıştırıldı

```bash
# 1. jsdom ile 9 sayfanın gerçek DOM testi (js/site.js gerçekten çalıştırıldı)
node /tmp/domtest/test.js
#   → 190 kontrol, "ALL CHECKS PASSED"
#     Kapsanan kod yolları: DOMContentLoaded handler içindeki
#       - footer yılı (#year)
#       - IntersectionObserver olmayan ortam için reveal fallback'i
#       - #menu-toggle click → #header.active + aria-expanded
#       - nav link click → menü kapanması
#       - Escape → menü kapanması
#       - aria-current="page" eşleşmesi
#       - .land-faq-item 'toggle' → tek açık akordeon

# 2. IntersectionObserver'lı (gerçek tarayıcı) dal ayrıca test edildi
node /tmp/domtest/test-io.js
#   → 26 .reveal observe edildi, 2'si intersect sonrası visible, her biri bir kez unobserve
#   → "PASS: IntersectionObserver path works"

# 3. JSON-LD parse: 9 sayfa, 9 schema, tamamı geçerli
#    index=[WebSite,WebPage,Restaurant] menu=[Restaurant,BreadcrumbList]
#    5 landing=[WebPage,BreadcrumbList,Restaurant,FAQPage]
#    tarihce=[AboutPage,BreadcrumbList,Restaurant]
#    basinda=[CollectionPage,BreadcrumbList,Restaurant]

# 4. Görünür FAQ metni == FAQPage şeması: 14/14 birebir aynı

# 5. HTML iyi biçimlilik (tag eşleşmesi): 9 sayfa, 0 hata
# 6. CSS parantez dengesi: style.css 266/266, landing.css 114/114
# 7. Tanımsız sınıf taraması: 9 sayfa, 0 tanımsız sınıf
# 8. node --check js/site.js && node --check js/script.js → hatasız
# 9. Yerel sunucuda HTTP 200: /, /menu.html, /zahmetsiz-mangal.html,
#    /css/landing.css, /js/site.js, /css/style.css
```

**Doğrulanamayan:** gerçek tarayıcıda görsel render ve Lighthouse skorları (sandbox'ta
headless browser yok). CSS kaskad sonuçları statik analizle çıkarıldı; piksel düzeyinde
karşılaştırma yapılmadı.

---

## 7. DEPLOY NOTU

```bash
python deploy_ftp.py   # AGENTS.md kuralı gereği SADECE sizin onayınızla
```

Deploy sonrası kontrol listesi:
1. `/menu.html` **301 vermemeli** (doğrudan 200) — `web.config` değişikliğinin yürürlüğe girdiğinin kontrolü.
2. `/zahmetsiz-mangal.html` mobil görünümde hamburger menü açılmalı.
3. Google Search Console → sitemap'i yeniden gönderin (`llms.txt` çıkarıldı, `lastmod` güncellendi).
4. Indexing API: `python report_tool.py --indexing`
