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
TELEGRAM_BOT_TOKEN = "8721886347:AAHWTqfUt9AnfJbmIZGeQVkltIrSQ9bo6O4"
TELEGRAM_CHAT_ID = "1585282829"
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
    print(f"[*] FELEK MANGALBASI VERI & PERFORMANS RAPORU")
    print(f"Donem: {start_curr_str} — {end_curr_str} (Son {days} Gun)")
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
    
    # 2. Device Breakdown
    req_device = {"startDate": start_curr_str, "endDate": end_curr_str, "dimensions": ["device"]}
    res_device = service.searchanalytics().query(siteUrl=SITE_URL, body=req_device).execute()
    devices = res_device.get("rows", [])

    # 3. Queries (Top 50)
    req_queries = {"startDate": start_curr_str, "endDate": end_curr_str, "dimensions": ["query"], "rowLimit": 50}
    res_queries = service.searchanalytics().query(siteUrl=SITE_URL, body=req_queries).execute()
    queries = res_queries.get("rows", [])

    # 4. Landing Pages (Top 20)
    req_pages = {"startDate": start_curr_str, "endDate": end_curr_str, "dimensions": ["page"], "rowLimit": 20}
    res_pages = service.searchanalytics().query(siteUrl=SITE_URL, body=req_pages).execute()
    pages = res_pages.get("rows", [])

    # 5. Google Business Profile Info
    gbp_info = get_gbp_profile_info(creds)

    # 6. High Opportunity Keyword Analysis (Rank #3 - #15 with impressions)
    opportunities = []
    for q in queries:
        q_name = q["keys"][0]
        q_clicks = q.get("clicks", 0)
        q_impr = q.get("impressions", 0)
        q_ctr = q.get("ctr", 0) * 100
        q_pos = q.get("position", 0)
        if 2.5 <= q_pos <= 15.0 and q_impr >= 5:
            opportunities.append({
                "query": q_name,
                "clicks": q_clicks,
                "impressions": q_impr,
                "ctr": f"{q_ctr:.1f}%",
                "pos": f"#{q_pos:.1f}"
            })

    # Sort opportunities by impressions descending
    opportunities.sort(key=lambda x: x["impressions"], reverse=True)

    # ---------------- BUILD MARKDOWN REPORT ----------------
    md = f"# Felek Mangalbaşı — Kapsamlı SEO & İşletme Performans Raporu\n\n"
    md += f"- **Raporlama Dönemi:** {start_curr_str} — {end_curr_str} (Son {days} Gün)\n"
    md += f"- **Önceki Dönem Kıyas:** {start_prev_str} — {end_prev_str}\n"
    md += f"- **Web Sitesi:** [{SITE_URL}]({SITE_URL})\n"
    md += f"- **Google Haritalar:** [Felek Mangalbaşı Profilini Gör]({gbp_info['maps_url'] if gbp_info else '#'})\n\n"

    md += "## 1. 📈 Yönetici Özeti ve Büyüme Metrikleri\n\n"
    md += f"| Metrik | Son {days} Gün | Önceki {days} Gün | Değişim / Büyüme |\n"
    md += "|---|---|---|---|\n"
    md += f"| **Toplam Tıklama** | **{c_clicks}** | {p_clicks} | **{clicks_diff}** |\n"
    md += f"| **Toplam Gösterim** | **{c_impr:,}** | {p_impr:,} | **{impr_diff}** |\n"
    md += f"| **Ortalama CTR (Tıklama Oranı)** | **%{c_ctr:.2f}** | %{p_ctr:.2f} | {c_ctr - p_ctr:+.2f}% puan |\n"
    md += f"| **Ortalama Arama Pozisyonu** | **#{c_pos:.1f}** | #{p_pos:.1f} | {'İyileşti' if c_pos < p_pos else 'Stabil'} |\n\n"

    md += "## 2. 📱 Cihaz Dağılımı\n\n"
    md += "| Cihaz Türü | Tıklama | Tıklama Payı | Gösterim | CTR | Ortalama Sıra |\n"
    md += "|---|---|---|---|---|---|\n"
    for d in devices:
        dev_name = d["keys"][0]
        dev_clicks = d.get("clicks", 0)
        dev_impr = d.get("impressions", 0)
        dev_share = (dev_clicks / c_clicks * 100) if c_clicks > 0 else 0
        dev_ctr = d.get("ctr", 0) * 100
        dev_pos = d.get("position", 0)
        icon = "📱" if dev_name == "MOBILE" else ("💻" if dev_name == "DESKTOP" else "📟")
        md += f"| {icon} {dev_name} | {dev_clicks} | %{dev_share:.1f} | {dev_impr:,} | %{dev_ctr:.1f} | #{dev_pos:.1f} |\n"
    md += "\n"

    if opportunities:
        md += "## 3. 🎯 SEO Büyüme Fırsatları (İlk 1'e Taşınabilecek Hedef Kelimeler)\n\n"
        md += "> [!TIP]\n"
        md += "> Aşağıdaki kelimeler yüksek gösterim alıp şu anda 3. ile 15. sıralar arasındadır. Sayfa içi içerik ve backlink ile kolayca 1. sıraya taşınabilir.\n\n"
        md += "| Arama Kelimesi | Gösterim | Tıklama | CTR | Mevcut Pozisyon |\n"
        md += "|---|---|---|---|---|\n"
        for op in opportunities[:10]:
            md += f"| **`{op['query']}`** | {op['impressions']} | {op['clicks']} | {op['ctr']} | {op['pos']} |\n"
        md += "\n"

    md += "## 4. 🔍 En Çok Tıklanan İlk 50 Arama Sorgusu\n\n"
    md += "| # | Arama Sorgusu | Tıklama | Gösterim | CTR | Ortalama Pozisyon |\n"
    md += "|---|---|---|---|---|---|\n"
    for idx, q in enumerate(queries, 1):
        q_name = q["keys"][0]
        q_clicks = q.get("clicks", 0)
        q_impr = q.get("impressions", 0)
        q_ctr = f"{q.get('ctr', 0) * 100:.1f}%"
        q_pos = f"#{q.get('position', 0):.1f}"
        md += f"| {idx} | `{q_name}` | {q_clicks} | {q_impr} | {q_ctr} | {q_pos} |\n"
    md += "\n"

    md += "## 5. 📄 En Çok Ziyaret Edilen Sayfalar (Landing Pages)\n\n"
    md += "| Sayfa Yolu | Tıklama | Gösterim | CTR | Pozisyon |\n"
    md += "|---|---|---|---|---|\n"
    for p in pages:
        p_url = p["keys"][0].replace(SITE_URL, "/")
        p_clicks = p.get("clicks", 0)
        p_impr = p.get("impressions", 0)
        p_ctr = f"{p.get('ctr', 0) * 100:.1f}%"
        p_pos = f"#{p.get('position', 0):.1f}"
        md += f"| `{p_url}` | {p_clicks} | {p_impr} | {p_ctr} | {p_pos} |\n"
    md += "\n"

    if gbp_info:
        md += "## 6. 📍 Google İşletme Profili (Harita Bilgileri)\n\n"
        md += f"- **İşletme Adı:** {gbp_info['title']}\n"
        md += f"- **Adres:** {gbp_info['address']}\n"
        md += f"- **Telefon:** {gbp_info['phone']}\n"
        md += f"- **Place ID:** `{gbp_info['place_id']}`\n"
        md += f"- **Doğrudan Yorum Linki:** [{gbp_info['review_url']}]({gbp_info['review_url']})\n"
        md += f"- **Google Haritalar Linki:** [{gbp_info['maps_url']}]({gbp_info['maps_url']})\n\n"

    # Save to search_analytics_report.md
    with open("search_analytics_report.md", "w", encoding="utf-8") as f:
        f.write(md)

    print("[+] Rapor basariyla olusturuldu ve 'search_analytics_report.md' dosyasina kaydedildi!")
    print(f"[*] Ozet: {c_clicks} Tiklama ({clicks_diff}) | {c_impr:,} Gosterim ({impr_diff}) | Ort. Pozisyon: #{c_pos:.1f}")

    # Send Telegram digest if requested
    if send_telegram:
        send_telegram_summary(c_clicks, clicks_diff, c_impr, impr_diff, c_ctr, c_pos, queries[:5], opportunities[:5], days)

    return md

