/* ==========================================================================
   FELEK MANGALBAŞI — Shared site chrome for the landing pages
   -------------------------------------------------------------------------
   Deliberately tiny and menu-free: the landing pages must not download the
   ~100 KB QR-menu bundle in js/script.js just to get a working nav bar.

   Handles: sticky header state, mobile menu, scroll-reveal, footer year,
   current-page nav highlight, single-open FAQ accordion.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {

    /* --- Sticky header --------------------------------------------------- */
    var header = document.getElementById('header');
    if (header) {
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.scrollY > 40);
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* --- Mobile menu ----------------------------------------------------- */
    var toggle = document.getElementById('menu-toggle');
    if (toggle && header) {
      var links = header.querySelectorAll('.nav-links a');

      toggle.addEventListener('click', function () {
        var isOpen = header.classList.toggle('active');
        toggle.classList.toggle('active', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
      });

      Array.prototype.forEach.call(links, function (link) {
        link.addEventListener('click', function () {
          header.classList.remove('active');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && header.classList.contains('active')) {
          header.classList.remove('active');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }

    /* --- Scroll reveal --------------------------------------------------- */
    var reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
      if (reduceMotion || !('IntersectionObserver' in window)) {
        Array.prototype.forEach.call(reveals, function (el) {
          el.classList.add('visible');
        });
      } else {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
      }
    }

    /* --- FAQ: keep a single answer open at a time ------------------------ */
    var faqItems = document.querySelectorAll('.land-faq .land-faq-item');
    if (faqItems.length > 1) {
      Array.prototype.forEach.call(faqItems, function (item) {
        item.addEventListener('toggle', function () {
          if (!item.open) return;
          Array.prototype.forEach.call(faqItems, function (other) {
            if (other !== item) other.open = false;
          });
        });
      });
    }

    /* --- Current page highlight in the nav ------------------------------- */
    var here = window.location.pathname.split('/').pop() || 'index.html';
    Array.prototype.forEach.call(document.querySelectorAll('.nav-links a'), function (a) {
      var target = (a.getAttribute('href') || '').split('/').pop().split('#')[0];
      if (!target) return;
      if (target === here) {
        a.setAttribute('aria-current', 'page');
      }
    });

    /* --- Footer year ----------------------------------------------------- */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    /* --- GA4 conversion tracking (landing pages) ------------------------- */
    document.addEventListener('click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (typeof window.gtag !== 'function') return;

      if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
        window.gtag('event', 'click_whatsapp_reservation', {
          event_category: 'conversion',
          event_label: (link.textContent || '').trim() || 'WhatsApp Rezervasyon',
          page_location: window.location.href
        });
      } else if (href.indexOf('tel:') === 0) {
        window.gtag('event', 'click_phone_call', {
          event_category: 'conversion',
          event_label: href.replace('tel:', ''),
          page_location: window.location.href
        });
      } else if (
        href.indexOf('maps.google') !== -1 ||
        href.indexOf('goo.gl/maps') !== -1 ||
        href.indexOf('maps.app.goo.gl') !== -1 ||
        href.indexOf('google.com/maps') !== -1
      ) {
        window.gtag('event', 'click_google_maps_direction', {
          event_category: 'engagement',
          event_label: 'Google Maps Yol Tarifi',
          page_location: window.location.href
        });
      }
    }, { passive: true });
  });
})();

