// js/ui/password-check.js
(function(){
  window.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("modal-password");
    if (!passwordInput) return;
    const byId = (id) => document.getElementById(id);
    const len = byId("length-check"), up = byId("upper-check"), low = byId("lower-check"), num = byId("number-check");
    passwordInput.addEventListener("input", () => {
      const val = passwordInput.value;
      if (len) len.style.color = val.length >= 8 ? "limegreen" : "red";
      if (up) up.style.color = /[A-Z]/.test(val) ? "limegreen" : "red";
      if (low) low.style.color = /[a-z]/.test(val) ? "limegreen" : "red";
      if (num) num.style.color = /\d/.test(val) ? "limegreen" : "red";
    });
  });
})();