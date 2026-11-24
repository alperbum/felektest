"""
Felek Mangalbaşı — Unified Analytics & Performance Reporting Tool
Fetches Google Search Console (GSC) data, Google Business Profile (GBP) status,
calculates growth metrics, opportunities, and optionally dispatches Telegram digests.

Usage:
    python report_tool.py                     # Generates 30-day analytics report
    python report_tool.py --days 14           # Generates 14-day analytics report
    python report_tool.py --telegram          # Generates report and sends summary to Telegram
    python report_tool.py --indexing          # Submits landing pages to Google Indexing API
"""

import os
import sys
import json
import argparse
import datetime
import requests
from tools_config import get
from google.oauth2 import service_account
from googleapiclient.discovery import build
import google.auth.transport.requests

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Configuration
KEY_FILE = "service_account.json"
SITE_URL = "https://www.felekmangalbasi.com/"
# Kimlik bilgileri ortam degiskeni veya .env'den okunur (bkz. .env.example).
TELEGRAM_BOT_TOKEN = get('TG_BOT_TOKEN')
TELEGRAM_CHAT_ID = get('TG_CHAT_ID')
PLACE_ID = "ChIJLS7LIaO8yhQRGOEl-LNOajE"

SCOPES = [
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/indexing",
    "https://www.googleapis.com/auth/business.manage"
]

def get_credentials():
    if not os.path.exists(KEY_FILE):
        raise FileNotFoundError(f"Service account file '{KEY_FILE}' bulunamadı.")
    return service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)

def get_gbp_profile_info(creds):
    """Fetches Google Business Profile live data."""
    try:
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
        headers = {
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json"
        }
        url = "https://mybusinessbusinessinformation.googleapis.com/v1/googleLocations:search"
        body = {"query": "Felek Mangalbaşı Bakırköy"}
        res = requests.post(url, headers=headers, json=body, timeout=10)
        if res.status_code == 200:
            data = res.json()
            locs = data.get("googleLocations", [])
            if locs:
                loc = locs[0].get("location", {})
                return {
                    "title": loc.get("title", "Felek Mangalbaşı"),
                    "phone": loc.get("phoneNumbers", {}).get("primaryPhone", "+90 212 543 92 48"),
                    "address": ", ".join(loc.get("storefrontAddress", {}).get("addressLines", [])) + f", {loc.get('storefrontAddress', {}).get('locality', '')}",
                    "place_id": loc.get("metadata", {}).get("placeId", PLACE_ID),
                    "maps_url": loc.get("metadata", {}).get("mapsUri", "https://maps.google.com/maps?cid=3560744990259142936"),
                    "review_url": loc.get("metadata", {}).get("newReviewUri", f"https://search.google.com/local/writereview?placeid={PLACE_ID}")
                }
    except Exception as e:
        print(f"[GBP Bilgi Uyarısı]: {e}")
    return None

def calc_change(current, previous):
    """Calculates percentage change between periods."""
    if previous == 0:
        return "+100%" if current > 0 else "0%"
    diff = ((current - previous) / previous) * 100
    sign = "+" if diff > 0 else ""
    return f"{sign}{diff:.1f}%"

BRAND_KEYWORDS = ["felek", "pırlanta", "pirlanta"]

def is_brand_query(query):
    if not query:
        return False
    q = query.lower().strip()
    return any(b in q for b in BRAND_KEYWORDS)

