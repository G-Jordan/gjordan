/* Phase 3 consolidated homepage boot bundle */
/* Generated from legacy js/index fragments to reduce script-tag sprawl without changing behavior. */

/* ===== BEGIN core-inline-logic-001.js ===== */


  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }

  // 1) Consent Mode defaults (safe & tweakable later)
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });

  // 2) Init + config
  gtag('js', new Date());
  gtag('config', 'G-L48EX09QBQ', {
    send_page_view: true,
    // Helpful while developing locally:
    ...(location.hostname === 'localhost' ? { debug_mode: true } : {})
  });


/* ===== END core-inline-logic-001.js ===== */


/* ===== BEGIN core-inline-logic-002.js ===== */


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


/* ===== END core-inline-logic-002.js ===== */


/* ===== BEGIN core-inline-logic-005.js ===== */

window.__VZ_EMBEDDED = true;

/* ===== END core-inline-logic-005.js ===== */


/* ===== BEGIN core-inline-logic-006.js ===== */


/* Simple/Pro toggle that layers on top of equalizer.js (no edits to your file) */
(function(){
  const modeBtn   = document.getElementById('eq-mode');
  const bandsWrap = document.getElementById('eq-bands');
  const preamp    = document.getElementById('eq-preamp');
  if (!modeBtn || !bandsWrap || !window.equalizerAPI) return;

  const STORE_KEY = 'eqMode.v1';

  // Group the 10 pro bands into 5 "simple" bands
  // Indices correspond to the freqs you used: [60,170,310,600,1000,3000,6000,12000,14000,16000]
  const GROUPS = [
    { name: 'Low',      idx: [0,1] },        // 60, 170
    { name: 'Low-Mid',  idx: [2,3] },        // 310, 600
    { name: 'Mid',      idx: [4,5] },        // 1k, 3k
    { name: 'High-Mid', idx: [6,7] },        // 6k, 12k
    { name: 'High',     idx: [8,9] },        // 14k, 16k
  ];

  // Build the 5 simple sliders once and keep them hidden when in Pro mode
  const simpleWrap = document.createElement('div');
  simpleWrap.className = 'eq-bands simple-bands';
  simpleWrap.style.display = 'none';

  const simpleSliders = []; // {input, out, group}
  GROUPS.forEach(group => {
    const wrap = document.createElement('div');
    wrap.className = 'eq-band';

    const label = document.createElement('label');
    label.textContent = group.name;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = -12;
    input.max =  12;
    input.step = 0.1;
    input.value = 0;

    const out = document.createElement('output');
    out.textContent = '0 dB';

    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      // Push simple value to all pro bands in this group
      group.idx.forEach(i => window.equalizerAPI.setBand(i, v));
      out.textContent = (v>0?'+':'') + v.toFixed(1) + ' dB';
      // Persist full EQ state (equalizerAPI already persists on setBand)
      persistMode(currentMode);
    });

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(out);
    simpleWrap.appendChild(wrap);

    simpleSliders.push({ input, out, group });
  });

  // Insert the simple block right before the pro 10-band block
  bandsWrap.parentNode.insertBefore(simpleWrap, bandsWrap);

  function avg(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }

  function syncSimpleFromPro(){
    // Read current pro values and set each simple slider to the average of its group
    const st = window.equalizerAPI.getSettings();
    if (!st || !Array.isArray(st.bands)) return;
    simpleSliders.forEach(({input, out, group})=>{
      const values = group.idx.map(i => st.bands[i] ?? 0);
      const v = avg(values);
      input.value = v;
      out.textContent = (v>0?'+':'') + v.toFixed(1) + ' dB';
    });
  }

  function syncProFromSimple(){
    // Push each simple slider value to its grouped pro bands
    simpleSliders.forEach(({input, group})=>{
      const v = parseFloat(input.value);
      group.idx.forEach(i => window.equalizerAPI.setBand(i, v));
    });
  }

  function applyMode(mode){
    // Visual toggle
    if (mode === 'simple'){
      simpleWrap.style.display = '';
      bandsWrap.style.display  = 'none';
      modeBtn.setAttribute('aria-pressed', 'true');
      modeBtn.title = 'Switch to Pro';
      // Initialize simple sliders from current pro values
      syncSimpleFromPro();
    }else{
      simpleWrap.style.display = 'none';
      bandsWrap.style.display  = '';
      modeBtn.setAttribute('aria-pressed', 'false');
      modeBtn.title = 'Switch to Simple';
      // When leaving simple, push simple values to pro so it "sticks"
      syncProFromSimple();
    }
  }

  function persistMode(mode){
    try{ localStorage.setItem(STORE_KEY, mode); }catch{}
  }
  function restoreMode(){
    try{
      const m = localStorage.getItem(STORE_KEY);
      return (m === 'simple' || m === 'pro') ? m : 'simple'; // default to simple UI
    }catch{ return 'simple'; }
  }

  let currentMode = restoreMode();
  applyMode(currentMode);

  modeBtn.addEventListener('click', ()=>{
    currentMode = (currentMode === 'simple') ? 'pro' : 'simple';
    applyMode(currentMode);
    persistMode(currentMode);
  });

  // If user changes preset or resets EQ in Pro while Simple is active later,
  // keep the simple UI in sync the next time it’s shown.
  // Hook some common events:
  document.getElementById('eq-preset')?.addEventListener('change', ()=>{
    if (currentMode === 'simple') syncSimpleFromPro();
  });
  document.getElementById('eq-reset')?.addEventListener('click', ()=>{
    setTimeout(()=>{ if (currentMode === 'simple') syncSimpleFromPro(); }, 0);
  });
  document.getElementById('eq-enable')?.addEventListener('change', ()=>{
    if (currentMode === 'simple') syncSimpleFromPro();
  });

  // Also re-sync when the modal opens (in case values changed while closed)
  (function watchModal(){
    const modal = document.getElementById('eq-modal');
    if (!modal) return;
    const mo = new MutationObserver(()=>{
      const open = modal.getAttribute('aria-hidden') === 'false';
      if (open && currentMode === 'simple') syncSimpleFromPro();
    });
    mo.observe(modal, { attributes:true, attributeFilter:['aria-hidden'] });
  })();
})();


/* ===== END core-inline-logic-006.js ===== */


/* ===== BEGIN navbar-height-setter-for-container-padding.js ===== */


    document.addEventListener('DOMContentLoaded', () => {
      const nav = document.querySelector('.navbar');
      if (nav) {
        const navHeight = nav.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--navbar-h', navHeight + 'px');
      }
    });
  

/* ===== END navbar-height-setter-for-container-padding.js ===== */


/* ===== BEGIN visualizer-orb-builder-builds-the-animated-orb-inside-vz-ope.js ===== */


  (function(){
    const btn = document.getElementById('vz-open-editor');
    if(!btn) return;

    btn.innerHTML = `
      <svg class="vz-orb" viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="vz-g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stop-color="#4ad6ff"/>
            <stop offset="50%" stop-color="#7aa6ff"/>
            <stop offset="100%" stop-color="#b07bff"/>
            <animateTransform attributeName="gradientTransform" type="rotate" from="0 0.5 0.5" to="360 0.5 0.5" dur="14s" repeatCount="indefinite"/>
          </linearGradient>
          <linearGradient id="vz-g2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stop-color="#59ffc8"/>
            <stop offset="50%" stop-color="#66b3ff"/>
            <stop offset="100%" stop-color="#ff8af5"/>
            <animateTransform attributeName="gradientTransform" type="rotate" from="360 0.5 0.5" to="0 0.5 0.5" dur="18s" repeatCount="indefinite"/>
          </linearGradient>
          <filter id="vz-softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g class="no-reduce" style="transform-origin:24px 24px; animation: orb-spin 7.5s linear infinite, orb-breathe 5.6s ease-in-out infinite;">
          <g filter="url(#vz-softGlow)">
            <circle cx="24" cy="24" r="13.2" fill="none" stroke="url(#vz-g1)"
              stroke-width="2.6" stroke-linecap="round" stroke-dasharray="12 10" pathLength="100"
              class="no-reduce" style="animation: dash-flow 3.2s linear infinite;" />
          </g>
          <g style="transform-origin:24px 24px; animation: orb-spin 11s linear reverse infinite;">
            <circle cx="24" cy="24" r="9.4" fill="none" stroke="url(#vz-g2)"
              stroke-width="2.2" stroke-linecap="round" pathLength="100"
              class="no-reduce" style="animation: dash-flow 4.1s linear infinite;" />
          </g>
          <circle cx="24" cy="24" r="2.4" fill="#a7d8ff" fill-opacity=".6"/>
        </g>
      </svg>
    `;

    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    }, {passive:true});
  })();
  

