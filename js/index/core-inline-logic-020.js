// js/index/core-inline-logic-020.js
(function(){
  const ga = (eventName, params) => {
    if (typeof window.gtag === "function") window.gtag("event", eventName, params || {});
  };

  window.trackContactSubmitted = function(){
    ga("generate_lead", { method: "contact_form" });
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (a.host && a.host !== location.host) {
      ga("click_outbound", { link_url: a.href, link_domain: a.host });
    }
  });

  window.trackDownload = function(name, url){
    ga("file_download", { file_name: name, file_url: url });
  };

  window.addEventListener("player:play",  e => ga("play",  { track_id: e.detail?.id, track: e.detail?.name }));
  window.addEventListener("player:pause", e => ga("pause", { track_id: e.detail?.id, track: e.detail?.name }));
})();