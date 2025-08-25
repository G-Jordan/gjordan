// /js/firebase/firebase-auth.js

import {
  onAuthStateChanged,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  doc, getDoc, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Use the instances created in firebase-init.js
const auth = window.auth;
const db   = window.db;

/* ---------- UI helpers ---------- */
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

function showAuthModal()  { const m = document.getElementById("auth-modal"); if (m) m.style.display = "block"; }
function closeAuthModal() { const m = document.getElementById("auth-modal"); if (m) m.style.display = "none"; }
function toggleAuthModal() {
  const m = document.getElementById("auth-modal");
  if (!m) return;
  m.style.display = m.style.display === "block" ? "none" : "block";
}

/* ---------- Minimal, scoped styles for cooler chips ---------- */
(function injectAuthChipCSS(){
  if (document.getElementById("auth-chip-css")) return;
  const css = `
  /* Auth chips are self-contained and theme-aware */
  .auth-chip{
    --auth-grad: linear-gradient(90deg, var(--app-primary,#5fa0ff), var(--app-accent,#b478ff));
    --auth-ring: color-mix(in srgb, var(--app-primary,#5fa0ff) 55%, transparent);
    --auth-bg:   color-mix(in srgb, #0b0f14 76%, transparent);
    --auth-txt:  #e9f3ff;

    position: relative;
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: 0 6px 0 0;
    border-radius: 14px;
    border: 1px solid var(--auth-ring);
    background: var(--auth-bg);
    box-shadow: 0 8px 20px rgba(0,0,0,.45);
    cursor: pointer;
    user-select: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .auth-chip .material-icons{
    background-image: var(--auth-grad);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    font-size: 28px;
    line-height: 1;
    transition: transform .12s ease, filter .12s ease;
  }
  .auth-chip:hover .material-icons{ transform: translateY(-1px) scale(1.04); filter: drop-shadow(0 0 6px var(--auth-ring)); }
  .auth-chip:focus-visible{ box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-accent,#b478ff) 55%, transparent); }

  /* subtle animated halo that does not affect layout */
  .auth-chip::after{
    content:"";
    position:absolute;
    inset:-6px;
    border-radius: 16px;
    pointer-events:none;
    box-shadow: 0 0 16px color-mix(in srgb, var(--app-primary,#5fa0ff) 32%, transparent);
    opacity:.55;
    animation: authChipGlow 4.8s ease-in-out infinite;
  }
  @keyframes authChipGlow{
    0%,100% { transform: scale(.995); opacity:.40; }
    50%     { transform: scale(1.005); opacity:.65; }
  }

  /* If you already styled #account-btn in CSS, this just augments it */
  #account-btn.auth-chip, #logout-btn.auth-chip{
    background: var(--auth-bg);
  }
  `;
  const style = document.createElement("style");
  style.id = "auth-chip-css";
  style.textContent = css;
  document.head.appendChild(style);
})();

/* ---------- Profile doc (real users only) ---------- */
async function ensureProfileDocFor(user) {
  if (!user || user.isAnonymous) return;
  const ref  = doc(db, "profiles", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    createdAt: serverTimestamp(),
    providers: (user.providerData || []).map(p => p.providerId),
  });
}

/* ---------- Modal handlers ---------- */
async function modalSignUp() {
  const emailEl = document.getElementById("modal-email");
  const passEl  = document.getElementById("modal-password");
  const email    = emailEl?.value.trim();
  const password = passEl?.value.trim();

  const valid = password?.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  if (!valid) { showToast("Password must meet all requirements listed."); return; }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    closeAuthModal();
  } catch (e) {
    console.error(e);
    const code = e?.code || "";
    if (code === "auth/email-already-in-use") showToast("Email already in use. Try logging in instead.");
    else if (code === "auth/invalid-email")   showToast("That email doesn't look valid.");
    else if (code === "auth/weak-password")   showToast("Password is too weak.");
    else showToast("Something went wrong. Please try again.");
  }
}

