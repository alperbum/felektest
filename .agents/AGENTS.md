# Felek Mangalbaşı — Workspace Agent Rules & Project Context

Whenever working in this workspace (`c:\Users\PC\Desktop\felek-main`), always adhere to the following rules:

1. **Master Context & Strategy File:**
   - Refer to [SEO_GEO_STRATEGY.md](file:///c:/Users/PC/Desktop/felek-main/SEO_GEO_STRATEGY.md) for full project identity, target locations, FTP credentials, Search Console API setup, and baseline search rankings.

2. **Single Location & Brand Differentiators:**
   - Felek Mangalbaşı is strictly the **Bakırköy seaside location** (Sakızağacı, Kennedy Cad. No:29). *(Note: Suadiye branch is PERMANENTLY CLOSED)*.
   - Core differentiators: **Zahmetsiz Mangalbaşı** (smokeless hazelnut charcoal), **Modern Meyhane** (fresh meze & rakı), **Gece 02:00'ye kadar açık**, **200-year historic stone building**, and **seaside garden**.

3. **Design & Aesthetic Integrity:**
   - Maintain Felek Mangalbaşı's luxury, classy, dark mode & gold-accented aesthetic (`#0e0c0a` background, `#d4a355` gold accents, `Cormorant Garamond` serif headings, `DM Sans` body text).
   - NEVER add cheap emojis, blocky grey background boxes, or raw keyword lists to visual UI elements on `index.html`.

4. **Google Search Console & Google Business Profile (GBP):**
   - Service account JSON: `service_account.json` (`felekbakirkoy@felekbakirkoy.iam.gserviceaccount.com`).
   - Run `python gsc_tool.py` to generate an updated 30-day analytics report in `search_analytics_report.md`.
   - Run `python gsc_tool.py --indexing` for automated Indexing API requests.
   - GBP API Application Case ID: `5-5681000040911` (Pending basic API access quota approval).

5. **FTP Upload Safety:**
   - Test all changes locally before uploading.
   - Run the upload script `powershell -ExecutionPolicy Bypass -File "C:\Users\PC\.gemini\antigravity-ide\brain\da31ffd4-ebf3-477b-9b12-ff9d9fde6d7b\scratch\upload_all.ps1"` when instructed to publish live to `94.73.146.49`.

6. **Supabase Database Credentials:**
   - URL: `https://efltjgimkjjtagfebmha.supabase.co`
   - Secret Key: `sb_secret_GT4znfQp1qj02deGA3LS3w_biR2BQ3h` (Use for REST API administrative menu updates).

7. **Admin Panel Credentials:**
   - URL: `https://www.felekmangalbasi.com/admin/`
   - Email: `test@test.com`
   - Password: `123456`

