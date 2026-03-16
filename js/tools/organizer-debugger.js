// js/tools/organizer-debugger.js
(function(){
  // ----- styles -----
  var css = document.createElement('style');
  css.textContent =
  '#g73orgdbg{position:fixed;right:12px;bottom:12px;z-index:999999;font:12px/1.4 system-ui,Segoe UI,Roboto,Arial;color:#e8eef7;background:#0b0f14e6;border:1px solid #2a3442;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.55);width:360px;max-height:72vh;display:flex;flex-direction:column;overflow:hidden}'+
  '#g73orgdbg header{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:linear-gradient(180deg,#121825,#0e131c);border-bottom:1px solid #2a3442}'+
  '#g73orgdbg header b{font-size:13px}'+
  '#g73orgdbg .body{padding:8px 10px;overflow:auto;display:grid;gap:10px}'+
  '#g73orgdbg .row{display:grid;gap:6px}'+
  '#g73orgdbg .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;margin-left:6px}'+
  '.ok{background:#13361f;color:#a8f7bf;border:1px solid #2b6a3e}'+
  '.warn{background:#3a2a10;color:#ffd699;border:1px solid #6a4c1f}'+
  '.err{background:#3a1414;color:#ffb3b3;border:1px solid #6a2a2a}'+
  '#g73orgdbg pre{white-space:pre-wrap;background:#0f141c;border:1px solid #2a3442;border-radius:8px;padding:6px;margin:0;max-height:120px;overflow:auto}'+
  '#g73orgdbg .btn{border:1px solid #2a3442;background:#121a26;color:#e8eef7;border-radius:8px;padding:6px 8px;cursor:pointer}'+
  '#g73orgdbg .grid2{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}'+
  '#g73orgdbg .small{font-size:11px;color:#9bb0c0}'+
  '#g73orgdbg .hint{background:#0f141c;border:1px dashed #2a3442;border-radius:8px;padding:8px;color:#cfe1ff}';
  document.head.appendChild(css);

  // ----- panel -----
  var root = document.createElement('div');
  root.id = 'g73orgdbg';
  root.innerHTML =
    '<header>' +
      '<b>Organizer Debugger</b>' +
      '<div>' +
        '<button class="btn" id="g73org-retry">Re-scan</button> ' +
        '<button class="btn" id="g73org-close">Close</button>' +
      '</div>' +
    '</header>' +
    '<div class="body">' +
      '<div class="row">' +
        '<div class="grid2"><b>Playlist (window.allMusic)</b><span id="g73org-pl-pill" class="pill warn">checking…</span></div>' +
        '<pre id="g73org-pl"></pre>' +
      '</div>' +
      '<div class="row">' +
        '<div class="grid2"><b>.controls & Organizer button</b><span id="g73org-ui-pill" class="pill warn">checking…</span></div>' +
        '<pre id="g73org-ui"></pre>' +
      '</div>' +
      '<div class="row">' +
        '<div class="grid2"><b>Cover resolution (sample)</b><span id="g73org-img-pill" class="pill warn">checking…</span></div>' +
        '<pre id="g73org-img"></pre>' +
      '</div>' +
      '<div class="row">' +
        '<div class="grid2"><b>Organizer assets</b><span id="g73org-org-pill" class="pill warn">checking…</span></div>' +
        '<pre id="g73org-org"></pre>' +
      '</div>' +
      '<div class="row hint small" id="g73org-hints" hidden></div>' +
    '</div>';
  document.body.appendChild(root);

  document.getElementById('g73org-close').onclick = function(){ root.remove(); };
  document.getElementById('g73org-retry').onclick = run;

  function setPill(el, state, text){
    el.classList.remove('ok','warn','err');
    el.classList.add(state);
    el.textContent = text;
  }
  function tryJSON(v){ try { return JSON.stringify(v, null, 2); } catch(e){ return String(v); } }

  var COVER_BASES = ['', 'images/', 'image/', 'img/', 'imgs/', 'assets/', 'assets/img/', 'assets/images/'];
  var COVER_EXTS  = ['.jpg','.jpeg','.png','.webp','.avif','.gif','.svg'];

  function probeImageKey(key){
    return new Promise(function(resolve){
      if (!key) return resolve({ok:false, note:'no key'});
      var img = new Image();
      if (/^https?:\/\//i.test(key) || /\.[a-z0-9]{2,5}$/i.test(key)) {
        var direct = key + (key.indexOf('?')>-1 ? '&' : '?') + '_t=' + Date.now();
        img.onload = function(){ resolve({ok:true, url:direct}); };
        img.onerror = function(){ resolve({ok:false, note:'not found: '+direct}); };
        img.src = direct;
        return;
      }
      var i = 0, total = COVER_BASES.length * COVER_EXTS.length;
      img.onload = function(){ resolve({ok:true, url:img.src}); };
      img.onerror = tryNext;
      function tryNext(){
        if (i >= total) return resolve({ok:false, note:'no common path matched'});
        var base = COVER_BASES[Math.floor(i / COVER_EXTS.length)];
        var ext  = COVER_EXTS[i % COVER_EXTS.length];
        i++;
        img.src = base + key + ext + '?_t=' + Date.now();
      }
      tryNext();
    });
  }

  function run(){
    var hints = document.getElementById('g73org-hints');
    var hintsList = [];
    function addHint(t){ hintsList.push(t); }

    // Playlist
    var plPill = document.getElementById('g73org-pl-pill');
    var plOut  = document.getElementById('g73org-pl');
    var pl = window.allMusic;

    if (!Array.isArray(pl)) {
      setPill(plPill, 'err', 'not found on window');
      plOut.textContent = 'window.allMusic is not an array (undefined?).\n\nCommon causes:\n• js/music-list.js not loaded or 404\n• Defined in <script type="module"> (not global)\n• Syntax error stopped the file\n• Overwritten later by another script';
      addHint('Use plain <script src="js/music-list.js"></script> (NOT type="module") and set: window.allMusic = [ ... ].');
    } else {
      var sample = pl.slice(0, 5);
      setPill(plPill, 'ok', pl.length + ' items');
      plOut.textContent = tryJSON(sample) + (pl.length > 5 ? '\n… (+'+(pl.length-5)+' more)' : '');
      var missing = [];
      for (var i=0;i<sample.length;i++){
        var it = sample[i];
        if (!it || typeof it !== 'object') { missing.push('#'+i+' not object'); continue; }
        if (!('name' in it))   missing.push('#'+i+'.name');
        if (!('artist' in it)) missing.push('#'+i+'.artist');
        if (!('img' in it) && !('cover' in it) && !('src' in it)) missing.push('#'+i+'.img/cover/src');
      }
      if (missing.length){
        setPill(plPill, 'warn', pl.length + ' items (shape issues)');
        addHint('Some items missing keys. Organizer uses src/img/cover for ID & artwork.');
      }
    }

    // UI / Controls
    var uiPill = document.getElementById('g73org-ui-pill');
    var uiOut  = document.getElementById('g73org-ui');
    var controls = document.querySelector('.controls');
    var orgBtn   = document.getElementById('open-organizer');
    if (!controls){
      setPill(uiPill, 'err', '.controls not in DOM');
      uiOut.textContent = 'Could not find .controls element.\nEnsure organizer script runs after your player HTML or uses a DOM observer.';
      addHint('Include organizer-modal.js AFTER the HTML that contains .controls (end of <body>).');
    } else if (!orgBtn){
      setPill(uiPill, 'warn', 'controls found, button missing');
      uiOut.textContent = 'Found .controls but no #open-organizer.\nLikely injection timing or organizer not loaded.';
    } else {
      setPill(uiPill, 'ok', 'controls + button present');
      uiOut.textContent = 'Open Organizer button detected.';
    }

    // Organizer assets
    var orgPill = document.getElementById('g73org-org-pill');
    var orgOut  = document.getElementById('g73org-org');
    var modal   = document.getElementById('org-modal');
    var scripts = Array.prototype.map.call(document.scripts, function(s){ return s.src || '[inline]'; });
    var expected = 'js/player/organizer-modal.js';
    var foundOrganizerScript = scripts.some(function(s){ return s.indexOf(expected) > -1; }) ? expected :
                               (scripts.find ? scripts.find(function(s){ return /organizer/i.test(s); }) : null);
    if (modal){
      setPill(orgPill, 'ok', 'modal present');
      orgOut.textContent = 'Modal found (#org-modal).\nScript: ' + (foundOrganizerScript || '(inline or different name)');
    } else {
      setPill(orgPill, 'warn', 'modal missing');
      orgOut.textContent = 'No #org-modal in DOM.\nExpected script: '+expected;
      addHint('Add <script src="'+expected+'"></script> near </body>.');
    }

    // Cover checks (sample first 10)
    var imgPill = document.getElementById('g73org-img-pill');
    var imgOut  = document.getElementById('g73org-img');
    imgOut.textContent = '';
    if (Array.isArray(pl) && pl.length){
      var toCheck = pl.slice(0, 10);
      var ok = 0, fail = 0, idx = 0;
      function next(){
        if (idx >= toCheck.length){
          if (fail && ok) setPill(imgPill, 'warn', ok+' ok / '+fail+' fail (sample)');
          else if (fail && !ok) setPill(imgPill, 'err', 'no covers resolved');
          else setPill(imgPill, 'ok', 'covers resolvable (sample)');
          if (fail) addHint('Covers not resolving: confirm folder (images/img/assets) and extension (.jpg/.png/.webp).');
          showHints();
          return;
        }
        var it = toCheck[idx++];
        var key = (it && (it.cover || it.img || it.src)) || '';
        probeImageKey(key).then(function(res){
          if (res.ok){ ok++; imgOut.textContent += '• ' + (key || '(none)') + ' → ' + res.url + '\n'; }
          else { fail++; imgOut.textContent += '• ' + (key || '(none)') + ' ✖ ' + res.note + '\n'; }
          next();
        });
      }
      next();
    } else {
      setPill(imgPill, 'warn', 'no items to test');
      imgOut.textContent = 'Playlist empty or not detected.';
      showHints();
    }

    function showHints(){
      if (hintsList.length){
        hints.hidden = false;
        hints.innerHTML = '<b>Hints</b><br>' + hintsList.map(function(h){ return '• ' + h; }).join('<br>');
      } else {
        hints.hidden = true; hints.textContent = '';
      }
    }
  }

  setTimeout(run, 300);

  // Toggle with Ctrl/Cmd + Shift + D
  document.addEventListener('keydown', function(e){
    var key = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'd'){
      root.style.display = (root.style.display === 'none') ? '' : 'none';
    }
  });
})();