/* ======= CONFIG ======= */
const BASE_PATH='/videos/', MEDIA_REGEX=/\.mp4$/i, MANIFEST='manifest.json';
const THUMB_TIME=.1, THUMB_W_CAPTURE=320, THUMB_FORMAT='image/webp';
const MAX_CAPTURES=2;
const CACHE_VERSION='v1', CACHE_TTL_MS=7*24*60*60*1000;
const PLAYER_KEY='g73-player-prefs';
const THEME_KEY='g73-theme-settings';

/* ======= UTIL ======= */
function $(s){return document.querySelector(s)}
function filenameFromUrl(url){ try{return decodeURIComponent(new URL(url).pathname.split('/').pop()||url);}catch{return url;} }
const stripExt=n=>n.replace(/\.mp4$/i,'');
function toast(msg, ms=1500){ const box=$('#toastBox'); const t=document.createElement('div'); t.className='toast'; t.textContent=msg; box.appendChild(t); requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),180); }, ms); }
function setPressed(btn, val){ btn.setAttribute('aria-pressed', String(!!val)); }

/* Hex → rgba helper for secondary tints */
function hexToRGBA(hex, a){
  if(!hex) return 'rgba(139,107,27,'+a+')';
  hex = hex.replace('#','').trim();
  if(!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return 'rgba(139,107,27,'+a+')';
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}

/* ======= THEME ======= */
function applyTheme(theme){
  if(!theme) return; const root=document.documentElement.style; const list=$('#list');
  if(theme.bg) root.setProperty('--bg', theme.bg);
  if(theme.text) root.setProperty('--text', theme.text);
  if(theme.primary){ root.setProperty('--primary', theme.primary); root.setProperty('--accent', theme.primary); }
  if(theme.secondary){
    root.setProperty('--secondary', theme.secondary);
    root.setProperty('--secondary-5',  hexToRGBA(theme.secondary, 0.05));
    root.setProperty('--secondary-8',  hexToRGBA(theme.secondary, 0.08));
    root.setProperty('--secondary-12', hexToRGBA(theme.secondary, 0.12));
  }
  if(theme.glowStrength) root.setProperty('--glow-strength', theme.glowStrength);
  if(theme.glowAlpha) root.setProperty('--glow-alpha', theme.glowAlpha);
  if(theme.radius) root.setProperty('--radius', theme.radius+'px');
  if(theme.fontSize) root.setProperty('--base-font', theme.fontSize+'px');
  if(theme.layoutMode) list.setAttribute('layout', theme.layoutMode);
  if(theme.gridCols) document.documentElement.style.setProperty('--grid-cols', theme.gridCols);
  if(theme.thumbW) document.documentElement.style.setProperty('--thumb-w', theme.thumbW+'px');
}
function loadTheme(){ try{return JSON.parse(localStorage.getItem(THEME_KEY)||'{}');}catch{ return {}; } }
function saveTheme(t){ localStorage.setItem(THEME_KEY, JSON.stringify(t)); }
function resetTheme(){ localStorage.removeItem(THEME_KEY); sessionStorage.setItem('postToast','Settings have been reset'); location.reload(); }

(function initSettings(){
  const panel=$('#settings'); const btn=$('#settingsBtn'); const saveBtn=$('#saveTheme'); const resetBtn=$('#resetTheme'); const closeBtn=$('#closeSettings');
  const bg=$('#bgPicker'), text=$('#textPicker'), primary=$('#primaryPicker'), secondary=$('#secondaryPicker'),
        glowS=$('#glowStrength'), glowA=$('#glowAlpha'), radius=$('#radius'), fontSize=$('#fontSize'),
        layout=$('#layoutMode'), gridCols=$('#gridCols'), thumbW=$('#thumbW');

  const theme=loadTheme(); applyTheme(theme);
  const cs=getComputedStyle(document.documentElement); const getVar=(v,f)=> (cs.getPropertyValue(v)||f).trim();
  function rgbToHex(val){ val=val.trim(); if(val.startsWith('#')) return val; const m=val.match(/(\d+),\s*(\d+),\s*(\d+)/); if(!m) return '#000000'; const [r,g,b]=m.slice(1).map(n=>Math.max(0,Math.min(255,parseInt(n,10)))); return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''); }

  bg.value=theme.bg || rgbToHex(getVar('--bg','#0b0d10')); text.value=theme.text || rgbToHex(getVar('--text','#e8eef5'));
  primary.value=theme.primary || rgbToHex(getVar('--primary','#D4AF37')); secondary.value=theme.secondary || rgbToHex(getVar('--secondary','#8B6B1B'));
  glowS.value=theme.glowStrength || parseFloat(getVar('--glow-strength','1')) || 1; glowA.value=theme.glowAlpha || parseFloat(getVar('--glow-alpha','0.55')) || .55;
  radius.value=theme.radius || parseInt(getVar('--radius','12')) || 12; fontSize.value=theme.fontSize || parseInt(getVar('--base-font','14')) || 14;
  layout.value=theme.layoutMode || $('#list').getAttribute('layout') || 'list'; gridCols.value=theme.gridCols || parseInt(getVar('--grid-cols','2')) || 2; thumbW.value=theme.thumbW || parseInt(getVar('--thumb-w','64')) || 64;

  btn.onclick=()=>panel.classList.toggle('open'); closeBtn.onclick=()=>panel.classList.remove('open');
  const live=()=>applyTheme({
    bg:bg.value,text:text.value,primary:primary.value,secondary:secondary.value,
    glowStrength:String(glowS.value), glowAlpha:String(glowA.value),
    radius:String(radius.value),fontSize:String(fontSize.value),
    layoutMode:layout.value,gridCols:String(gridCols.value),thumbW:String(thumbW.value)
  });
  [bg,text,primary,secondary,glowS,glowA,radius,fontSize,layout,gridCols,thumbW].forEach(el=>el.addEventListener('input',live));
  saveBtn.onclick=()=>{ saveTheme({
    bg:bg.value,text:text.value,primary:primary.value,secondary:secondary.value,
    glowStrength:String(glowS.value), glowAlpha:String(glowA.value),
    radius:String(radius.value),fontSize:String(fontSize.value),
    layoutMode:layout.value,gridCols:String(gridCols.value),thumbW:String(thumbW.value)
  }); panel.classList.remove('open'); toast('Saved'); };
  resetBtn.onclick=resetTheme;

  const post=sessionStorage.getItem('postToast'); if(post){ sessionStorage.removeItem('postToast'); setTimeout(()=>toast(post), 300); }
})();

