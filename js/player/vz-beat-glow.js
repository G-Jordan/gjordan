// js/player/vz-beat-glow.js (REAL analyser only)
(function () {
  const btn = document.getElementById("vz-open-editor");
  const audio = document.getElementById("main-audio");
  if (!btn || !audio) return;

  const setIdle = (v) => btn.classList.toggle("is-idle", !!v);
  setIdle(true);

  let raf = 0;
  let running = false;

  let lastBeatMs = 0;
  let avg = 0.10;
  let data = null;

  function getAnalyser() {
    // Prefer the exposed analyser (from visualizer.js), then any legacy/global
    return window.__G73_ANALYSER || window.visualizerAnalyser || null;
  }

  function resumeCtxFor(an) {
    // Resume the actual analyser context if available, else the global fallback
    const ctx = (an && an.context) || window.__G73_AUDIOCTX || null;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  function triggerBeat() {
    btn.classList.add("beat");
    clearTimeout(triggerBeat._t);

    // hold length: short enough for fast beats, long enough to read
    const hold = 120; // keep crisp; tweak to 110/130 if you want
    triggerBeat._t = setTimeout(() => btn.classList.remove("beat"), hold);
  }

  function loop() {
    const an = getAnalyser();
    if (!an) {
      raf = requestAnimationFrame(loop);
      return;
    }

    if (!data || data.length !== an.frequencyBinCount) {
      data = new Uint8Array(an.frequencyBinCount);
    }

    an.getByteFrequencyData(data);

    // Kick region energy (low bins). Works well across FFT sizes.
    let sum = 0;
    const start = 2;
    const end = Math.min(18, data.length - 1);
    for (let i = start; i <= end; i++) sum += data[i];

    const energy = (sum / (end - start + 1)) / 255; // 0..1

    // Adaptive baseline
    avg = (avg * 0.92) + (energy * 0.08);

    // Beat detection
    const now = performance.now();
    const threshold = avg * 1.65 + 0.02; // “feel” knob
    const cooldown = 120;                // slightly tighter than 140 for punch

    if (energy > threshold && (now - lastBeatMs) > cooldown) {
      lastBeatMs = now;
      triggerBeat();
    }

    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;

    setIdle(false);

    const an = getAnalyser();
    resumeCtxFor(an);

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    btn.classList.remove("beat");
    setIdle(true);
  }

  audio.addEventListener("play", start, { passive: true });
  audio.addEventListener("pause", stop, { passive: true });
  audio.addEventListener("ended", stop, { passive: true });

  // If analyser becomes available after play (EQ init, etc.)
  const onAnalyserReady = () => {
    if (!audio.paused) {
      // allow restart if we were paused waiting for analyser
      running = false;
      start();
    }
  };

  window.addEventListener("g73:analyser-ready", onAnalyserReady, { passive: true });
  window.addEventListener("viz:analyser-ready", onAnalyserReady, { passive: true }); // your EQ hot-swap event too

  if (!audio.paused) start();
})();