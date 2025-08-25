// js/player/organizer-modal.js
(function () {
  const LS_KEY = 'g73:allMusicOrder:v1';

  // ---------- THEME BRIDGE ----------
  function extractTwoStops(gradientStr){
    if (!gradientStr) return [];
    const m = gradientStr.match(/linear-gradient\([^,]+,([^,]+),([^,)]+)\)/i);
    if (!m) return [];
    return [m[1].trim(), m[2].trim()];
  }

  function applyModalThemeFromControls(rootEl){
    const controls = document.querySelector('.controls[data-ctl-theme]');
    if (!controls || !rootEl) return;

    const cs   = getComputedStyle(controls);
    const doc  = getComputedStyle(document.documentElement);

    const vars = {
      iconGrad:  cs.getPropertyValue('--ctl-icon-gradient')?.trim(),
      progFill:  cs.getPropertyValue('--prog-fill')?.trim(),
      ring:      cs.getPropertyValue('--ctl-ring')?.trim(),
      bg:        cs.getPropertyValue('--ctl-bg')?.trim(),
      border:    cs.getPropertyValue('--ctl-border')?.trim(),
      text:      cs.getPropertyValue('--timer-color')?.trim(),
    };

    const grad = vars.progFill || vars.iconGrad;
    const [stop1, stop2] = extractTwoStops(grad);

    const appPrimary = doc.getPropertyValue('--app-primary')?.trim() || '#5fa0ff';
    const appAccent  = doc.getPropertyValue('--app-accent')?.trim()  || '#b478ff';

    rootEl.style.setProperty('--ctl-modal-fill',    grad || `linear-gradient(90deg, ${appPrimary}, ${appAccent})`);
    rootEl.style.setProperty('--ctl-modal-accent1', stop1 || appPrimary);
    rootEl.style.setProperty('--ctl-modal-accent2', stop2 || appAccent);

    if (vars.ring)   rootEl.style.setProperty('--ctl-modal-ring',   vars.ring);
    if (vars.bg)     rootEl.style.setProperty('--ctl-modal-bg',     vars.bg);
    if (vars.border) rootEl.style.setProperty('--ctl-modal-border', vars.border);
    if (vars.text)   rootEl.style.setProperty('--ctl-modal-text',   vars.text);
  }

  // ---------- Styles (theme-driven) ----------
  const css = `
  /* ===== Organizer Modal (theme-aware) ===== */
  #org-modal{
    --_bg:      color-mix(in srgb, var(--ctl-modal-bg, var(--ctl-bg, rgba(13,17,23,.82))) 100%, transparent);
    --_border:  color-mix(in srgb, var(--ctl-modal-border, var(--ctl-border, rgba(255,255,255,.12))) 65%, transparent);
    --_text:    var(--ctl-modal-text, #e6eef5);
    --_fill:    var(--ctl-modal-fill, var(--prog-fill, linear-gradient(90deg,#5fa0ff,#b478ff)));
    --_ringRaw: var(--ctl-modal-ring, rgba(120,200,255,.45));
    --_a1:      var(--ctl-modal-accent1, #5fa0ff);
    --_a2:      var(--ctl-modal-accent2, #b478ff);
  }

  #org-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99997;}
  #org-modal[aria-hidden="false"]{display:flex;}
  #org-modal .org-backdrop{
    position:absolute;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);
  }

  /* Panel with ring + glow like main controls/list frames */
  #org-modal .org-panel{
    position:relative;z-index:1;width:min(960px,92vw);max-height:82vh;overflow:hidden;border-radius:20px;
    background:
      linear-gradient(180deg,
        color-mix(in srgb, var(--_bg) 78%, transparent),
        color-mix(in srgb, var(--_bg) 52%, transparent));
    outline: 1px solid var(--_border);
    box-shadow: 0 18px 60px rgba(0,0,0,.55);
  }
  #org-modal .org-panel::before{
    content:""; position:absolute; inset:0; border-radius:20px; padding:1px;
    background: var(--_fill);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
  }
  #org-modal .org-panel::after{
    content:""; position:absolute; inset:-14px; border-radius:24px;
    background: radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--_ringRaw) 45%, transparent) 0%, transparent 70%);
    filter: blur(20px); opacity:.45; pointer-events:none;
    animation: orgGlow 6s ease-in-out infinite;
  }
  @keyframes orgGlow{
    0%,100%{ transform: translateY(0) scale(0.98); opacity:.38; }
    50%    { transform: translateY(2px) scale(1.02); opacity:.55; }
  }

  #org-modal header{
    display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--_border); color: var(--_text);
  }
  #org-modal h3{margin:0;font:700 16px/1.2 system-ui,Segoe UI,Roboto,Arial;color:var(--_text);letter-spacing:.2px}
  #org-close{
    border:1px solid color-mix(in srgb, var(--_border) 80%, transparent);
    background:transparent;color:var(--_text);opacity:.9;cursor:pointer;
    font-size:0;display:grid;place-items:center;border-radius:12px;padding:8px; transition: background .12s ease, transform .12s ease, box-shadow .12s ease, border-color .12s ease;
  }
  #org-close:hover{
    background: color-mix(in srgb, var(--_a1) 12%, transparent); transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(0,0,0,.35);
  }

  #org-body{padding:12px 14px}

  .g73-organizer{color:var(--_text)}
  .org-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}

  /* Inputs / Selects themed */
  .org-input,.org-select{
    background: color-mix(in srgb, var(--_bg) 86%, transparent);
    border:1px solid color-mix(in srgb, var(--_border) 100%, transparent);
    color:var(--_text); padding:10px 12px;border-radius:12px;min-width:220px;outline:none;
    transition: border-color .12s ease, box-shadow .12s ease, transform .12s ease;
  }
  .org-input:focus,.org-select:focus{
    border-color: color-mix(in srgb, var(--_a1) 60%, var(--_border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--_a1) 25%, transparent);
  }
  .org-select{min-width:160px}

  /* Buttons */
  .org-btn{
    cursor:pointer;border:1px solid color-mix(in srgb, var(--_border) 100%, transparent);
    background: color-mix(in srgb, var(--_bg) 86%, transparent);
    color:var(--_text); padding:10px 12px;border-radius:12px;font-weight:700; letter-spacing:.2px;
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
  }
  .org-btn:hover{
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--_a1) 50%, var(--_border));
    box-shadow: 0 6px 16px rgba(0,0,0,.30);
    background: color-mix(in srgb, var(--_a1) 10%, transparent);
  }
  .org-btn.primary{
    background: var(--_fill); color:#0b0d10; border-color: transparent;
  }

  .org-file{
    cursor:pointer;border:1px dashed color-mix(in srgb, var(--_border) 85%, transparent);
    padding:10px 12px;border-radius:12px;color:color-mix(in srgb, var(--_text) 75%, #000 0%);
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
  }
  .org-file:hover{
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--_a2) 55%, var(--_border));
    box-shadow: 0 6px 16px rgba(0,0,0,.30);
    background: color-mix(in srgb, var(--_a2) 8%, transparent);
  }

  .org-list{display:grid;gap:8px;max-height:56vh;overflow:auto;padding-right:6px}
  .org-list::-webkit-scrollbar{width:10px}
  .org-list::-webkit-scrollbar-thumb{
    background: color-mix(in srgb, var(--_border) 85%, transparent);
    border-radius: 999px;
  }

  /* Rows */
  .org-row{
    display:grid;grid-template-columns:28px 48px 1fr auto;align-items:center;gap:12px;
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--_bg) 82%, transparent),
      color-mix(in srgb, var(--_bg) 64%, transparent));
    border:1px solid color-mix(in srgb, var(--_border) 100%, transparent);
    border-radius:16px;padding:8px;transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--_border) 35%, transparent);
  }
  .org-row:hover{
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--_a1) 50%, var(--_border));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--_a1) 30%, var(--_border)),
      0 6px 18px rgba(0,0,0,.35);
  }
  .org-row.dragging{opacity:.98;transform:scale(1.01)}
  .org-row.over{outline:2px dashed color-mix(in srgb, var(--_a2) 70%, transparent); outline-offset:3px}
  .org-row[aria-grabbed="true"]{
    border-color: color-mix(in srgb, var(--_a1) 70%, var(--_border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--_a1) 28%, transparent);
  }

  .org-handle{
    cursor:grab; display:grid; place-items:center; border-radius:10px; padding:8px;
    color:#fff;
    background: color-mix(in srgb, var(--_bg) 94%, transparent);
    border:1px solid color-mix(in srgb, var(--_border) 95%, transparent);
    touch-action:none;
    transition: background .12s ease, transform .12s ease, box-shadow .12s ease, border-color .12s ease;
  }
  .org-handle:hover{
    background: color-mix(in srgb, var(--_a1) 12%, transparent);
    box-shadow: 0 6px 14px rgba(0,0,0,.35);
    transform: translateY(-1px);
  }
  .org-handle:active{ cursor:grabbing; background: color-mix(in srgb, var(--_a2) 14%, transparent); }

  .org-cover{width:48px;height:48px;border-radius:12px;background:#0a0e12 center/cover no-repeat;border:1px solid color-mix(in srgb, var(--_border) 90%, transparent); box-shadow: inset 0 0 0 1px rgba(255,255,255,.05)}
  .org-name{font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--_text);letter-spacing:.01em}
  .org-artist{color: color-mix(in srgb, var(--_text) 70%, #000 0%);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .org-id{
    color: color-mix(in srgb, var(--_text) 82%, #000 0%); font-size:12px;padding:6px 10px;border:1px solid color-mix(in srgb, var(--_border) 95%, transparent);border-radius:999px;
    background: color-mix(in srgb, var(--_bg) 90%, transparent);
  }
  .org-foot{display:flex;justify-content:space-between;align-items:center;color: color-mix(in srgb, var(--_text) 75%, #000 0%);font-size:12px;margin-top:10px}
  .org-tip svg{vertical-align:middle}

  /* Organizer opener button in main controls */
  .organize-btn{
    width:40px;height:40px;border-radius:14px;
    border:1px solid color-mix(in srgb, var(--_border) 95%, transparent);
    background:transparent;color:var(--_text);
    display:grid;place-items:center;cursor:pointer;
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
  }
  .organize-btn:hover{
    background: color-mix(in srgb, var(--_a1) 12%, transparent);
    box-shadow: 0 6px 14px rgba(0,0,0,.35);
    transform: translateY(-1px);
  }
  .organize-btn .material-icons{
    font-size:22px; line-height:1;
    background-image: var(--_fill);
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent; color:transparent;
    display:block; width:22px; height:22px;
  }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // ---------- Build modal ----------
  const modal = document.createElement('div');
  modal.id = 'org-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="org-backdrop" data-close=""></div>
    <div class="org-panel">
      <header>
        <h3>Song Organizer</h3>
        <button id="org-close" aria-label="Close"><span class="material-icons" aria-hidden="true">close</span></button>
      </header>
      <div id="org-body">
        <section id="song-organizer" class="g73-organizer">
          <div class="org-controls">
            <input id="org-search" class="org-input" type="search" placeholder="Search by title or artist…"/>
            <select id="org-sort" class="org-select">
              <option value="custom">Custom order</option>
              <option value="name">Name (A→Z)</option>
              <option value="artist">Artist (A→Z)</option>
            </select>
            <button id="org-reset" class="org-btn" title="Reset to saved order">Reset</button>
            <button id="org-save" class="org-btn primary" title="Save order to this browser">Save</button>
            <button id="org-export" class="org-btn" title="Export js/music-list.js">Export JS</button>
            <label class="org-file">
              <input id="org-import" type="file" accept="application/json,.json" hidden>
              <span>Import JSON</span>
            </label>
          </div>
          <div id="org-list" class="org-list" role="list" aria-label="Reorder songs"></div>
          <div class="org-foot">
            <span id="org-count">0 songs</span>
            <span class="org-tip">Tip: drag by the
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M10 4h4v2h-4V4zm0 7h4v2h-4v-2zm0 7h4v2h-4v-2z"/></svg>
              handle. ↑/↓ moves focused item.
            </span>
          </div>
        </section>
      </div>
    </div>
  `;

  // ---------- HARDENED MOUNT + THEME SYNC ----------
  function mountOrganizerModal(){
    if (!document.getElementById('org-modal')) {
      try {
        document.body.appendChild(modal);
        // apply theme once mounted
        applyModalThemeFromControls(modal);
        console.log('[Organizer] modal mounted');
      } catch (e) {
        console.warn('[Organizer] mount failed (body not ready yet)', e);
      }
    }
  }
  function safeInitialRender(){
    try { render(); } catch (e) { console.warn('[Organizer] initial render skipped (list missing yet)', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { mountOrganizerModal(); safeInitialRender(); });
  } else {
    mountOrganizerModal(); safeInitialRender();
  }

  // Live theme updates (from main controls)
  window.addEventListener('player:controls-theme', () => applyModalThemeFromControls(document.getElementById('org-modal')));

  // Fallback: if DOM mutates later and modal is missing, re-mount + render
  const __orgMo = new MutationObserver(() => {
    const hasControls = !!document.querySelector('.controls');
    const hasModal = !!document.getElementById('org-modal');
    if (hasControls && !hasModal) { mountOrganizerModal(); safeInitialRender(); }
  });
  __orgMo.observe(document.documentElement, { childList: true, subtree: true });

  // ---------- Robust Controls Injection ----------
  let injectedOnce = false;
  function getControls() { return document.querySelector('.controls'); }

  function placeButton(controls){
    if (!controls) return false;
    if (controls.querySelector('#open-organizer')) return true;

    const btn = document.createElement('button');
    btn.id = 'open-organizer';
    btn.className = 'organize-btn';
    btn.title = 'Organize playlist';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = `<span class="material-icons" aria-hidden="true">view_list</span>`;

    // Try to place right AFTER the palette button if it exists
    const palette = document.getElementById('ctl-theme-btn') || controls.querySelector('.ctl-theme-btn');
    if (palette && palette.parentElement && palette.parentElement.parentElement === controls) {
      palette.parentElement.insertAdjacentElement('afterend', btn);
    } else {
      controls.appendChild(btn);
    }

    btn.addEventListener('click', openModal);
    injectedOnce = true;

    // make sure button picks up theme
    applyModalThemeFromControls(document.getElementById('org-modal'));
    return true;
  }

  function ensureInjected(){
    let tries = 0;
    const maxTries = 20;
    function tick(){
      if (placeButton(getControls())) return;
      if (++tries < maxTries) requestAnimationFrame(tick);
      else observeControls();
    }
    tick();
  }

  function observeControls(){
    const mo = new MutationObserver(() => {
      const controls = getControls();
      if (!controls) return;
      if (!controls.querySelector('#open-organizer')) {
        placeButton(controls);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // ---------- Data helpers ----------
  const getId = (it) => it?.src || it?.img || `${it?.name||''}-${it?.artist||''}`;
  const readOrder = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
  const writeOrder = (ids) => { try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch {} };

  function mergeOrder(list, saved) {
    const idToItem = new Map(list.map(it => [getId(it), it]));
    const result = [];
    for (const id of saved) if (idToItem.has(id)) { result.push(idToItem.get(id)); idToItem.delete(id); }
    for (const it of idToItem.values()) result.push(it);
    return result;
  }

  // live working set (rebuilt on open)
  let working = [];

  function syncFromGlobal(){
    const base = Array.isArray(window.allMusic) ? window.allMusic.slice() : [];
    working = mergeOrder(base, readOrder());
    console.log('[Organizer] syncFromGlobal:', { globalCount: base.length, workingCount: working.length });
  }

  // ---------- Apply to global + notify helpers ----------
  function bestEffortRebuildUI(){
    try { typeof window.populateMusicList === 'function' && window.populateMusicList(); } catch {}
    try { typeof window.buildMusicList     === 'function' && window.buildMusicList(); } catch {}
    try { typeof window.initMusicList      === 'function' && window.initMusicList(); } catch {}
  }

  function applyToGlobalAndNotify(source = 'organizer'){
    if (!Array.isArray(working) || !working.length) return;
    if (Array.isArray(window.allMusic)) {
      window.allMusic = working.slice();
      window.dispatchEvent(new CustomEvent('playlist:reordered', {
        detail: { allMusic: window.allMusic.slice(), source }
      }));
      bestEffortRebuildUI();
      console.log('[Organizer] applied order to global (and notified).');
    }
  }

  // Try to apply saved order early during boot, once allMusic exists
  function tryApplySavedOrderOnBoot(){
    const saved = readOrder();
    if (!saved.length) return;
    let ticks = 0;
    const maxTicks = 120;
    (function waitForAllMusic(){
      const ok = Array.isArray(window.allMusic) && window.allMusic.length;
      if (ok) {
        working = mergeOrder(window.allMusic.slice(), saved);
        applyToGlobalAndNotify('boot');
        return;
      }
      if (++ticks < maxTicks) requestAnimationFrame(waitForAllMusic);
      else console.warn('[Organizer] Gave up waiting for window.allMusic during boot apply.');
    })();
  }

  // ---------- Cover resolver ----------
  const COVER_BASES = ['', 'images/', 'image/', 'img/', 'imgs/', 'assets/', 'assets/img/', 'assets/images/'];
  const COVER_EXTS  = ['.jpg','.jpeg','.png','.webp','.avif','.gif','.svg'];
  function resolveCover(key){
    if (!key) return null;
    if (/^https?:\/\//i.test(key) || /\.[a-z0-9]{2,5}$/i.test(key)) return key;
    return `images/${key}.jpg`;
  }
  function tryFillCover(div, key){
    if (!div || !key) return;
    const direct = resolveCover(key);
    let img = new Image();
    let tried = 0;

    function set(url){ div.style.backgroundImage = `url("${url}")`; }
    function next(){
      if (tried === 0 && direct) {
        tried++;
        img.src = direct + '?_t=' + Date.now();
        return;
      }
      const idx = tried - 1;
      if (idx >= COVER_BASES.length * COVER_EXTS.length) return;
      const base = COVER_BASES[Math.floor(idx / COVER_EXTS.length)];
      const ext  = COVER_EXTS[idx % COVER_EXTS.length];
      tried++;
      img.src = base + key + ext + '?_t=' + Date.now();
    }
    img.onload = () => set(img.src);
    img.onerror = () => next();
    next();
  }

  // ---------- Modal show/hide ----------
  function openModal() {
    // Re-sync and render fresh
    syncFromGlobal();
    render(true);
    applyToGlobalAndNotify('open');

    // ensure theme is current at open time
    applyModalThemeFromControls(document.getElementById('org-modal'));

    modal.setAttribute('aria-hidden', 'false');
    const ctx = window.audioCtx || window.AudioContextInstance;
    if (ctx && ctx.state === 'suspended') ctx.resume?.();
  }
  function closeModal() { modal.setAttribute('aria-hidden', 'true'); }
  document.addEventListener('click', (e) => {
    const m = document.getElementById('org-modal');
    if (!m) return;
    if (e.target === m || e.target?.hasAttribute?.('data-close')) closeModal();
  });
  document.addEventListener('click', (e) => {
    if (e.target?.id === 'org-close' || e.target?.closest?.('#org-close')) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(); });

  // ---------- Organizer UI refs ----------
  const el = {
    get list(){ return document.querySelector('#org-list'); },
    get search(){ return document.querySelector('#org-search'); },
    get sort(){ return document.querySelector('#org-sort'); },
    get save(){ return document.querySelector('#org-save'); },
    get reset(){ return document.querySelector('#org-reset'); },
    get export(){ return document.querySelector('#org-export'); },
    get import(){ return document.querySelector('#org-import'); },
    get count(){ return document.querySelector('#org-count'); },
  };

  function escapeHtml(s) { return String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function row(item) {
    const id = getId(item);
    const r = document.createElement('div');
    r.className = 'org-row';
    r.setAttribute('role', 'listitem');
    r.setAttribute('tabindex', '0');
    r.dataset.id = id;
    r.innerHTML = `
      <button class="org-handle" aria-label="Drag to reorder" draggable="true">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 4h4v2h-4V4zm0 7h4v2h-4v-2zm0 7h4v2h-4v-2z"/></svg>
      </button>
      <div class="org-cover" aria-hidden="true"></div>
      <div class="org-texts">
        <div class="org-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
        <div class="org-artist" title="${escapeHtml(item.artist)}">${escapeHtml(item.artist)}</div>
      </div>
      <div class="org-id">${escapeHtml(id)}</div>
    `;

    const coverKey = item.cover || item.img || item.src;
    tryFillCover(r.querySelector('.org-cover'), coverKey);

    // ----- Desktop HTML5 drag support -----
    const handle = r.querySelector('.org-handle');
    handle.addEventListener('dragstart', (e) => {
      r.classList.add('dragging'); r.setAttribute('aria-grabbed', 'true');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    });
    handle.addEventListener('dragend', () => { r.classList.remove('dragging'); r.removeAttribute('aria-grabbed'); });

    r.addEventListener('dragover', (e) => { e.preventDefault(); r.classList.add('over'); });
    r.addEventListener('dragleave', () => r.classList.remove('over'));
    r.addEventListener('drop', (e) => {
      e.preventDefault(); r.classList.remove('over');
      const fromId = e.dataTransfer.getData('text/plain'); const toId = id;
      if (!fromId || fromId === toId) return;
      moveId(fromId, toId);
    });

    // Keyboard move
    r.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp')   { e.preventDefault(); moveBy(id, -1); r.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); moveBy(id, +1); r.focus(); }
    });

    // ----- Mobile/Pointer drag support -----
    let pointerDragging = false;
    let dragRow = null;

    function onPointerDown(e){
      if (e.button !== undefined && e.button !== 0) return;
      handle.setPointerCapture?.(e.pointerId);
      pointerDragging = true;
      dragRow = r;
      r.classList.add('dragging'); r.setAttribute('aria-grabbed','true');
      e.preventDefault();
    }
    function onPointerMove(e){
      if (!pointerDragging || !dragRow) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const elUnder = document.elementFromPoint(clientX, clientY);
      const overRow = elUnder && elUnder.closest('.org-row');
      if (!overRow || overRow === dragRow || overRow.parentElement !== el.list) return;
      const rect = overRow.getBoundingClientRect();
      const before = (clientY < rect.top + rect.height/2);
      el.list.insertBefore(dragRow, before ? overRow : overRow.nextSibling);
    }
    function onPointerUpCancel(){
      if (!pointerDragging) return;
      pointerDragging = false;
      r.classList.remove('dragging'); r.removeAttribute('aria-grabbed');
      const ids = [...el.list.querySelectorAll('.org-row')].map(d => d.dataset.id);
      working = ids.map(id => working.find(it => getId(it) === id)).filter(Boolean);
      persistIfCustom(); render(); dispatch();
    }

    if ('onpointerdown' in window) {
      handle.addEventListener('pointerdown', onPointerDown, {passive:false});
      window.addEventListener('pointermove', onPointerMove, {passive:false});
      window.addEventListener('pointerup',   onPointerUpCancel, {passive:true});
      window.addEventListener('pointercancel', onPointerUpCancel, {passive:true});
    } else {
      handle.addEventListener('touchstart', (e)=>{ onPointerDown(e); }, {passive:false});
      window.addEventListener('touchmove',  (e)=>{ onPointerMove(e); }, {passive:false});
      window.addEventListener('touchend',   onPointerUpCancel, {passive:true});
      window.addEventListener('touchcancel',onPointerUpCancel, {passive:true});
    }

    return r;
  }

  // ---------- HARDENED RENDER ----------
  function render(fresh = false) {
    const list = document.getElementById('org-list');
    if (!list) {
      console.warn('[Organizer] #org-list not in DOM yet; deferring render.');
      return;
    }
    const searchEl = document.getElementById('org-search');
    const sortEl   = document.getElementById('org-sort');
    const countEl  = document.getElementById('org-count');

    if (fresh) {
      if (sortEl && !sortEl._touched) sortEl.value = 'custom';
      if (searchEl && !searchEl._touched) searchEl.value = '';
    }

    const q = (searchEl?.value || '').trim().toLowerCase();
    const mode = sortEl?.value || 'custom';

    const source = Array.isArray(window.allMusic) ? window.allMusic : [];
    let view = (Array.isArray(working) && working.length) ? working.slice() : source.slice();

    if (q) view = view.filter(it => ((it.name||'') + ' ' + (it.artist||'')).toLowerCase().includes(q));
    if (mode === 'name')   view.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    if (mode === 'artist') view.sort((a,b)=> (a.artist||'').localeCompare(b.artist||''));

    list.innerHTML = '';
    for (const item of view) list.appendChild(row(item));

    if (countEl) countEl.textContent = `${view.length} ${view.length === 1 ? 'song' : 'songs'}`;
    console.log('[Organizer] render OK:', { shown: view.length, mode });
  }

  function moveBy(id, delta) {
    const i = working.findIndex(it => getId(it) === id); if (i < 0) return;
    const j = Math.max(0, Math.min(working.length - 1, i + delta));
    if (i === j) return;
    const [m] = working.splice(i, 1); working.splice(j, 0, m);
    persistIfCustom(); render(); dispatch();
  }

  function moveId(fromId, toId) {
    const from = working.findIndex(it => getId(it) === fromId);
    const to   = working.findIndex(it => getId(it) === toId);
    if (from < 0 || to < 0) return;
    const [m] = working.splice(from, 1);
    working.splice(to, 0, m);
    persistIfCustom(); render(); dispatch();
  }

  function persistIfCustom() { 
    const sortEl = document.getElementById('org-sort');
    if ((sortEl?.value || 'custom') === 'custom') writeOrder(working.map(getId));
  }

  function dispatch() {
    if (Array.isArray(window.allMusic)) {
      const order = working.map(x => x);
      window.allMusic = order;
      window.dispatchEvent(new CustomEvent('playlist:reordered', { detail: { allMusic: order.slice(), source:'drag' } }));
      bestEffortRebuildUI();
    }
  }

  function exportJS() {
    const code = `// js/music-list.js
// Define the playlist as a GLOBAL so other scripts can use it.
window.allMusic = ${JSON.stringify(working, null, 2)};

console.log('[music-list] allMusic length =', window.allMusic.length);
`;
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'music-list.js'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function importJSON(file) {
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        if (data.length && typeof data[0] === 'string') {
          const base = Array.isArray(window.allMusic) ? window.allMusic.slice() : working;
          working = mergeOrder(base, data);
        } else if (data.length && typeof data[0] === 'object') {
          working = mergeOrder(data, readOrder());
        }
        writeOrder(working.map(getId));
        const sortEl = document.getElementById('org-sort');
        if (sortEl) sortEl.value = 'custom';
        render(); applyToGlobalAndNotify('import');
      } else {
        alert('JSON must be an array of ids or song objects.');
      }
    } catch {
      alert('Invalid JSON.');
    }
  }

  function resetToSaved() {
    const srcNow = Array.isArray(window.allMusic) ? window.allMusic.slice() : [];
    working = mergeOrder(srcNow, readOrder());
    const sortEl = document.getElementById('org-sort');
    const searchEl = document.getElementById('org-search');
    if (sortEl) sortEl.value = 'custom';
    if (searchEl) searchEl.value = '';
    render(); applyToGlobalAndNotify('reset');
  }

  // Control wiring
  document.addEventListener('click', (e)=>{
    if (e.target?.id === 'org-save') { writeOrder(working.map(getId)); applyToGlobalAndNotify('save'); alert('Saved! This order will stick on this browser.'); }
    if (e.target?.id === 'org-reset') resetToSaved();
    if (e.target?.id === 'org-export') exportJS();
  });
  document.addEventListener('change', (e)=>{
    if (e.target?.id === 'org-import') importJSON(e.target.files[0]);
    if (e.target?.id === 'org-sort') { e.target._touched = true; render(); }
  });
  document.addEventListener('input', (e)=>{
    if (e.target?.id === 'org-search') { e.target._touched = true; render(); }
  });

  // Boot: inject button + try to apply saved order early
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureInjected();
      tryApplySavedOrderOnBoot();
    });
  } else {
    ensureInjected();
    tryApplySavedOrderOnBoot();
  }

  // If other code reorders, keep in sync (and update working only if modal is open)
  window.addEventListener('playlist:reordered', (e) => {
    if (Array.isArray(e.detail?.allMusic)) {
      const from = e.detail.source || 'external';
      working = mergeOrder(e.detail.allMusic, readOrder());
      if (modal.getAttribute('aria-hidden') === 'false') render();
      console.log('[Organizer] observed playlist:reordered (source:', from, ')');
    }
  });

  // Safety log if controls aren't found after a while
  setTimeout(() => {
    if (!injectedOnce) {
      console.warn('[Organizer] Could not find .controls to inject the Organize button. ' +
                   'Ensure organizer-modal.js is included AFTER your player HTML and after any script that builds .controls.');
    }
  }, 2500);

  // Optional API exposure
  window.g73Organizer = {
    applyToGlobal: () => applyToGlobalAndNotify('api'),
    refreshFromGlobal: () => { syncFromGlobal(); render(true); }
  };
})();