/* ======= THUMB CACHE ======= */
const memCache=new Map();
const cacheKey=url=>`vframe:${CACHE_VERSION}:${url}`;
function getFromStorage(url){ const k=cacheKey(url); try{ let raw=localStorage.getItem(k)||sessionStorage.getItem(k); if(!raw) return null; const obj=JSON.parse(raw);
  if(!obj||!obj.ts||!obj.data) return null; if(Date.now()-obj.ts> CACHE_TTL_MS){ localStorage.removeItem(k); sessionStorage.removeItem(k); return null; } return obj.data; }catch{return null;} }
function saveToStorage(url,data){ const k=cacheKey(url); const payload=JSON.stringify({ts:Date.now(),data}); try{localStorage.setItem(k,payload);}catch(e){ try{sessionStorage.setItem(k,payload);}catch(_){} } }
async function getCachedFrame(url){ if(memCache.has(url)) return memCache.get(url); const s=getFromStorage(url); if(s){memCache.set(url,s); return s;} return null; }
function putCachedFrame(url,data){ memCache.set(url,data); saveToStorage(url,data); }
$('#clearCacheBtn').onclick=()=>{ const pre=`vframe:${CACHE_VERSION}:`; for(let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if(key&&key.startsWith(pre)){ localStorage.removeItem(key); i--;}} memCache.clear(); toast('Cache cleared'); };

