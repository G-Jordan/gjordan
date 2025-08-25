// /js/firebase/video-footer-totals.js
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

if (!window.__videoFooterTotalsInit) {
  window.__videoFooterTotalsInit = true;

  const db = window.db;
  const $ = (id) => document.getElementById(id);
  const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };

  let viewsUnsub = null;
  let videosUnsub = null;
  const parentTallies = Object.create(null);      // { [videoId]: {likes, dislikes} }
  const reactionsUnsubs = Object.create(null);    // { [videoId]: () => void }

  function recomputeTotals() {
    let likes = 0, dislikes = 0;
    for (const id in parentTallies) {
      likes    += parentTallies[id].likes    || 0;
      dislikes += parentTallies[id].dislikes || 0;
    }
    setText("footerVideoFans",   likes.toLocaleString());
    setText("footerVideoHaters", dislikes.toLocaleString());
  }

  // Sum views across /videos (unchanged)
  function watchTotalVideoViews() {
    viewsUnsub?.();
    viewsUnsub = onSnapshot(collection(db, "videos"), (snap) => {
      let total = 0;
      snap.forEach(d => total += Number(d.data()?.views || 0));
      setText("footerVideoTotalViews", total.toLocaleString());
    }, (err) => console.warn("[videoFooter] views watcher:", err));
  }

  // Watch ONLY /videos/*/reactions/*
  function watchVideoReactions() {
    videosUnsub?.();
    videosUnsub = onSnapshot(collection(db, "videos"), (snap) => {
      const current = new Set();

      // ensure a reactions listener per video
      snap.forEach(vDoc => {
        const vid = vDoc.id;
        current.add(vid);
        if (!reactionsUnsubs[vid]) {
          const col = collection(db, "videos", vid, "reactions");
          reactionsUnsubs[vid] = onSnapshot(col, (rs) => {
            let likes = 0, dislikes = 0;
            rs.forEach(rDoc => {
              const r = rDoc.data()?.reaction;
              if (r === "like") likes++;
              else if (r === "dislike") dislikes++;
            });
            parentTallies[vid] = { likes, dislikes };
            recomputeTotals();
          }, (err) => console.warn(`[videoFooter] videos/${vid}/reactions:`, err));
        }
      });

      // cleanup removed videos
      Object.keys(reactionsUnsubs).forEach(vid => {
        if (!current.has(vid)) {
          try { reactionsUnsubs[vid](); } catch {}
          delete reactionsUnsubs[vid];
          delete parentTallies[vid];
        }
      });

      recomputeTotals();
    }, (err) => console.warn("[videoFooter] videos watcher:", err));
  }

  function start() {
    watchTotalVideoViews();
    watchVideoReactions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}