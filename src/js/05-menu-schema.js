/* ==========================================================================
   05-menu-schema.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   Menu JSON-LD (schema.org/Menu) uretimi.
   Aramada ve AI yanitlarinda menu iceriginin yapisal olarak okunmasi icin.
   requestIdleCallback (yoksa setTimeout 1200ms) ile tembel calisir.
   Bagimlilik: categories, menuData, translations.
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */
    // --- Generate and Append JSON-LD Restaurant Menu Schema ---
    function generateMenuSchema() {
        const categoriesMap = {
            "mezeler": "Mezeler",
            "salatalar": "Salatalar",
            "ana_yemekler": "Et Çeşitleri",
            "tatli_meyve": "Tatlılar",
            "alkolsuz": "Alkolsüz İçecekler",
            "raki": "Rakılar",
            "viski": "Viskiler",
            "sarap": "Şaraplar",
            "biralar": "Biralar & Atıştırmalıklar",
            "votka_cin": "Votka & Cin"
        };

        const schema = {
            "@context": "https://schema.org",
            "@type": "Menu",
            "name": "Felek Mangalbaşı Menüsü",
            "description": "Felek Mangalbaşı'nın eşsiz et çeşitleri, özenle hazırlanan mezeleri, salataları ve içecek çeşitlerini içeren zengin menüsü.",
            "inLanguage": "tr",
            "hasMenuSection": []
        };

        const sections = {};
        for (const [key, value] of Object.entries(categoriesMap)) {
            sections[key] = {
                "@type": "MenuSection",
                "name": value,
                "hasMenuItem": []
            };
        }

        menuData.forEach(item => {
            const catId = item.categoryId;
            if (sections[catId]) {
                let rawPrice = item.price.replace(/[^\d,]/g, '').replace(',', '.');
                let parsedPrice = parseFloat(rawPrice);
                
                const menuItem = {
                    "@type": "MenuItem",
                    "name": item.title.tr || item.title
                };

                if (item.image) {
                    menuItem.image = item.image;
                }

                if (!isNaN(parsedPrice)) {
                    menuItem.offers = {
                        "@type": "Offer",
                        "price": parsedPrice.toFixed(2),
                        "priceCurrency": "TRY"
                    };
                }
                
                sections[catId].hasMenuItem.push(menuItem);
            }
        });

        schema.hasMenuSection = Object.values(sections).filter(sec => sec.hasMenuItem.length > 0);

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'restaurant-menu-jsonld';
        script.text = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }
    
    try {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => generateMenuSchema());
        } else {
            setTimeout(generateMenuSchema, 1200);
        }
    } catch (e) {
        console.error("Schema generation error:", e);
    }

    const menuGrid = document.getElementById('qr-menu-grid');