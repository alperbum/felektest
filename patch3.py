with open('js/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace('1781181361729_ct0z394n3.png', '1781181361729_ct0z394n3.webp')
js = js.replace('1781181314329_aux5wmuu3.png', '1781181314329_aux5wmuu3.webp')
js = js.replace('1781181200251_zd9ee47pn.png', '1781181200251_zd9ee47pn.webp')

js = js.replace('<h3 class="qr-category-card-title">', '<h2 class="qr-category-card-title">')
js = js.replace('</h3>\n                `;\n\n                // Prefetch', '</h2>\n                `;\n\n                // Prefetch')

import re
js = re.sub(r'let prefetchTimer = null;\s*function triggerIdlePrefetch\(\) \{[\s\S]*?prefetchTimer = setTimeout\(prefetchNextBatch, 3000\);\s*\}\);\s*\}', 'function triggerIdlePrefetch() { /* on-demand only */ }', js)

with open('js/script.js', 'w', encoding='utf-8') as f:
    f.write(js)

with open('menu.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('<script src="js/translations.js?v=4.0"></script>', '<script src="js/translations.js?v=4.0" defer></script>')
html = html.replace('<script src="js/config.js"></script>', '<script src="js/config.js" defer></script>')
html = html.replace('<script src="js/script.js?v=4.0"></script>', '<script src="js/script.js?v=4.0" defer></script>')

with open('menu.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('SPEED_FIXES_APPLIED')
