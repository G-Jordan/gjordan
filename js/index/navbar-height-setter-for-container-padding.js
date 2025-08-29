
    document.addEventListener('DOMContentLoaded', () => {
      const nav = document.querySelector('.navbar');
      if (nav) {
        const navHeight = nav.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--navbar-h', navHeight + 'px');
      }
    });
  