/* ======= DATA ======= */
async function fetchListing(){
  let res; try{ res=await fetch(BASE_PATH,{credentials:'same-origin'}); }catch{}
  if(res && res.ok && /text\/html/i.test(res.headers.get('content-type')||'')){
    const html=await res.text(); const doc=new DOMParser().parseFromString(html,'text/html');
    const items=[...doc.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(Boolean)
      .map(h=>{try{return new URL(h, location.origin+BASE_PATH);}catch{return null;}}).filter(Boolean)
      .filter(u=>u.pathname!==BASE_PATH && !u.pathname.endsWith('/'))
      .filter(u=>MEDIA_REGEX.test(decodeURIComponent(u.pathname.split('/').pop()||'')))
      .map(u=>u.href).sort((a,b)=>filenameFromUrl(a).localeCompare(filenameFromUrl(b), undefined, {sensitivity:'base'}));
    if(items.length) return items;
  }
  const mf=await fetch(BASE_PATH+MANIFEST,{credentials:'same-origin'}); if(!mf.ok) throw new Error('Add videos/manifest.json or enable listing');
  const names=await mf.json(); if(!Array.isArray(names)) throw new Error('manifest.json must be a JSON array of filenames');
  return names.filter(n=>MEDIA_REGEX.test(n)).map(n=>new URL(encodeURIComponent(n), location.origin+BASE_PATH).toString())
    .sort((a,b)=>filenameFromUrl(a).localeCompare(filenameFromUrl(b), undefined, {sensitivity:'base'}));
}

/* ======= FRAME CAPTURE ======= */
let activeCaptures=0; const captureQueue=[];
function scheduleCapture(fn){ return new Promise((resolve,reject)=>{ const run=async()=>{ activeCaptures++; try{resolve(await fn());}catch(e){reject(e);} finally{ activeCaptures--; if(captureQueue.length) captureQueue.shift()(); } };
  if(activeCaptures<MAX_CAPTURES) run(); else captureQueue.push(run); }); }
function captureFrame(url){ return new Promise((resolve,reject)=>{ const v=document.createElement('video'); v.preload='auto'; v.crossOrigin='anonymous'; v.muted=true; v.src=url;
  const cleanup=()=>{v.src=''; v.remove();}; v.addEventListener('error',()=>{cleanup(); reject(new Error('capture error'));},{once:true});
  v.addEventListener('loadedmetadata', async ()=>{ try{ const t=Math.min(Math.max(THUMB_TIME,.01),(v.duration||1)-.01);
    if(Math.abs((v.currentTime||0)-t)>.01){ v.currentTime=t; await new Promise(res=>v.addEventListener('seeked',res,{once:true})); }
    const ratio=(v.videoWidth||16)/(v.videoHeight||9), w=THUMB_W_CAPTURE, h=Math.max(1,Math.round(w/ratio));
    const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(v,0,0,w,h);
    const data=c.toDataURL(THUMB_FORMAT); cleanup(); resolve(data);
  }catch(e){cleanup(); reject(e);} },{once:true}); }); }
async function getOrCreateFrame(url){ const cached=await getCachedFrame(url); if(cached) return cached; const data=await scheduleCapture(()=>captureFrame(url)); putCachedFrame(url,data); return data; }

/* ======= RENDER & PLAY ======= */
let listObserver=null, files=[], currentIndex=-1;
async function eagerThumb(row){ const img=row.querySelector('.thumb'); if(!img || img.dataset.ready==='1') return; try{ img.src=await getOrCreateFrame(row.dataset.url); img.dataset.ready='1'; }catch{} }
function renderList(urls){
  const list=$('#list'); list.innerHTML='';
  if(!urls.length){ const div=document.createElement('div'); div.className='item'; div.textContent='No MP4 files found.'; list.appendChild(div); return; }
  if(listObserver) listObserver.disconnect();
  listObserver=new IntersectionObserver(entries=>{ entries.forEach(entry=>{ if(entry.isIntersecting) eagerThumb(entry.target); }); },{root:list, rootMargin:'100px'});
  urls.forEach((url,i)=>{
    const row=document.createElement('div'); row.className='item'; row.style.borderRadius='var(--radius)'; row.dataset.url=url; row.dataset.index=i;
    const img=document.createElement('img'); img.className='thumb'; img.alt=''; img.loading='lazy'; img.style.borderRadius='var(--radius)';
    const title=document.createElement('div'); title.className='title'; title.textContent=stripExt(filenameFromUrl(url));
    row.appendChild(img); row.appendChild(title); row.addEventListener('click',()=>startPlayback(i,row)); list.appendChild(row); listObserver.observe(row);
  });
  requestAnimationFrame(()=>{ [...list.querySelectorAll('.item')].slice(0,4).forEach(eagerThumb); });
}

/* ======= FULLSCREEN / PIP ======= */
(function setupFullscreen(){
  const shell=$('#videoShell'), video=$('#video');
  const fsBtn=$('#fsBtn'), fsExit=$('#fsExit');
  const pipBtn=$('#pipBtn');

  function isNativeFs(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function setFsActiveUI(active){
    shell.classList.toggle('fs-active', active);
    if(active){
      shell.classList.add('fs-sim'); document.body.classList.add('fs-lock');
      video.style.width='100%'; video.style.height='100%'; video.style.objectFit='contain';
    }else{
      shell.classList.remove('fs-sim'); document.body.classList.remove('fs-lock');
      video.style.width=''; video.style.height=''; video.style.objectFit='';
    }
  }
  function enterFs(){
    try{
      const req = (shell.requestFullscreen && shell.requestFullscreen()) ||
                  (shell.webkitRequestFullscreen && shell.webkitRequestFullscreen());
      if (req && typeof req.then==='function'){ req.catch(()=>{}); }
    }catch{}
    setFsActiveUI(true);
  }
  function exitFs(){
    if (isNativeFs()){
      (document.exitFullscreen||document.webkitExitFullscreen||(()=>{})).call(document);
    }
    setFsActiveUI(false);
  }
  function handleFsChange(){
    const active = isNativeFs() || shell.classList.contains('fs-sim');
    shell.classList.toggle('fs-active', active);
    if(!active){ setFsActiveUI(false); }
  }

  fsBtn.onclick = enterFs;
  fsExit.onclick = exitFs;
  document.addEventListener('fullscreenchange', handleFsChange);
  document.addEventListener('webkitfullscreenchange', handleFsChange);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ exitFs(); } });

  // PiP only on HTTPS + supported browser
  if ('pictureInPictureEnabled' in document && typeof video.requestPictureInPicture==='function' && location.protocol==='https:'){
    pipBtn.style.display='';
    pipBtn.onclick = async () => {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else { if(!video.src) return; await video.play().catch(()=>{}); await video.requestPictureInPicture(); }
      } catch {}
    };
  }
})();

