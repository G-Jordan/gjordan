
(function syncListTheme(){
  const src = document.querySelector('.controls[data-ctl-theme]') || document.querySelector('.controls');
  const dst = document.querySelector('.music-list');
  if (!src || !dst) return;

  const props = [
    '--prog-fill','--ctl-bg','--ctl-border','--ctl-text',
    '--ctl-ring','--ctl-list-accent1','--ctl-list-accent2',
    '--primary-color','--secondary-color','--mainThemeColor','--accentColor'
  ];
  const cs = getComputedStyle(src);
  props.forEach(p=>{
    const v = cs.getPropertyValue(p);
    if (v && v.trim()) dst.style.setProperty(p, v);
  });

  // Re-sync when your theme changes (attribute swap or custom event)
  const mo = new MutationObserver(()=> syncListTheme());
  mo.observe(src, { attributes: true, attributeFilter: ['data-ctl-theme','style','class'] });
  window.addEventListener('theme:changed', syncListTheme);
})();
