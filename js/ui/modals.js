// js/ui/modals.js
(function(){
  function showThemeModal(){ try { window.syncThemeInputsFromCSS?.(); } catch(e){}; document.getElementById("theme-modal").style.display = "block"; }
  function closeThemeModal(){ document.getElementById("theme-modal").style.display = "none"; }
  window.showThemeModal = showThemeModal;
  window.closeThemeModal = closeThemeModal;
})();