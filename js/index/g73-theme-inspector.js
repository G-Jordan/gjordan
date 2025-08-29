
(function(){
  const VARS_OF_INTEREST = [
    '--app-primary','--app-accent',
    '--primary-color','--accent-color',
    '--mainThemeColor','--accentColor',
    '--theme-primary','--theme-accent',
    '--secondary-color','--prog-fill','--glow-color'
  ];

  const HEX   = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/ig;
  const FUNC  = /\b(?:rgb|rgba|hsl|hsla)\([^\)]*\)/ig;
  const GRAD  = /\b(?:linear-gradient|radial-gradient)\([^\)]*\)/ig;
  const MAYBE = /\b(?:color-mix|oklch|lab|lch)\([^\)]*\)/ig;

  const container = document.getElementById('g73-theme-inspector');
  container.innerHTML = `
    <style>
      #g73ti {
        position: fixed; bottom: 16px; right: 16px; z-index: 999999;
        width: 380px; max-height: 70vh; overflow: hidden; border-radius: 14px;
        background: color-mix(in srgb, var(--app-primary, #5fa0ff) 8%, #0b0d10);
        color: var(--white-faint, #e8eef6);
        border: 1px solid color-mix(in srgb, var(--app-accent, #b478ff) 35%, transparent);
        box-shadow:
          0 14px 36px rgba(0,0,0,.5),
          0 0 22px color-mix(in srgb, var(--app-accent, #b478ff) 28%, transparent);
        font: 13px/1.4 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      #g73ti header{
        display:flex; align-items:center; gap:8px; padding:10px 12px;
        background: linear-gradient(90deg,
          color-mix(in srgb, var(--app-primary, #5fa0ff) 18%, transparent),
          color-mix(in srgb, var(--app-accent, #b478ff) 18%, transparent));
        border-bottom: 1px solid color-mix(in srgb, var(--app-primary, #5fa0ff) 35%, transparent);
      }
      #g73ti header h3{ margin:0; font-size:13px; letter-spacing:.4px; text-transform:uppercase; }
      #g73ti .sp{ flex:1 }
      #g73ti button{
        border:1px solid color-mix(in srgb, var(--app-primary, #5fa0ff) 35%, transparent);
        background: color-mix(in srgb, var(--app-primary, #5fa0ff) 12%, transparent);
        color: color-mix(in srgb, var(--app-primary, #5fa0ff) 86%, white);
        border-radius: 9px; padding:6px 10px; font-weight:700; cursor:pointer;
      }
      #g73ti button:hover{
        border-color: color-mix(in srgb, var(--app-accent, #b478ff) 45%, transparent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent, #b478ff) 20%, transparent);
      }
      #g73ti main{ padding:10px 12px; overflow:auto; max-height: calc(70vh - 48px); }
      #g73ti section{ margin-bottom:12px; }
      #g73ti h4{ margin:8px 0 6px; font-size:12px; opacity:.9; text-transform:uppercase; letter-spacing:.3px; }
      #g73ti .kv{ display:grid; grid-template-columns: 1fr auto; gap:6px 8px; align-items:center; }
      #g73ti .chip{
        display:inline-flex; align-items:center; gap:8px; padding:6px 8px; border-radius:10px;
        background: rgba(255,255,255,.04);
        border:1px solid color-mix(in srgb, var(--app-primary, #5fa0ff) 30%, transparent);
        white-space:nowrap;
      }
      #g73ti .sw{ width:16px; height:16px; border-radius:4px; display:inline-block;
        outline:1px solid rgba(255,255,255,.25); box-shadow: inset 0 0 0 1px rgba(0,0,0,.25);
      }
      #g73ti details{ border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:6px 8px; }
      #g73ti summary{ cursor:pointer; color: color-mix(in srgb, var(--app-accent, #b478ff) 90%, white); }
      #g73ti pre{
        margin:8px 0 0; padding:8px; border-radius:8px; background:#0b0d10; color:#e6edf3;
        max-height:200px; overflow:auto; border:1px solid rgba(255,255,255,.12);
      }
      #g73ti .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px; }
      #g73ti .small{ font-size:11px; opacity:.85 }
      #g73ti .row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      #g73ti .tag{ padding:2px 6px; border-radius:6px; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.04) }
      #g73ti .muted{ opacity:.7 }
      #g73ti .divider{ height:1px; background: rgba(255,255,255,.12); margin:8px 0 }
      #g73ti .ok{ color:#9be9a8 } .warn{ color:#ffd86b } .err{ color:#ff7b72 }
    </style>
    <div id="g73ti" role="dialog" aria-label="Theme Inspector" aria-modal="false">
      <header>
        <h3>Theme Inspector</h3>
        <div class="sp"></div>
        <button id="g73ti-rescan" title="Rescan">Rescan</button>
        <button id="g73ti-copy"   title="Copy log">Copy Log</button>
        <button id="g73ti-close"  title="Close">✕</button>
      </header>
      <main id="g73ti-main">
        <!-- filled by JS -->
      </main>
    </div>
  `;

  const $ = sel => container.querySelector(sel);
  const main = $('#g73ti-main');

  function getComputedVars(){
    const cs = getComputedStyle(document.documentElement);
    const out = {};
    for (const v of VARS_OF_INTEREST){
      const val = cs.getPropertyValue(v).trim();
      if (val) out[v] = val;
    }
    return out;
  }

  function safeParseJSON(str){
    try{ return JSON.parse(str); }catch{ return null; }
  }

  function collectColorsFrom(any, path=''){
    const hits = [];
    function push(val, pth){
      const found = String(val).match(HEX)?.concat(String(val).match(FUNC)||[], String(val).match(GRAD)||[], String(val).match(MAYBE)||[])?.filter(Boolean) || [];
      if (found.length) hits.push({ path: pth, value: val, colors: [...new Set(found.flat())] });
    }
    function walk(v, p){
      if (v==null) return;
      if (typeof v === 'string'){ push(v, p); return; }
      if (typeof v !== 'object') return;
      if (Array.isArray(v)){ v.forEach((x,i)=>walk(x, p+'['+i+']')); return; }
      for (const k of Object.keys(v)){ walk(v[k], p ? p+'.'+k : k); }
    }
    walk(any, path);
    return hits;
  }

  function scanStorageOne(store, label){
    const list = [];
    for (let i=0;i<store.length;i++){
      const key = store.key(i);
      let raw = null; try{ raw = store.getItem(key); }catch{}
      if (raw==null) continue;
      const json = safeParseJSON(raw);
      if (json){
        const hits = collectColorsFrom(json, key);
        if (hits.length) list.push({ key, type:'json', value: json, hits });
        else if (/(color|theme|accent|primary)/i.test(key)) list.push({ key, type:'json', value: json, hits: [] });
      }else{
        const hits = collectColorsFrom(raw, key);
        if (hits.length || /(color|theme|accent|primary)/i.test(key)) list.push({ key, type:'string', value: raw, hits });
      }
    }
    return { where: label, entries: list };
  }

  function scanStorage(){
    const out = [];
    try{ out.push(scanStorageOne(localStorage, 'localStorage')); }catch(e){ out.push({ where:'localStorage', error: String(e) }); }
    try{ out.push(scanStorageOne(sessionStorage, 'sessionStorage')); }catch(e){ out.push({ where:'sessionStorage', error: String(e) }); }
    return out;
  }

  function sheetLabel(ss){
    if (!ss) return 'unknown stylesheet';
    if (ss.ownerNode && ss.ownerNode.id) return `inline <style>#${ss.ownerNode.id}`;
    if (ss.ownerNode && ss.ownerNode.tagName === 'STYLE') return 'inline <style>';
    if (ss.href) return ss.href.split('/').slice(-1)[0] + ' (same-origin)';
    return 'stylesheet';
  }

  function tryRules(ss){
    try{ return ss.cssRules || []; }catch(e){ return null; } // cross-origin -> null
  }

  function scanCSSSources(){
    const sources = [];
    const want = new Set(VARS_OF_INTEREST);
    // Inline <style> blocks first (easy source-of-truth)
    const inlineStyles = Array.from(document.querySelectorAll('style')).map(el=>{
      const text = el.textContent || '';
      const matches = VARS_OF_INTEREST
        .map(v => ({ v, idx: text.indexOf(v) }))
        .filter(x => x.idx >= 0);
      if (!matches.length) return null;
      // Try to extract var:value pairs crudely
      const found = [];
      for (const {v} of matches){
        const re = new RegExp(v.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&') + '\\s*:\\s*([^;]+);');
        const m = text.match(re);
        if (m) found.push([v, m[1].trim()]);
      }
      return { type:'inline-style', id: el.id || null, found };
    }).filter(Boolean);

    // Stylesheets + CSS rules
    const ssList = Array.from(document.styleSheets);
    for (const ss of ssList){
      const rules = tryRules(ss);
      if (!rules) { // cross-origin
        sources.push({ sheet: sheetLabel(ss), crossed:true, note: 'Skipped (cross-origin)' });
        continue;
      }
      const file = sheetLabel(ss);
      const found = [];
      for (const rule of rules){
        if (!rule.style) continue;
        for (const v of want){
          const val = rule.style.getPropertyValue(v);
          if (val){ found.push({ var:v, value:val.trim(), selector: rule.selectorText || '@' + (rule.type||'') }); }
        }
      }
      if (found.length) sources.push({ sheet:file, crossed:false, vars:found });
    }

    // Merge inline at top
    for (const it of inlineStyles){
      sources.unshift({
        sheet: it.id ? `inline <style>#${it.id}` : 'inline <style>',
        crossed:false,
        vars: it.found.map(([v,val]) => ({ var:v, value:val, selector:':root (inline)' }))
      });
    }
    return sources;
  }

  function colorSwatch(styleValue){
    const c = (styleValue||'').split(',')[0].trim();
    const sw = `<span class="sw" style="background:${styleValue}"></span>`;
    return `${sw}<span class="mono">${styleValue}</span>`;
  }

  function h(v){ return (v||'').replace(/[&<>"']/g,s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }

  function render(){
    const computed = getComputedVars();
    const storage  = scanStorage();
    const cssSrc   = scanCSSSources();

    // --- UI
    const compRows = Object.keys(computed).length
      ? Object.entries(computed).map(([k,v])=>`
          <div class="kv">
            <div class="mono muted">${h(k)}</div>
            <div class="chip">${colorSwatch(v)}</div>
          </div>`).join('')
      : `<div class="small muted">No known CSS variables found on <code class="mono">:root</code>.</div>`;

    const storageBlocks = storage.map(bucket=>{
      if (bucket.error) return `
        <details open>
          <summary><strong>${h(bucket.where)}</strong> <span class="err">(error)</span></summary>
          <div class="small mono">${h(bucket.error)}</div>
        </details>`;
      if (!bucket.entries.length) return `
        <details>
          <summary><strong>${h(bucket.where)}</strong> <span class="muted">(no theme-like keys)</span></summary>
        </details>`;
      const entries = bucket.entries.map(e=>{
        const title = `<span class="mono">${h(e.key)}</span> <span class="tag">${e.type}</span>`;
        const hits  = e.hits && e.hits.length ? `
          <div class="small muted">color hits (${e.hits.length})</div>
          <ul class="small" style="margin:4px 0 0 16px;">
            ${e.hits.slice(0,8).map(hh=>`<li><span class="mono">${h(hh.path)}</span> → ${hh.colors.map(c=>`<span class="chip"><span class="sw" style="background:${h(c)}"></span><span class="mono">${h(c)}</span></span>`).join(' ')}</li>`).join('')}
            ${e.hits.length>8?`<li class="muted small">…and ${e.hits.length-8} more</li>`:''}
          </ul>` : '';
        const preview = typeof e.value === 'string'
          ? `<pre class="mono">${h(e.value.slice(0,1000))}${e.value.length>1000?'\\n…':''}</pre>`
          : `<pre class="mono">${h(JSON.stringify(e.value, null, 2).slice(0,2000))}${JSON.stringify(e.value).length>2000?'\\n…':''}</pre>`;
        return `<details><summary>${title}</summary>${hits}${preview}</details>`;
      }).join('');
      return `<details open><summary><strong>${h(bucket.where)}</strong> (${bucket.entries.length} key${bucket.entries.length!==1?'s':''})</summary>${entries}</details>`;
    }).join('');

    const cssBlocks = cssSrc.length
      ? cssSrc.map(s=>{
          if (s.crossed) return `<details><summary>${h(s.sheet)}</summary><div class="small muted">Skipped (cross-origin CSS).</div></details>`;
          const vars = (s.vars||[]).map(x=>`
            <div class="kv">
              <div class="mono">${h(x.var)} <span class="muted">in</span> <span class="small">${h(x.selector||'@rule')}</span></div>
              <div class="chip">${colorSwatch(x.value)}</div>
            </div>`).join('');
          return `<details><summary>${h(s.sheet)}</summary>${vars || '<div class="small muted">No relevant vars in this sheet.</div>'}</details>`;
        }).join('')
      : `<div class="small muted">No sources found for tracked CSS variables.</div>`;

    main.innerHTML = `
      <section>
        <h4>Computed tokens (:root)</h4>
        ${compRows}
      </section>
      <div class="divider"></div>
      <section>
        <h4>Storage (theme-like keys)</h4>
        ${storageBlocks}
      </section>
      <div class="divider"></div>
      <section>
        <h4>CSS Sources (where variables are set)</h4>
        ${cssBlocks}
      </section>
      <div class="divider"></div>
      <section class="small muted">
        Tip: Press <strong>Alt+Shift+T</strong> to toggle this panel. It auto-rescans on <code class="mono">theme:changed</code> &amp; <code class="mono">storage</code>.
      </section>
    `;

    // Save last log for copy button
    lastLog = buildLog({ computed, storage, cssSrc });
  }

  function buildLog({ computed, storage, cssSrc }){
    const lines = [];
    lines.push(`G73 Theme Inspector Log`);
    lines.push(`Time: ${new Date().toISOString()}`);
    lines.push(`URL: ${location.href}`);
    lines.push(`UA: ${navigator.userAgent}`);
    lines.push(``);
    lines.push(`== Computed CSS Variables (:root) ==`);
    if (Object.keys(computed).length){
      for (const [k,v] of Object.entries(computed)){ lines.push(`${k}: ${v}`); }
    }else{
      lines.push(`(none found)`);
    }
    lines.push(``);
    lines.push(`== Storage scan ==`);
    for (const bucket of storage){
      if (bucket.error){ lines.push(`[${bucket.where}] ERROR: ${bucket.error}`); continue; }
      lines.push(`[${bucket.where}] ${bucket.entries.length} key(s)`);
      for (const e of bucket.entries){
        lines.push(`- key: ${e.key} (${e.type})`);
        if (typeof e.value === 'string'){
          lines.push(`  value: ${e.value}`);
        }else{
          lines.push(`  json: ${JSON.stringify(e.value)}`);
        }
        if (e.hits && e.hits.length){
          lines.push(`  color hits:`);
          for (const h of e.hits.slice(0,25)){
            lines.push(`    • ${h.path}: ${h.colors.join(' | ')} (raw="${h.value}")`);
          }
          if (e.hits.length>25) lines.push(`    …and ${e.hits.length-25} more`);
        }
      }
    }
    lines.push(``);
    lines.push(`== CSS Sources ==`);
    for (const s of cssSrc){
      if (s.crossed){ lines.push(`sheet: ${s.sheet}  (skipped: cross-origin)`); continue; }
      lines.push(`sheet: ${s.sheet}`);
      for (const v of (s.vars||[])){
        lines.push(`  ${v.var}  @ ${v.selector}  = ${v.value}`);
      }
    }
    return lines.join('\n');
  }

  let lastLog = '(no data yet)';

  function copyLog(){
    navigator.clipboard?.writeText(lastLog).then(()=>{
      toast('Theme log copied ✓');
    }).catch(()=>{
      // fallback: show modal text
      const temp = document.createElement('textarea');
      temp.value = lastLog; document.body.appendChild(temp);
      temp.select(); document.execCommand('copy'); temp.remove();
      toast('Theme log copied ✓ (fallback)');
    });
  }

  let toastTimer = null;
  function toast(msg){
    let t = document.getElementById('g73ti-toast');
    if (!t){
      t = document.createElement('div');
      t.id = 'g73ti-toast';
      t.style.cssText = 'position:fixed;bottom:8px;right:16px;background:rgba(0,0,0,.75);color:#fff;padding:6px 10px;border-radius:8px;z-index:1000000;font:12px ui-sans-serif,system-ui;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ t.style.opacity = '0'; }, 1600);
  }

  // Buttons
  container.querySelector('#g73ti-rescan').addEventListener('click', render);
  container.querySelector('#g73ti-copy').addEventListener('click', copyLog);
  container.querySelector('#g73ti-close').addEventListener('click', ()=>{ container.hidden = true; });

  // Global API + hotkey
  window.ThemeInspector = {
    open(){ container.hidden = false; render(); },
    close(){ container.hidden = true; },
    rescan(){ render(); },
    getReport(){ return lastLog; }
  };
  window.addEventListener('keydown', (e)=>{
    if (e.altKey && e.shiftKey && e.code === 'KeyT'){
      e.preventDefault();
      container.hidden ? ThemeInspector.open() : ThemeInspector.close();
    }
  }, { passive:false });

  // Auto-rescan on theme or storage changes
  window.addEventListener('theme:changed', ()=>{ if (!container.hidden) render(); }, { passive:true });
  window.addEventListener('storage',       ()=>{ if (!container.hidden) render(); }, { passive:true });

  // Optional: open immediately the first time if you want
  // ThemeInspector.open();
})();
