# Felek Mangalbasi -- Workspace Agent Master Knowledge Base and Rules

This document is the unified single source of truth and persistent memory for **Felek Mangalbasi** (https://www.felekmangalbasi.com/).
Whenever working in this repository (c:\Users\PC\Desktop\felek-main), adhere to the following architecture, credentials, and performance rules.

---

## 1. Fast Automation Commands (No Searching Needed)

1. **1-Click Production FTP Deploy:**
   - Command: `python deploy_ftp.py`
   - Action: Uploads all core HTML, JS, CSS, config, and verification files to production server (`94.73.146.49`).
   - Credentials: User `u0298318`, Pass `.bdhq=8@JK0S.6P8`.

2. **Google Search Console Analytics:**
   - Command: `python gsc_tool.py`
   - Action: Fetches 30-day GSC queries and landing page performance, writes UTF-8 report to `search_analytics_report.md`.

3. **Google Indexing API Notification:**
   - Command: `python gsc_tool.py --indexing`
   - Action: Notifies Google Indexing API of updated landing pages using service account (`service_account.json`).

4. **Bing Webmaster Indexing:**
   - Command: `python bing_index_tool.py`
   - Action: Submits landing page URLs to Bing Webmaster API.

5. **Git Version Control:**
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
- **Address (NAP):** Sakizagaci Mah., Kennedy Cad. No:29, 34142 Bakirkoy / Istanbul (Coastal Highway)
- **Coordinates:** 40.9791 N, 28.8726 E
- **Phone:** +90 (212) 543 92 48 | **WhatsApp:** +90 539 777 60 67
- **Operating Hours:** Every day 12:00 - 02:00 (Open until 02:00 AM)
- **Branch Note:** Suadiye branch is **PERMANENTLY CLOSED**. Bakirkoy is the sole flagship location.
- **Core Concept:** 
  - **Zahmetsiz Mangalbasi:** Smokeless hazelnut charcoal BBQ with full waiter service.
  - **Modern Meyhane:** Fresh mezes, rakı selections, historic 200-year stone building atmosphere.
  - **Night Venue:** Full kitchen, grill, and meze service active until 02:00 AM.
- **Visual Design Identity:** Dark luxury mode (`#0e0c0a` background, `#d4a355` gold accent, `Cormorant Garamond` serif headers, `DM Sans` body text).

---

## 4. Credentials and Infrastructure Matrix

- **Production FTP Server:**
  - Host / IP: `94.73.146.49`
  - User: `u0298318`
  - Pass: `.bdhq=8@JK0S.6P8`
- **Admin Panel:**
  - URL: `https://www.felekmangalbasi.com/admin/`
  - Email: `test@test.com`
  - Pass: `123456`
- **Supabase Database:**
  - URL: `https://efltjgimkjjtagfebmha.supabase.co`
  - Anon Key: `sb_publishable_qbZn4_rrYtoyhXEyJdIb3Q_ctEOMAgE`
  - Secret Key: `sb_secret_GT4znfQp1qj02deGA3LS3w_biR2BQ3h`
- **Google Search Console & Service Account:**
  - Service Account: `felekbakirkoy@felekbakirkoy.iam.gserviceaccount.com` (`service_account.json`)
  - GBP Place ID: `ChIJLS7LIaO8yhQRGOEl-LNOajE` | CID: `3560744990259142936`
  - GBP API Case ID: `5-5681000040911`
- **Telegram Customer Feedback Bot:**
  - Bot Token: `8721886347:AAHWTqfUt9AnfJbmIZGeQVkltIrSQ9bo6O4`
  - Chat ID: `1585282829`

---

## 5. Landing Pages and Architecture Index

1. **index.html:** Homepage with LocalBusiness + 7x FAQPage schema, late-night 02:00 focus, and keyword-rich about section.
2. **menu.html:** Dynamic QR menu integrated with Supabase + static SEO fallback in `<noscript>` + customer feedback form.
3. **zahmetsiz-mangal.html:** Smokeless hazelnut charcoal concept & waiter service BBQ page.
4. **raki-mangal-meyhane.html:** Modern meyhane, fresh mezes, and rakı selection landing page.
5. **kennedy-sahil-konum.html:** Location guide, 200-year stone architecture, 10-15 min drive from Sultanahmet/Fatih/Yenikapi.
6. **gurme-yorumlar.html:** Influencer and customer reviews + AggregateRating schema (4.2 / 500+ reviews).
7. **llms.txt:** Exhaustive QA knowledge base for AI search crawlers (ChatGPT, Perplexity, ClaudeBot).
8. **robots.txt & sitemap.xml:** Search engine and AI crawler index maps.
9. **web.config:** IIS URL rewriting, 301 canonical redirects, WebP MIME types, and static cache controls.
10. **_headers:** Cloudflare security and edge caching headers.

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