async function modalLogin() {
  const emailEl = document.getElementById("modal-email");
  const passEl  = document.getElementById("modal-password");
  const email    = emailEl?.value.trim();
  const password = passEl?.value.trim();
  if (!email || !password) { showToast("Error: Please add your credentials above."); return; }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeAuthModal();
  } catch (error) {
    const code = error?.code || "";
    if (code === "auth/user-not-found")      showToast("User not found — try signing up.");
    else if (code === "auth/invalid-credential" || code === "auth/wrong-password") showToast("Invalid email or password.");
    else showToast(error.message || "Login error.");
  }
}

/* ---------- Turn any element into a styled auth chip ---------- */
function attachAuthChip(el, icon = "account_circle", title = "Sign in"){
  if (!el) return;
  el.classList.add("auth-chip");
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("title", title);
  // If it doesn't already contain a material icon, inject one
  if (!el.querySelector(".material-icons")) {
    el.innerHTML = `<span class="material-icons" aria-hidden="true">${icon}</span>`;
  } else {
    // ensure the icon text matches
    const i = el.querySelector(".material-icons");
    if (i && i.textContent.trim() !== icon) i.textContent = icon;
  }
  // Keyboard activation
  if (!el.__authKeywired) {
    el.addEventListener("keydown", (e)=>{
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); }
    });
    el.__authKeywired = true;
  }
}

/* ---------- Ensure a matching Logout chip exists ---------- */
function ensureLogoutButton() {
  let logoutBtn = document.getElementById("logout-btn");
  const loginBtn = document.getElementById("account-btn");

  if (!logoutBtn) {
    logoutBtn = document.createElement("button");
    logoutBtn.id = "logout-btn";
    logoutBtn.style.display = "none"; // hidden by default
    // place it beside login if possible
    if (loginBtn && loginBtn.parentNode) {
      loginBtn.parentNode.insertBefore(logoutBtn, loginBtn.nextSibling);
    } else {
      const nav = document.querySelector(".navbar");
      (nav || document.body).appendChild(logoutBtn);
    }
  }

  attachAuthChip(logoutBtn, "logout", "Sign out");

  if (!logoutBtn.__wired) {
    logoutBtn.addEventListener("click", async () => {
      try { await signOut(auth); }
      catch (e) { console.warn("[auth] signOut failed", e); showToast("Sign out failed. Try again."); }
    });
    logoutBtn.__wired = true;
  }

  return logoutBtn;
}

/* ---------- Single unified auth listener ---------- */
async function initAuth() {
  try { await setPersistence(auth, browserLocalPersistence); } catch {}

  // Upgrade the login button’s visuals immediately if present
  const loginBtn = document.getElementById("account-btn");
  if (loginBtn) attachAuthChip(loginBtn, "account_circle", "Sign in");

  onAuthStateChanged(auth, async (user) => {
    const loginBtn  = document.getElementById("account-btn");
    if (loginBtn) attachAuthChip(loginBtn, "account_circle", "Sign in"); // re-ensure class
    const logoutBtn = ensureLogoutButton();

    // If nobody is signed in yet, create a durable anonymous session for visitor tracking
    if (!user) {
      try { await signInAnonymously(auth); } catch (e) { console.warn("[auth] anonymous sign-in failed", e); }
      if (loginBtn)  loginBtn.style.display  = "inline-grid";
      if (logoutBtn) logoutBtn.style.display = "none";
      return;
    }

    // Real users get a profile doc (once)
    if (!user.isAnonymous) {
      try { await ensureProfileDocFor(user); } catch (e) { console.warn("[auth] ensureProfileDocFor failed", e); }
      if (loginBtn)  loginBtn.style.display  = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-grid";
    } else {
      // Anonymous users: show login, hide logout
      if (loginBtn)  loginBtn.style.display  = "inline-grid";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  });
}

/* ---------- kick off ---------- */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}

/* ---------- expose for HTML bindings ---------- */
window.showAuthModal   = showAuthModal;
window.closeAuthModal  = closeAuthModal;
window.toggleAuthModal = toggleAuthModal;
window.modalSignUp     = modalSignUp;
window.modalLogin      = modalLogin;
window.showToast       = showToast;