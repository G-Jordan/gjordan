// js/theme/theme-preview.js
(function(){
  function previewTheme(){
    const $ = (id) => document.getElementById(id);
    const mainColor = $("mainThemeColor")?.value || getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const accentColor = $("accentColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const textColor = $("textColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
    const textBg = $("textBgColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--white-faint').trim();
    const borderColor = $("borderColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--glow-color').trim();
    const artistColor = $("artistColorPicker")?.value || getComputedStyle(document.documentElement).getPropertyValue('--artist-color').trim();

    const root = document.documentElement.style;
    root.setProperty('--primary-color', mainColor);
    root.setProperty('--glow-color', mainColor);
    root.setProperty('--accent-color', accentColor);
    root.setProperty('--text-muted', textColor);
    root.setProperty('--white-faint', textBg);
    root.setProperty('--glow-border', `1px solid ${borderColor}`);
    root.setProperty('--artist-color', artistColor);
    
  }

  window.previewTheme = previewTheme;
})();