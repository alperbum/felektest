# Felek Mangalbaşı — İFM (İstanbul Fuar Merkezi) Genişletme Raporu

**Tarih:** 18 Eylül 2026 · **Revizyon:** 3.0 — **mimari karar: SAYFA EKLENMEZ, MEBUAT YÜZEYLERE GÖMÜLÜR**
**Durum:** TEKLİF — UYGULANMADI (onay bekliyor)
**Güvenlik kuralı:** Hiçbir çalışan dosyaya dokunulmadı. Tüm öneriler eklemeli veya cerrahi-geri-döndürülebilir.

---

## 0. REV 3.0 MİMARİ KARARI (neden sayfa eklenmiyor)

| | Dedike sayfa (Rev 2) | **Gömme (Rev 3.0 — seçilen)** |
|---|---|---|
| Yeni URL | `ifm-fuar-merkezi.html` | **Yok** |
| Capture | Kümeye ~%100 | **~%80** (küme düşük hacimli: bugünkü 0, gerçekçi tavan 10-50 sorgu/ay) |
| Sayfa sayısı | 9 → 10 | **9 (korunur)** |
| Bakım yüzeyi | build + FAQ paritesi + i18n + sitemap + test listesi | **Yeni yüzey yok** (kennedy zaten testte) |
| Cannibalization | 1 rakip daha az | **1 rakip daha az + "ocakbaşı" kelimeleri üst üste binen sitede en güvenli seçenek** |
| EN hreflang | Yeni 6 dilli URL | **Mevcut index hreflang'ı + llms.txt EN bloğu** (yeterli) |
| Semantik | "fuar" sayfası | **"ifm" içeriği zaten ait olduğu yere: KONUM/ULAŞIM sayfası (kennedy-sahil-konum)** |

**Karar gerekçesi:** 9 sayfalık, zarif, niş bir restorant sitesinde her fırsat için yeni sayfa açmak (1) doorway/ince sayfa riskini büyütür, (2) bakım yüzeyini katlar, (3) bu kümelerin hacmine orantısızdır. İFM niyeti üç mevcut yüzeye dağıtılır: **kennedy-sahil-konum (içerik evi) + index (schema + hub) + llms.txt (AI kanalı — etkileşimi %69.6 olan kanal).**

**Geri alma tetikleyicisi (kanıtlanırsa dedike sayfa hak edilir):** GSC'de fuar/ifm segmenti **3 ay üst üste 100+ gösterim/ay** yaparsa VEYA tek bir sorgu (ör. "istanbul fuar merkezi restoran") 50+ gösterim/ay'a ulaşırsa → kennedy#ifm içeriği **olduğu gibi taşınarak** dedike sayfa açılır; mevcut kurguya zarar vermez.

### Rev 3.0'ta daha önceki revizyonlardan kalan kararlar (özet)
- "Ocakbaşı" ifadesi: gömme metinlerde **doğal geçişte** kullanılır (kullanıcı: insanlar ocakbaşı der mangalbaşı ister); index/kennedy title'ları değişmez (2026-08 optimizasyonu korunur).
- **e-fatura KALDIRILDI** (kullanıcı düzeltmesi: kart+fiş normdur, ayırt edici değil). B2B sinyali = şirket kredi kartı + 20-50 VIP + vale.
- **M1A** (M9 değil) DTM-İstanbul Fuar Merkezi istasyonu — kaynakla doğrulandı.
- Mesafe: **8.5 km / 10-12 dk** (üretim verisi).
- Cross-canonical, Wikipedia/Wikidata sameAs, otel/havalimanı schema → **yapılmayacak** (Karar kaydı §3).
- **Çin/Asya kitlesi (kullanıcı gözlemi):** Rev 3.0'da dil katmanı **ertelendi** — 5. site dili (zh) tüm site + Supabase menüsünü kapsayan ayrı bir veri projesidir. Şimdilik ZH heyeti: EN index (?lang=en, hub kartı EN'de) + llms.txt EN bloğu + menüdeki EN'i kullanır. Tetikleyici: fuar/EN-ZH sorguları ölçülebilir hacme ulaşırsa (FAZ 2).

---

