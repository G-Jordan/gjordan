// js/site-core.js
(function(){
  'use strict';
  if (window.__g73SiteCoreLoaded) return;
  window.__g73SiteCoreLoaded = true;

  function optimizeImages(){
    const imgs = Array.from(document.images || []);
    imgs.forEach((img, i) => {
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
      const important = img.closest('.img-area, .profile-pic-wrapper, .hero, .top-bar, .g73on__art');
      if (important && i < 2) {
        if (!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'high');
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'eager');
      } else {
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
        if (!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'low');
      }
    });
  }

  function markDeferredSections(){
    document.querySelectorAll('footer, .seo-bio, .quick-links-wrap, .official-links, .branding-footer, .social-links').forEach((el) => {
      if (!el.dataset.cvAuto) {
        el.dataset.cvAuto = '1';
        el.style.contentVisibility = 'auto';
        if (!el.style.containIntrinsicSize) el.style.containIntrinsicSize = '1px 640px';
      }
    });
  }

  function ensureMenuHidden(){
    const menu = document.getElementById('menu');
    if (menu && !menu.classList.contains('show') && !menu.hasAttribute('hidden')) menu.hidden = true;
  }

  function ensureNavSpacer(){
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    let sp = document.getElementById('nav-spacer');
    if (!sp) {
      sp = document.createElement('div');
      sp.id = 'nav-spacer';
      nav.insertAdjacentElement('afterend', sp);
    }
    const h = Math.max(Math.ceil(nav.getBoundingClientRect().height || 0), nav.offsetHeight || 0);
    sp.style.cssText = 'display:block;width:100%;margin:0;padding:0;border:0;pointer-events:none;z-index:0;height:'+h+'px';
    document.body.style.paddingTop = '0px';
  }

  function boot(){
    ensureMenuHidden();
    ensureNavSpacer();
    optimizeImages();
    markDeferredSections();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener('load', () => {
    ensureNavSpacer();
    optimizeImages();
  }, { once: true, passive: true });
  window.addEventListener('resize', ensureNavSpacer, { passive: true });
  window.addEventListener('orientationchange', ensureNavSpacer, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(ensureNavSpacer).catch(() => {});
})();
