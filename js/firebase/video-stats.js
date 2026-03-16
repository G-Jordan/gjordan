// /js/firebase/video-stats.js
import {
  doc, collection, onSnapshot, setDoc, increment
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const DEBUG = false;
const log  = (...a) => DEBUG && console.log("[video-stats]", ...a);
const warn = (...a) => console.warn("[video-stats]", ...a);

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
function clearVideoSubs(){
  __videoUnsubs.forEach(u => { try{ u(); }catch{} });
  __videoUnsubs = [];
}

// Pending reaction if user clicks while not signed-in (or anonymous)
let __pendingReaction = null; // { videoId, type: 'like'|'dislike' }

// Reactions: require non-anonymous user
function isRealUser(u){ return !!u && !u.isAnonymous; }

// Views: allow ANY authenticated user (anon or real)
function isAnyAuthedUser(u){ return !!u; }

// Open auth modal reliably
function openAuthModal(){
  const fn = window.showAuthModal || window.openAuthModal || window.toggleAuthModal;
  if (typeof fn === "function") fn();
  else warn("No auth modal opener found (showAuthModal/openAuthModal/toggleAuthModal).");
}

// Wait for window.db/window.auth
function waitForFirebase(maxMs = 6000, stepMs = 50){
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const db = window.db;
      const auth = window.auth;
      if (db && auth) return resolve({ db, auth });
      if (Date.now() - start >= maxMs) return resolve({ db, auth });
      setTimeout(tick, stepMs);
    };
    tick();
  });
}

// Ensure we are at least anonymously signed in (for view counting)
async function ensureAnonAuth(auth){
  if (!auth) return null;

  // already signed in (anon or real)
  if (auth.currentUser) return auth.currentUser;

  try{
    const cred = await signInAnonymously(auth);
    log("signed in anonymously:", cred?.user?.uid);
    return cred.user;
  }catch(e){
    warn("Anonymous sign-in failed. Enable Anonymous provider in Firebase Auth.", e?.code, e?.message, e);
    return null;
  }
}

// Views: increment doc no matter what (as long as authed, including anon)
async function updateVideoViewCount(videoId, db){
  if (!videoId || !db) return;
  const ref = doc(db, "videos", videoId);
  await setDoc(ref, { views: increment(1) }, { merge: true });
}

/* =========================
   View counting (reliable)
   ========================= */
// How many *seconds watched* qualifies as a view
const VIEW_SECONDS_REQUIRED = 10;

// Internal state per <video>
function resetWatchState(videoEl){
  videoEl.__g73_lastTickTs = 0;           // ms timestamp
  videoEl.__g73_watchSeconds = 0;         // accumulated watched seconds
  videoEl.__g73_viewLoggedFor = null;     // videoId we already counted
  videoEl.__g73_lastTime = 0;             // last currentTime seen
}

function markNewVideo(videoEl, videoId){
  // When switching videos, reset watch state, but keep listeners
  videoEl.__g73VideoId = videoId;
  videoEl.__g73_lastTickTs = 0;
  videoEl.__g73_watchSeconds = 0;
  videoEl.__g73_lastTime = 0;
  // allow counting again for this video
  if (videoEl.__g73_viewLoggedFor !== videoId) {
    // do not clear loggedFor if it matches, but normally it won't
  }
}

async function tryCountView(videoEl, db){
  const videoId = videoEl.__g73VideoId;
  if (!videoId) return;

  // already counted this video
  if (videoEl.__g73_viewLoggedFor === videoId) return;

  // must be actually playing
  if (videoEl.paused) return;

  // qualify rules:
  // 1) watched seconds >= 10 OR
  // 2) currentTime >= 8 (your old rule) AND at least 10 seconds since start
  const watched = videoEl.__g73_watchSeconds || 0;
  const ct = videoEl.currentTime || 0;

  if (watched < VIEW_SECONDS_REQUIRED && ct < 8) return;

  try{
    await updateVideoViewCount(videoId, db);
    videoEl.__g73_viewLoggedFor = videoId;
    log("view incremented:", videoId, "watched:", watched, "ct:", ct);
  }catch(e){
    // IMPORTANT: show reason (permission-denied vs offline, etc.)
    warn("view increment failed:", e?.code, e?.message, e);
  }
}

