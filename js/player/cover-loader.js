(function(){
  const stage = document.getElementById('g73ArtStage') || document.querySelector('.img-area.g73-art-stage');
  const img = stage?.querySelector('img');
  const bar = document.getElementById('g73LoaderProgressBar');
  if (!stage || !img || !bar) return;

  const circumference = 2 * Math.PI * 128;
  let progress = 0;
  let timer = null;
  let finishTimer = null;

  function setProgress(pct){
    progress = Math.max(0, Math.min(100, pct));
    const offset = circumference - (progress / 100) * circumference;
    bar.style.strokeDashoffset = String(offset);
  }

  function clearTimers(){
    if (timer) clearInterval(timer);
    if (finishTimer) clearTimeout(finishTimer);
    timer = null;
    finishTimer = null;
  }

  function beginLoading(){
    clearTimers();
    stage.classList.remove('is-loaded');
    stage.classList.remove('is-buffering');
    setProgress(0);
    timer = setInterval(()=>{
      if (progress >= 86){
        stage.classList.add('is-buffering');
        return;
      }
      setProgress(progress + (progress < 45 ? 2.2 : 0.9));
      if (progress >= 64) stage.classList.add('is-buffering');
    }, 120);
  }

  function finishLoading(){
    clearTimers();
    setProgress(100);
    finishTimer = setTimeout(()=>{
      stage.classList.add('is-loaded');
      stage.classList.remove('is-buffering');
    }, 220);
  }

  function currentSrc(){
    return (img.currentSrc || img.src || '').trim();
  }

  function handleError(){
    if (!/gjordan\.jpg$/i.test(currentSrc())) {
      img.src = 'gjordan.jpg';
      return;
    }
    finishLoading();
  }

  img.addEventListener('load', ()=>{
    if (!currentSrc()) return;
    finishLoading();
  });

  img.addEventListener('error', handleError);

  const srcObserver = new MutationObserver((mutations)=>{
    for (const m of mutations){
      if (m.type === 'attributes' && m.attributeName === 'src'){
        const src = currentSrc();
        if (!src) return;
        beginLoading();
        if (img.complete && img.naturalWidth > 0) finishLoading();
      }
    }
  });
  srcObserver.observe(img, { attributes:true, attributeFilter:['src'] });

  window.addEventListener('beforeunload', clearTimers, { passive:true });

  // start immediately on page visit, before player-core assigns the real cover
  stage.classList.add('is-loading');
  setProgress(0);
  beginLoading();

  // when the active track changes, restart even if src was already cached very fast
  window.addEventListener('player:track_change', ()=>{
    beginLoading();
    if (img.complete && img.naturalWidth > 0 && currentSrc()) finishLoading();
  });
})();
