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

/* ------------ subscription (per-song) ------------ */
function subscribeToSongStats(songId) {
  const db = window.db;
  if (!db || !songId){ console.warn("[stats] subscribe: missing db/songId"); return; }

  // Live likes/dislikes from reactions (accurate)
  onSnapshot(collection(db, "songs", songId, "reactions"), (snap) => {
    let likes = 0, dislikes = 0;
    snap.forEach(d => {
      const r = d.data()?.reaction;
      if (r === "like") likes++;
      if (r === "dislike") dislikes++;
    });
    setText("stats-likes", `Likes ${likes}`);
    setText("stats-dislikes", `Dislikes ${dislikes}`);
  });

  // Live plays/downloads from parent
  onSnapshot(doc(db, "songs", songId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() || {};
    setText("stats-plays", `Plays ${data.views ?? 0}`);
    setText("stats-downloads", `Downloads ${data.downloads ?? 0}`);
  });

  // Reflect current user's selection on buttons
  const auth = window.auth;
  if (auth) {
    auth.onAuthStateChanged(async (user) => {
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
    .catch(e => console.warn("[views] update failed:", e));
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
    },
    (err) => console.warn("[footer totals] snapshot error:", err)
  );
}

/* Auto-start footer totals if the footer IDs are present */
function bootFooterTotals() {
  if ($("totalPlays") || $("totalDownloads")) {
    subscribeToGlobalSongTotals();
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootFooterTotals);
} else {
  bootFooterTotals();
}

/* ------------ expose ------------ */
window.subscribeToSongStats        = subscribeToSongStats;
window.likeSongFirebase            = likeSongFirebase;
window.dislikeSongFirebase         = dislikeSongFirebase;
window.updateViewCount             = updateViewCount;
window.downloadSong                = downloadSong;
window.subscribeToGlobalSongTotals = subscribeToGlobalSongTotals;