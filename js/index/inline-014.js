
/*!
 * G73 Controls Theme Plugin v2.4 (stable on your v2.0)
 * - Keeps all v2.3 features (progress + timers + gradient icons + portal menu)
 * - Solid play/pause glyph (no more invisible over gradients)
 * - Menu centered under the palette button (viewport-clamped)
 * - EXACTLY 73 themes
 */
(function(){
  const STORE_KEY = 'playerControlsTheme.v2.4';

  // ---- Targets ----
  const controls = document.querySelector('.controls');
  const progress = document.querySelector('.progress-area');
  const bar      = progress?.querySelector('.progress-bar');
  const tCur     = progress?.querySelector('.current-time');
  const tMax     = progress?.querySelector('.max-duration');
  if (!controls) { console.warn('[ControlsThemePlugin] No .controls found.'); return; }
  controls.setAttribute('data-ctl-theme','');
  if (progress) progress.setAttribute('data-ctl-theme','');

  // ---- CSS (scoped; beats main.css) ----
  const css = `
  .controls[data-ctl-theme]{
    display:inline-flex; align-items:center; gap:12px; padding:10px;
    border-radius:16px;
    border:1px solid var(--ctl-border, rgba(255,255,255,.10)) !important;
    background: var(--ctl-bg, rgba(13,17,23,.72)) !important;
    box-shadow: 0 8px 24px rgba(0,0,0,.45) !important;
  }

  /* Gradient icons (all standard control glyphs)… */
  .controls[data-ctl-theme] .material-icons{
    background-image: var(--ctl-icon-gradient, linear-gradient(90deg,#ffffff,#ffffff)) !important;
    -webkit-background-clip: text !important; background-clip: text !important;
    -webkit-text-fill-color: transparent !important; color: transparent !important;
    transition: filter .12s, transform .12s; user-select: none;
  }
  .controls[data-ctl-theme] i:hover{
    filter: drop-shadow(0 0 6px var(--ctl-ring, rgba(120,200,255,.4))) !important;
    transform: translateY(-1px);
  }

  /* …EXCEPT play/pause GLYPH: force solid high-contrast color so it's always visible */
  .controls[data-ctl-theme] .play-pause .material-icons{
    -webkit-text-fill-color: var(--pp-icon-color, #ffffff) !important;
            color: var(--pp-icon-color, #ffffff) !important;
    background-image: none !important;
  }

  /* Play/Pause chip */
  .controls[data-ctl-theme] .play-pause{
    position: relative !important;
    display:flex; align-items:center; justify-content:center;
    width:54px; height:54px; border-radius:50% !important;
    background: var(--pp-outer, linear-gradient(135deg,#1d2230,#151820)) !important;
    box-shadow: 0 0 5px var(--pp-glow, rgba(95,160,255,.45)) !important;
    border: none !important; overflow: visible;
  }
  .controls[data-ctl-theme] .play-pause::before{
    content:"";
    position:absolute; inset:0; width:43px; height:43px; margin:auto; border-radius:50%;
    background: var(--pp-inner, var(--ctl-icon-gradient, linear-gradient(90deg,#ffffff,#ffffff))) !important;
    z-index: 0;
  }
  .controls[data-ctl-theme] .play-pause .material-icons{
    position:absolute; width:43px; height:43px; line-height:43px; text-align:center; z-index: 1;
  }

  /* Progress area colorization (behavior untouched) */
  .progress-area[data-ctl-theme]{ position:relative; background: var(--prog-bg, rgba(255,255,255,.10)) !important; border-radius: 50px !important; }
  .progress-area[data-ctl-theme] .progress-bar{ background: var(--prog-fill, linear-gradient(90deg,#5ad1ff,#a97aff)) !important; }
  .progress-area[data-ctl-theme] .song-timer{ display:flex; justify-content:space-between; margin-top:2px; color: var(--timer-color, #d5e6ff) !important; font-size:13px; }

  /* Palette button */
  .ctl-theme-btn{
    width:40px; height:40px; border-radius: 14px !important;
    border:1px solid var(--ctl-border, rgba(255,255,255,.1)) !important;
    background: transparent !important; cursor:pointer; display:grid; place-items:center;
  }
  .ctl-theme-btn .material-icons{
    background-image: var(--ctl-icon-gradient, linear-gradient(90deg,#ffffff,#ffffff)) !important;
    -webkit-background-clip: text !important; background-clip: text !important;
    -webkit-text-fill-color: transparent !important; color: transparent !important;
  }
  .ctl-theme-btn:hover{
    background: color-mix(in srgb, var(--app-accent, #b478ff) 16%, transparent) !important;
    box-shadow: 0 8px 18px rgba(0,0,0,.45) !important;
  }

  /* PORTAL MENU (centered under button; never affects layout) */
  .ctl-theme-menu{
    position: fixed;
    min-width:260px; max-width:320px; max-height: 280px;
    overflow:auto; overscroll-behavior: contain;
    display:grid; gap:8px; padding:10px; border-radius:14px;
    border:1px solid var(--ctl-border, rgba(255,255,255,.1)) !important;
    background: color-mix(in srgb, #0b0f14 88%, transparent) !important;
    box-shadow: 0 16px 44px rgba(0,0,0,.55) !important;
    z-index: 2147483000; /* TOPMOST */
  }
  .ctl-theme-menu[hidden]{ display:none !important; }
  .theme-chip{
    display:flex; align-items:center; gap:10px; padding:10px 12px;
    width:100%; border-radius:12px; cursor:pointer;
    border:1px solid var(--ctl-border, rgba(255,255,255,.1)) !important;
    background: rgba(255,255,255,.04) !important;
    transition: transform .12s, border-color .12s;
  }
  .theme-chip:hover{ transform: translateY(-1px); border-color: var(--ctl-ring, rgba(100,200,255,.35)) !important; }
  .theme-chip .swatch{
    width:26px; height:26px; border-radius:50%;
    border:1px solid rgba(255,255,255,.35);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.15);
    background-image: var(--chip-gradient, linear-gradient(90deg,#999,#bbb));
  }
  .theme-chip .text{ display:grid; gap:2px; }
  .theme-chip .title{ color:#e8eef7; font-size:13px; }
  .theme-chip .note{ color:#9fb2c7; font-size:11px; }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // ---- EXACTLY 73 Presets ----
  const T = [
  {id:'neonGlass',      name:'Neon Glass',      note:'cyan ↔ violet',   v:{'--ctl-bg':'color-mix(in srgb,#0a1220 68%,transparent)','--ctl-icon-gradient':'linear-gradient(90deg,#54e0ff,#b37aff)','--ctl-ring':'rgba(120,220,255,.55)','--prog-fill':'linear-gradient(90deg,#54e0ff,#b37aff)','--prog-bg':'rgba(255,255,255,.10)','--timer-color':'#cfe7ff'}},
  {id:'midnightMinimal',name:'Midnight Minimal',note:'cool steel',      v:{'--ctl-bg':'rgba(14,18,24,.72)','--ctl-icon-gradient':'linear-gradient(90deg,#a8bed3,#e8eef7)','--ctl-ring':'rgba(120,180,255,.35)','--prog-fill':'linear-gradient(90deg,#87b4ff,#bcd4ff)','--prog-bg':'rgba(255,255,255,.08)','--timer-color':'#a8bed3'}},
  {id:'goldOnyx',       name:'Gold Onyx',       note:'lux glow',        v:{'--ctl-bg':'linear-gradient(180deg,#0b0c0f,#0f1116)','--ctl-icon-gradient':'linear-gradient(90deg,#c79c46,#ffde87)','--ctl-ring':'rgba(255,205,95,.42)','--prog-fill':'linear-gradient(90deg,#c79c46,#ffde87)','--prog-bg':'rgba(255,216,128,.12)','--timer-color':'#ffe5a8','--pp-icon-color':'#1d1406'}},
  {id:'retroTape',      name:'Retro Tape',      note:'warm earth',      v:{'--ctl-bg':'linear-gradient(180deg,#191512,#241f1b)','--ctl-icon-gradient':'linear-gradient(90deg,#d38b5d,#ffe0a1)','--ctl-ring':'rgba(255,178,102,.35)','--prog-fill':'linear-gradient(90deg,#d38b5d,#ffe0a1)','--prog-bg':'rgba(255,231,191,.12)','--timer-color':'#ffe8c7'}},
  {id:'warmSunset',     name:'Warm Sunset',     note:'coral → gold',    v:{'--ctl-bg':'linear-gradient(180deg,#1a1010,#10131e)','--ctl-icon-gradient':'linear-gradient(90deg,#ff8a66,#ffd36e)','--ctl-ring':'rgba(255,140,120,.45)','--prog-fill':'linear-gradient(90deg,#ff8a66,#ffd36e)','--prog-bg':'rgba(255,160,120,.12)','--timer-color':'#ffcaa8'}},
  {id:'terminalMono',   name:'Terminal Mono',   note:'green beam',      v:{'--ctl-bg':'rgba(4,12,6,.85)','--ctl-icon-gradient':'linear-gradient(90deg,#38ff80,#b8ffc8)','--ctl-ring':'rgba(100,255,160,.35)','--prog-fill':'linear-gradient(90deg,#38ff80,#b8ffc8)','--prog-bg':'rgba(170,255,200,.08)','--timer-color':'#c8ffd6'}},
  {id:'oceanic',        name:'Oceanic',         note:'sky fade',        v:{'--ctl-bg':'linear-gradient(180deg,#0a1420,#0e1d2b)','--ctl-icon-gradient':'linear-gradient(90deg,#78c7ff,#9be7ff)','--ctl-ring':'rgba(100,200,255,.42)','--prog-fill':'linear-gradient(90deg,#78c7ff,#9be7ff)','--prog-bg':'rgba(200,235,255,.12)','--timer-color':'#cfeaff'}},
  {id:'cyberLime',      name:'Cyber Lime',      note:'neon lime',       v:{'--ctl-bg':'linear-gradient(180deg,#0b0f0b,#0f1710)','--ctl-icon-gradient':'linear-gradient(90deg,#9dff6a,#d6ff8a)','--ctl-ring':'rgba(170,255,120,.45)','--prog-fill':'linear-gradient(90deg,#9dff6a,#d6ff8a)','--prog-bg':'rgba(180,255,160,.10)','--timer-color':'#e2ffd1'}},
  {id:'lavenderIce',    name:'Lavender Ice',    note:'lavender → ice',  v:{'--ctl-bg':'linear-gradient(180deg,#1b1620,#121724)','--ctl-icon-gradient':'linear-gradient(90deg,#c9a8ff,#a8e3ff)','--ctl-ring':'rgba(160,140,255,.42)','--prog-fill':'linear-gradient(90deg,#c9a8ff,#a8e3ff)','--prog-bg':'rgba(210,200,255,.10)','--timer-color':'#dee6ff'}},
  {id:'ember',          name:'Ember',           note:'amber heat',      v:{'--ctl-bg':'linear-gradient(180deg,#1a0e08,#1e1410)','--ctl-icon-gradient':'linear-gradient(90deg,#ff914d,#ffc46b)','--ctl-ring':'rgba(255,170,100,.45)','--prog-fill':'linear-gradient(90deg,#ff914d,#ffc46b)','--prog-bg':'rgba(255,190,140,.12)','--timer-color':'#ffdcb3'}},
  {id:'roseQuartz',     name:'Rose Quartz',     note:'rose crystal',    v:{'--ctl-bg':'linear-gradient(180deg,#1a1014,#15121a)','--ctl-icon-gradient':'linear-gradient(90deg,#ff9ec7,#ffd1e6)','--ctl-ring':'rgba(255,150,200,.45)','--prog-fill':'linear-gradient(90deg,#ff9ec7,#ffd1e6)','--prog-bg':'rgba(255,190,220,.12)','--timer-color':'#ffe6f3'}},
  {id:'aurora',         name:'Aurora',          note:'polar glow',      v:{'--ctl-bg':'linear-gradient(180deg,#071218,#0a1522)','--ctl-icon-gradient':'linear-gradient(90deg,#57ffa6,#69c8ff)','--ctl-ring':'rgba(110,230,200,.45)','--prog-fill':'linear-gradient(90deg,#57ffa6,#69c8ff)','--prog-bg':'rgba(160,230,230,.10)','--timer-color':'#d6fbff'}},
  {id:'grapeSoda',      name:'Grape Soda',      note:'purple pop',      v:{'--ctl-bg':'linear-gradient(180deg,#171129,#190f2a)','--ctl-icon-gradient':'linear-gradient(90deg,#a78bfa,#f0abfc)','--ctl-ring':'rgba(190,140,255,.45)','--prog-fill':'linear-gradient(90deg,#a78bfa,#f0abfc)','--prog-bg':'rgba(200,170,255,.12)','--timer-color':'#efe1ff'}},
  {id:'ultramarine',    name:'Ultramarine',     note:'deep blue',       v:{'--ctl-bg':'linear-gradient(180deg,#0a0f26,#0b1431)','--ctl-icon-gradient':'linear-gradient(90deg,#3b82f6,#60a5fa)','--ctl-ring':'rgba(80,150,255,.45)','--prog-fill':'linear-gradient(90deg,#3b82f6,#60a5fa)','--prog-bg':'rgba(120,170,255,.12)','--timer-color':'#d7e6ff'}},
  {id:'electricMango',  name:'Electric Mango',  note:'mango zest',      v:{'--ctl-bg':'linear-gradient(180deg,#160f07,#12110a)','--ctl-icon-gradient':'linear-gradient(90deg,#ffb703,#ffd166)','--ctl-ring':'rgba(255,200,90,.45)','--prog-fill':'linear-gradient(90deg,#ffb703,#ffd166)','--prog-bg':'rgba(255,220,140,.12)','--timer-color':'#ffeab3'}},
  {id:'pinkLemonade',   name:'Pink Lemonade',   note:'sweet + tart',    v:{'--ctl-bg':'linear-gradient(180deg,#1b1012,#151318)','--ctl-icon-gradient':'linear-gradient(90deg,#ff7aa2,#ffd166)','--ctl-ring':'rgba(255,160,160,.45)','--prog-fill':'linear-gradient(90deg,#ff7aa2,#ffd166)','--prog-bg':'rgba(255,190,200,.12)','--timer-color':'#ffe6f0'}},
  {id:'blurple',        name:'Blurple',         note:'brandish blue',   v:{'--ctl-bg':'linear-gradient(180deg,#14122a,#16143a)','--ctl-icon-gradient':'linear-gradient(90deg,#5865f2,#9aa4ff)','--ctl-ring':'rgba(120,130,255,.45)','--prog-fill':'linear-gradient(90deg,#5865f2,#9aa4ff)','--prog-bg':'rgba(160,170,255,.12)','--timer-color':'#e0e5ff'}},
  {id:'tealPunch',      name:'Teal Punch',      note:'teal snap',       v:{'--ctl-bg':'linear-gradient(180deg,#0b1412,#0c1b1a)','--ctl-icon-gradient':'linear-gradient(90deg,#21d4a3,#66ffe3)','--ctl-ring':'rgba(80,240,200,.45)','--prog-fill':'linear-gradient(90deg,#21d4a3,#66ffe3)','--prog-bg':'rgba(160,255,230,.10)','--timer-color':'#d8fff5'}},
  {id:'crimsonEdge',    name:'Crimson Edge',    note:'red radar',       v:{'--ctl-bg':'linear-gradient(180deg,#190a0a,#1a0e11)','--ctl-icon-gradient':'linear-gradient(90deg,#ff4d6d,#ffa3a3)','--ctl-ring':'rgba(255,120,140,.45)','--prog-fill':'linear-gradient(90deg,#ff4d6d,#ffa3a3)','--prog-bg':'rgba(255,150,170,.10)','--timer-color':'#ffd7de'}},
  {id:'mintByte',       name:'Mint Byte',       note:'minty fresh',     v:{'--ctl-bg':'linear-gradient(180deg,#0c1410,#0e1913)','--ctl-icon-gradient':'linear-gradient(90deg,#7efac8,#baffde)','--ctl-ring':'rgba(160,255,220,.45)','--prog-fill':'linear-gradient(90deg,#7efac8,#baffde)','--prog-bg':'rgba(180,255,230,.10)','--timer-color':'#eafff7'}},
  {id:'royalSun',       name:'Royal Sun',       note:'royal → sun',     v:{'--ctl-bg':'linear-gradient(180deg,#121018,#1a1310)','--ctl-icon-gradient':'linear-gradient(90deg,#8ab4ff,#ffd166)','--ctl-ring':'rgba(200,200,80,.45)','--prog-fill':'linear-gradient(90deg,#8ab4ff,#ffd166)','--prog-bg':'rgba(200,210,255,.10)','--timer-color':'#fff0c8'}},
  {id:'violetStorm',    name:'Violet Storm',    note:'electric violet', v:{'--ctl-bg':'linear-gradient(180deg,#1a0f1f,#110f21)','--ctl-icon-gradient':'linear-gradient(90deg,#b37aff,#7aa6ff)','--ctl-ring':'rgba(150,140,255,.45)','--prog-fill':'linear-gradient(90deg,#b37aff,#7aa6ff)','--prog-bg':'rgba(200,180,255,.12)','--timer-color':'#e8ddff'}},
  {id:'desertDusk',     name:'Desert Dusk',     note:'sand dusk',       v:{'--ctl-bg':'linear-gradient(180deg,#161210,#1a1510)','--ctl-icon-gradient':'linear-gradient(90deg,#e0b084,#ffe0a1)','--ctl-ring':'rgba(255,200,140,.42)','--prog-fill':'linear-gradient(90deg,#e0b084,#ffe0a1)','--prog-bg':'rgba(255,220,180,.10)','--timer-color':'#ffe9cc'}},
  {id:'iceMint',        name:'Ice Mint',        note:'icy mint',        v:{'--ctl-bg':'linear-gradient(180deg,#0e1316,#0e1714)','--ctl-icon-gradient':'linear-gradient(90deg,#9ae6ff,#baffde)','--ctl-ring':'rgba(130,230,230,.42)','--prog-fill':'linear-gradient(90deg,#9ae6ff,#baffde)','--prog-bg':'rgba(190,240,255,.10)','--timer-color':'#e6fbff'}},
  {id:'rubyGold',       name:'Ruby Gold',       note:'ruby → gold',     v:{'--ctl-bg':'linear-gradient(180deg,#1a0e12,#1a1210)','--ctl-icon-gradient':'linear-gradient(90deg,#ff5a8a,#ffde87)','--ctl-ring':'rgba(255,160,150,.45)','--prog-fill':'linear-gradient(90deg,#ff5a8a,#ffde87)','--prog-bg':'rgba(255,200,190,.12)','--timer-color':'#ffe0e9'}},
  {id:'cobaltLime',     name:'Cobalt Lime',     note:'blue → lime',     v:{'--ctl-bg':'linear-gradient(180deg,#0a1020,#0d1514)','--ctl-icon-gradient':'linear-gradient(90deg,#54a0ff,#b6ff6a)','--ctl-ring':'rgba(140,210,140,.45)','--prog-fill':'linear-gradient(90deg,#54a0ff,#b6ff6a)','--prog-bg':'rgba(160,210,255,.12)','--timer-color':'#d8f6e0'}},
  {id:'goldenHour',     name:'Golden Hour',     note:'soft gold',       v:{'--ctl-bg':'linear-gradient(180deg,#14100c,#15120e)','--ctl-icon-gradient':'linear-gradient(90deg,#ffc76b,#fff0a3)','--ctl-ring':'rgba(255,215,140,.42)','--prog-fill':'linear-gradient(90deg,#ffc76b,#fff0a3)','--prog-bg':'rgba(255,235,190,.12)','--timer-color':'#fff3c9'}},
  {id:'aquaPurple',     name:'Aqua Purple',     note:'aqua ↔ purple',   v:{'--ctl-bg':'linear-gradient(180deg,#0d1120,#111125)','--ctl-icon-gradient':'linear-gradient(90deg,#5ad1ff,#b478ff)','--ctl-ring':'rgba(150,180,255,.42)','--prog-fill':'linear-gradient(90deg,#5ad1ff,#b478ff)','--prog-bg':'rgba(190,210,255,.10)','--timer-color':'#e4ebff'}},
  {id:'plasma',         name:'Plasma',          note:'hot magenta',     v:{'--ctl-bg':'linear-gradient(180deg,#170b16,#180b14)','--ctl-icon-gradient':'linear-gradient(90deg,#ff49c6,#ff8af5)','--ctl-ring':'rgba(255,120,210,.45)','--prog-fill':'linear-gradient(90deg,#ff49c6,#ff8af5)','--prog-bg':'rgba(255,170,230,.12)','--timer-color':'#ffd8f5'}},
  {id:'skyPeach',       name:'Sky Peach',       note:'sky → peach',     v:{'--ctl-bg':'linear-gradient(180deg,#0f1220,#121216)','--ctl-icon-gradient':'linear-gradient(90deg,#80cfff,#ffbdaa)','--ctl-ring':'rgba(180,190,255,.38)','--prog-fill':'linear-gradient(90deg,#80cfff,#ffbdaa)','--prog-bg':'rgba(200,220,255,.10)','--timer-color':'#ffe6de'}},
  {id:'limeBerry',      name:'Lime Berry',      note:'lime → berry',    v:{'--ctl-bg':'linear-gradient(180deg,#0e130e,#120e14)','--ctl-icon-gradient':'linear-gradient(90deg,#a6ff69,#b07bff)','--ctl-ring':'rgba(180,255,160,.40)','--prog-fill':'linear-gradient(90deg,#a6ff69,#b07bff)','--prog-bg':'rgba(200,255,200,.10)','--timer-color':'#ece3ff'}},
  {id:'steelRose',      name:'Steel Rose',      note:'cool rose',       v:{'--ctl-bg':'linear-gradient(180deg,#121620,#161218)','--ctl-icon-gradient':'linear-gradient(90deg,#a8b9d1,#ff9ec7)','--ctl-ring':'rgba(170,190,230,.40)','--prog-fill':'linear-gradient(90deg,#a8b9d1,#ff9ec7)','--prog-bg':'rgba(200,210,230,.10)','--timer-color':'#ffe6f1'}},
  {id:'cyanTangerine',  name:'Cyan Tangerine',  note:'cyan → tang',     v:{'--ctl-bg':'linear-gradient(180deg,#0b1216,#16110b)','--ctl-icon-gradient':'linear-gradient(90deg,#6be4ff,#ff9e4d)','--ctl-ring':'rgba(140,200,255,.40)','--prog-fill':'linear-gradient(90deg,#6be4ff,#ff9e4d)','--prog-bg':'rgba(190,230,255,.10)','--timer-color':'#ffe5cf'}},
  {id:'marina',         name:'Marina',          note:'sea blue',        v:{'--ctl-bg':'linear-gradient(180deg,#0a1320,#0d1c2e)','--ctl-icon-gradient':'linear-gradient(90deg,#52a8ff,#7cd4ff)','--ctl-ring':'rgba(115,190,255,.40)','--prog-fill':'linear-gradient(90deg,#52a8ff,#7cd4ff)','--prog-bg':'rgba(180,220,255,.10)','--timer-color':'#d8ecff'}},
  {id:'pearl',          name:'Pearl',           note:'soft pearl',      v:{'--ctl-bg':'linear-gradient(180deg,#131416,#101214)','--ctl-icon-gradient':'linear-gradient(90deg,#eaeaea,#ffffff)','--ctl-ring':'rgba(220,220,220,.35)','--prog-fill':'linear-gradient(90deg,#eaeaea,#ffffff)','--prog-bg':'rgba(240,240,240,.10)','--timer-color':'#f6f6f6','--pp-icon-color':'#111'}},
  {id:'candy',          name:'Candy',           note:'candy stripe',    v:{'--ctl-bg':'linear-gradient(180deg,#180f12,#140f18)','--ctl-icon-gradient':'linear-gradient(90deg,#ff8ab3,#9aa4ff)','--ctl-ring':'rgba(200,150,255,.45)','--prog-fill':'linear-gradient(90deg,#ff8ab3,#9aa4ff)','--prog-bg':'rgba(210,170,255,.12)','--timer-color':'#ffe2f0'}},
  {id:'forest',         name:'Forest',          note:'deep green',      v:{'--ctl-bg':'linear-gradient(180deg,#0b120e,#0d1a14)','--ctl-icon-gradient':'linear-gradient(90deg,#57cc99,#a8ffcf)','--ctl-ring':'rgba(110,230,170,.40)','--prog-fill':'linear-gradient(90deg,#57cc99,#a8ffcf)','--prog-bg':'rgba(170,255,210,.10)','--timer-color':'#ddffe9'}},

  /* ----- New additions (to reach 73) ----- */
  {id:'scarletBlaze',   name:'Scarlet Blaze',   note:'red inferno',     v:{'--ctl-bg':'linear-gradient(180deg,#160808,#1b0b0b)','--ctl-icon-gradient':'linear-gradient(90deg,#ff2d55,#ff8a80)','--ctl-ring':'rgba(255,90,110,.48)','--prog-fill':'linear-gradient(90deg,#ff2d55,#ff8a80)','--prog-bg':'rgba(255,120,140,.12)','--timer-color':'#ffd0d6'}},
  {id:'candyCorn',      name:'Candy Corn',      note:'pumpkin pop',     v:{'--ctl-bg':'linear-gradient(180deg,#170f08,#1b1308)','--ctl-icon-gradient':'linear-gradient(90deg,#ff9f1a,#ffe066)','--ctl-ring':'rgba(255,190,90,.45)','--prog-fill':'linear-gradient(90deg,#ff9f1a,#ffe066)','--prog-bg':'rgba(255,220,140,.12)','--timer-color':'#fff2c2'}},
  {id:'arcticFox',      name:'Arctic Fox',      note:'iced silver',     v:{'--ctl-bg':'linear-gradient(180deg,#0c1013,#0f1114)','--ctl-icon-gradient':'linear-gradient(90deg,#b8d8ff,#ffffff)','--ctl-ring':'rgba(200,220,255,.35)','--prog-fill':'linear-gradient(90deg,#b8d8ff,#ffffff)','--prog-bg':'rgba(230,240,255,.10)','--timer-color':'#eef5ff','--pp-icon-color':'#0f141a'}},
  {id:'blackCherry',    name:'Black Cherry',    note:'ink + cherry',    v:{'--ctl-bg':'linear-gradient(180deg,#0b0910,#110810)','--ctl-icon-gradient':'linear-gradient(90deg,#b5179e,#ff0a54)','--ctl-ring':'rgba(220,60,170,.45)','--prog-fill':'linear-gradient(90deg,#b5179e,#ff0a54)','--prog-bg':'rgba(240,120,200,.12)','--timer-color':'#ffd1ec'}},
  {id:'aquaSun',        name:'Aqua Sun',        note:'sea → sun',       v:{'--ctl-bg':'linear-gradient(180deg,#09131a,#10130a)','--ctl-icon-gradient':'linear-gradient(90deg,#3ddcff,#ffd166)','--ctl-ring':'rgba(150,210,255,.42)','--prog-fill':'linear-gradient(90deg,#3ddcff,#ffd166)','--prog-bg':'rgba(170,220,255,.12)','--timer-color':'#fff2c9'}},
  {id:'hackerGreen',    name:'Hacker Green',    note:'CRT neon',        v:{'--ctl-bg':'linear-gradient(180deg,#081109,#0a130c)','--ctl-icon-gradient':'linear-gradient(90deg,#00ff87,#00ffa3)','--ctl-ring':'rgba(0,255,160,.45)','--prog-fill':'linear-gradient(90deg,#00ff87,#00ffa3)','--prog-bg':'rgba(0,255,180,.12)','--timer-color':'#c8ffe9'}},
  {id:'infraPink',      name:'Infra Pink',      note:'infrared magenta',v:{'--ctl-bg':'linear-gradient(180deg,#130713,#150815)','--ctl-icon-gradient':'linear-gradient(90deg,#ff3cac,#784ba0)','--ctl-ring':'rgba(255,120,210,.45)','--prog-fill':'linear-gradient(90deg,#ff3cac,#784ba0)','--prog-bg':'rgba(255,160,220,.12)','--timer-color':'#ffd6f1'}},
  {id:'acidLemon',      name:'Acid Lemon',      note:'radioactive zest',v:{'--ctl-bg':'linear-gradient(180deg,#101206,#11140a)','--ctl-icon-gradient':'linear-gradient(90deg,#faff00,#8cff00)','--ctl-ring':'rgba(200,255,80,.45)','--prog-fill':'linear-gradient(90deg,#faff00,#8cff00)','--prog-bg':'rgba(220,255,120,.10)','--timer-color':'#f3ffd1'}},
  {id:'midoriWave',     name:'Midori Wave',     note:'tea foam',        v:{'--ctl-bg':'linear-gradient(180deg,#0b1310,#0d1712)','--ctl-icon-gradient':'linear-gradient(90deg,#4ade80,#a7f3d0)','--ctl-ring':'rgba(90,230,170,.42)','--prog-fill':'linear-gradient(90deg,#4ade80,#a7f3d0)','--prog-bg':'rgba(170,255,220,.10)','--timer-color':'#e6fff2'}},
  {id:'emberBlue',      name:'Ember Blue',      note:'orange vs azure', v:{'--ctl-bg':'linear-gradient(180deg,#130c0a,#0a0f13)','--ctl-icon-gradient':'linear-gradient(90deg,#ffa260,#4cc9f0)','--ctl-ring':'rgba(255,170,120,.40)','--prog-fill':'linear-gradient(90deg,#ffa260,#4cc9f0)','--prog-bg':'rgba(200,220,255,.10)','--timer-color':'#daeaff'}},
  {id:'royalPlum',      name:'Royal Plum',      note:'plum silk',       v:{'--ctl-bg':'linear-gradient(180deg,#120e17,#140e1a)','--ctl-icon-gradient':'linear-gradient(90deg,#7b2cbf,#c77dff)','--ctl-ring':'rgba(170,120,255,.42)','--prog-fill':'linear-gradient(90deg,#7b2cbf,#c77dff)','--prog-bg':'rgba(200,170,255,.12)','--timer-color':'#efe0ff'}},
  {id:'amberGlass',     name:'Amber Glass',     note:'glass gold',      v:{'--ctl-bg':'linear-gradient(180deg,#130f0a,#17130d)','--ctl-icon-gradient':'linear-gradient(90deg,#ffca3a,#ffd166)','--ctl-ring':'rgba(255,210,120,.42)','--prog-fill':'linear-gradient(90deg,#ffca3a,#ffd166)','--prog-bg':'rgba(255,220,160,.12)','--timer-color':'#fff0c2'}},
  {id:'ultraCyan',      name:'Ultra Cyan',      note:'laser aqua',      v:{'--ctl-bg':'linear-gradient(180deg,#081116,#0a141a)','--ctl-icon-gradient':'linear-gradient(90deg,#00e5ff,#80ffea)','--ctl-ring':'rgba(120,230,255,.45)','--prog-fill':'linear-gradient(90deg,#00e5ff,#80ffea)','--prog-bg':'rgba(170,230,255,.10)','--timer-color':'#d7f7ff'}},
  {id:'sakuraDream',    name:'Sakura Dream',    note:'petal haze',      v:{'--ctl-bg':'linear-gradient(180deg,#170f12,#140f14)','--ctl-icon-gradient':'linear-gradient(90deg,#ffb7c5,#ffcfe3)','--ctl-ring':'rgba(255,180,210,.40)','--prog-fill':'linear-gradient(90deg,#ffb7c5,#ffcfe3)','--prog-bg':'rgba(255,210,230,.12)','--timer-color':'#ffe9f3'}},
  {id:'laserGrape',     name:'Laser Grape',     note:'violet beam',     v:{'--ctl-bg':'linear-gradient(180deg,#0e0b14,#110a18)','--ctl-icon-gradient':'linear-gradient(90deg,#9d4edd,#7b2cbf)','--ctl-ring':'rgba(160,120,255,.45)','--prog-fill':'linear-gradient(90deg,#9d4edd,#7b2cbf)','--prog-bg':'rgba(190,160,255,.12)','--timer-color':'#ecd8ff'}},
  {id:'metalRose',      name:'Metal Rose',      note:'steel + blush',   v:{'--ctl-bg':'linear-gradient(180deg,#121418,#171318)','--ctl-icon-gradient':'linear-gradient(90deg,#9aa7b2,#ff7aa2)','--ctl-ring':'rgba(170,190,210,.38)','--prog-fill':'linear-gradient(90deg,#9aa7b2,#ff7aa2)','--prog-bg':'rgba(210,220,230,.10)','--timer-color':'#ffe4ef'}},
  {id:'toxicSlime',     name:'Toxic Slime',     note:'neon ooze',       v:{'--ctl-bg':'linear-gradient(180deg,#0b1108,#0f1509)','--ctl-icon-gradient':'linear-gradient(90deg,#a3ff12,#12ff80)','--ctl-ring':'rgba(160,255,100,.48)','--prog-fill':'linear-gradient(90deg,#a3ff12,#12ff80)','--prog-bg':'rgba(180,255,140,.12)','--timer-color':'#e9ffd2'}},
  {id:'horizon',        name:'Horizon',         note:'dawn band',       v:{'--ctl-bg':'linear-gradient(180deg,#0a0f16,#12120f)','--ctl-icon-gradient':'linear-gradient(90deg,#ff7e5f,#feb47b)','--ctl-ring':'rgba(255,160,120,.42)','--prog-fill':'linear-gradient(90deg,#ff7e5f,#feb47b)','--prog-bg':'rgba(255,200,160,.12)','--timer-color':'#ffe3d2'}},
  {id:'iceberg',        name:'Iceberg',         note:'blue glacier',    v:{'--ctl-bg':'linear-gradient(180deg,#0a1116,#0b141a)','--ctl-icon-gradient':'linear-gradient(90deg,#7dd3fc,#bae6fd)','--ctl-ring':'rgba(170,210,255,.40)','--prog-fill':'linear-gradient(90deg,#7dd3fc,#bae6fd)','--prog-bg':'rgba(200,230,255,.10)','--timer-color':'#e8f5ff'}},
  {id:'sunsetSoda',     name:'Sunset Soda',     note:'fizzy dusk',      v:{'--ctl-bg':'linear-gradient(180deg,#140e10,#101216)','--ctl-icon-gradient':'linear-gradient(90deg,#ff6f91,#ffc75f)','--ctl-ring':'rgba(255,170,140,.45)','--prog-fill':'linear-gradient(90deg,#ff6f91,#ffc75f)','--prog-bg':'rgba(255,200,170,.12)','--timer-color':'#ffe6cc'}},
  {id:'noirNeon',       name:'Noir Neon',       note:'noir cyan',       v:{'--ctl-bg':'linear-gradient(180deg,#0c0f12,#0c1013)','--ctl-icon-gradient':'linear-gradient(90deg,#00f5d4,#00bbf9)','--ctl-ring':'rgba(0,210,230,.45)','--prog-fill':'linear-gradient(90deg,#00f5d4,#00bbf9)','--prog-bg':'rgba(120,230,230,.10)','--timer-color':'#d6fcff'}},
  {id:'firefly',        name:'Firefly',         note:'forest sparks',   v:{'--ctl-bg':'linear-gradient(180deg,#0a110c,#0f160e)','--ctl-icon-gradient':'linear-gradient(90deg,#ffd166,#80ff72)','--ctl-ring':'rgba(220,255,150,.40)','--prog-fill':'linear-gradient(90deg,#ffd166,#80ff72)','--prog-bg':'rgba(220,255,150,.12)','--timer-color':'#f4ffd7'}},
  {id:'tango',          name:'Tango',           note:'spicy duo',       v:{'--ctl-bg':'linear-gradient(180deg,#1a0f0f,#120f0a)','--ctl-icon-gradient':'linear-gradient(90deg,#ff6b6b,#feca57)','--ctl-ring':'rgba(255,150,120,.45)','--prog-fill':'linear-gradient(90deg,#ff6b6b,#feca57)','--prog-bg':'rgba(255,190,160,.12)','--timer-color':'#ffe3c7'}},
  {id:'berryIce',       name:'Berry Ice',       note:'blueberry frost', v:{'--ctl-bg':'linear-gradient(180deg,#0b0f19,#0c1420)','--ctl-icon-gradient':'linear-gradient(90deg,#6a8dff,#9ad0ff)','--ctl-ring':'rgba(130,170,255,.42)','--prog-fill':'linear-gradient(90deg,#6a8dff,#9ad0ff)','--prog-bg':'rgba(170,200,255,.10)','--timer-color':'#e0ebff'}},
  {id:'sunburn',        name:'Sunburn',         note:'red-orange',      v:{'--ctl-bg':'linear-gradient(180deg,#190a0a,#1a0f0b)','--ctl-icon-gradient':'linear-gradient(90deg,#ff4e00,#ec9f05)','--ctl-ring':'rgba(255,140,80,.46)','--prog-fill':'linear-gradient(90deg,#ff4e00,#ec9f05)','--prog-bg':'rgba(255,170,120,.12)','--timer-color':'#ffe0c4'}},
  {id:'deepSea',        name:'Deep Sea',        note:'abyss teal',      v:{'--ctl-bg':'linear-gradient(180deg,#071012,#08161a)','--ctl-icon-gradient':'linear-gradient(90deg,#2dd4bf,#38bdf8)','--ctl-ring':'rgba(100,220,230,.42)','--prog-fill':'linear-gradient(90deg,#2dd4bf,#38bdf8)','--prog-bg':'rgba(160,240,240,.10)','--timer-color':'#d9fbff'}},
  {id:'lilacMist',      name:'Lilac Mist',      note:'soft violet',     v:{'--ctl-bg':'linear-gradient(180deg,#130f16,#12131a)','--ctl-icon-gradient':'linear-gradient(90deg,#d0a2f7,#c7f0ff)','--ctl-ring':'rgba(190,160,255,.38)','--prog-fill':'linear-gradient(90deg,#d0a2f7,#c7f0ff)','--prog-bg':'rgba(210,200,255,.10)','--timer-color':'#f0ecff'}},
  {id:'auricIce',       name:'Auric Ice',       note:'gold on ice',     v:{'--ctl-bg':'linear-gradient(180deg,#0e1116,#12120f)','--ctl-icon-gradient':'linear-gradient(90deg,#ffe29a,#a1c4fd)','--ctl-ring':'rgba(240,210,150,.38)','--prog-fill':'linear-gradient(90deg,#ffe29a,#a1c4fd)','--prog-bg':'rgba(230,230,255,.10)','--timer-color':'#f5f8ff'}},
  {id:'punchBerry',     name:'Punch Berry',     note:'fruit punch',     v:{'--ctl-bg':'linear-gradient(180deg,#140b10,#1a0f12)','--ctl-icon-gradient':'linear-gradient(90deg,#ff006e,#ffbe0b)','--ctl-ring':'rgba(255,120,150,.44)','--prog-fill':'linear-gradient(90deg,#ff006e,#ffbe0b)','--prog-bg':'rgba(255,190,160,.12)','--timer-color':'#ffe6d3'}},
  {id:'iceLime',        name:'Ice Lime',        note:'cool lime',       v:{'--ctl-bg':'linear-gradient(180deg,#0d1312,#0e1410)','--ctl-icon-gradient':'linear-gradient(90deg,#baffc9,#a7f3d0)','--ctl-ring':'rgba(180,255,210,.40)','--prog-fill':'linear-gradient(90deg,#baffc9,#a7f3d0)','--prog-bg':'rgba(210,255,230,.10)','--timer-color':'#ecfff5'}},
  {id:'galaxyLab',      name:'Galaxy Lab',      note:'astro mix',       v:{'--ctl-bg':'linear-gradient(180deg,#0b0f1a,#0e1020)','--ctl-icon-gradient':'linear-gradient(90deg,#00d4ff,#7b2cbf)','--ctl-ring':'rgba(130,160,255,.42)','--prog-fill':'linear-gradient(90deg,#00d4ff,#7b2cbf)','--prog-bg':'rgba(170,200,255,.12)','--timer-color':'#e9e8ff'}},
  {id:'voltage',        name:'Voltage',         note:'electric lime',   v:{'--ctl-bg':'linear-gradient(180deg,#0b0e0a,#0f130a)','--ctl-icon-gradient':'linear-gradient(90deg,#c6ff00,#00e676)','--ctl-ring':'rgba(160,255,100,.46)','--prog-fill':'linear-gradient(90deg,#c6ff00,#00e676)','--prog-bg':'rgba(200,255,150,.10)','--timer-color':'#e9ffd8'}},
  {id:'embersky',       name:'Ember Sky',       note:'fire + sky',      v:{'--ctl-bg':'linear-gradient(180deg,#180e0b,#0b0f18)','--ctl-icon-gradient':'linear-gradient(90deg,#ff6a00,#00c6ff)','--ctl-ring':'rgba(255,160,120,.42)','--prog-fill':'linear-gradient(90deg,#ff6a00,#00c6ff)','--prog-bg':'rgba(190,220,255,.10)','--timer-color':'#e6f5ff'}},
  {id:'bubblegum',      name:'Bubblegum',       note:'pop pink',        v:{'--ctl-bg':'linear-gradient(180deg,#150d12,#160d14)','--ctl-icon-gradient':'linear-gradient(90deg,#ff80bf,#ffc0cb)','--ctl-ring':'rgba(255,170,200,.42)','--prog-fill':'linear-gradient(90deg,#ff80bf,#ffc0cb)','--prog-bg':'rgba(255,200,220,.12)','--timer-color':'#ffe6ee'}},
  {id:'jetstream',      name:'Jetstream',       note:'blue thrust',     v:{'--ctl-bg':'linear-gradient(180deg,#0a1016,#0a1420)','--ctl-icon-gradient':'linear-gradient(90deg,#00c6ff,#0072ff)','--ctl-ring':'rgba(100,190,255,.45)','--prog-fill':'linear-gradient(90deg,#00c6ff,#0072ff)','--prog-bg':'rgba(160,210,255,.12)','--timer-color':'#d9ebff'}},
  {id:'emberMint',      name:'Ember Mint',      note:'spice + mint',    v:{'--ctl-bg':'linear-gradient(180deg,#140e0c,#0b120f)','--ctl-icon-gradient':'linear-gradient(90deg,#ff9a8b,#a1ffce)','--ctl-ring':'rgba(200,220,180,.40)','--prog-fill':'linear-gradient(90deg,#ff9a8b,#a1ffce)','--prog-bg':'rgba(210,255,230,.10)','--timer-color':'#eafff5'}},
  {id:'spaceCandy',     name:'Space Candy',     note:'cosmic sweet',    v:{'--ctl-bg':'linear-gradient(180deg,#0e0b16,#120a1a)','--ctl-icon-gradient':'linear-gradient(90deg,#f72585,#7209b7)','--ctl-ring':'rgba(220,120,230,.45)','--prog-fill':'linear-gradient(90deg,#f72585,#7209b7)','--prog-bg':'rgba(210,160,240,.12)','--timer-color':'#f4d9ff'}},
  {id:'deepAmber',      name:'Deep Amber',      note:'smoked honey',    v:{'--ctl-bg':'linear-gradient(180deg,#120d08,#151008)','--ctl-icon-gradient':'linear-gradient(90deg,#ffb347,#ffd56b)','--ctl-ring':'rgba(255,210,140,.42)','--prog-fill':'linear-gradient(90deg,#ffb347,#ffd56b)','--prog-bg':'rgba(255,220,170,.12)','--timer-color':'#fff0cf'}},
  {id:'electricBerry',  name:'Electric Berry',  note:'berry zap',       v:{'--ctl-bg':'linear-gradient(180deg,#0f0a12,#150a14)','--ctl-icon-gradient':'linear-gradient(90deg,#8a2be2,#ff00ff)','--ctl-ring':'rgba(180,120,255,.45)','--prog-fill':'linear-gradient(90deg,#8a2be2,#ff00ff)','--prog-bg':'rgba(210,170,255,.12)','--timer-color':'#f2d6ff'}},
  {id:'frostGrove',     name:'Frost Grove',     note:'mint pine',       v:{'--ctl-bg':'linear-gradient(180deg,#0b1210,#0d1714)','--ctl-icon-gradient':'linear-gradient(90deg,#b8f2e6,#aed9e0)','--ctl-ring':'rgba(170,240,220,.38)','--prog-fill':'linear-gradient(90deg,#b8f2e6,#aed9e0)','--prog-bg':'rgba(210,255,240,.10)','--timer-color':'#effffc'}},
  {id:'neonTaffy',      name:'Neon Taffy',      note:'candy neon',      v:{'--ctl-bg':'linear-gradient(180deg,#130d15,#140e18)','--ctl-icon-gradient':'linear-gradient(90deg,#ff6ec7,#ff9a8b)','--ctl-ring':'rgba(255,160,210,.44)','--prog-fill':'linear-gradient(90deg,#ff6ec7,#ff9a8b)','--prog-bg':'rgba(255,190,220,.12)','--timer-color':'#ffe0ee'}},
  {id:'citrusTwist',    name:'Citrus Twist',    note:'lime + tangerine',v:{'--ctl-bg':'linear-gradient(180deg,#0e130d,#11130a)','--ctl-icon-gradient':'linear-gradient(90deg,#a8e063,#fcd36a)','--ctl-ring':'rgba(200,230,120,.40)','--prog-fill':'linear-gradient(90deg,#a8e063,#fcd36a)','--prog-bg':'rgba(230,250,170,.10)','--timer-color':'#f7ffde'}},
  {id:'inkwave',        name:'Inkwave',         note:'blue ink',        v:{'--ctl-bg':'linear-gradient(180deg,#0a0d14,#0a1019)','--ctl-icon-gradient':'linear-gradient(90deg,#153677,#4e9af1)','--ctl-ring':'rgba(90,140,240,.42)','--prog-fill':'linear-gradient(90deg,#153677,#4e9af1)','--prog-bg':'rgba(140,180,255,.10)','--timer-color':'#dfeaff'}},
  {id:'mojito',         name:'Mojito',          note:'mint + lime',     v:{'--ctl-bg':'linear-gradient(180deg,#0a120d,#0e1712)','--ctl-icon-gradient':'linear-gradient(90deg,#3ddc97,#a1f7c4)','--ctl-ring':'rgba(140,240,190,.40)','--prog-fill':'linear-gradient(90deg,#3ddc97,#a1f7c4)','--prog-bg':'rgba(190,255,220,.10)','--timer-color':'#eafff4'}},
  {id:'emberViolet',    name:'Ember Violet',    note:'heat + amethyst', v:{'--ctl-bg':'linear-gradient(180deg,#170e0b,#120f17)','--ctl-icon-gradient':'linear-gradient(90deg,#ff8e53,#a18cd1)','--ctl-ring':'rgba(220,160,200,.42)','--prog-fill':'linear-gradient(90deg,#ff8e53,#a18cd1)','--prog-bg':'rgba(230,200,230,.12)','--timer-color':'#f2e6ff'}},
  {id:'skyLava',        name:'Sky Lava',        note:'cool vs hot',     v:{'--ctl-bg':'linear-gradient(180deg,#0a121a,#170d0b)','--ctl-icon-gradient':'linear-gradient(90deg,#00c9ff,#ff3d00)','--ctl-ring':'rgba(200,120,120,.45)','--prog-fill':'linear-gradient(90deg,#00c9ff,#ff3d00)','--prog-bg':'rgba(210,230,255,.10)','--timer-color':'#fbe3da'}},
  {id:'opal',           name:'Opal',            note:'pearl teal',      v:{'--ctl-bg':'linear-gradient(180deg,#0d1114,#0e1316)','--ctl-icon-gradient':'linear-gradient(90deg,#aee1e1,#f8f9fa)','--ctl-ring':'rgba(210,230,235,.36)','--prog-fill':'linear-gradient(90deg,#aee1e1,#f8f9fa)','--prog-bg':'rgba(230,245,245,.10)','--timer-color':'#f3fbff','--pp-icon-color':'#111'}},
  {id:'rubyNight',      name:'Ruby Night',      note:'ruby noir',       v:{'--ctl-bg':'linear-gradient(180deg,#12080a,#16090c)','--ctl-icon-gradient':'linear-gradient(90deg,#ff2a68,#ff758c)','--ctl-ring':'rgba(255,120,160,.44)','--prog-fill':'linear-gradient(90deg,#ff2a68,#ff758c)','--prog-bg':'rgba(255,170,190,.12)','--timer-color':'#ffd9e3'}},
  {id:'tealFlame',      name:'Teal Flame',      note:'teal fire',       v:{'--ctl-bg':'linear-gradient(180deg,#0a1312,#0d1816)','--ctl-icon-gradient':'linear-gradient(90deg,#00f5a0,#00d9f5)','--ctl-ring':'rgba(0,230,210,.45)','--prog-fill':'linear-gradient(90deg,#00f5a0,#00d9f5)','--prog-bg':'rgba(120,240,230,.10)','--timer-color':'#d6feff'}},
  {id:'bronzeMint',     name:'Bronze Mint',     note:'bronze + mint',   v:{'--ctl-bg':'linear-gradient(180deg,#13100c,#0f1412)','--ctl-icon-gradient':'linear-gradient(90deg,#cd7f32,#a8ffcf)','--ctl-ring':'rgba(220,170,120,.38)','--prog-fill':'linear-gradient(90deg,#cd7f32,#a8ffcf)','--prog-bg':'rgba(230,200,170,.10)','--timer-color':'#fff1dc'}},
  {id:'nordic',         name:'Nordic',          note:'fir + frost',     v:{'--ctl-bg':'linear-gradient(180deg,#0a1210,#0b1416)','--ctl-icon-gradient':'linear-gradient(90deg,#5eead4,#93c5fd)','--ctl-ring':'rgba(150,220,230,.40)','--prog-fill':'linear-gradient(90deg,#5eead4,#93c5fd)','--prog-bg':'rgba(180,230,240,.10)','--timer-color':'#e7faff'}},
  {id:'poppyGold',      name:'Poppy Gold',      note:'red pop + gold',  v:{'--ctl-bg':'linear-gradient(180deg,#150c0c,#15130c)','--ctl-icon-gradient':'linear-gradient(90deg,#ff6f61,#ffd166)','--ctl-ring':'rgba(255,170,120,.42)','--prog-fill':'linear-gradient(90deg,#ff6f61,#ffd166)','--prog-bg':'rgba(255,200,160,.12)','--timer-color':'#ffe6c9'}},
  {id:'ultraVapor',     name:'Ultra Vapor',     note:'synth mist',      v:{'--ctl-bg':'linear-gradient(180deg,#0c0e14,#0f0d16)','--ctl-icon-gradient':'linear-gradient(90deg,#00f0ff,#ff00f0)','--ctl-ring':'rgba(210,120,230,.45)','--prog-fill':'linear-gradient(90deg,#00f0ff,#ff00f0)','--prog-bg':'rgba(200,170,255,.12)','--timer-color':'#f1dcff'}},
  {id:'charcoalMint',   name:'Charcoal Mint',   note:'smoke + mint',    v:{'--ctl-bg':'linear-gradient(180deg,#0e0f10,#0f1312)','--ctl-icon-gradient':'linear-gradient(90deg,#9be7c7,#d4ffea)','--ctl-ring':'rgba(170,240,210,.36)','--prog-fill':'linear-gradient(90deg,#9be7c7,#d4ffea)','--prog-bg':'rgba(200,245,230,.10)','--timer-color':'#eafff7'}},
  {id:'glitch',         name:'Glitch',          note:'RGB shred',       v:{'--ctl-bg':'linear-gradient(180deg,#0b0b0f,#0d1011)','--ctl-icon-gradient':'linear-gradient(90deg,#ff0054,#00f5d4)','--ctl-ring':'rgba(200,210,210,.44)','--prog-fill':'linear-gradient(90deg,#ff0054,#00f5d4)','--prog-bg':'rgba(220,240,240,.10)','--timer-color':'#dffef6'}},
  {id:'twilightRose',   name:'Twilight Rose',   note:'dusk rose',       v:{'--ctl-bg':'linear-gradient(180deg,#120f14,#110f15)','--ctl-icon-gradient':'linear-gradient(90deg,#ff7aa2,#b892ff)','--ctl-ring':'rgba(220,170,230,.42)','--prog-fill':'linear-gradient(90deg,#ff7aa2,#b892ff)','--prog-bg':'rgba(230,200,240,.12)','--timer-color':'#f7e6ff'}},
  {id:'lavaLamp',       name:'Lava Lamp',       note:'retro goo',       v:{'--ctl-bg':'linear-gradient(180deg,#130c09,#160b10)','--ctl-icon-gradient':'linear-gradient(90deg,#ff3d00,#ff9a8b)','--ctl-ring':'rgba(255,140,100,.44)','--prog-fill':'linear-gradient(90deg,#ff3d00,#ff9a8b)','--prog-bg':'rgba(255,180,150,.12)','--timer-color':'#ffdcd1'}},
  {id:'honeydew',       name:'Honeydew',        note:'dew mint',        v:{'--ctl-bg':'linear-gradient(180deg,#0e1411,#0f1513)','--ctl-icon-gradient':'linear-gradient(90deg,#eaffd0,#b8f2e6)','--ctl-ring':'rgba(220,255,230,.34)','--prog-fill':'linear-gradient(90deg,#eaffd0,#b8f2e6)','--prog-bg':'rgba(230,255,240,.10)','--timer-color':'#f7ffef'}},
  {id:'rubyCyan',       name:'Ruby Cyan',       note:'clash bright',    v:{'--ctl-bg':'linear-gradient(180deg,#160b0e,#0a1013)','--ctl-icon-gradient':'linear-gradient(90deg,#ff006e,#00f5d4)','--ctl-ring':'rgba(230,130,200,.44)','--prog-fill':'linear-gradient(90deg,#ff006e,#00f5d4)','--prog-bg':'rgba(220,200,240,.10)','--timer-color':'#efe3ff'}},
  {id:'mintChip',       name:'Mint Chip',       note:'ice cream',       v:{'--ctl-bg':'linear-gradient(180deg,#0e1413,#0f1512)','--ctl-icon-gradient':'linear-gradient(90deg,#98ff98,#a8e6cf)','--ctl-ring':'rgba(180,255,200,.36)','--prog-fill':'linear-gradient(90deg,#98ff98,#a8e6cf)','--prog-bg':'rgba(210,255,230,.10)','--timer-color':'#ecfff2'}},
  {id:'dusklight',      name:'Dusklight',       note:'late lavender',   v:{'--ctl-bg':'linear-gradient(180deg,#11121a,#12141e)','--ctl-icon-gradient':'linear-gradient(90deg,#a18cd1,#fbc2eb)','--ctl-ring':'rgba(200,170,230,.40)','--prog-fill':'linear-gradient(90deg,#a18cd1,#fbc2eb)','--prog-bg':'rgba(230,210,245,.10)','--timer-color':'#f6ecff'}},
  {id:'jetLime',        name:'Jet Lime',        note:'lime turbine',    v:{'--ctl-bg':'linear-gradient(180deg,#0a0f12,#0c120e)','--ctl-icon-gradient':'linear-gradient(90deg,#9ef01a,#70e000)','--ctl-ring':'rgba(170,240,80,.46)','--prog-fill':'linear-gradient(90deg,#9ef01a,#70e000)','--prog-bg':'rgba(200,240,120,.10)','--timer-color':'#eaffd6'}},
  {id:'amberTeal',      name:'Amber Teal',      note:'honey sea',       v:{'--ctl-bg':'linear-gradient(180deg,#14100c,#0d1212)','--ctl-icon-gradient':'linear-gradient(90deg,#ffb703,#00c2a8)','--ctl-ring':'rgba(220,200,160,.40)','--prog-fill':'linear-gradient(90deg,#ffb703,#00c2a8)','--prog-bg':'rgba(230,220,200,.10)','--timer-color':'#f3fff6'}},
  {id:'pixelPop',       name:'Pixel Pop',       note:'arcade',          v:{'--ctl-bg':'linear-gradient(180deg,#0f0f12,#101014)','--ctl-icon-gradient':'linear-gradient(90deg,#ff206e,#33f3ff)','--ctl-ring':'rgba(200,160,230,.44)','--prog-fill':'linear-gradient(90deg,#ff206e,#33f3ff)','--prog-bg':'rgba(220,200,240,.10)','--timer-color':'#f0e8ff'}},
  {id:'steeldawn',      name:'Steel Dawn',      note:'blue steel',      v:{'--ctl-bg':'linear-gradient(180deg,#0f1216,#0e1419)','--ctl-icon-gradient':'linear-gradient(90deg,#b0c4de,#dce5f5)','--ctl-ring':'rgba(190,210,235,.34)','--prog-fill':'linear-gradient(90deg,#b0c4de,#dce5f5)','--prog-bg':'rgba(220,235,250,.10)','--timer-color':'#f5f9ff','--pp-icon-color':'#10141a'}},
  {id:'mochaGlow',      name:'Mocha Glow',      note:'coffee cherry',   v:{'--ctl-bg':'linear-gradient(180deg,#160f0b,#1a1310)','--ctl-icon-gradient':'linear-gradient(90deg,#c79081,#dfa579)','--ctl-ring':'rgba(220,170,140,.36)','--prog-fill':'linear-gradient(90deg,#c79081,#dfa579)','--prog-bg':'rgba(240,210,190,.10)','--timer-color':'#fde7d9'}},
  {id:'crystalMint',    name:'Crystal Mint',    note:'clean chill',     v:{'--ctl-bg':'linear-gradient(180deg,#0f1314,#101617)','--ctl-icon-gradient':'linear-gradient(90deg,#aaffec,#e4fff8)','--ctl-ring':'rgba(210,255,240,.34)','--prog-fill':'linear-gradient(90deg,#aaffec,#e4fff8)','--prog-bg':'rgba(225,255,245,.10)','--timer-color':'#f3fffd'}},
  {id:'ultraRose',      name:'Ultra Rose',      note:'neon bloom',      v:{'--ctl-bg':'linear-gradient(180deg,#120c10,#140c12)','--ctl-icon-gradient':'linear-gradient(90deg,#ff4d97,#ff85b3)','--ctl-ring':'rgba(255,140,190,.44)','--prog-fill':'linear-gradient(90deg,#ff4d97,#ff85b3)','--prog-bg':'rgba(255,190,220,.12)','--timer-color':'#ffd9e8'}},
  {id:'azureFire',      name:'Azure Fire',      note:'blue flame',      v:{'--ctl-bg':'linear-gradient(180deg,#0a1116,#0a141c)','--ctl-icon-gradient':'linear-gradient(90deg,#00b4d8,#90e0ef)','--ctl-ring':'rgba(120,200,230,.42)','--prog-fill':'linear-gradient(90deg,#00b4d8,#90e0ef)','--prog-bg':'rgba(170,220,240,.10)','--timer-color':'#e6f8ff'}},
  {id:'hazelGold',      name:'Hazel Gold',      note:'wood + glint',    v:{'--ctl-bg':'linear-gradient(180deg,#120f0b,#15120d)','--ctl-icon-gradient':'linear-gradient(90deg,#c19a6b,#ffd88e)','--ctl-ring':'rgba(220,190,140,.36)','--prog-fill':'linear-gradient(90deg,#c19a6b,#ffd88e)','--prog-bg':'rgba(235,210,180,.10)','--timer-color':'#fff2dc'}},
  {id:'vaporMint',      name:'Vapor Mint',      note:'pastel mint',     v:{'--ctl-bg':'linear-gradient(180deg,#121417,#111615)','--ctl-icon-gradient':'linear-gradient(90deg,#b8fff1,#d1fff8)','--ctl-ring':'rgba(190,255,240,.30)','--prog-fill':'linear-gradient(90deg,#b8fff1,#d1fff8)','--prog-bg':'rgba(210,255,245,.10)','--timer-color':'#effffd'}},
  {id:'magmaCore',      name:'Magma Core',      note:'lava core',       v:{'--ctl-bg':'linear-gradient(180deg,#0e0a09,#140a07)','--ctl-icon-gradient':'linear-gradient(90deg,#ff3e3e,#ff9e00)','--ctl-ring':'rgba(255,120,100,.46)','--prog-fill':'linear-gradient(90deg,#ff3e3e,#ff9e00)','--prog-bg':'rgba(255,170,120,.12)','--timer-color':'#ffd8b8'}},
  {id:'neonKoi',        name:'Neon Koi',        note:'koi pond',        v:{'--ctl-bg':'linear-gradient(180deg,#0a1216,#0d1412)','--ctl-icon-gradient':'linear-gradient(90deg,#ff6f59,#2ec4b6)','--ctl-ring':'rgba(230,160,160,.40)','--prog-fill':'linear-gradient(90deg,#ff6f59,#2ec4b6)','--prog-bg':'rgba(200,230,230,.10)','--timer-color':'#e7fbf8'}},
  {id:'orchidFade',     name:'Orchid Fade',     note:'orchid drift',    v:{'--ctl-bg':'linear-gradient(180deg,#110e14,#0f1016)','--ctl-icon-gradient':'linear-gradient(90deg,#da8cff,#9f7aea)','--ctl-ring':'rgba(200,160,240,.40)','--prog-fill':'linear-gradient(90deg,#da8cff,#9f7aea)','--prog-bg':'rgba(210,190,245,.10)','--timer-color':'#efe6ff'}},
  {id:'solarWind',      name:'Solar Wind',      note:'helium trail',    v:{'--ctl-bg':'linear-gradient(180deg,#0d0f14,#0f120e)','--ctl-icon-gradient':'linear-gradient(90deg,#ffd166,#70e1f5)','--ctl-ring':'rgba(240,210,140,.36)','--prog-fill':'linear-gradient(90deg,#ffd166,#70e1f5)','--prog-bg':'rgba(230,230,210,.10)','--timer-color':'#fff4da'}},
  {id:'limeCinder',     name:'Lime Cinder',     note:'cinder lime',     v:{'--ctl-bg':'linear-gradient(180deg,#0e100c,#0f130e)','--ctl-icon-gradient':'linear-gradient(90deg,#c9ff73,#8dff6e)','--ctl-ring':'rgba(200,255,140,.40)','--prog-fill':'linear-gradient(90deg,#c9ff73,#8dff6e)','--prog-bg':'rgba(220,255,170,.10)','--timer-color':'#f2ffd8'}},
  {id:'polarRose',      name:'Polar Rose',      note:'rose ice',        v:{'--ctl-bg':'linear-gradient(180deg,#0f1216,#101316)','--ctl-icon-gradient':'linear-gradient(90deg,#ffb3c1,#bde0fe)','--ctl-ring':'rgba(220,190,230,.34)','--prog-fill':'linear-gradient(90deg,#ffb3c1,#bde0fe)','--prog-bg':'rgba(230,220,245,.10)','--timer-color':'#faf2ff'}},
  {id:'nebulaMint',     name:'Nebula Mint',     note:'space mint',      v:{'--ctl-bg':'linear-gradient(180deg,#0b0f14,#0c1217)','--ctl-icon-gradient':'linear-gradient(90deg,#6fffe9,#7cffc4)','--ctl-ring':'rgba(140,250,220,.40)','--prog-fill':'linear-gradient(90deg,#6fffe9,#7cffc4)','--prog-bg':'rgba(180,255,230,.10)','--timer-color':'#e9fffa'}},
  {id:'royalGarnet',    name:'Royal Garnet',    note:'wine silk',       v:{'--ctl-bg':'linear-gradient(180deg,#110b0e,#140c10)','--ctl-icon-gradient':'linear-gradient(90deg,#b6244f,#ff5d8f)','--ctl-ring':'rgba(220,120,160,.42)','--prog-fill':'linear-gradient(90deg,#b6244f,#ff5d8f)','--prog-bg':'rgba(240,170,200,.12)','--timer-color':'#ffdbe6'}},
  {id:'skyline',        name:'Skyline',         note:'steel skyline',   v:{'--ctl-bg':'linear-gradient(180deg,#0d1116,#0f1218)','--ctl-icon-gradient':'linear-gradient(90deg,#7aa2ff,#b8c6ff)','--ctl-ring':'rgba(160,190,255,.36)','--prog-fill':'linear-gradient(90deg,#7aa2ff,#b8c6ff)','--prog-bg':'rgba(200,220,255,.10)','--timer-color':'#ebf1ff'}},
  {id:'emberCyan',      name:'Ember Cyan',      note:'fire cyan',       v:{'--ctl-bg':'linear-gradient(180deg,#150f0c,#0c1113)','--ctl-icon-gradient':'linear-gradient(90deg,#ff9a3c,#00eaff)','--ctl-ring':'rgba(230,170,150,.40)','--prog-fill':'linear-gradient(90deg,#ff9a3c,#00eaff)','--prog-bg':'rgba(220,230,240,.10)','--timer-color':'#e6fbff'}},
  {id:'steelMango',     name:'Steel Mango',     note:'mango steel',     v:{'--ctl-bg':'linear-gradient(180deg,#121317,#141310)','--ctl-icon-gradient':'linear-gradient(90deg,#ffb347,#8bb1ff)','--ctl-ring':'rgba(210,190,180,.36)','--prog-fill':'linear-gradient(90deg,#ffb347,#8bb1ff)','--prog-bg':'rgba(230,220,210,.10)','--timer-color':'#f3f6ff'}}
]; // 73 entries

  // ---- Build palette button + PORTAL menu ----
  const wrap = document.createElement('div'); wrap.style.display='inline-block';
  const btn = document.createElement('button');
  btn.className = 'ctl-theme-btn'; btn.id = 'ctl-theme-btn';
  btn.setAttribute('aria-haspopup','menu'); btn.setAttribute('aria-expanded','false');
  btn.title = 'Player theme';
  btn.innerHTML = '<span class="material-icons" aria-hidden="true">palette</span>';

  const menu = document.createElement('div');
  menu.className = 'ctl-theme-menu'; menu.id = 'ctl-theme-menu';
  menu.setAttribute('role','menu'); menu.setAttribute('aria-label','Player control themes');
  menu.hidden = true;
  document.body.appendChild(menu);
  // Ensure absolutely topmost
  menu.style.zIndex = '2147483000';

  T.forEach(t=>{
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'theme-chip'; chip.setAttribute('role','menuitem'); chip.dataset.id = t.id;
    const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.setProperty('--chip-gradient', t.v['--ctl-icon-gradient'] || 'linear-gradient(90deg,#999,#bbb)');
    const text = document.createElement('div'); text.className = 'text';
    const title = document.createElement('div'); title.className = 'title'; title.textContent = t.name;
    const note  = document.createElement('div'); note.className  = 'note';  note.textContent  = t.note;
    text.appendChild(title); text.appendChild(note);
    chip.appendChild(sw); chip.appendChild(text);
    chip.addEventListener('click', ()=>{ applyThemeId(t.id); closeMenu(); });
    menu.appendChild(chip);
  });

  wrap.appendChild(btn);
  controls.appendChild(wrap);

  // ---- Helpers ----
  function setImportant(el, prop, value){ if(!el) return; try{ el.style.setProperty(prop, value, 'important'); }catch{} }
  function applyVars(target, vars){ Object.keys(vars).forEach(k => target.style.setProperty(k, vars[k])); }

  // Center the portal menu under the button (viewport-clamped)
  function positionMenu(){
    if (menu.hidden) return;
    // Temporarily ensure we can measure
    const prevVis = menu.style.visibility; menu.style.visibility = 'hidden'; menu.style.display = 'grid';
    const r = btn.getBoundingClientRect();
    const spacing = 8;
    const mw = Math.min(320, Math.max(260, menu.offsetWidth || 320));
    const mh = menu.offsetHeight || 280;
    let left = r.left + r.width/2 - mw/2;
    left = Math.min(window.innerWidth - mw - 8, Math.max(8, left));
    let top  = r.bottom + spacing;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - spacing - mh);
    menu.style.left = `${left}px`;
    menu.style.top  = `${top}px`;
    // Restore visibility
    menu.style.visibility = prevVis || '';
  }

  // ---- Apply + persist ----
  function applyThemeId(id, persist=true){
    const t = T.find(x=>x.id===id) || T[0];
    applyVars(controls, t.v);

    // Play/Pause disc + icon color (solid)
    const ppInner = t.v['--prog-fill'] || t.v['--ctl-icon-gradient'] || 'linear-gradient(90deg,#ffffff,#ffffff)';
    controls.style.setProperty('--pp-inner', ppInner);
    controls.style.setProperty('--pp-outer', 'linear-gradient(135deg, #232a3a, #151820)');
    controls.style.setProperty('--pp-glow',  'rgba(95,160,255,.45)');
    controls.style.setProperty('--pp-icon-color', t.v['--pp-icon-color'] || '#ffffff');

    // Progress area
    if (progress){
      const progFill = t.v['--prog-fill'] || t.v['--ctl-icon-gradient'] || 'linear-gradient(90deg,#5ad1ff,#a97aff)';
      const progBg   = t.v['--prog-bg']   || 'rgba(255,255,255,.10)';
      const timerCol = t.v['--timer-color'] || '#d5e6ff';
      setImportant(progress, 'background', progBg);
      if (bar) setImportant(bar, 'background', progFill);
      if (tCur) setImportant(tCur, 'color', timerCol);
      if (tMax) setImportant(tMax, 'color', timerCol);
    }

    try{ if(persist) localStorage.setItem(STORE_KEY, id); }catch{}
    window.dispatchEvent(new CustomEvent('player:controls-theme', { detail:{ id, vars:t.v }}));
  }
  function restoreTheme(){ let id=null; try{ id=localStorage.getItem(STORE_KEY); }catch{} applyThemeId(id || T[0].id, false); }

  // ---- Menu interactions (guard against scroll-induced synthetic clicks) ----
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    menu.hidden ? openMenu() : closeMenu();
  });

  // Close only on true outside clicks (not touch scroll inertia)
  let scrollGuard = false;
  let scrollGuardTO;
  function armScrollGuard(){
    scrollGuard = true;
    clearTimeout(scrollGuardTO);
    scrollGuardTO = setTimeout(()=>{ scrollGuard = false; }, 180);
  }

  document.addEventListener('pointerdown', (e)=>{
    if (scrollGuard) return;
    if (!menu.hidden && !menu.contains(e.target) && e.target !== btn){
      closeMenu();
    }
  }, { passive:true });

  // Keep menu following button during scroll, but don't close it
  window.addEventListener('scroll', ()=>{
    armScrollGuard();
    positionMenu();
  }, { passive:true });

  window.addEventListener('resize', positionMenu, { passive:true });

  // Keyboard a11y
  btn.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowDown' || e.key==='Enter' || e.key===' '){
      e.preventDefault(); openMenu(); const first=menu.querySelector('.theme-chip'); first?.focus();
    }
  });
  menu.addEventListener('keydown', (e)=>{
    const chips=[...menu.querySelectorAll('.theme-chip')];
    const i=chips.indexOf(document.activeElement);
    if(e.key==='Escape'){ closeMenu(); btn.focus(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); chips[Math.min(i+1, chips.length-1)]?.focus(); }
    else if(e.key==='ArrowUp'){   e.preventDefault(); chips[Math.max(i-1, 0)]?.focus(); }
  });

  function openMenu(){
    menu.hidden = false; btn.setAttribute('aria-expanded','true');
    requestAnimationFrame(positionMenu);
  }
  function closeMenu(){ menu.hidden = true; btn.setAttribute('aria-expanded','false'); }

  // Boot
  restoreTheme();
})();
