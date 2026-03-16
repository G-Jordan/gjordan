
(() => {
  let rafId, stopId;
  const onScroll = () => {
    // throttle via rAF so we don’t spam
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      document.body.classList.add('is-scrolling');
      clearTimeout(stopId);
      stopId = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150); // resume shortly after scroll stops
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();
