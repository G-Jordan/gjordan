// /js/firebase/firebase-stats.js
// Requires firebase-init.js (window.db, window.auth)

import {
  doc, updateDoc, increment, onSnapshot, collection,
  getDoc, setDoc, serverTimestamp,
  query, where, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* ------------ helpers ------------ */
const $ = (id) => document.getElementById(id);
const setText = (id, t) => { const el = $(id); if (el) el.innerText = t; };
const setActive = (el, on) => { if (el) el.classList.toggle("active", !!on); };
const toast = (m) => (window.showToast ?? console.log).call(null, m);

/* ------------ subscription (per-song, managed singleton) ------------ */
let songStatsUnsubs = [];
let songStatsAuthUnsub = null;
let songStatsCurrentId = null;

function teardownSongStatsSubscription() {
  for (const unsub of songStatsUnsubs) {
    try { unsub?.(); } catch {}
  }
  songStatsUnsubs = [];

  try { songStatsAuthUnsub?.(); } catch {}
  songStatsAuthUnsub = null;
  songStatsCurrentId = null;
}

function subscribeToSongStats(songId) {
  const db = window.db;
  if (!db || !songId){
    teardownSongStatsSubscription();
    return () => {};
  }

  if (songStatsCurrentId === songId && (songStatsUnsubs.length || songStatsAuthUnsub)) {
    return teardownSongStatsSubscription;
  }

  teardownSongStatsSubscription();
  songStatsCurrentId = songId;

  // Live likes/dislikes from reactions (accurate)
  songStatsUnsubs.push(
    onSnapshot(collection(db, "songs", songId, "reactions"), (snap) => {
      let likes = 0, dislikes = 0;
      snap.forEach(d => {
        const r = d.data()?.reaction;
        if (r === "like") likes++;
        if (r === "dislike") dislikes++;
      });
      setText("stats-likes", `Likes ${likes}`);
      setText("stats-dislikes", `Dislikes ${dislikes}`);
    })
  );

  // Live plays/downloads from parent
  songStatsUnsubs.push(
    onSnapshot(doc(db, "songs", songId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() || {};
      setText("stats-plays", `Plays ${data.views ?? 0}`);
      setText("stats-downloads", `Downloads ${data.downloads ?? 0}`);
    })
  );

  // Reflect current user's selection on buttons
  const auth = window.auth;
  if (auth?.onAuthStateChanged) {
    songStatsAuthUnsub = auth.onAuthStateChanged(async (user) => {
      const likeBtn = $("like-btn");
      const dislikeBtn = $("dislike-btn");
      if (!user || user.isAnonymous) {
        setActive(likeBtn, false);
        setActive(dislikeBtn, false);
        return;
      }
      try {
        const myRef = doc(db, "songs", songId, "reactions", user.uid);
        const mySnap = await getDoc(myRef);
        const mine = mySnap.exists() ? mySnap.data()?.reaction : null;
        setActive(likeBtn, mine === "like");
        setActive(dislikeBtn, mine === "dislike");
      } catch (e) {
        console.warn("[stats] my reaction fetch failed:", e);
      }
    });
  }

  return teardownSongStatsSubscription;
}

/* ------------ recompute & write parent aggregates ------------ */
async function recomputeAndUpdateAggregates(songId){
  const db = window.db;
  const base = collection(db, "songs", songId, "reactions");

  // count likes/dislikes directly in subcollection
  const likesAgg = await getCountFromServer(query(base, where("reaction", "==", "like")));
  const dislikesAgg = await getCountFromServer(query(base, where("reaction", "==", "dislike")));
  const likes = likesAgg.data().count || 0;
  const dislikes = dislikesAgg.data().count || 0;

  // Attempt to write back to parent doc.
  try {
    await updateDoc(doc(db, "songs", songId), { likes, dislikes });
    console.log("[agg] updated parent counts:", { songId, likes, dislikes });
  } catch (e) {
    // If this fails, UI is still correct because the snapshot uses subcollection
    console.warn("[agg] parent update failed (rules likely blocked):", e);
  }
}

/* ------------ reaction write with toggle ------------ */
async function setReaction(songId, type /* 'like' | 'dislike' */){
  const db = window.db, auth = window.auth;
  if (!db || !auth) return;
  if (!songId) return;

  const user = auth.currentUser;
  if (!user || user.isAnonymous){
    window.showAuthModal?.();
    return;
  }

  const likeBtn = $("like-btn");
  const dislikeBtn = $("dislike-btn");

  // optimistic UI
  setActive(likeBtn, type === "like");
  setActive(dislikeBtn, type === "dislike");

  const myRef = doc(db, "songs", songId, "reactions", user.uid);

  try {
    const cur = await getDoc(myRef);
    const current = cur.exists() ? cur.data()?.reaction : null;

    if (current === type){
      console.log("[reactions] no-op (already", type, ")");
      return;
    }

    // Write my reaction
    await setDoc(myRef, { reaction: type, timestamp: serverTimestamp() }, { merge: false });
    console.log("[reactions] wrote", { songId, uid: user.uid, type });

    // Recompute totals and update parent
    await recomputeAndUpdateAggregates(songId);

  } catch (e) {
    console.error("[reactions] write failed:", e);
    // rollback optimistic UI on hard error
    setActive(likeBtn, false);
    setActive(dislikeBtn, false);
    toast("Couldn't save your reaction. Please try again.");
  }
}

/* ------------ public actions (per-song) ------------ */
async function likeSongFirebase(songId){ return setReaction(songId, "like"); }
async function dislikeSongFirebase(songId){ return setReaction(songId, "dislike"); }

function updateViewCount(songId){
  const db = window.db;
  if (!db || !songId) return;
  updateDoc(doc(db, "songs", songId), { views: increment(1) })
    .catch(e => {
      if (e?.code === 'permission-denied') console.warn('[views] permission denied; skipped view increment');
      else console.warn('[views] update failed:', e);
    });
}

async function downloadSong(){
  const db = window.db, auth = window.auth;
  if (!auth?.currentUser || auth.currentUser.isAnonymous){
    window.showAuthModal?.(); return;
  }
  const id = window.currentSongId;
  const list = window.allMusic || window.mymusic || [];
  const song = list.find(s => s.src === id);
  if (!song){ toast("Song not found."); return; }

  try { await updateDoc(doc(db, "songs", id), { downloads: increment(1) }); }
  catch(e){ console.warn("[downloads] update failed:", e); }

  toast(`Downloading "${song.name}"...`);
  setTimeout(() => {
    const a = document.createElement("a");
    a.href = `songs/${id}.mp3`;
    a.download = `${song.name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, 350);
}


function setCachedTotals(plays, downloads){ try { localStorage.setItem("g73_total_plays", String(plays)); localStorage.setItem("g73_total_downloads", String(downloads)); } catch {} }
function applyCachedTotals(){ try { const p=localStorage.getItem("g73_total_plays"); const d=localStorage.getItem("g73_total_downloads"); if ($("totalPlays") && p!=null) $("totalPlays").textContent = Number(p).toLocaleString(); if ($("totalDownloads") && d!=null) $("totalDownloads").textContent = Number(d).toLocaleString(); } catch {} }
async function waitForDb(timeoutMs=8000){ const start=Date.now(); while(Date.now()-start < timeoutMs){ if (window.db) return window.db; await new Promise(r=>setTimeout(r,150)); } return window.db; }

/* ------------ NEW: global footer totals (plays + downloads) ------------ */
/* Live sums across ALL /songs docs; writes to #totalPlays and #totalDownloads */
function subscribeToGlobalSongTotals() {
  const db = window.db;
  const elPlays = $("totalPlays");
  const elDls   = $("totalDownloads");
  if (!db || (!elPlays && !elDls)) return () => {};

  const songsCol = collection(db, "songs");
  return onSnapshot(
    songsCol,
    (snap) => {
      let plays = 0, dls = 0;
      snap.forEach(docSnap => {
        const d = docSnap.data() || {};
        plays += Number(d.views || 0);
        dls   += Number(d.downloads || 0);
      });
      if (elPlays) elPlays.textContent = plays.toLocaleString();
      if (elDls)   elDls.textContent   = dls.toLocaleString();
      setCachedTotals(plays, dls);
    },
    (err) => { console.warn('[footer totals] snapshot error:', err); applyCachedTotals(); if (elPlays && !elPlays.textContent.trim()) elPlays.textContent='0'; if (elDls && !elDls.textContent.trim()) elDls.textContent='0'; }
  );
}


// seed footer totals immediately so first-time visitors never see blanks
if ($("totalPlays") && !$("totalPlays").textContent.trim()) $("totalPlays").textContent = "0";
if ($("totalDownloads") && !$("totalDownloads").textContent.trim()) $("totalDownloads").textContent = "0";
/* Auto-start footer totals if the footer IDs are present */
async function bootFooterTotals() {
  if ($("totalPlays") || $("totalDownloads")) {
    applyCachedTotals();
    if (!window.db) await waitForDb();
    if (!window.__g73GlobalTotalsUnsub) {
      let retries = 4;
      while (retries-- > 0) {
        try {
          window.__g73GlobalTotalsUnsub = subscribeToGlobalSongTotals();
          break;
        } catch (e) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootFooterTotals);
} else {
  bootFooterTotals();
}
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) bootFooterTotals(); }, { passive:true });

window.addEventListener("beforeunload", teardownSongStatsSubscription);

/* ------------ expose ------------ */
window.subscribeToSongStats        = subscribeToSongStats;
window.unsubscribeSongStats        = teardownSongStatsSubscription;
window.likeSongFirebase            = likeSongFirebase;
window.dislikeSongFirebase         = dislikeSongFirebase;
window.updateViewCount             = updateViewCount;
window.downloadSong                = downloadSong;
window.subscribeToGlobalSongTotals = subscribeToGlobalSongTotals;
