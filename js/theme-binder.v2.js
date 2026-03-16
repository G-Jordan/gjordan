/*!
 * Theme Binder v2.1 — precise navbar title + reactions + stats theming from main controls
 * Leaves: .music-list, Song Organizer, and .controls untouched.
 */
(()=>{
  const $ = (s, r=document)=>r.querySelector(s);
  const getVar = (el, v)=> getComputedStyle(el||document.documentElement).getPropertyValue(v).trim();
  const first = (...xs)=> xs.find(x=> (x||'').toString().trim())?.toString().trim() || '';
  const setRoot = (k,v)=> document.documentElement.style.setProperty(k,v);

  // color helpers
  const toRGB = (c)=>{
    const ctx = toRGB._ctx || (toRGB._ctx = document.createElement('canvas').getContext('2d'));
    ctx.fillStyle = '#000';
    try{ ctx.fillStyle = c; }catch{}
    const [r,g,b] = ctx.getImageData(0,0,1,1).data;
    return {r,g,b};
  };
  const mix = (a,b,t=0.5)=>{
    const A=toRGB(a),B=toRGB(b);
    const r=Math.round(A.r*(1-t)+B.r*t), g=Math.round(A.g*(1-t)+B.g*t), bl=Math.round(A.b*(1-t)+B.b*t);
    return `rgb(${r} ${g} ${bl})`;
  };

  function detect(){
    const root = document.documentElement;
    const controls = $('.controls') || document.body;
    const primary = first(
      getVar(root,'--mainThemeColor'),
      getVar(root,'--theme-primary'),
      getVar(root,'--primary-color'),
      getVar(controls,'--mainThemeColor'),
      getVar(controls,'--theme-primary'),
      getVar(controls,'--primary-color'),
      '#5fa0ff'
    );
    const accent = first(
      getVar(root,'--accentColor'),
      getVar(root,'--theme-accent'),
      getVar(root,'--secondary-color'),
      getVar(controls,'--accentColor'),
      getVar(controls,'--theme-accent'),
      getVar(controls,'--secondary-color'),
      '#b478ff'
    );
    return { primary, accent };
  }

  function applyVars(p,a){
    // global “app” vars others already read
    setRoot('--app-primary', p);
    setRoot('--app-accent',  a);
    setRoot('--prog-fill',   `linear-gradient(90deg, ${p}, ${a})`);

    // legacy/site tokens
    setRoot('--primary-color', p);
    setRoot('--accent-color',  a);
    setRoot('--glow-color',    p);

    // broadcast for any listeners (e.g., player list)
    window.dispatchEvent(new CustomEvent('theme:changed', {detail:{primary:p, accent:a}}));
  }

  // inject stylesheet (strong selectors + !important)
  function ensureStyle(){
    const id = 'theme-binder-v2';
    if (document.getElementById(id)) return;
    const css = `
/* === THEME BINDER v2 — DO NOT EDIT === */

/* NAVBAR + title */
.navbar{
  border-bottom: 1px solid color-mix(in srgb, var(--app-primary) 36%, transparent) !important;
}
.navbar .navbar-title{
  color: color-mix(in srgb, var(--app-primary) 88%, white 0%) !important;
  text-shadow: 0 0 10px color-mix(in srgb, var(--app-primary) 36%, transparent) !important;
}
.menu-icon{ color: var(--app-primary) !important; -webkit-text-fill-color: currentColor !important; }
.menu-icon.open{ color: var(--app-accent) !important; -webkit-text-fill-color: currentColor !important; }
.navbar .menu a{
  border: 1px solid color-mix(in srgb, var(--app-primary) 38%, transparent) !important;
  color: color-mix(in srgb, var(--app-primary) 85%, white 0%) !important;
  box-shadow: 0 0 10px color-mix(in srgb, var(--app-primary) 28%, transparent) !important;
}
.navbar .menu a:hover{
  color: color-mix(in srgb, var(--app-accent) 85%, white 0%) !important;
  outline: 1px solid color-mix(in srgb, var(--app-primary) 40%, transparent) !important;
}

/* TITLES & ARTISTS under thumbnails (outside .music-list only) */
:not(.music-list) .title,
:not(.music-list) .artist,
:not(.music-list) .name{
  color: color-mix(in srgb, var(--app-primary) 82%, white 0%) !important;
  text-shadow: 0 0 8px color-mix(in srgb, var(--app-primary) 28%, transparent) !important;
}

/* REACTION BUTTON CHROME */
#reaction-buttons button{
  border-radius: 10px !important;
  background: color-mix(in srgb, var(--app-primary) 10%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--app-primary) 22%, transparent) !important;
  box-shadow: 0 6px 18px rgba(0,0,0,.35), 0 0 10px color-mix(in srgb, var(--app-primary) 22%, transparent) !important;
}
#reaction-buttons button:hover{
  background: color-mix(in srgb, var(--app-accent) 14%, transparent) !important;
  border-color: color-mix(in srgb, var(--app-accent) 32%, transparent) !important;
}

/* STATS BOX (container) */
#song-stats{
  border-radius: 12px !important;
  border: 1px solid color-mix(in srgb, var(--app-primary) 30%, transparent) !important;
  box-shadow: 0 0 12px color-mix(in srgb, var(--app-primary) 24%, transparent) !important;
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--app-primary) 10%, transparent),
      color-mix(in srgb, var(--app-accent) 6%, transparent)) !important;
}

/* FOOTER */
footer, .branding-footer{
  border-top: 1px solid color-mix(in srgb, var(--app-primary) 26%, transparent) !important;
  color: color-mix(in srgb, var(--app-primary) 82%, white 0%) !important;
}
.branding-footer .tm{
  color: color-mix(in srgb, var(--app-accent) 88%, white 0%) !important;
  text-shadow: 0 0 6px color-mix(in srgb, var(--app-accent) 36%, transparent) !important;
}

/* VOLUME KNOB + generic ranges (outside music-list/controls) */
input[type="range"]:not(.eq-range):not(.g73-row-progress):not(.music-list *):not(.controls *){
  accent-color: var(--app-primary) !important;
}
input[type="range"]:not(.eq-range):not(.g73-row-progress):not(.music-list *):not(.controls *)::-webkit-slider-thumb{
  border: 1px solid color-mix(in srgb, var(--app-primary) 50%, transparent) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-primary) 30%, transparent) !important;
}

/* EQ + VISUALIZER EDITOR LAUNCHERS */
#open-eq,
#vz-open-editor{
  outline: 1px solid color-mix(in srgb, var(--app-accent) 22%, transparent) !important;
  box-shadow: 0 0 12px color-mix(in srgb, var(--app-primary) 28%, transparent) !important;
}

/* Explicit exclusions to leave your main controls + music list alone */
.music-list, .music-list * {}
.controls, .controls * {}
#song-organizer, #song-organizer * {}
`;
    const el = document.createElement('style');
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }

  let pending = false;
  const doApply = ()=>{
    pending = false;
    const {primary, accent} = detect();
    applyVars(primary, accent);
    ensureStyle();
  };
  function apply(){
    if (pending) return;
    pending = true;
    requestAnimationFrame(doApply);
  }

  // public hook if your controls broadcast changes
  window.addEventListener('controls-theme-change', e=>{
    const d = e.detail||{};
    const current = detect();
    applyVars(d.primary || current.primary, d.accent || current.accent);
    ensureStyle();
  });

  // MutationObserver: watch only root attribute changes likely to affect theme tokens
  const mo = new MutationObserver(apply);
  mo.observe(document.documentElement, {
    attributes:true,
    attributeFilter:['style','class','data-theme']
  });

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', apply, {once:true});
  } else apply();

  // optional manual trigger
  window.ThemeBinderV2 = { apply };
})();