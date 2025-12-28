// js/player/organizer-adapter.js
(function(){
  const wrapper = document.querySelector('.wrapper');
  const ul = wrapper?.querySelector('.music-list ul');
  const audio = wrapper?.querySelector('#main-audio');
  const musicListRoot = wrapper?.querySelector('.music-list');
  if (!wrapper || !ul || !audio || !musicListRoot) return;

  // ---------- Helpers ----------
  function LIST(){ return Array.isArray(window.allMusic) ? window.allMusic : []; }
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const isAudioPlaying = ()=> !audio.paused && !audio.ended && audio.currentTime > 0;

  // Expose musicIndex but don't rely on it for toggling
  Object.defineProperty(window, 'musicIndex', {
    get(){ return window._g73_idx || 1; },
    set(v){ window._g73_idx = v; }
  });

  const imgPath = (key)=>{
    if (!key) return "";
    const isUrl  = /^https?:\/\//i.test(key);
    const hasExt = /\.[a-z0-9]{2,5}$/i.test(key);
    if (isUrl || hasExt) return key;
    return `images/${key}.jpg`;
  };
  const audioPath = (key)=>{
    if (!key) return "";
    const isUrl  = /^https?:\/\//i.test(key);
    const hasExt = /\.[a-z0-9]{2,5}$/i.test(key);
    if (isUrl || hasExt) return key;
    return `songs/${key}.mp3`;
  };
  const secondsToClock = (s=0)=> {
    const m = Math.floor(s/60);
    let r = Math.floor(s%60);
    if (r<10) r = '0'+r;
    return `${m}:${r}`;
  };

  // ✅ FIX: robust "same track" matcher (NO substring includes)
  function normFile(s){
    try{
      if (!s) return "";
      // If absolute URL, parse it; if relative, wrap with base
      const u = new URL(s, location.href);
      let p = u.pathname || "";
      p = p.split('/').pop() || "";
      p = decodeURIComponent(p);
      // strip query-ish just in case
      p = p.split('?')[0].split('#')[0];
      return p.toLowerCase();
    }catch{
      // fallback: just grab tail
      const t = String(s||"").split('?')[0].split('#')[0].split('/').pop() || "";
      return t.toLowerCase();
    }
  }

  function srcCandidatesFromItem(it){
    // try src as stored, and also what audioPath would produce
    const raw = it?.src || "";
    const cand = [];
    if (raw) cand.push(raw);
    const ap = audioPath(raw);
    if (ap && ap !== raw) cand.push(ap);
    return cand;
  }

  // --- true current index from audio.currentSrc ---
  function currentIndexBySrc(){
    const list = LIST();
    if (!list.length) return window._g73_idx || 1;

    const cur = normFile(audio.currentSrc || audio.src || "");
    if (!cur) return window._g73_idx || 1;

    // match by filename (exact)
    let idx0 = -1;
    for (let i = 0; i < list.length; i++){
      const it = list[i];
      const cands = srcCandidatesFromItem(it);
      for (const c of cands){
        const f = normFile(c);
        if (f && f === cur){
          idx0 = i;
          break;
        }
      }
      if (idx0 >= 0) break;
    }

    // fallback: if list item src has no extension in data, try without extension
    if (idx0 < 0){
      const curStem = cur.replace(/\.[a-z0-9]{2,5}$/i,'');
      for (let i = 0; i < list.length; i++){
        const it = list[i];
        const raw = normFile(it?.src || "");
        const stem = raw.replace(/\.[a-z0-9]{2,5}$/i,'');
        if (stem && stem === curStem){
          idx0 = i; break;
        }
      }
    }

    return idx0 >= 0 ? (idx0 + 1) : (window._g73_idx || 1);
  }

  function setCurrentIndex(i){
    window.musicIndex = i;
    try{ window.playingSong?.(); }catch{}
  }

  // ---------- THEME SYNC ----------
  function extractTwoStops(gradientStr){
    if (!gradientStr) return [];
    const m = gradientStr.match(/linear-gradient\([^,]+,([^,]+),([^,)]+)\)/i);
    if (!m) return [];
    return [m[1].trim(), m[2].trim()];
  }
  function applyListThemeFromControls(){
    const controls = document.querySelector('.controls[data-ctl-theme]');
    if (!controls) return;

    const cs = getComputedStyle(controls);
    const root = getComputedStyle(document.documentElement);

    const vars = {
      iconGrad:  cs.getPropertyValue('--ctl-icon-gradient')?.trim(),
      progFill:  cs.getPropertyValue('--prog-fill')?.trim(),
      ring:      cs.getPropertyValue('--ctl-ring')?.trim(),
      bg:        cs.getPropertyValue('--ctl-bg')?.trim(),
      border:    cs.getPropertyValue('--ctl-border')?.trim(),
      timer:     cs.getPropertyValue('--timer-color')?.trim()
    };

    const grad = vars.progFill || vars.iconGrad;
    const [stop1, stop2] = extractTwoStops(grad);

    const appPrimary = root.getPropertyValue('--app-primary')?.trim() || '#5fa0ff';
    const appAccent  = root.getPropertyValue('--app-accent')?.trim()  || '#b478ff';

    ul.style.setProperty('--ctl-list-fill', grad || `linear-gradient(90deg, ${appPrimary}, ${appAccent})`);
    ul.style.setProperty('--ctl-list-accent1', stop1 || appPrimary);
    ul.style.setProperty('--ctl-list-accent2', stop2 || appAccent);

    if (vars.ring)   ul.style.setProperty('--ctl-list-ring-raw', vars.ring);
    if (vars.bg)     ul.style.setProperty('--ctl-list-bg', vars.bg);
    if (vars.border) ul.style.setProperty('--ctl-list-border', vars.border);

    if (vars.timer) {
      ul.style.setProperty('--ctl-list-text', vars.timer);
      ul.style.setProperty('--ctl-list-subtext', vars.timer);
    }
  }
  applyListThemeFromControls();
  window.addEventListener('player:controls-theme', applyListThemeFromControls);

  // -------------------------------------------------------------------
  // ✅ FIX: Sequential duration probing (prevents mobile throttling)
  // -------------------------------------------------------------------
  const __durProbe = new Audio();
  __durProbe.preload = "metadata";

  function probeDurationOnce(src, timeoutMs = 6000){
    return new Promise((resolve) => {
      let done = false;

      const cleanup = () => {
        __durProbe.removeEventListener('loadedmetadata', onMeta);
        __durProbe.removeEventListener('error', onErr);
        try { __durProbe.src = ""; } catch {}
      };

      const finish = (val) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        cleanup();
        resolve(val);
      };

      const onMeta = () => finish(__durProbe.duration || 0);
      const onErr  = () => finish(0);

      __durProbe.addEventListener('loadedmetadata', onMeta);
      __durProbe.addEventListener('error', onErr);

      const t = setTimeout(() => finish(0), timeoutMs);

      __durProbe.src = src;
      try { __durProbe.load(); } catch {}
    });
  }

  async function fillDurationsSequentially(queue){
    for (const item of queue){
      const li = item.li;
      if (!li || !document.contains(li)) continue;

      const secs = await probeDurationOnce(item.src);
      const txt  = secondsToClock(secs);

      const d = li.querySelector('.audio-duration .g73-time');
      if (d) d.textContent = txt;
      li.querySelector('.audio-duration')?.setAttribute('t-duration', txt);
    }
  }

  // ---------- Build the list ----------
  function build(){
    const list = LIST();
    if (!list.length) return;

    ul.innerHTML = '';
    ul.classList.add('g73-adapted');

    const durQueue = [];

    list.forEach((it, idx)=>{
      const i = idx + 1;
      const li = document.createElement('li');
      li.setAttribute('li-index', String(i));
      li.innerHTML = `
        <div class="g73-thumb" style="background-image:url('${imgPath(it.img)}')"></div>
        <div class="g73-meta">
          <div class="g73-title"><span class="g73-title-text">${it.name||''}</span></div>
          <div class="g73-artist">${it.artist||''}</div>
          <div class="g73-row-progress" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Seek in ${it.name||'track'}">
            <div class="g73-row-bar"></div>
          </div>
        </div>
        <span class="audio-duration" t-duration="">
          <span class="g73-time">0:00</span>
        </span>
        <button class="g73-play g73-play-toggle" aria-label="Play ${it.name||'track'}"><i class="material-icons">play_arrow</i></button>
      `;
      ul.appendChild(li);

      durQueue.push({ li, src: audioPath(it.src) });

      measureMarquee(li);

      li.querySelector('.g73-play-toggle')?.addEventListener('click', (e)=>{
        e.stopPropagation();
        const cur = currentIndexBySrc();
        const playing = isAudioPlaying();

        if (cur === i){
          if (playing) window.pauseMusic?.();
          else window.playMusic?.();

          setIconForIndex(i, !playing);
          ensureVisualizerIn(li);
          li.classList.toggle('pre-playing', !playing);
          markActive(i, false);
          queueMicrotask(refreshIcons);
          setTimeout(refreshIcons, 120);
        } else {
          tryPlayIndex(i);
          markActive(i, true);
          ensureVisualizerIn(li);
          li.classList.add('pre-playing');
          setIconForIndex(i, true);
          setTimeout(refreshIcons, 120);
        }
        window.playingSong?.();
      });

      li.addEventListener('click', (e)=>{
        if (e.target.closest('.g73-play-toggle') || e.target.closest('.g73-row-progress')) return;
        tryPlayIndex(i);
        markActive(i, true);
        ensureVisualizerIn(li);
        li.classList.add('pre-playing');
        setIconForIndex(i, true);
        setTimeout(()=>measureMarquee(li), 0);
      });

      const prog = li.querySelector('.g73-row-progress');
      bindScrub(prog, i);
    });

    markActive(currentIndexBySrc(), true);
    refreshIcons();
    fillDurationsSequentially(durQueue);
  }

  function measureMarquee(li){
    const shell = li.querySelector('.g73-title');
    const inner = li.querySelector('.g73-title-text');
    if (!shell || !inner) return;
    shell.classList.remove('is-overflow');
    shell.style.removeProperty('--mq-distance');
    shell.style.removeProperty('--mq-duration');

    const dist = inner.scrollWidth - shell.clientWidth;
    if (dist > 6){
      shell.classList.add('is-overflow');
      shell.style.setProperty('--mq-distance', dist + 'px');
      const dur = Math.max(6, Math.min(24, Math.round((dist/90)*10)/10));
      shell.style.setProperty('--mq-duration', dur + 's');
    }
  }

  function setIconForIndex(i, playing){
    const li = ul.querySelector(`li[li-index="${i}"]`);
    li?.querySelector('.g73-play-toggle i')?.replaceChildren(document.createTextNode(playing?'pause':'play_arrow'));
  }

  function refreshIcons(){
    const cur = currentIndexBySrc();
    const playing = isAudioPlaying();
    ul.querySelectorAll('li').forEach(li=>{
      const i = parseInt(li.getAttribute('li-index'),10);
      li.querySelector('.g73-play-toggle i')?.replaceChildren(
        document.createTextNode((i===cur && playing)?'pause':'play_arrow')
      );
    });
  }

  function ensureVisualizerIn(li){
    const host = li.querySelector('.audio-duration');
    if (!host) return;
    let wave = host.querySelector('.playing-visualizer');
    if (!wave){
      wave = document.createElement('span');
      wave.className = 'wave playing-visualizer';
      wave.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
      const timeNode = host.querySelector('.g73-time');
      if (timeNode) host.insertBefore(wave, timeNode);
      else host.prepend(wave);
    }
  }
  function removeVisualizerFrom(li){ li.querySelector('.audio-duration .playing-visualizer')?.remove(); }

  function markActive(i, resetOthers){
    setCurrentIndex(i);
    ul.querySelectorAll('li').forEach(li=>{
      const idx = parseInt(li.getAttribute('li-index'),10);
      const isThis = idx === i;
      li.classList.toggle('active', isThis);
      li.classList.toggle('playing', isThis);
      if (isThis){
        ensureVisualizerIn(li);
      } else if (resetOthers){
        li.classList.remove('pre-playing','is-playing','is-paused');
        li.querySelector('.g73-row-bar')?.style.setProperty('width','0%');
        const timeNode = li.querySelector('.audio-duration .g73-time');
        const t = li.querySelector('.audio-duration')?.getAttribute('t-duration') || '0:00';
        if (timeNode) timeNode.textContent = t;
        removeVisualizerFrom(li);
      }
    });
  }

  function tryPlayIndex(i){
    window.loadMusic?.(i);
    setCurrentIndex(i);
    window.playMusic?.();
    setTimeout(refreshIcons, 120);
  }

  function updateRowProgress(){
    const i = currentIndexBySrc();
    const li = ul.querySelector(`li[li-index="${i}"]`);
    if (!li) return;

    const pct = (audio.currentTime && audio.duration) ? (audio.currentTime / audio.duration) * 100 : 0;
    li.querySelector('.g73-row-bar')?.style.setProperty('width', `${clamp(pct,0,100)}%`);

    const host = li.querySelector('.audio-duration');
    if (host){
      let timeNode = host.querySelector('.g73-time');
      if (!timeNode){
        timeNode = document.createElement('span');
        timeNode.className = 'g73-time';
        host.appendChild(timeNode);
      }
      timeNode.textContent = secondsToClock(audio.currentTime||0);
      ensureVisualizerIn(li);
    }

    li.querySelector('.g73-row-progress')?.setAttribute('aria-valuenow', String(Math.round(clamp(pct,0,100))));

    li.classList.remove('pre-playing');
    li.classList.toggle('is-playing', isAudioPlaying());
    li.classList.toggle('is-paused',  !isAudioPlaying());
  }

  function restoreDurationOn(i){
    const li = ul.querySelector(`li[li-index="${i}"]`); if (!li) return;
    li.classList.remove('pre-playing','is-playing','is-paused');
    li.querySelector('.g73-row-bar')?.style.setProperty('width','0%');
    const host = li.querySelector('.audio-duration');
    if (host){
      const t = host.getAttribute('t-duration') || '0:00';
      const timeNode = host.querySelector('.g73-time') || document.createElement('span');
      timeNode.className = 'g73-time';
      timeNode.textContent = t;
      if (!timeNode.parentNode) host.appendChild(timeNode);
    }
    removeVisualizerFrom(li);
  }

  function bootAudioWatchers(){
    const sync = ()=>{
      try{ window.playingSong?.(); }catch{}
      refreshIcons();
      updateRowProgress();
    };
    audio.addEventListener('timeupdate', sync, {passive:true});
    ['play','playing','pause','seeked','loadedmetadata'].forEach(ev=> audio.addEventListener(ev, sync, {passive:true}));
    audio.addEventListener('ended', ()=>{
      const prev = currentIndexBySrc();
      setTimeout(()=> restoreDurationOn(prev), 0);
    }, {passive:true});

    const mo = new MutationObserver(()=> {
      ul.querySelectorAll('li').forEach(li=>{
        const idx = parseInt(li.getAttribute('li-index'),10);
        if (idx !== currentIndexBySrc()) restoreDurationOn(idx);
      });
      markActive(currentIndexBySrc(), true);
      refreshIcons();
    });
    mo.observe(audio, {attributes:true, attributeFilter:['src']});

    requestAnimationFrame(()=>{ updateRowProgress(); refreshIcons(); markActive(currentIndexBySrc(), true); });
  }

  function bindScrub(prog, i){
    if (!prog) return;
    const bar = prog.querySelector('.g73-row-bar');

    const getPct = (clientX)=>{
      const rect = prog.getBoundingClientRect();
      return clamp((clientX - rect.left)/rect.width, 0, 1);
    };
    const seekToPct = (pct)=>{
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      audio.currentTime = pct * audio.duration;
    };

    let dragging = false;

    const start = (clientX)=>{
      const cur = currentIndexBySrc();
      if (cur !== i){ tryPlayIndex(i); markActive(i,true); }
      dragging = true;
      const pct = getPct(clientX);
      bar?.style.setProperty('width', `${pct*100}%`);
      seekToPct(pct);
    };
    const move = (clientX)=>{
      if (!dragging) return;
      const pct = getPct(clientX);
      bar?.style.setProperty('width', `${pct*100}%`);
      seekToPct(pct);
    };
    const end = ()=>{ dragging = false; };

    prog.addEventListener('mousedown', (e)=>{ e.preventDefault(); start(e.clientX); }, {passive:false});
    window.addEventListener('mousemove', (e)=>{ if (dragging){ e.preventDefault(); move(e.clientX); }}, {passive:false});
    window.addEventListener('mouseup',   ()=> end(), {passive:true});

    let touchId = null;
    prog.addEventListener('touchstart', (e)=>{
      const t = e.changedTouches[0]; touchId = t.identifier;
      e.preventDefault(); start(t.clientX);
    }, {passive:false});
    prog.addEventListener('touchmove', (e)=>{
      const t = [...e.changedTouches].find(t=>t.identifier===touchId) || e.changedTouches[0];
      if (!t) return; e.preventDefault(); move(t.clientX);
    }, {passive:false});
    prog.addEventListener('touchend', ()=>{ touchId=null; end(); }, {passive:true});
    prog.addEventListener('touchcancel', ()=>{ touchId=null; end(); }, {passive:true});

    prog.addEventListener('click', (e)=>{
      const cur = currentIndexBySrc();
      if (cur !== i){ tryPlayIndex(i); markActive(i,true); }
      const pct = getPct(e.clientX);
      bar?.style.setProperty('width', `${pct*100}%`);
      seekToPct(pct);
    }, {passive:true});
  }

  build();
  bootAudioWatchers();

  window.addEventListener('resize', ()=>{ ul.querySelectorAll('li').forEach(measureMarquee); }, {passive:true});
  window.addEventListener('playlist:reordered', ()=>{ build(); });
})();