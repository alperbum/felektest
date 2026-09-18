/* ==========================================================================
   09-analytics.js — Felek Mangalbaşı
   -----------------------------------------------------------------------
   GA4 donusum takibi (belge duzeyinde tek delege dinleyici).
   - click_whatsapp_reservation, click_phone_call,
     click_google_maps_direction
   Bagimlilik: gtag. Dis baglanti metni icin innerText yerine textContent
   kullanilir (innerText her ortamda tanimli degil ve reflow tetikler).
   -----------------------------------------------------------------------
   NOT: Bu dosya tek basina calismaz. tools/build.js tarafindan
   js/script.js icine birlestirilir; bu baslik blogu ciktiya girmez.
   ========================================================================== */

    // --- Google Analytics 4 (GA4) Unified Conversion Tracking ---
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        
        // 1. WhatsApp Reservation Tracking
        if (href.includes('wa.me') || href.includes('whatsapp.com')) {
            if (typeof gtag === 'function') {
                gtag('event', 'click_whatsapp_reservation', {
                    event_category: 'conversion',
                    event_label: (link.innerText || link.textContent || '').trim() || 'WhatsApp Rezervasyon',
                    page_location: window.location.href
                });
            }
        }
        // 2. Phone Call Tracking
        else if (href.startsWith('tel:')) {
            if (typeof gtag === 'function') {
                gtag('event', 'click_phone_call', {
                    event_category: 'conversion',
                    event_label: href.replace('tel:', ''),
                    page_location: window.location.href
                });
            }
        }
        // 3. Google Maps / Direction Tracking
        else if (href.includes('maps.google') || href.includes('goo.gl/maps') || href.includes('maps.app.goo.gl') || href.includes('google.com/maps')) {
            if (typeof gtag === 'function') {
                gtag('event', 'click_google_maps_direction', {
                    event_category: 'engagement',
                    event_label: 'Google Maps Yol Tarifi',
                    page_location: window.location.href
                });
            }
        }
    }, { passive: true });