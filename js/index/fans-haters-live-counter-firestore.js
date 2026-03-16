// js/index/fans-haters-live-counter-firestore.js
import { doc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Find targets (supports your chip IDs or a fallback by data-role)
const fansEl =
  document.getElementById("fans-count") ||
  document.querySelector('[data-role="fans-count"]');

const hatersEl =
  document.getElementById("haters-count") ||
  document.querySelector('[data-role="haters-count"]');

const fmt = (n) => Number(n || 0).toLocaleString();

function setCounts(likes, dislikes) {
  if (fansEl) fansEl.textContent = fmt(likes);
  if (hatersEl) hatersEl.textContent = fmt(dislikes);
}

// ✅ Wait for window.db to exist (firebase-init is async)
function waitForDb(maxMs = 15000, stepMs = 100) {
  return new Promise((resolve) => {
    const start = Date.now();
    const done = (db) => resolve(db || null);
    const onReady = (e) => { cleanup(); done(e?.detail?.db || window.db); };
    const cleanup = () => window.removeEventListener('g73:firebase-ready', onReady);
    const tick = () => {
      if (window.db) { cleanup(); return done(window.db); }
      if (Date.now() - start >= maxMs) { cleanup(); return done(null); }
      setTimeout(tick, stepMs);
    };
    window.addEventListener('g73:firebase-ready', onReady, { once: true });
    tick();
  });
}

(async () => {
  const db = await waitForDb();

  if (!fansEl || !hatersEl) {
    console.warn("[Fans/Haters] Counter elements not found (#fans-count / #haters-count).");
  }

  if (!db) {
    console.warn("[Fans/Haters] window.db still not found after waiting. Check firebase-init.js load + path.");
    return;
  }

  // Try 1) single stats doc
  const statsRef = doc(db, "siteStats", "likesDislikes");
  let unsubStats = null;
  let usingFallback = false;

  function startFallbackSum() {
    if (usingFallback) return;
    usingFallback = true;

    const songsRef = collection(db, "songs");
    onSnapshot(
      songsRef,
      (snap) => {
        let totalLikes = 0, totalDislikes = 0;
        snap.forEach((d) => {
          const s = d.data() || {};
          totalLikes += s.likes || 0;
          totalDislikes += s.dislikes || 0;
        });
        setCounts(totalLikes, totalDislikes);
      },
      (err) => {
        console.error("[Fans/Haters] Songs snapshot error:", err);
      }
    );
  }

  unsubStats = onSnapshot(
    statsRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() || {};
        setCounts(data.totalLikes, data.totalDislikes);
      } else {
        if (unsubStats) unsubStats();
        startFallbackSum();
      }
    },
    (err) => {
      console.warn("[Fans/Haters] Stats doc not available, using fallback. Error:", err);
      if (unsubStats) unsubStats();
      startFallbackSum();
    }
  );
})();