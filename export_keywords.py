import os
import sys
import datetime
from collections import defaultdict
from report_tool import get_credentials, SITE_URL
from googleapiclient.discovery import build

def export_full_analytics_txt():
    creds = get_credentials()
    service = build('searchconsole', 'v1', credentials=creds)

    # Date ranges
    # 1. Total available period (July 20, 2026 to August 23, 2026)
    start_total = "2026-07-20"
    end_total = "2026-08-23"

    # 2. July (2026-07-20 - 2026-07-31) & August (2026-08-01 - 2026-08-23)
    start_july, end_july = "2026-07-20", "2026-07-31"
    start_aug, end_aug = "2026-08-01", "2026-08-23"

    # 3. Weekly periods (5 weeks)
    weeks = [
        ("Hafta 1 (20-26 Temmuz)", "2026-07-20", "2026-07-26"),
        ("Hafta 2 (27 Tem - 02 Agu)", "2026-07-27", "2026-08-02"),
        ("Hafta 3 (03-09 Agustos)", "2026-08-03", "2026-08-09"),
        ("Hafta 4 (10-16 Agustos)", "2026-08-10", "2026-08-16"),
        ("Hafta 5 (17-23 Agustos)", "2026-08-17", "2026-08-23"),
    ]

    print("[*] GSC verileri cekiliyor...")

    # Fetch Total Queries
    res_total = service.searchanalytics().query(siteUrl=SITE_URL, body={
        'startDate': start_total, 'endDate': end_total, 'dimensions': ['query'], 'rowLimit': 1000
    }).execute()
    total_queries = res_total.get('rows', [])

    # Fetch July Queries
    res_july = service.searchanalytics().query(siteUrl=SITE_URL, body={
        'startDate': start_july, 'endDate': end_july, 'dimensions': ['query'], 'rowLimit': 1000
    }).execute()
    july_dict = {r['keys'][0]: r for r in res_july.get('rows', [])}

    # Fetch August Queries
    res_aug = service.searchanalytics().query(siteUrl=SITE_URL, body={
        'startDate': start_aug, 'endDate': end_aug, 'dimensions': ['query'], 'rowLimit': 1000
    }).execute()
    aug_dict = {r['keys'][0]: r for r in res_aug.get('rows', [])}

    # Fetch Query + Device Breakdown
    res_dev = service.searchanalytics().query(siteUrl=SITE_URL, body={
        'startDate': start_total, 'endDate': end_total, 'dimensions': ['query', 'device'], 'rowLimit': 2000
    }).execute()
    dev_data = defaultdict(lambda: {'MOBILE': 0, 'DESKTOP': 0, 'TABLET': 0, 'm_impr': 0, 'd_impr': 0})
    for r in res_dev.get('rows', []):
        q = r['keys'][0]
        dev = r['keys'][1]
        dev_data[q][dev] = r.get('clicks', 0)
        if dev == 'MOBILE':
            dev_data[q]['m_impr'] = r.get('impressions', 0)
        elif dev == 'DESKTOP':
            dev_data[q]['d_impr'] = r.get('impressions', 0)

    # Fetch Query + Page Breakdown
    res_page = service.searchanalytics().query(siteUrl=SITE_URL, body={
        'startDate': start_total, 'endDate': end_total, 'dimensions': ['query', 'page'], 'rowLimit': 2000
    }).execute()
    page_data = defaultdict(list)
    for r in res_page.get('rows', []):
        q = r['keys'][0]
        p = r['keys'][1].replace(SITE_URL, "/")
        page_data[q].append((p, r.get('clicks', 0), r.get('impressions', 0)))

    # Fetch Weekly Data per Query
    weekly_data = defaultdict(lambda: [0]*len(weeks))
    for w_idx, (w_name, w_start, w_end) in enumerate(weeks):
        res_w = service.searchanalytics().query(siteUrl=SITE_URL, body={
            'startDate': w_start, 'endDate': w_end, 'dimensions': ['query'], 'rowLimit': 1000
        }).execute()
        for r in res_w.get('rows', []):
            q = r['keys'][0]
            weekly_data[q][w_idx] = r.get('clicks', 0)

    # Monthly Totals
    tot_j_res = service.searchanalytics().query(siteUrl=SITE_URL, body={'startDate': start_july, 'endDate': end_july}).execute()
    tot_a_res = service.searchanalytics().query(siteUrl=SITE_URL, body={'startDate': start_aug, 'endDate': end_aug}).execute()
    tot_all_res = service.searchanalytics().query(siteUrl=SITE_URL, body={'startDate': start_total, 'endDate': end_total}).execute()

    j_tot = tot_j_res.get('rows', [{}])[0] if tot_j_res.get('rows') else {}
    a_tot = tot_a_res.get('rows', [{}])[0] if tot_a_res.get('rows') else {}
    all_tot = tot_all_res.get('rows', [{}])[0] if tot_all_res.get('rows') else {}

    # Target GBP / Local SEO Keywords
    gbp_target_keywords = [
        # Marka & İşletme
        'felek mangalbaşı', 'felek mangalbaşı bakırköy', 'felek mangalbaşı menü', 'felek mangalbaşı fiyat',
        'felek mangalbaşı fiyatları', 'felek mangalbaşı yorumlar', 'felek mangalbaşı yorumları', 'felek mangalbaşı iletişim',
        'felek mangalbaşı telefon', 'felek ocakbaşı', 'felek ocakbaşı bakırköy', 'felek meyhane', 'felek meyhanesi',
        'felek meyhanesi bakırköy', 'felek kendin pişir kendin ye', 'felek restaurant', 'felek restoran bakırköy',
        'felek sahil bakırköy', 'felek mangalbaşı suadiye', 'felek suadiye', 'felek suadiye menü',
        # Bakırköy Yerel
        'bakırköy mangalbaşı', 'bakırköy ocakbaşı', 'bakırköy kendin pişir kendin ye', 'bakırköy meyhane',
        'bakırköy meyhaneleri', 'bakırköy sahil ocakbaşı', 'bakırköy sahil mangalbaşı', 'bakırköy sahil restoranları',
        'bakırköy et mangal', 'bakırköy mangal yerleri', 'bakırköy ocakbaşı mekanları', 'bakırköy ocakbaşı kendin pişir',
        'bakırköy rakı mekanları', 'bakırköy fasıl mekanları', 'bakırköy canlı müzik meyhane', 'bakırköy aile ocakbaşı',
        'bakırköy alkollü mekan', 'bakırköy alkollü ocakbaşı', 'bakırköy gece açık mekanlar', 'bakırköy gece açık restoran',
        'gece açık restoran bakırköy', 'gece açık ocakbaşı bakırköy', 'bakırköy sahilde ocakbaşı', 'kennedy caddesi restoranlar',
        'sakızağacı restoranları', 'bakırköy sahil balıkçılar yanı ocakbaşı',
        # Çevre İlçeler
        'ataköy mangalbaşı', 'ataköy ocakbaşı', 'ataköy kendin pişir kendin ye', 'ataköy meyhane',
        'yeşilköy mangalbaşı', 'yeşilköy ocakbaşı', 'yeşilköy meyhane', 'yeşilyurt meyhane', 'yeşilyurt mangalbaşı',
        'florya mangalbaşı', 'florya ocakbaşı', 'florya kendin pişir kendin ye', 'zeytinburnu mangalbaşı',
        'zeytinburnu ocakbaşı', 'bahçelievler mangalbaşı', 'bahçelievler ocakbaşı', 'bahçelievler kendin pişir kendin ye',
        'yenikapı mangalbaşı', 'yenikapı meyhane', 'fatih ocakbaşı', 'fatih mangalbaşı', 'sultanahmet mangalbaşı', 'eminönü ocakbaşı',
        # Konsept & Genel
        'zahmetsiz mangalbaşı', 'dumansız mangalbaşı', 'dumansız fındık kabuğu mangal', 'masada mangal',
        'masada mangal istanbul', 'kendin pişir kendin ye', 'kendin pişir kendin ye istanbul',
        'kendin pişir kendin ye avrupa yakası', 'kendin pişir kendin ye alkolsüz', 'istanbul kendin pişir kendin ye alkolsüz',
        'kendin pişir ye mangal', 'mangal başı', 'mangalbasi', 'mangalbaşı mekanları istanbul', 'ocakbaşı istanbul avrupa',
        'alkollü ocakbaşı avrupa yakası', 'alkolsüz mangalbaşı', 'gece 02:00 açık restoran istanbul',
        'tarihi taş bina meyhane istanbul', 'deniz manzaralı ocakbaşı istanbul'
    ]

    # Combine All Unique
    all_unique_set = set([r['keys'][0].strip().lower() for r in total_queries] + [k.strip().lower() for k in gbp_target_keywords])
    all_unique_sorted = sorted(list(all_unique_set))

    # Sort total queries by clicks desc, then impressions desc
    sorted_total_queries = sorted(total_queries, key=lambda x: (x.get('clicks', 0), x.get('impressions', 0)), reverse=True)

    # ---------------- BUILD DOCUMENT ----------------
    out = []
    def a(line=""): out.append(line)

    a("=" * 115)
    a("  FELEK MANGALBASI — GOOGLE SEARCH CONSOLE & ISLETME PROFILI DETAYLI KEYWORD ANALIZ RAPORU")
    a("  Raporlama Tarihi: " + datetime.date.today().strftime("%d.%m.%Y"))
    a("  Kapsanan Veri Donemi: 20.07.2026 — 23.08.2026 (Temmuz 2026 & Agustos 2026)")
    a("  Toplam Benzersiz Anahtar Kelime Havuzu: " + str(len(all_unique_sorted)) + " Adet")
    a("  GSC'de Kaydedilen Canli Arama Sorgusu Sayisi: " + str(len(sorted_total_queries)) + " Adet")
    a("=" * 115)
    a()

    # GENEL OZET & AYLIK KIYAS
    a("=" * 115)
    a("GENEL PERFORMANS & AYLIK BUYUME KIYASLAMASI (TEMMUZ 2026 vs AGUSTOS 2026)")
    a("=" * 115)
    j_c, a_c = j_tot.get('clicks', 0), a_tot.get('clicks', 0)
    j_i, a_i = j_tot.get('impressions', 0), a_tot.get('impressions', 0)
    j_ctr, a_ctr = j_tot.get('ctr', 0)*100, a_tot.get('ctr', 0)*100
    j_pos, a_pos = j_tot.get('position', 0), a_tot.get('position', 0)

    c_growth = f"+{((a_c - j_c)/j_c)*100:.1f}%" if j_c > 0 else "+100%"
    i_growth = f"+{((a_i - j_i)/j_i)*100:.1f}%" if j_i > 0 else "+100%"

    a(f"{'METRIK':<25} | {'TEMMUZ 2026 (12 Gun)':<22} | {'AGUSTOS 2026 (23 Gun)':<22} | {'DEGISIM / BUYUME':<20} | {'TOPLAM DONEM':<15}")
    a("-" * 115)
    a(f"{'Toplam Tiklama':<25} | {j_c:<22} | {a_c:<22} | {c_growth:<20} | {all_tot.get('clicks', 0):<15}")
    all_impr_val = all_tot.get("impressions", 0)
    a(f"{'Toplam Gosterim':<25} | {f'{j_i:,}':<22} | {f'{a_i:,}':<22} | {i_growth:<20} | {f'{all_impr_val:,}':<15}")
    a(f"{'Ortalama CTR (%)':<25} | %{j_ctr:<21.2f} | %{a_ctr:<21.2f} | {a_ctr - j_ctr:+5.2f}% puan        | %{all_tot.get('ctr', 0)*100:<14.2f}")
    a(f"{'Ortalama Pozisyon':<25} | #{j_pos:<21.1f} | #{a_pos:<21.1f} | {j_pos - a_pos:+5.1f} sira iyilesme  | #{all_tot.get('position', 0):<14.1f}")
    a(f"{'Benzersiz Arama Sayisi':<25} | {len(july_dict):<22} | {len(aug_dict):<22} | +{len(aug_dict)-len(july_dict)} yeni sorgu      | {len(sorted_total_queries):<15}")
    a()
    a()

    # BOLUM 1: KELIME BAZLI AYLIK DAGILIM & KIYASLAMA TABLOSU (EN ONEMLI BOLUM)
    a("=" * 115)
    a("BOLUM 1: ANAHTAR KELIME BAZLI AYLIK TIKLAMA, GOSTERIM & SIRA KIYASLAMA TABLOSU")
    a("Aciklama: Her arama sorgusunun Temmuz ve Agustos aylarindaki tiklama, gosterim ve sira degisimleri karsilastirilmistir.")
    a("=" * 115)
    header = f"{'#':<4} | {'ARAMA SORGUSU':<38} | {'TEM TIK':<7} | {'AGU TIK':<7} | {'TIK FARK':<8} | {'TEM GOS':<7} | {'AGU GOS':<7} | {'GOS %':<8} | {'TEM SIRA':<8} | {'AGU SIRA':<8} | {'DURUM'}"
    a(header)
    a("-" * 115)

    for idx, r in enumerate(sorted_total_queries, 1):
        q = r['keys'][0]
        j_data = july_dict.get(q, {})
        a_data = aug_dict.get(q, {})

        jt_c = j_data.get('clicks', 0)
        at_c = a_data.get('clicks', 0)
        c_diff = at_c - jt_c
        c_diff_str = f"+{c_diff}" if c_diff > 0 else (str(c_diff) if c_diff < 0 else "=")

        jt_i = j_data.get('impressions', 0)
        at_i = a_data.get('impressions', 0)
        if jt_i == 0 and at_i > 0:
            i_pct = "YENI"
        elif jt_i > 0:
            pct_val = ((at_i - jt_i) / jt_i) * 100
            i_pct = f"+{pct_val:.0f}%" if pct_val > 0 else f"{pct_val:.0f}%"
        else:
            i_pct = "0%"

        jt_p = f"#{j_data.get('position', 0):.1f}" if jt_i > 0 else "-"
        at_p = f"#{a_data.get('position', 0):.1f}" if at_i > 0 else "-"

        # Trend Status
        if jt_c == 0 and at_c > 0:
            status = "★ YENI HIT"
        elif at_c > jt_c:
            status = "▲ ARTISTA"
        elif at_c < jt_c and jt_c > 0:
            status = "▼ DUSUSTE"
        elif at_i > jt_i and jt_i > 0:
            status = "▲ GOS. ARTTI"
        elif jt_i == 0 and at_i > 0:
            status = "● YENI SOGU"
        else:
            status = "─ STABIL"

        row_str = f"{idx:<4} | {q:<38} | {jt_c:<7} | {at_c:<7} | {c_diff_str:<8} | {jt_i:<7} | {at_i:<7} | {i_pct:<8} | {jt_p:<8} | {at_p:<8} | {status}"
        a(row_str)

    a()
    a()

    # BOLUM 2: HAFTALIK TIKLAMA DAGILIMI (SON 5 HAFTA)
    a("=" * 115)
    a("BOLUM 2: HAFTALIK TIKLAMA TRENDI & DAGILIMI (SON 5 HAFTA)")
    a("H1: 20-26 Tem | H2: 27 Tem-02 Agu | H3: 03-09 Agu | H4: 10-16 Agu | H5: 17-23 Agu")
    a("=" * 115)
    a(f"{'#':<4} | {'ARAMA SORGUSU':<42} | {'H1 (TEM)':<8} | {'H2 (TEM/AGU)':<12} | {'H3 (AGU)':<8} | {'H4 (AGU)':<8} | {'H5 (AGU)':<8} | {'TOPLAM TIK'}")
    a("-" * 115)

    # Sort queries with at least 1 click
    click_queries = [r for r in sorted_total_queries if r.get('clicks', 0) > 0]
    for idx, r in enumerate(click_queries, 1):
        q = r['keys'][0]
        w_clicks = weekly_data[q]
        tot_c = r.get('clicks', 0)
        a(f"{idx:<4} | {q:<42} | {w_clicks[0]:<8} | {w_clicks[1]:<12} | {w_clicks[2]:<8} | {w_clicks[3]:<8} | {w_clicks[4]:<8} | {tot_c}")

    a()
    a()

    # BOLUM 3: CIHAZ & SAYFA DAGILIMI (MOBIL vs DESKTOP & HEDEF SAYFALAR)
    a("=" * 115)
    a("BOLUM 3: CIHAZ KIRILIMI (MOBIL vs DESKTOP) & HEDEF SAYFA (LANDING PAGE) BAGLANTILARI")
    a("=" * 115)
    a(f"{'#':<4} | {'ARAMA SORGUSU':<38} | {'MOB TIK':<8} | {'DSK TIK':<8} | {'MOB GOS':<8} | {'DSK GOS':<8} | {'YONLENEN SAYFA (LANDING PAGE)'}")
    a("-" * 115)

    for idx, r in enumerate(sorted_total_queries[:75], 1):
        q = r['keys'][0]
        d = dev_data[q]
        p_list = page_data.get(q, [])
        top_page = p_list[0][0] if p_list else "/"
        if len(p_list) > 1:
            top_page += f" (+{len(p_list)-1} sayfa)"
        a(f"{idx:<4} | {q:<38} | {d['MOBILE']:<8} | {d['DESKTOP']:<8} | {d['m_impr']:<8} | {d['d_impr']:<8} | {top_page}")

    a()
    a()

    # BOLUM 4: SEO BUYUME FIRSATLARI (3. - 15. SIRADA OLUP ILK 1'E OYNAYAN KELIMELER)
    a("=" * 115)
    a("BOLUM 4: SEO BUYUME FIRSATLARI (YUKSEK GOSTERIMLI, 3. - 15. SIRA ARASI FIRSAT KELIMELERI)")
    a("Bu kelimeler arama hacmi yuksek olup sayfa ici optimizasyon ile aninda 1. siraya tasinabilir.")
    a("=" * 115)
    a(f"{'#':<4} | {'FIRSAT KELIMESI':<40} | {'GOSTERIM':<10} | {'TIKLAMA':<8} | {'CTR (%)':<10} | {'MEVCUT SIRA':<12} | {'HEDEF'}")
    a("-" * 115)

    opp_list = []
    for r in sorted_total_queries:
        q = r['keys'][0]
        pos = r.get('position', 0)
        impr = r.get('impressions', 0)
        clk = r.get('clicks', 0)
        ctr = (clk / impr * 100) if impr > 0 else 0
        if 2.5 <= pos <= 16.0 and impr >= 5:
            opp_list.append((q, impr, clk, ctr, pos))

    opp_list.sort(key=lambda x: x[1], reverse=True)
    for idx, (q, impr, clk, ctr, pos) in enumerate(opp_list, 1):
        a(f"{idx:<4} | {q:<40} | {impr:<10} | {clk:<8} | %{ctr:<9.1f} | #{pos:<11.1f} | Top 1 Hedef")

    a()
    a()

    # BOLUM 5: ISLETME PROFILI (GOOGLE BUSINESS PROFILE / HARITALAR) HEDEF KELIME MATRIXI
    a("=" * 115)
    a("BOLUM 5: GOOGLE ISLETME PROFILI (GBP) & HARITALAR YEREL SEO KELIME MATRISI")
    a("Harita aramalarinda 'Yakınımda', 'Bakırköy', 'Sahil' filtrelerinde one cikarilacak kelimeler.")
    a("=" * 115)

    categories = {
        '1. MARKA & RESTORAN ARAMALARI (Dogrudan Arama)': [k for k in gbp_target_keywords if 'felek' in k],
        '2. BAKIRKOY & SAHIL YEREL ODAK KELIMELERI (Yerel Kesif)': [k for k in gbp_target_keywords if 'bakırköy' in k or 'kennedy' in k or 'sakızağacı' in k],
        '3. CEVRE ILCELER & SAHIL GUZERGAHI KELIMELERI (Cevre Trafik)': [k for k in gbp_target_keywords if any(d in k for d in ['ataköy', 'yeşilköy', 'yeşilyurt', 'florya', 'zeytinburnu', 'bahçelievler', 'yenikapı', 'fatih', 'sultanahmet', 'eminönü'])],
        '4. KONSEPT & GENEL YEME-ICME ARAMALARI (Nis Aramalar)': [k for k in gbp_target_keywords if not ('felek' in k or 'bakırköy' in k or any(d in k for d in ['ataköy', 'yeşilköy', 'yeşilyurt', 'florya', 'zeytinburnu', 'bahçelievler', 'yenikapı', 'fatih', 'sultanahmet', 'eminönü']))]
    }

    for cat_name, kw_list in categories.items():
        a(f"\n--- {cat_name} ({len(kw_list)} Adet) ---")
        for kw in kw_list:
            # Check if this keyword exists in GSC live data
            gsc_match = [r for r in sorted_total_queries if r['keys'][0].strip().lower() == kw.strip().lower()]
            if gsc_match:
                gm = gsc_match[0]
                a(f"  [CANLI GSC VAR] • {kw:<38} -> Tiklama: {gm.get('clicks',0):<3} | Gosterim: {gm.get('impressions',0):<4} | Sira: #{gm.get('position',0):.1f}")
            else:
                a(f"  [HEDEF KELIME]  • {kw:<38} -> Haritalar / GBP Optimizasyon Hedefi")

    a()
    a()

    # BOLUM 6: TUM KELIMELER DUZ LISTE (198 ADET)
    a("=" * 115)
    a(f"BOLUM 6: TUM BENZERSIZ KEYWORDS LISTESI (KOPYALAMAYA HAZIR DUZ METIN - {len(all_unique_sorted)} ADET)")
    a("=" * 115)
    for item in all_unique_sorted:
        a(item)

    # WRITE TO FILES
    content_str = "\n".join(out)

    with open("gsc_ve_isletme_profili_keywords.txt", "w", encoding="utf-8") as f:
        f.write(content_str)

    with open("keywords.txt", "w", encoding="utf-8") as f:
        f.write(content_str)

    print(f"[+] Dosyalar basariyla guncellendi!")
    print(f"[*] Toplam Satir: {len(out)}")
    print(f"[*] Toplam Sorgu: {len(sorted_total_queries)}")
    print(f"[*] Toplam Benzersiz: {len(all_unique_sorted)}")

if __name__ == "__main__":
    export_full_analytics_txt()
