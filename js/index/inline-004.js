
  import {
    collection, collectionGroup, getCountFromServer, query, where
  } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

  const db = window.db;

  async function refreshFooterCounts(){
    // ---- Total signed-up users (profiles only; anonymous not included by design) ----
    try {
      const snap = await getCountFromServer(collection(db, "profiles"));
      const total = snap.data().count || 0;
      const el = document.getElementById("totalUsers");
      if (el) el.textContent = total.toLocaleString();
    } catch (e) {
      console.warn("[footer] profiles count failed", e);
    }

    // ---- Fans / Haters totals across all reactions subcollections (songs/videos) ----
    try {
      const likesQ    = query(collectionGroup(db, "reactions"), where("reaction", "==", "like"));
      const dislikesQ = query(collectionGroup(db, "reactions"), where("reaction", "==", "dislike"));
      const [likesSnap, dislikesSnap] = await Promise.all([
        getCountFromServer(likesQ),
        getCountFromServer(dislikesQ)
      ]);
      const fans   = likesSnap.data().count || 0;
      const haters = dislikesSnap.data().count || 0;
      const fansEl = document.getElementById("fans-count");
      const hatEl  = document.getElementById("haters-count");
      if (fansEl) fansEl.textContent = fans.toLocaleString();
      if (hatEl)  hatEl.textContent  = haters.toLocaleString();
    } catch (e) {
      console.warn("[footer] reactions count failed", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshFooterCounts);
  } else {
    refreshFooterCounts();
  }
