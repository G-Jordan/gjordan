
/* Simple/Pro toggle that layers on top of equalizer.js (no edits to your file) */
(function(){
  const modeBtn   = document.getElementById('eq-mode');
  const bandsWrap = document.getElementById('eq-bands');
  const preamp    = document.getElementById('eq-preamp');
  if (!modeBtn || !bandsWrap || !window.equalizerAPI) return;

  const STORE_KEY = 'eqMode.v1';

  // Group the 10 pro bands into 5 "simple" bands
  // Indices correspond to the freqs you used: [60,170,310,600,1000,3000,6000,12000,14000,16000]
  const GROUPS = [
    { name: 'Low',      idx: [0,1] },        // 60, 170
    { name: 'Low-Mid',  idx: [2,3] },        // 310, 600
    { name: 'Mid',      idx: [4,5] },        // 1k, 3k
    { name: 'High-Mid', idx: [6,7] },        // 6k, 12k
    { name: 'High',     idx: [8,9] },        // 14k, 16k
  ];

  // Build the 5 simple sliders once and keep them hidden when in Pro mode
  const simpleWrap = document.createElement('div');
  simpleWrap.className = 'eq-bands simple-bands';
  simpleWrap.style.display = 'none';

  const simpleSliders = []; // {input, out, group}
  GROUPS.forEach(group => {
    const wrap = document.createElement('div');
    wrap.className = 'eq-band';

    const label = document.createElement('label');
    label.textContent = group.name;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = -12;
    input.max =  12;
    input.step = 0.1;
    input.value = 0;

    const out = document.createElement('output');
    out.textContent = '0 dB';

    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      // Push simple value to all pro bands in this group
      group.idx.forEach(i => window.equalizerAPI.setBand(i, v));
      out.textContent = (v>0?'+':'') + v.toFixed(1) + ' dB';
      // Persist full EQ state (equalizerAPI already persists on setBand)
      persistMode(currentMode);
    });

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(out);
    simpleWrap.appendChild(wrap);

    simpleSliders.push({ input, out, group });
  });

  // Insert the simple block right before the pro 10-band block
  bandsWrap.parentNode.insertBefore(simpleWrap, bandsWrap);

  function avg(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }

  function syncSimpleFromPro(){
    // Read current pro values and set each simple slider to the average of its group
    const st = window.equalizerAPI.getSettings();
    if (!st || !Array.isArray(st.bands)) return;
    simpleSliders.forEach(({input, out, group})=>{
      const values = group.idx.map(i => st.bands[i] ?? 0);
      const v = avg(values);
      input.value = v;
      out.textContent = (v>0?'+':'') + v.toFixed(1) + ' dB';
    });
  }

  function syncProFromSimple(){
    // Push each simple slider value to its grouped pro bands
    simpleSliders.forEach(({input, group})=>{
      const v = parseFloat(input.value);
      group.idx.forEach(i => window.equalizerAPI.setBand(i, v));
    });
  }

  function applyMode(mode){
    // Visual toggle
    if (mode === 'simple'){
      simpleWrap.style.display = '';
      bandsWrap.style.display  = 'none';
      modeBtn.setAttribute('aria-pressed', 'true');
      modeBtn.title = 'Switch to Pro';
      // Initialize simple sliders from current pro values
      syncSimpleFromPro();
    }else{
      simpleWrap.style.display = 'none';
      bandsWrap.style.display  = '';
      modeBtn.setAttribute('aria-pressed', 'false');
      modeBtn.title = 'Switch to Simple';
      // When leaving simple, push simple values to pro so it "sticks"
      syncProFromSimple();
    }
  }

  function persistMode(mode){
    try{ localStorage.setItem(STORE_KEY, mode); }catch{}
  }
  function restoreMode(){
    try{
      const m = localStorage.getItem(STORE_KEY);
      return (m === 'simple' || m === 'pro') ? m : 'simple'; // default to simple UI
    }catch{ return 'simple'; }
  }

  let currentMode = restoreMode();
  applyMode(currentMode);

  modeBtn.addEventListener('click', ()=>{
    currentMode = (currentMode === 'simple') ? 'pro' : 'simple';
    applyMode(currentMode);
    persistMode(currentMode);
  });

  // If user changes preset or resets EQ in Pro while Simple is active later,
  // keep the simple UI in sync the next time it’s shown.
  // Hook some common events:
  document.getElementById('eq-preset')?.addEventListener('change', ()=>{
    if (currentMode === 'simple') syncSimpleFromPro();
  });
  document.getElementById('eq-reset')?.addEventListener('click', ()=>{
    setTimeout(()=>{ if (currentMode === 'simple') syncSimpleFromPro(); }, 0);
  });
  document.getElementById('eq-enable')?.addEventListener('change', ()=>{
    if (currentMode === 'simple') syncSimpleFromPro();
  });

  // Also re-sync when the modal opens (in case values changed while closed)
  (function watchModal(){
    const modal = document.getElementById('eq-modal');
    if (!modal) return;
    const mo = new MutationObserver(()=>{
      const open = modal.getAttribute('aria-hidden') === 'false';
      if (open && currentMode === 'simple') syncSimpleFromPro();
    });
    mo.observe(modal, { attributes:true, attributeFilter:['aria-hidden'] });
  })();
})();
