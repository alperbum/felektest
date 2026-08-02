# Felek Mangalbaşı — Master SEO, GEO & Project Knowledge Base

This file serves as the single source of truth for **Felek Mangalbaşı** (`https://www.felekmangalbasi.com/`). It contains technical infrastructure details, FTP configurations, Google API automation setup, keyword targets, and baseline analytics.

---

## 🏛️ 1. Business Identity & Core Differentiators
- **Brand Name:** Felek Mangalbaşı (Felek Meyhane / Felek Kendin Pişir Kendin Ye)
- **Location:** Sakızağacı Mah., Kennedy Cad. No:29, 34142 Bakırköy / İstanbul (Seaside / Sahil Yolu)
- **Branch Note:** Suadiye branch is **PERMANENTLY CLOSED**. Bakırköy is the sole flagship location.
- **Coordinates:** 40.9791° N, 28.8726° E
- **Core Concept & Campaign Differentiators:** 
  - **Zahmetsiz Mangalbaşı:** Kokusuz fındık kömürü ateşi ve tam garson hizmetiyle masada duman stresi olmadan kendin pişir kendin ye keyfi.
  - **Gece Açık Restoran (02:00):** Gece 02:00'ye kadar kesintisiz tam menü, mangal ve rakı-meze servisi.
  - **Modern Meyhane:** Zengin günlük taze meze dolabı, soğuk/sıcak ara sıcaklar, rakı seçkisi.
  - **Atmosfer:** 200 yıllık tarihi taş bina dokusu, 20+ yıllık sahil mirası, ferah açık deniz manzaralı bahçe, vale ve otopark imkanı.
  - **Segmentler:** Gece Kuşları (00:00-02:00), Öğle Molası Kurumsal / İş Yemeği, Doğum Günü & Kutlamalar.

---

## 📍 2. Geo-SEO Target Locations & Tourist Scope
- **Core Target Districts:** Bakırköy, Ataköy, Yeşilyurt, Yeşilköy, Florya, Zeytinburnu, Bahçelievler.
- **Historic Peninsula & Coastal Highway Access (10-15 Min Drive):** Yenikapı İDO İskelesi, Fatih, Aksaray, Sultanahmet (Tarihi Yarımada), Eminönü.
- **International / Tourist Search Targets:**
  - **Arabic:** `مطعم مشاوي عربي ومقبلات فاخرة في اسطنبول باقركوي` (Bakırköy ve Sultanahmet yakını Arapça مشاوي / Grill aramaları).
  - **English:** `Best Tabletop BBQ Steakhouse & Meyhane in Bakirkoy Istanbul near Sultanahmet`.

---

## 🖥️ 3. Technical Infrastructure & FTP Server
- **Server IP:** `94.73.146.49`
- **FTP Username:** `u0298318`
- **FTP Password:** `.bdhq=8@JK0S.6P8`
- **Admin Panel URL:** `https://www.felekmangalbasi.com/admin/`
- **Admin Email:** `test@test.com`
- **Admin Password:** `123456`
- **FTP Deployment Script:** `python gsc_tool.py` (Local automation) & `C:\Users\PC\.gemini\antigravity-ide\brain\da31ffd4-ebf3-477b-9b12-ff9d9fde6d7b\scratch\upload_all.ps1`.
- **Supabase URL:** `https://efltjgimkjjtagfebmha.supabase.co`
- **Supabase Anon Key:** `sb_publishable_qbZn4_rrYtoyhXEyJdIb3Q_ctEOMAgE`
- **Supabase Secret Key:** `sb_secret_GT4znfQp1qj02deGA3LS3w_biR2BQ3h`

---

## 📊 4. Google Search Console & Google Business Profile (GBP) Automation
- **Active Verified Property:** `https://www.felekmangalbasi.com/` (Verified via `google815b56b5875fd4cb.html` & HTML meta tag).
- **Google Service Account Email:** `felekbakirkoy@felekbakirkoy.iam.gserviceaccount.com` (Has Full/Owner access in GSC).
- **Service Account Credentials:** `service_account.json` (Stored locally in project root).
- **Google Business Profile API Case ID:** `5-5681000040911` (Basic API access application submitted, pending quota activation).
- **Google Business Profile Place ID:** `ChIJLS7LIaO8yhQRGOEl-LNOajE` | **CID:** `3560744990259142936`
- **Local API Automation Tools:**
  - `python gsc_tool.py` -> Fetches 30-day GSC query/landing page analytics & saves UTF-8 report to `search_analytics_report.md`.
  - `python gsc_tool.py --indexing` -> Sends automatic indexing notifications.

---

## 📈 5. Baseline & Target Search Performance Metrics
- **Top Brand Queries:**
  - `felek mangalbaşı` (#2.0 position, 136 impressions)
  - `felek bakırköy` (#3.6 position, 25 impressions)
- **Target Priority Opportunity Queries (Optimized in August 2026):**
  - `bakırköy mangalbaşı` (Target: Top 3)
  - `bakırköy ocakbaşı` (Target: Top 3)
  - `bakırköy kendin pişir kendin ye` (Target: Top 3)
  - `gece açık restoran bakırköy` (Target: Top 1)
  - `bakırköy sahil ocakbaşı` (Target: Top 3)
  - `iş yemeği bakırköy` (Target: Top 3)
  - `doğum günü mekan bakırköy` (Target: Top 3)

---

## 📄 6. Landing Pages & Structure Index
1. **[index.html](file:///c:/Users/PC/Desktop/felek-main/index.html):** Home page with `@graph` LocalBusiness + 7x FAQPage JSON-LD schema, sameAs citations (Instagram, Google Maps, Restaurant Guru, mekanlar.com), late-night 02:00 emphasis, & keyword-boosted About section.
2. **[zahmetsiz-mangal.html](file:///c:/Users/PC/Desktop/felek-main/zahmetsiz-mangal.html):** Concept page for smokeless hazelnut charcoal & full waiter service BBQ + Ayhan Mortepe review.
3. **[raki-mangal-meyhane.html](file:///c:/Users/PC/Desktop/felek-main/raki-mangal-meyhane.html):** Modern meyhane, fresh mezes, rakı selection + FAQ schema.
4. **[kennedy-sahil-konum.html](file:///c:/Users/PC/Desktop/felek-main/kennedy-sahil-konum.html):** Location details, 200-year stone architecture, 10-15 min drive from Fatih/Yenikapı/Sultanahmet + late-night 02:00 title/description.
5. **[gurme-yorumlar.html](file:///c:/Users/PC/Desktop/felek-main/gurme-yorumlar.html):** Influencer reviews, gourmet ratings + AggregateRating schema (4.2 rating / 500+ reviews).
6. **[menu.html](file:///c:/Users/PC/Desktop/felek-main/menu.html):** Dynamic digital menu integrated with Supabase + `<noscript>` static SEO fallback for search engine crawlers.
7. **[llms.txt](file:///c:/Users/PC/Desktop/felek-main/llms.txt):** Exhaustive QA & knowledge base for AI search crawlers (ChatGPT, Perplexity, ClaudeBot), including Suadiye closure notice, Business Lunch scenario, and late-night Q&A.
8. **[robots.txt](file:///c:/Users/PC/Desktop/felek-main/robots.txt):** Crawl permissions for search & AI bots.
9. **[sitemap.xml](file:///c:/Users/PC/Desktop/felek-main/sitemap.xml):** XML sitemap with explicit lastmod tags (`2026-08-02`).
10. **[web.config](file:///c:/Users/PC/Desktop/felek-main/web.config):** IIS rewrite rules for URL cleaning, 301 redirects, and verification file preservation.

