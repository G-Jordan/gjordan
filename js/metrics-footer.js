// js/metrics-footer.js
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  onAuthStateChanged, signInAnonymously, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Use the instances created in firebase-init.js
const db   = window.db;
const auth = window.auth;

// DOM helpers
const $ordinal = document.getElementById("visitorOrdinal");
const $users   = document.getElementById("totalUsers");
const setText  = (el, txt) => { if (el) el.textContent = txt; };

// 1 -> 1st, 2 -> 2nd, etc.
const ordinal = (n) => {
  n = Number(n);
  const s = ["th","st","nd","rd"], v = n % 100;
  return `${n}${s[(v-20)%10] || s[v] || s[0]}`;
};

// Create visitors/{uid} once (rules allow only createdAt & fp)
async function ensureVisitorDocOnce(uid) {
  const ref = doc(db, "visitors", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  const fp = localStorage.getItem("g73_fp") || crypto.randomUUID();
  localStorage.setItem("g73_fp", fp);
  await setDoc(ref, { createdAt: serverTimestamp(), fp });
  return true;
}

// Count helpers (modular aggregate)
async function countVisitors() {
  const agg = await getCountFromServer(collection(db, "visitors"));
  return agg.data().count || 0;
}
async function countSignedUpUsers() {
  const agg = await getCountFromServer(collection(db, "profiles"));
  return agg.data().count || 0;
}

// Render footer
async function renderFooter(wasFirstTime) {
  const [visitors, users] = await Promise.all([countVisitors(), countSignedUpUsers()]);
  if ($ordinal) $ordinal.textContent = ordinal(visitors);
  if ($users)   $users.textContent   = users.toLocaleString();
  // Cache ordinal for instant paint next visit (optional)
  localStorage.setItem("g73_visit_rank", String(visitors));
}

// Boot
(async function start() {
  try { await setPersistence(auth, browserLocalPersistence); } catch {}

  // Paint cached ordinal ASAP (optional)
  const cached = localStorage.getItem("g73_visit_rank");
  if (cached && $ordinal) $ordinal.textContent = ordinal(cached);

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) { await signInAnonymously(auth); return; }
      const first = await ensureVisitorDocOnce(user.uid);
      await renderFooter(first);
    } catch (e) {
      console.warn("[metrics] error:", e);
      setText($ordinal, "—");
      setText($users,   "—");
    }
  });
})();