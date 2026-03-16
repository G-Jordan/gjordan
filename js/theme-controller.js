(() => {  
  const ROOT = document.documentElement;  
  const LS_KEY = "g73Theme";  
  const $ = (sel) => document.querySelector(sel);  

  const defaults = {  
    bg: "#0b0d10", text: "#e8eef5",  
    primary: "#D4AF37", secondary: "#8B6B1B",  
    glowAlpha: 0.55, glowStrength: 1,  
    radius: 12, baseFont: 14,  
    layoutMode: "list", gridCols: 2, thumbW: 64  
  };  

  const modalMap = {  
    mainThemeColor: "primary",  
    accentColorPicker: "secondary",  
    textColorPicker: "text",  
    textBgColorPicker: "bg",  
    borderColorPicker: null,  
    artistColorPicker: null,  
    likeColorPicker: null,  
    dislikeColorPicker: null,  
    downloadColorPicker: null  
  };  

  const settingsMap = {  
    bgPicker: "bg",  
    textPicker: "text",  
    primaryPicker: "primary",  
    secondaryPicker: "secondary",  
    glowAlpha: "glowAlpha",  
    glowStrength: "glowStrength",  
    radius: "radius",  
    fontSize: "baseFont",  
    layoutMode: "layoutMode",  
    gridCols: "gridCols",  
    thumbW: "thumbW"  
  };  

  function loadTheme(){  
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem(LS_KEY)||"{}")) }; }  
    catch { return { ...defaults }; }  
  }  
  function saveTheme(t){ localStorage.setItem(LS_KEY, JSON.stringify(t)); }  
  function applyTheme(t){  
    ROOT.style.setProperty("--bg", t.bg);  
    ROOT.style.setProperty("--text", t.text);  
    ROOT.style.setProperty("--primary", t.primary);  
    ROOT.style.setProperty("--secondary", t.secondary);  
    ROOT.style.setProperty("--glow-alpha", String(t.glowAlpha));  
    ROOT.style.setProperty("--glow-strength", String(t.glowStrength));  
    ROOT.style.setProperty("--radius", t.radius + "px");  
    ROOT.style.setProperty("--base-font", t.baseFont + "px");  
    ROOT.style.setProperty("--grid-cols", String(t.gridCols));  
    ROOT.style.setProperty("--thumb-w", t.thumbW + "px");  
    const main = document.querySelector("main");  
    if (main) main.setAttribute("data-layout", t.layoutMode);  
  }  
  function hydrateInputs(t){  
    Object.entries(modalMap).forEach(([id,key])=>{ if(!key) return; const el=$("#"+id); if(el) el.value=t[key]; });  
    Object.entries(settingsMap).forEach(([id,key])=>{ const el=$("#"+id); if(el) el.value=t[key]; });  
  }  
  function connectInputs(t){  
    const update=(k,v)=>{  
      if(["glowAlpha","glowStrength"].includes(k)) v=parseFloat(v);  
      if(["radius","baseFont","gridCols","thumbW"].includes(k)) v=parseInt(v,10);  
      t[k]=v; applyTheme(t); saveTheme(t);  
    };  
    Object.entries(modalMap).forEach(([id,key])=>{ if(!key) return; const el=$("#"+id); if(el) el.addEventListener("input",e=>update(key,e.target.value)); });  
    Object.entries(settingsMap).forEach(([id,key])=>{ const el=$("#"+id); if(!el) return; el.addEventListener("input",e=>update(key,e.target.value)); el.addEventListener("change",e=>update(key,e.target.value)); });  

    const toast=(msg)=>{ const box=document.getElementById("toast")||document.getElementById("toastBox"); if(!box) return; box.textContent=msg; box.style.opacity="1"; clearTimeout(box._t); box._t=setTimeout(()=>box.style.opacity="0",1200); };  
    const saveBtn=$("#saveTheme"), resetBtn=$("#resetTheme"), closeBtn=$("#closeSettings");  
    if(saveBtn)  saveBtn.addEventListener("click",()=>{ saveTheme(t); toast("Theme saved"); });  
    if(resetBtn) resetBtn.addEventListener("click",()=>{ const fresh={...defaults}; hydrateInputs(fresh); applyTheme(fresh); saveTheme(fresh); toast("Theme reset"); });  
    if(closeBtn) closeBtn.addEventListener("click",()=>{ $("#settings")?.setAttribute("hidden",""); });  

    window.saveTheme=()=>saveTheme(t);  
  }  

  const theme = loadTheme();  
  applyTheme(theme); hydrateInputs(theme); connectInputs(theme);  
})();