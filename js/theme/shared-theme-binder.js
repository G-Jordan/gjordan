/*
 * Shared Theme Binder
 * Normalizes app-level theme vars from existing storage + live CSS vars.
 * Safe to include on any page; does not overwrite page-specific theming logic.
 */
(function(){
  const root = document.documentElement;
  const first = (...xs) => xs.find(x => (x || '').toString().trim())?.toString().trim() || '';
  const getVar = (el, name) => getComputedStyle(el || root).getPropertyValue(name).trim();

  function detectTheme(){
    const bridgeTheme = window.G73ThemeBridge?.loadTheme?.() || null;
    if (bridgeTheme?.mainColor && bridgeTheme?.accentColor) {
      return { primary: bridgeTheme.mainColor, accent: bridgeTheme.accentColor, extras: bridgeTheme, source: 'bridge' };
    }
    const controls = document.querySelector('.controls');
    return {
      primary: first(
        getVar(root, '--app-primary'),
        getVar(root, '--mainThemeColor'),
        getVar(root, '--theme-primary'),
        getVar(root, '--primary-color'),
        getVar(controls, '--app-primary'),
        getVar(controls, '--mainThemeColor'),
        getVar(controls, '--theme-primary'),
        getVar(controls, '--primary-color'),
        '#5fa0ff'
      ),
      accent: first(
        getVar(root, '--app-accent'),
        getVar(root, '--accentColor'),
        getVar(root, '--theme-accent'),
        getVar(root, '--accent-color'),
        getVar(controls, '--app-accent'),
        getVar(controls, '--accentColor'),
        getVar(controls, '--theme-accent'),
        getVar(controls, '--accent-color'),
        '#b478ff'
      ),
      source: 'css'
    };
  }

  let lastKey = '';
  function setDerivedThemeVars(extras = {}){
    const surfaceOpacity = Number.isFinite(extras.surfaceOpacity) ? extras.surfaceOpacity : 0.4;
    const glowIntensity = Number.isFinite(extras.glowIntensity) ? extras.glowIntensity : 1;
    const textureStrength = Number.isFinite(extras.textureStrength) ? extras.textureStrength : 0.14;
    root.style.setProperty('--theme-surface-opacity', String(surfaceOpacity));
    root.style.setProperty('--theme-glow-intensity', String(glowIntensity));
    root.style.setProperty('--theme-texture-strength', String(textureStrength));
    root.style.setProperty('--theme-surface-percent', `${Math.round(surfaceOpacity * 100)}%`);
    root.style.setProperty('--theme-texture-percent', `${Math.round(textureStrength * 100)}%`);
    root.style.setProperty('--theme-ring-soft-percent', `${Math.min(72, Math.max(6, Math.round(18 * glowIntensity)))}%`);
    root.style.setProperty('--theme-ring-strong-percent', `${Math.min(84, Math.max(8, Math.round(24 * glowIntensity)))}%`);
    root.style.setProperty('--theme-border-percent', `${Math.min(72, Math.max(8, Math.round(26 * (Number.isFinite(extras.borderStrength) ? extras.borderStrength : 1))))}%`);
  }

  function applyTheme(theme){
    if (!theme?.primary || !theme?.accent) return;
    const extras = theme.extras || window.G73ThemeBridge?.loadTheme?.() || {};
    const key = `${theme.primary}__${theme.accent}__${extras.surfaceOpacity ?? ''}__${extras.glowIntensity ?? ''}__${extras.radiusScale ?? ''}__${extras.spacingScale ?? ''}__${extras.fontScale ?? ''}__${extras.backgroundMode ?? ''}__${extras.textureStrength ?? ''}__${extras.glassBlur ?? ''}__${extras.borderStrength ?? ''}__${extras.controlScale ?? ''}`;
    if (key === lastKey) return;
    lastKey = key;
    root.style.setProperty('--app-primary', theme.primary);
    root.style.setProperty('--app-accent', theme.accent);
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--prog-fill', `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`);
    if (extras.textColor) root.style.setProperty('--text-muted', extras.textColor);
    if (extras.textBg) root.style.setProperty('--white-faint', extras.textBg);
    if (extras.artistColor) root.style.setProperty('--artist-color', extras.artistColor);
    setDerivedThemeVars(extras);
    if (Number.isFinite(extras.radiusScale)) root.style.setProperty('--theme-radius-scale', String(extras.radiusScale));
    if (Number.isFinite(extras.spacingScale)) root.style.setProperty('--theme-spacing-scale', String(extras.spacingScale));
    if (Number.isFinite(extras.fontScale)) root.style.setProperty('--theme-font-scale', String(extras.fontScale));
    if (extras.backgroundMode) root.setAttribute('data-theme-bg', extras.backgroundMode);
    if (Number.isFinite(extras.glassBlur)) root.style.setProperty('--theme-glass-blur', String(extras.glassBlur));
    if (Number.isFinite(extras.borderStrength)) root.style.setProperty('--theme-border-strength', String(extras.borderStrength));
    if (Number.isFinite(extras.controlScale)) root.style.setProperty('--theme-control-scale', String(extras.controlScale));
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { primary: theme.primary, accent: theme.accent, extras, source: theme.source || 'shared-binder' } }));
  }

  let queued = false;
  function queueApply(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyTheme(detectTheme());
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueApply, { once: true });
  else queueApply();

  window.addEventListener('storage', (e) => {
    if (e.key === 'themeSettings' || e.key === 'siteThemeV1') queueApply();
  }, { passive: true });
  window.addEventListener('theme:bridge-saved', queueApply, { passive: true });

  const mo = new MutationObserver(queueApply);
  mo.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  window.G73SharedThemeBinder = { apply: queueApply, detectTheme };

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, { once: true });
  }
})();
