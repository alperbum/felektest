with open('menu.html', 'r', encoding='utf-8') as f:
    html = f.read()

start_marker = '    <!-- Google Fonts -->'
end_marker = '    <link rel="stylesheet" href="css/style.css">'

new_head = '    <!-- Google Fonts (Non-blocking & Instant Swap) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500&display=swap" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500&display=swap"></noscript>

    <!-- Local LCP Image Preloads -->
    <link rel="preload" as="image" href="https://www.felekmangalbasi.com/images/mezeler/mezeler.webp" type="image/webp" fetchpriority="high">
    <link rel="preload" as="image" href="https://www.felekmangalbasi.com/images/salatalar/salatalar.webp" type="image/webp" fetchpriority="high">
    <link rel="preload" as="image" href="https://www.felekmangalbasi.com/images/ana_yemekler/kapak.webp" type="image/webp" fetchpriority="high">

    <!-- Stylesheet -->
    <link rel="stylesheet" href="css/style.css">'

idx1 = html.find(start_marker)
idx2 = html.find(end_marker) + len(end_marker)

if idx1 != -1 and idx2 != -1:
    html = html[:idx1] + new_head + html[idx2:]
    with open('menu.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('menu.html updated!')
ilse:
    print('Markers not found!')

with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace("--serif: 'Cormorant Garamond', serif;", "--serif: 'Cormorant Garamond', 'Times New Roman', Georgia, serif;")
css = css.replace("--sans: 'DM Sans', sans-serif;", "--sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;")

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('css/style.css updated!')

with open('js/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("window.scrollTo({ top: 0, behavior: 'instant' });", "if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });")

if 'function normalizeImageUrl' not in js:
    normalizer = "\n    function normalizeImageUrl(url) {\n        if (!url) return '';\n        if (url.includes('supabase.co/storage/v1/object/public/images/')) {\n            return url.replace(/https?:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/images\//, 'https://www.felekmangalbasi.com/images/');\n        }\n        return url;\n    }\n"
    js = js.replace('// --- Language Switcher ---', normalizer + '\n    // --- Language Switcher ---')
    js = js.replace('image: c.image || ''', 'image: normalizeImageUrl(c.image)')
    js = js.replace('image: item.image || ''', 'image: normalizeImageUrl(item.image)')

with open('js/script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('js/script.js updated!')
