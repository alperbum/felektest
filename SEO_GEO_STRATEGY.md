# Felek Mangalbaşı — Master SEO, GEO & Project Knowledge Base

This file serves as the single source of truth for **Felek Mangalbaşı** (`https://www.felekmangalbasi.com/`). It contains technical infrastructure details, FTP configurations, Google API automation setup, keyword targets, and baseline analytics.

---

## 🏛️ 1. Business Identity & Core Differentiators
- **Brand Name:** Felek Mangalbaşı (Felek Meyhane / Felek Kendin Pişir Kendin Ye)
- **Location:** Sakızağacı Mah., Kennedy Cad. No:29, 34142 Bakırköy / İstanbul (Seaside / Sahil Yolu)
- **Coordinates:** 40.9791° N, 28.8726° E
- **Core Concept:** 
  - **Zahmetsiz Mangalbaşı:** Kokusuz fındık kömürü ateşi ve tam garson hizmetiyle masada duman stresi olmadan kendin pişir kendin ye keyfi.
  - **Modern Meyhane:** Zengin günlük taze meze dolabı, soğuk/sıcak ara sıcaklar, rakı seçkisi.
  - **Atmosfer:** 200 yıllık tarihi taş bina dokusu, 20+ yıllık sahil mirası, ferah açık deniz manzaralı bahçe, vale ve otopark imkanı.

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

## 📊 4. Google Search Console & API Automation
- **Active Verified Property:** `https://www.felekmangalbasi.com/` (Verified via `google815b56b5875fd4cb.html` & HTML meta tag).
- **Google Service Account Email:** `felekbakirkoy@felekbakirkoy.iam.gserviceaccount.com` (Has Full/Owner access in GSC).
- **Service Account Credentials:** `service_account.json` (Stored locally in project root).
- **Local API Automation Tool:** `gsc_tool.py`
  - Run `python gsc_tool.py` -> Fetches 30-day GSC query/landing page analytics & saves UTF-8 report to `search_analytics_report.md`.
  - Run `python gsc_tool.py --indexing` -> Sends automatic indexing notifications to Google Indexing API.

---

## 📈 5. Baseline Search Performance Metrics (July 2026)
- **Top Brand Queries:**
  - `felek mangalbaşı` (#2.0 position, 30 impressions, 4 clicks, 13.3% CTR)
  - `felek bakırköy` (#2.7 position, 3 impressions, 1 click, 33.3% CTR)
  - `felek mangalbaşı bakırköy` (#3.3 position)
- **Top Opportunity Niche Queries:**
  - `bakırköy kendin pişir kendin ye` (#5.8 position, 8 impressions)
  - `bakırköy mangalbaşı` (#5.2 position, 4 impressions)
  - `bakırköy ocakbaşı` (#11.5 position)
  - `bakırköy ocakbaşı mekanları` (#7.5 position)
  - `ocakbaşı bakırköy` (#9.0 position)

---

## 📄 6. Landing Pages & Structure Index
1. **[index.html](file:///c:/Users/PC/Desktop/felek-main/index.html):** Home page with `@graph` LocalBusiness + FAQPage JSON-LD schema & sleek luxury editorial experience hub (`01`–`04`).
2. **[zahmetsiz-mangal.html](file:///c:/Users/PC/Desktop/felek-main/zahmetsiz-mangal.html):** Concept page for smokeless hazelnut charcoal & full waiter service BBQ + FAQ schema.
3. **[raki-mangal-meyhane.html](file:///c:/Users/PC/Desktop/felek-main/raki-mangal-meyhane.html):** Modern meyhane, fresh mezes, rakı selection + FAQ schema.
4. **[kennedy-sahil-konum.html](file:///c:/Users/PC/Desktop/felek-main/kennedy-sahil-konum.html):** Location details, 200-year stone architecture, 10-15 min drive from Fatih/Yenikapı/Sultanahmet + FAQ schema.
5. **[gurme-yorumlar.html](file:///c:/Users/PC/Desktop/felek-main/gurme-yorumlar.html):** Influencer reviews (Ayhan Mortepe), gourmet ratings + AggregateRating schema (4.2 rating / 500+ reviews).
6. **[menu.html](file:///c:/Users/PC/Desktop/felek-main/menu.html):** Dynamic digital menu integrated with Supabase.
7. **[llms.txt](file:///c:/Users/PC/Desktop/felek-main/llms.txt):** Exhaustive QA & knowledge base for AI search crawlers (ChatGPT, Perplexity, ClaudeBot).
8. **[robots.txt](file:///c:/Users/PC/Desktop/felek-main/robots.txt):** Crawl permissions for search & AI bots.
9. **[sitemap.xml](file:///c:/Users/PC/Desktop/felek-main/sitemap.xml):** XML sitemap with explicit lastmod tags.
10. **[web.config](file:///c:/Users/PC/Desktop/felek-main/web.config):** IIS rewrite rules for URL cleaning, 301 redirects, and verification file preservation.
