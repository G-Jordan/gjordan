// js/theme/theme-bridge.js
(function(){
  const THEME_KEY = "themeSettings";
  const LEGACY_KEY = "siteThemeV1";

  function safeParse(raw){
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function normalizeTheme(input){
    if (!input || typeof input !== "object") return null;

    const mainColor = input.mainColor || input.main || input.primary || null;
    const accentColor = input.accentColor || input.accent || input.secondary || null;
    const textColor = input.textColor || null;
    const textBg = input.textBg || null;
    const borderColor = input.borderColor || mainColor || null;
    const artistColor = input.artistColor || accentColor || null;
    const downloadColor = input.downloadColor || null;
    const surfaceOpacity = input.surfaceOpacity ?? null;
    const glowIntensity = input.glowIntensity ?? null;
    const radiusScale = input.radiusScale ?? null;
    const spacingScale = input.spacingScale ?? null;
    const fontScale = input.fontScale ?? null;
    const backgroundMode = input.backgroundMode || null;
    const textureStrength = input.textureStrength ?? null;
    const glassBlur = input.glassBlur ?? null;
    const borderStrength = input.borderStrength ?? null;
    const controlScale = input.controlScale ?? null;

    const out = {};
    if (mainColor) out.mainColor = mainColor;
    if (accentColor) out.accentColor = accentColor;
    if (textColor) out.textColor = textColor;
    if (textBg) out.textBg = textBg;
    if (borderColor) out.borderColor = borderColor;
    if (artistColor) out.artistColor = artistColor;
    if (downloadColor) out.downloadColor = downloadColor;
    if (surfaceOpacity != null) out.surfaceOpacity = Number(surfaceOpacity);
    if (glowIntensity != null) out.glowIntensity = Number(glowIntensity);
    if (radiusScale != null) out.radiusScale = Number(radiusScale);
    if (spacingScale != null) out.spacingScale = Number(spacingScale);
    if (fontScale != null) out.fontScale = Number(fontScale);
    if (backgroundMode) out.backgroundMode = backgroundMode;
    if (textureStrength != null) out.textureStrength = Number(textureStrength);
    if (glassBlur != null) out.glassBlur = Number(glassBlur);
    if (borderStrength != null) out.borderStrength = Number(borderStrength);
    if (controlScale != null) out.controlScale = Number(controlScale);
    return Object.keys(out).length ? out : null;
  }

  function toLegacy(theme){
    const normalized = normalizeTheme(theme);
    if (!normalized) return null;
    return {
      main: normalized.mainColor,
      accent: normalized.accentColor
    };
  }

  function loadTheme(){
    const modern = normalizeTheme(safeParse(localStorage.getItem(THEME_KEY)));
    if (modern) return modern;
    const legacy = normalizeTheme(safeParse(localStorage.getItem(LEGACY_KEY)));
    return legacy;
  }

  function saveTheme(theme){
    const normalized = normalizeTheme(theme);
    if (!normalized) return null;
    localStorage.setItem(THEME_KEY, JSON.stringify(normalized));
    const legacy = toLegacy(normalized);
    if (legacy) localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));
    try {
      window.dispatchEvent(new CustomEvent("theme:bridge-saved", {
        detail: {
          primary: normalized.mainColor || null,
          accent: normalized.accentColor || null,
          theme: normalized
        }
      }));
    } catch {}
    return normalized;
  }

  function syncThemeStorage(){
    const theme = loadTheme();
    if (!theme) return null;
    return saveTheme(theme);
  }

  window.G73ThemeBridge = {
    THEME_KEY,
    LEGACY_KEY,
    safeParse,
    normalizeTheme,
    loadTheme,
    saveTheme,
    syncThemeStorage,
    toLegacy,
  };

  syncThemeStorage();
})();
