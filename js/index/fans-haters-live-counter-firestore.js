
  // Firestore funcs (no re-init; we use window.db from firebase-init.js)
  import {
    doc, collection, onSnapshot
  } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

  // Find targets (supports your chip IDs or a fallback by data-role)
  const fansEl =
    document.getElementById("fans-count") ||
    document.querySelector('[data-role="fans-count"]');
  const hatersEl =
    document.getElementById("haters-count") ||
    document.querySelector('[data-role="haters-count"]');

  if (!window.db) {
    console.warn("[Fans/Haters] window.db not found. Load firebase-init.js first.");
  }
  if (!fansEl || !hatersEl) {
    console.warn("[Fans/Haters] Counter elements not found (#fans-count / #haters-count).");
  }

  const fmt = (n) => Number(n || 0).toLocaleString();

  function setCounts(likes, dislikes) {
    if (fansEl)   fansEl.textContent   = fmt(likes);
    if (hatersEl) hatersEl.textContent = fmt(dislikes);
  }

  // Try 1) single stats doc
  const statsRef = doc(window.db, "siteStats", "likesDislikes");
  let unsubStats = null;
  let usingFallback = false;

  function startFallbackSum() {
    if (usingFallback) return;
    usingFallback = true;

    // 2) live-sum all songs (likes/dislikes fields)
    const songsRef = collection(window.db, "songs");
    onSnapshot(songsRef, (snap) => {
      let totalLikes = 0, totalDislikes = 0;
      snap.forEach((d) => {
        const s = d.data() || {};
        totalLikes    += s.likes    || 0;
        totalDislikes += s.dislikes || 0;
      });
      setCounts(totalLikes, totalDislikes);
    }, (err) => {
      console.error("[Fans/Haters] Songs snapshot error:", err);
    });
  }

  unsubStats = onSnapshot(statsRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() || {};
      setCounts(data.totalLikes, data.totalDislikes);
    } else {
      // No aggregate doc—switch to fallback summing
      if (unsubStats) unsubStats();
      startFallbackSum();
    }
  }, (err) => {
    console.warn("[Fans/Haters] Stats doc not available, using fallback. Error:", err);
    if (unsubStats) unsubStats();
    startFallbackSum();
  });