def run_comprehensive_analytics(days=30, send_telegram=False):
    creds = get_credentials()
    service = build("searchconsole", "v1", credentials=creds)

    # Date ranges
    end_curr = datetime.date.today() - datetime.timedelta(days=2)
    start_curr = end_curr - datetime.timedelta(days=days)
    
    end_prev = start_curr - datetime.timedelta(days=1)
    start_prev = end_prev - datetime.timedelta(days=days)

    start_curr_str = start_curr.strftime("%Y-%m-%d")
    end_curr_str = end_curr.strftime("%Y-%m-%d")
    start_prev_str = start_prev.strftime("%Y-%m-%d")
    end_prev_str = end_prev.strftime("%Y-%m-%d")

    print(f"\n=======================================================")
    print(f"[*] FELEK MANGALBASI — GSC & GBP VERI RAPORU (NON-BRAND ONCELIKLI)")
    print(f"Donem: {start_curr_str} — {end_curr_str} (Son {days} Gun)")
    print(f"Kiyas : {start_prev_str} — {end_prev_str}")
    print(f"=======================================================\n")

    # 1. Total Metrics & Comparison
    req_curr_total = {"startDate": start_curr_str, "endDate": end_curr_str}
    req_prev_total = {"startDate": start_prev_str, "endDate": end_prev_str}
    
    res_curr_total = service.searchanalytics().query(siteUrl=SITE_URL, body=req_curr_total).execute()
    res_prev_total = service.searchanalytics().query(siteUrl=SITE_URL, body=req_prev_total).execute()

    curr_tot = res_curr_total.get("rows", [{}])[0] if res_curr_total.get("rows") else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
    prev_tot = res_prev_total.get("rows", [{}])[0] if res_prev_total.get("rows") else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}

    c_clicks = curr_tot.get("clicks", 0)
    p_clicks = prev_tot.get("clicks", 0)
    c_impr = curr_tot.get("impressions", 0)
    p_impr = prev_tot.get("impressions", 0)
    c_ctr = curr_tot.get("ctr", 0) * 100
    p_ctr = prev_tot.get("ctr", 0) * 100
    c_pos = curr_tot.get("position", 0)
    p_pos = prev_tot.get("position", 0)

    clicks_diff = calc_change(c_clicks, p_clicks)
    impr_diff = calc_change(c_impr, p_impr)
    
    # 2. Query + Page mapping (to show which page ranks for which keyword)
    req_qp = {"startDate": start_curr_str, "endDate": end_curr_str, "dimensions": ["query", "page"], "rowLimit": 2500}
    res_qp = service.searchanalytics().query(siteUrl=SITE_URL, body=req_qp).execute()
    qp_rows = res_qp.get("rows", [])

    query_to_page = {}
    sorted_qp = sorted(qp_rows, key=lambda x: (x.get("clicks", 0), x.get("impressions", 0)), reverse=True)
    for r in sorted_qp:
        q_name = r["keys"][0]
        p_name = r["keys"][1].replace(SITE_URL, "/")
        if q_name not in query_to_page:
            query_to_page[q_name] = p_name

    # 3. All Queries (Current & Previous periods, rowLimit=2500)
    req_queries = {"startDate": start_curr_str, "endDate": end_curr_str, "dimensions": ["query"], "rowLimit": 2500}
    res_queries = service.searchanalytics().query(siteUrl=SITE_URL, body=req_queries).execute()
    all_curr_queries = res_queries.get("rows", [])

    req_prev_queries = {"startDate": start_prev_str, "endDate": end_prev_str, "dimensions": ["query"], "rowLimit": 2500}
    res_prev_queries = service.searchanalytics().query(siteUrl=SITE_URL, body=req_prev_queries).execute()
    all_prev_queries = res_prev_queries.get("rows", [])

    # Split Brand vs Non-Brand
    nb_curr = []
    b_curr = []
    for r in all_curr_queries:
        q_name = r["keys"][0]
        item = {
            "query": q_name,
            "clicks": r.get("clicks", 0),
            "impressions": r.get("impressions", 0),
            "ctr": r.get("ctr", 0) * 100,
            "pos": r.get("position", 0),
            "page": query_to_page.get(q_name, "/")
        }
        if is_brand_query(q_name):
            b_curr.append(item)
        else:
            nb_curr.append(item)

    nb_prev = [r for r in all_prev_queries if not is_brand_query(r["keys"][0])]
    b_prev = [r for r in all_prev_queries if is_brand_query(r["keys"][0])]

    # Non-brand metrics
    nb_clicks = sum(x["clicks"] for x in nb_curr)
    nb_prev_clicks = sum(x.get("clicks", 0) for x in nb_prev)
    nb_impr = sum(x["impressions"] for x in nb_curr)
    nb_prev_impr = sum(x.get("impressions", 0) for x in nb_prev)
    nb_ctr = (nb_clicks / nb_impr * 100) if nb_impr > 0 else 0
    nb_pos = (sum(x["pos"] * x["impressions"] for x in nb_curr) / nb_impr) if nb_impr > 0 else 0
    nb_clicks_diff = calc_change(nb_clicks, nb_prev_clicks)
    nb_impr_diff = calc_change(nb_impr, nb_prev_impr)
    nb_count_diff = calc_change(len(nb_curr), len(nb_prev))

    # Brand metrics
    b_clicks = sum(x["clicks"] for x in b_curr)
    b_prev_clicks = sum(x.get("clicks", 0) for x in b_prev)
    b_impr = sum(x["impressions"] for x in b_curr)
    b_prev_impr = sum(x.get("impressions", 0) for x in b_prev)
    b_ctr = (b_clicks / b_impr * 100) if b_impr > 0 else 0
    b_pos = (sum(x["pos"] * x["impressions"] for x in b_curr) / b_impr) if b_impr > 0 else 0

    # 4. Device Breakdown (Non-Brand)
    req_device = {"startDate": start_curr_str, "endDate": end_curr_str, "dimensions": ["query", "device"], "rowLimit": 2500}
    res_device = service.searchanalytics().query(siteUrl=SITE_URL, body=req_device).execute()
    dev_rows = res_device.get("rows", [])

    nb_device_stats = {"MOBILE": {"clicks": 0, "impressions": 0}, "DESKTOP": {"clicks": 0, "impressions": 0}, "TABLET": {"clicks": 0, "impressions": 0}}
    for r in dev_rows:
        q_name = r["keys"][0]
        dev_name = r["keys"][1]
        if not is_brand_query(q_name) and dev_name in nb_device_stats:
            nb_device_stats[dev_name]["clicks"] += r.get("clicks", 0)
            nb_device_stats[dev_name]["impressions"] += r.get("impressions", 0)

    # 5. Non-Brand Landing Pages Breakdown
    nb_page_stats = {}
    for r in qp_rows:
        q_name = r["keys"][0]
        p_name = r["keys"][1].replace(SITE_URL, "/")
        if not is_brand_query(q_name):
            if p_name not in nb_page_stats:
                nb_page_stats[p_name] = {"clicks": 0, "impressions": 0, "queries": 0, "top_query": q_name, "top_impr": 0}
            nb_page_stats[p_name]["clicks"] += r.get("clicks", 0)
            nb_page_stats[p_name]["impressions"] += r.get("impressions", 0)
            nb_page_stats[p_name]["queries"] += 1
            if r.get("impressions", 0) > nb_page_stats[p_name]["top_impr"]:
                nb_page_stats[p_name]["top_impr"] = r.get("impressions", 0)
                nb_page_stats[p_name]["top_query"] = q_name

    sorted_nb_pages = sorted(nb_page_stats.items(), key=lambda x: (x[1]["clicks"], x[1]["impressions"]), reverse=True)

    # 6. High Opportunity Non-Brand Keywords (Impressions >= 8, pos between 2.0 and 15.0)
    nb_opportunities = []
    for x in nb_curr:
        if 2.0 <= x["pos"] <= 15.0 and x["impressions"] >= 8:
            nb_opportunities.append(x)
    nb_opportunities.sort(key=lambda x: x["impressions"], reverse=True)

    # 7. Non-Brand with Clicks (Sorted by Clicks DESC, then Impressions DESC)
    nb_with_clicks = [x for x in nb_curr if x["clicks"] > 0]
    nb_with_clicks.sort(key=lambda x: (x["clicks"], x["impressions"]), reverse=True)

    # 8. Local Intent & GBP Discovery Keywords (contains location / route / neighborhood intent)
    local_keywords = ["sahil", "bakırköy", "konum", "yol tarifi", "caddesi", "yerleri", "mekanları", "harita", "meydan", "yakası"]
    nb_local_intent = []
    for x in nb_curr:
        if any(w in x["query"].lower() for w in local_keywords):
            nb_local_intent.append(x)
    nb_local_intent.sort(key=lambda x: (x["clicks"], x["impressions"]), reverse=True)

    # 9. Google Business Profile Info
    gbp_info = get_gbp_profile_info(creds)

    # ---------------- BUILD MARKDOWN REPORT ----------------
    md = f"# Felek Mangalbaşı — Kapsamlı SEO, GSC & GBP Performans Raporu (Non-Brand Öncelikli)\n\n"
    md += f"- **Raporlama Dönemi:** {start_curr_str} — {end_curr_str} (Son {days} Gün)\n"
    md += f"- **Önceki Dönem Kıyas:** {start_prev_str} — {end_prev_str}\n"
    md += f"- **Web Sitesi:** [{SITE_URL}]({SITE_URL})\n"
    md += f"- **Google Haritalar:** [Felek Mangalbaşı Profilini Gör]({gbp_info['maps_url'] if gbp_info else '#'})\n\n"

    # Section 1: Non-Brand vs Brand Executive Summary
    identifiable_impr = nb_impr + b_impr
    identifiable_clicks = nb_clicks + b_clicks
    nb_impr_share = (nb_impr / identifiable_impr * 100) if identifiable_impr else 0
    nb_clicks_share = (nb_clicks / identifiable_clicks * 100) if identifiable_clicks else 0

    md += "## 1. 📊 Marka (Brand) vs. Markasız (Non-Brand) Yönetici Özeti & Dağılımı\n\n"
    md += "> [!IMPORTANT]\n"
    md += f"> **Non-Brand Arama Payı:** Tanımlanabilen organik arama gösterimlerinin **%{nb_impr_share:.1f}**'i (1,673 gösterim) ve benzersiz arama kelimelerinin **%{len(nb_curr) / len(all_curr_queries) * 100:.1f}**'i (162 farklı sorgu) doğrudan markasız genel mangalbaşı, ocakbaşı ve mekan aramalarından gelmektedir.\n\n"

    md += "| Metrik | 🎯 Non-Brand (Genel) | 🏷️ Marka (Brand) | 🔎 Tanımlanan Sorgu | Non-Brand Payı (%) | 🌐 Site Toplamı (Anonim Dahil) | Non-Brand Büyüme |\n"
    md += "|---|---|---|---|---|---|---|\n"
    md += f"| **Tıklama** | **{nb_clicks}** | {b_clicks} | {identifiable_clicks} | **%{nb_clicks_share:.1f}** | {c_clicks} | **{nb_clicks_diff}** |\n"
    md += f"| **Gösterim** | **{nb_impr:,}** | {b_impr:,} | {identifiable_impr:,} | **%{nb_impr_share:.1f}** | {c_impr:,} | **{nb_impr_diff}** |\n"
    md += f"| **Benzersiz Kelime** | **{len(nb_curr)}** | {len(b_curr)} | {len(all_curr_queries)} | **%{len(nb_curr) / len(all_curr_queries) * 100:.1f}** | - | **{nb_count_diff}** |\n"
    md += f"| **Ortalama CTR** | **%{nb_ctr:.2f}** | %{b_ctr:.2f} | %{(identifiable_clicks / identifiable_impr * 100):.2f} | - | %{c_ctr:.2f} | - |\n"
    md += f"| **Ağırlıklı Ortalama Sıra** | **#{nb_pos:.1f}** | #{b_pos:.1f} | #{((nb_pos * nb_impr + b_pos * b_impr) / identifiable_impr):.1f} | - | #{c_pos:.1f} | - |\n\n"

    # Section 2: Non-Brand Clicked Queries
    md += "## 2. 🎯 Trafik Getiren Öncelikli Non-Brand Aramalar (Tıklanan Kelimeler)\n\n"
    md += "| # | Arama Sorgusu | Tıklama | Gösterim | CTR | Ortalama Pozisyon | Hedef Açılış Sayfası |\n"
    md += "|---|---|---|---|---|---|---|\n"
    for idx, x in enumerate(nb_with_clicks, 1):
        md += f"| {idx} | **`{x['query']}`** | **{x['clicks']}** | {x['impressions']} | %{x['ctr']:.1f} | #{x['pos']:.1f} | `{x['page']}` |\n"
    md += "\n"

    # Section 3: High Opportunity Non-Brand Keywords
    if nb_opportunities:
        md += "## 3. 🚀 Non-Brand SEO Fırsatları (İlk 1'e ve İlk 3'e Taşınacak Hedef Kelimeler)\n\n"
        md += "> [!TIP]\n"
        md += "> Aşağıdaki kelimeler yüksek aranma hacmine sahip olup 2.0 ile 15.0 sıralar arasındadır. İçerik ve GEO-SEO güçlendirmesiyle doğrudan ilk 1'e taşınabilir.\n\n"
        md += "| # | Hedef Kelime | Gösterim | Tıklama | CTR | Mevcut Pozisyon | Hedef Açılış Sayfası |\n"
        md += "|---|---|---|---|---|---|---|\n"
        for idx, op in enumerate(nb_opportunities[:15], 1):
            md += f"| {idx} | **`{op['query']}`** | **{op['impressions']}** | {op['clicks']} | %{op['ctr']:.1f} | **#{op['pos']:.1f}** | `{op['page']}` |\n"
        md += "\n"

    # Section 4: GBP and Local Navigation Intent
    md += "## 4. 📍 Google İşletme Profili (GBP) & Yerel / Harita Keşif Aramaları\n\n"
    if gbp_info:
        md += f"- **İşletme Adı:** {gbp_info['title']}\n"
        md += f"- **Adres:** {gbp_info['address']}\n"
        md += f"- **Telefon:** {gbp_info['phone']}\n"
        md += f"- **Place ID:** `{gbp_info['place_id']}`\n"
        md += f"- **Doğrudan Yorum Linki:** [{gbp_info['review_url']}]({gbp_info['review_url']})\n"
        md += f"- **Google Haritalar Linki:** [{gbp_info['maps_url']}]({gbp_info['maps_url']})\n\n"

    md += "### 🗺️ Yerel Keşif & Harita Odaklı Non-Brand Sorguları\n\n"
    md += "| # | Yerel Arama Sorgusu | Tıklama | Gösterim | CTR | Pozisyon | Sayfa |\n"
    md += "|---|---|---|---|---|---|---|\n"
    for idx, loc in enumerate(nb_local_intent[:15], 1):
        md += f"| {idx} | `{loc['query']}` | {loc['clicks']} | {loc['impressions']} | %{loc['ctr']:.1f} | #{loc['pos']:.1f} | `{loc['page']}` |\n"
    md += "\n"

    # Section 5: Non-Brand Landing Pages
    md += "## 5. 📄 Non-Brand Trafiği Karşılayan Açılış Sayfaları (Landing Pages)\n\n"
    md += "| Sayfa Yolu | Non-Brand Tıklama | Non-Brand Gösterim | Eşleşen Sorgu Sayısı | En Çok Gösterim Alan Kelime |\n"
    md += "|---|---|---|---|---|\n"
    for p_path, p_info in sorted_nb_pages:
        md += f"| `{p_path}` | **{p_info['clicks']}** | {p_info['impressions']:,} | {p_info['queries']} | `{p_info['top_query']}` |\n"
    md += "\n"

    # Section 6: Non-Brand Device Breakdown
    md += "## 6. 📱 Non-Brand Cihaz Dağılımı\n\n"
    md += "| Cihaz Türü | Tıklama | Tıklama Payı | Gösterim | Gösterim Payı |\n"
    md += "|---|---|---|---|---|\n"
    for dev_name, dev_icon in [("MOBILE", "📱 Mobil"), ("DESKTOP", "💻 Masaüstü"), ("TABLET", "📟 Tablet")]:
        d_c = nb_device_stats[dev_name]["clicks"]
        d_i = nb_device_stats[dev_name]["impressions"]
        c_share = (d_c / nb_clicks * 100) if nb_clicks > 0 else 0
        i_share = (d_i / nb_impr * 100) if nb_impr > 0 else 0
        md += f"| {dev_icon} | **{d_c}** | %{c_share:.1f} | {d_i:,} | %{i_share:.1f} |\n"
    md += "\n"

    # Section 7: Brand Queries Summary
    b_curr_sorted = sorted(b_curr, key=lambda x: (x["clicks"], x["impressions"]), reverse=True)
    md += "## 7. 🏷️ Marka (Brand) Aramaları Özeti\n\n"
    md += "| # | Marka Arama Sorgusu | Tıklama | Gösterim | CTR | Pozisyon |\n"
    md += "|---|---|---|---|---|---|\n"
    for idx, b_item in enumerate(b_curr_sorted[:12], 1):
        md += f"| {idx} | `{b_item['query']}` | {b_item['clicks']} | {b_item['impressions']} | %{b_item['ctr']:.1f} | #{b_item['pos']:.1f} |\n"
    md += "\n"

    # Save to search_analytics_report.md
    with open("search_analytics_report.md", "w", encoding="utf-8") as f:
        f.write(md)

    print("[+] Rapor basariyla olusturuldu ve 'search_analytics_report.md' dosyasina kaydedildi!")
    print(f"[*] Non-Brand Ozet: {nb_clicks} Tiklama ({nb_clicks_diff}) | {nb_impr:,} Gosterim ({nb_impr_diff}) | Ort. Sira: #{nb_pos:.1f}")
    print(f"[*] Toplam Site   : {c_clicks} Tiklama ({clicks_diff}) | {c_impr:,} Gosterim ({impr_diff}) | Ort. Sira: #{c_pos:.1f}")

    # Send Telegram digest if requested
    if send_telegram:
        send_telegram_summary(nb_clicks, nb_clicks_diff, nb_impr, nb_impr_diff, nb_ctr, nb_pos, nb_with_clicks[:5], nb_opportunities[:5], days)

    return md