/* ======= Shuffle/Loop & Share ======= */
const prefs = (()=>{ try{return JSON.parse(localStorage.getItem(PLAYER_KEY)||'{}');}catch{return {}; } })();
const shuffleBtn=$('#shuffleBtn'), loopBtn=$('#loopBtn');
setPressed(shuffleBtn, prefs.shuffle); setPressed(loopBtn, prefs.loop);
shuffleBtn.onclick=()=>{ prefs.shuffle=!prefs.shuffle; localStorage.setItem(PLAYER_KEY, JSON.stringify(prefs)); setPressed(shuffleBtn, prefs.shuffle); toast('Shuffle '+(prefs.shuffle?'On':'Off')); };
loopBtn.onclick=()=>{ prefs.loop=!prefs.loop; localStorage.setItem(PLAYER_KEY, JSON.stringify(prefs)); setPressed(loopBtn, prefs.loop); toast('Loop '+(prefs.loop?'On':'Off')); };

$('#shareBtn').onclick = async () => {
  if (currentIndex < 0 || !files.length) return toast('No video selected');
  const u = new URL(location.href); u.searchParams.set('file', filenameFromUrl(files[currentIndex]));
  try { await navigator.clipboard.writeText(u.toString()); toast('Link copied!'); }
  catch { toast('Unable to copy link'); }
};

/* ======= Selection & Playback ======= */
let suppressUrlUpdate=false;
async function selectOnly(index, rowEl){
  const url=files[index]; const video=$('#video'); const name=$('#currentName');
  document.querySelectorAll('#list .item').forEach(el=>el.classList.remove('active'));
  if(rowEl) rowEl.classList.add('active');
  currentIndex=index; video.src=url;

  try{ const p=await getOrCreateFrame(url); video.poster=p; }catch{ video.removeAttribute('poster'); }
  name.textContent=stripExt(filenameFromUrl(url));
  if(rowEl){ const img=rowEl.querySelector('.thumb'); if(img && !img.dataset.ready){ try{ img.src=await getOrCreateFrame(url); img.dataset.ready='1'; }catch{} } }

  if(!suppressUrlUpdate){ try{ const u=new URL(location.href); u.searchParams.set('file', filenameFromUrl(url)); history.replaceState(null,'', u);}catch{} }
}
async function startPlayback(index,rowEl){ suppressUrlUpdate=false; await selectOnly(index,rowEl); $('#video').play().catch(()=>{}); }

$('#video').addEventListener('ended', ()=>{
  if(currentIndex<0 || !files.length) return;
  if(prefs.loop){ startPlayback(currentIndex, document.querySelector(`#list .item[data-index="${currentIndex}"]`)); return; }
  const next = prefs.shuffle
    ? (()=>{ if(files.length<=1) return currentIndex; let n; do{ n=Math.floor(Math.random()*files.length);}while(n===currentIndex); return n; })()
    : (currentIndex+1)%files.length;
  const row=document.querySelector(`#list .item[data-index="${next}"]`); startPlayback(next,row);
});

/* ======= Init ======= */
(async function init(){
  try{
    files = await fetchListing();
    renderList(files);

    // theme toast after reset
    const post=sessionStorage.getItem('postToast'); if(post){ sessionStorage.removeItem('postToast'); setTimeout(()=>toast(post), 300); }

    // choose random initial, but don't autoplay/mute
    const params=new URL(location.href).searchParams;
    const query=params.get('file');
    let initialIndex=-1;
    if(query){ const match=files.find(u=>filenameFromUrl(u).toLowerCase()===query.toLowerCase()); if(match) initialIndex=files.indexOf(match); }
    if(initialIndex<0 && files.length) initialIndex=Math.floor(Math.random()*files.length);
    if(initialIndex>=0){
      const row=document.querySelector(`#list .item[data-index="${initialIndex}"]`);
      suppressUrlUpdate=!query; await selectOnly(initialIndex,row); suppressUrlUpdate=false; if(row) row.scrollIntoView({block:'nearest'});
    }
  }catch(err){
    $('#list').innerHTML='<div class="item">Error: '+(err?.message||err)+'</div>';
  }
})();