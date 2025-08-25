// js/player/visualizer.js
(function () {
  let audioContext, analyser, source, dataArray, canvas, ctx, rafId;
  let hueTick = 0;
  let lastFrameTime = 0;
  let prevBins = null;
  let capPositions = null;
  let isEmbedded = false; // set at runtime

  const defaults = {
    fftSize: 256,
    smoothing: 0.8,
    maxBars: 0,
    minBin: 0,
    maxBin: 0,
    logScale: false,
    noiseFloor: 0,

    mirror: false,
    rounded: true,
    barSpacing: 1,

    glow: 0,
    background: "#000000",
    blendMode: "source-over",
    globalAlpha: 1.0,

    animateHue: true,
    hueSpeed: 0.3,
    baseHue: 0,
    saturation: 100,
    lightness1: 40,
    lightness2: 70,

    fps: 0,
    visualDecay: 0.0,
    showCaps: false,
    capFall: 2,
    capHeight: 3
  };

  const state = { settings: { ...defaults }, ready: false };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Performance governor
  const perf = {
    targetMs: 1000 / 60,
    badStreak: 0,
    goodStreak: 0,
    tier: 0,
    maxTier: 4,
    lastTs: 0,
    ema: null
  };

  const PERF_TIERS = [
    s => s,
    s => ({ ...s, fps: Math.max(30, s.fps || 0), glow: Math.min(s.glow, 10) }),
    s => ({ ...s, fps: Math.max(30, s.fps || 0), glow: Math.min(s.glow, 6), blendMode: (s.blendMode === "plus-lighter" || s.blendMode === "overlay") ? "lighter" : s.blendMode }),
    s => ({ ...s, fps: Math.max(24, s.fps || 0), glow: 0, barSpacing: Math.max(1, s.barSpacing), maxBars: s.maxBars ? Math.floor(s.maxBars * 0.75) : 0 }),
    s => ({ ...s, fps: 20, glow: 0, blendMode: "source-over", maxBars: s.maxBars ? Math.floor(s.maxBars * 0.6) : 0, visualDecay: Math.max(s.visualDecay, 0.12) })
  ];

  const userBaseline = () => ({ ...state.settings });
  let baselineSettings = null;

  function applyPerfTier(tier){
    if (!baselineSettings) baselineSettings = userBaseline();
    const transform = PERF_TIERS[Math.min(tier, PERF_TIERS.length - 1)];
    const next = transform({ ...baselineSettings, ...state.settings });
    const { fftSize, smoothing, ...safePatch } = next;
    updateSettings(safePatch);
  }

  function nudgeTowardBaseline(){
    if (!baselineSettings) return;
    const cur = state.settings;
    const target = baselineSettings;
    const lerp = (a,b,t)=>a+(b-a)*t;
    const next = { ...cur };
    ["fps","glow","maxBars","visualDecay"].forEach(k=>{
      if (typeof cur[k] === "number" && typeof target[k] === "number"){
        next[k] = Math.round(lerp(cur[k], target[k], 0.2));
      }
    });
    if (cur.blendMode !== target.blendMode) next.blendMode = target.blendMode;
    updateSettings(next);
  }

  // DPI-safe canvas sizing
  function resizeCanvas(){
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    if (isEmbedded) {
      const r = canvas.getBoundingClientRect();
      const cssW = Math.max(1, r.width);
      const cssH = Math.max(1, r.height);
      canvas.width  = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      canvas.width  = Math.floor(window.innerWidth  * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width  = "100vw";
      canvas.style.height = "100vh";
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function sliceBins(bins){
    const s = state.settings;
    let start = Math.max(0, Math.floor(s.minBin));
    let end = Math.floor(s.maxBin) || bins.length;
    end = Math.min(end, bins.length);
    if (start >= end) start = 0;
    return bins.slice(start, end);
  }

  function downsampleLinear(bins, count){
    if (!count || count >= bins.length) return Float32Array.from(bins);
    const out = new Float32Array(count);
    const step = bins.length / count;
    for (let i = 0; i < count; i++){
      const a = Math.floor(i * step), b = Math.floor((i + 1) * step);
      let sum = 0, c = 0;
      for (let j = a; j < b; j++){ sum += bins[j]; c++; }
      out[i] = c ? sum / c : 0;
    }
    return out;
  }

  function downsampleLog(bins, count){
    if (!count || count >= bins.length) return Float32Array.from(bins);
    const out = new Float32Array(count);
    const maxIdx = bins.length - 1;
    for (let i = 0; i < count; i++){
      const t0 = i / count, t1 = (i + 1) / count;
      const a = Math.floor(Math.exp(Math.log(maxIdx + 1) * t0) - 1);
      const b = Math.floor(Math.exp(Math.log(maxIdx + 1) * t1) - 1);
      const A = clamp(a, 0, maxIdx), B = clamp(b, A + 1, maxIdx + 1);
      let sum = 0, c = 0;
      for (let j = A; j < B; j++){ sum += bins[j]; c++; }
      out[i] = c ? sum / c : 0;
    }
    return out;
  }

  function prepareBins(){
    const s = state.settings;
    analyser.getByteFrequencyData(dataArray);
    for (let i = 0; i < dataArray.length; i++){
      const v = dataArray[i] - s.noiseFloor;
      dataArray[i] = v > 0 ? v : 0;
    }
    let bins = sliceBins(dataArray);
    let arr = s.logScale ? downsampleLog(bins, s.maxBars || 0) : downsampleLinear(bins, s.maxBars || 0);
    if (s.visualDecay > 0){
      if (!prevBins || prevBins.length !== arr.length) prevBins = new Float32Array(arr.length);
      for (let i = 0; i < arr.length; i++){
        prevBins[i] = Math.max(arr[i], prevBins[i] * (1 - s.visualDecay));
      }
      arr = prevBins;
    }
    return arr;
  }

  function ensureCaps(len){
    if (!capPositions || capPositions.length !== len){
      capPositions = new Float32Array(len);
      for (let i = 0; i < len; i++) capPositions[i] = 0;
    }
  }

  function drawFrame(){
    const s = state.settings;
    if (s.fps && s.fps > 0){
      const now = performance.now();
      const frameInterval = 1000 / s.fps;
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;
    }

    const bins = prepareBins();
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width  / dpr;
    const H = canvas.height / dpr;

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = s.background;
    ctx.fillRect(0, 0, W, H);

    const barCount = bins.length;
    if (barCount === 0) return;

    const spacing = Math.max(0, s.barSpacing);
    const totalBars = s.mirror ? barCount * 2 : barCount;
    const totalSpacing = spacing * (totalBars - 1);
    const barWidth = Math.max(1, (W - totalSpacing) / totalBars);
    const corner = s.rounded ? Math.min(barWidth / 2, 10) : 0;

    hueTick = (hueTick + (s.animateHue ? s.hueSpeed : 0)) % 360;
    ctx.globalCompositeOperation = s.blendMode;
    ctx.globalAlpha = clamp(s.globalAlpha, 0, 1);
    if (s.showCaps) ensureCaps(barCount);

    function drawBars(startX){
      let x = startX;
      for (let i = 0; i < barCount; i++){
        const v = clamp((bins[i] || 0) / 255, 0, 1);
        const barHeight = v * H;
        const hue = (s.baseHue + hueTick + i) % 360;
        const grad = ctx.createLinearGradient(x, H, x, H - barHeight);
        grad.addColorStop(0, `hsl(${hue}, ${s.saturation}%, ${s.lightness1}%)`);
        grad.addColorStop(1, `hsl(${(hue + 60) % 360}, ${s.saturation}%, ${s.lightness2}%)`);
        ctx.fillStyle = grad;

        if (s.glow > 0){
          ctx.shadowColor = `hsl(${hue}, ${s.saturation}%, ${(s.lightness1 + s.lightness2) / 2}%)`;
          ctx.shadowBlur = s.glow;
        } else ctx.shadowBlur = 0;

        if (corner){
          const r = Math.min(corner, barHeight);
          ctx.beginPath();
          ctx.moveTo(x, H);
          ctx.lineTo(x, H - barHeight + r);
          ctx.quadraticCurveTo(x, H - barHeight, x + r, H - barHeight);
          ctx.lineTo(x + barWidth - r, H - barHeight);
          ctx.quadraticCurveTo(x + barWidth, H - barHeight, x + barWidth, H - barHeight + r);
          ctx.lineTo(x + barWidth, H);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(x, H - barHeight, barWidth, barHeight);
        }

        if (s.showCaps){
          if (barHeight >= capPositions[i]) capPositions[i] = barHeight + 2;
          else capPositions[i] = Math.max(0, capPositions[i] - s.capFall);
          const cy = H - capPositions[i];
          ctx.shadowBlur = 0;
          ctx.fillStyle = `hsl(${(hue + 30) % 360}, ${s.saturation}%, ${Math.min(95, s.lightness2 + 20)}%)`;
          ctx.fillRect(x, cy, barWidth, Math.max(1, s.capHeight));
        }

        x += barWidth + spacing;
      }
      ctx.shadowBlur = 0;
    }

    if (s.mirror){
      const totalBarsWidth = (barWidth + spacing) * barCount - spacing;
      const leftStart = (W / 2) - (totalBarsWidth / 2);
      drawBars(leftStart);
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      drawBars(leftStart);
      ctx.restore();
    } else {
      drawBars(0);
    }
  }

  function loop(ts){
    rafId = requestAnimationFrame(loop);
    if (!analyser || !ctx) return;

    if (perf.lastTs === 0) perf.lastTs = ts || performance.now();
    const now = ts || performance.now();
    const dt = now - perf.lastTs;
    perf.lastTs = now;
    perf.ema = perf.ema == null ? dt : perf.ema * 0.9 + dt * 0.1;

    const userTarget = state.settings.fps && state.settings.fps > 0 ? 1000 / state.settings.fps : perf.targetMs;
    const target = Math.min(perf.targetMs, userTarget);

    if (perf.ema > target * 1.15) {
      perf.badStreak++;
      perf.goodStreak = 0;
      if (perf.badStreak >= 8 && perf.tier < perf.maxTier){
        perf.tier++;
        applyPerfTier(perf.tier);
        perf.badStreak = 0;
      }
    } else {
      perf.goodStreak++;
      perf.badStreak = 0;
      if (perf.goodStreak >= 120 && perf.tier > 0){
        perf.tier--;
        nudgeTowardBaseline();
        perf.goodStreak = 0;
      }
    }
    drawFrame();
  }

  function applyAnalyserSettings(){
    if (!analyser) return;
    const s = state.settings;
    analyser.fftSize = clamp(s.fftSize, 32, 32768);
    analyser.smoothingTimeConstant = clamp(s.smoothing, 0, 0.99);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    s.minBin = clamp(s.minBin, 0, dataArray.length - 1);
    if (s.maxBin !== 0) s.maxBin = clamp(s.maxBin, s.minBin + 1, dataArray.length);
    prevBins = null;
    capPositions = null;
  }

  // ---- NEW: helper to attach an externally provided analyser (from EQ) ----
  function attachExternalAnalyser(an){
    if (!an || typeof an.getByteFrequencyData !== "function") return;
    analyser = an;
    audioContext = an.context;
    applyAnalyserSettings();
    if (!ctx) {
      ctx = canvas.getContext("2d");
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
    }
    cancelAnimationFrame(rafId);
    requestAnimationFrame(loop);
  }
  // ------------------------------------------------------------------------

  function setupVisualizer(){
    const audio = document.getElementById("main-audio");
    canvas = document.getElementById("audio-visualizer");
    if (!audio || !canvas) return;

    // robust embedded detection
    isEmbedded =
      !!window.__VZ_EMBEDDED ||
      canvas.classList.contains("vz-embedded") ||
      !!canvas.closest(".wrapper") ||
      !!canvas.closest(".visualizer-wrap");

    if (isEmbedded) {
      // Ensure the canvas lives UNDER sibling UI inside the player wrapper
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "-1"; // behind siblings in the same stacking context
    } else {
      // Fullscreen background fallback
      canvas.style.position = "fixed";
      canvas.style.inset = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "0";
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    }

    // Prefer analyser provided by the EQ chain
    if (window.visualizerAnalyser && typeof window.visualizerAnalyser.getByteFrequencyData === "function") {
      attachExternalAnalyser(window.visualizerAnalyser);
    } else {
      // Fallback: self-wire ONLY if no EQ analyser exists
      if (!audioContext){
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();

        // IMPORTANT: guard against creating a 2nd MediaElementSource for the same <audio>
        if (!audio._mediaSourceNode) {
          audio._mediaSourceNode = audioContext.createMediaElementSource(audio);
        }
        source = audio._mediaSourceNode;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        applyAnalyserSettings();

        ctx = canvas.getContext("2d");
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const resume = () => { if (audioContext.state === "suspended") audioContext.resume().catch(()=>{}); };
        ["play","click","touchstart","keydown"].forEach(evt => window.addEventListener(evt, resume));
      }

      cancelAnimationFrame(rafId);
      requestAnimationFrame(loop);
    }

    // Listen for late EQ init (hot-swap analyser when EQ finishes wiring)
    window.addEventListener("viz:analyser-ready", (e)=>{
      if (e && e.detail && e.detail.analyser) attachExternalAnalyser(e.detail.analyser);
    }, { once:false });
  }

  function updateSettings(patch = {}){ Object.assign(state.settings, patch); if (analyser && ("fftSize" in patch || "smoothing" in patch)) applyAnalyserSettings(); }
  function getSettings(){ return { ...state.settings }; }
  function resetSettings(){ updateSettings({ ...defaults }); }
  function pause(){ cancelAnimationFrame(rafId); }
  function resume(){ cancelAnimationFrame(rafId); requestAnimationFrame(loop); }

  window.setupVisualizer = setupVisualizer;
  window.visualizerAPI = { updateSettings, getSettings, resetSettings, defaults, pause, resume };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupVisualizer);
  } else {
    setupVisualizer();
  }
})();