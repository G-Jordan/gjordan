// js/ui/toast.js
(function(){
  function showToast(message){
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = message;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
  }
  window.showToast = showToast;
})();