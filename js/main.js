// js/main.js
(function(){
  // Hook color inputs to live preview once DOM is ready
  window.addEventListener("DOMContentLoaded", () => {
    const ids = ["mainThemeColor","accentColorPicker","textColorPicker","textBgColorPicker","borderColorPicker"];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener("input", () => window.previewTheme?.()); });

    // If there is a saved theme, populate inputs and preview
    const saved = localStorage.getItem("themeSettings");
    if (saved){
      const theme = JSON.parse(saved);
      const map = { mainColor:"mainThemeColor", accentColor:"accentColorPicker", textColor:"textColorPicker", textBg:"textBgColorPicker", borderColor:"borderColorPicker", artistColor, downloadColor:"downloadColorPicker" };
      Object.entries(theme).forEach(([k,v]) => { const id = map[k]; const el = document.getElementById(id); if (el) el.value = v; });
      window.previewTheme?.();
    } else {
      // initialize defaults to inputs and preview once
      const defaults = { mainColor:"limegreen", accentColor:"gold", textColor:"#aaa", textBg:"rgba(255, 255, 255, 0.05)", borderColor:"limegreen", artistColor:"#ff69b4"};
      const map = { mainColor:"mainThemeColor", accentColor:"accentColorPicker", textColor:"textColorPicker", textBg:"textBgColorPicker", borderColor:"borderColorPicker", artistColor, downloadColor:"downloadColorPicker" };
      Object.entries(defaults).forEach(([k,v]) => { const id = map[k]; const el = document.getElementById(id); if (el) el.value = v; });
      window.previewTheme?.();
      localStorage.setItem("themeSettings", JSON.stringify(defaults));
    }
  });
})();