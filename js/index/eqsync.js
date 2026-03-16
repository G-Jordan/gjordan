
    // Call this whenever your site theme changes.
    // Example: updateEQTheme('#ff3366', '#ffd300')
    function updateEQTheme(primary, accent){
      if (primary) document.documentElement.style.setProperty('--app-primary', primary);
      if (accent)  document.documentElement.style.setProperty('--app-accent',  accent);
      // eq.css derives --eq-accent1/2 from these instantly.
    }

    // Optional: listen for a custom event your app fires
    window.addEventListener('theme:changed', (e)=>{
      const { primary, accent } = e.detail || {};
      updateEQTheme(primary, accent);
    });
  