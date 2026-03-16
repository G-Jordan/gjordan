/*! Theme Debug Panel v1 — icons & stats */
(() => {
  const $  = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> [...r.querySelectorAll(s)];
  const getVar = (v, el=document.documentElement)=> getComputedStyle(el).getPropertyValue(v).trim();

  // --- Targets we care about
  const TARGETS = [
    {label:'Like icon',     q:'#reaction-buttons .like-btn i.material-icons'},
    {label:'Dislike icon',  q:'#reaction-buttons .dislike-btn i.material-icons'},
    {label:'Download icon', q:'#reaction-buttons .download-btn i.material-icons'},
    {label:'Plays stat',    q:'#stats-plays'},
    {label:'Likes stat',    q:'#stats-likes'},
    {label:'Dislikes stat', q:'#stats-dislikes'},
    {label:'Downloads stat',q:'#stats-downloads'},
  ];

  // --- Utility: read both color and -webkit-text-fill-color
  function readColors(el){
    const cs = getComputedStyle(el);
    const color = cs.color;
    const webkitFill = cs.getPropertyValue('-webkit-text-fill-color')?.trim() || '';
    const parent = el.parentElement ? getComputedStyle(el.parentElement).color : '';
    const hasInlineColor = el.style.color && el.style.color.trim();
    const hasInlineFill  = el.style.getPropertyValue('-webkit-text-fill-color')?.trim();

    // If text-fill-color is set and not 'currentcolor', it overrides visually in WebKit
    const effective = (webkitFill && webkitFill !== 'currentcolor') ? webkitFill : color;

    return { color, webkitFill, effective, parent, hasInlineColor, hasInlineFill };
  }

  // --- Diagnose common reasons
  function diagnose(el, colors){
    const notes = [];
    const isBlack = (c)=> /^rgb\(\s*0,\s*0,\s*0\s*\)$/i.test(c) || c === 'black';
    const isTransparent = (c)=> c === 'transparent';

    // 1) currentColor chain
    if (isBlack(colors.effective)) {
      const parentIsBlack = isBlack(colors.parent);
      if (parentIsBlack) notes.push('Parent text color is black → currentColor resolves to black.');
      else notes.push('Element color resolves to black; parent color = ' + colors.parent);
    }

    // 2) -webkit-text-fill-color wins over color in Blink/WebKit
    if (colors.webkitFill && colors.webkitFill !== 'currentcolor') {
      notes.push(`-webkit-text-fill-color is set to "${colors.webkitFill}" (overrides color).`);
    }

    // 3) Specificity/override hints (we can’t list CSS sources reliably, but we can guess)
    if (!colors.hasInlineColor && !colors.hasInlineFill) {
      notes.push('No inline color set; relying on stylesheet cascade.');
    }

    // 4) Variable sanity
    const vars = {
      '--like-color':     getVar('--like-color'),
      '--dislike-color':  getVar('--dislike-color'),
      '--download-color': getVar('--download-color'),
      '--primary-color':  getVar('--primary-color'),
      '--accent-color':   getVar('--accent-color'),
      '--app-primary':    getVar('--app-primary'),
      '--app-accent':     getVar('--app-accent')
    };
    // If the element is a specific type, check expected var presence
    if (el.matches('.like-btn *') && !vars['--like-color']) notes.push('Missing --like-color on :root.');
    if (el.matches('.dislike-btn *') && !vars['--dislike-color']) notes.push('Missing --dislike-color on :root.');
    if (el.matches('.download-btn *') && !vars['--download-color']) notes.push('Missing --download-color on :root.');

    // 5) Material Icons specific: ensure they inherit color
    if (el.matches('i.material-icons')) {
      // Check if a stylesheet set a literal color (black) with higher specificity (we can’t read sources, but we can detect non-currentColor)
      const cs = getComputedStyle(el);
      const fill = cs.getPropertyValue('-webkit-text-fill-color').trim();
      if (fill && fill !== 'currentcolor') notes.push('Material icon has text-fill-color not equal to currentColor.');
    }

    // 6) Transparency
    if (isTransparent(colors.effective)) notes.push('Computed color is transparent.');

    return {notes, vars};
  }

  // --- UI: small floating panel
  function makePanel(){
    const el = document.createElement('div');
    el.id = 'theme-debug-panel';
    el.style.cssText = `
      position:fixed; right:14px; bottom:14px; z-index:999999;
      width: 360px; max-height: 70vh; overflow:auto;
      background: rgba(18,22,28,.95);
      color:#e8eef7; font: 12px/1.45 system-ui,Segoe UI,Roboto,Arial;
      border:1px solid rgba(255,255,255,.15);
      border-radius:12px; box-shadow: 0 16px 42px rgba(0,0,0,.55);
    `;
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.1)">
        <strong>Theme Debug — Icons & Stats</strong>
        <div style="display:flex;gap:8px;align-items:center">
          <button data-action="refresh" style="padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#263042;color:#cfe3ff;cursor:pointer">Scan</button>
          <button data-action="fix"     style="padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#263042;color:#cfe3ff;cursor:pointer" title="Inline set expected colors (temporary)">Quick Fix</button>
          <button data-action="close"   style="padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#3b1f24;color:#ffd0d6;cursor:pointer">✕</button>
        </div>
      </div>
      <div style="padding:10px 12px;display:grid;gap:10px" data-body></div>
      <div style="padding:10px 12px;border-top:1px solid rgba(255,255,255,.1);display:grid;gap:6px">
        <div><strong>Root Vars</strong></div>
        <div data-vars style="display:grid;gap:4px;font-family:ui-monospace,Consolas,monospace"></div>
        <div style="opacity:.75">Tip: Press <kbd style="padding:1px 4px;border:1px solid rgba(255,255,255,.25);border-radius:4px;background:#24303a">Ctrl</kbd>+<kbd style="padding:1px 4px;border:1px solid rgba(255,255,255,.25);border-radius:4px;background:#24303a">Alt</kbd>+<kbd style="padding:1px 4px;border:1px solid rgba(255,255,255,.25);border-radius:4px;background:#24303a">D</kbd> to toggle this panel.</div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('[data-action="close"]').onclick = () => el.remove();
    el.querySelector('[data-action="refresh"]').onclick = scan;
    el.querySelector('[data-action="fix"]').onclick = quickFix;
    return el;
  }

  function paintVars(vars){
    const c = panel.querySelector('[data-vars]');
    c.innerHTML = '';
    Object.entries(vars).forEach(([k,v])=>{
      const row = document.createElement('div');
      row.innerHTML = `<code>${k}:</code> <span style="color:#9ed0ff">${v||'<empty>'}</span>`;
      c.appendChild(row);
    });
  }

  // --- Perform scan
  function scan(){
    const body = panel.querySelector('[data-body]');
    body.innerHTML = '';

    // Show root var snapshot
    const rootVars = {
      '--like-color':     getVar('--like-color'),
      '--dislike-color':  getVar('--dislike-color'),
      '--download-color': getVar('--download-color'),
      '--primary-color':  getVar('--primary-color'),
      '--accent-color':   getVar('--accent-color'),
      '--app-primary':    getVar('--app-primary'),
      '--app-accent':     getVar('--app-accent')
    };
    paintVars(rootVars);

    TARGETS.forEach(t=>{
      const el = $(t.q);
      const wrap = document.createElement('div');
      wrap.style.cssText = 'border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px;display:grid;gap:6px';

      if (!el){
        wrap.innerHTML = `<div><strong>${t.label}</strong></div><div style="color:#ffb3b3">Not found: <code>${t.q}</code></div>`;
        body.appendChild(wrap);
        return;
      }

      const {color, webkitFill, effective, parent, hasInlineColor, hasInlineFill} = readColors(el);
      const {notes} = diagnose(el, {color, webkitFill, effective, parent, hasInlineColor, hasInlineFill});

      wrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <strong>${t.label}</strong>
          <span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${effective};border:1px solid rgba(255,255,255,.25)" title="effective color swatch"></span>
        </div>
        <div style="font-family:ui-monospace,Consolas,monospace">
          color: <span style="color:#bde0ff">${color}</span><br/>
          -webkit-text-fill-color: <span style="color:#bde0ff">${webkitFill||'(none)'}</span><br/>
          effective: <span style="color:#bde0ff">${effective}</span><br/>
          parent color: <span style="color:#bde0ff">${parent||'(none)'}</span><br/>
          inline color? <span style="color:#bde0ff">${hasInlineColor ? 'yes' : 'no'}</span> · inline text-fill? <span style="color:#bde0ff">${hasInlineFill ? 'yes':'no'}</span>
        </div>
        <div ${notes.length ? '' : 'style="display:none"'}><em>Notes:</em>
          <ul style="margin:6px 0 0 16px;padding:0">${notes.map(n=>`<li>${n}</li>`).join('')}</ul>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button data-highlight style="padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#24303a;color:#cfe3ff;cursor:pointer">Highlight</button>
          <button data-log style="padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#24303a;color:#cfe3ff;cursor:pointer">Log to console</button>
        </div>
      `;
      wrap.querySelector('[data-highlight]').onclick = ()=>{
        el.style.outline = '2px solid #5ad1ff';
        el.style.boxShadow = '0 0 0 3px rgba(90,209,255,.35)';
        setTimeout(()=>{ el.style.outline=''; el.style.boxShadow=''; }, 1200);
      };
      wrap.querySelector('[data-log]').onclick = ()=> console.log('[ThemeDebug] %s (%s)', t.label, t.q, {element:el, color, webkitFill, effective, parent});
      body.appendChild(wrap);
    });
  }

  // --- Quick fix (for confirmation): force intended colors inline
  function quickFix(){
    const likeI     = $('#reaction-buttons .like-btn i.material-icons');
    const dislikeI  = $('#reaction-buttons .dislike-btn i.material-icons');
    const downloadI = $('#reaction-buttons .download-btn i.material-icons');
    const set = (el, v)=>{
      if (!el || !v) return;
      el.style.setProperty('color', v, 'important');
      el.style.setProperty('-webkit-text-fill-color', 'currentcolor', 'important');
    };
    set(likeI,     getVar('--like-color')     || getVar('--primary-color'));
    set(dislikeI,  getVar('--dislike-color')  || '#ff3b30');
    set(downloadI, getVar('--download-color') || getVar('--accent-color'));

    // stats
    const sLikes = $('#stats-likes');
    const sDis   = $('#stats-dislikes');
    const sDown  = $('#stats-downloads');
    if (sLikes) sLikes.style.setProperty('color', getVar('--like-color') || getVar('--primary-color'), 'important');
    if (sDis)   sDis.style.setProperty('color', getVar('--dislike-color') || '#ff3b30', 'important');
    if (sDown)  sDown.style.setProperty('color', getVar('--download-color') || getVar('--accent-color'), 'important');

    scan();
  }

  // --- Panel boot & hotkey
  let panel;
  function toggle(){
    if (panel && document.body.contains(panel)) { panel.remove(); return; }
    panel = makePanel(); scan();
  }
  document.addEventListener('keydown', (e)=>{
    if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault(); toggle();
    }
  });

  // Auto-open once on load for you
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', toggle, {once:true});
  } else toggle();

  // Re-scan on theme events (your code fires these)
  window.addEventListener('theme:changed', scan);
  window.addEventListener('controls-theme-change', scan);
})();