
(function(){
  'use strict';

  let canvas=null, ctx2d=null, gl=null, rafId=0, analyser=null, audioCtx=null, sourceNode=null, dataArray=null;
  let shouldAnimate=false;
  let hueTick=0;
  let canvasReady=false;

  const defaults = {
    fftSize: 256,
    smoothing: 0.82,
    maxBars: 96,
    minBin: 0,
    maxBin: 0,
    logScale: false,
    noiseFloor: 0,
    mirror: false,
    mirrorInvert: false,
    rounded: true,
    barSpacing: 1,
    glow: 10,
    background: 'transparent',
    blendMode: 'source-over',
    globalAlpha: 1,
    animateHue: false,
    hueSpeed: 0.2,
    baseHue: 0,
    saturation: 100,
    lightness1: 45,
    lightness2: 70,
    fps: 60,
    visualDecay: 0.08,
    showCaps: false,
    capFall: 2,
    capHeight: 3,
    color1: '',
    color2: '',
    particleStrength: 0,
    useWebGL: true,
    mode: 'single'
  };

  const state = { settings: { ...defaults } };
  let prevBins=null;
  const isPreview = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname) || /spck|acode/i.test(navigator.userAgent);

  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));

  function hexToRgb(hex){
    const m=String(hex||'').trim().match(/^#?([\da-f]{6})$/i);
    if(!m) return null;
    const n=parseInt(m[1],16);
    return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
  }
  function hslToRgb(h,s,l){
    s/=100; l/=100; h=((h%360)+360)%360;
    const c=(1-Math.abs(2*l-1))*s; const x=c*(1-Math.abs((h/60)%2-1)); const m=l-c/2;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;} else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
    return {r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255)};
  }
  function resolveColors(){
    const s=state.settings;
    const c1=hexToRgb(s.color1); const c2=hexToRgb(s.color2);
    if(c1&&c2) return [c1,c2];
    const base=(s.baseHue+hueTick)%360;
    return [hslToRgb(base,s.saturation,s.lightness1), hslToRgb(base+60,s.saturation,s.lightness2)];
  }

  function ensureCanvas(){
    canvas = document.getElementById('audio-visualizer');
    if(!canvas) return false;
    if(typeof canvas.getContext !== 'function') return false;
    if(!ctx2d){
      try{ ctx2d = canvas.getContext('2d', { alpha:true, desynchronized:true }) || canvas.getContext('2d'); }catch{}
    }
    if(!ctx2d) return false;
    canvas.style.position='absolute';
    canvas.style.inset='0';
    canvas.style.width='100%';
    canvas.style.height='100%';
    canvas.style.pointerEvents='none';
    canvas.style.zIndex='0';
    resizeCanvas();
    canvasReady=true;
    return true;
  }

  function resizeCanvas(){
    if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1, Math.floor(rect.width*dpr));
    canvas.height=Math.max(1, Math.floor(rect.height*dpr));
    if(ctx2d) ctx2d.setTransform(dpr,0,0,dpr,0,0);
  }

  function ensureAnalyser(){
    const audio = document.getElementById('main-audio');
    if(!audio) return false;
    if(analyser) return true;
    if(window.visualizerAnalyser && typeof window.visualizerAnalyser.getByteFrequencyData==='function'){
      analyser = window.visualizerAnalyser; audioCtx = analyser.context; applyAnalyserSettings();
      return true;
    }
    try{
      audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      if(!audio._g73VizSource){ audio._g73VizSource = audioCtx.createMediaElementSource(audio); }
      sourceNode = audio._g73VizSource;
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      applyAnalyserSettings();
      window.visualizerAnalyser = analyser;
      window.__G73_ANALYSER = analyser;
      try{ window.dispatchEvent(new CustomEvent('g73:analyser-ready', {detail:{ analyser, ctx:audioCtx }})); }catch{}
      return true;
    }catch(err){
      console.warn('[viz] analyser init failed', err);
      return false;
    }
  }

  function applyAnalyserSettings(){
    if(!analyser) return;
    const s=state.settings;
    analyser.fftSize=clamp(Number(s.fftSize||256),32,32768);
    analyser.smoothingTimeConstant=clamp(Number(s.smoothing||0.82),0,0.99);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    prevBins = null;
  }

  function prepareBins(){
    if(!analyser || !dataArray) return [];
    const s=state.settings;
    analyser.getByteFrequencyData(dataArray);
    let start=Math.max(0, Math.floor(Number(s.minBin||0)));
    let end=Math.floor(Number(s.maxBin||0)) || dataArray.length;
    end=Math.min(end, dataArray.length);
    if(start>=end){ start=0; end=dataArray.length; }
    const bins = dataArray.slice(start, end);
    const count = Math.max(8, Math.floor(Number(s.maxBars||96)));
    const out = new Float32Array(count);
    const step = bins.length / count;
    for(let i=0;i<count;i++){
      const a=Math.floor(i*step), b=Math.max(a+1,Math.floor((i+1)*step));
      let sum=0,c=0;
      for(let j=a;j<b && j<bins.length;j++){ const v=Math.max(0, bins[j] - Number(s.noiseFloor||0)); sum+=v; c++; }
      out[i]=c?sum/c:0;
    }
    const decay=clamp(Number(s.visualDecay||0.08),0,0.95);
    if(!prevBins || prevBins.length!==out.length) prevBins = new Float32Array(out.length);
    for(let i=0;i<out.length;i++) prevBins[i]=Math.max(out[i], prevBins[i]*(1-decay));
    return prevBins;
  }

  function drawFrame(){
    if(!canvasReady && !ensureCanvas()) return;
    if(!ensureAnalyser()) return;
    const audio = document.getElementById('main-audio');
    if(audioCtx && audio && !audio.paused && audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
    const bins=prepareBins();
    if(!bins.length) return;
    const s=state.settings;
    const W = canvas.clientWidth || canvas.width;
    const H = canvas.clientHeight || canvas.height;
    ctx2d.clearRect(0,0,W,H);
    if(String(s.background||'').toLowerCase() !== 'transparent'){
      ctx2d.globalAlpha=0.18;
      ctx2d.fillStyle=s.background;
      ctx2d.fillRect(0,0,W,H);
    }
    ctx2d.globalAlpha=clamp(Number(s.opacity||1),0.05,1);
    ctx2d.globalCompositeOperation=s.blendMode || 'source-over';
    const [c1,c2]=resolveColors();
    hueTick = (hueTick + (s.animateHue ? Number(s.hueSpeed||0.2) : 0)) % 360;
    const mirrored = !!s.mirror;
    const totalBars = mirrored ? bins.length*2 : bins.length;
    const spacing = Math.max(0, Number(s.barSpacing||1));
    const available = W - spacing * (totalBars - 1);
    const barW = Math.max(1, available / totalBars);
    const totalW = barW * totalBars + spacing * (totalBars - 1);
    const baseX = Math.max(0, (W - totalW) / 2);

    function paint(index, x, invert){
      const v = clamp(bins[index]/255, 0, 1);
      const h = Math.max(1, v * H * 0.95);
      const y = (invert && s.mirrorInvert) ? 0 : (H - h);
      const grad = ctx2d.createLinearGradient(0, y+h, 0, y);
      grad.addColorStop(0, `rgba(${c1.r},${c1.g},${c1.b},0.92)`);
      grad.addColorStop(1, `rgba(${c2.r},${c2.g},${c2.b},0.98)`);
      ctx2d.fillStyle = grad;
      ctx2d.shadowColor = `rgba(${c2.r},${c2.g},${c2.b},0.65)`;
      ctx2d.shadowBlur = Math.max(0, Number(s.glow||0));
      if(s.rounded){
        const r=Math.min(barW/2, 8);
        ctx2d.beginPath();
        const w=barW, hh=h;
        ctx2d.moveTo(x+r,y);
        ctx2d.arcTo(x+w,y,x+w,y+hh,r);
        ctx2d.arcTo(x+w,y+hh,x,y+hh,r);
        ctx2d.arcTo(x,y+hh,x,y,r);
        ctx2d.arcTo(x,y,x+w,y,r);
        ctx2d.closePath();
        ctx2d.fill();
      }else{
        ctx2d.fillRect(x,y,barW,h);
      }
      if(s.showCaps){
        const capY = (invert && s.mirrorInvert) ? Math.min(H-Number(s.capHeight||3), h) : Math.max(0, y-Number(s.capHeight||3)-1);
        ctx2d.fillStyle = `rgba(${c2.r},${c2.g},${c2.b},0.95)`;
        ctx2d.fillRect(x, capY, barW, Number(s.capHeight||3));
      }
    }

    let x=baseX;
    for(let i=0;i<bins.length;i++){ paint(i,x,false); x += barW + spacing; }
    if(mirrored){
      for(let i=bins.length-1;i>=0;i--){ paint(i,x,true); x += barW + spacing; }
    }
    ctx2d.shadowBlur=0;
    ctx2d.globalCompositeOperation='source-over';
    ctx2d.globalAlpha=1;
  }

  function loop(ts){
    if(!shouldAnimate){ rafId=0; return; }
    rafId=requestAnimationFrame(loop);
    const cap = clamp(Number(state.settings.fps||60), 12, 120);
    if(!loop._last) loop._last=0;
    if(ts - loop._last < 1000/cap) return;
    loop._last=ts;
    drawFrame();
  }

  function syncRunState(force){
    const audio=document.getElementById('main-audio');
    const editorOpen=!!document.querySelector('#vz-editor-root.open, #vz-editor-root .vz-studio-overlay');
    const visible=!document.hidden;
    const playing=!!(audio && !audio.paused && !audio.ended && audio.currentSrc);
    const next=!!(visible && (force || playing || editorOpen));
    if(next===shouldAnimate) return;
    shouldAnimate=next;
    if(next) resume(); else pause();
  }

  function updateSettings(patch={}){ Object.assign(state.settings, patch); if('mode' in patch){ state.settings.mirror = patch.mode==='mirror' || patch.mode==='mirror-invert'; state.settings.mirrorInvert = patch.mode==='mirror-invert'; } if(analyser) applyAnalyserSettings(); }
  function applySceneExact(settings={}){ state.settings={...defaults, ...settings}; if(settings.mode){ state.settings.mirror = settings.mode==='mirror' || settings.mode==='mirror-invert'; state.settings.mirrorInvert = settings.mode==='mirror-invert'; } if(analyser) applyAnalyserSettings(); syncRunState(true); return getSettings(); }
  function getSettings(){ return { ...state.settings, mode: state.settings.mirror ? (state.settings.mirrorInvert ? 'mirror-invert' : 'mirror') : 'single' }; }
  function resetSettings(){ applySceneExact(defaults); }
  function pause(){ shouldAnimate=false; if(rafId){ cancelAnimationFrame(rafId); rafId=0; } }
  function resume(){ if(rafId) cancelAnimationFrame(rafId); shouldAnimate=true; rafId=requestAnimationFrame(loop); }
  function attachExternalAnalyser(an){ if(!an || typeof an.getByteFrequencyData!=='function') return; analyser=an; audioCtx=an.context; applyAnalyserSettings(); syncRunState(true); }

  window.setupVisualizer = function(){ ensureCanvas(); ensureAnalyser(); syncRunState(true); };
  window.visualizerAPI = { updateSettings, applySceneExact, getSettings, resetSettings, defaults, pause, resume, resetVisualState:()=>{prevBins=null;}, resetPerfGovernor:()=>{}, getAnalyser:()=>analyser, setAnalyser:attachExternalAnalyser, setAudioNode:attachExternalAnalyser };

  const boot = ()=>{
    ensureCanvas();
    const audio=document.getElementById('main-audio');
    if(audio){ ['play','pause','ended','loadedmetadata','canplay','emptied'].forEach(evt=>audio.addEventListener(evt, ()=>syncRunState(evt==='loadedmetadata'||evt==='canplay'), {passive:true})); }
    window.addEventListener('resize', resizeCanvas, {passive:true});
    document.addEventListener('visibilitychange', ()=>syncRunState(), {passive:true});
    window.addEventListener('g73:analyser-ready', (e)=>{ if(e.detail?.analyser) attachExternalAnalyser(e.detail.analyser); }, {passive:true});
    window.addEventListener('vz:editor-open', ()=>syncRunState(true), {passive:true});
    window.addEventListener('vz:editor-close', ()=>syncRunState(false), {passive:true});
    ['click','touchstart','keydown'].forEach(evt=>window.addEventListener(evt, ()=>{ if(audioCtx && audioCtx.state==='suspended') audioCtx.resume().catch(()=>{}); if(!analyser) ensureAnalyser(); }, {passive:true}));
    syncRunState(true);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