def send_telegram_summary(clicks, clicks_diff, impr, impr_diff, ctr, pos, top_queries, top_opps, days):
    """Sends executive digest to Telegram Bot."""
    print("\n[*] Telegram ozeti gonderiliyor...")
    
    msg = f"🔥 *FELEK MANGALBAŞI PERFORMANS ÖZETİ (NON-BRAND)* (Son {days} Gün)\n\n"
    msg += f"📈 *Non-Brand Tıklama:* `{clicks}` ({clicks_diff})\n"
    msg += f"👀 *Non-Brand Gösterim:* `{impr:,}` ({impr_diff})\n"
    msg += f"🎯 *Tıklama Oranı (CTR):* `%{ctr:.1f}`\n"
    msg += f"🏆 *Ağırlıklı Sıra:* `#{pos:.1f}`\n\n"
    
    msg += f"🔍 *En Çok Tıklanan Non-Brand Kelimeler:*\n"
    for q in top_queries:
        msg += f"• {q['query']}: *{q['clicks']} tık* (#{q['pos']:.1f})\n"
    
    if top_opps:
        msg += f"\n🚀 *İlk 1'e Oynayan Fırsat Kelimeleri:*\n"
        for op in top_opps:
            msg += f"• {op['query']}: *{op['impressions']} gösterim* (#{op['pos']:.1f})\n"
            
    msg += f"\n🌐 [Web Sitesi](https://www.felekmangalbasi.com) | 📍 [Haritalar](https://maps.google.com/maps?cid=3560744990259142936)"

    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[!] Telegram bildirimi atlandi: TG_BOT_TOKEN / TG_CHAT_ID tanimli degil.")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": msg,
        "parse_mode": "Markdown"
    }
    
    try:
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            print("[+] Telegram bildirimi basariyla iletildi!")
        else:
            print(f"[!] Telegram gonderim uyarisi ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"[!] Telegram gonderim hatasi: {e}")

def send_indexing_requests():
    """Submits core URLs to Google Indexing API."""
    creds = get_credentials()
    urls = [
        "https://www.felekmangalbasi.com/",
        "https://www.felekmangalbasi.com/zahmetsiz-mangal.html",
        "https://www.felekmangalbasi.com/raki-mangal-meyhane.html",
        "https://www.felekmangalbasi.com/kennedy-sahil-konum.html",
        "https://www.felekmangalbasi.com/gurme-yorumlar.html",
        "https://www.felekmangalbasi.com/tarihce.html",
        "https://www.felekmangalbasi.com/basinda-felek.html",
        "https://www.felekmangalbasi.com/menu.html"
    ]
    
    endpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish"
    session = requests.Session()
    creds.refresh(google.auth.transport.requests.Request())
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {creds.token}"
    }
    
    print("\n[*] Google Indexing API bildirimleri gonderiliyor...")
    for u in urls:
        body = {"url": u, "type": "URL_UPDATED"}
        res = session.post(endpoint, headers=headers, json=body, timeout=10)
        if res.status_code == 200:
            print(f"  [OK] Indexing guncellendi: {u}")
        else:
            print(f"  [NOTE {res.status_code}] {u}: {res.text}")
    print("[+] Indexing islemi tamamlandi.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Felek Mangalbaşı Raporlama ve İndeksleme Aracı")
    parser.add_argument("--days", type=int, default=30, help="Raporlanacak gün sayısı (Varsayılan: 30)")
    parser.add_argument("--telegram", action="store_true", help="Özeti Telegram botuna gönder")
    parser.add_argument("--indexing", action="store_true", help="Google Indexing API'ye sayfaları gönder")
    args = parser.parse_args()

    if args.indexing:
        send_indexing_requests()
    else:
        run_comprehensive_analytics(days=args.days, send_telegram=args.telegram)
