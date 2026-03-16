// js/ui/password-visibility.js
(function(){
  window.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("modal-password");
    const togglePassword = document.getElementById("toggle-password");
    const toggleIcon = document.getElementById("toggle-icon");
    if (!passwordInput || !togglePassword || !toggleIcon) return;
    togglePassword.addEventListener("click", () => {
      const hidden = passwordInput.type === "password";
      passwordInput.type = hidden ? "text" : "password";
      toggleIcon.textContent = hidden ? "visibility_off" : "visibility";
    });
  });
})();