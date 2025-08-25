// /js/firebase/video-stats.js
import {
  doc, collection, onSnapshot, getDoc, setDoc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const db   = window.db;
const auth = window.auth;

// DOM
const $ = (id) => document.getElementById(id);
const els = {
  likeBtn:    $('video-like-btn'),
  dislikeBtn: $('video-dislike-btn'),
  views:      $('video-stats-views'),
  likes:      $('video-stats-likes'),
  dislikes:   $('video-stats-dislikes'),
};
const setText = (el, t) => { if (el) el.textContent = t; };

// Subs management
let __videoUnsubs = [];
function clearVideoSubs(){ __videoUnsubs.forEach(u => { try{ u(); }catch{} }); __videoUnsubs = []; }

// View logging guard
let __viewLoggedFor = null;
let __viewTimer = null;

// Pending reaction if user clicks while not signed-in (or anonymous)
let __pendingReaction = null; // { videoId, type: 'like'|'dislike' }

function isRealUser(u){
  return !!u && !u.isAnonymous;
}

function armViewTimer(videoEl, videoId){
  clearTimeout(__viewTimer);
  __viewTimer = setTimeout(async ()=>{
    try {
      if (!videoEl || videoEl.paused) return;
      if (videoEl.currentTime < 8)   return; // watched enough
      if (__viewLoggedFor === videoId) return;
      await updateVideoViewCount(videoId);
      __viewLoggedFor = videoId;
    } catch (e) {
      console.warn('[video] view increment failed:', e);
    }
  }, 10000);
}

async function updateVideoViewCount(videoId){
  if (!videoId) return;
  const ref = doc(db, 'videos', videoId);
  try {
    await updateDoc(ref, { views: increment(1) });
  } catch (e) {
    // if doc missing and you're signed-in (non-anon), seed it
    if (e?.code === 'not-found' && isRealUser(auth?.currentUser)) {
      await setDoc(ref, { views: 1 }, { merge: true });
    } else {
      throw e;
    }
  }
}

async function setReaction(videoId, type /* 'like' | 'dislike' */){
  if (!videoId) return;

  const user = auth?.currentUser;
  if (!isRealUser(user)) {
    // ask to sign in; remember intent
    __pendingReaction = { videoId, type };
    window.showAuthModal?.();
    return;
  }

  const uid = user.uid;
  const rRef = doc(db, 'videos', videoId, 'reactions', uid);
  await setDoc(rRef, { reaction: type, timestamp: Date.now() }, { merge: true });
}

/* ---------- Public: subscribe for a given video id ---------- */
function subscribeToVideoStats(videoId){
  if (!videoId) return;
  clearVideoSubs();

  // Update global id for other parts of the player
  window.currentVideoId = videoId;

  // 1) views
  const vRef = doc(db, 'videos', videoId);
  const un1 = onSnapshot(vRef, (snap) => {
    const v = snap.data() || {};
    setText(els.views, `Views ${v.views || 0}`);
  });
  __videoUnsubs.push(un1);

  // 2) reactions (likes/dislikes + my toggle state)
  const rCol = collection(db, 'videos', videoId, 'reactions');
  const un2 = onSnapshot(rCol, (qSnap) => {
    let likes = 0, dislikes = 0, mine = null;
    qSnap.forEach(d => {
      const r = d.data()?.reaction;
      if (r === 'like') likes++;
      else if (r === 'dislike') dislikes++;
      if (auth?.currentUser && d.id === auth.currentUser.uid) mine = r;
    });
    setText(els.likes,    `Likes ${likes}`);
    setText(els.dislikes, `Dislikes ${dislikes}`);
    if (els.likeBtn)    els.likeBtn.setAttribute('aria-pressed',   mine === 'like' ? 'true' : 'false');
    if (els.dislikeBtn) els.dislikeBtn.setAttribute('aria-pressed', mine === 'dislike' ? 'true' : 'false');
  });
  __videoUnsubs.push(un2);

  // 3) wire the <video> element for view counting
  const videoEl = document.getElementById('video');
  if (videoEl){
    const onPlay  = () => { armViewTimer(videoEl, videoId); };
    const onSeek  = () => {};
    const onPause = () => {};
    const onEnd   = () => { __viewLoggedFor = null; clearTimeout(__viewTimer); };

    if (!videoEl.__hasVideoStatsListeners){
      videoEl.addEventListener('play',    onPlay);
      videoEl.addEventListener('seeking', onSeek);
      videoEl.addEventListener('pause',   onPause);
      videoEl.addEventListener('ended',   onEnd);
      videoEl.__hasVideoStatsListeners = true;
    }
  }
}

/* ---------- Button wiring (once) ---------- */
function wireReactionButtonsOnce(){
  if (els.likeBtn && !els.likeBtn.__wired){
    els.likeBtn.addEventListener('click', async ()=>{
      const id = window.currentVideoId;
      if (!id) return;
      await setReaction(id, 'like');
    });
    els.likeBtn.__wired = true;
  }
  if (els.dislikeBtn && !els.dislikeBtn.__wired){
    els.dislikeBtn.addEventListener('click', async ()=>{
      const id = window.currentVideoId;
      if (!id) return;
      await setReaction(id, 'dislike');
    });
    els.dislikeBtn.__wired = true;
  }
}
wireReactionButtonsOnce();

/* ---------- After login: apply pending reaction ---------- */
onAuthStateChanged(auth, (user) => {
  if (isRealUser(user) && __pendingReaction) {
    const { videoId, type } = __pendingReaction;
    __pendingReaction = null;
    // fire and forget (UI will update via onSnapshot)
    setReaction(videoId, type).catch(console.warn);
  }
});

/* ---------- Expose ---------- */
window.subscribeToVideoStats = subscribeToVideoStats;
window.updateVideoViewCount  = updateVideoViewCount;
window.likeVideoFirebase     = (id)=>setReaction(id,'like');
window.dislikeVideoFirebase  = (id)=>setReaction(id,'dislike');