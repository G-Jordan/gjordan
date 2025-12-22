// js/main.js
(function () {
  window.addEventListener("DOMContentLoaded", () => {
    const ids = [
      "mainThemeColor",
      "accentColorPicker",
      "textColorPicker",
      "textBgColorPicker",
      "borderColorPicker",
      "artistColorPicker",       // ✅ if you have this input in your theme UI
      "downloadColorPicker"      // ✅ if you have this input too
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", () => window.previewTheme?.());
    });

    // map theme keys -> input IDs (✅ FIXED: strings only)
    const map = {
      mainColor: "mainThemeColor",
      accentColor: "accentColorPicker",
      textColor: "textColorPicker",
      textBg: "textBgColorPicker",
      borderColor: "borderColorPicker",
      artistColor: "artistColorPicker",
      downloadColor: "downloadColorPicker"
    };

    const safeParse = (raw) => {
      try { return JSON.parse(raw); } catch { return null; }
    };

    const savedRaw = localStorage.getItem("themeSettings");
    const saved = savedRaw ? safeParse(savedRaw) : null;

    const defaults = {
      mainColor: "limegreen",
      accentColor: "gold",
      textColor: "#aaa",
      textBg: "rgba(255, 255, 255, 0.05)",
      borderColor: "limegreen",
      artistColor: "#ff69b4"
      // downloadColor: "#00e5ff" // optional if you use it
    };

    const theme = saved && typeof saved === "object" ? saved : defaults;

    Object.entries(theme).forEach(([k, v]) => {
      const id = map[k];
      if (!id) return;
      const el = document.getElementById(id);
      if (el && typeof v === "string") el.value = v;
    });

    window.previewTheme?.();

    // persist defaults if none existed
    if (!saved) localStorage.setItem("themeSettings", JSON.stringify(theme));
  });
})();
import('/js/index/song-reaction-buttons-and-stats.js');