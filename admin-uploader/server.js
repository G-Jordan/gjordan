// G73 Admin Uploader (local-only) — Termux/Android safe
// Run (recommended):
//   cd ~/projects/admin-uploader
//   SITE_ROOT="/storage/emulated/0/Gjordan music website" PORT=8787 \
//   FIREBASE_ADMIN_JSON="/storage/emulated/0/Download/your-service-account.json" \
//   node server.js

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import busboy from "busboy";
import { spawn } from "child_process";
import { parseFile } from "music-metadata";

// Firebase Admin (Firestore)
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "G73-UPLOADER-FIRESTORE-2025-12-29c";
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

// ---------- helpers ----------
function json(res, code, obj) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj, null, 2));
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} failed (${code}): ${err || out}`));
    });
  });
}

async function forceAudioToMp3(inputPath, outputPath) {
  await run("ffmpeg", ["-y", "-i", inputPath, "-vn", "-codec:a", "libmp3lame", "-q:a", "2", outputPath]);
}
async function forceImageToJpg(inputPath, outputPath) {
  await run("ffmpeg", ["-y", "-i", inputPath, "-q:v", "2", outputPath]);
}

/**
 * ✅ Hardened state loader:
 * - Survives empty/invalid JSON
 * - Repairs missing/invalid history + last
 */
function loadState(statePath) {
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, "utf8"));
    const state = raw && typeof raw === "object" ? raw : {};
    if (!Array.isArray(state.history)) state.history = [];
    if (!state.last || typeof state.last !== "object") state.last = null;
    return state;
  } catch {
    return { history: [], last: null };
  }
}
function saveState(statePath, state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function guessFromFilename(filename) {
  const base = String(filename || "").replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (m) return { artist: m[1].trim(), title: m[2].trim() };
  return { artist: "", title: cleaned };
}

async function tryReadTags(filePath) {
  try {
    const meta = await parseFile(filePath, { duration: false });
    const t = meta?.common?.title?.trim() || "";
    const a = meta?.common?.artist?.trim() || "";
    return { title: t, artist: a };
  } catch {
    return { title: "", artist: "" };
  }
}

function detectNextId(playlistText) {
  const re = /["']music-(\d+)["']/g;
  let m, max = 0;
  while ((m = re.exec(playlistText))) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `music-${max + 1}`;
}

function resolveUniqueId(baseId, playlistText, songsDir, imagesDir) {
  let id = baseId;
  let i = 0;

  const existsInText = (x) => playlistText.includes(`"${x}"`) || playlistText.includes(`'${x}'`);
  const existsFiles = (x) =>
    fs.existsSync(path.join(songsDir, `${x}.mp3`)) ||
    fs.existsSync(path.join(imagesDir, `${x}.jpg`));

  while (existsInText(id) || existsFiles(id)) {
    i++;
    const match = /music-(\d+)/.exec(baseId);
    if (match) id = `music-${parseInt(match[1], 10) + i}`;
    else id = `${baseId}-${i}`;
  }
  return id;
}

function insertIntoAllMusicBase(playlistText, entry) {
  const start = playlistText.indexOf("window.allMusicBase");
  if (start === -1) throw new Error("Could not find window.allMusicBase in music-list.js");

  const openBracket = playlistText.indexOf("[", start);
  if (openBracket === -1) throw new Error("Could not find [ after window.allMusicBase");

  let depth = 0, closeBracket = -1;
  for (let i = openBracket; i < playlistText.length; i++) {
    const c = playlistText[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) { closeBracket = i; break; }
    }
  }
  if (closeBracket === -1) throw new Error("Could not find end of allMusicBase array");

  const before = playlistText.slice(0, openBracket + 1);
  const inside = playlistText.slice(openBracket + 1, closeBracket);
  const after  = playlistText.slice(closeBracket);

  const line =
    `\n  { name: ${JSON.stringify(entry.name)}, artist: ${JSON.stringify(entry.artist)}, img: ${JSON.stringify(entry.id)}, src: ${JSON.stringify(entry.id)} },`;

  return before + line + inside + after;
}

// ---------- SITE_ROOT detection ----------
function looksLikeSiteRoot(p) {
  try {
    return (
      fs.existsSync(path.join(p, "songs")) &&
      fs.existsSync(path.join(p, "images")) &&
      fs.existsSync(path.join(p, "js", "music-list.js"))
    );
  } catch {
    return false;
  }
}

function resolveSiteRoot() {
  if (process.env.SITE_ROOT) return path.resolve(process.env.SITE_ROOT);

  const androidSite = "/storage/emulated/0/Gjordan music website";
  if (looksLikeSiteRoot(androidSite)) return androidSite;

  const parent = path.resolve(__dirname, "..");
  if (looksLikeSiteRoot(parent)) return parent;

  let cur = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (looksLikeSiteRoot(cur)) return cur;
    const up = path.resolve(cur, "..");
    if (up === cur) break;
    cur = up;
  }
  return parent;
}

const SITE_ROOT = resolveSiteRoot();
const SONGS_DIR = path.join(SITE_ROOT, "songs");
const IMAGES_DIR = path.join(SITE_ROOT, "images");
const PLAYLIST_JS = path.join(SITE_ROOT, "js", "music-list.js");

const BACKUPS_DIR = path.join(__dirname, "backups");
const STATE_PATH = path.join(__dirname, "state.json");
const TMP_DIR = path.join(__dirname, ".tmp");

// ---------- Firebase (Firestore) ----------
let _db = null;

function initFirestoreIfConfigured() {
  if (_db) return _db;

  const jsonPath = process.env.FIREBASE_ADMIN_JSON;
  if (!jsonPath) return null;

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`FIREBASE_ADMIN_JSON not found: ${jsonPath}`);
  }

  // Avoid double-init
  if (!getApps().length) {
    const svc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    initializeApp({ credential: cert(svc) });
  }
  _db = getFirestore();
  return _db;
}

function buildTitleForFirestore(name, artist) {
  // If name already includes " - " assume it's already full title.
  if (String(name).includes(" - ")) return String(name).trim();
  // Otherwise combine like you wanted: "G Jordan - I Tried (prod.6tracks)"
  return `${String(artist).trim()} - ${String(name).trim()}`.trim();
}

async function upsertSongDoc(db, id, title) {
  // Collection already exists: songs
  const ref = db.collection("songs").doc(id);
  await ref.set(
    {
      dislikes: 0,
      downloads: 0,
      likes: 0,
      Title: title,
      views: 0,
    },
    { merge: true }
  );
  return `songs/${id}`;
}

async function deleteSongDoc(db, id) {
  const ref = db.collection("songs").doc(id);
  await ref.delete();
  return `songs/${id}`;
}

// ---------- dirs ----------
function ensureDirs() {
  for (const d of [SONGS_DIR, IMAGES_DIR, BACKUPS_DIR, TMP_DIR]) fs.mkdirSync(d, { recursive: true });
  if (!fs.existsSync(PLAYLIST_JS)) {
    throw new Error(
      `Missing playlist file: ${PLAYLIST_JS}\n` +
      `Fix: run with SITE_ROOT="/storage/emulated/0/Gjordan music website" PORT=8787 node server.js`
    );
  }
}

function backupPlaylist() {
  const stamp = nowStamp();
  const backupPath = path.join(BACKUPS_DIR, `music-list.js.bak-${stamp}`);
  fs.copyFileSync(PLAYLIST_JS, backupPath);
  return backupPath;
}

// ---------- static ----------
function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  let p = url.pathname;

  if (p === "/" || p === "/admin") p = "/public/uploader.html";

  if (p.startsWith("/public/")) {
    const abs = path.join(__dirname, p);
    if (!abs.startsWith(__dirname)) return json(res, 403, { error: "forbidden", version: VERSION });

    fs.readFile(abs, (err, data) => {
      if (err) return json(res, 404, { error: "not found", version: VERSION });

      const ext = path.extname(abs).toLowerCase();
      const map = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
      };
      res.writeHead(200, { "content-type": map[ext] || "application/octet-stream" });
      res.end(data);
    });
    return;
  }

  return json(res, 404, { error: "not found", hint: "Open /public/uploader.html", version: VERSION });
}

// ---------- multipart parser ----------
async function parseMultipart(req) {
  const ct = String(req.headers["content-type"] || "");
  const bb = busboy({
    headers: req.headers,
    limits: { files: 2, fileSize: 1024 * 1024 * 1024 },
  });

  const fields = {};
  const seenFiles = [];
  let audioTmp = null;
  let coverTmp = null;
  const writePromises = [];

  bb.on("field", (name, val) => {
    fields[name] = String(val ?? "").trim();
  });

  bb.on("file", (fieldname, file, info) => {
    const filename = info?.filename || `${fieldname}-${Date.now()}`;
    const mimeType = info?.mimeType || info?.mimetype || "";
    seenFiles.push({ fieldname, filename, mimeType });

    console.log(`[busboy] file field="${fieldname}" name="${filename}" mime="${mimeType}"`);

    const safe = filename.replace(/[^\w.\- ()]/g, "_");
    const tmpPath = path.join(TMP_DIR, `${Date.now()}-${safe}`);

    if (fieldname === "audio") audioTmp = { path: tmpPath, filename };
    if (fieldname === "cover") coverTmp = { path: tmpPath, filename };

    const out = fs.createWriteStream(tmpPath);

    const p = new Promise((resolve, reject) => {
      out.on("close", resolve);
      out.on("error", reject);
      file.on("error", reject);
    });

    writePromises.push(p);
    file.pipe(out);
  });

  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", reject);
    req.pipe(bb);
  });

  await Promise.all(writePromises);

  return { fields, audioTmp, coverTmp, debug: { contentType: ct, seenFiles, fields } };
}

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  try {
    ensureDirs();
    const url = new URL(req.url, "http://localhost");

    if (url.pathname === "/admin-api/ping") {
      return json(res, 200, {
        ok: true,
        version: VERSION,
        port: PORT,
        cwd: process.cwd(),
        scriptDir: __dirname,
        siteRoot: SITE_ROOT,
        songsDir: SONGS_DIR,
        imagesDir: IMAGES_DIR,
        playlist: PLAYLIST_JS,
        firestoreEnabled: Boolean(process.env.FIREBASE_ADMIN_JSON),
      });
    }

    if (url.pathname === "/admin-api/upload" && req.method === "POST") {
      const { fields, audioTmp, coverTmp, debug } = await parseMultipart(req);

      if (!audioTmp) return json(res, 400, { error: "Missing audio file", debug, version: VERSION, port: PORT });
      if (!coverTmp) return json(res, 400, { error: "Missing cover image", debug, version: VERSION, port: PORT });

      const playlistText = fs.readFileSync(PLAYLIST_JS, "utf8");
      const baseId = fields.manualId?.length ? fields.manualId : detectNextId(playlistText);
      const id = resolveUniqueId(baseId, playlistText, SONGS_DIR, IMAGES_DIR);

      let name = fields.name || "";
      let artist = fields.artist || "";

      const guess = guessFromFilename(audioTmp.filename);
      const tags = await tryReadTags(audioTmp.path);

      if (!name) name = tags.title || guess.title || id;
      if (!artist) artist = tags.artist || guess.artist || "G Jordan";

      const outAudioAbs = path.join(SONGS_DIR, `${id}.mp3`);
      const outCoverAbs = path.join(IMAGES_DIR, `${id}.jpg`);

      const backupAbs = backupPlaylist();

      // Local work first
      await forceAudioToMp3(audioTmp.path, outAudioAbs);
      await forceImageToJpg(coverTmp.path, outCoverAbs);

      const patched = insertIntoAllMusicBase(playlistText, { id, name, artist });
      fs.writeFileSync(PLAYLIST_JS, patched, "utf8");

      // Firestore: create/merge song stats
      let firestoreDoc = null;
      try {
        const db = initFirestoreIfConfigured();
        if (db) {
          const Title = buildTitleForFirestore(name, artist);
          firestoreDoc = await upsertSongDoc(db, id, Title);
        }
      } catch (fbErr) {
        // Rollback local changes if Firebase fails (keeps everything in sync)
        try { fs.copyFileSync(backupAbs, PLAYLIST_JS); } catch {}
        try { if (fs.existsSync(outAudioAbs)) fs.unlinkSync(outAudioAbs); } catch {}
        try { if (fs.existsSync(outCoverAbs)) fs.unlinkSync(outCoverAbs); } catch {}

        return json(res, 500, {
          error: `Firestore failed: ${fbErr?.message || String(fbErr)}`,
          version: VERSION,
          port: PORT,
        });
      }

      // Save state for Undo
      const state = loadState(STATE_PATH);
      if (!Array.isArray(state.history)) state.history = [];

      const entry = {
        ts: new Date().toISOString(),
        id,
        name,
        artist,
        createdFiles: [
          path.relative(SITE_ROOT, outAudioAbs),
          path.relative(SITE_ROOT, outCoverAbs),
        ],
        playlist: path.relative(SITE_ROOT, PLAYLIST_JS),
        backup: backupAbs,
        firestoreDoc, // e.g. "songs/music-32"
        source: { audio: audioTmp.filename, cover: coverTmp.filename },
      };

      state.last = entry;
      state.history.unshift(entry);
      state.history = state.history.slice(0, 50);
      saveState(STATE_PATH, state);

      // Cleanup temp
      try { fs.unlinkSync(audioTmp.path); } catch {}
      try { fs.unlinkSync(coverTmp.path); } catch {}

      return json(res, 200, {
        ok: true,
        version: VERSION,
        id,
        name,
        artist,
        audioPath: `/songs/${id}.mp3`,
        coverPath: `/images/${id}.jpg`,
        playlistPath: `/js/music-list.js`,
        backupPath: entry.backup,
        firestoreDoc: entry.firestoreDoc || null,
      });
    }

    if (url.pathname === "/admin-api/undo" && req.method === "POST") {
      const state = loadState(STATE_PATH);
      if (!state.last) return json(res, 400, { error: "Nothing to undo.", version: VERSION });

      const last = state.last;

      // Restore playlist backup
      if (!fs.existsSync(last.backup)) {
        return json(res, 400, { error: `Backup missing: ${last.backup}`, version: VERSION });
      }
      fs.copyFileSync(last.backup, PLAYLIST_JS);

      // Delete created files
      const deleted = [];
      for (const rel of last.createdFiles || []) {
        const abs = path.join(SITE_ROOT, rel);
        if (fs.existsSync(abs)) {
          fs.unlinkSync(abs);
          deleted.push(rel);
        }
      }

      // Delete Firestore doc (best effort)
      let firestoreDeleted = null;
      try {
        const db = initFirestoreIfConfigured();
        if (db && last.id) {
          firestoreDeleted = await deleteSongDoc(db, last.id);
        }
      } catch (e) {
        // keep undo successful locally even if Firestore delete fails
        firestoreDeleted = `FAILED: ${e?.message || String(e)}`;
      }

      // Clear last, keep history
      state.last = null;
      saveState(STATE_PATH, state);

      return json(res, 200, {
        ok: true,
        version: VERSION,
        restored: "/js/music-list.js",
        deleted,
        firestoreDeleted,
      });
    }

    if (url.pathname === "/admin-api/history") {
      const state = loadState(STATE_PATH);
      return json(res, 200, { ok: true, version: VERSION, last: state.last, history: state.history || [] });
    }

    return serveStatic(req, res);

  } catch (e) {
    return json(res, 500, { error: e?.message || String(e), version: VERSION, port: PORT });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`G73 Admin Uploader running: http://127.0.0.1:${PORT}/public/uploader.html`);
  console.log(`VERSION: ${VERSION}`);
  console.log(`SITE_ROOT: ${SITE_ROOT}`);
  console.log(`FIRESTORE: ${process.env.FIREBASE_ADMIN_JSON ? "ENABLED" : "disabled (set FIREBASE_ADMIN_JSON)"}`);
});