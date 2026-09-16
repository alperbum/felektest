import os
import sys
from report_tool import get_credentials, SITE_URL
from googleapiclient.discovery import build

creds = get_credentials()
service = build('searchconsole', 'v1', credentials=creds)

# 30-day range
start_date = "2026-08-11"
end_date = "2026-09-10"

res = service.searchanalytics().query(siteUrl=SITE_URL, body={
    'startDate': start_date,
    'endDate': end_date,
    'dimensions': ['query'],
    'rowLimit': 2000
}).execute()

rows = res.get('rows', [])

# Brand words: felek
brand_queries = []
non_brand_with_clicks = []
non_brand_zero_clicks = []

for r in rows:
    query = r['keys'][0]
    clicks = int(r.get('clicks', 0))
    impr = int(r.get('impressions', 0))
    ctr = r.get('ctr', 0.0) * 100
    pos = r.get('position', 0.0)
    item = {'query': query, 'clicks': clicks, 'impr': impr, 'ctr': ctr, 'pos': pos}
    
    if 'felek' in query.lower():
        brand_queries.append(item)
    else:
        if clicks > 0:
            non_brand_with_clicks.append(item)
        else:
            non_brand_zero_clicks.append(item)

non_brand_with_clicks.sort(key=lambda x: (x['clicks'], x['impr']), reverse=True)
non_brand_zero_clicks.sort(key=lambda x: x['impr'], reverse=True)

total_clicks = sum(r.get('clicks', 0) for r in rows)
brand_clicks = sum(x['clicks'] for x in brand_queries)
non_brand_clicks = sum(x['clicks'] for x in non_brand_with_clicks)

output_lines = []
output_lines.append(f"GSC 30 Günlük Veri (25 Temmuz - 24 Ağustos 2026):")
output_lines.append(f"Toplam Tıklama: {total_clicks}")
output_lines.append(f"Marka Tıklaması ('felek' içerenler): {brand_clicks} (%{brand_clicks/total_clicks*100:.1f})")
output_lines.append(f"Non-Brand Tıklama (Markasız Genel Kelimeler): {non_brand_clicks} (%{non_brand_clicks/total_clicks*100:.1f})")
output_lines.append("\n--- MARKA ARAMASI OLMAYAN TIKLANAN KELİMELER ---")

for i, x in enumerate(non_brand_with_clicks, 1):
    output_lines.append(f"{i:2d}. {x['query']:<40} | Tık: {x['clicks']:2d} | Göst: {x['impr']:4d} | CTR: %{x['ctr']:5.1f} | Sıra: #{x['pos']:.1f}")

output_lines.append("\n--- EN ÇOK GÖSTERİM ALIP HENÜZ TIKLANMAYAN FIRSAT KELİMELERİ (0 Tık) ---")
for i, x in enumerate(non_brand_zero_clicks[:15], 1):
    output_lines.append(f"{i:2d}. {x['query']:<40} | Tık: {x['clicks']:2d} | Göst: {x['impr']:4d} | CTR: %{x['ctr']:5.1f} | Sıra: #{x['pos']:.1f}")

with open('non_brand_report.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print('\n'.join(output_lines))
