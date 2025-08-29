
  // ---- Helpful custom events (contact, outbound, downloads, player) ----
  // Expose helpers globally so you can call them from any page/script.
  window.trackContactSubmitted = function(){
    gtag('event', 'generate_lead', { method: 'contact_form' });
  };

  // Extra outbound tracking (Enhanced Measurement handles most, this adds detail)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (a.host !== location.host) {
      gtag('event', 'click_outbound', { link_url: a.href, link_domain: a.host });
    }
  });

  window.trackDownload = function(name, url){
    gtag('event', 'file_download', { file_name: name, file_url: url });
  };

  // Optional: music player events (dispatch these from your player code)
  window.addEventListener('player:play',  e => {
    gtag('event','play',  { track_id: e.detail?.id, track: e.detail?.name });
  });
  window.addEventListener('player:pause', e => {
    gtag('event','pause', { track_id: e.detail?.id, track: e.detail?.name });
  });
