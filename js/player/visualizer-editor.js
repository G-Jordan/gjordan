// js/player/visualizer-editor.js — Phase 11.2 lightweight stable studio
(function(){
  "use strict";

  const STORAGE_KEY = 'g73-vz-lite-preset';
  const root = document.getElementById('vz-editor-root');
  const openBtn = document.getElementById('vz-open-editor');
  if (!root || !openBtn) return;
  if (root.parentElement !== document.body) document.body.appendChild(root);

  const PRESETS = [
    { key:'solar', name:'Solar Flare', mode:'single', color1:'#fff200', color2:'#ff7a00', glow:12, opacity:0.94, smoothing:0.74, fps:36, rounded:false, spacing:1, background:'transparent' },
    { key:'aurora', name:'Aurora Bloom', mode:'single', color1:'#00ffa3', color2:'#58a6ff', glow:12, opacity:0.88, smoothing:0.86, fps:36, rounded:true, spacing:2, background:'transparent' },
    { key:'cyber', name:'Cyberpunk', mode:'single', color1:'#ff00c8', color2:'#00e5ff', glow:15, opacity:0.9, smoothing:0.79, fps:45, rounded:false, spacing:1, background:'transparent' },
    { key:'lava', name:'Lava Rush', mode:'single', color1:'#ff2400', color2:'#ffe600', glow:16, opacity:0.96, smoothing:0.7, fps:45, rounded:false, spacing:0, background:'transparent' },
    { key:'ocean', name:'Ocean Drive', mode:'single', color1:'#00c6ff', color2:'#0072ff', glow:8, opacity:0.84, smoothing:0.9, fps:30, rounded:true, spacing:3, background:'transparent' },
    { key:'forest', name:'Forest Pulse', mode:'single', color1:'#2af598', color2:'#009efd', glow:9, opacity:0.86, smoothing:0.86, fps:30, rounded:true, spacing:2, background:'transparent' },
    { key:'candy', name:'Candy Glow', mode:'single', color1:'#ff61d2', color2:'#fe9090', glow:11, opacity:0.9, smoothing:0.8, fps:30, rounded:true, spacing:3, background:'transparent' },
    { key:'royal', name:'Royal Velvet', mode:'single', color1:'#7f00ff', color2:'#e100ff', glow:13, opacity:0.88, smoothing:0.82, fps:36, rounded:true, spacing:2, background:'transparent' },
    { key:'sunset', name:'Sunset Wave', mode:'single', color1:'#f7971e', color2:'#ffd200', glow:10, opacity:0.9, smoothing:0.78, fps:30, rounded:true, spacing:2, background:'transparent' },
    { key:'arctic', name:'Arctic Night', mode:'single', color1:'#cfd9df', color2:'#e2ebf0', glow:5, opacity:0.78, smoothing:0.92, fps:24, rounded:true, spacing:4, background:'transparent' },
    { key:'toxic', name:'Toxic Lime', mode:'single', color1:'#d4fc79', color2:'#96e6a1', glow:11, opacity:0.92, smoothing:0.75, fps:36, rounded:false, spacing:1, background:'transparent' },
    { key:'storm', name:'Storm Front', mode:'single', color1:'#4b6cb7', color2:'#182848', glow:7, opacity:0.82, smoothing:0.9, fps:24, rounded:true, spacing:3, background:'transparent' },
    { key:'peach', name:'Peach Mist', mode:'single', color1:'#ffecd2', color2:'#fcb69f', glow:7, opacity:0.86, smoothing:0.85, fps:24, rounded:true, spacing:4, background:'transparent' },
    { key:'mint', name:'Mint Air', mode:'single', color1:'#84fab0', color2:'#8fd3f4', glow:8, opacity:0.87, smoothing:0.88, fps:24, rounded:true, spacing:3, background:'transparent' },
    { key:'ruby', name:'Ruby Club', mode:'single', color1:'#ff0844', color2:'#ffb199', glow:14, opacity:0.93, smoothing:0.72, fps:40, rounded:false, spacing:1, background:'transparent' },
    { key:'violet', name:'Violet Beam', mode:'single', color1:'#8e2de2', color2:'#4a00e0', glow:12, opacity:0.88, smoothing:0.84, fps:36, rounded:true, spacing:2, background:'transparent' },
    { key:'tropic', name:'Tropic Heat', mode:'single', color1:'#00f5d4', color2:'#f15bb5', glow:13, opacity:0.9, smoothing:0.76, fps:36, rounded:true, spacing:2, background:'transparent' },
    { key:'steel', name:'Steel Blue', mode:'single', color1:'#bdc3c7', color2:'#2c3e50', glow:4, opacity:0.8, smoothing:0.92, fps:24, rounded:true, spacing:3, background:'transparent' },
    { key:'desert', name:'Desert Sun', mode:'single', color1:'#f6d365', color2:'#fda085', glow:9, opacity:0.88, smoothing:0.8, fps:30, rounded:true, spacing:2, background:'transparent' },
    { key:'galaxy', name:'Galaxy Core', mode:'single', color1:'#00dbde', color2:'#fc00ff', glow:14, opacity:0.92, smoothing:0.82, fps:40, rounded:true, spacing:1, background:'transparent' },
    { key:'coral', name:'Coral Reef', mode:'single', color1:'#ff9966', color2:'#ff5e62', glow:11, opacity:0.9, smoothing:0.78, fps:30, rounded:true, spacing:2, background:'transparent' },
    { key:'meadow', name:'Meadow Light', mode:'single', color1:'#56ab2f', color2:'#a8e063', glow:8, opacity:0.86, smoothing:0.88, fps:24, rounded:true, spacing:3, background:'transparent' },
    { key:'plum', name:'Plum Smoke', mode:'single', color1:'#cc2b5e', color2:'#753a88', glow:10, opacity:0.86, smoothing:0.84, fps:30, rounded:true, spacing:2, background:'transparent' },
    { key:'bronze', name:'Bronze Fire', mode:'single', color1:'#b79891', color2:'#94716b', glow:8, opacity:0.85, smoothing:0.82, fps:24, rounded:false, spacing:2, background:'transparent' },
    { key:'seafoam', name:'Seafoam', mode:'single', color1:'#2afadf', color2:'#4c83ff', glow:10, opacity:0.88, smoothing:0.88, fps:30, rounded:true, spacing:2, background:'transparent' },
    { key:'voltage', name:'Voltage', mode:'single', color1:'#f7971e', color2:'#ffd200', glow:15, opacity:0.95, smoothing:0.68, fps:45, rounded:false, spacing:0, background:'transparent' },
    { key:'orchid', name:'Orchid', mode:'single', color1:'#da22ff', color2:'#9733ee', glow:11, opacity:0.89, smoothing:0.84, fps:36, rounded:true, spacing:2, background:'transparent' },
    { key:'citrus', name:'Citrus Flash', mode:'single', color1:'#f9d423', color2:'#ff4e50', glow:12, opacity:0.92, smoothing:0.76, fps:36, rounded:false, spacing:1, background:'transparent' },
    { key:'g73', name:'G73 Neon', mode:'single', color1:'#39ff14', color2:'#b478ff', glow:10, opacity:0.9, smoothing:0.82, fps:30, rounded:true, spacing:2, background:'transparent' },
    { key:'midnight', name:'Midnight Stage', mode:'single', color1:'#5fa0ff', color2:'#b478ff', glow:8, opacity:0.86, smoothing:0.88, fps:30, rounded:true, spacing:3, background:'transparent' },
    { key:'ember', name:'Ember Glow', mode:'single', color1:'#ff6a00', color2:'#ffd54f', glow:12, opacity:0.92, smoothing:0.76, fps:36, rounded:false, spacing:1, background:'transparent' },
    { key:'ice', name:'Ice Glass', mode:'single', color1:'#d9f3ff', color2:'#7dd3fc', glow:6, opacity:0.82, smoothing:0.9, fps:24, rounded:true, spacing:3, background:'transparent' },
    { key:'pulse', name:'Pulse Orb', mode:'single', color1:'#ff4d8d', color2:'#ffb36b', glow:14, opacity:0.95, smoothing:0.7, fps:40, rounded:true, spacing:5, background:'transparent' },
    { key:'mono', name:'Monochrome Clean', mode:'single', color1:'#f3f4f6', color2:'#9ca3af', glow:4, opacity:0.78, smoothing:0.9, fps:24, rounded:true, spacing:2, background:'transparent' }
  ];

  const style = document.createElement('style');
  style.textContent = `
    #vz-editor-root{position:fixed !important;inset:0 !important;display:none;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));z-index:10000;overflow:hidden}
    #vz-editor-root.open{display:flex !important}
    #vz-editor-root::before{content:"";position:absolute;inset:0;background:rgba(0,0,0,.56);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
    #vz-lite{position:relative;z-index:1;width:min(96vw,1240px);height:min(92dvh,960px);display:flex;flex-direction:column;overflow:hidden;border-radius:22px;background:rgba(13,16,22,.97);border:1px solid rgba(255,255,255,.1);box-shadow:0 24px 70px rgba(0,0,0,.55);color:#f5f7fb;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:auto}
    #vz-lite .head{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex:0 0 auto}
    #vz-lite .head-left{display:grid;gap:3px}
    #vz-lite .grab{width:48px;height:6px;border-radius:999px;background:rgba(255,255,255,.35);margin:0 auto 4px}
    #vz-lite .title{font-weight:800;font-size:19px;line-height:1.1}
    #vz-lite .sub{font-size:12px;opacity:.75}
    #vz-lite .close{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:#12161f;color:#fff;cursor:pointer}
    #vz-lite .body{padding:14px;display:flex;flex-direction:column;gap:14px;overflow:auto;flex:1 1 auto;min-height:0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-gutter:stable both-edges}
    #vz-lite .card{border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.03);padding:12px}
    #vz-lite h3{margin:0 0 10px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.86;text-align:center}
    .vz-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;max-height:34dvh;overflow:auto;padding-right:4px;align-content:start;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-gutter:stable both-edges}
    .vz-preset{border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#10141d;padding:10px;cursor:pointer;display:grid;gap:8px;transition:transform .12s ease, box-shadow .12s ease,border-color .12s ease;text-align:left}
    .vz-preset:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.28)}
    .vz-preset.active{border-color:rgba(255,255,255,.28);box-shadow:0 0 0 3px rgba(255,255,255,.08)}
    .vz-bars{height:34px;border-radius:10px;background:rgba(255,255,255,.04);padding:7px;display:flex;align-items:flex-end;gap:3px;overflow:hidden}
    .vz-bars span{flex:1;border-radius:999px 999px 3px 3px;min-height:5px;background:linear-gradient(180deg,var(--a),var(--b));box-shadow:0 0 10px color-mix(in srgb,var(--a) 30%,transparent)}
    .vz-preset .name{font-weight:700;font-size:14px}
    .vz-preset .meta{font-size:12px;opacity:.72}
    .vz-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-content:start}
    .field{display:grid;gap:6px}
    .field>label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;opacity:.8;text-align:center}
    .field input[type="range"]{width:100%;touch-action:pan-x}
    .field input[type="color"]{width:100%;height:32px;border:1px solid rgba(255,255,255,.12);background:#0f121a;border-radius:12px;padding:0}
    .field select,.btn{min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#0f121a;color:#fff;font:inherit}
    .field select{padding:8px 10px}
    .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;cursor:pointer}
    .hint{margin:10px 0 0;opacity:.72;font-size:12px;line-height:1.4}
    .foot{display:flex;justify-content:flex-end;gap:10px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.08);background:inherit;flex:0 0 auto}
    @media (max-width:980px){ .vz-controls,.row2{grid-template-columns:1fr} .actions{grid-template-columns:1fr 1fr} }
    @media (max-width:640px){ #vz-lite{width:min(98vw,1240px);height:min(94dvh,960px)} .actions{grid-template-columns:1fr} .vz-presets{grid-template-columns:1fr 1fr;max-height:30dvh} }
  `;
  document.head.appendChild(style);

  root.innerHTML = `
    <div id="vz-lite" role="dialog" aria-modal="true" aria-label="Visualizer Studio">
      <div class="head">
        <div class="head-left">
          <div class="grab"></div>
          <div class="title">Visualizer Studio</div>
          <div class="sub">Lighter, faster, and easier to use</div>
        </div>
        <button class="close" type="button" id="vz-lite-close"><span class="material-icons">close</span>Close</button>
      </div>
      <div class="body">
        <section class="card">
          <h3>33 Quick Presets</h3>
          <div id="vz-presets" class="vz-presets"></div>
        </section>
        <div class="vz-controls" style="align-items:start">
          <section class="card">
            <h3>Style</h3>
            <div class="field"><label for="vz-mode">Mode</label><select id="vz-mode"><option value="single">Classic Bars</option><option value="mirror">Mirror Bars</option><option value="mirror-invert">Mirror Inverted</option></select></div>
            <div class="row2">
              <div class="field"><label for="vz-color1">Primary Color</label><input id="vz-color1" type="color"></div>
              <div class="field"><label for="vz-color2">Accent Color</label><input id="vz-color2" type="color"></div>
            </div>
            <div class="row2">
              <div class="field"><label for="vz-rounded">Bar Shape</label><select id="vz-rounded"><option value="yes">Rounded</option><option value="no">Sharp</option></select></div>
              <div class="field"><label for="vz-background">Backdrop</label><select id="vz-background"><option value="transparent">Transparent</option><option value="#02040a">Dark Wash</option><option value="#000000">Blackout</option></select></div>
            </div>
          </section>
          <section class="card">
            <h3>Motion</h3>
            <div class="field"><label for="vz-maxBars">Density</label><input id="vz-maxBars" type="range" min="8" max="512" step="1"></div>
            <div class="field"><label for="vz-smoothing">Smoothing</label><input id="vz-smoothing" type="range" min="0" max="0.95" step="0.01"></div>
            <div class="field"><label for="vz-glow">Glow</label><input id="vz-glow" type="range" min="0" max="18" step="1"></div>
            <div class="field"><label for="vz-opacity">Opacity</label><input id="vz-opacity" type="range" min="0.2" max="1" step="0.01"></div>
            <div class="row2">
              <div class="field"><label for="vz-fps">FPS Cap</label><input id="vz-fps" type="range" min="12" max="120" step="1"></div>
              <div class="field"><label for="vz-spacing">Spacing</label><input id="vz-spacing" type="range" min="0" max="8" step="1"></div>
            </div>
          </section>
        </div>
        <section class="card">
          <h3>Actions</h3>
          <div class="actions">
            <button class="btn" type="button" id="vz-use-site"><span class="material-icons">palette</span>Use Site Theme Colors</button>
            <button class="btn" type="button" id="vz-reset"><span class="material-icons">restart_alt</span>Reset</button>
            <button class="btn" type="button" id="vz-save"><span class="material-icons">save</span>Save Current Look</button>
            <button class="btn" type="button" id="vz-load"><span class="material-icons">download</span>Load Saved Look</button>
          </div>
          <p class="hint">Presets apply style only. Density is fully controlled by the slider above. Higher values create thinner bars; this build prefers a WebGL renderer with a 2D fallback. Lockscreen and notification controls still use Media Session.</p>
        </section>
      </div>
      <div class="foot">
        <button class="btn" type="button" id="vz-foot-defaults"><span class="material-icons">restart_alt</span>Defaults</button>
        <button class="btn" type="button" id="vz-foot-save"><span class="material-icons">save</span>Save Preset</button>
      </div>
    </div>`;

  const presetsEl = root.querySelector('#vz-presets');
  const closeBtn = root.querySelector('#vz-lite-close');
  const bodyEl = root.querySelector('.body');
  const fields = {
    mode: root.querySelector('#vz-mode'),
    color1: root.querySelector('#vz-color1'),
    color2: root.querySelector('#vz-color2'),
    rounded: root.querySelector('#vz-rounded'),
    background: root.querySelector('#vz-background'),
    maxBars: root.querySelector('#vz-maxBars'),
    smoothing: root.querySelector('#vz-smoothing'),
    glow: root.querySelector('#vz-glow'),
    opacity: root.querySelector('#vz-opacity'),
    fps: root.querySelector('#vz-fps'),
    spacing: root.querySelector('#vz-spacing')
  };

  const safeAPI = () => window.visualizerAPI && typeof window.visualizerAPI.applySceneExact === 'function';
  const getSettings = () => safeAPI() ? window.visualizerAPI.getSettings() : {};
  const siteColors = () => {
    const cs = getComputedStyle(document.documentElement);
    return {
      color1: (cs.getPropertyValue('--app-primary') || '#5fa0ff').trim() || '#5fa0ff',
      color2: (cs.getPropertyValue('--app-accent') || '#b478ff').trim() || '#b478ff'
    };
  };
  const normalizeColor = (value, fallback) => {
    const v = (value || fallback || '').trim();
    if (!v) return '#000000';
    if (v.startsWith('#')) return v.length===4 ? '#'+v[1]*2+v[2]*2+v[3]*2 : v;
    const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) return '#' + [m[1],m[2],m[3]].map(n=>('0'+parseInt(n,10).toString(16)).slice(-2)).join('');
    return fallback || '#000000';
  };

  function patchToScene(src){
    const live = getSettings();
    const mode = src.mode || (live.mirror ? (live.mirrorInvert ? 'mirror-invert' : 'mirror') : 'single');
    return {
      mirror: mode !== 'single',
      mirrorInvert: mode === 'mirror-invert',
      rounded: src.rounded !== false,
      color1: src.color1 || live.color1 || siteColors().color1,
      color2: src.color2 || live.color2 || siteColors().color2,
      background: src.background === 'transparent' ? 'rgba(0,0,0,0)' : (src.background || live.background || 'rgba(0,0,0,0)'),
      glow: Number(src.glow ?? live.glow ?? 8),
      globalAlpha: Number(src.opacity ?? live.globalAlpha ?? 0.9),
      maxBars: Number(src.maxBars ?? live.maxBars ?? 48),
      smoothing: Number(src.smoothing ?? live.smoothing ?? 0.82),
      fps: Number(src.fps ?? live.fps ?? 30),
      barSpacing: Number(src.spacing ?? live.barSpacing ?? 2),
      animateHue: false,
      hueSpeed: 0,
      visualDecay: Number(live.visualDecay ?? 0.04),
      logScale: !!live.logScale,
      showCaps: !!live.showCaps,
      capFall: Number(live.capFall ?? 2),
      capHeight: Number(live.capHeight ?? 3),
      minBin: Number(live.minBin ?? 0),
      maxBin: Number(live.maxBin ?? 0),
      noiseFloor: Number(live.noiseFloor ?? 0),
      blendMode: live.blendMode || 'source-over'
    };
  }

  function currentScene(){
    const s = getSettings();
    return {
      mode: s.mirror ? (s.mirrorInvert ? 'mirror-invert' : 'mirror') : 'single',
      color1: s.color1 || siteColors().color1,
      color2: s.color2 || siteColors().color2,
      rounded: !!s.rounded,
      background: (s.background === 'rgba(0,0,0,0)' || s.background === 'transparent') ? 'transparent' : (s.background || '#02040a'),
      glow: Number(s.glow ?? 8),
      opacity: Number(s.globalAlpha ?? 0.9),
      maxBars: Number(s.maxBars ?? 48),
      smoothing: Number(s.smoothing ?? 0.82),
      fps: Number(s.fps ?? 30),
      spacing: Number(s.barSpacing ?? 2)
    };
  }

  function applyScene(scene){
    if (!safeAPI()) return;
    window.visualizerAPI.applySceneExact(patchToScene(scene));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scene)); } catch {}
    syncUI();
  }

  function matchesPreset(a,b){
    return a.mode===b.mode && normalizeColor(a.color1,'')===normalizeColor(b.color1,'') && normalizeColor(a.color2,'')===normalizeColor(b.color2,'') && !!a.rounded===!!b.rounded;
  }

  function makePresetCard(scene){
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'vz-preset';
    card.dataset.key = scene.key;
    const bars = document.createElement('div');
    bars.className = 'vz-bars';
    bars.style.setProperty('--a', scene.color1);
    bars.style.setProperty('--b', scene.color2);
    [16,26,12,20,30,14,22,10].forEach(h=>{
      const span = document.createElement('span');
      span.style.height = h + 'px';
      bars.appendChild(span);
    });
    const modeLabel = scene.mode === 'mirror-invert' ? 'Mirror Inverted' : (scene.mode === 'mirror' ? 'Mirror' : 'Classic');
    card.innerHTML = `<div class="name">${scene.name}</div><div class="meta">${modeLabel} • ${scene.glow}px glow • ${scene.fps} fps</div>`;
    card.prepend(bars);
    card.addEventListener('click', ()=> applyScene(scene));
    return card;
  }

  PRESETS.forEach(scene => presetsEl.appendChild(makePresetCard(scene)));

  function syncUI(){
    const s = currentScene();
    fields.mode.value = s.mode;
    fields.color1.value = normalizeColor(s.color1, '#5fa0ff');
    fields.color2.value = normalizeColor(s.color2, '#b478ff');
    fields.rounded.value = s.rounded ? 'yes' : 'no';
    fields.background.value = s.background;
    fields.maxBars.value = String(s.maxBars);
    fields.smoothing.value = String(s.smoothing);
    fields.glow.value = String(s.glow);
    fields.opacity.value = String(s.opacity);
    fields.fps.value = String(s.fps);
    fields.spacing.value = String(s.spacing);
    [...presetsEl.children].forEach(card=>{
      const key = card.dataset.key;
      const scene = PRESETS.find(p=>p.key===key);
      card.classList.toggle('active', !!(scene && matchesPreset(s, scene)));
    });
  }

  function applyFromFields(){
    applyScene({
      mode: fields.mode.value,
      color1: fields.color1.value,
      color2: fields.color2.value,
      rounded: fields.rounded.value === 'yes',
      background: fields.background.value,
      maxBars: Number(fields.maxBars.value),
      smoothing: Number(fields.smoothing.value),
      glow: Number(fields.glow.value),
      opacity: Number(fields.opacity.value),
      fps: Number(fields.fps.value),
      spacing: Number(fields.spacing.value)
    });
  }
  Object.values(fields).forEach(input=> input.addEventListener('input', applyFromFields));
  Object.values(fields).forEach(input=> input.addEventListener('change', applyFromFields));

  root.querySelector('#vz-use-site').addEventListener('click', ()=> {
    const c = siteColors();
    fields.color1.value = normalizeColor(c.color1, '#5fa0ff');
    fields.color2.value = normalizeColor(c.color2, '#b478ff');
    applyFromFields();
  });
  root.querySelector('#vz-reset').addEventListener('click', ()=> applyScene(PRESETS.find(p=>p.key==='g73') || PRESETS[0]));
  root.querySelector('#vz-foot-defaults').addEventListener('click', ()=> applyScene(PRESETS.find(p=>p.key==='g73') || PRESETS[0]));
  const saveCurrent = ()=> { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(currentScene())); } catch {} };
  root.querySelector('#vz-save').addEventListener('click', saveCurrent);
  root.querySelector('#vz-foot-save').addEventListener('click', saveCurrent);
  root.querySelector('#vz-load').addEventListener('click', ()=> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') applyScene(saved);
    } catch {}
  });

  let savedScrollY = 0;
  function lockPageScroll(){
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockPageScroll(){
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY || 0);
  }
  function openEditor(){
    lockPageScroll();
    root.classList.add('open');
    bodyEl.scrollTop = 0;
    presetsEl.scrollTop = 0;
    syncUI();
    window.dispatchEvent(new CustomEvent('vz:editor-open'));
  }
  function closeEditor(){
    root.classList.remove('open');
    unlockPageScroll();
    window.dispatchEvent(new CustomEvent('vz:editor-close'));
  }

  openBtn.addEventListener('click', openEditor);
  closeBtn.addEventListener('click', closeEditor);
  root.addEventListener('click', (e)=>{ if (e.target === root) closeEditor(); });
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && root.classList.contains('open')) closeEditor(); });

  function boot(){
    const saved = (()=>{ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }})();
    if (safeAPI()) applyScene(saved && typeof saved === 'object' ? saved : (PRESETS.find(p=>p.key==='g73') || PRESETS[0]));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=> setTimeout(boot, 0), { once:true });
  else setTimeout(boot, 0);
})();
