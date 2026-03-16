// js/player/favorites-system.js
(function(){
  const STORAGE_KEY = 'g73:favorites:v1';
  const VIEW_KEY = 'g73:favorites:view:v1';
  const RECENT_KEY = 'g73:recent:v1';

  function normalizeId(id){
    return String(id || '').trim();
  }

  function list(){
    return Array.isArray(window.allMusic) ? window.allMusic : [];
  }

  function readIds(){
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeId).filter(Boolean);
    } catch {
      return [];
    }
  }

  function writeIds(ids){
    const clean = [...new Set((ids || []).map(normalizeId).filter(Boolean))];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch {}
    dispatchChanged(clean);
    return clean;
  }

  function getSet(){ return new Set(readIds()); }

  function readRecentIds(){
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeId).filter(Boolean);
    } catch { return []; }
  }

  function writeRecentIds(ids){
    const clean = [...new Set((ids || []).map(normalizeId).filter(Boolean))].slice(0, 24);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(clean)); } catch {}
    return clean;
  }

  function pushRecent(id){
    id = normalizeId(id);
    if (!id) return [];
    const next = [id, ...readRecentIds().filter(x => x !== id)].slice(0, 24);
    return writeRecentIds(next);
  }

  function getRecentSongs(){
    const ids = readRecentIds();
    const map = new Map(list().map(track => [normalizeId(track?.src || track?.id || ''), track]));
    return ids.map(id => map.get(id)).filter(Boolean);
  }

  function getIds(){ return readIds(); }
  function getCount(){ return getIds().length; }
  function isFavoriteId(id){ return !!normalizeId(id) && getSet().has(normalizeId(id)); }
  function isFavoriteTrack(track){ return isFavoriteId(track?.src || track?.id || ''); }
  function getFavoriteSongs(){
    const favs = getSet();
    return list().filter(track => favs.has(normalizeId(track?.src)));
  }

  function add(id){
    id = normalizeId(id);
    if (!id) return false;
    const ids = getIds();
    if (!ids.includes(id)) ids.push(id);
    writeIds(ids);
    return true;
  }

  function remove(id){
    id = normalizeId(id);
    const next = getIds().filter(x => x !== id);
    writeIds(next);
    return true;
  }

  function toggle(id){
    id = normalizeId(id);
    if (!id) return false;
    return isFavoriteId(id) ? (remove(id), false) : (add(id), true);
  }

  function getView(){
    try {
      const v = localStorage.getItem(VIEW_KEY);
      return ['favorites','recent','all'].includes(v) ? v : 'all';
    } catch {
      return 'all';
    }
  }

  function setView(view){
    const next = ['favorites','recent','all'].includes(view) ? view : 'all';
    try { localStorage.setItem(VIEW_KEY, next); } catch {}
    dispatchViewChanged(next);
    return next;
  }

  function dispatchChanged(ids){
    const detail = { ids: [...(ids || readIds())], count: (ids || readIds()).length };
    try { window.dispatchEvent(new CustomEvent('favorites:changed', { detail })); } catch {}
  }

  function dispatchViewChanged(view){
    try { window.dispatchEvent(new CustomEvent('favorites:viewchanged', { detail: { view } })); } catch {}
  }

  function createMainButton(){
    const host = document.getElementById('reaction-buttons');
    if (!host || document.getElementById('favorite-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'favorite-btn';
    btn.className = 'g73-themed-favorite-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Add current song to favorites');
    btn.setAttribute('title', 'Add current song to favorites');
    btn.innerHTML = '<i class="material-icons" aria-hidden="true">favorite_border</i>';
    btn.addEventListener('click', ()=>{
      const id = normalizeId(window.currentSongId || '');
      if (!id) return;
      const on = toggle(id);
      syncMainButton();
      showToast(on ? 'Added to favorites' : 'Removed from favorites');
    });

    const download = document.getElementById('download-btn');
    if (download && download.parentNode === host) host.insertBefore(btn, download);
    else host.appendChild(btn);
    syncMainButton();
  }

  function syncMainButton(){
    const btn = document.getElementById('favorite-btn');
    if (!btn) return;
    const id = normalizeId(window.currentSongId || '');
    const on = isFavoriteId(id);
    btn.classList.toggle('is-favorite', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('title', on ? 'Remove current song from favorites' : 'Add current song to favorites');
    btn.setAttribute('aria-label', on ? 'Remove current song from favorites' : 'Add current song to favorites');
    const icon = btn.querySelector('.material-icons');
    if (icon) icon.textContent = on ? 'favorite' : 'favorite_border';
  }

  function showToast(message){
    if (typeof window.showToast === 'function') {
      window.showToast(message);
      return;
    }
    const node = document.getElementById('toast');
    if (!node) return;
    node.textContent = message;
    node.style.display = 'block';
    clearTimeout(node.__favTimer);
    node.__favTimer = setTimeout(()=>{ node.style.display = 'none'; }, 2200);
  }

  function boot(){
    createMainButton();
    syncMainButton();
  }

  function markCurrentAsRecent(){
    const id = normalizeId(window.currentSongId || '');
    if (!id) return;
    pushRecent(id);
  }

  window.G73Favorites = {
    key: STORAGE_KEY,
    viewKey: VIEW_KEY,
    getIds,
    getCount,
    getFavoriteSongs,
    getRecentSongs,
    getView,
    setView,
    isFavoriteId,
    isFavoriteTrack,
    add,
    remove,
    toggle,
    syncMainButton,
    markCurrentAsRecent,
    dispatchChanged,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();

  window.addEventListener('player:track_change', (e)=>{ syncMainButton(); markCurrentAsRecent(); }, { passive:true });
  window.addEventListener('favorites:changed', syncMainButton, { passive:true });
  window.addEventListener('storage', (e)=>{
    if (e.key === STORAGE_KEY) dispatchChanged(readIds());
    if (e.key === VIEW_KEY) dispatchViewChanged(getView());
  }, { passive:true });
})();
