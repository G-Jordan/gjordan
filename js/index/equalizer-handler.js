
  (function () {
    const openBtn = document.getElementById('open-eq');
    const modal   = document.getElementById('eq-modal');

    if (!openBtn || !modal) {
      console.warn('[EQ] Missing #open-eq or #eq-modal in DOM.');
      return;
    }

    function showEQ() {
      modal.removeAttribute('hidden');
      modal.setAttribute('aria-hidden', 'false');

      const ctx = window.audioCtx || window.AudioContextInstance;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume?.();
      }
    }

    function hideEQ() {
      modal.setAttribute('hidden', '');
      modal.setAttribute('aria-hidden', 'true');
    }

    openBtn.addEventListener('click', (e) => { e.preventDefault(); showEQ(); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) hideEQ();
    });

    // backdrop close (click outside content)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideEQ();
    });

    modal.querySelectorAll('[data-eq-close]').forEach(btn => {
      btn.addEventListener('click', hideEQ);
    });

    window.__EQModal = { showEQ, hideEQ };
  })();
  