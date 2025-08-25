// js/theme/theme-save.js
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

  function saveTheme(){
    window.previewTheme?.();
    const ids = ["mainThemeColor","accentColorPicker","textColorPicker","textBgColorPicker","borderColorPicker","artistColorPicker"];
    const map = { mainColor: ids[0], accentColor: ids[1], textColor: ids[2], textBg: ids[3], borderColor: ids[4], artistColor: ids[5] };
    const theme = {};
    Object.entries(map).forEach(([k,id]) => { const el = document.getElementById(id); if (el) theme[k] = el.value; });
    localStorage.setItem("themeSettings", JSON.stringify(theme));
    window.closeThemeModal?.();
  }

  function resetTheme(){
    const defaults = { mainColor:"limegreen", accentColor:"gold", textColor:"#aaa", textBg:"rgba(255, 255, 255, 0.05)", borderColor:"limegreen", artistColor:"#ff69b4"};
    Object.entries(defaults).forEach(([k,v]) => { const id = toInputId(k); const el = document.getElementById(id); if (el) el.value = v; });
    window.previewTheme?.();
    localStorage.setItem("themeSettings", JSON.stringify(defaults));
  }

  function exportTheme(){
    const settings = localStorage.getItem("themeSettings");
    const blob = new Blob([settings || '{}'], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "theme-settings.json";
    a.click();
  }

  function importThemeFromFile(input){
    const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const theme = JSON.parse(e.target.result);
        if (!theme.mainColor || !theme.accentColor) throw new Error("Invalid theme file");
        localStorage.setItem("themeSettings", JSON.stringify(theme));
        Object.entries(theme).forEach(([k,v]) => { const id = toInputId(k); const el = document.getElementById(id); if (el) el.value = v; });
        window.previewTheme?.();
        saveTheme();
      } catch(err){ alert("Failed to load theme: " + err); }
    };
    reader.readAsText(file);
  }

  function applyPreset(type){
    const presets = {
      dark: { mainColor:"limegreen", accentColor:"gold", textColor:"#aaa", textBg:"rgba(255,255,255,0.05)", borderColor:"limegreen", artistColor:"#ff69b4" },
      light:{ mainColor:"#3498db",  accentColor:"#2c3e50", textColor:"#222", textBg:"#f0f0f0", borderColor:"#3498db", artistColor:"#9b59b6" }
    };
    const selected = presets[type];
    Object.entries(selected).forEach(([k,v]) => { const id = toInputId(k); const el = document.getElementById(id); if (el) el.value = v; });
    window.previewTheme?.();
    saveTheme();
  }

  window.saveTheme = saveTheme;
  window.resetTheme = resetTheme;
  window.exportTheme = exportTheme;
  window.importThemeFromFile = importThemeFromFile;
  window.applyPreset = applyPreset;
})();