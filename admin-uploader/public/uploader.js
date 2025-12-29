const logEl = document.getElementById("log");
const dot = document.getElementById("dot");
const statusText = document.getElementById("statusText");
const historyEl = document.getElementById("history");

const $ = (id) => document.getElementById(id);

function log(msg){
  const t = new Date().toLocaleTimeString();
  logEl.textContent += `[${t}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(ok, text){
  dot.className = "dot " + (ok ? "ok" : "bad");
  statusText.textContent = text;
}

async function api(path, opts){
  const res = await fetch(path, opts);
  const txt = await res.text();
  let json = null;
  try { json = JSON.parse(txt); } catch {}
  if (!res.ok) throw new Error(json?.error || txt || `HTTP ${res.status}`);
  return json ?? txt;
}

function escapeHtml(s){
  return String(s || "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function refreshHistory(){
  try{
    const out = await api("/admin-api/history");
    const list = out.history || [];
    historyEl.innerHTML = "";
    if (!list.length){
      historyEl.innerHTML = `<div class="item"><div class="meta">No uploads yet.</div></div>`;
      return;
    }
    for (const x of list.slice(0, 8)){
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="id">${x.id}</div>
        <div class="meta">${escapeHtml(x.name)} — ${escapeHtml(x.artist)}</div>
        <div class="meta">${new Date(x.ts).toLocaleString()}</div>
      `;
      historyEl.appendChild(div);
    }
  }catch(e){ /* ignore */ }
}

async function test(){
  try{
    const out = await api("/admin-api/ping");
    setStatus(true, "Connected");
    log(`✅ Connected. SITE_ROOT = ${out.siteRoot}`);
    return out;
  }catch(e){
    setStatus(false, "Disconnected");
    log(`❌ Ping failed: ${e.message}`);
    throw e;
  }
}

function guessFromFilename(filename){
  const base = filename.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/_/g," ").replace(/\s+/g," ").trim();
  const m = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (m) return { artist: m[1].trim(), title: m[2].trim() };
  return { artist:"", title: cleaned };
}

// --------- Drag & drop helpers ----------
function bindDropZone(inputEl, label){
  const card = inputEl.closest(".card") || document.body;
  inputEl.addEventListener("dragover", (e)=>{ e.preventDefault(); card.classList.add("drag"); });
  inputEl.addEventListener("dragleave", ()=> card.classList.remove("drag"));
  inputEl.addEventListener("drop", (e)=>{
    e.preventDefault();
    card.classList.remove("drag");
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const dt = new DataTransfer();
    dt.items.add(f);
    inputEl.files = dt.files;
    log(`📥 Dropped ${label}: ${f.name}`);
  });
}

bindDropZone($("audioFile"), "audio");
bindDropZone($("coverFile"), "cover");

// --------- Upload with progress ----------
async function upload(){
  const audio = $("audioFile").files?.[0];
  const cover = $("coverFile").files?.[0];

  let name = $("songName").value.trim();
  let artist = $("artistName").value.trim();
  const manualId = $("manualId").value.trim();

  if (!audio) return log("⚠️ Pick an audio file.");
  if (!cover) return log("⚠️ Pick a cover image.");

  if (!name || !artist){
    const guess = guessFromFilename(audio.name);
    if (!name) name = guess.title || "";
    if (!artist) artist = guess.artist || "";
    $("songName").value = name;
    $("artistName").value = artist;
  }

  const fd = new FormData();
  fd.append("name", name);
  fd.append("artist", artist);
  if (manualId) fd.append("manualId", manualId);

  // IMPORTANT: these field names are still audio/cover
  fd.append("audio", audio, audio.name);
  fd.append("cover", cover, cover.name);

  log("⏳ Uploading… (server will force MP3 + JPG)");

  // Use XHR for progress
  const out = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin-api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        log(`📦 Upload progress: ${pct}%`);
      }
    };
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(j);
        else reject(new Error(j?.error || xhr.responseText || `HTTP ${xhr.status}`));
      } catch {
        reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error / failed to fetch"));
    xhr.send(fd);
  });

  log(`✅ Added: ${out.id}`);
  log(`🎵 Audio: ${out.audioPath}`);
  log(`🖼️ Cover: ${out.coverPath}`);
  log(`🧾 Updated: ${out.playlistPath}`);
  log(`🛟 Backup: ${out.backupPath}`);

  await refreshHistory();
}

async function undo(){
  log("⏳ Undoing last upload…");
  const out = await api("/admin-api/undo", { method:"POST" });
  log(`✅ Restored playlist: ${out.restored}`);
  log(`🧹 Deleted files:\n - ${out.deleted.join("\n - ") || "(none)"}`);
  await refreshHistory();
}

$("btnTest").addEventListener("click", () => test().catch(()=>{}));
$("btnUpload").addEventListener("click", async () => {
  try{
    await test();
    await upload();
  }catch(e){
    log(`❌ ${e.message}`);
  }
});
$("btnUndo").addEventListener("click", async () => {
  try{
    await test();
    await undo();
  }catch(e){
    log(`❌ ${e.message}`);
  }
});

test().catch(()=>{});
refreshHistory();