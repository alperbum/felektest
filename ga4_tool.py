"""
Felek Mangalbaşı — Google Analytics 4 (GA4) Reporting Tool
Fetches live metrics, traffic acquisition, top pages, events/conversions,
city & device distributions from GA4 Property 534404937.

Usage:
    python ga4_tool.py                  # Generates 30-day GA4 analytics report
    python ga4_tool.py --days 14        # Generates 14-day GA4 analytics report
    python ga4_tool.py --realtime       # Shows active users in the last 30 minutes
    python ga4_tool.py --telegram       # Dispatches summary to Telegram bot
"""

import os
import sys
import json
import argparse
import datetime
import requests
from google.oauth2 import service_account
import google.auth.transport.requests

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Configuration
KEY_FILE = "service_account.json"
PROPERTY_ID = "534404937"
TELEGRAM_BOT_TOKEN = "8721886347:AAHWTqfUt9AnfJbmIZGeQVkltIrSQ9bo6O4"
TELEGRAM_CHAT_ID = "1585282829"

SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

def get_headers():
    if not os.path.exists(KEY_FILE):
        raise FileNotFoundError(f"Service account dosyası '{KEY_FILE}' bulunamadı.")
    creds = service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    return {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json"
    }

def run_report(headers, body):
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport"
    res = requests.post(url, headers=headers, json=body, timeout=20)
    if res.status_code != 200:
        raise Exception(f"GA4 API Hatası ({res.status_code}): {res.text}")
    return res.json()

def run_realtime(headers):
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runRealtimeReport"
    body = {
        "dimensions": [{"name": "unifiedScreenName"}, {"name": "city"}],
        "metrics": [{"name": "activeUsers"}]
    }
    res = requests.post(url, headers=headers, json=body, timeout=15)
    if res.status_code != 200:
        raise Exception(f"GA4 Realtime API Hatası ({res.status_code}): {res.text}")
    return res.json()

def calc_change(current, previous):
    if previous == 0:
        return "+100%" if current > 0 else "0%"
    diff = ((current - previous) / previous) * 100
    sign = "+" if diff > 0 else ""
    return f"{sign}{diff:.1f}%"