## İÇİNDEKİLER
1. [Mevcut Repo Analizi](#1-mevcut-repo-analizi)
2. [Arama & Rakip Araştırması + Üretim Verisi](#2-arama--rakip-araştırması--üretim-verisi)
3. [Karar Kaydı (yargıların eleştirel değerlendirmesi)](#3-karar-kaydı)
4. [Eksik Listesi](#4-eksik-listesi)
5. [Revize Yol Haritası](#5-revize-yol-haritası)
6. [Uygulama Teklifleri (Diff)](#6-uygulama-tekifleri)
7. [Site Dışı Aksiyonlar](#7-site-disi-aksiyonlar)
8. [Ölçüm & Hedefler](#8-ölçüm--hedefler)
9. [Onay & Uygulama Sırası](#9-onay--uygulama-sırası)

---

## 1. MEVCUT REPO ANALİZİ

- **Statik site (IIS + FTP).** Menü Supabase'den dinamik. İki JS hattı: `js/script.js` (index+menu; i18n/menu/GA4) ve `js/site.js` (7 landing; minik, menüsüz).
- **Landing derleme:** `tools/build-pages.js` → `src/layouts/landing.html` + `src/pages/<slug>.html` (front matter JSON + gövde) → kök `<slug>.html`. JSON-LD `@graph` front matter'dan; BreadcrumbList otomatik. **Kennedy sayfasının front matter'ı FAQPage taşıyor → görünen `<details>` ile birebir parite zorunlu** (`tests/check-faq.js`).
- **i18n:** TR/EN/AR/RU, `?lang=` + localStorage; **yalnızca index ve menu çok dilli** (sitemap hreflang da yalnızca bu 2 URL). Landing'ler TR-only.
- **Schema:** index @graph (WebSite, WebPage, Restaurant: areaServed 13, knowsAbout 15, 3 Offer, amenity 5, 4.2/500, sameAs 14). 7 landing: WebPage→Breadcrumb→Restaurant→FAQPage. Koordinat 40.9791,28.8726.
- **areaServed'ı Yeşilköy/Florya/Ataköy zaten var** → İFM komşuluğu şema seviyesinde yarı hazır; İFM/İDTM/CNR/DTM ekleniyor.
- **Mobil %80.2** (üretim verisi) → QA mobil öncelikli.

## 2. ARAMA & RAKİP ARAŞTIRMASI + ÜRETİM VERİSİ

### 2.1 Talep
- İFM yılda **~100 fuar**; İDTM 500.000 m² (İFM ≈96.000 m²). Tek fuar örneği (F İstanbul): 2025'te **22.092 ziyaretçi, 12.134 profesyonel, 3.441 yabancı, 109 ülke**.
- Ekosistem kanıtı: İFM çevresinde uzmanlaşmış **fuar catering sektörü** (kurumsal fuar dönemi yemek bütçesi gerçek).
- **Kullanıcı gözlemi (Rev 2.2):** fuarda çok sayıda Asyalı, **Çin ağırlıklı** kitlesel ziyaretçi.

### 2.2 Arz boşluğu (İFM 3 km)
İFM resmî listesi + TripAdvisor: içeride fast food/büfe; dışarıda en yakın "kaliteli" MYK (4.9/149), Cihannuma 360 (rooftop); ocakbaşı rakibi Efe Yeşilköy 4.9/**11** ve **00:30'da kapanıyor**. **02:00'ye açık + vale + 4 dilli menü + kurumsal kapasite (şirket kartı, 20-50 VIP) + İFM sorgularına içerik veren kimse yok.** Felek'in kapasitesi niyetle birebir örtüşüyor; eksik yalnızca içerik/şema.

### 2.3 Üretim verisi sinyalleri (30 gün)
- 212 tık (+%22.5), 5.006 gösterim (+%40.1), #5.3, CTR %4.23; tıklamaların ~%65'i marka (#1-2).
- **EN fuar-çevresi sorguları düştü:** `restaurants near me` #1, `mangal restaurant near me` #1, `mangalbasi restaurant istanbul` #7.5, `felek restaurant` #3.5.
- **AI Asistanlar: 23 oturum, %69.6 etkileşim** — tüm kanalların en yüksek etkileşimi → **llms.txt gömme kararının (kullanıcı önerisi) verisel dayanağı.**
- **Instagram %57.6 — mekanizma:** IG bios'ındaki **doğrudan menü linki** (kullanıcı düzeltmesi). Huni çalışıyor → **dokunulmaz**.
- `yeşilköy rakı` #1.0 — İFM'nin mahallesi zaten sıralamada.
- `kendin pişir kendin ye avrupa yakası` #1.5 → CTR %10.0 (sıra CTR'ı belirler; jenerik ilk-3 hedefinin kanıtı).

## 3. KARAR KAYDI (yargıların eleştirel değerlendirmesi)

| # | Yargı / İtiraz | Değerlendirmem | Karar |
|---|---|---|---|
| K1 | Cannibalization: `bakırköy ocakbaşı` (index 166 vs zahmetsiz 14) | Ana sayfa eziciyken bu konsolidasyon, hastalık değil. Gerçek sızıntı: **`/menu` title kuyruğu "Bakırköy Ocakbaşı"** (jenerik kümeye aracıl sayfa). | Menu title klibi + anchor text (cerrahi, ayrı onay). Index/zahmetsiz title'ları **dokunulmaz**. |
| K2 | "rel-canonical stratejisi" | **RED.** Self-canonical'ler doğru; çapraz canonical farklı niyetli sayfaları bir URL'ye yığar. | Yapılmayacak |
| K3 | "sameAs'e Wikipedia/Wikidata" | **RED.** Kayıt yok → uydurma URL = şema bütünlüğü ihlali. | Yapılmayacak |
| K4 | areaServed'e otel/havalimanı | Otel = nokta, bölge değil → içerik/FAQ'a. **Eski havalimanı (2019 kapandı) tamamen dışarıda** (yanlış lokasyon sinyali). CNR + DTM = gerçek fuar referansları → alınıyor. | CNR+DTM şema; otel içerik; havalimanı yok |
| K5 | "M9 hattı DTM istasyonuna bağlı" | **YANLIŞ — kaynaktan doğrulandı:** DTM istasyonu **M1A**'da; M9 İFM'den geçmez. | "M1A DTM" kullanılır |
| K6 | Mesafe 8.5 km / 10-12 dk | Üretim verisi benimsendi | Kabul |
| K7 | "02:00 açık vs çevre erken kapanıyor" value prop | Doğrulanabilir (Efe 00:30). Ölçülebilir formda yazılır | Kabul |
| K8 | Kurumsal altyapı (e-fatura, şirket kartı, 20-50 VIP, vale) | **Rev 2.2: e-fatura KOPARILDI** (kart+fiş normdur; ayırt edici değil). Kalan: şirket kartı + 20-50 VIP + vale (gerçek filtre) | Kabul (e-fatura hariç) |
| K9 | "Audit mobil odaklı" | Kabul (QA 375px öncelikli) | Kabul |
| K10 | CTR "5x" yorumu | Yön doğru, çarpan abartılı (kanıt: %1→%10); asıl kaldıraç **GBP local-pack** (site dışı) | GBP öne alındı |
| K11 | **"Her fırsat için yeni sayfa olmasın; site zarif kalsın, blog değil" (kullanıcı itirazı, Rev 3.0)** | **Kabul.** Düşük hacimli niş kümede (0 → 10-50 sorgu/ay) dedike sayfa capture +%20 karşılığında: 1 sayfa kalabalığı + kalıcı bakım yüzeyi + "ocakbaşı" kelimeleri üst üste binen sitede ek cannibalization yüzeyi. Gömme, capture'un ~%80'ini sıfır yeni yüzeyle verir; "ifm" içeriği zaten ait olduğu sayfaya (konum/ulaşım) yerleşir. | **SAYFA EKLENMEZ** (geri alma tetikleyicisi §0) |
| K12 | "llms.txt'e göm" (kullanıcı önerisi) | **Kabul — verisel dayanak güçlü:** AI kanalı etkileşimi %69.6 (en yüksek). AI asistanları "fuar çıkışı misafirime nereyi öneririm?" sorusunda llms.txt'ten alıntı yapar; dedike sayfa olmadan da bu kanal kazanılır. | llms.txt tam niyet bloğu (TR+EN) |

## 4. EKSİK LİSTESİ

| # | Eksik | Rev 3.0'taki evi |
|---|---|---|
| G1 | "İFM/İDTM/CNR/Istanbul Expo Center" için içerik+şema yok | kennedy bölümü + index schema + llms.txt |
| G2 | areaServed'da İFM/İDTM/CNR/DTM yok | index + kennedy front matter |
| G3 | knowsAbout'ta fuar/kurumsal terimler yok | index |
| G4 | "Fuar sonrası grup yemeği" FAQ'ı yok | kennedy (2 FAQ, pariteli) |
| G5 | EN/AR/RU/zh fuar heyet trafiği | index hub kartı (4 dil) + llms.txt EN bloğu; zh ertelendi (proje) |
| G6 | Kennedy tablosunda İFM/DTM satırı yok | kennedy tablosu |
| G7 | llms.txt'te İFM niyet/mesafe yok | llms.txt §1+§6.7+§9+§11 |
| G8 | ~~Sitemap'te IFM URL'i yok~~ | **Çözüldü: yeni URL yok** |
| G9 | Fuar takvimiyle bağ yok | FAZ 2 (data-gated), evi kennedy#ifm |
| G10 | GBP'de İFM geçmiyor | Site dışı O1 |
| G11 | `/menu` title kuyruğu jenerik kümeye sızıntı | Cerrahi (ayrı onay) |
| G12 | Kurumsal B2B sinyali (şirket kartı, 20-50 VIP) hiç yok | index amenityFeature + offer + kennedy metni + llms.txt |
| G13 | Hub anchor text'leri niyet hizalı değil | Cerrahi (ayrı onay) |
| G14 | M1A/DTM toplu taşıma gerçekleri sayfada yok | kennedy (M1A doğru yazımıyla) |

## 5. REVİZE YOL HARİTASI

```
FAZ 1 (tek faz, ~yarım gün)  →  FAZ 2 (data-gated, kapalı)  →  FAZ 3 (opsiyonel takvim)
 index schema + hub kartı      tetikleyici: 3 ay üst üste      evi: kennedy#ifm
 kennedy IFM bölümü + tablo    100+ gösterim/ay fuar segmenti   (FAZ 2 içinde)
 + 2 FAQ + llms.txt + i18n     VEYA tek sorgu 50+/ay
 (+ cerrahi: ayrı onay)
```

**FAZ 1 kapsamı (tek faz, hepsi eklemeli):**
1. `index.html` @graph'a **yalnızca dizi eklemeleri** (areaServed, knowsAbout, amenityFeature, 4. Offer) + **5. hub kartı** (link: `kennedy-sahil-konum.html#ifm`)
2. `js/translations.js`: hub kartı için 2 anahtar × 4 dil (EN/AR/RU index'te kartı çevirir; mevcut konvansiyon)
3. `src/pages/kennedy-sahil-konum.html`: tabloya İFM/İDTM/CNR satırı + **yeni `#ifm` bölümü** (2 paragraf + M1A notu + CTA) + **2 FAQ** (front matter + görünür, pariteli) + front matter areaServed/keywords
4. `llms.txt`: §1 mesafe + kurumsal satır, §6.7 niyet bloğu (TR+EN), §9 EN mesafe, §11 alias, lastmod
5. **Cerrahi (ayrı onay):** `menu.html` title kuyruğu (tr+en) + 2 anchor text
6. `sitemap.xml`: yalnızca kennedy `lastmod` güncellemesi
7. QA: `npm test` (kennedy paritesi otomatik kapsanır) + 375px mobil → deploy → GSC (kennedy dizine ekleme)

**FAZ 2 (data-gated, varsayılan KAPALI):** tetikleyici gelirse → (a) dedike IFM sayfası (içerik kennedy#ifm'den taşınır) VEYA (b) `data/ifm-takvimi.json` + "İFM'de Yaklaşan Fuarlar" bloğu (evi kennedy#ifm; `Event` şeması asla yok). Ayrı değerlendirme.
**Zaten kapsanmadığı için FAZ 2'den düşenler:** dedike sayfa, landing-i18n.js, yeni sitemap URL, test listeleri, layout/footer değişiklikleri, menu footer linki.

**YAPILMAYACAKLAR:** cross-canonical · Wikipedia/Wikidata sameAs · otel/havalimanı areaServed · "M9" ifadesi · index/kennedy/zahmetsiz **title değişiklikleri** · suadiye.html'e fuar metni · `Event` şemasıyla fuar sahiplenme · IG bios menü linkine dokunmak · site geneline 5. dil (zh) — proje.

## 6. UYGULAMA TEKLİFLERİ (Diff)

### 6.1 `index.html` — @graph dizi eklemeleri (mevcut düğümler korunur)

```diff
           "areaServed": [
-            "Bakırköy", "Ataköy", "Yeşilyurt", "Yeşilköy", "Florya", "Yenikapı", "Fatih", "Sultanahmet", "Tarihi Yarımada", "Zeytinburnu", "Bahçelievler", "Avrupa Yakası", "İstanbul"
+            "Bakırköy", "Ataköy", "Yeşilyurt", "Yeşilköy", "Florya", "Yenikapı", "Fatih", "Sultanahmet", "Tarihi Yarımada", "Zeytinburnu", "Bahçelievler", "Avrupa Yakası", "İstanbul",
+            "İstanbul Fuar Merkezi", "İFM", "İDTM", "CNR Fuar Merkezi", "DTM"
           ],
           "knowsAbout": [
             "Bakırköy Ocakbaşı", "Bakırköy Ocakbaşı Mekanları", "Bakırköy Rakı Mekanları", "Bakırköy Kendin Pişir Kendin Ye", "Bakırköy Mangalbaşı",
-            "Mangalbaşı", "Kendin Pişir Kendin Ye", "Modern Meyhane", "Rakı Meze", "Kuzu Pirzola", "Adana Kebap", "Şirket Yemekleri", "Doğum Günü Kutlamaları", "Deniz Manzaralı Restoran", "Tarihi Yarımada Restoranları", "Yenikapı Mangalbaşı"
+            "Mangalbaşı", "Kendin Pişir Kendin Ye", "Modern Meyhane", "Rakı Meze", "Kuzu Pirzola", "Adana Kebap", "Şirket Yemekleri", "Doğum Günü Kutlamaları", "Deniz Manzaralı Restoran", "Tarihi Yarımada Restoranları", "Yenikapı Mangalbaşı",
+            "İstanbul Fuar Merkezi Restoranları", "CNR Fuar Merkezi Restoranları", "Fuar Sonrası Grup Yemeği", "Kurumsal Misafir Ağırlama"
           ],
           "amenityFeature": [
             { "@type": "LocationFeatureSpecification", "name": "Serves Alcohol", "value": true },
             { "@type": "LocationFeatureSpecification", "name": "Outdoor Seating", "value": true },
             { "@type": "LocationFeatureSpecification", "name": "Tabletop Charcoal Grill", "value": true },
             { "@type": "LocationFeatureSpecification", "name": "Valet Parking", "value": true },
-            { "@type": "LocationFeatureSpecification", "name": "Sea View Garden", "value": true }
+            { "@type": "LocationFeatureSpecification", "name": "Sea View Garden", "value": true },
+            { "@type": "LocationFeatureSpecification", "name": "Group Dining Capacity 20-50", "value": true },
+            { "@type": "LocationFeatureSpecification", "name": "Corporate Credit Cards Accepted", "value": true }
           ],
```
`hasOfferCatalog.itemListElement`'a 4. Offer (mevcut 3'ü değişmez):
```diff
               {
                 "@type": "Offer",
                 "itemOffered": {
                   "@type": "Service",
                   "name": "Bakırköy Sahil Rakı Mekanı & Modern Meyhane Deneyimi",
                   "description": "Günlük 30+ çeşit taze meze dolabı, zengin rakı seçkisi ve Marmara Denizi esintili bahçe ortamı."
                 }
               }
+              ,
+              {
+                "@type": "Offer",
+                "itemOffered": {
+                  "@type": "Service",
+                  "name": "Fuar & Kurumsal Grup Ağırlama (İFM / İDTM / CNR)",
+                  "description": "İstanbul Fuar Merkezi'ne sahil yolundan 10-12 dakika (8.5 km): fuar sonrası grup yemekleri ve kurumsal misafir ağırlama için 20-50 kişilik kapasite, şirket kredi kartı, deniz manzaralı masa düzeni ve vale hizmeti. Mutfak 02:00'ye kadar tam menüyle açıktır."
+                }
+              }
             ]
           },
```

### 6.2 `index.html` — 5. hub kartı (features-grid--hub; auto-fit, CSS gerektirmez)

```diff
             <div class="feature-item feature-item--plain reveal reveal-delay-3">
                 <div class="feature-num">04</div>
                 <h3 class="feature-title">Kennedy Cad. &amp; Tarihi Yarımada</h3>
                 <p class="feature-desc">
                     Ataköy, Florya, Yenikapı, Fatih ve Sultanahmet'ten sahil yolundan 10-15 dakikada direkt erişim. Vale ve özel otopark imkanıyla.
                 </p>
                 <a href="kennedy-sahil-konum.html" class="hub-card-link">Konum &amp; Ulaşım &rarr;</a>
             </div>
+
+            <div class="feature-item feature-item--plain reveal reveal-delay-3">
+                <div class="feature-num">05</div>
+                <h3 class="feature-title" data-i18n="hub_ifm_title">İFM &amp; Kurumsal Fuar Grubu</h3>
+                <p class="feature-desc" data-i18n="hub_ifm_desc">İstanbul Fuar Merkezi'ne (İFM) sahil yolundan 10-12 dakika: fuar sonrası ekip yemekleri, 20-50 kişilik grup kapasitesi, şirket kredi kartı ve vale.</p>
+                <a href="kennedy-sahil-konum.html#ifm" class="hub-card-link">Fuar Grubu &amp; Ulaşım &rarr;</a>
+            </div>
```
> Not: 4 mevcut kart TR-only (data-i18n yok); 5. kart bilinçli olarak i18n'li → EN/AR/RU index'te bu kart çevrilir, TR'de değişmez. 4+1 ızgara görünümü 375px/1440px'te görsel onaya çıkar.

### 6.3 `js/translations.js` — 2 anahtar × 4 dil (her dilin sözlüğüne eklenir)

```diff
     tr: {
+        hub_ifm_title: "İFM & Kurumsal Fuar Grubu",
+        hub_ifm_desc: "İstanbul Fuar Merkezi'ne (İFM) sahil yolundan 10-12 dakika: fuar sonrası ekip yemekleri, 20-50 kişilik grup kapasitesi, şirket kredi kartı ve vale.",
         ...
     },
     en: {
+        hub_ifm_title: "IFM & Corporate Fair Groups",
+        hub_ifm_desc: "10-12 minutes from Istanbul Expo Center (IFM) via the coastal road: post-fair team dinners, 20-50 guest capacity, corporate credit cards and valet.",
         ...
     },
     ar: {
+        hub_ifm_title: "مجموعات المعارض والشركات (IFM)",
+        hub_ifm_desc: "على بعد 10-12 دقيقة من مركز معارض إسطنبول (IFM) عبر طريق الشاطئ: عشاء جماعي بعد المعارض، سعة 20-50 شخصًا، بطاقات ائتمان الشركات وصف مجاني.",
         ...
     },
     ru: {
+        hub_ifm_title: "IFM и корпоративные делегации",
+        hub_ifm_desc: "В 10-12 минутах от Выставочного центра Стамбула (IFM) по береговой дороге: ужины команд после выставок, вместимость 20-50 персон, корпоративные карты и паркинг.",
         ...
     }
```
> `src/js/`'e dokunulmaz (bundle yeniden derlenmez; translations.js deploy edilen bağımsız sözlüktür).

### 6.4 `src/pages/kennedy-sahil-konum.html` — front matter (title/H1 DEĞİŞMEZ)

```diff
-  "keywords": "bakırköy sahil restoran, kennedy caddesi restoran, bakırköy sahil ocakbaşı, tarihi taş bina restoran istanbul, felek mangalbaşı konum",
+  "keywords": "bakırköy sahil restoran, kennedy caddesi restoran, bakırköy sahil ocakbaşı, tarihi taş bina restoran istanbul, felek mangalbaşı konum, ifm, istanbul fuar merkezi, cnr fuar merkezi, dtm, fuar sonrası grup yemeği",
```
```diff
-      "areaServed": ["Bakırköy","Ataköy","Yeşilyurt","Yeşilköy","Florya","Zeytinburnu","Bahçelievler","Yenikapı","Fatih","Sultanahmet","İstanbul"],
+      "areaServed": ["Bakırköy","Ataköy","Yeşilyurt","Yeşilköy","Florya","İstanbul Fuar Merkezi","İFM","İDTM","CNR Fuar Merkezi","DTM","Zeytinburnu","Bahçelievler","Yenikapı","Fatih","Sultanahmet","İstanbul"],
```
`jsonld.faq.mainEntity`'e 2 soru (görünür `<details>` ile **birebir** — check-faq.js):
```diff
         {
           "@type": "Question",
           "name": "Sahil kenarında açık bahçesi ve valesi olan bir ocakbaşı mı?",
           "acceptedAnswer": { "@type": "Answer", "text": "Evet. Mekan Kennedy Caddesi üzerinde Marmara Denizi kıyısındadır; açık bahçesi deniz manzaralıdır ve Kennedy Cad. No:29 girişinde ücretsiz vale hizmeti verilir." }
-        }
+        },
+        {
+          "@type": "Question",
+          "name": "İstanbul Fuar Merkezi'nden (İFM) Felek Mangalbaşı'na ne kadar sürer?",
+          "acceptedAnswer": { "@type": "Answer", "text": "Sahil yolu (Kennedy Caddesi) üzerinden 8.5 km, araç veya taksiyle 10-12 dakikadır. Kennedy Cad. No:29 girişinde ücretsiz vale hizmeti verilir; fuar çıkışı yoğun saatlerde (17:00-18:30) 15-18 dakikayı öngörmek önerilir." }
+        },
+        {
+          "@type": "Question",
+          "name": "Fuar heyetleri ve kurumsal gruplar için rezervasyon nasıl yapılır?",
+          "acceptedAnswer": { "@type": "Answer", "text": "20-50 kişilik VIP heyet ve şirket yemekleri için WhatsApp hattından (0539 777 60 67) önceden planlama yapılır; fiks menü, deniz manzaralı masa düzeni ve vale ayarlanır. Mutfak fuar günlerinde de her gün 02:00'ye kadar tam menüyle açıktır." }
+        }
       ]
```

### 6.5 `src/pages/kennedy-sahil-konum.html` — gövde (tablo + yeni bölüm + 2 görünür FAQ)

Tabloya satır ("Yeşilyurt & Yeşilköy" satırından sonra):
```diff
                     <tr>
                         <td>Yeşilyurt &amp; Yeşilköy</td>
                         <td>Yeşilköy Rauf Orbay Cad. → Kennedy Cad.</td>
                         <td>~5-7 dakika</td>
                     </tr>
+                    <tr>
+                        <td>İstanbul Fuar Merkezi (İFM) &amp; İDTM &amp; CNR</td>
+                        <td>Yeşilköy → Kennedy Caddesi sahil yolu</td>
+                        <td>~10-12 dk (8.5 km)</td>
+                    </tr>
```
Tablo bölümünün **hemen sonrasına** yeni bölüm (mevcut bölümlerin aralarına, `id="ifm"` ile — hub kartının hedefi):
```diff
             </div>
         </section>
+
+        <section class="land-section" id="ifm">
+            <div class="land-wrap land-wrap--narrow">
+                <div class="land-head land-head--stack reveal">
+                    <div>
+                        <p class="land-label">Fuar Grubu</p>
+                        <h2 class="land-h2">İstanbul Fuar Merkezi (İFM), İDTM ve CNR</h2>
+                    </div>
+                </div>
+                <div class="land-answer reveal">
+                    <p><strong>Felek Mangalbaşı</strong>; İstanbul Fuar Merkezi (İFM), İDTM ve CNR Fuar Merkezi'ne sahil yolu (Kennedy Caddesi) üzerinden 8.5 km, araç veya taksiyle 10-12 dakika mesafededir. Fuarlar 18:00-19:00'de biter, heyetler otele dönüp toplandığında (20:30 sonrası) çevredeki standart restoranların mutfağı kapanmış olur; mutfak her gün 02:00'ye kadar tam menüyle açıktır.</p>
+                    <p>Kurumsal planlama: 20-50 kişilik VIP heyet kapasitesi, şirket kredi kartı, fiks menü, ücretsiz vale. Takım elbiseli heyetler için kokusuz fındık kabuğu kömürü — kıyafete is ve koku sinmez. Fuar alanında M1A (Yenikapı-Atatürk Havalimanı) hattının <strong>DTM-İstanbul Fuar Merkezi</strong> istasyonu yer alır; en pratik transfer sahil yolu üzerinden taksidir (10-12 dk, vale ile giriş).</p>
+                </div>
+                <div class="land-actions reveal">
+                    <a href="https://wa.me/905397776067?text=Merhaba%2C%20%C4%B0stanbul%20Fuar%20Merkezi%20(%C4%B0FM)%20sonras%C4%B1%20grup%20rezervasyonu%20yapmak%20istiyoruz." target="_blank" rel="noopener noreferrer" class="land-more">Fuar Grubu Rezervasyonu</a>
+                </div>
+            </div>
+        </section>
```
SSS bölümüne 2 görünür FAQ (front matter ile birebir metin):
```diff
                     <details class="land-faq-item">
                         <summary>Sahil kenarında açık bahçesi ve valesi olan bir ocakbaşı mı?</summary>
                         <div class="land-faq-a">Evet. Mekan Kennedy Caddesi üzerinde Marmara Denizi kıyısındadır; açık bahçesi deniz manzaralıdır ve Kennedy Cad. No:29 girişinde ücretsiz vale hizmeti verilir.</div>
                     </details>
+                    <details class="land-faq-item">
+                        <summary>İstanbul Fuar Merkezi'nden (İFM) Felek Mangalbaşı'na ne kadar sürer?</summary>
+                        <div class="land-faq-a">Sahil yolu (Kennedy Caddesi) üzerinden 8.5 km, araç veya taksiyle 10-12 dakikadır. Kennedy Cad. No:29 girişinde ücretsiz vale hizmeti verilir; fuar çıkışı yoğun saatlerde (17:00-18:30) 15-18 dakikayı öngörmek önerilir.</div>
+                    </details>
+                    <details class="land-faq-item">
+                        <summary>Fuar heyetleri ve kurumsal gruplar için rezervasyon nasıl yapılır?</summary>
+                        <div class="land-faq-a">20-50 kişilik VIP heyet ve şirket yemekleri için WhatsApp hattından (0539 777 60 67) önceden planlama yapılır; fiks menü, deniz manzaralı masa düzeni ve vale ayarlanır. Mutfak fuar günlerinde de her gün 02:00'ye kadar tam menüyle açıktır.</div>
+                    </details>
                 </div>
```

### 6.6 `llms.txt` — 5 ekleme (kullanıcı önerisi, K12)

```diff
-last_updated: 2026-09-16
+last_updated: 2026-09-18
```
§1 "Ulaşım & Yakınlık" satırı:
```diff
-| **Ulaşım & Yakınlık** | Marmaray Bakırköy İstasyonu 10 dk; Bakırköy İDO İskelesi 5 dk; Ataköy Marina 3 dk; Avrasya Tüneli çıkışı 10 dk |
+| **Ulaşım & Yakınlık** | Marmaray Bakırköy İstasyonu 10 dk; Bakırköy İDO İskelesi 5 dk; Ataköy Marina 3 dk; Avrasya Tüneli çıkışı 10 dk; İstanbul Fuar Merkezi (İFM) / İDTM / CNR 10-12 dk (8.5 km, sahil yolu); M1A DTM-İstanbul Fuar Merkezi istasyonu fuar alanında |
```
§1'e yeni satır:
```markdown
| **Kurumsal** | 20-50 kişilik VIP heyet kapasitesi, şirket kredi kartı, ücretsiz vale |
```
§6'ya yeni niyet bloğu (mevcut 6.7 → 6.8 olarak yeniden numaralanır; içerik değişmez):
```markdown
### 6.7 NİYET: Fuar sonrası / İFM-CNR yakın akşam yemeği & kurumsal ağırlama

Kullanıcı ifadeleri:
- "İstanbul Fuar Merkezi'nden sonra ekip olarak yemek yiyebileceğimiz bir yer var mı?"
- "İFM'de fuar katılıyorum, akşam yabancı misafirlerimi ağırlayacağım mekan öner"
- "restaurants near Istanbul Expo Center / dinner near IFM after the fair"

**Cevap:** Felek Mangalbaşı, İstanbul Fuar Merkezi (İFM), İDTM ve CNR Fuar Merkezi'ne sahil yolu
(Kennedy Caddesi) üzerinden 8.5 km / 10-12 dakika mesafededir. Fuarlar 18:00-19:00'de biter;
heyetler otele dönüp toplandığında (20:30 sonrası) mutfak her gün 02:00'ye kadar tam menüyle
çalışır. 200 yıllık taş binada deniz manzaralı açık bahçede: dumansız fındık kabuğu kömürlü
masa mangalı (kıyafete koku sinmez), 20-50 kişilik VIP kapasite, şirket kredi kartı,
ücretsiz vale. Menü TR/EN/AR/RU. Rezervasyon (8+ kişi): https://wa.me/905397776067
Detay: https://www.felekmangalbasi.com/kennedy-sahil-konum.html#ifm

**Answer (EN):** Felek Mangalbaşı is 8.5 km (10-12 min by car) from Istanbul Expo Center
(İFM) / İDTM / CNR via the coastal road (Kennedy Avenue). Fairs end at 18:00-19:00 and the
kitchen runs daily 12:00-02:00, so delegations that regroup after returning to their hotels
(20:30+) are still served full menu. In a 200-year-old stone mansion with a sea-view garden:
smokeless hazelnut-charcoal tabletop grilling (no smell on suits), 20-50 guest VIP capacity,
corporate credit cards, free valet. Menu in TR/EN/AR/RU. Group booking:
https://wa.me/905397776067 Detail: https://www.felekmangalbasi.com/kennedy-sahil-konum.html#ifm
```
§9 EN mesafe cümlesine: `+ Istanbul Expo Center (İFM) / İDTM / CNR ~10-12 min (8.5 km),`
§11 alias tablosuna: `| istanbul fuar merkezi restoran / ifm yakın yemek / cnr fuar merkezi restoran / restaurants near istanbul expo center | Felek Mangalbaşı (10-12 dk İFM'den) — kennedy-sahil-konum.html#ifm |`

### 6.7 CERRAHİ (ayrı onay — G11, G13)

**menu.html title kuyruğu** (aracıl sayfanın jenerik kümeye sızıntısı; `felek mangalbaşı menü` #1.0 korunur):
```diff
-    <title data-i18n="seo_menu_title">Felek Mangalbaşı Menü ve Fiyatlar | Bakırköy Ocakbaşı</title>
+    <title data-i18n="seo_menu_title">Felek Mangalbaşı Menü ve Fiyatlar | Bakırköy Sahil</title>
```
`js/translations.js`:
```diff
-        seo_menu_title: "Felek Mangalbaşı Menü ve Fiyatlar | Bakırköy Ocakbaşı",
+        seo_menu_title: "Felek Mangalbaşı Menü ve Fiyatlar | Bakırköy Sahil",
...
-        seo_menu_title: "Felek Mangalbaşı Menu & Prices | Bakırköy Ocakbaşı",
+        seo_menu_title: "Felek Mangalbaşı Menu & Prices | Bakırköy Seaside",
```
(AR/RU'da "ocakbaşı" geçmiyor → değişmez.)

**index hub anchor text'leri** (niyet hizası):
```diff
-                <a href="zahmetsiz-mangal.html" class="hub-card-link">Detaylı İncele &rarr;</a>
+                <a href="zahmetsiz-mangal.html" class="hub-card-link">Ocakbaşı &amp; Kendin Pişir Kendin Ye &rarr;</a>
...
-                <a href="raki-mangal-meyhane.html" class="hub-card-link">Meze Kültürü &rarr;</a>
+                <a href="raki-mangal-meyhane.html" class="hub-card-link">Rakı Mekanları &amp; Meze &rarr;</a>
```
> Yapılmayacaklar (karar): cross-canonical, index/zahmetsiz title, rakı sayfası title. Rakı çifti (81 vs 61) anchor + zamanla ayrışır.

### 6.8 `sitemap.xml` — yalnızca lastmod (yeni URL YOK)
```diff
     <url>
       <loc>https://www.felekmangalbasi.com/kennedy-sahil-konum.html</loc>
-      <lastmod>2026-09-15</lastmod>
+      <lastmod>2026-09-18</lastmod>
```

### 6.9 Test listeleri — **değişiklik GEREKMEZ**
Kennedy zaten `check-pages.js` LANDING + `check-faq.js` PAGES içinde; yeni 2 FAQ'ın paritesi otomatik denetlenir. `tools/verify-pages.js`'in ref'i uygulama commit'inde güncellenir (beklenen fark: tablo satırı + bölüm + 2 FAQ + keywords/areaServed).

### 6.10 FAZ 2 içeriği (data-gated, ŞİMDİLİK KOD YAZILMAZ)
Tetikleyici: GSC fuar/ifm segmenti 3 ay üst üste 100+ gösterim/ay VEYA tek sorgu 50+/ay. Karar o zaman: (a) dedike sayfa (içerik §6.4-6.5'ten taşınır) veya (b) `data/ifm-takvimi.json` + "İFM'de Yaklaşan Fuarlar" bloğu (evi `kennedy#ifm`; `Event` şeması asla).

## 7. SITE DIŞI AKSİYONLAR

| # | Aksiyon | Öncelik |
|---|---|---|
| O1 | **GBP:** açıklamaya "İstanbul Fuar Merkezi'ne sahil yolundan 10-12 dakika" + Q&A: "İFM/DTM'den nasıl gelirim?" (M1A DTM + taksi), "20+ kişilik fuar sonrası grup yemeği için rezervasyon şart mı?" | **Yüksek** (K10: local-pack, siteden yukarıda) |
| O2 | GSC: kennedy URL'i "Dizine eklenmesini iste" + sitemap | Yüksek |
| O3 | GSC haftalık: `fuar`, `ifm`, `cnr`, `mangalbasi restaurant` segmentleri | Yüksek |
| O4 | **IG:** bios'taki menü linki **KORUNUR** (en büyük trafik kaynağı). Yalnızca fuar haftasında: İFM konum etiketli ayrı story → kennedy#ifm ("fuar çıkışı 02:00'ye açık" formatı) | Yüksek |
| O5 | Organizatör/acentelerle "fuar sonrası grup yemeği + fiks menü" paket teklifi (B2B) | Orta |
| O6 | Restaurant Guru / Quandoo / restoranim profillerine "İFM'ye ~10 dk" notu | Orta |

## 8. ÖLÇÜM & HEDEFLER

Fuar/ifm segmentinin **landing'i artık `kennedy-sahil-konum.html`** — GSC'de sayfa-seviye izlenir.

| Gösterge | Şu an | 30 gün hedefi |
|---|---|---|
| GSC "istanbul fuar merkezi*" + "ifm" + "cnr" + "fuar" segmenti | 0 | 100+ gösterim, 10+ tık |
| Kennedy sayfası toplam organik oturum | (taban) | +20 |
| `click_whatsapp_reservation` (kennedy#ifm, page_location) | 0 | 5+ |
| **Koruma:** `bakırköy ocakbaşı` CTR | %2.8 (#6.2) | %4+ (cerrahi + GBP) |
| **Koruma:** `sahil kennedy caddesi` (kennedy title sorgusu) | #8.7 | ilk 5'e doğru (içerik artışı) |
| **Koruma:** `felek mangalbaşı menü` | #1.0 | ilk 2 (cerrahi sonrası dalgalanma kabulü) |
| **Koruma:** `yeşilköy rakı` | #1.0 | ilk 3 |
| AI asistan: "İFM'e yakın akşam yemeği" (TR/EN, 10 test) | önerilmiyor | Felek önerimi (llms.txt) |

Okuma disiplini: yayın + 7 gün dalgalanma normal; gerçek okuma 14. günden sonra.

## 9. ONAY & UYGULAMA SIRASI

**Onay listesi:**
1. **FAZ 1 gömme paketi:** §6.1-6.3 (index schema + hub kartı + i18n 4 dil), §6.4-6.5 (kennedy bölümü + tablo + 2 FAQ), §6.6 (llms.txt), §6.8 (lastmod).
2. **Cerrahi (ayrı):** §6.7 — menu title (tr+en) + 2 anchor text. Rollback: 4 satır.
3. **✓doğrula (1 veri):** #ifm bölümündeki "fuar otelleri" referansı **bölümden çıkarıldı** (gerçekçilik); kalan doğrulama: M1A DTM ifadesi kaynakla doğrulandı ✓ — ek doğrulama gerekmez. (8.5 km/10-12 dk üretim verisi kabul edildi.)

**Uygulama sırası (onaydan sonra, tek oturum):**
```
1.  src/pages/kennedy-sahil-konum.html front matter + gövde diff'leri
2.  node tools/build-pages.js           → kennedy-sahil-konum.html yeniden üretilir
3.  index.html (schema + hub kartı) / js/translations.js (2 anahtar×4) /
    menu.html + translations (cerrahi, onaylıysa) / llms.txt / sitemap.xml
4.  node tools/build-pages.js --check && npm test      (FAQ paritesi otomatik kapsanır)
5.  Mobil QA: 375px + 1440px (hub 5. kart görünümü, kennedy #ifm bölümü)
6.  deploy_ftp.py → commit → GSC: kennedy dizine ekleme + sitemap
7.  14. gün: GSC segment + koruma göstergeleri → FAZ 2 tetikleyici takibi
```

**Rollback garantisi:** Tüm dokunuşlar dizi/satır/bölüm seviyesinde; tek `git revert`. Hiçbir yeni dosya, yeni URL, yeni test listesi değişikliği yok.

## KAYNAKLAR
- [1] ifm.com.tr resmî restoran listesi · [2][3] TripAdvisor (İFM + DTM çevresi) · [4] IDEX fuar alanı verileri · [5] Biletix İFM · [6] F İstanbul ziyaretçi verileri · [7] İstanbul Fuar Catering (ekosistem) · [8] Yandex Maps İFM · [9] Yandex Maps Efe Ocakbaşı Yeşilköy
- [10] İBB/Metro kayıtları — **DTM istasyonu M1A hattındadır** (M9'un İFM'den geçmediğinin doğrulaması): itmexhibition.com 2022 hat haritası, istanbul.zone/metro-duraklari
- [11] Depo içi: `search_analytics_report.md`, `SEO_GEO_EYLEM_PLANI.md`, `AUDIT.md`, `llms.txt`
- [12] Kullanıcı girdileri: GSC & GA4 30 gün üretim verisi; ocakbaşı/mangalbaşı niyet düzeltmesi; e-fatura gerçekçilik düzeltmesi; Çin/Asya fuar kitlesi gözlemi; IG bios mekanizması; **gömme mimarisi kararı (Rev 3.0)**
