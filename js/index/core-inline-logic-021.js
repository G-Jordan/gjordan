
  // ---- SPA virtual page views (skip this if your site is NOT an SPA) ----
  // Fires a GA4 page_view whenever the route changes.
  function trackVirtualPageView(path){
    gtag('event', 'page_view', {
      page_location: location.origin + path,
      page_path: path,
      page_title: document.title
    });
  }

  (function(){
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    function onRouteChange(){
      const path = location.pathname + location.search + location.hash;
      trackVirtualPageView(path);
    }

    history.pushState = function(...args){ origPush.apply(this, args); onRouteChange(); };
    history.replaceState = function(...args){ origReplace.apply(this, args); onRouteChange(); };
    window.addEventListener('popstate', onRouteChange);

    // initial view for SPAs
    onRouteChange();
  })();