/* ===== END visualizer-orb-builder-builds-the-animated-orb-inside-vz-ope.js ===== */


/* ===== BEGIN volume-knob-handler-volume-knob-logic.js ===== */


  (function(){
    const knob = document.getElementById('volume-knob');
    const label = document.getElementById('knob-label');
    const audio = document.getElementById('main-audio');
    if (!knob || !label || !audio) return;

    const svg   = knob.querySelector('svg');
    const arc   = knob.querySelector('.arc');
    const handle= knob.querySelector('.handle');

    const R = 34;
    const CX = 50, CY = 50;
    const MIN_ANG = -135;
    const MAX_ANG =  135;

    const VOL_KEY = 'playerVolume';

    const clamp = (n, a, b)=> Math.max(a, Math.min(b, n));

    function setArcPath(fromDeg, toDeg){
      const p2c = (cx, cy, r, deg)=>{
        const rad = (deg-90) * Math.PI/180;
        return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
      };
      const start = p2c(CX, CY, R, fromDeg);
      const end   = p2c(CX, CY, R, toDeg);
      let sweep = toDeg - fromDeg;
      if (sweep < 0) sweep += 360;
      const largeArc = sweep >= 180 ? 1 : 0;
      const d = `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
      arc.setAttribute('d', d);
    }

    function angleForVolume(v){ return MIN_ANG + (MAX_ANG - MIN_ANG) * v; }
    function volumeForAngle(deg){ return clamp((deg - MIN_ANG) / (MAX_ANG - MIN_ANG), 0, 1); }

    function updateVisual(v){
      const vol = clamp(v, 0, 1);
      const deg = angleForVolume(vol);

      setArcPath(MIN_ANG, deg);

      const rad = (deg-90) * Math.PI/180;
      const hx = CX + R * Math.cos(rad);
      const hy = CY + R * Math.sin(rad);
      handle.setAttribute('cx', hx);
      handle.setAttribute('cy', hy);

      const pct = Math.round(vol*100);
      label.textContent = pct + '%';
      knob.setAttribute('aria-valuenow', pct);
      knob.setAttribute('aria-valuetext', pct + '%');
    }

    function setVolume(v, fromUser=false){
      v = clamp(v, 0, 1);
      audio.volume = v;
      updateVisual(v);
      if (fromUser) {
        try { localStorage.setItem(VOL_KEY, String(v)); } catch {}
      }
    }

    let initial = 1;
    try {
      const saved = localStorage.getItem(VOL_KEY);
      if (saved != null && !isNaN(saved)) initial = clamp(parseFloat(saved), 0, 1);
    } catch{}
    setVolume(initial, false);

    audio.addEventListener('volumechange', ()=> updateVisual(audio.volume), {passive:true});

    let dragging = false;
    function getAngleFromEvent(e){
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top  + rect.height/2;
      const x = (e.clientX != null) ? e.clientX : (e.touches?.[0]?.clientX || 0);
      const y = (e.clientY != null) ? e.clientY : (e.touches?.[0]?.clientY || 0);
      const dx = x - cx;
      const dy = y - cy;
      let deg = Math.atan2(dy, dx) * 180/Math.PI + 90; // 0° at top
      if (deg > 180) deg -= 360;                        // normalize
      deg = clamp(deg, MIN_ANG, MAX_ANG);               // clamp to arc
      return deg;
    }

    const onDown = (e)=>{ dragging = true; knob.focus(); e.preventDefault(); };
    const onMove = (e)=>{
      if (!dragging) return;
      const deg = getAngleFromEvent(e);
      setVolume(volumeForAngle(deg), true);
      e.preventDefault();
    };
    const onUp = ()=>{ dragging = false; };

    knob.addEventListener('pointerdown', onDown, {passive:false});
    window.addEventListener('pointermove', onMove, {passive:false});
    window.addEventListener('pointerup', onUp, {passive:true});

    knob.addEventListener('touchstart', onDown, {passive:false});
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', onUp, {passive:true});

    knob.addEventListener('wheel', (e)=>{
      e.preventDefault();
      const step = (e.deltaY < 0 ? 0.04 : -0.04);
      setVolume(audio.volume + step, true);
    }, {passive:false});

    knob.addEventListener('keydown', (e)=>{
      let v = audio.volume;
      const fine = 0.02, coarse = 0.1;
      switch(e.key){
        case 'ArrowRight':
        case 'ArrowUp':   setVolume(v + fine, true); e.preventDefault(); break;
        case 'ArrowLeft':
        case 'ArrowDown': setVolume(v - fine, true); e.preventDefault(); break;
        case 'PageUp':    setVolume(v + coarse, true); e.preventDefault(); break;
        case 'PageDown':  setVolume(v - coarse, true); e.preventDefault(); break;
        case 'Home':      setVolume(0, true); e.preventDefault(); break;
        case 'End':       setVolume(1, true); e.preventDefault(); break;
        case 'm':
        case 'M':
          if (audio.volume > 0){ knob._lastVol = audio.volume; setVolume(0, true); }
          else setVolume(Math.max(0, Math.min(knob._lastVol || 0.6, 1)), true);
          e.preventDefault();
          break;
      }
    });

  })();
  

/* ===== END volume-knob-handler-volume-knob-logic.js ===== */


/* ===== BEGIN core-inline-logic-015.js ===== */


/*!
 * G73 EQ Button Animator – Fixed Gradient (Blue → Purple)
 * - Always uses same gradient for bars
 * - Circular button, smooth animation, "EQ" overlay
 */
(function(){
  const btn = document.getElementById('open-eq');
  if(!btn) return;

  // ---------- Scoped CSS ----------
  const css = `
  #open-eq.eq-fab{
    --eqbtn-size: 64px;
    --eqbtn-bg: color-mix(in srgb, #0b0f14 78%, transparent);
    --eqbtn-border: rgba(255,255,255,.12);
    --eqbtn-ring: rgba(120,200,255,.35);

    width: var(--eqbtn-size) !important;
    height: var(--eqbtn-size) !important;
    border-radius: 50% !important;
    display: grid !important; place-items: center !important;
    background: var(--eqbtn-bg) !important;
    border: 1px solid var(--eqbtn-border) !important;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 8px 22px rgba(0,0,0,.45) !important;
    padding: 0 !important;
    position: relative !important;
    overflow: hidden !important;
  }
  #open-eq.eq-fab:hover{
    box-shadow: 0 10px 28px rgba(0,0,0,.5), 0 0 0 3px var(--eqbtn-ring) !important;
    transform: translateY(-1px);
  }
  #open-eq .eq-ico{ width: 66%; height: 66%; display:block; }
  #open-eq .eq-ico .bar{
    transform-origin: 50% 100%;
    animation: g73-eq-bounce 2.25s cubic-bezier(.42,0,.2,1) infinite;
    animation-play-state: paused;
  }
  #open-eq.is-playing .eq-ico .bar{ animation-play-state: running; }
  #open-eq:not(.is-playing) .eq-ico .bar{
    animation: g73-eq-idle 6.6s cubic-bezier(.42,0,.2,1) infinite;
    animation-play-state: running; opacity: .9;
  }
  @media (prefers-reduced-motion: reduce){
    #open-eq .eq-ico .bar{ animation: none !important; }
  }
  #open-eq .eq-label{
    position: absolute; inset: 0;
    display: grid; place-items: center;
    pointer-events: none; user-select: none;
    font-weight: 800; letter-spacing: .04em; font-size: 14px;
    color: #ffffff;
    text-shadow: 0 0 2px rgba(0,0,0,.55), 0 1px 6px rgba(0,0,0,.45);
  }
  #open-eq .eq-label::after{
    content: '';
    position: absolute; width: 46%; height: 1px; bottom: 16%;
    left: 27%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
    filter: blur(.3px);
  }
  @keyframes g73-eq-bounce{
    0%   { transform: scaleY(.28); }
    18%  { transform: scaleY(.92); }
    36%  { transform: scaleY(.44); }
    54%  { transform: scaleY(.80); }
    72%  { transform: scaleY(.38); }
    100% { transform: scaleY(.70); }
  }
  @keyframes g73-eq-idle{
    0%,100%{ transform: scaleY(.42); }
    50%    { transform: scaleY(.56); }
  }
  `;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

  // ---------- Render ----------
  function render(){
    btn.innerHTML = `
      <svg class="eq-ico" viewBox="0 0 48 48" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="g73-eq-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#5fa0ff"/>
            <stop offset="100%" stop-color="#b478ff"/>
          </linearGradient>
          <filter id="g73-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g filter="url(#g73-soft)">
          <rect class="bar" x="8.5"  y="10" width="5" height="28" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.00s"></rect>
          <rect class="bar" x="17.5" y="6"  width="5" height="32" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.30s"></rect>
          <rect class="bar" x="26.5" y="12" width="5" height="26" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.60s"></rect>
          <rect class="bar" x="35.5" y="4"  width="5" height="34" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.90s"></rect>
          <rect class="bar" x="22"   y="8"  width="3" height="30" rx="1.5" fill="url(#g73-eq-grad)" style="animation-delay:-1.20s; opacity:.9"></rect>
        </g>
      </svg>
      <div class="eq-label">EQ</div>
    `;
  }

  render();

  // ---------- Playback state ----------
  const audio = document.getElementById('main-audio');
  if (audio){
    const setState = ()=> btn.classList.toggle('is-playing', !audio.paused && !audio.ended && audio.currentTime > 0);
    ['play','playing','pause','ended','timeupdate'].forEach(ev=>audio.addEventListener(ev, setState, {passive:true}));
    setTimeout(setState, 0);
  }

  btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Open Equalizer');
})();


/* ===== END core-inline-logic-015.js ===== */


/* ===== BEGIN organizer-modal-inline.js ===== */


(function syncListTheme(){
  const src = document.querySelector('.controls[data-ctl-theme]') || document.querySelector('.controls');
  const dst = document.querySelector('.music-list');
  if (!src || !dst) return;

  const props = [
    '--prog-fill','--ctl-bg','--ctl-border','--ctl-text',
    '--ctl-ring','--ctl-list-accent1','--ctl-list-accent2',
    '--primary-color','--secondary-color','--mainThemeColor','--accentColor'
  ];
  const cs = getComputedStyle(src);
  props.forEach(p=>{
    const v = cs.getPropertyValue(p);
    if (v && v.trim()) dst.style.setProperty(p, v);
  });

  // Re-sync when your theme changes (attribute swap or custom event)
  const mo = new MutationObserver(()=> syncListTheme());
  mo.observe(src, { attributes: true, attributeFilter: ['data-ctl-theme','style','class'] });
  window.addEventListener('theme:changed', syncListTheme);
})();


/* ===== END organizer-modal-inline.js ===== */


/* ===== BEGIN core-inline-logic-017.js ===== */


(function(){
  "use strict";

  /* -------- CSS (injected) -------- */
  const css = `
  :root{
    --app-primary: var(--mainThemeColor, #5fa0ff);
    --app-accent:  var(--accentColor,    #b478ff);
  }

  /* palette trigger */
  .icon-btn{all:unset;display:inline-grid;place-items:center;cursor:pointer;border-radius:10px;padding:6px}
  .icon-btn i.material-icons{
    font-size:22px; line-height:1;
    color: var(--app-primary); -webkit-text-fill-color: currentColor;
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--app-primary) 35%, transparent));
  }

  /* viewport-safe modal */
  #site-theme-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:100000;padding:16px}
  #site-theme-modal.open{display:flex}
  #site-theme-modal .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
  #site-theme-modal .panel{
    position:relative;background:rgba(20,22,28,.92);color:#e8eef5;border:1px solid rgba(255,255,255,.12);
    border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.55);width:min(94vw, 960px);max-height:min(88vh, 920px);overflow:auto;outline:none;margin:auto;
  }
  @media(max-width:640px) and (orientation:portrait){
    #site-theme-modal{align-items:flex-end;padding:0}
    #site-theme-modal .panel{width:100vw;max-width:none;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:80vh}
  }
  #site-theme-modal .head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
  #site-theme-modal .head h3{margin:0;font:800 15px/1.2 system-ui,Segoe UI,Roboto}
  #site-theme-modal .grid{display:grid;grid-template-columns:repeat(10,1fr);gap:8px;padding:12px}
  #site-theme-modal .studio{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:0 12px 14px}
  #site-theme-modal .studio .field{display:grid;gap:6px;text-align:left}
  #site-theme-modal .studio label{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.9}
  #site-theme-modal .studio select,#site-theme-modal .studio input[type=range]{width:100%}
  #site-theme-modal .studio .help{font-size:11px;opacity:.72}
  #site-theme-modal .actions{display:flex;flex-wrap:wrap;gap:10px;padding:0 16px 16px}
  #site-theme-modal .theme-action{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#f6f8fc;padding:10px 12px;border-radius:12px;font:700 12px/1 system-ui,sans-serif;cursor:pointer}
  #site-theme-modal .theme-action:hover{transform:translateY(-1px);box-shadow:0 10px 20px rgba(0,0,0,.22)}
  @media(max-width:720px){ #site-theme-modal .studio{grid-template-columns:1fr} }
  .swatch{height:34px;border-radius:9px;border:2px solid rgba(255,255,255,.55);box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;transition:transform .12s,box-shadow .12s,border-color .12s}
  .swatch:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(0,0,0,.45);border-color:rgba(255,255,255,.85)}
  .swatch:focus-visible{outline:2px solid var(--app-primary);outline-offset:2px;border-color:var(--app-primary)}

  /* lightweight bindings */
  .navbar-title{
    color:var(--accent-color, var(--app-accent,#b478ff)) !important;
    text-shadow:0 0 8px color-mix(in srgb, var(--app-primary,#5fa0ff) 55%, transparent)
  }

  footer,.branding-footer{
    border-top:1px solid color-mix(in srgb, var(--app-accent,#b478ff) 35%, transparent);
    box-shadow:0 0 10px color-mix(in srgb, var(--app-accent,#b478ff) 20%, transparent)
  }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-g73-theme','1');
  style.textContent = css;
  document.head.appendChild(style);

/* -------- Presets (100 total: 25 solid, 25 gradient2, 25 gradient3, 25 gradient4) -------- */
const PRESETS = [
  /* === 25 SOLID === */
  {type:'solid', main:'#ff4757', accent:'#ffa502', name:'Cherry Ember'},
  {type:'solid', main:'#3742fa', accent:'#1e90ff', name:'Ultramarine Duo'},
  {type:'solid', main:'#2ed573', accent:'#1abc9c', name:'Spring Mint'},
  {type:'solid', main:'#eccc68', accent:'#ff7f50', name:'Sunset Sorbet'},
  {type:'solid', main:'#ff6b81', accent:'#ff4757', name:'Rose Heat'},
  {type:'solid', main:'#7bed9f', accent:'#2ed573', name:'Matcha Pop'},
  {type:'solid', main:'#70a1ff', accent:'#1e90ff', name:'Skyline Blue'},
  {type:'solid', main:'#a29bfe', accent:'#6c5ce7', name:'Lavender Beam'},
  {type:'solid', main:'#ff9ff3', accent:'#e84393', name:'Candy Bloom'},
  {type:'solid', main:'#ffbe76', accent:'#f0932b', name:'Golden Tangerine'},
  {type:'solid', main:'#badc58', accent:'#6ab04c', name:'Lime Meadow'},
  {type:'solid', main:'#f8a5c2', accent:'#f78fb3', name:'Peony Mist'},
  {type:'solid', main:'#c7ecee', accent:'#7ed6df', name:'Aqua Wash'},
  {type:'solid', main:'#30336b', accent:'#130f40', name:'Indigo Night'},
  {type:'solid', main:'#ffb142', accent:'#e58e26', name:'Amber Glow'},
  {type:'solid', main:'#cd84f1', accent:'#8854d0', name:'Violet Drift'},
  {type:'solid', main:'#ff3838', accent:'#ff4d4d', name:'Alarm Red'},
  {type:'solid', main:'#3ae374', accent:'#2ed573', name:'Neon Leaf'},
  {type:'solid', main:'#67e6dc', accent:'#1abc9c', name:'Seafoam'},
  {type:'solid', main:'#7158e2', accent:'#3742fa', name:'Purple Core'},
  {type:'solid', main:'#ff9f1a', accent:'#ffa502', name:'Citrus Peel'},
  {type:'solid', main:'#2f3542', accent:'#57606f', name:'Slate Pulse'},
  {type:'solid', main:'#dff9fb', accent:'#c7ecee', name:'Ice Shard'},
  {type:'solid', main:'#ff6f61', accent:'#e74c3c', name:'Coral Crush'},
  {type:'solid', main:'#00b894', accent:'#55efc4', name:'Teal Breeze'},

  /* === 25 GRADIENT2 (two-stop) === */
  {type:'gradient2', main:'#ff4d6d', accent:'#ffd166', name:'Magma Pop',
    progFill:'linear-gradient(90deg,#ff4d6d,#ffd166)', iconGrad:'linear-gradient(90deg,#ff4d6d,#ffd166)', progBg:'rgba(255,180,150,.12)'},
  {type:'gradient2', main:'#54e0ff', accent:'#b37aff', name:'Neon Glass',
    progFill:'linear-gradient(90deg,#54e0ff,#b37aff)', iconGrad:'linear-gradient(90deg,#54e0ff,#b37aff)'},
  {type:'gradient2', main:'#87b4ff', accent:'#bcd4ff', name:'Steel Sky',
    progFill:'linear-gradient(90deg,#87b4ff,#bcd4ff)', iconGrad:'linear-gradient(90deg,#a8bed3,#e8eef7)'},
  {type:'gradient2', main:'#c79c46', accent:'#ffde87', name:'Gilded Onyx',
    progFill:'linear-gradient(90deg,#c79c46,#ffde87)', iconGrad:'linear-gradient(90deg,#c79c46,#ffde87)'},
  {type:'gradient2', main:'#d38b5d', accent:'#ffe0a1', name:'Tape Tan',
    progFill:'linear-gradient(90deg,#d38b5d,#ffe0a1)', iconGrad:'linear-gradient(90deg,#d38b5d,#ffe0a1)'},
  {type:'gradient2', main:'#ff8a66', accent:'#ffd36e', name:'Warm Sunset',
    progFill:'linear-gradient(90deg,#ff8a66,#ffd36e)', iconGrad:'linear-gradient(90deg,#ff8a66,#ffd36e)'},
  {type:'gradient2', main:'#38ff80', accent:'#b8ffc8', name:'Terminal Beam',
    progFill:'linear-gradient(90deg,#38ff80,#b8ffc8)', iconGrad:'linear-gradient(90deg,#38ff80,#b8ffc8)'},
  {type:'gradient2', main:'#78c7ff', accent:'#9be7ff', name:'Oceanic Fade',
    progFill:'linear-gradient(90deg,#78c7ff,#9be7ff)', iconGrad:'linear-gradient(90deg,#78c7ff,#9be7ff)'},
  {type:'gradient2', main:'#9dff6a', accent:'#d6ff8a', name:'Cyber Lime',
    progFill:'linear-gradient(90deg,#9dff6a,#d6ff8a)', iconGrad:'linear-gradient(90deg,#9dff6a,#d6ff8a)'},
  {type:'gradient2', main:'#c9a8ff', accent:'#a8e3ff', name:'Lavender Ice',
    progFill:'linear-gradient(90deg,#c9a8ff,#a8e3ff)', iconGrad:'linear-gradient(90deg,#c9a8ff,#a8e3ff)'},
  {type:'gradient2', main:'#ff914d', accent:'#ffc46b', name:'Ember Heat',
    progFill:'linear-gradient(90deg,#ff914d,#ffc46b)', iconGrad:'linear-gradient(90deg,#ff914d,#ffc46b)'},
  {type:'gradient2', main:'#ff9ec7', accent:'#ffd1e6', name:'Rose Quartz',
    progFill:'linear-gradient(90deg,#ff9ec7,#ffd1e6)', iconGrad:'linear-gradient(90deg,#ff9ec7,#ffd1e6)'},
  {type:'gradient2', main:'#57ffa6', accent:'#69c8ff', name:'Aurora Glow',
    progFill:'linear-gradient(90deg,#57ffa6,#69c8ff)', iconGrad:'linear-gradient(90deg,#57ffa6,#69c8ff)'},
  {type:'gradient2', main:'#a78bfa', accent:'#f0abfc', name:'Grape Soda',
    progFill:'linear-gradient(90deg,#a78bfa,#f0abfc)', iconGrad:'linear-gradient(90deg,#a78bfa,#f0abfc)'},
  {type:'gradient2', main:'#3b82f6', accent:'#60a5fa', name:'Blue Runner',
    progFill:'linear-gradient(90deg,#3b82f6,#60a5fa)', iconGrad:'linear-gradient(90deg,#3b82f6,#60a5fa)'},
  {type:'gradient2', main:'#ffb703', accent:'#ffd166', name:'Electric Mango',
    progFill:'linear-gradient(90deg,#ffb703,#ffd166)', iconGrad:'linear-gradient(90deg,#ffb703,#ffd166)'},
  {type:'gradient2', main:'#ff7aa2', accent:'#ffd166', name:'Pink Lemonade',
    progFill:'linear-gradient(90deg,#ff7aa2,#ffd166)', iconGrad:'linear-gradient(90deg,#ff7aa2,#ffd166)'},
  {type:'gradient2', main:'#5865f2', accent:'#9aa4ff', name:'Blurple Beam',
    progFill:'linear-gradient(90deg,#5865f2,#9aa4ff)', iconGrad:'linear-gradient(90deg,#5865f2,#9aa4ff)'},
  {type:'gradient2', main:'#21d4a3', accent:'#66ffe3', name:'Teal Punch',
    progFill:'linear-gradient(90deg,#21d4a3,#66ffe3)', iconGrad:'linear-gradient(90deg,#21d4a3,#66ffe3)'},
  {type:'gradient2', main:'#ff4d6d', accent:'#ffa3a3', name:'Crimson Edge',
    progFill:'linear-gradient(90deg,#ff4d6d,#ffa3a3)', iconGrad:'linear-gradient(90deg,#ff4d6d,#ffa3a3)'},
  {type:'gradient2', main:'#7efac8', accent:'#baffde', name:'Mint Byte',
    progFill:'linear-gradient(90deg,#7efac8,#baffde)', iconGrad:'linear-gradient(90deg,#7efac8,#baffde)'},
  {type:'gradient2', main:'#8ab4ff', accent:'#ffd166', name:'Royal Sun',
    progFill:'linear-gradient(90deg,#8ab4ff,#ffd166)', iconGrad:'linear-gradient(90deg,#8ab4ff,#ffd166)'},
  {type:'gradient2', main:'#b37aff', accent:'#7aa6ff', name:'Violet Storm',
    progFill:'linear-gradient(90deg,#b37aff,#7aa6ff)', iconGrad:'linear-gradient(90deg,#b37aff,#7aa6ff)'},
  {type:'gradient2', main:'#e0b084', accent:'#ffe0a1', name:'Desert Dusk',
    progFill:'linear-gradient(90deg,#e0b084,#ffe0a1)', iconGrad:'linear-gradient(90deg,#e0b084,#ffe0a1)'},
  {type:'gradient2', main:'#9ae6ff', accent:'#baffde', name:'Ice Mint',
    progFill:'linear-gradient(90deg,#9ae6ff,#baffde)', iconGrad:'linear-gradient(90deg,#9ae6ff,#baffde)'},

  /* === 25 GRADIENT3 (three-stop) === */
  {type:'gradient3', main:'#ff006e', accent:'#ffbe0b', name:'Punch Berry',
    progFill:'linear-gradient(90deg,#ff006e,#ffbe0b,#ffd166)', iconGrad:'linear-gradient(90deg,#ff006e,#ffbe0b,#ffd166)'},
  {type:'gradient3', main:'#00d4ff', accent:'#7b2cbf', name:'Galaxy Lab',
    progFill:'linear-gradient(90deg,#00d4ff,#7b2cbf,#c77dff)', iconGrad:'linear-gradient(90deg,#00d4ff,#7b2cbf,#c77dff)'},
  {type:'gradient3', main:'#c6ff00', accent:'#00e676', name:'Voltage',
    progFill:'linear-gradient(90deg,#c6ff00,#aaff00,#00e676)', iconGrad:'linear-gradient(90deg,#c6ff00,#aaff00,#00e676)'},
  {type:'gradient3', main:'#ff6a00', accent:'#00c6ff', name:'Ember Sky',
    progFill:'linear-gradient(90deg,#ff6a00,#ffb703,#00c6ff)', iconGrad:'linear-gradient(90deg,#ff6a00,#ffb703,#00c6ff)'},
  {type:'gradient3', main:'#ff80bf', accent:'#ffc0cb', name:'Bubblegum',
    progFill:'linear-gradient(90deg,#ff80bf,#ff9ad1,#ffc0cb)', iconGrad:'linear-gradient(90deg,#ff80bf,#ff9ad1,#ffc0cb)'},
  {type:'gradient3', main:'#00c6ff', accent:'#0072ff', name:'Jetstream',
    progFill:'linear-gradient(90deg,#00c6ff,#3b82f6,#0072ff)', iconGrad:'linear-gradient(90deg,#00c6ff,#3b82f6,#0072ff)'},
  {type:'gradient3', main:'#ff9a8b', accent:'#a1ffce', name:'Ember Mint',
    progFill:'linear-gradient(90deg,#ff9a8b,#ffd3b6,#a1ffce)', iconGrad:'linear-gradient(90deg,#ff9a8b,#ffd3b6,#a1ffce)'},
  {type:'gradient3', main:'#f72585', accent:'#7209b7', name:'Space Candy',
    progFill:'linear-gradient(90deg,#f72585,#b5179e,#7209b7)', iconGrad:'linear-gradient(90deg,#f72585,#b5179e,#7209b7)'},
  {type:'gradient3', main:'#ffb347', accent:'#ffd56b', name:'Deep Amber',
    progFill:'linear-gradient(90deg,#ffb347,#ffc46b,#ffd56b)', iconGrad:'linear-gradient(90deg,#ffb347,#ffc46b,#ffd56b)'},
  {type:'gradient3', main:'#8a2be2', accent:'#ff00ff', name:'Electric Berry',
    progFill:'linear-gradient(90deg,#8a2be2,#c77dff,#ff00ff)', iconGrad:'linear-gradient(90deg,#8a2be2,#c77dff,#ff00ff)'},
  {type:'gradient3', main:'#b8f2e6', accent:'#aed9e0', name:'Frost Grove',
    progFill:'linear-gradient(90deg,#b8f2e6,#d1fff2,#aed9e0)', iconGrad:'linear-gradient(90deg,#b8f2e6,#d1fff2,#aed9e0)'},
  {type:'gradient3', main:'#ff6ec7', accent:'#ff9a8b', name:'Neon Taffy',
    progFill:'linear-gradient(90deg,#ff6ec7,#ff85b3,#ff9a8b)', iconGrad:'linear-gradient(90deg,#ff6ec7,#ff85b3,#ff9a8b)'},
  {type:'gradient3', main:'#a8e063', accent:'#fcd36a', name:'Citrus Twist',
    progFill:'linear-gradient(90deg,#a8e063,#ffd166,#fcd36a)', iconGrad:'linear-gradient(90deg,#a8e063,#ffd166,#fcd36a)'},
  {type:'gradient3', main:'#153677', accent:'#4e9af1', name:'Inkwave',
    progFill:'linear-gradient(90deg,#153677,#5b8df6,#4e9af1)', iconGrad:'linear-gradient(90deg,#153677,#5b8df6,#4e9af1)'},
  {type:'gradient3', main:'#3ddc97', accent:'#a1f7c4', name:'Mojito',
    progFill:'linear-gradient(90deg,#3ddc97,#7bed9f,#a1f7c4)', iconGrad:'linear-gradient(90deg,#3ddc97,#7bed9f,#a1f7c4)'},
  {type:'gradient3', main:'#ff8e53', accent:'#a18cd1', name:'Ember Violet',
    progFill:'linear-gradient(90deg,#ff8e53,#ffb199,#a18cd1)', iconGrad:'linear-gradient(90deg,#ff8e53,#ffb199,#a18cd1)'},
  {type:'gradient3', main:'#00c9ff', accent:'#ff3d00', name:'Sky Lava',
    progFill:'linear-gradient(90deg,#00c9ff,#7aa2ff,#ff3d00)', iconGrad:'linear-gradient(90deg,#00c9ff,#7aa2ff,#ff3d00)'},
  {type:'gradient3', main:'#aee1e1', accent:'#f8f9fa', name:'Opal',
    progFill:'linear-gradient(90deg,#aee1e1,#dfeff1,#f8f9fa)', iconGrad:'linear-gradient(90deg,#aee1e1,#dfeff1,#f8f9fa)'},
  {type:'gradient3', main:'#ff2a68', accent:'#ff758c', name:'Ruby Night',
    progFill:'linear-gradient(90deg,#ff2a68,#ff5c8a,#ff758c)', iconGrad:'linear-gradient(90deg,#ff2a68,#ff5c8a,#ff758c)'},
  {type:'gradient3', main:'#00f5a0', accent:'#00d9f5', name:'Teal Flame',
    progFill:'linear-gradient(90deg,#00f5a0,#00e5c0,#00d9f5)', iconGrad:'linear-gradient(90deg,#00f5a0,#00e5c0,#00d9f5)'},
  {type:'gradient3', main:'#cd7f32', accent:'#a8ffcf', name:'Bronze Mint',
    progFill:'linear-gradient(90deg,#cd7f32,#ffc46b,#a8ffcf)', iconGrad:'linear-gradient(90deg,#cd7f32,#ffc46b,#a8ffcf)'},
  {type:'gradient3', main:'#5eead4', accent:'#93c5fd', name:'Nordic',
    progFill:'linear-gradient(90deg,#5eead4,#7dd3fc,#93c5fd)', iconGrad:'linear-gradient(90deg,#5eead4,#7dd3fc,#93c5fd)'},
  {type:'gradient3', main:'#ff6f61', accent:'#ffd166', name:'Poppy Gold',
    progFill:'linear-gradient(90deg,#ff6f61,#ff9f1a,#ffd166)', iconGrad:'linear-gradient(90deg,#ff6f61,#ff9f1a,#ffd166)'},
  {type:'gradient3', main:'#00f0ff', accent:'#ff00f0', name:'Ultra Vapor',
    progFill:'linear-gradient(90deg,#00f0ff,#7b2cbf,#ff00f0)', iconGrad:'linear-gradient(90deg,#00f0ff,#7b2cbf,#ff00f0)'},
  {type:'gradient3', main:'#9be7c7', accent:'#d4ffea', name:'Charcoal Mint',
    progFill:'linear-gradient(90deg,#9be7c7,#baffde,#d4ffea)', iconGrad:'linear-gradient(90deg,#9be7c7,#baffde,#d4ffea)'},

  /* === 25 GRADIENT4 (four-stop) === */
  {type:'gradient4', main:'#ff3e3e', accent:'#ff9e00', name:'Magma Core',
    progFill:'linear-gradient(90deg,#ff3e3e,#ff6a00,#ff9e00,#ffd166)', iconGrad:'linear-gradient(90deg,#ff3e3e,#ff6a00,#ff9e00,#ffd166)'},
  {type:'gradient4', main:'#ff6f59', accent:'#2ec4b6', name:'Neon Koi',
    progFill:'linear-gradient(90deg,#ff6f59,#ff9a76,#2ec4b6,#00d4ff)', iconGrad:'linear-gradient(90deg,#ff6f59,#ff9a76,#2ec4b6,#00d4ff)'},
  {type:'gradient4', main:'#da8cff', accent:'#9f7aea', name:'Orchid Fade',
    progFill:'linear-gradient(90deg,#da8cff,#b892ff,#9f7aea,#7aa2ff)', iconGrad:'linear-gradient(90deg,#da8cff,#b892ff,#9f7aea,#7aa2ff)'},
  {type:'gradient4', main:'#ffd166', accent:'#70e1f5', name:'Solar Wind',
    progFill:'linear-gradient(90deg,#ffd166,#ffe29a,#a1c4fd,#70e1f5)', iconGrad:'linear-gradient(90deg,#ffd166,#ffe29a,#a1c4fd,#70e1f5)'},
  {type:'gradient4', main:'#c9ff73', accent:'#8dff6e', name:'Lime Cinder',
    progFill:'linear-gradient(90deg,#c9ff73,#a6ff69,#8dff6e,#70e000)', iconGrad:'linear-gradient(90deg,#c9ff73,#a6ff69,#8dff6e,#70e000)'},
  {type:'gradient4', main:'#ffb3c1', accent:'#bde0fe', name:'Polar Rose',
    progFill:'linear-gradient(90deg,#ffb3c1,#ffcfe3,#dbeafe,#bde0fe)', iconGrad:'linear-gradient(90deg,#ffb3c1,#ffcfe3,#dbeafe,#bde0fe)'},
  {type:'gradient4', main:'#6fffe9', accent:'#7cffc4', name:'Nebula Mint',
    progFill:'linear-gradient(90deg,#6fffe9,#64dfdf,#7cffc4,#80ffdb)', iconGrad:'linear-gradient(90deg,#6fffe9,#64dfdf,#7cffc4,#80ffdb)'},
  {type:'gradient4', main:'#b6244f', accent:'#ff5d8f', name:'Royal Garnet',
    progFill:'linear-gradient(90deg,#b6244f,#e5466b,#ff5d8f,#ff85a2)', iconGrad:'linear-gradient(90deg,#b6244f,#e5466b,#ff5d8f,#ff85a2)'},
  {type:'gradient4', main:'#7aa2ff', accent:'#b8c6ff', name:'Skyline',
    progFill:'linear-gradient(90deg,#7aa2ff,#8ab4ff,#a7c0ff,#b8c6ff)', iconGrad:'linear-gradient(90deg,#7aa2ff,#8ab4ff,#a7c0ff,#b8c6ff)'},
  {type:'gradient4', main:'#ff9a3c', accent:'#00eaff', name:'Ember Cyan',
    progFill:'linear-gradient(90deg,#ff9a3c,#ffd166,#00c6ff,#00eaff)', iconGrad:'linear-gradient(90deg,#ff9a3c,#ffd166,#00c6ff,#00eaff)'},
  {type:'gradient4', main:'#ff206e', accent:'#33f3ff', name:'Pixel Pop',
    progFill:'linear-gradient(90deg,#ff206e,#ff49c6,#33f3ff,#00bbf9)', iconGrad:'linear-gradient(90deg,#ff206e,#ff49c6,#33f3ff,#00bbf9)'},
  {type:'gradient4', main:'#b0c4de', accent:'#dce5f5', name:'Steel Dawn',
    progFill:'linear-gradient(90deg,#b0c4de,#c9d6ec,#e2e9f8,#dce5f5)', iconGrad:'linear-gradient(90deg,#b0c4de,#c9d6ec,#e2e9f8,#dce5f5)'},
  {type:'gradient4', main:'#c79081', accent:'#dfa579', name:'Mocha Glow',
    progFill:'linear-gradient(90deg,#c79081,#d7a98c,#e7b892,#dfa579)', iconGrad:'linear-gradient(90deg,#c79081,#d7a98c,#e7b892,#dfa579)'},
  {type:'gradient4', main:'#aaffec', accent:'#e4fff8', name:'Crystal Mint',
    progFill:'linear-gradient(90deg,#aaffec,#c7fff2,#e4fff8,#f3fffd)', iconGrad:'linear-gradient(90deg,#aaffec,#c7fff2,#e4fff8,#f3fffd)'},
  {type:'gradient4', main:'#ff4d97', accent:'#ff85b3', name:'Ultra Rose',
    progFill:'linear-gradient(90deg,#ff4d97,#ff6fb0,#ff85b3,#ffc0cb)', iconGrad:'linear-gradient(90deg,#ff4d97,#ff6fb0,#ff85b3,#ffc0cb)'},
  {type:'gradient4', main:'#00b4d8', accent:'#90e0ef', name:'Azure Fire',
    progFill:'linear-gradient(90deg,#00b4d8,#48cae4,#ade8f4,#90e0ef)', iconGrad:'linear-gradient(90deg,#00b4d8,#48cae4,#ade8f4,#90e0ef)'},
  {type:'gradient4', main:'#c19a6b', accent:'#ffd88e', name:'Hazel Gold',
    progFill:'linear-gradient(90deg,#c19a6b,#d7b98a,#ffcf8e,#ffd88e)', iconGrad:'linear-gradient(90deg,#c19a6b,#d7b98a,#ffcf8e,#ffd88e)'},
  {type:'gradient4', main:'#b8fff1', accent:'#d1fff8', name:'Vapor Mint',
    progFill:'linear-gradient(90deg,#b8fff1,#c4fff5,#dcfffb,#d1fff8)', iconGrad:'linear-gradient(90deg,#b8fff1,#c4fff5,#dcfffb,#d1fff8)'},
  {type:'gradient4', main:'#00e5ff', accent:'#80ffea', name:'Ultra Cyan',
    progFill:'linear-gradient(90deg,#00e5ff,#54e0ff,#a0fff2,#80ffea)', iconGrad:'linear-gradient(90deg,#00e5ff,#54e0ff,#a0fff2,#80ffea)'},
  {type:'gradient4', main:'#ff7e5f', accent:'#feb47b', name:'Horizon',
    progFill:'linear-gradient(90deg,#ff7e5f,#ff9966,#ffb37a,#feb47b)', iconGrad:'linear-gradient(90deg,#ff7e5f,#ff9966,#ffb37a,#feb47b)'},
  {type:'gradient4', main:'#7dd3fc', accent:'#bae6fd', name:'Iceberg',
    progFill:'linear-gradient(90deg,#7dd3fc,#a5d8ff,#cfe9ff,#bae6fd)', iconGrad:'linear-gradient(90deg,#7dd3fc,#a5d8ff,#cfe9ff,#bae6fd)'},
  {type:'gradient4', main:'#ff6f91', accent:'#ffc75f', name:'Sunset Soda',
    progFill:'linear-gradient(90deg,#ff6f91,#ff9aa2,#ffd166,#ffc75f)', iconGrad:'linear-gradient(90deg,#ff6f91,#ff9aa2,#ffd166,#ffc75f)'},
  {type:'gradient4', main:'#00f5d4', accent:'#00bbf9', name:'Noir Neon',
    progFill:'linear-gradient(90deg,#00f5d4,#00e5ff,#00ccff,#00bbf9)', iconGrad:'linear-gradient(90deg,#00f5d4,#00e5ff,#00ccff,#00bbf9)'},
  {type:'gradient4', main:'#ffd166', accent:'#fff0a3', name:'Golden Hour',
    progFill:'linear-gradient(90deg,#ffc76b,#ffd166,#ffe29a,#fff0a3)', iconGrad:'linear-gradient(90deg,#ffc76b,#ffd166,#ffe29a,#fff0a3)'},
  {type:'gradient4', main:'#5ad1ff', accent:'#b478ff', name:'Aqua Purple',
    progFill:'linear-gradient(90deg,#5ad1ff,#80cfff,#a1b5ff,#b478ff)', iconGrad:'linear-gradient(90deg,#5ad1ff,#80cfff,#a1b5ff,#b478ff)'}
];

  const STORAGE_KEY = "siteThemeV1";
  const load = ()=>{
    try {
      return window.G73ThemeBridge?.loadTheme?.() || JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    } catch { return null; }
  };
  const save = (o)=>{
    try {
      window.G73ThemeBridge?.saveTheme?.({
        mainColor:o.main,
        accentColor:o.accent,
        textColor:o.text,
        textBg:o.textBg,
        borderColor:o.border,
        artistColor:o.artistColor || o.accent,
        surfaceOpacity:o.surfaceOpacity,
        glowIntensity:o.glowIntensity,
        radiusScale:o.radiusScale,
        spacingScale:o.spacingScale,
        fontScale:o.fontScale,
        backgroundMode:o.backgroundMode,
        textureStrength:o.textureStrength,
        glassBlur:o.glassBlur,
        borderStrength:o.borderStrength,
        controlScale:o.controlScale,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    }catch{}
  };

  const DEFAULT_THEME = {
    main:'#00ff88', accent:'#b478ff', text:'#ffffff', textBg:'#1c2230', border:'#00ff88',
    surfaceOpacity:0.44, glowIntensity:1, radiusScale:1, spacingScale:1, fontScale:1,
    backgroundMode:'aurora', textureStrength:0.14, glassBlur:10, borderStrength:1, controlScale:1, artistColor:'#b478ff'
  };

  /* -------- Helpers -------- */
  function luminance(hex){
    const c = (hex || '#000000').replace('#','').padEnd(6,'0');
    const r = parseInt(c.slice(0,2),16)/255;
    const g = parseInt(c.slice(2,4),16)/255;
    const b = parseInt(c.slice(4,6),16)/255;
    const L = [r,g,b].map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));
    return 0.2126*L[0]+0.7152*L[1]+0.0722*L[2];
  }
  function autoText(bg){ return luminance(bg) > 0.5 ? '#0b0d10' : '#ffffff'; }
  function autoBg(main){ return luminance(main) > 0.5 ? '#ecf0f1' : '#2f3542'; }
  function autoBorder(bg){ return luminance(bg) > 0.5 ? '#2c3e50' : '#ced6e0'; }
  function clamp(n,min,max){ return Math.min(max, Math.max(min, Number(n))); }
  function normalizeTheme(input={}){
    const main = input.main || input.mainColor || DEFAULT_THEME.main;
    const accent = input.accent || input.accentColor || DEFAULT_THEME.accent;
    const text = input.text || input.textColor || autoText(main);
    const textBg = input.textBg || DEFAULT_THEME.textBg || autoBg(main);
    const border = input.border || input.borderColor || autoBorder(textBg);
    return {
      main, accent, text, textBg, border,
      artistColor: input.artistColor || accent,
      surfaceOpacity: clamp(input.surfaceOpacity ?? DEFAULT_THEME.surfaceOpacity, 0.22, 0.92),
      glowIntensity: clamp(input.glowIntensity ?? DEFAULT_THEME.glowIntensity, 0.2, 2),
      radiusScale: clamp(input.radiusScale ?? DEFAULT_THEME.radiusScale, 0.7, 1.5),
      spacingScale: clamp(input.spacingScale ?? DEFAULT_THEME.spacingScale, 0.85, 1.35),
      fontScale: clamp(input.fontScale ?? DEFAULT_THEME.fontScale, 0.9, 1.2),
      backgroundMode: input.backgroundMode || DEFAULT_THEME.backgroundMode,
      textureStrength: clamp(input.textureStrength ?? DEFAULT_THEME.textureStrength, 0, 0.35),
      glassBlur: clamp(input.glassBlur ?? DEFAULT_THEME.glassBlur, 0, 18),
      borderStrength: clamp(input.borderStrength ?? DEFAULT_THEME.borderStrength, 0.5, 2),
      controlScale: clamp(input.controlScale ?? DEFAULT_THEME.controlScale, 0.9, 1.18)
    };
  }

  /* -------- Apply theme to CSS vars already used -------- */
  function applyTheme(input){
    const p = normalizeTheme(input);
    const r = document.documentElement;

    r.style.setProperty('--mainThemeColor', p.main);
    r.style.setProperty('--accentColor', p.accent);
    r.style.setProperty('--text', p.text);
    r.style.setProperty('--textBg', p.textBg);
    r.style.setProperty('--borderColor', p.border);
    r.style.setProperty('--app-primary', p.main);
    r.style.setProperty('--app-accent', p.accent);
    r.style.setProperty('--primary-color', p.main);
    r.style.setProperty('--accent-color', p.accent);
    r.style.setProperty('--glow-color', p.main);
    r.style.setProperty('--text-muted', p.text);
    r.style.setProperty('--white-faint', p.textBg);
    r.style.setProperty('--artist-color', p.artistColor);
    r.style.setProperty('--theme-surface-opacity', String(p.surfaceOpacity));
    r.style.setProperty('--theme-glow-intensity', String(p.glowIntensity));
    r.style.setProperty('--theme-radius-scale', String(p.radiusScale));
    r.style.setProperty('--theme-spacing-scale', String(p.spacingScale));
    r.style.setProperty('--theme-font-scale', String(p.fontScale));
    r.style.setProperty('--theme-texture-strength', String(p.textureStrength));
    r.style.setProperty('--theme-glass-blur', String(p.glassBlur));
    r.style.setProperty('--theme-border-strength', String(p.borderStrength));
    r.style.setProperty('--theme-control-scale', String(p.controlScale));
    r.style.setProperty('--theme-surface-percent', `${Math.round(p.surfaceOpacity * 100)}%`);
    r.style.setProperty('--theme-texture-percent', `${Math.round(p.textureStrength * 100)}%`);
    r.style.setProperty('--theme-ring-soft-percent', `${Math.min(72, Math.max(6, Math.round(18 * p.glowIntensity)))}%`);
    r.style.setProperty('--theme-ring-strong-percent', `${Math.min(84, Math.max(8, Math.round(24 * p.glowIntensity)))}%`);
    r.style.setProperty('--theme-border-percent', `${Math.min(72, Math.max(8, Math.round(26 * p.borderStrength)))}%`);
    r.setAttribute('data-theme-bg', p.backgroundMode);

    r.style.setProperty('--navbar-bg', 'rgba(0,0,0,.55)');
    r.style.setProperty('--glow-box', `0 0 ${Math.round(12 * p.glowIntensity)}px color-mix(in srgb, ${p.main} 30%, transparent)`);
    r.style.setProperty('--glow-shadow', `0 0 ${Math.round(10 * p.glowIntensity)}px ${p.main}`);

    document.body?.setAttribute('data-theme-bg', p.backgroundMode);
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { ...p } }));
    save(p);
    syncStudioInputs(p);
  }

  function createField(label, inputHtml, help=''){
    return `<div class="field"><label>${label}</label>${inputHtml}${help ? `<div class="help">${help}</div>` : ''}</div>`;
  }
  function syncStudioInputs(theme){
    const m = document.getElementById('site-theme-modal');
    if (!m) return;
    const fields = {
      surfaceOpacity: theme.surfaceOpacity, glowIntensity: theme.glowIntensity, radiusScale: theme.radiusScale,
      spacingScale: theme.spacingScale, fontScale: theme.fontScale, textureStrength: theme.textureStrength,
      backgroundMode: theme.backgroundMode, glassBlur: theme.glassBlur, borderStrength: theme.borderStrength,
      controlScale: theme.controlScale
    };
    Object.entries(fields).forEach(([k,v])=>{ const el=m.querySelector(`[name="${k}"]`); if(el) el.value=String(v); });
  }
  function getStudioTheme(base){
    const m = document.getElementById('site-theme-modal');
    if (!m) return normalizeTheme(base || load() || DEFAULT_THEME);
    const current = normalizeTheme(base || load() || DEFAULT_THEME);
    const get = (name, fallback=current[name]) => m.querySelector(`[name="${name}"]`)?.value ?? fallback;
    return normalizeTheme({
      ...current,
      surfaceOpacity: get('surfaceOpacity'),
      glowIntensity: get('glowIntensity'),
      radiusScale: get('radiusScale'),
      spacingScale: get('spacingScale'),
      fontScale: get('fontScale'),
      textureStrength: get('textureStrength'),
      backgroundMode: get('backgroundMode'),
      glassBlur: get('glassBlur'),
      borderStrength: get('borderStrength'),
      controlScale: get('controlScale')
    });
  }

  /* -------- Modal (attached to <body>) -------- */
  function buildModal(){
    if (document.getElementById('site-theme-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'site-theme-modal';
    modal.innerHTML = `
      <div class="backdrop" data-close="1" aria-hidden="true"></div>
      <div class="panel" role="dialog" aria-modal="true" aria-label="Theme" tabindex="-1">
        <div class="head">
          <h3>Theme Studio</h3>
          <button class="icon-btn theme-chip" data-close="1" aria-label="Close" type="button">
            <i class="material-icons" aria-hidden="true">close</i>
          </button>
        </div>
        <div class="grid"></div>
        <div class="studio">
          ${createField('Surface opacity', '<input type="range" min="0.22" max="0.92" step="0.02" name="surfaceOpacity">', 'Card darkness / glassiness across the site')}
          ${createField('Glow intensity', '<input type="range" min="0.2" max="2" step="0.05" name="glowIntensity">', 'How strong the neon glow feels')}
          ${createField('Corner radius', '<input type="range" min="0.7" max="1.5" step="0.05" name="radiusScale">', 'Sharper or softer UI corners')}
          ${createField('Spacing scale', '<input type="range" min="0.85" max="1.35" step="0.05" name="spacingScale">', 'Compact or roomy layout density')}
          ${createField('Font scale', '<input type="range" min="0.9" max="1.2" step="0.02" name="fontScale">', 'Global text sizing')}
          ${createField('Texture strength', '<input type="range" min="0" max="0.35" step="0.01" name="textureStrength">', 'How much ambient background glow is visible')}
          ${createField('Backdrop mode', '<select name="backgroundMode"><option value="aurora">Aurora</option><option value="midnight">Midnight</option><option value="stage">Stage</option></select>', 'Pick the page atmosphere')}
          ${createField('Glass blur', '<input type="range" min="0" max="18" step="1" name="glassBlur">', 'Increase or reduce the frosted-glass softness')}
          ${createField('Border strength', '<input type="range" min="0.5" max="2" step="0.05" name="borderStrength">', 'Thinner or stronger outlines across cards and buttons')}
          ${createField('Control scale', '<input type="range" min="0.9" max="1.18" step="0.01" name="controlScale">', 'Make controls slightly tighter or bolder sitewide')}
          <div class="field"><label>Tip</label><div class="help">Every preset updates the whole website. Fine tune the sliders, then the site remembers your custom look.</div></div>
        </div>
        <div class="actions">
          <button type="button" class="theme-action" data-theme-action="randomize">Randomize</button>
          <button type="button" class="theme-action" data-theme-action="reset">Reset</button>
          <button type="button" class="theme-action" data-theme-action="export">Export</button>
          <button type="button" class="theme-action" data-theme-action="import">Import</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const grid = modal.querySelector('.grid');
    PRESETS.forEach((preset,i)=>{
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'swatch';
      sw.title = preset.name || ('Theme #' + (i+1));
      sw.style.background = `linear-gradient(145deg, ${preset.main}, ${preset.accent})`;
      sw.addEventListener('click', ()=>applyTheme({ ...getStudioTheme(), ...preset }));
      grid.appendChild(sw);
    });

    modal.querySelectorAll('.studio input, .studio select').forEach((el)=>{
      el.addEventListener('input', ()=>applyTheme(getStudioTheme()));
      el.addEventListener('change', ()=>applyTheme(getStudioTheme()));
    });

    modal.addEventListener('click', (e)=>{
      const target = e.target.closest('[data-close]');
      if (target) closeModal();
      const action = e.target.closest('[data-theme-action]')?.dataset.themeAction;
      if (!action) return;
      if (action === 'reset') applyTheme(DEFAULT_THEME);
      if (action === 'randomize') {
        const pick = PRESETS[Math.floor(Math.random()*PRESETS.length)] || DEFAULT_THEME;
        applyTheme({ ...getStudioTheme(), ...pick });
      }
      if (action === 'export') {
        const payload = JSON.stringify(getStudioTheme(), null, 2);
        try { navigator.clipboard?.writeText(payload); } catch {}
        try { window.showToast?.('Theme copied to clipboard'); } catch {}
      }
      if (action === 'import') {
        const raw = window.prompt('Paste a theme JSON export');
        if (!raw) return;
        try { applyTheme({ ...getStudioTheme(), ...JSON.parse(raw) }); window.showToast?.('Theme imported'); }
        catch { window.showToast?.('Invalid theme JSON'); }
      }
    });
    window.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeModal(); });
    syncStudioInputs(normalizeTheme(load() || DEFAULT_THEME));
  }

  function openModal(){
    buildModal();
    const m = document.getElementById('site-theme-modal');
    syncStudioInputs(normalizeTheme(load() || DEFAULT_THEME));
    m.classList.add('open');
    document.body.style.overflow='hidden';
    m.querySelector('.panel')?.focus?.();
  }
  function closeModal(){
    const m=document.getElementById('site-theme-modal'); if(!m) return;
    m.classList.remove('open'); document.body.style.overflow='';
  }

  /* -------- Navbar trigger (palette icon) -------- */
  function ensureTrigger(){
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    let btn = document.getElementById('open-theme');
    if (!btn){
      btn = document.createElement('button');
      btn.id = 'open-theme';
      btn.className = 'icon-btn';
      btn.setAttribute('aria-label','Theme Studio');
      btn.style.marginLeft = '8px';
      btn.innerHTML = '<i class="material-icons theme-chip" aria-hidden="true">palette</i>';
      (nav.querySelector('#account-btn') || nav.lastElementChild || nav).insertAdjacentElement('afterend', btn);
    }
    if (!btn.dataset.boundThemeStudio){
      btn.addEventListener('click', openModal);
      btn.dataset.boundThemeStudio = '1';
    }
  }

  /* -------- Boot -------- */
  function boot(){
    applyTheme(load() || DEFAULT_THEME);
    ensureTrigger();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();


/* ===== END core-inline-logic-017.js ===== */


/* ===== BEGIN core-inline-logic-018.js ===== */


(() => {
  let rafId, stopId;
  const onScroll = () => {
    // throttle via rAF so we don’t spam
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      document.body.classList.add('is-scrolling');
      clearTimeout(stopId);
      stopId = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150); // resume shortly after scroll stops
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ===== END core-inline-logic-018.js ===== */


/* ===== BEGIN core-inline-logic-020.js ===== */

// js/index/core-inline-logic-020.js
(function(){
  const ga = (eventName, params) => {
    if (typeof window.gtag === "function") window.gtag("event", eventName, params || {});
  };

  window.trackContactSubmitted = function(){
    ga("generate_lead", { method: "contact_form" });
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (a.host && a.host !== location.host) {
      ga("click_outbound", { link_url: a.href, link_domain: a.host });
    }
  });

  window.trackDownload = function(name, url){
    ga("file_download", { file_name: name, file_url: url });
  };

  window.addEventListener("player:play",  e => ga("play",  { track_id: e.detail?.id, track: e.detail?.name }));
  window.addEventListener("player:pause", e => ga("pause", { track_id: e.detail?.id, track: e.detail?.name }));
})();

/* ===== END core-inline-logic-020.js ===== */


/* ===== BEGIN core-inline-logic-021.js ===== */


  // ---- SPA virtual page views (skip this if your site is NOT an SPA) ----
  // Fires a GA4 page_view whenever the route changes.
  function trackVirtualPageView(path){
    gtag('event', 'page_view', {
      page_location: location.origin + path,
      page_path: path,
      page_title: document.title
    });
  }

  (function(){
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    function onRouteChange(){
      const path = location.pathname + location.search + location.hash;
      trackVirtualPageView(path);
    }

    history.pushState = function(...args){ origPush.apply(this, args); onRouteChange(); };
    history.replaceState = function(...args){ origReplace.apply(this, args); onRouteChange(); };
    window.addEventListener('popstate', onRouteChange);

    // initial view for SPAs
    onRouteChange();
  })();


/* ===== END core-inline-logic-021.js ===== */


/* ===== BEGIN core-inline-logic-022.js ===== */


(function(){
  // Keep the latest track meta if player-core.js is emitting it
  let lastMeta = null;
  window.addEventListener('player:track_change', e => { lastMeta = e.detail || lastMeta; });
  window.addEventListener('player:play',  e => { lastMeta = e.detail || lastMeta; });

  function filenameFromUrl(url){
    try { return new URL(url, location.origin).pathname.split('/').pop() || ''; }
    catch { return ''; }
  }

  function currentMetaFallback(){
    // Fallback if player-core.js didn't provide meta yet
    const list = Array.isArray(window.allMusic) ? window.allMusic : [];
    const id = window.currentSongId || '';
    const it = id ? (list.find(x => x?.src === id) || {}) : {};
    return {
      item_id: id,
      item_name: it.name || '',
      item_brand: it.artist || '',
      index: window.musicIndex || 0,
      playlist_size: list.length || 0,
      // best-guess URL for filename
      file_url: it.src || '',
      file_name: filenameFromUrl(it.src || '')
    };
  }

  function meta(){
    if (!lastMeta) return currentMetaFallback();
    return {
      item_id: lastMeta.item_id || lastMeta.id || window.currentSongId || '',
      item_name: lastMeta.item_name || lastMeta.name || '',
      item_brand: lastMeta.item_brand || lastMeta.artist || '',
      index: lastMeta.index || window.musicIndex || 0,
      playlist_size: lastMeta.playlist_size || (Array.isArray(window.allMusic) ? window.allMusic.length : 0),
      file_url: lastMeta.src || '',
      file_name: filenameFromUrl(lastMeta.src || '')
    };
  }

  function sendGA(eventName, extra){
    const payload = Object.assign({}, meta(), extra);
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
    // Also emit a CustomEvent for anything else to hook
    try { window.dispatchEvent(new CustomEvent('player:' + eventName, { detail: payload })); } catch {}
  }

  // ---- Wrap existing functions if present; else attach click listeners as fallback ----
  // LIKE
  const likeBtn = document.getElementById('like-btn');
  if (typeof window.likeSongFirebase === 'function') {
    const _like = window.likeSongFirebase;
    window.likeSongFirebase = async function(songId){
      sendGA('like_add', { song_id: songId || window.currentSongId || '' });
      return _like.apply(this, arguments);
    };
  } else if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      sendGA('like_add', { song_id: window.currentSongId || '' });
    }, { passive: true });
  }

  // DISLIKE
  const dislikeBtn = document.getElementById('dislike-btn');
  if (typeof window.dislikeSongFirebase === 'function') {
    const _dislike = window.dislikeSongFirebase;
    window.dislikeSongFirebase = async function(songId){
      sendGA('dislike_add', { song_id: songId || window.currentSongId || '' });
      return _dislike.apply(this, arguments);
    };
  } else if (dislikeBtn) {
    dislikeBtn.addEventListener('click', () => {
      sendGA('dislike_add', { song_id: window.currentSongId || '' });
    }, { passive: true });
  }

  // DOWNLOAD
  const downloadBtn = document.getElementById('download-btn');
  if (typeof window.downloadSong === 'function') {
    const _download = window.downloadSong;
    window.downloadSong = async function(){
      const m = meta();
      sendGA('file_download', { file_name: m.file_name, file_url: m.file_url || '' });
      return _download.apply(this, arguments);
    };
  } else if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const m = meta();
      sendGA('file_download', { file_name: m.file_name, file_url: m.file_url || '' });
    }, { passive: true });
  }
})();


/* ===== END core-inline-logic-022.js ===== */


/* ===== BEGIN safety-boot-logic-in-case-main-js-doesn-t-start-it.js ===== */


    if (typeof setupVisualizer === "function") { setupVisualizer(); }
  

/* ===== END safety-boot-logic-in-case-main-js-doesn-t-start-it.js ===== */
