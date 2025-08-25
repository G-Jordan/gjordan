// js/firebase/firebase-metrics-lite.js
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const db   = window.db;
const auth = window.auth;

const $ = id => document.getElementById(id);
const ordinal = (n) => {
  n = Number(n); const s = ["th","st","nd","rd"], v = n % 100;
  return `${n}${s[(v-20)%10] || s[v] || s[0]}`;
};

async function ensureVisitorDocOnce(user) {
  // Called with an (anon or real) user
  const ref = doc(db, "visitors", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Optional: a lightweight fingerprint hint (no PII)
    const fp = (localStorage.getItem("g73_fp") || crypto.randomUUID());
    localStorage.setItem("g73_fp", fp);

    await setDoc(ref, { createdAt: serverTimestamp(), fp });
  }
}

async function updateVisitorOrdinal() {
  try {
    const agg = await getCountFromServer(collection(db, "visitors"));
    const count = agg.data().count || 0;
    const el = $("visitorOrdinal");
    if (el) el.textContent = ordinal(count);
    localStorage.setItem("g73_visit_rank", String(count));
  } catch (e) {
    console.warn("[metrics] getCount visitors failed:", e);
  }
}

async function updateTotalUsers() {
  try {
    const agg = await getCountFromServer(collection(db, "profiles"));
    const count = agg.data().count || 0;
    const el = $("totalUsers");
    if (el) el.textContent = count.toLocaleString();
  } catch (e) {
    console.warn("[metrics] getCount profiles failed:", e);
  }
}

// Boot logic
window.addEventListener("DOMContentLoaded", () => {
  // Paint cached ordinal ASAP (optional)
  const cached = localStorage.getItem("g73_visit_rank");
  if (cached && $("visitorOrdinal")) $("visitorOrdinal").textContent = ordinal(cached);

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        // no session yet → start anon so we have a stable uid
        await signInAnonymously(auth);
        return; // next auth state will fire
      }

      // Make sure the visitor doc exists exactly once (rules enforce once)
      await ensureVisitorDocOnce(user);

      // Now fetch counts for both footer metrics
      await updateVisitorOrdinal(); // "You are the Nth visitor"
      await updateTotalUsers();     // total signed-up users
    } catch (e) {
      console.warn("[metrics] init error:", e);
    }
  });
});