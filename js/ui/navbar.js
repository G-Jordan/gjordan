// js/ui/navbar.js
(function(){
  function toggleMenu(){
    const menu = document.getElementById("menu");
    const menuIcon = document.getElementById("menuIcon");
    const navbarTitle = document.querySelector(".navbar-title");
    const open = menu.classList.toggle("show");
    menuIcon.innerHTML = open ? "✖" : "☰";
    menuIcon.classList.toggle("open", open);
    navbarTitle.innerHTML = open ? "G Jordan’s World" : "GJordan.music";
  }
  window.toggleMenu = toggleMenu;
})();