def send_telegram_summary(clicks, clicks_diff, impr, impr_diff, ctr, pos, top_queries, top_opps, days):
    """Sends executive digest to Telegram Bot."""
    print("\n[*] Telegram ozeti gonderiliyor...")
    
    msg = f"🔥 *FELEK MANGALBAŞI PERFORMANS ÖZETİ* (Son {days} Gün)\n\n"
    msg += f"📈 *Tıklama:* `{clicks}` ({clicks_diff})\n"
    msg += f"👀 *Gösterim:* `{impr:,}` ({impr_diff})\n"
    msg += f"🎯 *Tıklama Oranı (CTR):* `%{ctr:.1f}`\n"
    msg += f"🏆 *Ort. Pozisyon:* `#{pos:.1f}`\n\n"
    
    msg += f"🔍 *En Çok Tıklanan Kelimeler:*\n"
    for q in top_queries:
        msg += f"• {q['keys'][0]}: *{q.get('clicks', 0)} tık* (#{q.get('position', 0):.1f})\n"
    
    if top_opps:
        msg += f"\n🚀 *1. Sıraya Oynayan Fırsat Kelimeleri:*\n"
        for op in top_opps:
            msg += f"• {op['query']}: *{op['impressions']} gösterim* ({op['pos']})\n"
            
    msg += f"\n🌐 [Web Sitesi](https://www.felekmangalbasi.com) | 📍 [Haritalar](https://maps.google.com/maps?cid=3560744990259142936)"

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
