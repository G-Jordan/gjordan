// js/theme/theme-sync.js
(function(){
  function toInputId(key){
    return {
      mainColor: "mainThemeColor",
      accentColor: "accentColorPicker",
      textColor: "textColorPicker",
      textBg: "textBgColorPicker",
      borderColor: "borderColorPicker",
      artistColor: "artistColorPicker",
    }[key];
  }

  function safeColor(value){
    if (!value) return "#ffffff";
    if (value.startsWith("#")) return value;
    const nums = value.match(/\d+/g); if (!nums || nums.length < 3) return "#ffffff";
    return "#" + nums.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join("");
  }

  function syncThemeInputsFromCSS(){
    const theme = JSON.parse(localStorage.getItem("themeSettings") || null);
    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const fallback = {
      mainColor: getVar("--primary-color") || "#32cd32",
      accentColor: getVar("--accent-color") || "#ffd700",
      textColor: getVar("--text-muted") || "#aaaaaa",
      textBg: getVar("--white-faint") || "rgba(255, 255, 255, 0.05)",
      borderColor: getVar("--glow-color") || "#32cd32",
      artistColor: getVar("--artist-color") || "#ff69b4",
    };
    const active = theme || fallback;
    Object.entries(active).forEach(([k,v]) => {
      const el = document.getElementById(toInputId(k));
      if (el) el.value = safeColor(v);
    });
  }

  window.syncThemeInputsFromCSS = syncThemeInputsFromCSS;
})();