def format_duration(seconds):
    try:
        sec = float(seconds)
        mins = int(sec // 60)
        rem_sec = int(sec % 60)
        return f"{mins}dk {rem_sec}sn" if mins > 0 else f"{rem_sec}sn"
    except (ValueError, TypeError):
        return "0sn"

def fetch_analytics(days=30, send_telegram=False):
    headers = get_headers()

    end_curr = datetime.date.today() - datetime.timedelta(days=1)
    start_curr = end_curr - datetime.timedelta(days=days - 1)
    
    end_prev = start_curr - datetime.timedelta(days=1)
    start_prev = end_prev - datetime.timedelta(days=days - 1)

    start_curr_str = start_curr.strftime("%Y-%m-%d")
    end_curr_str = end_curr.strftime("%Y-%m-%d")
    start_prev_str = start_prev.strftime("%Y-%m-%d")
    end_prev_str = end_prev.strftime("%Y-%m-%d")

    print(f"\n=======================================================")
    print(f"[*] FELEK MANGALBASI — GA4 ANALITIK RAPORU")
    print(f"Mulk ID: {PROPERTY_ID}")
    print(f"Guncel Donem: {start_curr_str} — {end_curr_str} (Son {days} Gun)")
    print(f"Onceki Donem: {start_prev_str} — {end_prev_str}")
    print(f"=======================================================\n")

    # 1. Genel Metrikler (Karsilastirmali)
    metrics_list = [
        {"name": "activeUsers"},
        {"name": "newUsers"},
        {"name": "sessions"},
        {"name": "screenPageViews"},
        {"name": "averageSessionDuration"},
        {"name": "engagementRate"}
    ]

    curr_res = run_report(headers, {
        "dateRanges": [{"startDate": start_curr_str, "endDate": end_curr_str}],
        "metrics": metrics_list
    })
    prev_res = run_report(headers, {
        "dateRanges": [{"startDate": start_prev_str, "endDate": end_prev_str}],
        "metrics": metrics_list
    })

    c_vals = [float(v["value"]) for v in curr_res.get("rows", [{}])[0].get("metricValues", [{"value": 0}] * 6)] if curr_res.get("rows") else [0.0]*6
    p_vals = [float(v["value"]) for v in prev_res.get("rows", [{}])[0].get("metricValues", [{"value": 0}] * 6)] if prev_res.get("rows") else [0.0]*6

    c_active, c_new, c_sess, c_views, c_dur, c_eng = c_vals
    p_active, p_new, p_sess, p_views, p_dur, p_eng = p_vals

    print("--- 1. GENEL OZET & DEGISIM ---")
    print(f"Aktif Kullanici  : {int(c_active):<6} (Onceki: {int(p_active):<6} | Fark: {calc_change(c_active, p_active)})")
    print(f"Yeni Kullanici   : {int(c_new):<6} (Onceki: {int(p_new):<6} | Fark: {calc_change(c_new, p_new)})")
    print(f"Toplam Oturum    : {int(c_sess):<6} (Onceki: {int(p_sess):<6} | Fark: {calc_change(c_sess, p_sess)})")
    print(f"Sayfa Goruntuleme: {int(c_views):<6} (Onceki: {int(p_views):<6} | Fark: {calc_change(c_views, p_views)})")
    print(f"Ortalama Sure    : {format_duration(c_dur):<6} (Onceki: {format_duration(p_dur)})")
    print(f"Etkilesim Orani  : %{c_eng*100:.1f} (Onceki: %{p_eng*100:.1f})")

    # 2. Trafik Kanallari & Kaynaklar
    channels_res = run_report(headers, {
        "dateRanges": [{"startDate": start_curr_str, "endDate": end_curr_str}],
        "dimensions": [{"name": "sessionDefaultChannelGroup"}, {"name": "sessionSourceMedium"}],
        "metrics": [{"name": "sessions"}, {"name": "activeUsers"}, {"name": "engagementRate"}],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": 10
    })

    print("\n--- 2. TRAFIK KANALLARI (ILK 10) ---")
    print(f"{'Kanal / Kaynak':<35} | {'Oturum':<8} | {'Kullanici':<10} | {'Etkilesim':<10}")
    print("-" * 72)
    channels_data = []
    for r in channels_res.get("rows", []):
        chan = r["dimensionValues"][0]["value"]
        src = r["dimensionValues"][1]["value"]
        label = f"{chan} ({src})"[:34]
        sess = int(r["metricValues"][0]["value"])
        usr = int(r["metricValues"][1]["value"])
        eng = float(r["metricValues"][2]["value"]) * 100
        channels_data.append((label, sess, usr, eng))
        print(f"{label:<35} | {sess:<8} | {usr:<10} | %{eng:<9.1f}")

    # 3. En Cok Ziyaret Edilen Sayfalar
    pages_res = run_report(headers, {
        "dateRanges": [{"startDate": start_curr_str, "endDate": end_curr_str}],
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}, {"name": "activeUsers"}, {"name": "averageSessionDuration"}],
        "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
        "limit": 10
    })

    print("\n--- 3. EN COK ZIYARET EDILEN SAYFALAR (ILK 10) ---")
    print(f"{'Sayfa Yolu':<30} | {'Goruntulenme':<14} | {'Kullanici':<10} | {'Ort. Sure':<10}")
    print("-" * 72)
    pages_data = []
    for r in pages_res.get("rows", []):
        path = r["dimensionValues"][0]["value"][:29]
        views = int(r["metricValues"][0]["value"])
        usr = int(r["metricValues"][1]["value"])
        dur = format_duration(r["metricValues"][2]["value"])
        pages_data.append((path, views, usr, dur))
        print(f"{path:<30} | {views:<14} | {usr:<10} | {dur:<10}")

    # 4. Onemli Etkilesimler ve Donusumler (Events)
    events_res = run_report(headers, {
        "dateRanges": [{"startDate": start_curr_str, "endDate": end_curr_str}],
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}, {"name": "totalUsers"}],
        "orderBys": [{"metric": {"metricName": "eventCount"}, "desc": True}],
        "limit": 15
    })

    print("\n--- 4. ETKINLIKLER & DONUSUMLER ---")
    print(f"{'Etkinlik Adi':<32} | {'Toplam Tetiklenme':<18} | {'Kullanici':<10}")
    print("-" * 66)
    events_data = []
    for r in events_res.get("rows", []):
        evt = r["dimensionValues"][0]["value"]
        cnt = int(r["metricValues"][0]["value"])
        usr = int(r["metricValues"][1]["value"])
        events_data.append((evt, cnt, usr))
        print(f"{evt:<32} | {cnt:<18} | {usr:<10}")

    # 5. Sehir & Cihaz Dagilimi
    geo_res = run_report(headers, {
        "dateRanges": [{"startDate": start_curr_str, "endDate": end_curr_str}],
        "dimensions": [{"name": "city"}, {"name": "deviceCategory"}],
        "metrics": [{"name": "activeUsers"}, {"name": "sessions"}],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": 8
    })

    print("\n--- 5. SEHIR & CIHAZ DAGILIMI ---")
    print(f"{'Sehir':<20} | {'Cihaz':<10} | {'Kullanici':<10} | {'Oturum':<8}")
    print("-" * 56)
    geo_data = []
    for r in geo_res.get("rows", []):
        city = r["dimensionValues"][0]["value"] or "Bilinmiyor"
        dev = r["dimensionValues"][1]["value"]
        usr = int(r["metricValues"][0]["value"])
        sess = int(r["metricValues"][1]["value"])
        geo_data.append((city, dev, usr, sess))
        print(f"{city:<20} | {dev:<10} | {usr:<10} | {sess:<8}")

    # Markdown Raporunu Kaydet
    report_md_path = "ga4_analytics_report.md"
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(f"# Felek Mangalbaşı — GA4 Analitik & Kullanıcı Davranış Raporu\n\n")
        f.write(f"> **Mülk ID:** `{PROPERTY_ID}` | **Ölçüm ID:** `G-E3588HSCF5`  \n")
        f.write(f"> **Tarih Aralığı:** {start_curr_str} — {end_curr_str} ({days} Gün) | **Oluşturulma:** {datetime.datetime.now().strftime('%d.%m.%Y %H:%M')}\n\n")

        f.write("## 1. Temel Performans Özeti (Önceki Dönem Kıyaslamalı)\n\n")
        f.write("| Metrik | Güncel Dönem | Önceki Dönem | Değişim |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        f.write(f"| **Aktif Kullanıcı** | {int(c_active)} | {int(p_active)} | **{calc_change(c_active, p_active)}** |\n")
        f.write(f"| **Yeni Kullanıcı** | {int(c_new)} | {int(p_new)} | **{calc_change(c_new, p_new)}** |\n")
        f.write(f"| **Toplam Oturum** | {int(c_sess)} | {int(p_sess)} | **{calc_change(c_sess, p_sess)}** |\n")
        f.write(f"| **Sayfa Görüntüleme** | {int(c_views)} | {int(p_views)} | **{calc_change(c_views, p_views)}** |\n")
        f.write(f"| **Ortalama Oturum Süresi** | {format_duration(c_dur)} | {format_duration(p_dur)} | - |\n")
        f.write(f"| **Etkileşim Oranı** | %{c_eng*100:.1f} | %{p_eng*100:.1f} | - |\n\n")

        f.write("## 2. Ziyaretçi Kaynakları & Kanallar\n\n")
        f.write("| Kanal / Kaynak | Oturum | Kullanıcı | Etkileşim Oranı |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for chan, sess, usr, eng in channels_data:
            f.write(f"| {chan} | {sess} | {usr} | %{eng:.1f} |\n")
        f.write("\n")

        f.write("## 3. En Popüler Sayfalar\n\n")
        f.write("| Sayfa | Görüntülenme | Tekil Kullanıcı | Ort. Süre |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for path, views, usr, dur in pages_data:
            f.write(f"| `{path}` | {views} | {usr} | {dur} |\n")
        f.write("\n")

        f.write("## 4. Kullanıcı Etkileşimleri & Dönüşümler\n\n")
        f.write("| Etkinlik | Tetiklenme | Kullanıcı |\n")
        f.write("| :--- | :--- | :--- |\n")
        for evt, cnt, usr in events_data:
            f.write(f"| `{evt}` | {cnt} | {usr} |\n")
        f.write("\n")

        f.write("## 5. Şehir ve Cihaz Dağılımı\n\n")
        f.write("| Şehir | Cihaz Türü | Kullanıcı | Oturum |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for city, dev, usr, sess in geo_data:
            f.write(f"| {city} | {dev} | {usr} | {sess} |\n")
        f.write("\n")

    print(f"\n[+] GA4 Raporu basariyla kaydedildi: {report_md_path}")

    # Telegram Özeti Gönderimi
    if send_telegram:
        msg = (
            f"📊 *FELEK MANGALBAŞI — GA4 ANALİTİK ÖZETİ*\n"
            f"📅 *Dönem:* Son {days} Gün ({start_curr_str} - {end_curr_str})\n\n"
            f"👤 *Aktif Kullanıcı:* {int(c_active)} ({calc_change(c_active, p_active)})\n"
            f"🔄 *Toplam Oturum:* {int(c_sess)} ({calc_change(c_sess, p_sess)})\n"
            f"👀 *Sayfa Görüntüleme:* {int(c_views)} ({calc_change(c_views, p_views)})\n"
            f"⏱ *Ortalama Süre:* {format_duration(c_dur)}\n"
            f"🎯 *Etkileşim Oranı:* %{c_eng*100:.1f}\n\n"
            f"📍 *En Çok Gezilen Sayfalar:*\n"
        )
        for path, views, _, _ in pages_data[:4]:
            msg += f"• `{path}`: {views} gösterim\n"

        msg += f"\n🚦 *Öne Çıkan Trafik Kanalları:*\n"
        for chan, sess, _, _ in channels_data[:3]:
            msg += f"• {chan}: {sess} oturum\n"

        t_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        t_res = requests.post(t_url, json={"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "Markdown"}, timeout=10)
        if t_res.status_code == 200:
            print("[+] Telegram bildirimi basariyla gonderildi!")
        else:
            print(f"[-] Telegram gonderim hatasi: {t_res.text}")

def fetch_realtime():
    headers = get_headers()
    print(f"\n=======================================================")
    print(f"[*] FELEK MANGALBASI — GA4 CANLI (REALTIME) VERILER")
    print(f"Mulk ID: {PROPERTY_ID}")
    print(f"Zaman: {datetime.datetime.now().strftime('%d.%m.%Y %H:%M:%S')}")
    print(f"=======================================================\n")

    data = run_realtime(headers)
    rows = data.get("rows", [])
    total_active = sum(int(r["metricValues"][0]["value"]) for r in rows) if rows else 0

    print(f"⚡ Son 30 Dakikada Aktif Ziyaretçi: {total_active}\n")
    if rows:
        print(f"{'Ekran / Sayfa':<35} | {'Sehir':<20} | {'Aktif Kullanici':<15}")
        print("-" * 75)
        for r in rows:
            screen = r["dimensionValues"][0]["value"][:34]
            city = r["dimensionValues"][1]["value"] or "Bilinmiyor"
            users = r["metricValues"][0]["value"]
            print(f"{screen:<35} | {city:<20} | {users:<15}")
    else:
        print("Şu anda sitede anlık aktif kullanıcı bulunmuyor.")

def main():
    parser = argparse.ArgumentParser(description="Felek Mangalbasi GA4 Reporting Tool")
    parser.add_argument("--days", type=int, default=30, help="Raporlanacak gun sayisi (Varsayilan: 30)")
    parser.add_argument("--realtime", action="store_true", help="Son 30 dakikanin canli verilerini ceker")
    parser.add_argument("--telegram", action="store_true", help="Ozet raporu Telegram kanalina gonderir")

    args = parser.parse_args()

    if args.realtime:
        fetch_realtime()
    else:
        fetch_analytics(days=args.days, send_telegram=args.telegram)

if __name__ == "__main__":
    main()
