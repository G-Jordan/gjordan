// js/player/equalizer.js
// Full 10-band equalizer powered by Web Audio API.
// Exposes window.equalizerAPI for other parts of the app.
// Themed to page vars: --app-primary, --app-accent, (optional) --prog-fill

(function(){
  const audioEl = document.getElementById('main-audio');
  if (!audioEl) return;

  // ========= THEME INJECTION (wins without touching global CSS) =========
  (function ensureEqThemeStyles(){
    if (document.getElementById('eq-theme-style')) return;

    const css = `
/* ===== EQ Theme (auto from root vars) ===== */
#eq-modal{
  --eq-primary: var(--app-primary, #5fa0ff);
  --eq-accent:  var(--app-accent,  #b478ff);
  --eq-grad:    var(--prog-fill, linear-gradient(90deg, var(--eq-primary), var(--eq-accent)));
  --eq-bg:      color-mix(in srgb, #0b0d10 78%, transparent);
  --eq-panel:   linear-gradient(180deg,
                   color-mix(in srgb, var(--eq-primary) 10%, transparent),
                   color-mix(in srgb, var(--eq-accent)  7%, transparent));
  --eq-border:  1px solid color-mix(in srgb, var(--eq-primary) 55%, transparent);
  --eq-shadow:  0 10px 30px rgba(0,0,0,.55),
                0 0 18px color-mix(in srgb, var(--eq-primary) 28%, transparent);
}

/* Panel chrome */
#eq-modal .eq-panel,
#eq-modal .modal-content{
  background: var(--eq-panel) !important;
  border: var(--eq-border) !important;
  box-shadow: var(--eq-shadow) !important;
  color: color-mix(in srgb, var(--eq-accent) 82%, white) !important;
  backdrop-filter: blur(6px);
}

/* Head / title / close */
#eq-modal .eq-head{
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  border-bottom: 1px solid color-mix(in srgb, var(--eq-primary) 28%, transparent);
}
#eq-modal .eq-title{
  margin:0; font: 800 16px/1.2 system-ui,Segoe UI,Roboto;
  color: var(--eq-accent) !important;
  text-shadow: 0 0 8px color-mix(in srgb, var(--eq-accent) 55%, transparent);
}
#eq-modal .eq-close,
#eq-modal .eq-icon-btn{
  all: unset; cursor: pointer; display:inline-grid; place-items:center;
  padding:6px; border-radius:10px;
  color: color-mix(in srgb, var(--eq-primary) 86%, white);
  transition: transform .12s ease, background .12s ease, color .12s ease;
}
#eq-modal .eq-close:hover,
#eq-modal .eq-icon-btn:hover{
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--eq-accent) 14%, transparent);
  color: color-mix(in srgb, var(--eq-accent) 90%, white);
}

/* Force Material Icons to inherit (no black paint) */
#eq-modal i.material-icons{
  color: currentColor !important;
  -webkit-text-fill-color: currentColor !important;
  line-height: 1;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--eq-primary) 30%, transparent));
}

/* Sliders grid */
#eq-bands{
  display:grid; grid-template-columns: repeat(10, minmax(26px,1fr));
  gap: 12px; padding: 12px 6px;
}
#eq-bands .eq-band{
  display:flex; flex-direction:column; align-items:center; gap:8px;
  pointer-events:auto;
}
#eq-bands .eq-band label{
  font-size: 12px; color: color-mix(in srgb, var(--eq-accent) 75%, white);
}

/* Vertical sliders (range) — hardened for browsers */
#eq-bands input[type="range"]{
  -webkit-appearance: none;
  appearance: none;
  height: 140px; width: 6px; border-radius: 8px;
  background: color-mix(in srgb, var(--eq-primary) 18%, transparent);
  outline: none; accent-color: var(--eq-primary);
  touch-action: none; /* prevent scroll hijack on mobile */
  pointer-events:auto;
  writing-mode: vertical-lr;        /* FF */
  direction: rtl;                    /* FF invert to behave like vertical slider */
}
@supports not (writing-mode: vertical-lr){
  /* fallback: rotate track for WebKit/Blink old */
  #eq-bands .eq-band{ transform: translateZ(0); } /* fix blurriness in some engines */
  #eq-bands input[type="range"]{ transform: rotate(-90deg); width: 140px; height: 6px; }
}
#eq-bands input[type="range"]::-webkit-slider-runnable-track{
  width: 6px; background: color-mix(in srgb, var(--eq-primary) 18%, transparent);
  border-radius: 6px;
}
#eq-bands input[type="range"]::-webkit-slider-thumb{
  -webkit-appearance: none; width: 18px; height: 18px; margin-top: -6px;
  border-radius: 50%;
  background: var(--eq-grad);
  border: 1px solid color-mix(in srgb, var(--eq-primary) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--eq-primary) 22%, transparent);
}
#eq-bands input[type="range"]::-moz-range-track{
  width: 6px; background: color-mix(in srgb, var(--eq-primary) 18%, transparent);
  border-radius: 6px;
}
#eq-bands input[type="range"]::-moz-range-thumb{
  width: 18px; height: 18px; border: none; border-radius: 50%;
  background: var(--eq-grad);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--eq-primary) 22%, transparent);
}

/* Output (dB) */
#eq-bands output{
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--eq-primary) 88%, white);
}

/* Preamp row (no overlap) */
#eq-preamp-row {
  display: grid;
  grid-template-columns: auto 1fr auto; /* add a left spacer, then slider, then output */
  align-items: center;
  column-gap: 12px;
  margin: 50px 0 6px;
  justify-content: start; /* anchor to the left instead of center */
}

#eq-preamp {
  justify-self: start;   /* stick the slider left */
  max-width: 440px;
  min-width: 220px;
  width: 100%;
}

#eq-preamp-out{
  display: inline-block;
  min-width: 72px;    /* reserve space so it doesn't float over the track */
  text-align: right;
  line-height: 1.2;
  padding: 4px 6px;
  border-radius: 8px;
  color: color-mix(in srgb, var(--eq-accent) 85%, white);
  background: color-mix(in srgb, var(--eq-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--eq-primary) 30%, transparent);
}

@media (max-width: 520px){
  /* stack cleanly on small screens */
  #eq-preamp-row{
    grid-template-columns: 1fr;
  }
  #eq-preamp-out{
    justify-self: center;
    text-align: center;
    min-width: 0;
    width: fit-content;
    margin-top: 4px;
  }
}

/* Buttons / selects (BACKGROUND THEMED + states) */
#eq-controls{
  display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap;
  margin-top: 10px;
}
#eq-controls button,
#eq-controls .eq-btn{
  all: unset; cursor:pointer; padding: 10px 14px; border-radius: 12px;
  color: #0b0d10;
  background: var(--eq-grad);
  box-shadow: 0 6px 18px rgba(0,0,0,.35),
              0 0 14px color-mix(in srgb, var(--eq-primary) 30%, transparent);
  transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
}
#eq-controls button:hover,
#eq-controls .eq-btn:hover{
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0,0,0,.45),
              0 0 18px color-mix(in srgb, var(--eq-accent) 35%, transparent);
  filter: saturate(1.1);
}
#eq-controls button:active,
#eq-controls .eq-btn:active{
  transform: translateY(0);
  filter: saturate(1.15) brightness(1.05);
}
#eq-preset{
  background: color-mix(in srgb, #0b0d10 78%, transparent);
  color: color-mix(in srgb, var(--eq-accent) 85%, white);
  border: 1px solid color-mix(in srgb, var(--eq-primary) 35%, transparent);
  border-radius: 10px; padding: 8px 10px;
}

/* Enable toggle + disabled state */
#eq-enable{ accent-color: var(--eq-primary); }
#eq-bands.is-disabled{ filter: grayscale(.4) opacity(.65); pointer-events:none; }

/* Ensure ANY icon inside the EQ panel inherits (safety net) */
#eq-modal * i.material-icons{
  color: currentColor !important;
  -webkit-text-fill-color: currentColor !important;
}
`;
    const style = document.createElement('style');
    style.id = 'eq-theme-style';
    style.textContent = css;
    document.head.appendChild(style);

    // Recompute on theme changes (if your theme tool dispatches)
    window.addEventListener('theme:changed', ()=> {
      document.getElementById('eq-modal')?.offsetHeight;
    }, {passive:true});

    // Fallback: watch root attribute/inline changes
    new MutationObserver(()=>{ document.getElementById('eq-modal')?.offsetHeight; })
      .observe(document.documentElement, {attributes:true, attributeFilter:['style','class','data-theme']});
  })();
  // ================== /THEME INJECTION ==================

  // UI elements (guard every ref; don't let one missing control kill the EQ)
  const modal     = document.getElementById('eq-modal');
  const enableCb  = document.getElementById('eq-enable');
  const bandsWrap = document.getElementById('eq-bands');
  const preamp    = document.getElementById('eq-preamp');
  const preampOut = document.getElementById('eq-preamp-out');
  // Harden preamp layout against outside CSS
(function fixPreampLayout(){
  const row = document.getElementById('eq-preamp-row');
  if (!row || !preamp || !preampOut) return;
  // ensure the row is grid and children don’t overlap
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1fr auto';
  row.style.alignItems = 'center';
  preamp.style.maxWidth = preamp.style.maxWidth || '440px';
  preamp.style.minWidth = preamp.style.minWidth || '220px';
  preamp.style.width    = preamp.style.width    || '100%';
  preampOut.style.display   = preampOut.style.display   || 'inline-block';
  preampOut.style.minWidth  = preampOut.style.minWidth  || '72px';
  preampOut.style.textAlign = preampOut.style.textAlign || 'right';
})();
  const presetSel = document.getElementById('eq-preset');
  const saveBtn   = document.getElementById('eq-save-preset');
  const delBtn    = document.getElementById('eq-delete-preset');
  const resetBtn  = document.getElementById('eq-reset');

  const STORE_KEY  = 'eqSettings.v1';
  const PRESET_KEY = 'eqPresets.v1';

  // Frequencies (Hz) for a classic 10-band EQ
  const freqs = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

  // Built-in presets (dB values for each band)
  const BUILTINS = {
    'Flat':        [0,0,0,0,0,0,0,0,0,0],
    'Bass Boost':  [6,5,4,2,0,-1,-2,-3,-3,-3],
    'Treble Boost':[-3,-3,-2,-1,0,2,3,4,5,6],
    'Vocal':       [-2,-1,0,2,3,2,0,-1,-2,-2],
    'Rock':        [5,3,2,0,-1,1,3,4,4,5],
    'Pop':         [-1,2,3,4,2,-1,-1,1,2,3],
    'Hip-Hop':     [6,5,3,1,0,1,2,1,0,-1],
    'Loudness':    [4,2,0,-1,-2,0,2,3,4,5]
  };

  // Reuse or create AudioContext
  let ctx = window.audioCtx || window.AudioContextInstance || null;
  if (!ctx) {
    const ACtx = window.AudioContext || window.webkitAudioContext;
    ctx = new ACtx();
    window.audioCtx = ctx;
  }

  // Create source + node chain (single MediaElementSource per element)
  if (!audioEl._mediaSourceNode) {
    audioEl._mediaSourceNode = ctx.createMediaElementSource(audioEl);
  }
  const source = audioEl._mediaSourceNode;

  const preampGain = ctx.createGain();
  const filters = freqs.map((f)=> {
    const biq = ctx.createBiquadFilter();
    biq.type = 'peaking';
    biq.frequency.value = f;
    biq.Q.value = (f < 250 ? 1.0 : f < 2000 ? 1.1 : 1.2);
    biq.gain.value = 0;
    return biq;
  });

  const outGain = ctx.createGain();
  outGain.gain.value = 1;

  // ----- Visualizer analyser helpers -----
  function getExistingAnalyser(){
    if (window.visualizerAPI?.getAnalyser) return window.visualizerAPI.getAnalyser();
    if (window.visualizerAnalyser) return window.visualizerAnalyser;
    return null;
  }
  function publishAnalyser(node){
    if (window.visualizerAPI?.setAnalyser) window.visualizerAPI.setAnalyser(node);
    else if (window.visualizerAPI?.setAudioNode) window.visualizerAPI.setAudioNode(node);
    window.visualizerAnalyser = node;
  }

  // Build chain: source -> preamp -> f1..f10 -> analyser -> outGain -> destination
  function connectChain() {
    try { preampGain.disconnect(); } catch {}
    filters.forEach(n=>{ try{ n.disconnect(); } catch {} });
    try { outGain.disconnect(); } catch {}

    try { source.disconnect(); } catch {}
    source.connect(preampGain);

    let head = preampGain;
    filters.forEach(f => { head.connect(f); head = f; });

    let analyser = getExistingAnalyser();
    if (!analyser) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      publishAnalyser(analyser);
    }

    head.connect(analyser);
    analyser.connect(outGain);
    outGain.connect(ctx.destination);

    publishAnalyser(analyser);
  }
  connectChain();

  // ====== SAFETY: keep context alive (some browsers suspend it silently) ======
  const resumeCtx = ()=> { if (ctx && ctx.state === 'suspended') ctx.resume?.(); };
  ['click','touchstart','pointerdown','keydown'].forEach(evt=>{
    window.addEventListener(evt, resumeCtx, {passive:true});
  });

  // ----- Build sliders UI (theming handled by CSS above) -----
  const sliders = [];
  if (bandsWrap){
    bandsWrap.innerHTML = '';
    freqs.forEach((hz, idx)=>{
      const wrap = document.createElement('div');
      wrap.className = 'eq-band';

      const label = document.createElement('label');
      label.textContent = hz >= 1000 ? (hz/1000) + 'k' : String(hz);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = -12;
      input.max = 12;
      input.step = 0.1;
      input.value = 0;
      input.dataset.index = String(idx);

      const out = document.createElement('output');
      out.textContent = '0 dB';

      const applyOne = (val)=>{
        const v = parseFloat(val);
        filters[idx].gain.value = v;
        out.textContent = (v>0?'+':'') + v.toFixed(1) + ' dB';
        persist();
      };

      // Input hooks (both 'input' and 'change' for stubborn engines)
      input.addEventListener('input',  ()=> applyOne(input.value), {passive:true});
      input.addEventListener('change', ()=> applyOne(input.value), {passive:true});

      wrap.appendChild(label);
      wrap.appendChild(input);
      wrap.appendChild(out);
      bandsWrap.appendChild(wrap);
      sliders.push({input, out});
    });
  }

  // ----- Preamp -----
  function setPreamp(db){
    preampGain.gain.value = Math.pow(10, db/20);
    if (preamp) preamp.value = db;
    if (preampOut) preampOut.textContent = (db>0?'+':'') + db.toFixed(1) + ' dB';
  }
  if (preamp){
    const apply = ()=>{ setPreamp(parseFloat(preamp.value || '0')); persist(); };
    preamp.addEventListener('input', apply, {passive:true});
    preamp.addEventListener('change', apply, {passive:true});
  }

  // ----- Enable/bypass -----
  function setEnabled(on){
    if (enableCb) enableCb.checked = !!on;
    filters.forEach((f, i)=>{
      const v = parseFloat(sliders[i]?.input.value || '0');
      f.gain.value = on ? v : 0;
    });
    bandsWrap?.classList.toggle('is-disabled', !on);
    persist();
  }
  enableCb?.addEventListener('change', ()=> setEnabled(!!enableCb.checked), {passive:true});

  // ----- Presets (built-in + custom saved) -----
  function loadCustomPresets(){
    try{
      const raw = localStorage.getItem(PRESET_KEY);
      return raw ? JSON.parse(raw) : {};
    }catch{ return {}; }
  }
  function saveCustomPresets(obj){
    try{ localStorage.setItem(PRESET_KEY, JSON.stringify(obj)); }catch{}
  }

  function refreshPresetOptions(selectedName){
    if (!presetSel) return;
    const customs = loadCustomPresets();
    const all = {...BUILTINS, ...customs};
    const keys = Object.keys(all);
    presetSel.innerHTML = '';
    keys.forEach(name=>{
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      presetSel.appendChild(opt);
    });
    if (selectedName && keys.includes(selectedName)) presetSel.value = selectedName;
  }

  function applyPresetByName(name){
    const customs = loadCustomPresets();
    const map = {...BUILTINS, ...customs};
    const arr = map[name] || BUILTINS['Flat'];
    sliders.forEach((s, i)=>{
      const val = arr[i] ?? 0;
      s.input.value = val;
      s.out.textContent = (val>0?'+':'') + Number(val).toFixed(1) + ' dB';
      // Apply immediately if enabled
      if (!enableCb || enableCb.checked) filters[i].gain.value = val;
    });
    if (presetSel) presetSel.value = name in map ? name : 'Flat';
    persist();
  }

  presetSel?.addEventListener('change', ()=> applyPresetByName(presetSel.value), {passive:true});

  // Save / Delete / Reset
  saveBtn?.addEventListener('click', ()=>{
    const name = prompt('Preset name:');
    if (!name) return;
    const arr = sliders.map(s=> parseFloat(s.input.value));
    const customs = loadCustomPresets();
    customs[name] = arr;
    saveCustomPresets(customs);
    refreshPresetOptions(name);
  });
  delBtn?.addEventListener('click', ()=>{
    if (!presetSel) return;
    const name = presetSel.value;
    if (BUILTINS[name]) { alert('Cannot delete a built-in preset.'); return; }
    const customs = loadCustomPresets();
    if (!(name in customs)) { alert('Not a custom preset.'); return; }
    if (!confirm(`Delete preset "${name}"?`)) return;
    delete customs[name];
    saveCustomPresets(customs);
    refreshPresetOptions('Flat');
  });
  resetBtn?.addEventListener('click', ()=>{
    setPreamp(0);
    applyPresetByName('Flat');
    setEnabled(true);
  });

  // ----- Persistence -----
  function persist(){
    const data = {
      enabled: enableCb ? !!enableCb.checked : true,
      preamp: preamp ? parseFloat(preamp.value) : 0,
      bands: sliders.map(s=> parseFloat(s.input.value)),
      preset: presetSel ? presetSel.value : 'Flat'
    };
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }catch{}
  }
  function restore(){
    refreshPresetOptions();
    let data = null;
    try{
      const raw = localStorage.getItem(STORE_KEY);
      data = raw ? JSON.parse(raw) : null;
    }catch{}
    const presetName = data?.preset || 'Flat';

    setPreamp(data?.preamp ?? 0);
    setEnabled(data?.enabled ?? true);
    applyPresetByName(presetName);

    // Restore manual band tweaks on top
    if (data?.bands && Array.isArray(data.bands)){
      sliders.forEach((s,i)=>{
        const val = data.bands[i] ?? 0;
        s.input.value = val;
        s.out.textContent = (val>0?'+':'') + Number(val).toFixed(1) + ' dB';
        if (!enableCb || enableCb.checked) filters[i].gain.value = val;
      });
    }
  }
  restore();

  // Public API
  window.equalizerAPI = {
    setEnabled,
    setPreamp,
    setBand(index, dB){
      if (index<0 || index>=filters.length) return;
      const v = Number(dB);
      if (Number.isNaN(v)) return;
      sliders[index].input.value = v;
      sliders[index].out.textContent = (v>0?'+':'') + v.toFixed(1) + ' dB';
      if (!enableCb || enableCb.checked) filters[index].gain.value = v;
      persist();
    },
    applyPreset: applyPresetByName,
    getSettings(){
      return {
        enabled: enableCb ? !!enableCb.checked : true,
        preamp: preamp ? parseFloat(preamp.value) : 0,
        bands: sliders.map(s=> parseFloat(s.input.value)),
        preset: presetSel ? presetSel.value : 'Flat'
      };
    }
  };
})();
// ====== EQ Icon/Button Force Repaint ======
(function(){
  function refreshEqIconStyles(){
    const eqModal = document.getElementById('eq-modal');
    if (!eqModal) return;

    // Force all EQ icons (close, band switches, etc) to inherit currentColor
    eqModal.querySelectorAll('i.material-icons, .eq-icon-btn, .eq-close').forEach(el=>{
      el.style.color = getComputedStyle(eqModal).getPropertyValue('--eq-accent') || 'var(--app-accent)';
      el.style.webkitTextFillColor = el.style.color;
      el.style.filter = `drop-shadow(0 0 6px ${getComputedStyle(eqModal).getPropertyValue('--eq-primary') || 'var(--app-primary)'})`;
    });

    // Force background on buttons to match gradient theme
    eqModal.querySelectorAll('button, .eq-btn').forEach(btn=>{
      btn.style.background = getComputedStyle(eqModal).getPropertyValue('--eq-grad');
      btn.style.color = '#0b0d10'; // contrast text
    });
  }

  // Initial paint
  refreshEqIconStyles();

  // On theme changes
  window.addEventListener('theme:changed', refreshEqIconStyles);

  // Mutation observer fallback
  new MutationObserver(refreshEqIconStyles).observe(document.documentElement, {
    attributes:true,
    attributeFilter:['style','class','data-theme']
  });

  // Expose for manual debug refresh
  window.eqForceRefreshIcons = refreshEqIconStyles;
})();