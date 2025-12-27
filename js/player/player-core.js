// js/player/player-core.js
(function(){
  // Prefer wrapper-scoped, but fall back to global if needed (prevents silent init aborts)
  const wrapper   = document.querySelector(".wrapper");
  const musicImg  = (wrapper?.querySelector(".img-area img")) || document.querySelector(".img-area img");
  const musicName = (wrapper?.querySelector(".song-details .name")) || document.querySelector(".song-details .name");
  const musicArt  = (wrapper?.querySelector(".song-details .artist")) || document.querySelector(".song-details .artist");
  const mainAudio = (wrapper?.querySelector("#main-audio")) || document.getElementById("main-audio");
  const listUl    = (wrapper?.querySelector(".music-list ul")) || document.querySelector(".music-list ul");

  // ---------- Analytics helpers ----------
  const ANALYTICS_EVENT_PREFIX = "audio"; // will produce events like audio_play, audio_pause, etc.

  function fireGA(eventName, params){
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }
  function emitPlayerEvent(name, detail){
    try { window.dispatchEvent(new CustomEvent(`player:${name}`, { detail })); } catch {}
  }
  function currentTrackMeta(){
    const LIST = resolvePlaylistNow();
    const it = LIST[(musicIndex||1) - 1] || {};
    return {
      id: it.src || '',
      name: it.name || '',
      artist: it.artist || '',
      img: imgPath(it.img),
      src: audioPath(it.src),
      index: musicIndex || 1,
      playlist_size: LIST.length || 0,
      item_id: it.src || '',
      item_name: it.name || '',
      item_brand: it.artist || '',
    };
  }

  // Engagement/milestones state
  const milestonePercents = [0.25, 0.5, 0.75];
  let milestonesHit = new Set();
  let engaged10s = false;

  function resetMilestones(){
    milestonesHit = new Set();
    engaged10s = false;
  }

  function logPlay(){  const meta=currentTrackMeta(); emitPlayerEvent('play', meta);  fireGA(`${ANALYTICS_EVENT_PREFIX}_play`, meta); }
  function logPause(){ const meta=currentTrackMeta(); emitPlayerEvent('pause', meta); fireGA(`${ANALYTICS_EVENT_PREFIX}_pause`, meta); }
  function logEnded(){ const meta=currentTrackMeta(); emitPlayerEvent('ended', meta); fireGA(`${ANALYTICS_EVENT_PREFIX}_ended`, meta); }
  function logTrackChange(){ const meta=currentTrackMeta(); emitPlayerEvent('track_change', meta); fireGA(`${ANALYTICS_EVENT_PREFIX}_track_change`, meta); }
  function logPrevNext(dir){ const meta=currentTrackMeta(); emitPlayerEvent(dir, meta); fireGA(`${ANALYTICS_EVENT_PREFIX}_${dir}`, meta); }
  function logMilestone(kind, value){
    const meta = currentTrackMeta();
    const payload = { ...meta, milestone_type: kind, milestone_value: value };
    emitPlayerEvent('milestone', payload);
    fireGA(`${ANALYTICS_EVENT_PREFIX}_milestone`, payload);
  }

  if (!mainAudio) {
    console.warn('[player-core] #main-audio NOT FOUND. Controls will be no-ops.');
  }

  function resolvePlaylistNow(){
    if (Array.isArray(window.allMusic)) return window.allMusic;
    const keys = ['musicList','playlist','tracks','songs','music'];
    for (const k of keys){
      const v = window[k];
      if (Array.isArray(v) && v.length && v[0] && typeof v[0] === 'object' && 'name' in v[0] && 'img' in v[0] && 'src' in v[0]){
        return v;
      }
    }
    return [];
  }

  let musicIndex = 1;
  window.musicIndex = musicIndex;
  let repeatMode = "repeat";
  window.currentSongId = "";

  // Path helpers
  const isUrl  = s => /^https?:\/\//i.test(s||"");
  const hasExt = s => /\.[a-z0-9]{2,5}$/i.test(s||"");
  const imgPath   = k => !k ? "" : (isUrl(k)||hasExt(k) ? k : `images/${k}.jpg`);
  const audioPath = k => !k ? "" : (isUrl(k)||hasExt(k) ? k : `songs/${k}.mp3`);

  function setMusicIndex(i){ musicIndex = i; window.musicIndex = i; }

  // ==========================================================
  // ✅ MEDIA SESSION (Android/iOS lockscreen + notification card)
  // ==========================================================
  const hasMediaSession = () => ("mediaSession" in navigator);
  const canSetMeta = () => hasMediaSession() && typeof window.MediaMetadata === "function";

  function toAbsUrl(u){
    try { return new URL(u, location.href).href; } catch { return u || ""; }
  }

  function mimeFromUrl(u){
    const s = (u || "").toLowerCase();
    if (s.endsWith(".png")) return "image/png";
    if (s.endsWith(".webp")) return "image/webp";
    if (s.endsWith(".avif")) return "image/avif";
    if (s.endsWith(".gif")) return "image/gif";
    // default for .jpg/.jpeg/unknown
    return "image/jpeg";
  }

  function msGetMeta(){
    const LIST = resolvePlaylistNow();
    const it = LIST[(musicIndex||1) - 1] || {};
    const title  = it.name || musicName?.textContent || "";
    const artist = it.artist || musicArt?.textContent || "G Jordan";
    const album  = "G Jordan • G73";
    const artRel = imgPath(it.img || "");
    const artAbs = toAbsUrl(artRel);
    const mime   = mimeFromUrl(artAbs);
    return { title, artist, album, artwork: artAbs, mime };
  }

  function msSetMetadata(){
    if (!canSetMeta()) return;
    const m = msGetMeta();
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title:  m.title,
        artist: m.artist,
        album:  m.album,
        artwork: m.artwork ? [
          { src: m.artwork, sizes: "96x96",   type: m.mime },
          { src: m.artwork, sizes: "128x128", type: m.mime },
          { src: m.artwork, sizes: "192x192", type: m.mime },
          { src: m.artwork, sizes: "256x256", type: m.mime },
          { src: m.artwork, sizes: "384x384", type: m.mime },
          { src: m.artwork, sizes: "512x512", type: m.mime },
        ] : []
      });
    } catch (e) {
      console.warn("[media-session] metadata error:", e);
    }
  }

  function msSetPlaybackState(){
    if (!hasMediaSession()) return;
    try {
      navigator.mediaSession.playbackState =
        (mainAudio && !mainAudio.paused) ? "playing" : "paused";
    } catch {}
  }

  function safeNum(n, fallback=0){
    return (typeof n === "number" && isFinite(n)) ? n : fallback;
  }

  function msSetPositionState(){
    if (!hasMediaSession() || !navigator.mediaSession.setPositionState || !mainAudio) return;
    try {
      const dur = safeNum(mainAudio.duration, 0);
      const pos = safeNum(mainAudio.currentTime, 0);
      const rate = safeNum(mainAudio.playbackRate, 1);
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: rate,
        position: Math.min(pos, dur || pos)
      });
    } catch {}
  }

  function msWireHandlers(){
    if (!hasMediaSession()) return;

    const safe = (fn) => () => { try { fn?.(); } catch {} };

    try {
      navigator.mediaSession.setActionHandler("play",  safe(() => playMusic()));
      navigator.mediaSession.setActionHandler("pause", safe(() => pauseMusic()));
      navigator.mediaSession.setActionHandler("previoustrack", safe(() => prevMusic()));
      navigator.mediaSession.setActionHandler("nexttrack",     safe(() => nextMusic()));

      navigator.mediaSession.setActionHandler("seekbackward", (d) => {
        if (!mainAudio) return;
        const off = (d && typeof d.seekOffset === "number") ? d.seekOffset : 10;
        mainAudio.currentTime = Math.max(0, mainAudio.currentTime - off);
        msSetPositionState();
      });

      navigator.mediaSession.setActionHandler("seekforward", (d) => {
        if (!mainAudio) return;
        const off = (d && typeof d.seekOffset === "number") ? d.seekOffset : 10;
        const dur = safeNum(mainAudio.duration, Infinity);
        mainAudio.currentTime = Math.min(dur, mainAudio.currentTime + off);
        msSetPositionState();
      });

      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (!mainAudio || !d || typeof d.seekTime !== "number") return;
        if (d.fastSeek && typeof mainAudio.fastSeek === "function") mainAudio.fastSeek(d.seekTime);
        else mainAudio.currentTime = d.seekTime;
        msSetPositionState();
      });
    } catch (e) {
      console.warn("[media-session] handler error:", e);
    }
  }

  function msRefreshAll(){
    msSetMetadata();
    msSetPlaybackState();
    msSetPositionState();
  }
  // ==========================================================

  function loadMusic(idx){
    const LIST = resolvePlaylistNow();
    const it = LIST[idx - 1];
    if (!it) return;

    if (musicName) musicName.textContent = it.name || '';
    if (musicArt)  musicArt.textContent  = it.artist || '';
    if (musicImg)  musicImg.src          = imgPath(it.img);

    if (mainAudio){
      const src = audioPath(it.src);
      if (src && !/index\.html$/i.test(src)) mainAudio.src = src;
    }

    window.currentSongId = it.src || '';
    window.__viewLogged = false;
    resetMilestones();
    window.subscribeToSongStats?.(window.currentSongId);

    logTrackChange();

    // ✅ Update lockscreen/control-card metadata when track changes
    msRefreshAll();
  }

  function playMusic(){
    if (!mainAudio) return;
    wrapper?.classList.add("paused");
    const pp = document.querySelector(".play-pause i");
    if (pp) pp.innerText = "pause";
    const p = mainAudio.play();
    if (p?.catch) p.catch(err => console.warn('[player-core] play() failed or blocked:', err));
    window.setupVisualizer?.();
    logPlay();

    // ✅ Tell OS we are playing + set metadata
    msRefreshAll();
  }

  function pauseMusic(){
    if (!mainAudio) return;
    wrapper?.classList.remove("paused");
    const pp = document.querySelector(".play-pause i");
    if (pp) pp.innerText = "play_arrow";
    mainAudio.pause();
    logPause();

    // ✅ Tell OS we paused
    msRefreshAll();
  }

  function prevMusic(){
    const len = resolvePlaylistNow().length || 1;
    setMusicIndex((musicIndex - 2 + len) % len + 1);
    loadMusic(musicIndex);
    playMusic();
    playingSong();
    logPrevNext('prev');
  }

  function nextMusic(){
    logPrevNext('next');
    handleSongEnd();
    playingSong();
  }

  function handleSongEnd(){
    const LIST = resolvePlaylistNow();
    const len = LIST.length || 1;
    if (!len) return;

    // ✅ log ended ONCE here (not twice)
    logEnded();

    if (repeatMode === "repeat_one" && mainAudio){
      mainAudio.currentTime = 0; playMusic(); return;
    }
    if (repeatMode === "shuffle"){
      let r; do { r = Math.floor(Math.random()*len)+1; } while (r === musicIndex);
      setMusicIndex(r);
    } else {
      setMusicIndex(musicIndex + 1);
      if (musicIndex > len) setMusicIndex(1);
    }
    loadMusic(musicIndex);
    playMusic();
  }

  // Build legacy list (kept) — ✅ FIXED metadata loading so last items don’t “break”
  (function buildList(){
    const LIST = resolvePlaylistNow();
    if (!LIST.length) {
      if (musicName) musicName.textContent = 'No playlist loaded';
      if (musicArt)  musicArt.textContent  = '';
      console.warn('[player-core] No tracks.');
      return;
    }
    if (!listUl) { console.warn('[player-core] .music-list ul not found.'); return; }

    listUl.innerHTML = '';

    for (let i=0;i<LIST.length;i++){
      const it = LIST[i];
      const li = document.createElement('li');
      li.setAttribute('li-index', i+1);
      li.style.setProperty('--i', String(i + 1));

      li.innerHTML = `
        <div class="row">
          <span>${it.name}</span>
          <p>${it.artist || ''}</p>
        </div>
        <span id="${it.src}" class="audio-duration">--:--</span>
        <audio class="${it.src}" preload="metadata" src="${audioPath(it.src)}"></audio>
      `;

      listUl.appendChild(li);

      const liAudio = li.querySelector(`audio.${CSS.escape(it.src)}`);
      const durEl   = li.querySelector(`#${CSS.escape(it.src)}`);

      if (liAudio && durEl){
        const onMeta = () => {
          const d  = liAudio.duration || 0;
          const mm = Math.floor(d/60);
          const ss = String(Math.floor(d%60)).padStart(2,'0');
          durEl.textContent = d ? `${mm}:${ss}` : '--:--';
          durEl.setAttribute('t-duration', durEl.textContent);
        };

        liAudio.addEventListener('loadedmetadata', onMeta, { once:true });

        liAudio.addEventListener('error', () => {
          durEl.textContent = '--:--';
          durEl.setAttribute('t-duration', '--:--');
        }, { once:true });

        try { liAudio.load(); } catch {}
      }
    }
  })();

  // Index helpers
  function normalizedOneBasedIndex(li){
    const liIdx = li.getAttribute('li-index');
    if (liIdx && !isNaN(liIdx)) return Math.max(1, parseInt(liIdx,10));
    const di = li.dataset.index;
    if (di && !isNaN(di)) return parseInt(di,10) + 1;
    const kids = Array.from(li.parentElement.children);
    const pos = kids.indexOf(li);
    return pos >= 0 ? pos+1 : 1;
  }

  function syncIndexToCurrent(){
    const LIST = resolvePlaylistNow();
    if (!LIST.length) return;
    let idx = -1;
    if (window.currentSongId){
      idx = LIST.findIndex(it => (it.src||'') === window.currentSongId);
    }
    if (idx < 0 && mainAudio){
      const cs = mainAudio.currentSrc || mainAudio.src || "";
      idx = LIST.findIndex(it => cs && cs.includes(it.src||""));
    }
    if (idx >= 0){
      musicIndex = idx + 1;
      window.musicIndex = musicIndex;
    }
  }

  function playingSong(){
    syncIndexToCurrent();
    document.querySelectorAll(".music-list ul").forEach(ul=>{
      ul.querySelectorAll('li').forEach(li=>{
        const isActive = normalizedOneBasedIndex(li) === musicIndex;
        li.classList.toggle('playing', isActive);
        li.classList.toggle('active',  isActive);

        const dur = li.querySelector('.audio-duration');
        const t = dur?.getAttribute('t-duration');
        if (!isActive && dur && t) dur.textContent = t;
      });
    });
  }

  function wireTimeUpdates(){
    if (!mainAudio) return;

    const progressArea     = document.querySelector(".progress-area");
    const progressBar      = progressArea?.querySelector(".progress-bar");
    const musicCurrentTime = document.querySelector(".current-time");
    const musicDuration    = document.querySelector(".max-duration");

    // ✅ Wire media session handlers once
    msWireHandlers();

    // Keep position in sync (throttled)
    let lastPosMs = 0;

    mainAudio.addEventListener('timeupdate', (e)=>{
      if (!window.__viewLogged && mainAudio.currentTime >= 10 && window.currentSongId){
        window.updateViewCount?.(window.currentSongId);
        window.__viewLogged = true;

        if (!engaged10s){
          engaged10s = true;
          logMilestone('time', 10);
          fireGA(`${ANALYTICS_EVENT_PREFIX}_engaged_10s`, currentTrackMeta());
        }
      }

      const cur = e.target.currentTime;
      const dur = e.target.duration || 1;
      if (progressBar) progressBar.style.width = `${(cur/dur)*100}%`;

      const totalDur = safeNum(mainAudio.duration, 0);
      const mm = Math.floor(totalDur/60);
      const ss = String(Math.floor(totalDur%60)).padStart(2,'0');
      if (musicDuration) musicDuration.textContent = `${mm}:${ss}`;

      const cm = Math.floor(cur/60);
      const cs = String(Math.floor(cur%60)).padStart(2,'0');
      if (musicCurrentTime) musicCurrentTime.textContent = `${cm}:${cs}`;

      const pct = (cur / (mainAudio.duration || 1));
      milestonePercents.forEach(p => {
        if (!milestonesHit.has(p) && pct >= p) {
          milestonesHit.add(p);
          logMilestone('percent', Math.round(p * 100));
        }
      });

      // ✅ update OS scrubber about ~1/sec
      const now = Date.now();
      if (now - lastPosMs > 800) {
        lastPosMs = now;
        msSetPositionState();
      }
    });

    mainAudio.addEventListener('ended', ()=>{
      window.__viewLogged = false;
      handleSongEnd();
    });

    mainAudio.addEventListener('loadedmetadata', ()=>{
      playingSong();
      msRefreshAll();
    });

    mainAudio.addEventListener('play',  ()=>{
      playingSong();
      msRefreshAll();
    });

    mainAudio.addEventListener('pause', ()=>{
      playingSong();
      msRefreshAll();
    });
  }

  function shouldIgnoreClick(t){
    return !!t.closest('.download-btn,.like-btn,.dislike-btn,.org-handle,.g73-play-ignore');
  }
  function toIndexFromLi(li){
    const a = li.getAttribute('li-index');
    if (a && !isNaN(a)) return Math.max(1, parseInt(a,10));
    const kids = Array.from(li.parentElement.children);
    const pos = kids.indexOf(li);
    return pos >= 0 ? pos+1 : 1;
  }
  function onListClick(e){
    const container = e.target.closest('.music-list');
    if (!container) return;
    const ul = container.querySelector('ul');
    if (ul && ul.classList.contains('g73-adapted')) return;

    const li = e.target.closest('li');
    if (!li || !container.contains(li)) return;
    if (shouldIgnoreClick(e.target)) return;

    const idx = toIndexFromLi(li);
    setMusicIndex(idx);
    loadMusic(musicIndex);
    playMusic();
    playingSong();
  }
  document.addEventListener('click', onListClick);

  if (listUl) {
    new MutationObserver(() => playingSong())
      .observe(listUl, { childList: true, subtree: false });
  }

  window.addEventListener('load', ()=>{
    const LIST = resolvePlaylistNow();
    if (LIST.length){
      setMusicIndex(Math.floor(Math.random()*LIST.length)+1);
      loadMusic(musicIndex);
      playingSong();
      wireTimeUpdates();
      msRefreshAll();
    } else {
      if (musicName) musicName.textContent = 'No playlist loaded';
      if (musicArt)  musicArt.textContent  = '';
      wireTimeUpdates();
      msRefreshAll();
    }
  });

  window.addEventListener('playlist:reordered', ()=>{
    playingSong();
    fireGA(`${ANALYTICS_EVENT_PREFIX}_playlist_reordered`, { playlist_size: resolvePlaylistNow().length });
    msRefreshAll();
  });

  window.loadMusic     = loadMusic;
  window.playMusic     = playMusic;
  window.pauseMusic    = pauseMusic;
  window.prevMusic     = prevMusic;
  window.nextMusic     = nextMusic;
  window.playingSong   = playingSong;
  window.setRepeatMode = (m)=>{ repeatMode = m; };
})();