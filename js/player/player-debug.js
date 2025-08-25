// js/player/player-debug.js
// Drop-in non-invasive debugger for play/pause issues in the list + console copier

(function(){
  if (window.PlayerDebug) { try { window.PlayerDebug.teardown?.(); } catch(_){} }

  const audio = document.getElementById('main-audio');

  const CFG = {
    hud: true,
    console: true,
    capture: true,
    clickSelector: '.g73-play-toggle, .play-pause',
    logEvents: ['play','playing','pause','seeking','seeked','timeupdate','loadedmetadata','ended','stalled','suspend'],
  };

  // ---- Logging store ----
  const logs = [];
  function addLog(tag, data){
    const entry = { time: Date.now(), tag, data, state: state() };
    logs.push(entry);
    if (CFG.console){
      console.groupCollapsed(`%c[PD] ${tag}`, 'color:#8ad;');
      console.log('entry', entry);
      console.groupEnd();
    }
    refreshHUD(tag);
  }

  // ---- State ----
  function state(){
    const s = {
      idx: window.musicIndex || 0,
      playing: audio && !audio.paused && !audio.ended && audio.currentTime>0,
      paused: !!audio?.paused,
      ended: !!audio?.ended,
      cur: Math.floor(audio?.currentTime||0),
      dur: Math.floor(audio?.duration||0),
      src: (audio?.currentSrc||audio?.src||'').split('/').pop(),
      wrapperPausedClass: !!document.querySelector('.wrapper.paused')
    };
    return s;
  }

  // ---- HUD ----
  let hud, body, last;
  function makeHUD(){
    if (!CFG.hud) return;
    hud = document.createElement('div');
    hud.className = 'player-debug-hud';
    hud.style.cssText = `
      position:fixed; right:12px; bottom:12px; z-index:99999;
      font:12px/1.35 system-ui,sans-serif;
      color:#e8eef7; padding:10px 12px; border-radius:12px; min-width:220px;
      background: rgba(10,14,18,.78); backdrop-filter: blur(8px);
      box-shadow:0 10px 24px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.12);
    `;
    hud.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <strong>Player Debug</strong>
        <button id="pd-copy" style="margin-left:auto;border:0;background:#333;color:#eee;
          padding:2px 6px;border-radius:4px;cursor:pointer;font-size:11px;">Copy Logs</button>
        <button id="pd-close" style="border:0;background:transparent;color:#eee;cursor:pointer;">✕</button>
      </div>
      <div id="pd-body" style="display:grid;gap:4px;"></div>
      <div id="pd-last" style="margin-top:6px;opacity:.75;font-size:11px;"></div>
    `;
    document.body.appendChild(hud);
    body = hud.querySelector('#pd-body');
    last = hud.querySelector('#pd-last');
    hud.querySelector('#pd-close').onclick = teardown;
    hud.querySelector('#pd-copy').onclick = copyLogs;
    refreshHUD('init');
  }

  function refreshHUD(reason){
    if (!hud) return;
    const s = state();
    body.innerHTML = `
      <div>index: <b>${s.idx}</b></div>
      <div>audio: ${s.playing ? '<b>PLAYING</b>' : (s.paused ? 'paused' : 'idle')}</div>
      <div>time: ${s.cur}s / ${s.dur}s</div>
      <div>src: <code>${s.src||'(none)'}</code></div>
      <div>.wrapper.paused: ${s.wrapperPausedClass}</div>
    `;
    last.textContent = new Date().toLocaleTimeString() + ' · ' + reason;
  }

  // ---- Copy to clipboard ----
  function copyLogs(){
    const txt = logs.map(l=>{
      const t = new Date(l.time).toLocaleTimeString();
      return `[${t}] ${l.tag}\nstate=${JSON.stringify(l.state)}\ndata=${JSON.stringify(l.data)}\n`;
    }).join('\n');
    navigator.clipboard.writeText(txt).then(()=>{
      last.textContent = "Logs copied to clipboard ✅";
    }).catch(()=>{
      last.textContent = "Copy failed ❌";
    });
  }

  // ---- Click trace ----
  function onClick(e){
    const btn = e.target.closest(CFG.clickSelector);
    if (!btn) return;
    const li = btn.closest('li[li-index]');
    const idx = li ? parseInt(li.getAttribute('li-index'),10) : (window.musicIndex||0);
    const icon = btn.querySelector('i')?.textContent?.trim();
    addLog('CLICK', {idx, where: li?'list':'main', icon});
    queueMicrotask(()=>addLog('CLICK-post', {iconNow:btn.querySelector('i')?.textContent?.trim()}));
  }

  // ---- Patch core funcs ----
  function wrap(obj, key){
    if (!obj || typeof obj[key]!=='function') return;
    const orig=obj[key];
    obj[key]=function(...a){
      addLog(`CALL ${key}()`, {args:a});
      try{const r=orig.apply(this,a);
        if(r&&r.then) r.then(()=>addLog(`${key} resolved`)).catch(err=>addLog(`${key} reject`,{err}));
        return r;
      }catch(err){ addLog(`${key} threw`,{err}); throw err; }
    };
    return ()=>{obj[key]=orig;};
  }

  const unpatches=[];
  ['playMusic','pauseMusic','nextMusic','prevMusic'].forEach(fn=>unpatches.push(wrap(window,fn)));

  // ---- Audio events ----
  CFG.logEvents.forEach(ev=>audio?.addEventListener(ev,e=>addLog(`AUDIO ${ev}`,{ct:audio.currentTime}),{passive:true}));

  // ---- Setup ----
  document.addEventListener('click',onClick,{capture:CFG.capture});
  makeHUD();

  function teardown(){
    document.removeEventListener('click',onClick,{capture:CFG.capture});
    unpatches.forEach(fn=>fn&&fn());
    hud?.remove();
  }

  window.PlayerDebug={teardown,copyLogs,logs,state};
  addLog('READY');
})();