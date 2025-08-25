// js/player/visualizer-editor.js — v3.9
// - Super Theme buttons with proper gradient (CSS vars set correctly)
// - 30 Site Theme color swatches visible in Color tab
// - Swipe-down-to-close only on header drag, higher threshold, only at top
// - Sanitizer + ~30 bars default (mirror halves per side)
// - Icon tabs, mobile-friendly, live mini preview, presets manager

/* global visualizerAPI, setupVisualizer */
(function () {
  "use strict";

  const STORAGE_KEY = "visualizerSettingsV3";
  const PRESET_KEY  = "visualizerPresetsV3";

  // ---------- tiny dom helpers ----------
  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "style") {
        // Allow either string or object; support CSS custom properties
        if (typeof v === "string") {
          n.setAttribute("style", v);
        } else if (v && typeof v === "object") {
          for (const [sk, sv] of Object.entries(v)) {
            if (sk.startsWith("--")) n.style.setProperty(sk, sv);
            else n.style[sk] = sv;
          }
        }
      } else if (k.startsWith("on") && typeof v === "function") {
        n.addEventListener(k.slice(2), v, { passive: true });
      } else if (k === "html") {
        n.innerHTML = v;
      } else {
        n.setAttribute(k, v);
      }
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  const safe = (fn, fb) => { try { return fn(); } catch(e){ console.error(e); return fb; } };
  const apiReady = () => !!(window.visualizerAPI && typeof window.visualizerAPI.getSettings === "function");

  // ---------- sanitizer ----------
  const VALID_BLEND = new Set(["source-over","lighter","screen","overlay","multiply","plus-lighter"]);
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function round(n, p=2){ const m = Math.pow(10, p); return Math.round(n*m)/m; }

  function sanitizeSettings(patch, opts = {}){
    const s = { ...(patch||{}) };

    // Color & motion
    s.baseHue    = clamp(((s.baseHue ?? 0) % 360 + 360) % 360, 0, 359.999);
    s.saturation = clamp(s.saturation ?? 100, 0, 100);
    s.lightness1 = clamp(s.lightness1 ?? 40, 0, 100);
    s.lightness2 = clamp(s.lightness2 ?? 70, 0, 100);
    s.animateHue = !!(s.animateHue ?? true);
    s.hueSpeed   = clamp(s.hueSpeed ?? 0.3, 0, 6);

    // Look
    s.background   = s.background || "#000000";
    s.glow         = clamp(s.glow ?? 0, 0, 40);
    s.rounded      = !!(s.rounded ?? true);
    s.blendMode    = VALID_BLEND.has(s.blendMode) ? s.blendMode : "source-over";
    s.globalAlpha  = clamp(s.globalAlpha ?? 1, 0.15, 1); // never fully invisible

    // Layout
    s.mirror     = !!(s.mirror ?? false);
    s.barSpacing = clamp(s.barSpacing ?? 1, 0, 12);

    // Analysis
    s.fftSize   = clamp(s.fftSize ?? 256, 32, 32768);
    s.smoothing = clamp(s.smoothing ?? 0.8, 0, 0.99);
    s.noiseFloor= clamp(s.noiseFloor ?? 0, 0, 120);
    s.minBin    = clamp(s.minBin ?? 0, 0, 16384);
    s.maxBin    = clamp(s.maxBin ?? 0, 0, 16384);
    if (s.maxBin && s.maxBin <= s.minBin) { s.maxBin = 0; }

    // Dynamics
    s.fps         = clamp(s.fps ?? 0, 0, 60);
    s.visualDecay = clamp(s.visualDecay ?? 0, 0, 0.98);
    s.showCaps    = !!(s.showCaps ?? false);
    s.capFall     = clamp(s.capFall ?? 2, 1, 10);
    s.capHeight   = clamp(s.capHeight ?? 3, 1, 12);

    // Bars across screen — default target (opts.desiredBars default ~30 total)
    const desired = clamp(opts.desiredBars ?? 30, 6, 120);
    const hasExplicitBars = Number.isFinite(s.maxBars) && s.maxBars > 0;
    if (!hasExplicitBars){
      s.maxBars = s.mirror ? Math.max(6, Math.floor(desired / 2)) : desired;
    } else {
      s.maxBars = clamp(Math.floor(s.maxBars), 1, 256);
    }

    // Round for consistency
    s.hueSpeed     = round(s.hueSpeed, 2);
    s.smoothing    = round(s.smoothing, 2);
    s.visualDecay  = round(s.visualDecay, 2);
    s.globalAlpha  = round(s.globalAlpha, 2);

    return s;
  }

  // ---------- styles ----------
  const style = el("style", {}, `
    #vz-panel{position:fixed;inset:auto 0 0 0;z-index:10001;background:rgba(18,18,20,0.5);backdrop-filter:blur(6px);color:#f5f5f5;display:none;max-height:100vh;border-top-left-radius:16px;border-top-right-radius:16px;box-shadow:0 -10px 30px rgba(0,0,0,.5);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
    #vz-panel.open{display:flex;flex-direction:column;height:80vh}
    @media(min-width:900px){ #vz-panel{width:min(920px,92vw);height:80vh;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:16px;inset:auto} }
    #vz-head{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:inherit;z-index:1}
    #vz-head .drag{width:40px;height:5px;border-radius:999px;background:rgba(255,255,255,.4);margin:0 auto}
    #vz-title{display:flex;align-items:center;gap:8px;font-weight:600}
    #vz-status{font-size:12px;opacity:.85;margin-left:8px}

    #vz-tabs{display:flex;overflow:auto;padding:8px 10px;gap:8px;border-bottom:1px solid rgba(255,255,255,.06)}
    .vz-tab{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:#121317;color:#eaeaea;cursor:pointer}
    .vz-tab.active{background:#1b1d24;border-color:rgba(255,255,255,.2)}
    .vz-tab i.material-icons{font-size:20px;line-height:1}

    #vz-body{flex:1;overflow:auto;padding:12px 14px}
    .section{margin-bottom:14px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(15,16,20,0.65)}
    .section h4{margin:0 0 8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;opacity:.9}

    .ctrl{display:flex;align-items:center;gap:10px;margin:10px 0}
    .ctrl label{flex:1;font-size:14px;opacity:.95}
    .ctrl .val{opacity:.8;font-variant-numeric:tabular-nums}
    .ctrl input[type="range"]{flex:1;min-width:140px;height:28px}
    .ctrl.small input[type="number"], .ctrl select, .ctrl input[type="text"], .ctrl input[type="color"]{width:140px;max-width:48vw;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#101114;color:#fff}
    .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .row .ctrl{flex:1}

    .button-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#151821;color:#eaeaea;cursor:pointer;font-size:13px}
    .btn i{font-family:'Material Icons';font-style:normal;font-size:18px}
    .btn.ghost{background:transparent}

    /* Site Theme preset grid (30) */
    .preset-grid{display:grid;grid-template-columns:repeat(10, 1fr);gap:6px}
    @media(max-width:520px){ .preset-grid{grid-template-columns:repeat(6, 1fr)} }
    .preset-chip{width:28px;height:28px;border-radius:7px;border:2px solid rgba(255,255,255,.5);cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.25)}
    .preset-chip:active{transform:scale(.96)}
    .preset-legend{display:flex;gap:6px;align-items:center;opacity:.85;font-size:12px;margin-top:8px}

    /* Mini preview */
    #vz-mini{width:100%;height:56px;border-radius:8px;background:#0c0f15;border:1px solid rgba(255,255,255,.1)}
  `);
  document.head.appendChild(style);

  // Extra CSS for Super Theme buttons
  const styleSuper = el("style", {}, `
    /* Super Themes as buttons */
    .super-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    @media(min-width:560px){ .super-grid{grid-template-columns:repeat(3,1fr)} }
    @media(min-width:880px){ .super-grid{grid-template-columns:repeat(4,1fr)} }

    .super-btn{
      display:flex;align-items:center;justify-content:space-between;
      gap:10px;padding:10px 12px;border-radius:12px;
      border:1px solid rgba(255,255,255,.14);
      background:#121317;color:#eaeaea;cursor:pointer;
      box-shadow:0 2px 6px rgba(0,0,0,.25);
      transition:transform .12s ease, box-shadow .12s ease, background .2s ease;
      user-select:none;
    }
    .super-btn:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(0,0,0,.35)}
    .super-btn:active{transform:translateY(0)}

    .super-chip{
      width:38px;height:24px;border-radius:8px;
      border:1px solid rgba(255,255,255,.22);
      background:linear-gradient(90deg,var(--a),var(--b));
      position:relative;overflow:hidden;flex:0 0 auto;
    }
    /* animated scan for a little life */
    .super-chip::after{
      content:"";position:absolute;inset:0;
      background:repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 6px, transparent 6px 12px);
      mix-blend-mode:screen;opacity:.3;animation:super-scan 2.1s linear infinite;
    }
    @keyframes super-scan{from{transform:translateX(0)}to{transform:translateX(100%)}}

    .super-name{font-size:13px;font-weight:600;letter-spacing:.02em;opacity:.95}
    .super-apply{font:normal 18px 'Material Icons'}
  `);
  document.head.appendChild(styleSuper);

  // ---------- primitive controls ----------
  function save(key,val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }
  function load(key,fb){ try{ const r=localStorage.getItem(key); return r?JSON.parse(r):fb; }catch{return fb;} }

  function applyPatch(p){
    if (!apiReady()) return;
    const clean = sanitizeSettings(p);
    window.visualizerAPI.updateSettings(clean);
    save(STORAGE_KEY, window.visualizerAPI.getSettings());
    drawMini();
  }
  function sNow(){ return safe(()=>window.visualizerAPI.getSettings(),{}); }

  function ctrlRange(key, label, { min, max, step = 1 }) {
    const v = sNow()?.[key] ?? 0;
    const input = el("input",{type:"range",min,max,step,value:v,oninput:e=>{
      const num = Number(e.target.value);
      applyPatch({[key]:num});
      const val = e.target.closest(".ctrl")?.querySelector(".val"); if (val) val.textContent = String(num);
    }});
    const val = el("span",{class:"val"},String(v));
    return el("div",{class:"ctrl"},[el("label",{},[label," ",val]), input]);
  }
  function ctrlNumber(key, label, { min, max, step = 1 }) {
    const v = sNow()?.[key] ?? 0;
    const input = el("input",{type:"number",min,max,step,value:v,oninput:e=>{
      const num = Number(e.target.value); if (Number.isFinite(num)) applyPatch({[key]:num});
    }});
    return el("div",{class:"ctrl small"},[el("label",{},label), input]);
  }
  function ctrlCheckbox(key, label) {
    const v = !!(sNow()?.[key]);
    const input = el("input",{type:"checkbox",checked:v,onchange:e=>applyPatch({[key]:!!e.target.checked})});
    const val = el("span",{class:"val"}, v? "On":"Off");
    return el("div",{class:"ctrl"},[el("label",{},[input," ",label," ",val])]);
  }
  function ctrlSelect(key, label, options){
    const v = sNow()?.[key];
    const select = el("select",{onchange:e=>applyPatch({[key]:e.target.value})},
      options.map(([val,text])=> el("option",{value:val,selected:v===val},text))
    );
    return el("div",{class:"ctrl"},[el("label",{},label), select]);
  }
  function ctrlColor(key,label){
    const v = sNow()?.[key] ?? "#000000";
    const input = el("input",{type:"color",value:v,oninput:e=>applyPatch({[key]:e.target.value})});
    return el("div",{class:"ctrl small"},[el("label",{},label),input]);
  }

  // ---------- Site Theme presets (UI colors) — 30 chips ----------
  const THEME_PRESETS = [
    {main:'#ff4757', accent:'#ffa502', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#3742fa', accent:'#1e90ff', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#2ed573', accent:'#1abc9c', text:'#000000', textBg:'#ecf0f1', border:'#2c3e50'},
    {main:'#eccc68', accent:'#ff7f50', text:'#000000', textBg:'#f1f2f6', border:'#2f3542'},
    {main:'#ff6b81', accent:'#ff4757', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#7bed9f', accent:'#2ed573', text:'#000000', textBg:'#ecf0f1', border:'#2c3e50'},
    {main:'#70a1ff', accent:'#1e90ff', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#a29bfe', accent:'#6c5ce7', text:'#ffffff', textBg:'#2d3436', border:'#dfe6e9'},
    {main:'#ff9ff3', accent:'#e84393', text:'#ffffff', textBg:'#2d3436', border:'#dfe6e9'},
    {main:'#ffbe76', accent:'#f0932b', text:'#000000', textBg:'#f6e58d', border:'#2d3436'},
    {main:'#badc58', accent:'#6ab04c', text:'#000000', textBg:'#dff9fb', border:'#2d3436'},
    {main:'#f8a5c2', accent:'#f78fb3', text:'#000000', textBg:'#f5f6fa', border:'#2d3436'},
    {main:'#c7ecee', accent:'#7ed6df', text:'#000000', textBg:'#f5f6fa', border:'#2d3436'},
    {main:'#30336b', accent:'#130f40', text:'#ffffff', textBg:'#2f3640', border:'#718093'},
    {main:'#ffb142', accent:'#e58e26', text:'#000000', textBg:'#f5f6fa', border:'#2d3436'},
    {main:'#cd84f1', accent:'#8854d0', text:'#ffffff', textBg:'#2d3436', border:'#dfe6e9'},
    {main:'#ff3838', accent:'#ff4d4d', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#3ae374', accent:'#2ed573', text:'#000000', textBg:'#ecf0f1', border:'#2c3e50'},
    {main:'#67e6dc', accent:'#1abc9c', text:'#000000', textBg:'#ecf0f1', border:'#2c3e50'},
    {main:'#7158e2', accent:'#3742fa', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#ff9f1a', accent:'#ffa502', text:'#000000', textBg:'#f1f2f6', border:'#2f3542'},
    {main:'#2f3542', accent:'#57606f', text:'#ffffff', textBg:'#2d3436', border:'#dfe6e9'},
    {main:'#dff9fb', accent:'#c7ecee', text:'#000000', textBg:'#f5f6fa', border:'#2d3436'},
    {main:'#ff6f61', accent:'#e74c3c', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#00b894', accent:'#55efc4', text:'#000000', textBg:'#ecf0f1', border:'#2c3e50'},
    {main:'#fd79a8', accent:'#e84393', text:'#ffffff', textBg:'#2d3436', border:'#dfe6e9'},
    {main:'#6c5ce7', accent:'#341f97', text:'#ffffff', textBg:'#2f3542', border:'#ced6e0'},
    {main:'#fab1a0', accent:'#e17055', text:'#000000', textBg:'#f5f6fa', border:'#2d3436'},
    {main:'#ffeaa7', accent:'#fdcb6e', text:'#000000', textBg:'#f5f6fa', border:'#2d3436'},
    {main:'#81ecec', accent:'#00cec9', text:'#000000', textBg:'#ecf0f1', border:'#2c3e50'}
  ];
  function applySiteThemePreset(p){
    const ids = { main:"mainThemeColor", accent:"accentColorPicker", text:"textColorPicker", textBg:"textBgColorPicker", border:"borderColorPicker" };
    Object.entries(ids).forEach(([k,id])=>{ const i=document.getElementById(id); if (i) i.value=p[k]; });
    if (typeof window.saveTheme === "function"){ try{ window.saveTheme(); }catch{} }
  }
  function themePresetGrid(){
    const grid = el("div",{class:"preset-grid"});
    THEME_PRESETS.forEach((p)=>{ 
      const chip = el("div",{class:"preset-chip",onclick:()=>applySiteThemePreset(p)});
      chip.style.background = p.main;
      chip.style.borderColor = p.border;
      grid.appendChild(chip);
    });
    const legend = el("div",{class:"preset-legend"},[el("span",{},"Tap a swatch to apply site theme colors.")]);
    return section("Theme Color Presets",[grid, legend]);
  }

  // ---------- SUPER THEMES (30) ----------
  const T = (p)=>p;
  const SUPER_THEMES = [
    ["Ocean",      T({ baseHue:200,saturation:85,lightness1:45,lightness2:65,animateHue:true,hueSpeed:0.25,blendMode:"lighter",globalAlpha:0.95,background:"#06121e",mirror:true, rounded:true, barSpacing:2, glow:12, showCaps:false, fps:45, visualDecay:0.12 })],
    ["Sunset",     T({ baseHue:18, saturation:95,lightness1:52,lightness2:62,animateHue:true,hueSpeed:0.35,blendMode:"screen",  globalAlpha:0.90,background:"#1d0e09",mirror:false,rounded:true, barSpacing:2, glow:10, showCaps:false, fps:45, visualDecay:0.10 })],
    ["Neon",       T({ baseHue:295,saturation:100,lightness1:55,lightness2:68,animateHue:true,hueSpeed:0.60,blendMode:"lighter",globalAlpha:1.00,background:"#0c0212",mirror:true, rounded:false,barSpacing:1, glow:18, showCaps:true,  capFall:3, capHeight:3, fps:60, visualDecay:0.06 })],
    ["Forest",     T({ baseHue:120,saturation:70,lightness1:40,lightness2:58,animateHue:false,hueSpeed:0.20,blendMode:"overlay", globalAlpha:0.90,background:"#07140b",mirror:false,rounded:true, barSpacing:2, glow:8,  showCaps:false, fps:45, visualDecay:0.14 })],
    ["Fire",       T({ baseHue:10, saturation:100,lightness1:50,lightness2:65,animateHue:true,hueSpeed:0.55,blendMode:"screen",  globalAlpha:1.00,background:"#190804",mirror:false,rounded:false,barSpacing:1, glow:16, showCaps:true,  capFall:4, capHeight:3, fps:60, visualDecay:0.08 })],
    ["Ice",        T({ baseHue:190,saturation:30, lightness1:85,lightness2:98,animateHue:false,hueSpeed:0.10,blendMode:"lighter",globalAlpha:0.85,background:"#061015",mirror:true, rounded:true, barSpacing:3, glow:6,  showCaps:false, fps:30, visualDecay:0.16 })],
    ["Galaxy",     T({ baseHue:265,saturation:85, lightness1:55,lightness2:70,animateHue:true,hueSpeed:0.30,blendMode:"lighter",globalAlpha:0.95,background:"#0a0816",mirror:true, rounded:true, barSpacing:1, glow:16, showCaps:true,  capFall:2, capHeight:2, fps:60, visualDecay:0.10 })],
    ["Aurora",     T({ baseHue:140,saturation:90, lightness1:50,lightness2:70,animateHue:true,hueSpeed:0.20,blendMode:"screen",  globalAlpha:0.95,background:"#04110b",mirror:true, rounded:true, barSpacing:2, glow:12, showCaps:false, fps:50, visualDecay:0.12 })],
    ["Candy",      T({ baseHue:330,saturation:90, lightness1:65,lightness2:80,animateHue:true,hueSpeed:0.40,blendMode:"lighter",globalAlpha:0.95,background:"#150611",mirror:false,rounded:true, barSpacing:1, glow:12, showCaps:false, fps:60, visualDecay:0.10 })],
    ["Midnight",   T({ baseHue:230,saturation:40, lightness1:35,lightness2:50,animateHue:false,hueSpeed:0.15,blendMode:"source-over", globalAlpha:0.85,background:"#05080f",mirror:false,rounded:true, barSpacing:2, glow:4,  showCaps:false, fps:30, visualDecay:0.20 })],
    ["Solar",      T({ baseHue:48, saturation:95, lightness1:55,lightness2:70,animateHue:true,hueSpeed:0.25,blendMode:"screen",  globalAlpha:0.95,background:"#141003",mirror:false,rounded:true, barSpacing:1, glow:10, showCaps:false, fps:60, visualDecay:0.10 })],
    ["Tropical",   T({ baseHue:165,saturation:95, lightness1:55,lightness2:70,animateHue:true,hueSpeed:0.35,blendMode:"lighter",globalAlpha:0.95,background:"#061410",mirror:true, rounded:true, barSpacing:1, glow:14, showCaps:false, fps:60, visualDecay:0.10 })],
    ["Steel",      T({ baseHue:210,saturation:10, lightness1:50,lightness2:65,animateHue:false,hueSpeed:0.10,blendMode:"overlay", globalAlpha:0.90,background:"#0e1013",mirror:false,rounded:false,barSpacing:3, glow:4,  showCaps:false, fps:45, visualDecay:0.18 })],
    ["Rose Gold",  T({ baseHue:13, saturation:55, lightness1:70,lightness2:82,animateHue:false,hueSpeed:0.10,blendMode:"lighter",globalAlpha:0.95,background:"#120a08",mirror:false,rounded:true, barSpacing:2, glow:8,  showCaps:false, fps:45, visualDecay:0.14 })],
    ["Cyberpunk",  T({ baseHue:300,saturation:100,lightness1:55,lightness2:70,animateHue:true,hueSpeed:0.50,blendMode:"lighter",globalAlpha:1.00,background:"#0b0012",mirror:true, rounded:false,barSpacing:1, glow:18, showCaps:true,  capFall:3, capHeight:3, fps:60, visualDecay:0.06 })],
    ["Lava",       T({ baseHue:5,  saturation:100,lightness1:45,lightness2:60,animateHue:true,hueSpeed:0.60,blendMode:"overlay", globalAlpha:0.95,background:"#120403",mirror:false,rounded:false,barSpacing:1, glow:16, showCaps:true,  capFall:4, capHeight:3, fps:60, visualDecay:0.08 })],
    ["Arctic",     T({ baseHue:200,saturation:20, lightness1:80,lightness2:95,animateHue:false,hueSpeed:0.10,blendMode:"screen",  globalAlpha:0.90,background:"#071016",mirror:true, rounded:true, barSpacing:3, glow:6,  showCaps:false, fps:30, visualDecay:0.16 })],
    ["Desert",     T({ baseHue:35, saturation:85, lightness1:60,lightness2:75,animateHue:false,hueSpeed:0.20,blendMode:"lighter",globalAlpha:0.90,background:"#120f06",mirror:false,rounded:true, barSpacing:2, glow:8,  showCaps:false, fps:45, visualDecay:0.14 })],
    ["Pastel Sky", T({ baseHue:260,saturation:35, lightness1:75,lightness2:88,animateHue:true,hueSpeed:0.20,blendMode:"screen",  globalAlpha:0.90,background:"#10131a",mirror:true, rounded:true, barSpacing:2, glow:10, showCaps:false, fps:50, visualDecay:0.12 })],
    ["Deep Sea",   T({ baseHue:210,saturation:70, lightness1:35,lightness2:55,animateHue:true,hueSpeed:0.18,blendMode:"overlay", globalAlpha:0.90,background:"#031018",mirror:true, rounded:false,barSpacing:1, glow:12, showCaps:true,  capFall:2, capHeight:2, fps:50, visualDecay:0.12 })],
    ["Meadow",     T({ baseHue:105,saturation:70, lightness1:50,lightness2:65,animateHue:false,hueSpeed:0.15,blendMode:"screen",  globalAlpha:0.90,background:"#0b1408",mirror:false,rounded:true, barSpacing:2, glow:8,  showCaps:false, fps:45, visualDecay:0.14 })],
    ["Monochrome", T({ baseHue:0,  saturation:0,  lightness1:30,lightness2:70,animateHue:false,hueSpeed:0.00,blendMode:"source-over",globalAlpha:0.90,background:"#0d0d0d",mirror:false,rounded:false,barSpacing:2, glow:2,  showCaps:false, fps:40, visualDecay:0.18 })],
    ["Royal",      T({ baseHue:255,saturation:80, lightness1:45,lightness2:60,animateHue:false,hueSpeed:0.15,blendMode:"lighter",globalAlpha:0.95,background:"#0a0a17",mirror:true, rounded:true, barSpacing:1, glow:14, showCaps:false, fps:60, visualDecay:0.10 })],
    ["Citrus",     T({ baseHue:50, saturation:100,lightness1:55,lightness2:70,animateHue:true,hueSpeed:0.35,blendMode:"screen",  globalAlpha:0.95,background:"#111205",mirror:false,rounded:true, barSpacing:1, glow:12, showCaps:false, fps:60, visualDecay:0.10 })],
    ["Sakura",     T({ baseHue:340,saturation:60, lightness1:75,lightness2:90,animateHue:false,hueSpeed:0.15,blendMode:"lighter",globalAlpha:0.95,background:"#160c12",mirror:false,rounded:true, barSpacing:2, glow:10, showCaps:false, fps:45, visualDecay:0.14 })],
    ["Vaporwave",  T({ baseHue:280,saturation:85, lightness1:60,lightness2:80,animateHue:true,hueSpeed:0.45,blendMode:"lighter",globalAlpha:1.00,background:"#0a0a15",mirror:true, rounded:false,barSpacing:1, glow:18, showCaps:true,  capFall:2, capHeight:2, fps:60, visualDecay:0.08 })],
    ["Storm",      T({ baseHue:220,saturation:35, lightness1:35,lightness2:55,animateHue:false,hueSpeed:0.10,blendMode:"overlay", globalAlpha:0.85,background:"#0a0d12",mirror:false,rounded:false,barSpacing:3, glow:4,  showCaps:false, fps:30, visualDecay:0.20 })],
    ["Ember",      T({ baseHue:25, saturation:95, lightness1:45,lightness2:58,animateHue:true,hueSpeed:0.30,blendMode:"screen",  globalAlpha:0.95,background:"#1a0d06",mirror:false,rounded:false,barSpacing:1, glow:12, showCaps:true,  capFall:3, capHeight:3, fps:60, visualDecay:0.10 })],
    ["Seashell",   T({ baseHue:18, saturation:35, lightness1:80,lightness2:92,animateHue:false,hueSpeed:0.10,blendMode:"lighter",globalAlpha:0.90,background:"#130f0b",mirror:true, rounded:true, barSpacing:3, glow:6,  showCaps:false, fps:40, visualDecay:0.16 })],
    ["High Contrast",T({baseHue:0,saturation:100, lightness1:50,lightness2:90,animateHue:false,hueSpeed:0.00,blendMode:"lighter",globalAlpha:1.00,background:"#000000",mirror:false,rounded:false,barSpacing:0, glow:14, showCaps:true,  capFall:2, capHeight:2, fps:60, visualDecay:0.08 })]
  ];

  // Build buttons for super themes (with proper gradients)
  function superThemeButtons(){
    if (SUPER_THEMES.length !== 30){
      console.warn(`[Visualizer Editor] SUPER_THEMES has ${SUPER_THEMES.length} items; expected 30.`);
    }
    const grid = el("div",{class:"super-grid"});
    SUPER_THEMES.forEach(([name, patch])=>{
      const preview = sanitizeSettings({...patch});
      const a = `hsl(${preview.baseHue}, ${Math.round(preview.saturation)}%, ${Math.round(preview.lightness1)}%)`;
      const b = `hsl(${(preview.baseHue + 60) % 360}, ${Math.round(preview.saturation)}%, ${Math.round(preview.lightness2)}%)`;
      const chip = el("div",{class:"super-chip", style:{ "--a": a, "--b": b }});
      const btnEl = el("button",{class:"super-btn", onclick:()=>applySuperTheme(patch)},[
        chip,
        el("div",{class:"super-name"}, name),
        el("i",{class:"super-apply"}, "palette")
      ]);
      grid.appendChild(btnEl);
    });
    return section("Super Themes (tap to apply)", grid);
  }

  // Apply a super theme safely + target ~30 total bars by default
  function applySuperTheme(patch){
    const s = sNow();
    const desired = clamp(s?.maxBars ? (s.mirror ? s.maxBars * 2 : s.maxBars) : 30, 12, 120);
    const sanitized = sanitizeSettings({...patch}, { desiredBars: desired });
    if (typeof patch.mirror === "undefined" && typeof s?.mirror === "boolean"){
      sanitized.mirror = s.mirror;
      sanitized.maxBars = sanitized.mirror ? Math.max(6, Math.floor(desired / 2)) : desired;
    }
    sanitized.fps = clamp(sanitized.fps, 0, 55);
    window.visualizerAPI.updateSettings(sanitized);
    save(STORAGE_KEY, window.visualizerAPI.getSettings());
    drawMini();
  }

  // ---------- blocks ----------
  function section(title, children){ return el("div",{class:"section"},[el("h4",{},title), ...(Array.isArray(children)?children:[children])]); }
  function btn(text, icon, onClick){ return el("button",{class:"btn",onclick:onClick},[el("i",{},icon), text]); }

  // ---------- Mini Live Preview (no audio) ----------
  let miniCanvas, miniCtx, miniRAF;
  function buildMini(){
    miniCanvas = el("canvas",{id:"vz-mini"});
    miniCtx = miniCanvas.getContext("2d");
    drawMini();
    return section("Live Preview (no audio)", miniCanvas);
  }
  function drawMini(){
    if (!miniCtx) return;
    cancelAnimationFrame(miniRAF);
    const s = sanitizeSettings(sNow());
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const cssW = miniCanvas.clientWidth || 600;
    const cssH = miniCanvas.clientHeight || 56;
    miniCanvas.width = Math.floor(cssW * dpr);
    miniCanvas.height= Math.floor(cssH * dpr);
    const W = miniCanvas.width, H = miniCanvas.height;

    // BG
    miniCtx.fillStyle = s.background || "#000";
    miniCtx.fillRect(0,0,W,H);

    // Compute demo bars
    const spacing = Math.max(0, s.barSpacing||1) * dpr;
    const desiredTotal = (s.maxBars && s.maxBars>0) ? (s.mirror ? s.maxBars*2 : s.maxBars) : clamp( Math.floor(cssW/8), 12, 120);
    const perSide = s.mirror ? Math.max(1, Math.floor(desiredTotal/2)) : desiredTotal;
    const totalBars = s.mirror ? perSide*2 : perSide;
    const totalSpacing = spacing * (perSide - 1) * (s.mirror?2:1);
    const barWidth = Math.max(1, Math.floor((W - totalSpacing) / Math.max(1,totalBars)));

    miniCtx.globalCompositeOperation = s.blendMode || "source-over";
    miniCtx.globalAlpha = s.globalAlpha ?? 1;
    miniCtx.shadowBlur = s.glow||0;
    miniCtx.shadowColor = `hsl(${s.baseHue||0}, ${s.saturation||0}%, ${Math.min((s.lightness2||50)+10,100)}%)`;

    const rounded = s.rounded!==false;
    const radius = rounded ? Math.min(8*dpr, barWidth/2) : 0;
    const baseHue = (s.baseHue||0) % 360;

    function drawSeries(startX, count){
      let x = startX;
      const t = Date.now()*0.002;
      for (let i=0;i<count;i++){
        const n = 0.4 + 0.6 * Math.abs(Math.sin(t + i*0.35));
        const h = n * H;
        const g = miniCtx.createLinearGradient(x, H, x, H - h);
        g.addColorStop(0, `hsl(${(baseHue + i) % 360}, ${s.saturation||0}%, ${s.lightness1||50}%)`);
        g.addColorStop(1, `hsl(${(baseHue + i + 60) % 360}, ${s.saturation||0}%, ${s.lightness2||60}%)`);
        miniCtx.fillStyle = g;

        if (radius>0){
          const r = Math.min(radius, barWidth/2, h/2);
          const y = H - h;
          miniCtx.beginPath();
          miniCtx.moveTo(x, H);
          miniCtx.lineTo(x, y + r);
          miniCtx.quadraticCurveTo(x, y, x + r, y);
          miniCtx.lineTo(x + barWidth - r, y);
          miniCtx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
          miniCtx.lineTo(x + barWidth, H);
          miniCtx.closePath();
          miniCtx.fill();
        } else {
          miniCtx.fillRect(x, H - h, barWidth, h);
        }
        x += barWidth + spacing;
      }
    }

    if (s.mirror){
      const totalWidth = (barWidth + spacing) * perSide - spacing;
      const leftStart = Math.floor(W/2 - totalWidth/2);
      drawSeries(leftStart, perSide);
      miniCtx.save(); miniCtx.translate(W,0); miniCtx.scale(-1,1); drawSeries(leftStart, perSide); miniCtx.restore();
    } else {
      drawSeries(0, perSide);
    }
    miniRAF = requestAnimationFrame(drawMini);
  }

  // ---------- Tabs ----------
  function tab_Analysis(){
    return el("div",{},[
      section("Analysis",[
        ctrlRange("maxBars","Max Bars (0 = auto)",{min:0,max:256,step:1}),
        ctrlRange("fftSize","FFT Size",{min:64,max:4096,step:64}),
        ctrlRange("smoothing","Smoothing",{min:0,max:0.99,step:0.01}),
        el("div",{class:"row"},[
          ctrlNumber("minBin","Min Bin",{min:0,max:4096,step:1}),
          ctrlNumber("maxBin","Max Bin (0=end)",{min:0,max:4096,step:1}),
        ]),
        ctrlCheckbox("logScale","Log frequency scale"),
        ctrlRange("noiseFloor","Noise floor",{min:0,max:80,step:1})
      ])
    ]);
  }
  function tab_Style(){
    return el("div",{},[
      section("Style",[
        ctrlColor("background","Background"),
        ctrlCheckbox("mirror","Mirror (center-out)"),
        ctrlCheckbox("rounded","Rounded bars"),
        ctrlRange("barSpacing","Bar spacing (px)",{min:0,max:12,step:1}),
        ctrlRange("glow","Glow",{min:0,max:40,step:1}),
        ctrlSelect("blendMode","Blend mode",[
          ["source-over","source-over"], ["lighter","lighter"], ["plus-lighter","plus-lighter"],
          ["screen","screen"], ["overlay","overlay"], ["multiply","multiply"]
        ]),
        ctrlRange("globalAlpha","Bars opacity",{min:0,max:1,step:0.05}),
        ctrlCheckbox("showCaps","Peak caps"),
        el("div",{class:"row"},[
          ctrlRange("capFall","Cap fall speed",{min:1,max:10,step:1}),
          ctrlRange("capHeight","Cap height (px)",{min:1,max:10,step:1})
        ]),
        el("div",{class:"row"},[
          ctrlRange("fps","FPS limit (0=unlimited)",{min:0,max:60,step:5}),
          ctrlRange("visualDecay","Visual decay",{min:0,max:0.98,step:0.02})
        ]),
        el("div",{class:"button-row"},[
          btn("Reset Style","refresh",()=>applyPatch({
            background:"#000000",mirror:false,rounded:true,barSpacing:1,glow:0,
            blendMode:"source-over",globalAlpha:1,showCaps:false,capFall:2,capHeight:3,fps:0,visualDecay:0
          }))
        ])
      ])
    ]);
  }
  function tab_Color(){
    const randomize = btn("Randomize Theme","shuffle",()=>{
      const pick = SUPER_THEMES[Math.floor(Math.random()*SUPER_THEMES.length)];
      const t = pick[1];
      const jitter = (v, j) => Math.max(0, Math.min(360, v + (Math.random()*2-1)*j));
      applyPatch(sanitizeSettings({...t, baseHue: jitter(t.baseHue, 24)}));
    });
    return el("div",{},[
      section("Color & Motion",[
        ctrlCheckbox("animateHue","Animate hue"),
        ctrlRange("hueSpeed","Hue speed",{min:0,max:3,step:0.05}),
        el("div",{class:"row"},[
          ctrlRange("baseHue","Base hue",{min:0,max:360,step:1}),
          ctrlRange("saturation","Saturation %",{min:0,max:100,step:1})
        ]),
        el("div",{class:"row"},[
          ctrlRange("lightness1","Lightness A %",{min:0,max:100,step:1}),
          ctrlRange("lightness2","Lightness B %",{min:0,max:100,step:1})
        ]),
        el("div",{class:"button-row"},[randomize])
      ]),
      buildMini(),
      superThemeButtons(),   // Named visualizer looks
      themePresetGrid()      // 30 UI theme color chips — now visible
    ]);
  }
  function tab_FX(){
    return el("div",{},[
      section("Dynamics & FX",[
        ctrlRange("fps","FPS limit (0=unlimited)",{min:0,max:60,step:5}),
        ctrlRange("visualDecay","Visual decay",{min:0,max:0.98,step:0.02}),
        ctrlCheckbox("showCaps","Show peak caps"),
        el("div",{class:"row"},[
          ctrlRange("capFall","Cap fall speed",{min:1,max:10,step:1}),
          ctrlRange("capHeight","Cap height (px)",{min:1,max:10,step:1})
        ])
      ]),
      section("Actions",[
        el("div",{class:"button-row"},[
          btn("Snapshot BG","image",()=>safe(()=>window.visualizerAPI.snapshotToBodyBackground())),
          btn("Export PNG","download",()=>safe(()=>window.visualizerAPI.exportPNG("visualizer.png"))),
          btn("Pause","pause",()=>safe(()=>window.visualizerAPI.pause())),
          btn("Resume","play_arrow",()=>safe(()=>window.visualizerAPI.resume()))
        ])
      ])
    ]);
  }
  function tab_Presets(){
    const presets = load(PRESET_KEY,{});
    const names = Object.keys(presets).sort();
    const select = el("select",{},[el("option",{value:""},"-- choose preset --"), ...names.map(n=>el("option",{value:n},n))]);
    const nameInput = el("input",{type:"text",placeholder:"Preset name"});
    const jsonBox = el("textarea",{placeholder:"Exported JSON"}); jsonBox.style.width="100%"; jsonBox.style.minHeight="90px";
    function savePresets(obj){ save(PRESET_KEY,obj); }
    return el("div",{},[
      section("Manage",[
        el("div",{class:"row"},[el("div",{class:"ctrl"},[el("label",{},"Load"), select])]),
        el("div",{class:"button-row"},[
          btn("Load","play_circle",()=>{ const n=select.value; if(!n)return; applyPatch({...presets[n]}); }),
          btn("Defaults","restart_alt",()=>applyPatch({...safe(()=>window.visualizerAPI.defaults,{})}))
        ]),
        el("div",{class:"row"},[el("div",{class:"ctrl"},[el("label",{},"Save as"), nameInput])]),
        el("div",{class:"button-row"},[
          btn("Save","save",()=>{ const n=(nameInput.value||"").trim(); if(!n)return; const all=load(PRESET_KEY,{}); all[n]=sanitizeSettings(safe(()=>window.visualizerAPI.getSettings(),{})); savePresets(all); alert("Saved preset: "+n); }),
          btn("Export JSON","content_copy",()=>{ jsonBox.value = JSON.stringify(sanitizeSettings(safe(()=>window.visualizerAPI.getSettings(),{})), null, 2); }),
          btn("Import JSON","content_paste",()=>{ try{ const obj=JSON.parse(jsonBox.value); applyPatch(sanitizeSettings(obj)); }catch{ alert("Invalid JSON"); } }),
          btn("Share URL","link",()=>{ try{ const str=btoa(JSON.stringify(sanitizeSettings(safe(()=>window.visualizerAPI.getSettings(),{})))); const url=location.origin+location.pathname+"#vz="+str; navigator.clipboard?.writeText(url); alert("Preset URL copied"); }catch{} })
        ]),
        el("div",{class:"ctrl"},[el("label",{},"Import/Export")]),
        jsonBox
      ])
    ]);
  }
  function tab_Info(){
    const kbd = (t)=>el("span",{class:"kbd"},t);
    return el("div",{class:"info"},[
      section("How it works",[
        el("p",{},"Web Audio API AnalyserNode → bars on a high-DPI canvas. Editor patches settings via visualizerAPI.updateSettings(patch)."),
        el("p",{},"Super Themes set color, motion, style, and FX for instant looks. A sanitizer keeps presets visible and performant.")
      ]),
      section("Performance tips",[
        el("ul",{},[
          el("li",{},"Set Max Bars ≈ 30–48 for phones (mirror halves per side)."),
          el("li",{},"FPS 30–45 and Glow ≤ 10 on low-end devices."),
          el("li",{},"Prefer 'lighter' or 'screen' over 'plus-lighter' for efficiency.")
        ])
      ]),
      section("Shortcuts",[ el("p",{},["Close editor: ",kbd("Esc"),". On mobile, drag the top grab bar down to close."]) ])
    ]);
  }

  // ---------- panel ----------
  function buildPanel(root, openBtn){
    const body   = el("div",{id:"vz-body"});
    const status = el("span",{id:"vz-status"},"");

    const panel = el("div",{id:"vz-panel",role:"dialog","aria-modal":"true"},[
      el("div",{id:"vz-head"},[
        el("span",{class:"drag"},""),
        el("div",{id:"vz-title"},["Visualizer Editor ", status]),
        el("button",{class:"btn ghost",onclick:()=>close()},[el("i",{},"close"),"Close"])
      ]),
      el("div",{id:"vz-tabs"},[
        el("button",{class:"vz-tab active",onclick:()=>showTab("analysis")},[el("i",{class:"material-icons"},"tune")]),
        el("button",{class:"vz-tab",onclick:()=>showTab("style")},   [el("i",{class:"material-icons"},"style")]),
        el("button",{class:"vz-tab",onclick:()=>showTab("color")},   [el("i",{class:"material-icons"},"palette")]),
        el("button",{class:"vz-tab",onclick:()=>showTab("fx")},      [el("i",{class:"material-icons"},"blur_on")]),
        el("button",{class:"vz-tab",onclick:()=>showTab("presets")}, [el("i",{class:"material-icons"},"collections_bookmark")]),
        el("button",{class:"vz-tab",onclick:()=>showTab("info")},    [el("i",{class:"material-icons"},"info")])
      ]),
      body,
      el("div",{id:"vz-foot"},[
        btn("Defaults","restart_alt",()=>applyPatch({...safe(()=>window.visualizerAPI.defaults,{})})),
        btn("Save Preset","save",()=>{
          const name=prompt("Preset name?"); if(!name) return;
          const all=load(PRESET_KEY,{}); all[name]=sanitizeSettings(safe(()=>window.visualizerAPI.getSettings(),{}));
          save(PRESET_KEY,all); alert("Saved preset: "+name);
        })
      ])
    ]);
    root.appendChild(panel);

    function setStatus(text, ok=true){ status.textContent = `· ${text}`; status.style.color = ok ? "#a8ffb0" : "#ffd1d1"; }

    function showTab(name){
      if (!apiReady()){
        setStatus("waiting for visualizer…", false);
        body.innerHTML=""; body.appendChild(section("Visualizer not ready",[el("p",{},"Make sure js/player/visualizer.js loaded and exposes window.visualizerAPI.")]));
        return;
      }
      setStatus("connected", true);
      const map = {analysis:tab_Analysis,style:tab_Style,color:tab_Color,fx:tab_FX,presets:tab_Presets,info:tab_Info};
      const tabs = Array.from(panel.querySelectorAll(".vz-tab"));
      tabs.forEach(t=>t.classList.remove("active"));
      const order = ["analysis","style","color","fx","presets","info"];
      const idx = order.indexOf(name); if (idx>=0) tabs[idx].classList.add("active");
      body.innerHTML=""; body.appendChild(map[name]());
      drawMini();
    }

    function open(){ panel.classList.add("open"); document.body.style.overflow="hidden"; }
    function close(){ panel.classList.remove("open"); document.body.style.overflow=""; }

    openBtn?.addEventListener("click", open, {passive:true});
    window.addEventListener("keydown", e=>{ if (e.key==="Escape") close(); }, {passive:true});

// --- Improved swipe-down close: mobile vs desktop aware, header-only, velocity + distance ---
const head = panel.querySelector("#vz-head");
const bodyEl = panel.querySelector("#vz-body");

let dragActive = false;
let startY = 0;
let lastY = 0;
let lastT = 0;
let dy = 0;
let startedAtTop = false;

function isDesktopCentered(){
  return window.matchMedia("(min-width: 900px)").matches;
}
function atTop(){
  return (bodyEl?.scrollTop || 0) <= 2;
}

function applyDragTransform(offset){
  if (isDesktopCentered()) {
    // desktop: panel is centered with translate(-50%, -50%)
    panel.style.transform = `translate(-50%, calc(-50% + ${offset}px))`;
  } else {
    // mobile: bottom sheet
    panel.style.transform = `translateY(${offset}px)`;
  }
}

function clearTransform(){
  panel.style.transform = "";
}

const CLOSE_DISTANCE_MOBILE  = 120;  // px
const CLOSE_DISTANCE_DESKTOP = 160;  // px
const FLICK_VELOCITY         = 1.0;  // px/ms (pretty assertive flick)

function onPointerDown(e){
  if (!head.contains(e.target)) return;

  // Prefer to start at top; allow tiny scroll to avoid being too strict
  startedAtTop = atTop();

  dragActive = true;
  startY = (e.clientY != null ? e.clientY : (e.touches?.[0]?.clientY || 0));
  lastY = startY;
  lastT = performance.now();
  dy = 0;

  panel.style.transition = "none";
  panel.style.willChange = "transform";

  // prevent page scroll while we grab
  e.preventDefault();
}

function onPointerMove(e){
  if (!dragActive) return;

  const y = (e.clientY != null ? e.clientY : (e.touches?.[0]?.clientY || 0));
  const t = performance.now();

  // Only count downward drag; ignore upwards (let user cancel naturally)
  dy = Math.max(0, y - startY);

  // If body is scrolling upward/downward while not at top and user hasn’t clearly pulled down,
  // let the scroll happen (no preventDefault). Once dy is meaningful, we take over.
  const TAKEOVER_DISTANCE = 8; // px
  if (!startedAtTop && dy < TAKEOVER_DISTANCE) return;

  applyDragTransform(Math.min(dy, 220)); // cap visual offset
  lastY = y;
  lastT = t;

  // We are handling the gesture; freeze scroll
  e.preventDefault();
}

function endDrag(){
  if (!dragActive) return;
  dragActive = false;

  const t = performance.now();
  const v = (lastY - startY) / Math.max(1, t - lastT); // px/ms

  const need = isDesktopCentered() ? CLOSE_DISTANCE_DESKTOP : CLOSE_DISTANCE_MOBILE;
  const shouldClose = (dy > need) || (v > FLICK_VELOCITY);

  panel.style.transition = "transform 200ms ease";
  panel.style.willChange = "auto";

  if (shouldClose) {
    panel.classList.remove("open");
    document.body.style.overflow = "";
    // reset transform after closing so next open is clean for both layouts
    requestAnimationFrame(() => { clearTransform(); });
  } else {
    // snap back
    clearTransform();
  }
  dy = 0;
}

// Pointer + Touch events (use passive:false where we need to prevent scrolling)
head.addEventListener("pointerdown", onPointerDown, { passive: false });
window.addEventListener("pointermove", onPointerMove, { passive: false });
window.addEventListener("pointerup",   endDrag,       { passive: true });
window.addEventListener("pointercancel", endDrag,     { passive: true });

// Fallback touch events for older browsers
head.addEventListener("touchstart", onPointerDown, { passive: false });
window.addEventListener("touchmove", onPointerMove, { passive: false });
window.addEventListener("touchend",  endDrag,       { passive: true });

    // first render
    showTab("analysis");

    // hash preset (sanitized)
    try{
      const m = location.hash.match(/#vz=([A-Za-z0-9+/=\\-_]+)/);
      if (m && m[1]){ const obj = JSON.parse(atob(m[1])); applyPatch(sanitizeSettings(obj)); }
    }catch{}
  }

  // ---------- boot ----------
  let built=false;
  function boot(force=false){
    const root = document.getElementById("vz-editor-root");
    const openBtn = document.getElementById("vz-open-editor");
    if (!root || !openBtn){ requestAnimationFrame(()=>boot(force)); return; }
    if (!apiReady()){
      if (force && typeof window.setupVisualizer === "function"){ try{ window.setupVisualizer(); }catch(e){} }
      requestAnimationFrame(()=>boot(force)); return;
    }
    // restore saved settings (sanitized)
    const saved = load(STORAGE_KEY,null);
    if (saved){ try{ window.visualizerAPI.updateSettings(sanitizeSettings(saved)); }catch(e){ console.warn(e); } }
    if (!built){ buildPanel(root, openBtn); built=true; }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ()=>boot(false));
  else boot(false);
})();