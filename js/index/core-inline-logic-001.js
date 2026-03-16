
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }

  // 1) Consent Mode defaults (safe & tweakable later)
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });

  // 2) Init + config
  gtag('js', new Date());
  gtag('config', 'G-L48EX09QBQ', {
    send_page_view: true,
    // Helpful while developing locally:
    ...(location.hostname === 'localhost' ? { debug_mode: true } : {})
  });
