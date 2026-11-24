# Felek Mangalbaşı — SEO / GEO Eylem Planı

Hazırlanma tarihi: 16 Eylül 2026
Veri kaynağı: Google Search Console (30 gün, 4.967 gösterim), GA4 (705 oturum), Google Business Profile

---

## 1. DURUM TESPİTİ

| Gösterge | Değer | Yorum |
|---|---|---|
| Toplam gösterim | 4.967 (+%52,3) | Görünürlük hızla artıyor |
| Toplam tıklama | 214 (+%36,3) | Tıklama, gösterimin gerisinde kalıyor |
| Ortalama sıra | #5,3 | İlk sayfanın ortası |
| Mobil pay | %80,4 (4.276 gösterim / 172 tık) | Mobil CTR %4,0 — düşük |
| AI Assistant yönlendirmesi | 21 oturum, %71,4 etkileşim | Küçük ama en kaliteli kanal |

**Temel teşhis:** Sorun sıralama değil, **CTR**'dır. `bakırköy ocakbaşı` (#6,3) 176
gösterimden yalnızca 5 tıklama üretiyor (%2,8). `bakırköy kendin pişir kendin ye` (#4,4)
106 gösterimden 1 tıklama (%0,9) üretiyor. Bu iki kelimede 4-6. sırada olmak görünürlük
sağlıyor ama sonuç başlığı tıklamaya ikna etmiyor.

**Kaldıraç sırası:** (1) title + meta description'ı tam eşleşmeli hale getir, (2) ilk 3'e
gir, (3) GBP'de aynı kelimeleri besle.

---

## 2. UYGULANAN TEKNİK DEĞİŞİKLİKLER (bu çalışmada yapıldı)

### 2.1 Title ve meta description — tam eşleşme

Google, sorgudaki ifadeyi title'da **birebir** gördüğünde o ifadeyi kalınlaştırır ve CTR
ölçülebilir biçimde artar. Önceki title'larda kelimeler bölünmüştü:

| Sayfa | Önceki title | Yeni title | Hedef kelime |
|---|---|---|---|
| `/` | Felek Mangalbaşı \| Bakırköy **Sahil** Mangalbaşı & Meyhane | Felek Mangalbaşı \| **Bakırköy Mangalbaşı** & Sahil Ocakbaşı | bakırköy mangalbaşı #5,2 |
| `/menu` | Felek Mangalbaşı \| Menü | Felek Mangalbaşı **Menü ve Fiyatlar** \| Bakırköy Ocakbaşı | felek mangalbaşı menü #1,0 |
| `/zahmetsiz-mangal` | Bakırköy **Sahil Ocakbaşı** & Mangalbaşı | **Bakırköy Ocakbaşı** & **Kendin Pişir Kendin Ye** | #6,3 + #4,4 |
| `/raki-mangal-meyhane` | Bakırköy Sahil Meyhane & **Rakı Kültürü** | **Bakırköy Rakı Mekanları** \| Sahil Meyhanesi | bakırköy rakı mekanları #6,7 |
| `/kennedy-sahil-konum` | Bakırköy Sahil Konum & Tarihi Taş Bina | **Kennedy Caddesi** Sahil Ocakbaşı & Ulaşım | sahil kennedy caddesi #8,7 |

### 2.2 H1 / H2 hiyerarşisi

| Sayfa | Önceki H1 | Yeni H1 |
|---|---|---|
| `/` | Rakı, Meze, Zahmetsiz Mangal. | **Bakırköy Sahilde Mangalbaşı ve Ocakbaşı.** |
| `/menu` | Menü | **Menü ve Fiyatlar** |
| `/zahmetsiz-mangal` | Bakırköy Ocakbaşı & Zahmetsiz Mangalbaşı | **Bakırköy Ocakbaşı ve Kendin Pişir Kendin Ye** |
| `/raki-mangal-meyhane` | Bakırköy Rakı Mekanları & Sahil Meyhanesi | Bakırköy Rakı Mekanları ve Sahil Meyhanesi |
| `/kennedy-sahil-konum` | 200 Yıllık Taş Bina & Deniz Manzaralı Sahil | **Kennedy Caddesi Sahil:** 200 Yıllık Taş Bina |

Yeni / yeniden adlandırılan H2'ler (her biri bir GSC sorgusunu hedefler):

| H2 | Hedef sorgu | Sıra |
|---|---|---|
| Bakırköy'de Kendin Pişir Kendin Ye | bakırköy kendin pişir kendin ye | #4,4 |
| Bakırköy Ocakbaşı Mekanları Arasında Felek | bakırköy ocakbaşı mekanları | #4,4 |
| İstanbul'da Mangalbaşı Deneyimi | mangalbaşı istanbul / istanbul mangalbaşı | #8,7 / #7,8 |
| Bakırköy Sahilde Rakı İçilecek Yer | bakırköyde rakı içilecek yerler | #11,5 |
| Bakırköy'de Gece Açık Sahil Restoranı | bakırköy gece açık mekanlar | #12,0 |
| Florya, Yeşilköy ve Ataköy'den Sahil Yoluyla Ulaşım | florya / yeşilköy mangalbaşı | #7,7 / #13,0 |

### 2.3 Yeni FAQ'ler (görünür metin + FAQPage şeması birebir aynı)

| Sayfa | Eklenen soru | Hedef niyet |
|---|---|---|
| zahmetsiz-mangal | Bakırköy'de gece 01:00 – 02:00'ye kadar açık ocakbaşı var mı? | Gece araması |
| zahmetsiz-mangal | Bakırköy ocakbaşı mekanları arasında Felek'i ayıran nedir? | Karşılaştırma |
| raki-mangal-meyhane | Yabancı misafiri Türk meze ve et kültürüyle tanıştırmak için uygun mu? | Turist |
| raki-mangal-meyhane | Bakırköy sahilinde gece geç saatte rakı ve sıcak yemek bulunur mu? | Gece araması |
| kennedy-sahil-konum | Florya, Yeşilköy veya Ataköy'den ne kadar sürede ulaşılır? | Çevre ilçe |
| kennedy-sahil-konum | Sahil kenarında açık bahçesi ve valesi olan bir ocakbaşı mı? | Manzara + vale |

Toplam FAQ: 14 → **20 giriş**, 7 sayfada da görünür metin ile `FAQPage` şeması birebir aynı.

### 2.4 `llms.txt` GEO revizyonu (18 KB → 24 KB, 8 → 12 bölüm)

| Yeni bölüm | İşlevi |
|---|---|
| §6 Arama Niyeti Eşleştirmesi | Sizin verdiğiniz 4 doğal dilli senaryonun birebir cevap blokları |
| §9 English Summary | İngilizce soran modellere Türkçe olmayan bağlam |
| §10 Ne Zaman Önerilmemeli | Negatif kalifikasyon — model güvenini artırır |
| §11 Varlık Adları ve Eşleştirme | GSC sorgusu → doğru şube eşlemesi |
| §12 Alıntılama Kuralları | Yanlış bilgi (Suadiye, canlı müzik, fiyat) üretilmesini engeller |

**§10 neden önemli:** Yapay zekâ motorları bir işletmeyi ne zaman **önermemesi** gerektiğini
bilen kaynaklara daha çok güvenir. "Canlı müzik arayan kullanıcıya Felek önerilmemelidir"
cümlesi, "her şeye uygunuz" diyen bir metinden daha güçlü bir sinyaldir.

---

## 3. MARKA DİLİ KURALLARI (içerik üreten yapay zekâya verilecek direktifler)

Aşağıdaki bloğu olduğu gibi sistem talimatı (system prompt) olarak kullanın:

```
ROL: Felek Mangalbaşı için metin yazıyorsun.

KİMLİK
- Bakırköy Kennedy Caddesi No:29'da, 200 yıllık taş konakta, deniz manzaralı açık bahçede
  hizmet veren modern meyhane ve masada mangal restoranı.
- Orta-üst segment, tam alkol ruhsatlı, her gün 12:00 - 02:00.

TON
- Ağırbaşlı, ölçülü, kurumsal. Beyan cümlesi kur; seslenme ve ünlem kullanma.
- Et, kömür, meze ve servis süreçlerini somut ayrıntıyla anlat.
- Kısa cümle. Bir cümlede tek bilgi.

YASAKLAR
- Emoji, ok işareti, süs karakteri kullanma.
- Şu kelimeleri kullanma: efsanevi, kusursuz, muhteşem, eşsiz, benzersiz, mükemmel,
  iddialı, unutulmaz, büyülü, şahane, harika.
- "İstanbul'un en iyisi", "1 numaralı", "rakipsiz" gibi doğrulanamaz üstünlük iddiası kurma.
- Fiyat yazma; menü sayfasına yönlendir.
- Canlı müzik, fasıl programı veya sahne etkinliği duyurma (yoktur).
- Suadiye şubesinden açık bir mekan gibi söz etme (kalıcı olarak kapalıdır).

KORUNACAKLAR
- Birebir basın alıntıları ve imzalı misafir yorumları olduğu gibi bırakılır.
- Şu terimler metinde doğal biçimde geçmeli: fındık kabuğu kömürü, masada dumansız mangal,
  küşleme, kuzu pirzola, lokum bonfile, dinlendirilmiş et, günlük meze dolabı,
  ücretsiz vale, deniz manzaralı bahçe, 200 yıllık taş bina.

GERÇEKLER (değiştirme)
- Adres: Sakızağacı Mah., Kennedy Cad. No:29, 34142 Bakırköy / İstanbul
- Telefon: +90 212 543 92 48 | WhatsApp: +90 539 777 60 67
- Tek şube Bakırköy'dür.
```

---

## 4. GOOGLE İŞLETME PROFİLİ (GBP) & HARİTA HAKİMİYETİ

GBP, `bakırköy ocakbaşı` gibi yerel sorgularda web sitesinden **daha yukarıda** görünür.
Sitede 6. sırada olmak, harita paketinde ilk 3'te olmaktan daha az değerlidir.

### 4.1 Kategori hiyerarşisi

| Alan | Öneri | Gerekçe |
|---|---|---|
| Birincil kategori | **Ocakbaşı** (Turkish restaurant alt tipi yoksa "Turkish Restaurant") | `bakırköy ocakbaşı` 176 gösterim, en yüksek hacim |
| Ek kategori 1 | Steak House / Et Restoranı | `bakırköy mangalbaşı`, dinlendirilmiş et vurgusu |
| Ek kategori 2 | Meyhane / Mediterranean Restaurant | `bakırköy rakı mekanları` 142 gösterim |
| Ek kategori 3 | Bar & Grill | Gece 02:00 ve alkollü servis sinyali |

Birincil kategoriyi değiştirdikten sonra 2-3 hafta sıralama dalgalanması normaldir; tek
seferde değiştirin, geri almayın.

### 4.2 İşletme açıklaması (750 karakter, anahtar kelime ilk cümlede)

> Felek Mangalbaşı, Bakırköy Kennedy Caddesi sahilinde, 200 yıllık tarihi taş binada ve
> deniz manzaralı açık bahçesinde hizmet veren ocakbaşı ve masada mangal restoranıdır.
> Her masaya özel kurulan dumansız fındık kabuğu kömürlü ünitede eti misafir pişirir;
> ateşi, mezeyi ve servisi garson yönetir. Günlük hazırlanan meze dolabı, dinlendirilmiş
> Balıkesir ve Trakya kesimi küşleme, kuzu pirzola, lokum bonfile ve geniş rakı seçkisi
> aynı menüde sunulur. Tam alkol ruhsatlıdır, ücretsiz vale hizmeti vardır ve mutfak her
> gün 12:00 - 02:00 arası açıktır. Tarihi Yarımada'ya sahil yolundan yaklaşık 15 dakika,
> Ataköy Marina'ya 3 dakika mesafededir.

### 4.3 Görsel sıralaması (GBP fotoğrafları sıralamayı doğrudan etkiler)

İlk 10 fotoğraf şu sırayla yüklenmeli — Google ilk fotoğrafları arama sonucunda gösterir:

| # | Konu | Dosya adı (önerilen) |
|---|---|---|
| 1 | Dış cephe, 200 yıllık taş bina, tabela görünür | `felek-mangalbasi-bakirkoy-dis-cephe.jpg` |
| 2 | Deniz manzaralı bahçe, dolu masa düzeni | `felek-deniz-manzarali-bahce.jpg` |
| 3 | Masada yanan mangal ünitesi, et üzerinde | `felek-masada-findik-komuru-mangal.jpg` |
| 4 | Meze dolabının tam görüntüsü | `felek-gunluk-meze-dolabi.jpg` |
| 5 | Küşleme / pirzola tabağı yakın çekim | `felek-kusleme-kuzu-pirzola.jpg` |
| 6 | Rakı ve meze sofrası | `felek-raki-meze-sofrasi.jpg` |
| 7 | Taş duvar iç mekan detayı | `felek-200-yillik-tas-duvar.jpg` |
| 8 | Vale / giriş noktası | `felek-vale-giris-kennedy.jpg` |
| 9 | Ekip / servis anı | `felek-garson-servis.jpg` |
| 10 | Gece görünümü, bahçe aydınlatması | `felek-gece-bahce.jpg` |

Dosya adlarında anahtar kelime kullanın ve her fotoğrafa alt metin ekleyin. Haftada 3-5 yeni
fotoğraf yüklemek "aktif işletme" sinyalidir.

### 4.4 Soru-Cevap (Q&A) — soruları kendiniz sorun

GBP'de işletme sahibi soru sorup cevaplayabilir. Bu alan `People also ask` kutusunu besler.
Şu 8 soruyu sırayla girin:

1. Bakırköy'de gece kaçta kapanıyorsunuz? — Her gün 02:00'ye kadar açığız, mutfak kapanışa kadar tam menüyle çalışır.
2. Masada mangal nasıl çalışıyor? — Her masaya bağımsız dumansız fındık kabuğu kömürlü ünite kurulur; eti siz pişirirsiniz, ateşi ve servisi garson yönetir.
3. Kıyafete duman kokusu siniyor mu? — Kokusuz fındık kabuğu kömürü kullanıldığı için duman ve is oluşmaz.
4. Vale ve otopark ücretsiz mi? — Kennedy Cad. No:29 girişinde ücretsiz vale hizmeti vardır.
5. Alkolsüz gelen misafirler için uygun mu? — Evet, alkol servisi zorunlu değildir; ayran, şalgam ve et seçenekleriyle alkolsüz sofra kurulur.
6. Rezervasyon gerekli mi? — Hafta sonu ve akşam saatleri için önerilir: +90 539 777 60 67.
7. Canlı müzik var mı? — Hayır, hafif arka plan müziği eşliğinde sakin bir yemek ortamı sunarız.
8. Çocuklu aileler için uygun mu? — Mama sandalyesi mevcuttur, açık bahçe geniş ve evcil hayvana açıktır.

---

## 5. YORUM STRATEJİSİ — operasyon taktikleri

Amaç: yorumlarda `küşleme`, `fındık kömürü`, `ferah bahçe`, `vale`, `tarihi konak`
kelimelerinin **doğal olarak** geçmesini sağlamak. Google, yorum metnindeki kelimeleri
yerel sıralamada kullanır. Yapay yönlendirme ("şu kelimeyi yazın" demek) politika ihlalidir
ve işe yaramaz; bunun yerine **konuşmayı o konuya yönlendirecek operasyon adımları** kullanılır.

### 5.1 Garson söylemi (tek cümle, servis sırasında)

| An | Söylenecek | Beklenen yorum kelimesi |
|---|---|---|
| Mangal kurulurken | "Fındık kabuğu kömürü kullanıyoruz, kokusuzdur; kıyafetinize sinmez." | fındık kömürü, kokusuz, dumansız |
| Et getirilirken | "Küşlememiz Balıkesir kesimi, 28 gün dinlendirilmiş." | küşleme, dinlendirilmiş et, lokum |
| Mezeler dizilirken | "Mezeler her sabah dolapta taze hazırlanıyor." | günlük meze, taze |
| Hesap istenirken | "Aracınızı vale ücretsiz teslim alıyor." | vale, otopark |
| Uğurlarken | "Bahçemiz deniz tarafı, akşam serin olur; taş binamız da 200 yıllık." | deniz manzarası, tarihi bina, ferah bahçe |

Bunlar satış cümlesi değil, servis bilgisidir — personel zaten söylemesi gerekeni söyler.

### 5.2 Yorum isteme anı

- **Doğru an:** hesap ödendikten hemen sonra, misafir masadan kalkmadan. Memnuniyet en yüksek
  olduğu andır.
- **Yanlış an:** yemek ortası veya çıkışta kapıda.
- **Söylem:** "Bugün nasıl buldunuz? Beğendiyseniz Google'da iki cümle yazmanız bizim için
  çok kıymetli." — kelime dikte edilmez.
- **Araç:** masada QR kodlu kart ("Google'da değerlendir" → doğrudan `placeId` derin bağlantısı).

### 5.3 Cevap verme kuralı (sıralamada etkili)

Her yoruma 48 saat içinde cevap verin. Cevapta **bir** doğal anahtar kelime kullanın:

> Teşekkür ederiz. Küşlememizi beğenmenize sevindik. Fındık kabuğu kömürlü masamız ve deniz
> manzaralı bahçemizle tekrar ağırlamaktan memnuniyet duyarız. — Felek Mangalbaşı, Kennedy Cad. No:29

Hedef: ayda **40+ yeni yorum**, %100 cevap oranı. Mevcut 2.700+ yorum hacmi güçlü; ivme
korunmalı.

### 5.4 Olumsuz yorum protokolü

1. 24 saat içinde, savunmaya geçmeden cevap verin.
2. Sorunu somut olarak kabul edin, telafi teklif edin, görüşmeyi telefona taşıyın.
3. Asla tartışmayın — cevap, o yorumu okuyacak gelecekteki misafire yazılır.

---

## 6. FİZİKSEL & DİJİTAL ENTEGRASYON (masa dönüşümü ve müdavimlik)

Mevcut GA4 verisi: WhatsApp tıklaması 8, telefon 3, yol tarifi 4. Bu sayılar trafiğe
(705 oturum) göre çok düşük — siteden rezervasyona giden yol kopuk.

### 6.1 Masadaki QR menü

- QR, menüye ek olarak **rezervasyon ve WhatsApp** bağlantısını da içermeli. Şu an yalnızca menü açılıyor.
- Öneri: QR → `/menu` sayfası, sayfanın altında sabit "Yeniden rezervasyon" butonu.
- Menü sayfasına "Bu masadan tekrar gelmek için kaydedin" notu ve WhatsApp hattı.

### 6.2 Hesap süreci

- Hesap fişinin altına basılı QR: "Google'da değerlendir" + "WhatsApp hattımız".
- Fiş üzerinde bir sonraki ziyaret için somut teklif (ör. hafta içi 12:00-17:00 meze
  ikramı) — tarih aralığı yazılı, süresi belli.

### 6.3 Garson iletişimi

- Personel, grup rezervasyonları için WhatsApp numarasını sözlü olarak verir.
- 8+ kişilik masalara kartvizit: "Bir dahaki sefere doğrudan bu numaradan masa ayırın."

### 6.4 Vale noktası

- Vale fişinin arkasında QR + telefon. Misafir arabasını beklerken telefonunu elinde tutar;
  bu, QR tarama oranının en yüksek olduğu andır.

### 6.5 WhatsApp müdavim hattı (en yüksek getirili adım)

- Ayrı bir WhatsApp Business numarası, "Felek Masa" etiketli katalog.
- İzin veren misafire ayda **en fazla 2** mesaj: menü değişikliği ve özel gece. Fazlası
  engellenme getirir.
- Mesajlar tek yönlü duyuru değil, soru ile bitsin: "Perşembe akşamı deniz tarafı masayı
  size ayıralım mı?"

### 6.6 Sitede ölçülmesi gereken olaylar (GA4)

Şu an yalnızca tıklama sayılıyor. Aşağıdakileri olay olarak işaretleyin:

| Olay | Tetikleyici |
|---|---|
| `reservation_whatsapp` | `wa.me` bağlantısı tıklaması |
| `call_click` | `tel:` bağlantısı tıklaması |
| `directions_click` | Harita yol tarifi |
| `menu_view` | `/menu` sayfa görüntüleme (mevcut) |
| `qr_scan` | `?src=masa-qr` parametreli ziyaret |
| `lang_switch` | Dil değiştirme (mevcut) |

`?src=masa-qr` parametresi eklemek, masadaki QR'dan gelen trafiği ayırmanın tek yoludur.
Bunu uygulamak 15 dakikalık bir iştir ve masadaki dönüşümün gerçekten işe yarayıp
yaramadığını ölçmenizi sağlar.

---

## 7. ÖNCELİKLENDİRİLMİŞ EYLEM PLANI

### HEMEN YAPILACAKLAR (düşük efor, hızlı getiri)

| # | Aksiyon | Sorumlu | Süre | Beklenen etki |
|---|---|---|---|---|
| 1 | Sitedeki title/H1/H2 değişikliklerini yayınla (`deploy_ftp.py`) | Siz | 10 dk | `bakırköy ocakbaşı` ve `bakırköy rakı mekanları` CTR artışı |
| 2 | GSC'de sitemap'i yeniden gönder, 5 URL için "URL denetimi → dizine eklenmesini iste" | Siz | 15 dk | Yeniden tarama 3-7 güne iner |
| 3 | GBP birincil kategorisini "Ocakbaşı" yap, ek kategorileri ekle | Siz | 10 dk | Harita paketi görünürlüğü |
| 4 | GBP işletme açıklamasını §4.2 metniyle değiştir | Siz | 5 dk | Yerel sorgu eşleşmesi |
| 5 | GBP'de 8 Soru-Cevap girişini yap | Siz | 30 dk | "People also ask" görünürlüğü |
| 6 | Masaya `?src=masa-qr` parametreli QR kartı koy | Siz | 20 dk | Masa dönüşümü ölçülebilir hale gelir |
| 7 | GA4'te §6.6 olaylarını tanımla | Geliştirici | 1 saat | Dönüşüm ölçümü |
| 8 | Telegram bot token'ını değiştir (kaynak kodda açık) | Geliştirici | 30 dk | Güvenlik — sızıntı riski |

### ORTA VADELİ (2-6 hafta)

| # | Aksiyon | Süre | Beklenen etki |
|---|---|---|---|
| 9 | GBP'ye §4.3 sırasıyla 10 fotoğraf + alt metin yükle | 1 gün | Harita paketi sıralaması |
| 10 | Garson söylem kartlarını bas, personele eğitim ver | 1 hafta | Yorum kelime çeşitliliği |
| 11 | Hesap fişi ve vale fişi arkasına QR bastır | 2 hafta | Yorum hacmi +40/ay |
| 12 | `/zahmetsiz-mangal` sayfasına ocakbaşı karşılaştırma tablosunu genişlet (5-6 mekan tipi) | 1 gün | `bakırköy ocakbaşı mekanları` #4,4 → ilk 3 |
| 13 | Florya ve Yeşilköy için ulaşım içeriğini derinleştir (güzergâh, süre, park) | 1 gün | `florya mangalbaşı` #7,7 → ilk 5 |
| 14 | WhatsApp Business müdavim hattını kur, etiketleme sistemi | 1 hafta | Tekrar ziyaret oranı |
| 15 | Menü sayfasına İngilizce fiyat görünümü (turist sorgusu) | 2 gün | EN aramalarda dönüşüm |
| 16 | ChatGPT/Perplexity'de 10 hedef sorguyu test et, cevapları kaydet | 2 saat | GEO başlangıç ölçümü |

### SÜREKLİ SÜREÇLER

| Aksiyon | Sıklık | Ölçüt |
|---|---|---|
| Yeni yorumlara cevap | 48 saat içinde | %100 cevap oranı |
| GBP'ye yeni fotoğraf | Haftada 3-5 | Aktif işletme sinyali |
| GSC sorgu raporu incelemesi | Haftalık | Yeni yükselen sorgular |
| Yeni yükselen sorgu için H2/FAQ ekleme | Aylık | Sorgu → sayfa eşleşmesi |
| `llms.txt` güncellemesi (`last_updated`) | Fiyat/saat değiştiğinde | AI cevap doğruluğu |
| Menü fiyatı güncellemesi | Aylık | `felek mangalbaşı fiyat` sorgusu |
| AI asistanlarında marka sorgusu testi | Aylık | İlk 3'te önerilme oranı |
| Rakip karşılaştırma (ilk 3'teki ocakbaşılar) | Çeyreklik | İçerik farkı analizi |

---

## 8. ÖLÇÜM — 30 gün sonra bakılacak göstergeler

| Gösterge | Şu an | 30 gün hedefi |
|---|---|---|
| `bakırköy ocakbaşı` sırası | #6,3 | ilk 3 |
| `bakırköy ocakbaşı` CTR | %2,8 | %5+ |
| `bakırköy rakı mekanları` sırası | #6,7 | ilk 4 |
| `bakırköy kendin pişir kendin ye` CTR | %0,9 | %3+ |
| `bakırköy mangalbaşı` sırası | #5,2 | ilk 3 |
| Toplam tıklama (30 gün) | 214 | 300+ |
| WhatsApp tıklaması (günlük) | 8 | 15+ |
| Yeni GBP yorumu (aylık) | — | 40+ |
| AI Assistant oturumu | 21 | 40+ |

Değişikliklerin etkisini ayırmak için tarih aralığını not alın: yayın tarihi + 7 gün boyunca
sıralama dalgalanması normaldir, gerçek okuma 14. günden sonra yapılır.

---

## 9. BU PLANIN KAPSAMADIĞI KONULAR

- **GBP kategori değişimi risklidir.** Birincil kategoriyi değiştirmek yerel sıralamayı
  2-3 hafta olumsuz etkileyebilir. Mevcut birincil kategoriyi değiştirip değiştirmeyeceğinize
  siz karar vermelisiniz; ben profilinize erişemiyorum.
- **Yorum hacmi satın alınamaz.** §5'teki taktikler yalnızca gerçek misafir deneyimini
  görünür kılmayı hedefler.
- **Fiyat bilgisi verilmedi.** Fiyatlar dönemsel değiştiği için metinlere yazılmadı; menü
  sayfasına yönlendirme tercih edildi.
- **Rakip analizi yapılmadı.** İlk 3'teki ocakbaşıların içeriğini karşılaştırmak ayrı bir
  çalışma gerektirir.
