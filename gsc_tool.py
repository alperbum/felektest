import os
import json
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
import requests

KEY_FILE = "service_account.json"
SITE_URL = "https://www.felekmangalbasi.com/"

SCOPES = [
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/indexing"
]

def get_credentials():
    if not os.path.exists(KEY_FILE):
        raise FileNotFoundError(f"Service account file '{KEY_FILE}' not found.")
    return service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)

def run_query_analytics(days=30):
    creds = get_credentials()
    service = build('searchconsole', 'v1', credentials=creds)
    
    end_date = datetime.date.today() - datetime.timedelta(days=2)
    start_date = end_date - datetime.timedelta(days=days)
    
    request = {
        'startDate': start_date.strftime('%Y-%m-%d'),
        'endDate': end_date.strftime('%Y-%m-%d'),
        'dimensions': ['query'],
        'rowLimit': 50
    }
    
    try:
        response = service.searchanalytics().query(siteUrl=SITE_URL, body=request).execute()
        rows = response.get('rows', [])
        
        report_md = f"# Felek Mangalbaşı — Search Console API Analytics Report\n"
        report_md += f"**Period:** {start_date} to {end_date} (Last {days} Days)\n"
        report_md += f"**Target Site:** {SITE_URL}\n\n"
        
        report_md += "## Top 50 Search Queries\n\n"
        report_md += "| Arama Sorgusu | Tıklama | Gösterim | CTR (Tıklama Oranı) | Ortalama Pozisyon |\n"
        report_md += "|---|---|---|---|---|\n"
        
        for r in rows:
            query = r['keys'][0]
            clicks = r.get('clicks', 0)
            impressions = r.get('impressions', 0)
            ctr = f"{r.get('ctr', 0)*100:.1f}%"
            pos = f"{r.get('position', 0):.1f}"
            report_md += f"| `{query}` | {clicks} | {impressions} | {ctr} | #{pos} |\n"
            
        # Top Pages
        page_request = {
            'startDate': start_date.strftime('%Y-%m-%d'),
            'endDate': end_date.strftime('%Y-%m-%d'),
            'dimensions': ['page'],
            'rowLimit': 20
        }
        page_response = service.searchanalytics().query(siteUrl=SITE_URL, body=page_request).execute()
        page_rows = page_response.get('rows', [])
        
        report_md += "\n## Top Landing Pages\n\n"
        report_md += "| Sayfa URL | Tıklama | Gösterim | CTR | Pozisyon |\n"
        report_md += "|---|---|---|---|---|\n"
        for pr in page_rows:
            page = pr['keys'][0].replace(SITE_URL, "/")
            clicks = pr.get('clicks', 0)
            impressions = pr.get('impressions', 0)
            ctr = f"{pr.get('ctr', 0)*100:.1f}%"
            pos = f"{pr.get('position', 0):.1f}"
            report_md += f"| `{page}` | {clicks} | {impressions} | {ctr} | #{pos} |\n"
            
        with open("search_analytics_report.md", "w", encoding="utf-8") as f:
            f.write(report_md)
            
        print("Analytics report successfully generated and saved to search_analytics_report.md!")
        return rows, page_rows
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return None, None

def send_indexing_requests():
    creds = get_credentials()
    urls = [
        "https://www.felekmangalbasi.com/",
        "https://www.felekmangalbasi.com/zahmetsiz-mangal.html",
        "https://www.felekmangalbasi.com/raki-mangal-meyhane.html",
        "https://www.felekmangalbasi.com/kennedy-sahil-konum.html",
        "https://www.felekmangalbasi.com/gurme-yorumlar.html",
        "https://www.felekmangalbasi.com/menu.html"
    ]
    
    endpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish"
    import google.auth.transport.requests
    session = requests.Session()
    creds.refresh(google.auth.transport.requests.Request())
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {creds.token}"
    }
    
    for u in urls:
        body = {
            "url": u,
            "type": "URL_UPDATED"
        }
        res = session.post(endpoint, headers=headers, json=body)
        if res.status_code == 200:
            print(f"[OK] Indexing requested for: {u}")
        else:
            print(f"[NOTE {res.status_code}] {u}: {res.text}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--indexing":
        send_indexing_requests()
    else:
        run_query_analytics()
