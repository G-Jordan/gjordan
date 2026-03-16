
(function(){
  // Keep the latest track meta if player-core.js is emitting it
  let lastMeta = null;
  window.addEventListener('player:track_change', e => { lastMeta = e.detail || lastMeta; });
  window.addEventListener('player:play',  e => { lastMeta = e.detail || lastMeta; });

  function filenameFromUrl(url){
    try { return new URL(url, location.origin).pathname.split('/').pop() || ''; }
    catch { return ''; }
  }

  function currentMetaFallback(){
    // Fallback if player-core.js didn't provide meta yet
    const list = Array.isArray(window.allMusic) ? window.allMusic : [];
    const id = window.currentSongId || '';
    const it = id ? (list.find(x => x?.src === id) || {}) : {};
    return {
      item_id: id,
      item_name: it.name || '',
      item_brand: it.artist || '',
      index: window.musicIndex || 0,
      playlist_size: list.length || 0,
      // best-guess URL for filename
      file_url: it.src || '',
      file_name: filenameFromUrl(it.src || '')
    };
  }

  function meta(){
    if (!lastMeta) return currentMetaFallback();
    return {
      item_id: lastMeta.item_id || lastMeta.id || window.currentSongId || '',
      item_name: lastMeta.item_name || lastMeta.name || '',
      item_brand: lastMeta.item_brand || lastMeta.artist || '',
      index: lastMeta.index || window.musicIndex || 0,
      playlist_size: lastMeta.playlist_size || (Array.isArray(window.allMusic) ? window.allMusic.length : 0),
      file_url: lastMeta.src || '',
      file_name: filenameFromUrl(lastMeta.src || '')
    };
  }

  function sendGA(eventName, extra){
    const payload = Object.assign({}, meta(), extra);
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
    // Also emit a CustomEvent for anything else to hook
    try { window.dispatchEvent(new CustomEvent('player:' + eventName, { detail: payload })); } catch {}
  }

  // ---- Wrap existing functions if present; else attach click listeners as fallback ----
  // LIKE
  const likeBtn = document.getElementById('like-btn');
  if (typeof window.likeSongFirebase === 'function') {
    const _like = window.likeSongFirebase;
    window.likeSongFirebase = async function(songId){
      sendGA('like_add', { song_id: songId || window.currentSongId || '' });
      return _like.apply(this, arguments);
    };
  } else if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      sendGA('like_add', { song_id: window.currentSongId || '' });
    }, { passive: true });
  }

  // DISLIKE
  const dislikeBtn = document.getElementById('dislike-btn');
  if (typeof window.dislikeSongFirebase === 'function') {
    const _dislike = window.dislikeSongFirebase;
    window.dislikeSongFirebase = async function(songId){
      sendGA('dislike_add', { song_id: songId || window.currentSongId || '' });
      return _dislike.apply(this, arguments);
    };
  } else if (dislikeBtn) {
    dislikeBtn.addEventListener('click', () => {
      sendGA('dislike_add', { song_id: window.currentSongId || '' });
    }, { passive: true });
  }

  // DOWNLOAD
  const downloadBtn = document.getElementById('download-btn');
  if (typeof window.downloadSong === 'function') {
    const _download = window.downloadSong;
    window.downloadSong = async function(){
      const m = meta();
      sendGA('file_download', { file_name: m.file_name, file_url: m.file_url || '' });
      return _download.apply(this, arguments);
    };
  } else if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const m = meta();
      sendGA('file_download', { file_name: m.file_name, file_url: m.file_url || '' });
    }, { passive: true });
  }
})();
