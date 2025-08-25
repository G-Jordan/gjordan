// js/nav-height.js — keep page content below the fixed .navbar
(function () {
  'use strict';
  if (window.__navOffsetFixV4) return;
  window.__navOffsetFixV4 = true;

  const $ = (s) => document.querySelector(s);

  function ensureSpacer() {
    const nav = $('.navbar');
    if (!nav) return null;

    let sp = document.getElementById('nav-spacer');
    if (!sp) {
      sp = document.createElement('div');
      sp.id = 'nav-spacer';
      // insert directly after the navbar so it participates in normal flow
      nav.insertAdjacentElement('afterend', sp);
    }

    // make sure no stylesheet collapses or hides it
    sp.style.display = 'block';
    sp.style.width = '100%';
    sp.style.height = '0px'; // will be set below
    sp.style.margin = '0';
    sp.style.padding = '0';
    sp.style.border = '0';
    sp.style.pointerEvents = 'none';
    sp.style.zIndex = '0';
    return sp;
  }

  function measureNav() {
    const nav = $('.navbar');
    if (!nav) return 0;
    const r = nav.getBoundingClientRect();
    // use the larger to be safe with borders/scale
    return Math.max(Math.ceil(r.height || 0), nav.offsetHeight || 0);
  }

  let last = -1;

  function update(reason) {
    const sp = ensureSpacer();
    if (!sp) return;

    // kill any old body padding to avoid double offsets
    document.body.style.paddingTop = '0px';

    const base = Math.max(0, measureNav());
    if (base !== last) {
      sp.style.height = base + 'px';
      last = base;
    }

    // tiny safety cushion if first content still kisses the nav
    const topEl =
      document.getElementById('videoShell') ||
      $('#player') ||
      $('main') ||
      $('.container');

    if (topEl) {
      const rect = topEl.getBoundingClientRect();
      const needed = base + 2; // 2px cushion
      if (rect.top < needed) {
        sp.style.height = needed - rect.top + base + 'px';
      }
    }
  }

  function boot() {
    update('boot');

    const nav = $('.navbar');
    if (nav && 'ResizeObserver' in window) {
      try {
        new ResizeObserver(() => update('nav-resize')).observe(nav);
      } catch {}
    }

    // fonts/images can change navbar height slightly
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => update('fonts.ready')).catch(() => {});
    }

    window.addEventListener('load', () => update('load'), { passive: true });
    window.addEventListener('resize', () => update('resize'), { passive: true });
    window.addEventListener('orientationchange', () => update('orientation'), {
      passive: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();