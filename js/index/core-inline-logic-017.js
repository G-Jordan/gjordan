
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
  #site-theme-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:100000}
  #site-theme-modal.open{display:flex}
  #site-theme-modal .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
  /* center on desktop, bottom sheet on small screens */
  #site-theme-modal .panel{
    position:relative;background:rgba(20,22,28,.92);color:#e8eef5;border:1px solid rgba(255,255,255,.12);
    border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.55);max-width:720px;width:92vw;max-height:85vh;overflow:auto;
    left:50vw;top:50vh;transform:translate(-50%,-50%); outline: none;
  }
  @media(max-width:560px){
    #site-theme-modal .panel{left:auto;top:auto;transform:none;inset:auto 0 0 0;border-bottom-left-radius:0;border-bottom-right-radius:0;max-height:80vh}
  }
  #site-theme-modal .head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
  #site-theme-modal .head h3{margin:0;font:800 15px/1.2 system-ui,Segoe UI,Roboto}
  #site-theme-modal .grid{display:grid;grid-template-columns:repeat(10,1fr);gap:8px;padding:12px}
  @media(max-width:560px){ #site-theme-modal .grid{grid-template-columns:repeat(6,1fr)} }
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
  const save = (o)=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); }catch{} };
  const load = ()=>{ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); }catch{return null;} };

  /* -------- Helpers -------- */
  function luminance(hex){
    const c = hex.replace('#','');
    const r = parseInt(c.slice(0,2),16)/255;
    const g = parseInt(c.slice(2,4),16)/255;
    const b = parseInt(c.slice(4,6),16)/255;
    const L = [r,g,b].map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));
    return 0.2126*L[0]+0.7152*L[1]+0.0722*L[2];
  }
  function autoText(bg){ return luminance(bg) > 0.5 ? '#0b0d10' : '#ffffff'; }
  function autoBg(main){ return luminance(main) > 0.5 ? '#ecf0f1' : '#2f3542'; }
  function autoBorder(bg){ return luminance(bg) > 0.5 ? '#2c3e50' : '#ced6e0'; }

  /* -------- Apply theme to CSS vars already used -------- */
  function applyTheme(p){
    const r = document.documentElement;
    const main   = p.main;
    const accent = p.accent;
    const text   = p.text   || autoText(main);
    const textBg = p.textBg || autoBg(main);
    const border = p.border || autoBorder(textBg);

    // Canonical
    r.style.setProperty('--mainThemeColor', main);
    r.style.setProperty('--accentColor',   accent);
    r.style.setProperty('--text',          text);
    r.style.setProperty('--textBg',        textBg);
    r.style.setProperty('--borderColor',   border);

    // Cross-compat
    r.style.setProperty('--app-primary', main);
    r.style.setProperty('--app-accent',  accent);
    r.style.setProperty('--primary-color', main);
    r.style.setProperty('--accent-color',  accent);
    r.style.setProperty('--glow-color',    main);

    // Subtle chrome
    r.style.setProperty('--navbar-bg', 'rgba(0,0,0,.55)');
    r.style.setProperty('--glow-box',    `0 0 12px color-mix(in srgb, ${main} 30%, transparent)`);
    r.style.setProperty('--glow-shadow', `0 0 10px ${main}`);

    // Broadcast so other components (player/list) can react
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { main, accent, text, textBg, border } }));

    save({main,accent,text,textBg,border});
  }

  /* -------- Modal (attached to <body>) -------- */
  function buildModal(){
    if (document.getElementById('site-theme-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'site-theme-modal';
    modal.innerHTML = `
      <div class="backdrop" data-close="1" aria-hidden="true"></div>
      <div class="panel" role="dialog" aria-modal="true" aria-label="Theme">
        <div class="head">
          <h3>Pick a Theme</h3>
          <button class="icon-btn theme-chip" data-close="1" aria-label="Close" type="button">
            <i class="material-icons" aria-hidden="true">close</i>
          </button>
        </div>
        <div class="grid"></div>
      </div>`;
    document.body.appendChild(modal);

    const grid = modal.querySelector('.grid');
    PRESETS.forEach((p,i)=>{
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'swatch';
      sw.title = 'Theme #' + (i+1);
      sw.style.background = `linear-gradient(145deg, ${p.main}, ${p.accent})`;
      sw.style.borderColor = 'rgba(255,255,255,.55)';
      sw.addEventListener('click', ()=>applyTheme(p));
      grid.appendChild(sw);
    });

    // ✅ Close when clicking backdrop OR the close button (or its child icon)
    modal.addEventListener('click', (e)=>{
      const target = e.target.closest('[data-close]');
      if (target) closeModal();
    });

    // Also bind directly to the close button (belt & suspenders)
    const closeBtn = modal.querySelector('[data-close]');
    closeBtn?.addEventListener('click', closeModal);

    // Esc to close
    window.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeModal(); });
  }

  function openModal(){
    buildModal();
    const m = document.getElementById('site-theme-modal');
    m.classList.add('open');
    document.body.style.overflow='hidden';
    // focus the panel for a11y/escape
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
      btn.setAttribute('aria-label','Theme');
      btn.style.marginLeft = '8px';
      btn.innerHTML = '<i class="material-icons theme-chip" aria-hidden="true">palette</i>';
     (nav.querySelector('#account-btn') || nav.lastElementChild || nav)
  .insertAdjacentElement('afterend', btn); 
    }
    btn.addEventListener('click', openModal);
  }

  /* -------- Boot -------- */
  function boot(){
    const saved = load();
    if (saved && saved.main && saved.accent) applyTheme(saved);
    ensureTrigger();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

})();