function tickWatch(videoEl, db){
  // Called frequently while playing; accumulates watch time
  if (!videoEl || videoEl.paused) return;

  const now = performance.now ? performance.now() : Date.now();
  const last = videoEl.__g73_lastTickTs || 0;

  // currentTime jump detection
  const ct = videoEl.currentTime || 0;
  const lastCt = videoEl.__g73_lastTime || 0;

  // If user scrubbed/jumped a lot, don't give "free" watch time
  const jumped = Math.abs(ct - lastCt) > 1.5;

  if (last && !jumped){
    const dt = (now - last) / 1000;
    // cap dt so background throttling doesn't add huge time
    const add = Math.min(1.0, Math.max(0, dt));
    videoEl.__g73_watchSeconds = (videoEl.__g73_watchSeconds || 0) + add;
  }

  videoEl.__g73_lastTickTs = now;
  videoEl.__g73_lastTime = ct;

  // Attempt count once it qualifies
  tryCountView(videoEl, db);
}

function wireVideoListenersOnce(videoEl, db){
  if (!videoEl || videoEl.__hasVideoStatsListeners) return;

  resetWatchState(videoEl);

  const onPlayOrPlaying = () => {
    // start ticking
    videoEl.__g73_lastTickTs = performance.now ? performance.now() : Date.now();
    // immediate try in case already far into video
    tryCountView(videoEl, db);
  };

  const onTimeUpdate = () => tickWatch(videoEl, db);

  const onPause = () => {
    // stop tick; next play resumes
    videoEl.__g73_lastTickTs = 0;
  };

  const onSeeking = () => {
    // scrubbing resets tick timestamp (prevents huge dt)
    videoEl.__g73_lastTickTs = 0;
    videoEl.__g73_lastTime = videoEl.currentTime || 0;
  };

  const onEnded = () => {
    // allow recount if replayed later
    videoEl.__g73_lastTickTs = 0;
    videoEl.__g73_watchSeconds = 0;
    videoEl.__g73_lastTime = 0;
    // do NOT clear viewLoggedFor here; keep it so it doesn't double-count same session
  };

  const onEmptiedOrSrcChange = () => {
    // source changed or unloaded
    videoEl.__g73_lastTickTs = 0;
    videoEl.__g73_watchSeconds = 0;
    videoEl.__g73_lastTime = 0;
    // allow counting new videoId when set by subscribe
  };

  videoEl.addEventListener("play", onPlayOrPlaying);
  videoEl.addEventListener("playing", onPlayOrPlaying);
  videoEl.addEventListener("timeupdate", onTimeUpdate);
  videoEl.addEventListener("pause", onPause);
  videoEl.addEventListener("seeking", onSeeking);
  videoEl.addEventListener("ended", onEnded);
  videoEl.addEventListener("emptied", onEmptiedOrSrcChange);
  videoEl.addEventListener("loadedmetadata", onEmptiedOrSrcChange);

  videoEl.__hasVideoStatsListeners = true;
}

/* =========================
   Reactions
   ========================= */
async function setReaction(videoId, type, db, auth){
  if (!videoId || !db || !auth) return;

  const user = auth.currentUser;
  if (!isRealUser(user)) {
    __pendingReaction = { videoId, type };
    openAuthModal();
    return;
  }

  const uid = user.uid;
  const rRef = doc(db, "videos", videoId, "reactions", uid);
  await setDoc(rRef, { reaction: type, timestamp: Date.now() }, { merge: true });
}

