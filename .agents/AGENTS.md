# Felek Mangalbasi -- Workspace Agent Master Knowledge Base and Rules

This document is the unified single source of truth and persistent memory for **Felek Mangalbasi** (https://www.felekmangalbasi.com/).
Whenever working in this repository (c:\Users\PC\Desktop\felek-main), adhere to the following architecture, credentials, and performance rules.

---

## 1. Fast Automation Commands (No Searching Needed)

> [!CAUTION]
> **CRITICAL DEPLOYMENT RULE:**
> NEVER execute `deploy_ftp.py` or upload files to the FTP server without the user's explicit prior confirmation and approval! Always explain the proposed changes and ask for permission first.


1. **1-Click Production FTP Deploy:**
   - Command: `python deploy_ftp.py`
   - Dry run / config check: `python deploy_ftp.py --check` (connects to nothing)
   - Action: Uploads `CORE_FILES` (HTML, JS, CSS, `api/feedback.php`, config, verification files) to production.
   - Credentials: read from environment variables or the git-ignored `.env` file (see `.env.example`).
     **Never hardcode them in the script again.** The script aborts with a clear error if they are missing.

2. **Build Step (REQUIRED after editing sources):**
   - Command: `npm run build` (= `node tools/build.js && node tools/build-pages.js`)
   - Verify: `npm run build:check` — fails if any generated file is out of date.
   - **`js/script.js` is GENERATED. Never edit it by hand.** Edit the fragments under `src/js/`
     (order is defined in `src/js/manifest.json`) and rebuild. All fragments share one
     `DOMContentLoaded` closure, so scope and order are preserved by the build.
   - **The 7 landing pages are GENERATED. Never edit `zahmetsiz-mangal.html` etc. by hand.**
     Edit `src/pages/<slug>.html` (front matter JSON + page body) or the shared shell
     `src/layouts/landing.html`, then rebuild. The build emits the same root-level
     `.html` paths, so `web.config`, `sitemap.xml`, the FTP allowlist and every internal
     link keep working unchanged.
     - `BreadcrumbList` JSON-LD is GENERATED from `pageName` + canonical URL.
     - `FAQPage` JSON-LD is stored verbatim and must stay byte-equal to the visible
       `<details>` text — `tests/check-faq.js` enforces this.
     - `twitter:title` / `og:title` default to `title` (single source).

3. **Test Suite (run before every commit):**
   - Command: `npm test`  (= `node tests/run-all.js`)
   - Suites: `check-build` (source/bundle consistency), `check-pages` (7 SEO pages + index),
     `check-faq` (visible FAQ text vs FAQPage schema), `check-menu` (jsdom behaviour: menu
     render, i18n, JSON-LD, feedback form), `check-security` (secret scan, credential
     tracking, deploy allowlist).
   - After a template refactor, prove losslessness with `npm run verify:pages`
     (compares generated pages against a git ref structurally).

2. **Google Search Console & GBP Unified Analytics:**
   - Command: `python report_tool.py` (veya `python gsc_tool.py`)
   - Action: Fetches 30-day GSC queries, comparison growth (% change), mobile/desktop split, SEO opportunity matrix, and GBP profile data. Writes to `search_analytics_report.md`.
   - Telegram Digest: `python report_tool.py --telegram`

3. **Google Analytics 4 (GA4) Analytics & Realtime:**
   - Command: `python ga4_tool.py`
   - Action: Fetches 30-day GA4 sessions, active/new users, top pages, traffic channels, device/city stats, and conversion events. Writes to `ga4_analytics_report.md`.
   - Realtime Active Users: `python ga4_tool.py --realtime`
   - Telegram Digest: `python ga4_tool.py --telegram`

4. **Google Indexing API Notification:**
   - Command: `python report_tool.py --indexing` (veya `python gsc_tool.py --indexing`)
   - Action: Notifies Google Indexing API of updated landing pages using service account (`service_account.json`).

5. **Bing Webmaster Indexing:**
   - Command: `python bing_index_tool.py`
   - Action: Submits landing page URLs to Bing Webmaster API.

6. **Git Version Control:**
   - Command: `git add .`, `git commit -m '...'`, `git push origin main`
   - Repository: `alperbum/felek`

---

## 2. Core Web Vitals and Performance Engineering Rules

1. **LCP (Largest Contentful Paint < 1.2s):**
   - In `menu.html`, preloaded image URLs must EXACTLY match the `src` rendered in `script.js` (`https://www.felekmangalbasi.com/images/mezeler/mezeler.webp`, etc.). Never preload external CDNs that aren\'t rendered directly.
   - Cloudflare cache rule for `/images/*` and `/assets/*` in `_headers` and `web.config` must stay `max-age=31536000, immutable`.

2. **INP (Interaction to Next Paint < 200ms):**
   - **DOM Batching:** Always use `document.createDocumentFragment()` in `renderCategories()` and `renderMenu()` to insert all elements in 1 single paint cycle. NEVER do sequential `menuGrid.appendChild` in loops.
   - **Double rAF:** Category click listeners must use double `requestAnimationFrame` so the browser acknowledges touch feedback before DOM rendering.
   - **Idle Tasks:** Keep `generateMenuSchema()` and background image prefetching inside `requestIdleCallback`.

3. **CLS (Cumulative Layout Shift = 0):**
   - Ensure explicit `width` and `height` attributes are set on all `<img>` tags.

---

## 3. Business Identity, Location and Differentiators

- **Brand Name:** Felek Mangalbasi (Felek Meyhane / Felek Kendin Pisir Kendin Ye)
- **Legal Entity:** Atak İnşaat Turizm Otomotiv Tic. Ltd. Şti. (Bulurum / Ticaret Sicili Kayıtlı)
- **Historical Heritage:** Formerly "Felek Fasıl" (2004–2018), historic 200-year stone building (Pırlanta Hanım Konağı).
- **Address (NAP):** Sakizagaci Mah., Kennedy Cad. No:29, 34142 Bakirkoy / Istanbul (Coastal Highway)
- **Coordinates:** 40.9791 N, 28.8726 E
- **Phone:** +90 (212) 543 92 48 | **WhatsApp:** +90 539 777 60 67
- **Operating Hours:** Every day 12:00 - 02:00 (Open until 02:00 AM)
- **Branch Note:** Suadiye branch is **PERMANENTLY CLOSED**. Bakirkoy is the sole flagship location.
- **Core Concept:** 
  - **Zahmetsiz Mangalbasi:** Smokeless hazelnut charcoal BBQ with full waiter service.
  - **Modern Meyhane:** Fresh mezes, rakı selections, historic 200-year stone building atmosphere.
  - **Atmosphere Note:** No active live music / fasıl program. The building historically hosted the legendary "Felek Fasıl", now operating exclusively as Felek Mangalbaşı with calm background ambience.
  - **Night Venue:** Full kitchen, grill, and meze service active until 02:00 AM.
- **Visual Design Identity:** Dark luxury mode (`#0e0c0a` background, `#d4a355` gold accent, `Cormorant Garamond` serif headers, `DM Sans` body text).

---

## 4. Credentials and Infrastructure Matrix

- **Production FTP Server:** values live in `.env` (git-ignored) — keys `FTP_HOST`, `FTP_USER`, `FTP_PASS`.
- **Admin Panel:** URL `https://www.felekmangalbasi.com/admin/` — credentials in `.env`
  (`ADMIN_URL`, `ADMIN_EMAIL`, `ADMIN_PASS`).
  > [!WARNING]
  > The admin panel still uses the default weak credentials. Rotate them.
  > The `admin/` app is also not deployable as-is (separate Vite project).
- **Supabase Database:**
  - URL / publishable key: `js/config.js` (public by design, protected by RLS) and `.env`.
  - Secret key: **removed from this file.** If it is still valid, rotate it in the
    Supabase dashboard and store the new value in `.env` (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).
    A secret/service-role key must never be committed or shipped to the browser.
- **Google Search Console & GA4 & Service Account:**
  - Service Account: `felekbakirkoy@felekbakirkoy.iam.gserviceaccount.com` (`service_account.json`)
  - GA4 Property ID: `534404937`
  - GA4 Measurement ID: `G-E3588HSCF5`
  - GBP Place ID: `ChIJLS7LIaO8yhQRGOEl-LNOajE` | CID: `3560744990259142936`
  - GBP API Case ID: `5-5681000040911`
- **Telegram Customer Feedback Bot:**
  - Token / chat id: `.env` (`TG_BOT_TOKEN`, `TG_CHAT_ID`). Server-side only — the browser
    never talks to `api.telegram.org`; `js/feedback.js` POSTs to `api/feedback.php`, which
    reads the token from the environment.
  > [!CAUTION]
  > This token was committed in plaintext in git history and shipped to browsers. Treat it as
  > compromised: rotate it via BotFather (`/revoke`) and put the new value in `.env`.

---

## 5. Landing Pages and Architecture Index

1. **index.html:** Homepage with LocalBusiness + 7x FAQPage schema, late-night 02:00 focus, and keyword-rich about section.
2. **menu.html:** Dynamic QR menu integrated with Supabase + static SEO fallback in `<noscript>` + customer feedback form.
3. **tarihce.html:** 200-year stone mansion heritage, Felek Fasıl to Felek Mangalbaşı evolution, and verified entity continuity proofs (Bulurum, Infobel, mekan.com).
4. **basinda-felek.html:** 20+ year national press wall (İstanbul Times 2025, Hürriyet 2008, Milliyet 2004, Posta Müslüm Gürses, Magazinkolik) and stage heritage.
5. **suadiye.html:** Dedicated landing bridge for Suadiye traffic explaining closure & directing to Bakirkoy flagship.
6. **zahmetsiz-mangal.html:** Smokeless hazelnut charcoal concept, bakirkoy ocakbasi & kendin pisir consolidated landing page.
7. **raki-mangal-meyhane.html:** Modern meyhane, fresh mezes, rakı selection, and late-night dining landing page.
8. **kennedy-sahil-konum.html:** Location guide, 200-year stone architecture, 10-15 min drive from Sultanahmet/Fatih/Yenikapi.
9. **gurme-yorumlar.html:** Influencer and customer reviews + AggregateRating schema (4.3 / 500+ reviews).
10. **llms.txt:** Exhaustive QA knowledge base for AI search crawlers (ChatGPT, Perplexity, ClaudeBot).

> **Note on landing pages 1–9:** items 1–9 are generated at the repository root. Their
> sources live in `src/pages/` (one file per page) and share `src/layouts/landing.html`.
> See the Build Step section above before editing them.
11. **robots.txt & sitemap.xml:** Search engine and AI crawler index maps.
12. **web.config:** IIS URL rewriting, 301 canonical redirects, WebP MIME types, and static cache controls.
13. **_headers:** Cloudflare security and edge caching headers.

---

## 6. Target Keywords and Geo-SEO Scope

- **Core Target Districts:** Bakirkoy, Atakoy, Yesilyurt, Yesilkoy, Florya, Zeytinburnu, Bahcelievler.
- **Coastal Peninsula Drive-in (10-15 Mins):** Yenikapi IDO, Fatih, Aksaray, Sultanahmet, Eminonu.
- **Priority Opportunity Keywords:**
  - `bakirkoy mangalbasi` (Target: Top 1)
  - `bakirkoy ocakbasi` (Target: Top 1)
  - `bakirkoy kendin pisir kendin ye` (Target: Top 1)
  - `gece acik restoran bakirkoy` (Target: Top 1)
  - `bakirkoy sahil ocakbasi` (Target: Top 1)
  - `bakirkoy meyhane` (Target: Top 1)
