/* ==========================================================================
   01-media-url.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   Gorsel URL normalizasyonu. Supabase Storage adreslerini sitenin
   kendi /images/ alt yoluna cevirir (CDN + onbellek birligi icin).
   Bagimlilik: yok.
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */
    function normalizeImageUrl(url) {
        if (!url) return '';
        if (url.includes('supabase.co/storage/v1/object/public/images/')) {
            return url.replace(/https?:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/images\//, 'https://www.felekmangalbasi.com/images/');
        }
        return url;
    }

    // --- Language Switcher ---
    const langSwitcher = document.getElementById('lang-switcher');