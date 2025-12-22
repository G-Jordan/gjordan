(function(){
  "use strict";

  // Ensure icons always follow their parent color (Safari-safe)
  (function injectIconInheritCSS(){
    if (document.getElementById('rxn-icon-inherit')) return;
    const s = document.createElement('style');
    s.id = 'rxn-icon-inherit';
    s.textContent = `
      #reaction-buttons i.material-icons{
        color: currentColor !important;
        -webkit-text-fill-color: currentColor !important;
        line-height: 1;
      }
    `;
    document.head.appendChild(s);
  })();

  const $ = (id)=> document.getElementById(id);
  const root = document.documentElement;

  function readVar(name, fallback){
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }

  function scrubIconInline(scope){
    const icons = (scope || document).querySelectorAll('#reaction-buttons i.material-icons');
    icons.forEach(i=>{
      i.style.removeProperty('color');
      i.style.removeProperty('-webkit-text-fill-color');
      i.style.removeProperty('text-fill-color');
    });
  }

  function applyReactionTheme(){
    const likeColor     = readVar('--app-primary', '#5fa0ff');
    const accentColor   = readVar('--app-accent',  '#b478ff');
    const dislikeColor  = readVar('--app-primary', '#5fa0ff');

    const likeBtn     = $('like-btn');
    const dislikeBtn  = $('dislike-btn');
    const downloadBtn = $('download-btn');

    if (likeBtn)     likeBtn.style.color     = likeColor;
    if (dislikeBtn)  dislikeBtn.style.color  = dislikeColor;
    if (downloadBtn) downloadBtn.style.color = accentColor;

    const rb = $('reaction-buttons');
    if (rb) {
      rb.querySelectorAll('button').forEach(btn=>{
        btn.style.background = `color-mix(in srgb, ${likeColor} 10%, transparent)`;
        btn.style.border = `1px solid color-mix(in srgb, ${likeColor} 22%, transparent)`;
        btn.style.borderRadius = '10px';
        btn.style.padding = '8px';
      });
    }
  }

  function boot(){
    scrubIconInline();
    applyReactionTheme();
    watchIcons();
  }

  // Watches:
  // 1) if something tries to set inline style on icons
  // 2) if icons are inserted later (your UI rebuilds often)
  let watching = false;
  function watchIcons(){
    if (watching) return;
    watching = true;

    const container = $('reaction-buttons') || document.body;
    if (!container) return;

    const mo = new MutationObserver(muts=>{
      for (const m of muts){
        if (m.type === 'attributes' && m.attributeName === 'style') {
          const t = m.target;
          if (t?.matches?.('#reaction-buttons i.material-icons')) {
            t.style.removeProperty('color');
            t.style.removeProperty('-webkit-text-fill-color');
            t.style.removeProperty('text-fill-color');
          }
        }

        if (m.type === 'childList' && (m.addedNodes?.length)) {
          // New buttons/icons inserted later — scrub them and re-theme
          scrubIconInline(container);
          applyReactionTheme();
        }
      }
    });

    mo.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style']
    });
  }

  // Run now or on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }

  // Re-apply when your theme system broadcasts a change
  window.addEventListener('theme:changed', applyReactionTheme);
  window.addEventListener('controls-theme-change', applyReactionTheme);

  // Your player already uses this event name in organizer-modal.js
  window.addEventListener('player:controls-theme', applyReactionTheme);

})();