// js/theme/theme-init.js
(function(){
  const savedTheme = localStorage.getItem("themeSettings");
  if (!savedTheme) return;
  try {
    const theme = JSON.parse(savedTheme);
    const cssVars = [];
    if (theme.mainColor) cssVars.push(`--primary-color: ${theme.mainColor}; --glow-color: ${theme.mainColor};`);
    if (theme.accentColor) cssVars.push(`--accent-color: ${theme.accentColor};`);
    if (theme.textColor) cssVars.push(`--text-muted: ${theme.textColor};`);
    if (theme.textBg) cssVars.push(`--white-faint: ${theme.textBg};`);
    if (theme.borderColor) cssVars.push(`--glow-border: 1px solid ${theme.borderColor};`);
    if (theme.artistColor) cssVars.push(`--artist-color: ${theme.artistColor};`);
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `:root { ${cssVars.join(" ")} }`;
    document.head.appendChild(styleTag);
    window.addEventListener("DOMContentLoaded", () => { window.previewTheme?.(); });
  } catch (e) { console.warn("Theme load error:", e); }
})();