// js/firebase/footer-metrics-core.js
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  onAuthStateChanged, signInAnonymously, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

function ordinal(n) {
  n = Number(n || 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function cacheSet(key, value){ try { localStorage.setItem(key, String(value)); } catch {} }
function cacheGet(key){ try { return localStorage.getItem(key); } catch { return null; } }

async function waitForFirebase(timeoutMs = 15000){
  if (window.db && window.auth) return { db: window.db, auth: window.auth };
  return await new Promise((resolve) => {
    const started = Date.now();
    const onReady = (e) => { cleanup(); resolve({ db: e?.detail?.db || window.db, auth: e?.detail?.auth || window.auth }); };
    const cleanup = () => window.removeEventListener('g73:firebase-ready', onReady);
    const tick = async () => {
      if (window.db && window.auth) { cleanup(); return resolve({ db: window.db, auth: window.auth }); }
      if (Date.now() - started >= timeoutMs) { cleanup(); return resolve({ db: window.db, auth: window.auth }); }
      setTimeout(tick, 150);
    };
    window.addEventListener('g73:firebase-ready', onReady, { once: true });
    tick();
  });
}

export function initFooterMetrics({ db = window.db, auth = window.auth } = {}) {
  if (window.__g73MetricsBootPromise) return window.__g73MetricsBootPromise;

  const $ordinal = document.getElementById("visitorOrdinal");
  const $users = document.getElementById("totalUsers");
  const setText = (el, txt) => { if (el) el.textContent = txt; };

  const cachedRank = cacheGet("g73_visit_rank");
  const cachedUsers = cacheGet("g73_total_users");
  if (cachedRank) setText($ordinal, ordinal(cachedRank)); else setText($ordinal, '—');
  if (cachedUsers) setText($users, Number(cachedUsers).toLocaleString()); else setText($users, '0');

  window.__g73MetricsBootPromise = (async () => {
    if (!db || !auth) ({ db, auth } = await waitForFirebase());
    if (!db || !auth) {
      console.warn("[metrics] missing Firebase db/auth; footer metrics not started.");
      if (!$ordinal?.textContent) setText($ordinal, "—");
      if (!$users?.textContent) setText($users, "—");
      return false;
    }

    async function ensureVisitorDocOnce(uid) {
      const ref = doc(db, "visitors", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) return false;
      const fp = cacheGet("g73_fp") || crypto.randomUUID();
      cacheSet("g73_fp", fp);
      await setDoc(ref, { createdAt: serverTimestamp(), fp });
      return true;
    }

    async function countVisitors() {
      const agg = await getCountFromServer(collection(db, "visitors"));
      return agg.data().count || 0;
    }

    async function countSignedUpUsers() {
      const agg = await getCountFromServer(collection(db, "profiles"));
      return agg.data().count || 0;
    }

    async function renderFooter() {
      const [visitors, users] = await Promise.all([countVisitors(), countSignedUpUsers()]);
      if ($ordinal) $ordinal.textContent = ordinal(visitors);
      if ($users) $users.textContent = Number(users || 0).toLocaleString();
      cacheSet("g73_visit_rank", visitors);
      cacheSet("g73_total_users", users);
      return { visitors, users };
    }

    async function renderFooterWithRetry(retries = 4) {
      let lastErr = null;
      for (let i = 0; i < retries; i++) {
        try { return await renderFooter(); }
        catch (e) {
          lastErr = e;
          await new Promise(r => setTimeout(r, 350 * (i + 1)));
        }
      }
      throw lastErr;
    }

    try { await setPersistence(auth, browserLocalPersistence); } catch {}

    onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAnonymously(auth);
          return;
        }
        await ensureVisitorDocOnce(user.uid);
        await renderFooterWithRetry();
      } catch (e) {
        console.warn("[metrics] error:", e);
        if (!cacheGet("g73_visit_rank")) setText($ordinal, "—");
        if (!cacheGet("g73_total_users")) setText($users, "—");
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) renderFooterWithRetry().catch(()=>{});
    }, { passive: true });

    return true;
  })();

  return window.__g73MetricsBootPromise;
}