function subscribeToVideoStatsFactory(db, auth){
  return function subscribeToVideoStats(videoId){
    if (!videoId) return;
    clearVideoSubs();

    window.currentVideoId = videoId;

    // 1) views (live)
    const vRef = doc(db, "videos", videoId);
    const un1 = onSnapshot(vRef, (snap) => {
      const v = snap.exists() ? (snap.data() || {}) : {};
      setText(els.views, `Views ${v.views || 0}`);
    }, (err) => warn("views snapshot error:", err?.code, err?.message, err));
    __videoUnsubs.push(un1);

    // 2) reactions
    const rCol = collection(db, "videos", videoId, "reactions");
    const un2 = onSnapshot(rCol, (qSnap) => {
      let likes = 0, dislikes = 0, mine = null;
      qSnap.forEach(d => {
        const r = d.data()?.reaction;
        if (r === "like") likes++;
        else if (r === "dislike") dislikes++;
        if (auth?.currentUser && d.id === auth.currentUser.uid) mine = r;
      });
      setText(els.likes,    `Likes ${likes}`);
      setText(els.dislikes, `Dislikes ${dislikes}`);
      if (els.likeBtn)    els.likeBtn.setAttribute("aria-pressed",    mine === "like" ? "true" : "false");
      if (els.dislikeBtn) els.dislikeBtn.setAttribute("aria-pressed", mine === "dislike" ? "true" : "false");
    }, (err) => warn("reactions snapshot error:", err?.code, err?.message, err));
    __videoUnsubs.push(un2);

    // 3) wire <video> for view counting + set active id
    const videoEl = document.getElementById("video");
    if (videoEl){
      wireVideoListenersOnce(videoEl, db);
      markNewVideo(videoEl, videoId);

      // If already playing, start ticking immediately
      if (!videoEl.paused) {
        videoEl.__g73_lastTickTs = performance.now ? performance.now() : Date.now();
        tryCountView(videoEl, db);
      }
    }
  };
}

function wireReactionButtonsOnceFactory(db, auth){
  const likeBtn = els.likeBtn || $('video-like-btn');
  const dislikeBtn = els.dislikeBtn || $('video-dislike-btn');

  if (likeBtn && !likeBtn.__wired){
    likeBtn.addEventListener("click", async () => {
      const id = window.currentVideoId;
      if (!id) return;
      await setReaction(id, "like", db, auth);
    });
    likeBtn.__wired = true;
  }

  if (dislikeBtn && !dislikeBtn.__wired){
    dislikeBtn.addEventListener("click", async () => {
      const id = window.currentVideoId;
      if (!id) return;
      await setReaction(id, "dislike", db, auth);
    });
    dislikeBtn.__wired = true;
  }
}

(async function boot(){
  const { db, auth } = await waitForFirebase();

  if (!db || !auth){
    warn("Firebase not ready. Ensure firebase-init.js runs before video-stats.js.");
    return;
  }

  // ensure anonymous login so views can be written for everyone
  await ensureAnonAuth(auth);

  if (!isAnyAuthedUser(auth.currentUser)){
    warn("No auth user available; views cannot be written. Enable Anonymous Auth + rules allowing request.auth != null.");
  }

  const subscribeToVideoStats = subscribeToVideoStatsFactory(db, auth);

  // Expose
  window.subscribeToVideoStats = subscribeToVideoStats;
  window.updateVideoViewCount  = (id) => updateVideoViewCount(id, db);
  window.likeVideoFirebase     = (id) => setReaction(id, "like", db, auth);
  window.dislikeVideoFirebase  = (id) => setReaction(id, "dislike", db, auth);

  wireReactionButtonsOnceFactory(db, auth);

  onAuthStateChanged(auth, async (user) => {
    // if user signed out somehow, re-establish anon for view counting
    if (!user) await ensureAnonAuth(auth);

    if (isRealUser(auth.currentUser) && __pendingReaction) {
      const { videoId, type } = __pendingReaction;
      __pendingReaction = null;
      setReaction(videoId, type, db, auth).catch((e)=>warn("pending reaction failed:", e?.code, e?.message, e));
    }
  });

  if (window.currentVideoId) subscribeToVideoStats(window.currentVideoId);
})();