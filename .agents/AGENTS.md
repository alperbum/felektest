# Felek Mangalbasi -- Workspace Agent Rules and Project Context

Whenever working in this workspace (c:\Users\PC\Desktop\felek-main), always adhere to the following established rules and workflows:

---

## 1. Fast Workflows and Commands (No Searching Needed)

1. **Google Search Console Analytics:**
   - python gsc_tool.py -> Automatically fetches 30-day GSC query/page rankings and saves report to search_analytics_report.md.
   - python gsc_tool.py --indexing -> Sends instant Google Indexing API ping for updated landing pages.

2. **1-Click Production FTP Deploy:**
   - python deploy_ftp.py -> Direct Python FTP upload for all modified core files to 94.73.146.49.
   - Credentials: User u0298318, Pass .bdhq=8@JK0S.6P8.

3. **Git Version Control:**
   - git add ., git commit -m '...', git push origin main (Repository: alperbum/felek).

---

## 2. Core Web Vitals and Performance Rules (DO NOT BREAK)

1. **LCP (Largest Contentful Paint < 1.2s):**
   - In menu.html, preloaded image URLs must EXACTLY match the src rendered in script.js (https://www.felekmangalbasi.com/images/mezeler/mezeler.webp, etc.). Never point preloads to external CDNs that are not rendered directly.
   - Cloudflare cache rule for /images/* in _headers and web.config must stay max-age=31536000, immutable.

2. **INP (Interaction to Next Paint < 200ms):**
   - **DOM Batching:** Always use document.createDocumentFragment() in renderCategories() and renderMenu() to insert all elements in 1 single paint cycle. NEVER do sequential menuGrid.appendChild in loops.
   - **Double rAF:** Category click listeners must use double requestAnimationFrame so the browser acknowledges touch feedback before DOM rendering.
   - **Idle Tasks:** Keep generateMenuSchema() and background image prefetching inside requestIdleCallback.

---

## 3. Brand and Architecture Context

- **Location:** Felek Mangalbasi is strictly Bakirkoy Sahil (Sakizagaci, Kennedy Cad. No:29). (Suadiye branch is permanently closed).
- **Core Identity:** Zahmetsiz Mangalbasi (findik kabugu komuru), Modern Meyhane, Gece 02:00'ye kadar acik, 200 yillik tarihi tas bina, deniz manzarali bahce.
- **Visual Design:** Dark luxury mode (#0e0c0a, gold #d4a355, Cormorant Garamond serif headers, DM Sans body).
- **Supabase DB:** https://efltjgimkjjtagfebmha.supabase.co (Secret Key: sb_secret_GT4znfQp1qj02deGA3LS3w_biR2BQ3h).
- **Admin Panel:** https://www.felekmangalbasi.com/admin/ (test@test.com / 123456).
