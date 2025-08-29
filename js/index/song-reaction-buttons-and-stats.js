
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

  function applyReactionTheme(){
    const likeColor     = readVar('--app-primary', '#5fa0ff');
    const accentColor   = readVar('--app-accent',  '#b478ff');
    const dislikeColor  = readVar('--app-primary', '#5fa0ff'); // opt-in var, else red

    const likeBtn     = $('like-btn');
    const dislikeBtn  = $('dislike-btn');
    const downloadBtn = $('download-btn');

    // Set only the color; icons inherit via CSS above
    if (likeBtn)     likeBtn.style.color     = likeColor;
    if (dislikeBtn)  dislikeBtn.style.color  = dislikeColor;
    if (downloadBtn) downloadBtn.style.color = accentColor;

    // Optional: on-hover chrome/background/border based on theme (comment out if not wanted)
    const rb = $('reaction-buttons');
    if (rb) {
      // Light themed chrome using app-primary; keep it subtle
      rb.querySelectorAll('button').forEach(btn=>{
        btn.style.background = `color-mix(in srgb, ${likeColor} 10%, transparent)`;
        btn.style.border = `1px solid color-mix(in srgb, ${likeColor} 22%, transparent)`;
        btn.style.borderRadius = '10px';
        btn.style.padding = '8px';
      });
    }
  }

  // Scrub any accidental inline black on inner <i> to avoid conflicts
  function scrubIconInline(){
    const icons = document.querySelectorAll('#reaction-buttons i.material-icons');
    icons.forEach(i=>{
      i.style.removeProperty('color');
      i.style.removeProperty('-webkit-text-fill-color');
      i.style.removeProperty('text-fill-color');
    });
  }

  function boot(){
    scrubIconInline();
    applyReactionTheme();
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

  // If something later tries to set icon colors inline, strip just that
  const mo = new MutationObserver(muts=>{
    for (const m of muts){
      if (m.type === 'attributes' && m.attributeName === 'style') {
        if (m.target.matches && m.target.matches('#reaction-buttons i.material-icons')){
          m.target.style.removeProperty('color');
          m.target.style.removeProperty('-webkit-text-fill-color');
        }
      }
    }
  });
  document.querySelectorAll('#reaction-buttons i.material-icons').forEach(icon=>{
    mo.observe(icon, {attributes:true, attributeFilter:['style']});
  });

})();
