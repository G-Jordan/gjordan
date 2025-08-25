/* js/player/player-site-diagnose.js
   G73 Site Diagnose v1.2 – adds row-level scrubber + animation audit.
   Crawls DOM/assets, validates audio flow, detects CSS traps,
   adds a HUD, and lets you copy the full log. */
(function(){
  if (window.SiteDiag) { try{ window.SiteDiag.teardown?.(); }catch{} }

  const start = Date.now();
  const LOGS = [];
  const MAX_SNIPPET  = 8000;
  const FETCH_TIMEOUT= 6000;
  const PROBE_LIMIT  = 6;
  const SAME_ORIGIN  = (u)=>{ try{ const url=new URL(u,location.href); return url.origin===location.origin; }catch{ return false; } };

  function add(tag, data){
    const entry = { t: Date.now(), tag, data };
    LOGS.push(entry);
    try{ console.log(`%c[SD] ${tag}`, 'color:#7ad;', entry); }catch{}
    paintHUD(tag);
  }

  // ------------ HUD ------------
  let hud, body, footer;
  function makeHUD(){
    hud = document.createElement('div');
    hud.className = 'g73-sitediag';
    hud.style.cssText = `
      position:fixed; right:12px; bottom:12px; z-index:2147483646;
      font:12px/1.35 system-ui,sans-serif; color:#e8eef7; padding:10px 12px;
      border-radius:12px; min-width:280px; max-width:420px;
      background: rgba(10,14,18,.82); backdrop-filter: blur(8px);
      box-shadow:0 10px 24px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.12);
    `;
    hud.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <strong style="letter-spacing:.3px;">Site Diagnose</strong>
        <span id="sd-spin" style="margin-left:6px;opacity:.8;">⏳</span>
        <button id="sd-copy" style="margin-left:auto;border:0;background:#333;color:#eee;
          padding:2px 6px;border-radius:4px;cursor:pointer;font-size:11px;">Copy Logs</button>
        <button id="sd-close" style="border:0;background:transparent;color:#eee;cursor:pointer;">✕</button>
      </div>
      <div id="sd-body" style="display:grid;gap:4px;max-height:36vh;overflow:auto;"></div>
      <div id="sd-foot" style="margin-top:6px;opacity:.75;font-size:11px;"></div>
    `;
    document.body.appendChild(hud);
    body   = hud.querySelector('#sd-body');
    footer = hud.querySelector('#sd-foot');
    hud.querySelector('#sd-close').onclick = teardown;
    hud.querySelector('#sd-copy').onclick  = copyLogs;
  }
  function paintHUD(reason){
    if (!hud) return;
    const a = document.getElementById('main-audio');
    const st = {
      idx:  window.musicIndex || 0,
      src:  (a?.currentSrc || a?.src || '').split('/').pop() || '(none)',
      play: a?(!a.paused && !a.ended && a.currentTime>0):false,
      cur:  Math.floor(a?.currentTime||0),
      dur:  Math.floor(a?.duration||0),
      wrap: !!document.querySelector('.wrapper.paused')
    };
    body.innerHTML = `
      <div>index: <b>${st.idx}</b></div>
      <div>audio: ${st.play ? '<b>PLAYING</b>' : (a ? (a.paused ? 'paused' : 'idle') : 'no &lt;audio&gt;')}</div>
      <div>time: ${st.cur}s / ${st.dur}s</div>
      <div>src: <code>${st.src}</code></div>
      <div>.wrapper.paused: ${st.wrap}</div>
    `;
    footer.textContent = `${new Date().toLocaleTimeString()} · ${reason}`;
  }
  function copyLogs(){
    const head = `G73 Site Diagnose @ ${location.href}\nRan: ${new Date().toLocaleString()}\n`;
    const lines = LOGS.map(x=>{
      const t = new Date(x.t).toLocaleTimeString();
      let val = typeof x.data === 'string' ? x.data : JSON.stringify(x.data);
      if (val && val.length > MAX_SNIPPET) val = val.slice(0, MAX_SNIPPET) + '…[trimmed]';
      return `[${t}] ${x.tag}\n${val}\n`;
    }).join('\n');
    const txt = head + lines;
    navigator.clipboard.writeText(txt).then(()=> footer.textContent = 'Logs copied ✅' )
      .catch(()=> footer.textContent = 'Copy failed ❌');
  }

  // ------------ Helpers ------------
  function timeout(ms){ return new Promise(res=>setTimeout(res, ms)); }
  async function fetchText(url){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), FETCH_TIMEOUT);
    try{
      const r = await fetch(url, { signal: ctrl.signal, cache: 'no-cache' });
      clearTimeout(t);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return await r.text();
    }catch(err){
      add('FETCH FAIL', { url, err: String(err) });
      return '';
    }
  }
  function imgProbe(url){
    return new Promise(res=>{
      const i = new Image();
      const timer = setTimeout(()=>{ i.src=''; res({ok:false, why:'timeout'}); }, FETCH_TIMEOUT);
      i.onload = ()=>{ clearTimeout(timer); res({ok:true, w:i.naturalWidth, h:i.naturalHeight}); };
      i.onerror= ()=>{ clearTimeout(timer); res({ok:false, why:'error'}); };
      i.src = url;
    });
  }
  function audioProbe(url){
    return new Promise(res=>{
      const a = document.createElement('audio');
      const done=(ok,meta)=>{ cleanup(); res({ok, ...meta}); };
      const onOK = ()=> done(true,  { dur: a.duration||0 });
      const onErr= (e)=> done(false, { why:(e?.type||'error') });
      const onTO = setTimeout(()=> done(false,{why:'timeout'}), FETCH_TIMEOUT);
      function cleanup(){
        clearTimeout(onTO);
        a.removeEventListener('loadedmetadata', onOK);
        a.removeEventListener('error', onErr);
      }
      a.addEventListener('loadedmetadata', onOK);
      a.addEventListener('error', onErr);
      a.preload = 'metadata';
      a.src = url;
    });
  }

  // ---------- NEW: Row audit helpers ----------
  function rowCompute(li){
    const cs = getComputedStyle(li);
    const prog = li.querySelector('.g73-row-progress');
    const bar  = li.querySelector('.g73-row-bar');
    const dur  = li.querySelector('.audio-duration');
    const vis  = li.querySelector('.playing-visualizer');
    const time = li.querySelector('.audio-duration .g73-time');
    const pcs  = prog ? getComputedStyle(prog) : null;
    const traps = [];

    if (cs.contain?.includes('paint')) traps.push('contain:paint on li (can clip inner visuals)');
    if (cs.overflow==='hidden')        traps.push('overflow:hidden on li (may hide scrubber/halo)');
    if (pcs){
      if (+parseFloat(pcs.height) <= 0) traps.push('scrubber height=0');
      if (pcs.visibility==='hidden')    traps.push('scrubber visibility:hidden');
      if (pcs.opacity==='0')            traps.push('scrubber opacity:0');
      if (pcs.pointerEvents==='none')   traps.push('scrubber pointer-events:none');
      const z = parseInt(pcs.zIndex,10); if (!Number.isNaN(z) && z < 0) traps.push('scrubber z-index < 0');
    }
    if (dur){
      const dcs = getComputedStyle(dur);
      if (dcs.visibility==='hidden' || dcs.opacity==='0') traps.push('duration hidden');
    }
    // Check clickable region bounds vs row
    let progBounds=null, rowBounds=null;
    try{
      if (prog) progBounds = prog.getBoundingClientRect();
      rowBounds = li.getBoundingClientRect();
    }catch{}

    const classes = li.className;
    return {
      classes, traps,
      has:{ prog:!!prog, bar:!!bar, dur:!!dur, time:!!time, vis:!!vis },
      dims:{
        row:{ w: rowBounds?.width|0, h: rowBounds?.height|0 },
        prog:{ w: progBounds?.width|0, h: progBounds?.height|0, x: progBounds?.x|0, y: progBounds?.y|0 }
      },
      styles:{
        li:{ contain: cs.contain, overflow: cs.overflow },
        prog: pcs ? { height: pcs.height, zIndex: pcs.zIndex, opacity: pcs.opacity, pointerEvents: pcs.pointerEvents } : null
      }
    };
  }

  function currentIndexBySrc(audio){
    const list = Array.isArray(window.allMusic) ? window.allMusic : [];
    if (!list.length) return window.musicIndex || 1;
    const src = audio?.currentSrc || audio?.src || "";
    const i0 = list.findIndex(it => src.includes(it.src||''));
    return i0>=0 ? i0+1 : (window.musicIndex || 1);
  }

  // ---------- Main run ----------
  async function run(){
    makeHUD();
    add('READY', { href: location.href });

    // DOM sanity
    const wrapper = document.querySelector('.wrapper');
    const audio   = document.getElementById('main-audio');
    const imgEl   = document.querySelector('.img-area img');
    const nameEl  = document.querySelector('.song-details .name');
    const artEl   = document.querySelector('.song-details .artist');
    const listUL  = document.querySelector('.music-list ul');
    add('DOM', { wrapper: !!wrapper, audio: !!audio, img: !!imgEl, name: !!nameEl, artist: !!artEl, listUL: !!listUL });

    // playlist
    const list = Array.isArray(window.allMusic) ? window.allMusic : [];
    add('PLAYLIST', { length: list.length, first: list[0] || null });
    if (!list.length) add('ERROR', 'window.allMusic is empty or missing');

    // API
    const api = ['loadMusic','playMusic','pauseMusic','prevMusic','nextMusic','playingSong','setRepeatMode']
      .reduce((o,k)=> (o[k] = typeof window[k] === 'function', o), {});
    add('API', api);

    // path helpers
    const isUrl  = s => /^https?:\/\//i.test(s||"");
    const hasExt = s => /\.[a-z0-9]{2,5}$/i.test(s||"");
    const imgPath   = k => !k ? "" : (isUrl(k)||hasExt(k) ? k : `images/${k}.jpg`);
    const audioPath = k => !k ? "" : (isUrl(k)||hasExt(k) ? k : `songs/${k}.mp3`);

    // probes
    const probes = [];
    for (let i=0;i<Math.min(list.length, PROBE_LIMIT); i++){
      const it = list[i];
      const imgUrl = imgPath(it.img);
      const audUrl = audioPath(it.src);
      probes.push((async ()=>{
        const [im, au] = await Promise.all([imgProbe(imgUrl), audioProbe(audUrl)]);
        add('PROBE', { index:i+1, name:it.name, img:imgUrl, imgOK:im.ok, imgMeta:im, audio:audUrl, audioOK:au.ok, audioMeta:au });
      })());
    }
    await Promise.all(probes);

    // audio event taps
    if (audio){
      const evs = ['play','playing','pause','seeking','seeked','timeupdate','loadedmetadata','ended','stalled','suspend','error'];
      evs.forEach(ev=> audio.addEventListener(ev, ()=> add('AUDIO '+ev, {
        ct: Math.floor(audio.currentTime||0),
        dur: Math.floor(audio.duration||0),
        src: (audio.currentSrc||audio.src||'').split('/').pop()
      }), {passive:true}));
    }

    // assets scan (same-origin)
    const scripts = [...document.scripts].map(s=> s.src || '(inline)');
    add('SCRIPTS', scripts);
    const cssLinks = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l=> l.href);
    add('STYLESHEETS', cssLinks);

    async function scanFile(url){
      if (!url || url === '(inline)') return;
      if (!SAME_ORIGIN(url)) { add('SCAN SKIP x-origin', url); return; }
      const txt = await fetchText(url);
      if (!txt) return;
      const hints = [];
      if (/\$\{\s*\(cur\/dur\)\*100\)\s*%\}/.test(txt)) hints.push('extra ) in progress-bar template');
      if (/progressBar\.style\.width\s*=\s*`[^`]*\)\s*%`/.test(txt)) hints.push('suspicious progress width template');
      const bt = (txt.match(/`/g)||[]).length; if (bt % 2 === 1) hints.push('unmatched backtick (`)');
      const b1 = (txt.match(/\${/g)||[]).length, b2 = (txt.match(/}/g)||[]).length;
      if (b2 < b1) hints.push('possible unclosed ${...} in template');
      if (/player-core\.js|ui-events\.js|organizer-adapter\.js/.test(url)){
        const hasPlay = /function\s+playMusic\s*\(/.test(txt) || /window\.playMusic\s*=/.test(txt);
        const hasLoad = /function\s+loadMusic\s*\(/.test(txt) || /window\.loadMusic\s*=/.test(txt);
        const usesSrc = /#main-audio|currentSrc|\.src/.test(txt);
        hints.push(`fn.playMusic=${hasPlay}`, `fn.loadMusic=${hasLoad}`, `audioSrcRefs=${usesSrc}`);
      }
      add('SCAN OK', { url, size: txt.length, hints });
    }

    await Promise.all(scripts.filter(Boolean).map(scanFile));
    await Promise.all(cssLinks.filter(SAME_ORIGIN).map(scanFile));

    // ---------- NEW: per-row scrubber & animation audit ----------
    const rows = listUL ? [...listUL.querySelectorAll('li')] : [];
    const sample = rows.slice(0, Math.min(12, rows.length));
    const audit = sample.map((li, ix)=> ({ index: ix+1, ...rowCompute(li) }));
    add('ROW-AUDIT', audit);

    // quick summary flags
    const scrubberMissing = audit.filter(r=> !r.has.prog).map(r=>r.index);
    const scrubberZeroH   = audit.filter(r=> r.has.prog && r.dims.prog.h===0).map(r=>r.index);
    const containPaint    = audit.filter(r=> r.styles.li.contain?.includes('paint')).map(r=>r.index);
    const overflowHidden  = audit.filter(r=> r.styles.li.overflow==='hidden').map(r=>r.index);
    const visMissingOnSel = (()=>{
      const sel = rows.findIndex(li=> li.classList.contains('playing') || li.classList.contains('active'));
      if (sel<0) return [];
      const r = audit[sel];
      return (!r?.has.vis) ? [sel+1] : [];
    })();
    add('ROW-AUDIT-SUMMARY', {
      rowsChecked: sample.length,
      scrubberMissing, scrubberZeroH,
      containPaint, overflowHidden,
      visMissingOnSelected: visMissingOnSel
    });

    // ---------- NEW: live watchers to verify timestamp + animation on selected ----------
    function selectedRow(){
      const cur = currentIndexBySrc(audio);
      return listUL?.querySelector(`li[li-index="${cur}"]`) || listUL?.querySelector('li.playing') || null;
    }

    let lastStamp = -1;
    function tickWatch(){
      const li = selectedRow(); if (!li || !audio) return;
      const tEl = li.querySelector('.audio-duration .g73-time');
      const vis = li.querySelector('.playing-visualizer');
      const playing = (!audio.paused && !audio.ended && audio.currentTime>0);

      const ts = Math.floor(audio.currentTime||0);
      const dur= Math.floor(audio.duration||0);
      const follows = (tEl && /\d+:\d{2}/.test(tEl.textContent||'')) ? (ts===lastStamp || Math.abs(ts-lastStamp)<=1) : false;
      lastStamp = ts;

      const csVis = vis ? getComputedStyle(vis) : null;
      const animPaused = csVis ? (csVis.animationPlayState==='paused') : null;
      add('SELECTED-STATE', {
        playing, ts, dur, timeNode: !!tEl, timeFollowsAudio: follows,
        hasVisualizer: !!vis, visualizerAnimPaused: animPaused
      });
    }

    // time-based verify
    const verInt = setInterval(()=> tickWatch(), 1000);

    // also watch class changes that could hide animation/scrubber
    const mo = new MutationObserver(muts=>{
      const li = selectedRow();
      if (!li) return;
      add('SELECTED-CLASSES', { classes: li.className });
    });
    if (listUL) mo.observe(listUL, { subtree:true, attributes:true, attributeFilter:['class'] });

    // ---------- Auto-boot if idle ----------
    if (audio && (!audio.src || /index\.html$/i.test(audio.src))){
      const idx = (window.musicIndex && Number.isFinite(+window.musicIndex)) ? window.musicIndex : 1;
      const safeIdx = Math.min(Math.max(1, idx), list.length || 1);
      try{
        window.loadMusic?.(safeIdx);
        add('AUTO loadMusic()', { idx: safeIdx });
        await timeout(50);
        const p = window.playMusic?.();
        if (p?.catch) { try{ await p; }catch(e){ add('AUTO play() blocked', String(e)); } }
        else { try{ audio.play(); }catch(e){ add('AUTO audio.play blocked', String(e)); } }
        add('AUTO done', { currentSrc: audio.currentSrc||audio.src });
      }catch(e){ add('AUTO failed', String(e)); }
    }

    // Final summary
    add('SUMMARY', {
      elapsedMs: Date.now()-start,
      musicIndex: window.musicIndex || 0,
      canPlay: !!(audio && window.playMusic),
      albumImgPresent: !!document.querySelector('.img-area img'),
      listBuilt: !!document.querySelector('.music-list ul li')
    });

    const spin = document.getElementById('sd-spin'); if (spin) spin.textContent = '✔️';

    // Teardown hook closes intervals/observers
    window.SiteDiagTeardown = ()=>{ try{ clearInterval(verInt); mo.disconnect(); }catch{} };
  }

  // ------------ Teardown ------------
  function teardown(){
    try{ window.SiteDiagTeardown?.(); }catch{}
    hud?.remove();
    window.SiteDiag=null;
  }

  // ------------ Boot ------------
  makeHUD();
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run, {once:true});
  }else{
    run();
  }

  // Expose
  window.SiteDiag = { teardown, copy: copyLogs, logs: LOGS };
})();