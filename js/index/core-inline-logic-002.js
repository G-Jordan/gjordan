
(function(){
  // This keeps the modal synced with your theme presets (including gradient extras).
  function applyAuthModalTheme(detail){
    const r = document.documentElement;
    const rootCS = getComputedStyle(r);

    // Pull page theme tokens
    const primary = rootCS.getPropertyValue('--app-primary').trim() || '#5fa0ff';
    const accent  = rootCS.getPropertyValue('--app-accent').trim()  || '#b478ff';

    // Optional gradient variables that your 100 presets might set
    // (progFill is a gradient string; we’ll use it for the primary button if present)
    const progFill = rootCS.getPropertyValue('--prog-fill').trim();

    // Push a couple of modal-scoped vars (so you can tweak without touching global)
    r.style.setProperty('--auth-title', accent);
    r.style.setProperty('--auth-close', accent);

    // Primary button bg: prefer --prog-fill if defined; fallback to primary→accent gradient
    const hasProg = !!progFill && !/^var\(/.test(progFill);
    r.style.setProperty('--auth-btn-bg',
      hasProg ? progFill : `linear-gradient(90deg, ${primary}, ${accent})`);

    // If a preset wants dark text on light gradient, allow it to override:
    // detail.ppIconColor or other custom signals can be used; default is dark text for contrast.
    const btnFg = (detail && detail.btnFg) || '#0b0d10';
    r.style.setProperty('--auth-btn-fg', btnFg);
  }

  // Initial sync on load
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>applyAuthModalTheme(), {once:true});
  } else {
    applyAuthModalTheme();
  }

  // Live updates whenever your theme tool broadcasts
  window.addEventListener('theme:changed', (e)=> applyAuthModalTheme(e.detail||{}), {passive:true});

  // Also update if someone changes root vars directly (rare but safe)
  const mo = new MutationObserver(()=>applyAuthModalTheme());
  mo.observe(document.documentElement, {attributes:true, attributeFilter:['style','class','data-theme']});
})();
