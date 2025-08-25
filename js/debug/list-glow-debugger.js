// js/debug/list-glow-debugger.js
(function(){
  const POS_KEY = 'g73.debugger.pos.v1';

  // Safe guards
  const wrapper = document.querySelector('.wrapper');
  if (!wrapper) { console.warn('[G73 Debugger] .wrapper not found.'); return; }

  // Elements we care about
  const listWrap = wrapper.querySelector('.music-list');
  const ul       = listWrap?.querySelector('ul');
  const controls = wrapper.querySelector('.controls');
  const mainAudio= wrapper.querySelector('#main-audio');

  // ---- UI: floating debugger panel ----
  const panel = document.createElement('div');
  panel.id = 'g73-debugger';
  panel.innerHTML = `
    <header>
      <div class="title">G73 List Glow Debugger</div>
      <div class="btns">
        <button type="button" data-act="copy">Copy</button>
        <button type="button" data-act="download">Download</button>
        <button type="button" data-act="clear">Clear</button>
        <button type="button" data-act="toggle">Hide</button>
      </div>
    </header>
    <div class="body">
      <div class="row">
        <div class="kvs">
          <div class="k">Active LI index</div><div class="v" id="dbg-active">–</div>
          <div class="k">Playing LI index</div><div class="v" id="dbg-playing">–</div>
          <div class="k">Wrapper .paused?</div><div class="v" id="dbg-paused">–</div>
          <div class="k">Audio state</div><div class="v" id="dbg-audio">–</div>
          <div class="k">List open?</div><div class="v" id="dbg-open">–</div>
          <div class="k">Theme vars</div><div class="v" id="dbg-theme">–</div>
        </div>
      </div>
      <div class="row" style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" data-act="mark">Mark active/playing</button>
        <button type="button" data-act="inject">Inject test halo</button>
        <button type="button" data-act="outlines">Toggle outlines</button>
        <button type="button" data-act="zbadges">Toggle z-badges</button>
        <button type="button" data-act="refresh">Refresh</button>
      </div>
      <div class="row">
        <div class="log" id="dbg-log" tabindex="0" aria-label="Debugger log (select text to copy)"></div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const $ = (sel) => panel.querySelector(sel);
  const logBox = $('#dbg-log');
  const header = panel.querySelector('header');

  function log(msg){
    const ts = new Date().toISOString().split('T')[1].replace('Z','');
    // Prepend newest at top (visible immediately)
    logBox.textContent = `[${ts}] ${msg}\n` + logBox.textContent;
  }

  // ---- Utilities ----
  function liIndex(li){
    const n = li.getAttribute('li-index') || li.dataset.index;
    return n ? parseInt(n,10) : Array.from(li.parentElement.children).indexOf(li) + 1;
  }

  function currentState(){
    const listOpen = listWrap?.classList.contains('show') ? 'yes' : 'no';
    const paused   = wrapper.classList.contains('paused');
    const audio    = mainAudio ? (mainAudio.paused ? 'paused' : 'playing') : 'no-audio';
    const theme    = controls ? {
      bg:   getComputedStyle(controls).getPropertyValue('--ctl-bg').trim(),
      fill: getComputedStyle(controls).getPropertyValue('--prog-fill').trim(),
      ring: getComputedStyle(controls).getPropertyValue('--ctl-ring').trim()
    } : {};
    const all = ul ? [...ul.children] : [];
    const act = all.findIndex(li=>li.classList.contains('active')) + 1 || '–';
    const ply = all.findIndex(li=>li.classList.contains('playing')) + 1 || '–';

    $('#dbg-active').textContent  = String(act);
    $('#dbg-playing').textContent = String(ply);
    $('#dbg-paused').textContent  = paused ? 'yes' : 'no';
    $('#dbg-audio').textContent   = audio;
    $('#dbg-open').textContent    = listOpen;
    $('#dbg-theme').textContent   = JSON.stringify(theme);

    return { act, ply, paused, audio, listOpen, theme, all };
  }

  function ensureLiRelative(li){
    const cs = getComputedStyle(li);
    if (cs.position === 'static') {
      li.style.position = 'relative';
      li.dataset.g73Rel = '1';
    }
  }

  // Inject a visible halo element (so z-index/compositing issues with ::after are bypassed)
  function injectHalo(li){
    if (!li) return;
    ensureLiRelative(li);
    let halo = li.querySelector(':scope > .g73-debug-halo');
    if (!halo){
      halo = document.createElement('div');
      halo.className = 'g73-debug-halo';
      li.insertBefore(halo, li.firstChild);
    }
    halo.style.display = '';
    return halo;
  }

  // Mark current active/playing rows
  function mark(){
    if (!ul) return;
    [...ul.children].forEach(li=>{
      li.querySelectorAll(':scope > .g73-znow').forEach(n=>n.remove());
      if (li.classList.contains('active') || li.classList.contains('playing')){
        ensureLiRelative(li);
        const tag = document.createElement('div');
        tag.className = 'g73-znow';
        Object.assign(tag.style, {
          position:'absolute', top:'-10px', left:'8px', fontSize:'11px',
          color:'#ffe6a8', pointerEvents:'none', textShadow:'0 1px 2px rgba(0,0,0,.6)'
        });
        tag.textContent = 'ACTIVE/PLAYING';
        li.appendChild(tag);
      }
    });
    log('Marked active/playing LI elements.');
  }

  // Toggle outlines to see stacking/overflow
  let outlined = false;
  function toggleOutlines(){
    outlined = !outlined;
    if (outlined) {
      listWrap?.classList.add('g73-debug-outline');
      log('Outlines: ON');
    } else {
      listWrap?.classList.remove('g73-debug-outline');
      log('Outlines: OFF');
    }
  }

  // Z badges show z-index for each LI
  let zbadges = false;
  function toggleZBadges(){
    zbadges = !zbadges;
    if (!ul) return;
    [...ul.children].forEach(li=>{
      let badge = li.querySelector(':scope > .g73-zbadge');
      if (zbadges){
        if (!badge){
          badge = document.createElement('div');
          badge.className = 'g73-zbadge';
          li.appendChild(badge);
        }
        const zi = getComputedStyle(li).zIndex;
        badge.textContent = `z:${zi || 'auto'}`;
      } else {
        badge?.remove();
      }
    });
    log('z-badges: ' + (zbadges ? 'ON' : 'OFF'));
  }

  // Inject halo on the currently active/playing LI
  function injectOnCurrent(){
    const { all } = currentState();
    const li = all.find(li=>li.classList.contains('active') || li.classList.contains('playing'));
    if (!li){
      log('No active/playing LI found.');
      return;
    }
    injectHalo(li);
    // Make children sit above the halo
    [...li.children].forEach(c=>{ c.style.position='relative'; c.style.zIndex=1; });
    li.style.zIndex = Math.max(parseInt(getComputedStyle(li).zIndex) || 0, 5);
    log(`Injected test halo on LI index ${liIndex(li)}`);
  }

  // ---- Panel interactions ----
  panel.addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'toggle'){
      const body = panel.querySelector('.body');
      if (body.style.display === 'none'){ body.style.display=''; b.textContent='Hide'; }
      else { body.style.display='none'; b.textContent='Show'; }
    }
    if (act === 'copy'){
      const txt = logBox.textContent || '';
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(txt).then(()=> log('Log copied to clipboard.'));
      } else {
        // Fallback: select + execCommand
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(logBox);
        sel.removeAllRanges(); sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        log('Log copied (fallback).');
      }
    }
    if (act === 'download'){
      const blob = new Blob([logBox.textContent || ''], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `g73-debug-log-${Date.now()}.txt`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      log('Log downloaded.');
    }
    if (act === 'clear'){ logBox.textContent = ''; log('Log cleared.'); }
    if (act === 'mark')    mark();
    if (act === 'inject')  injectOnCurrent();
    if (act === 'outlines')toggleOutlines();
    if (act === 'zbadges') toggleZBadges();
    if (act === 'refresh') { currentState(); log('Refreshed state.'); }
  });

  // ---- Make the panel draggable (mouse + touch) ----
  let dragging = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function applyLeftTop(left, top){
    panel.style.left = `${left}px`;
    panel.style.top  = `${top}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  function restorePosition(){
    try{
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return;
      const { left, top } = JSON.parse(raw);
      if (Number.isFinite(left) && Number.isFinite(top)) applyLeftTop(left, top);
    }catch{}
  }

  function persistPosition(){
    const rect = panel.getBoundingClientRect();
    try{ localStorage.setItem(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top })); }catch{}
  }

  function pointerDown(clientX, clientY){
    dragging = true;
    panel.classList.add('dragging');

    const rect = panel.getBoundingClientRect();
    // Convert current position to left/top so dragging is smooth even if we started with right/bottom
    applyLeftTop(rect.left, rect.top);

    startX = clientX; startY = clientY;
    startLeft = rect.left; startTop = rect.top;

    window.addEventListener('mousemove', onMouseMove, {passive:false});
    window.addEventListener('mouseup',   onMouseUp,   {passive:true});
    window.addEventListener('touchmove', onTouchMove, {passive:false});
    window.addEventListener('touchend',  onTouchEnd,  {passive:true});
  }

  function pointerMove(clientX, clientY){
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;

    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    const left = clamp(startLeft + dx, 8, window.innerWidth  - w - 8);
    const top  = clamp(startTop  + dy, 8, window.innerHeight - h - 8);

    applyLeftTop(left, top);
  }

  function pointerUp(){
    if (!dragging) return;
    dragging = false;
    panel.classList.remove('dragging');
    persistPosition();

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup',   onMouseUp);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend',  onTouchEnd);
  }

  function onMouseDown(e){
    // Allow clicking buttons in header without dragging
    if (e.target.closest('button')) return;
    pointerDown(e.clientX, e.clientY);
    e.preventDefault();
  }
  function onMouseMove(e){ pointerMove(e.clientX, e.clientY); e.preventDefault(); }
  function onMouseUp(){ pointerUp(); }

  function onTouchStart(e){
    const t = e.touches[0]; if (!t) return;
    if (e.target.closest('button')) return;
    pointerDown(t.clientX, t.clientY);
    e.preventDefault();
  }
  function onTouchMove(e){ const t=e.touches[0]; if(t){ pointerMove(t.clientX, t.clientY); e.preventDefault(); } }
  function onTouchEnd(){ pointerUp(); }

  header.addEventListener('mousedown', onMouseDown, {passive:false});
  header.addEventListener('touchstart', onTouchStart, {passive:false});

  // Keep panel on-screen if viewport resizes
  window.addEventListener('resize', ()=>{
    const rect = panel.getBoundingClientRect();
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const left = clamp(rect.left, 8, window.innerWidth  - w - 8);
    const top  = clamp(rect.top,  8, window.innerHeight - h - 8);
    applyLeftTop(left, top);
    persistPosition();
  }, {passive:true});

  // ---- Listeners to track state changes ----
  function onAnyChange(reason){
    const { act, ply } = currentState();
    log(`${reason} → active:${act} playing:${ply}`);
  }

  if (ul){
    const mo = new MutationObserver(muts=>{
      for (const m of muts){
        if (m.type === 'attributes' && m.attributeName === 'class'){
          onAnyChange('LI class change');
        }
        if (m.type === 'childList'){
          onAnyChange('List rebuilt');
        }
      }
    });
    mo.observe(ul, { subtree:true, childList:true, attributes:true, attributeFilter:['class'] });
  }

  document.addEventListener('click', (e)=>{
    if (e.target.closest('.music-list li')) onAnyChange('Click LI');
    if (e.target.closest('.g73-play')) onAnyChange('Click row play');
  }, {capture:true});

  ['play','playing','pause','ended','timeupdate'].forEach(ev=>{
    mainAudio?.addEventListener(ev, ()=> onAnyChange('Audio ' + ev), {passive:true});
  });

  const moList = new MutationObserver(()=> onAnyChange('List show/hide'));
  listWrap && moList.observe(listWrap, { attributes:true, attributeFilter:['class'] });

  // Monkeypatch hooks (non-invasive)
  function wrap(name){
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function(...args){
      const r = orig.apply(this, args);
      try { onAnyChange(name + '()'); } catch {}
      return r;
    };
  }
  ['playingSong','playMusic','pauseMusic','loadMusic','nextMusic','prevMusic'].forEach(wrap);

  // Initial readout + restore position
  restorePosition();
  setTimeout(()=>{ currentState(); log('Debugger ready (draggable + copiable log).'); }, 0);

  // Quick auto-diagnosis
  function quickDiagnose(){
    if (!ul) return;
    const cur = [...ul.children].find(li=>li.classList.contains('active') || li.classList.contains('playing'));
    if (!cur) { log('Diag: No active/playing LI to check.'); return; }

    const cs = getComputedStyle(cur);
    const zi = cs.zIndex;
    const of = cs.overflow;

    if (zi === 'auto' || parseInt(zi) < 1){
      log('Diag: LI z-index is low/auto. Suggest: li.active/li.playing { position:relative; z-index:5; }');
    }
    if (of && of !== 'visible'){
      log(`Diag: LI overflow=${of}. Halo pseudo-element may be clipped; try injected halo (use “Inject test halo”).`);
    }
    const parent = cur.parentElement;
    const pcs = getComputedStyle(parent);
    if (pcs.overflow !== 'visible'){
      log(`Diag: UL overflow=${pcs.overflow}. Halo may be clipped by UL; injected halo keeps it inside LI bounds.`);
    }
  }
  setTimeout(quickDiagnose, 300);
})();