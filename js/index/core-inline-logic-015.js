
/*!
 * G73 EQ Button Animator – Fixed Gradient (Blue → Purple)
 * - Always uses same gradient for bars
 * - Circular button, smooth animation, "EQ" overlay
 */
(function(){
  const btn = document.getElementById('open-eq');
  if(!btn) return;

  // ---------- Scoped CSS ----------
  const css = `
  #open-eq.eq-fab{
    --eqbtn-size: 64px;
    --eqbtn-bg: color-mix(in srgb, #0b0f14 78%, transparent);
    --eqbtn-border: rgba(255,255,255,.12);
    --eqbtn-ring: rgba(120,200,255,.35);

    width: var(--eqbtn-size) !important;
    height: var(--eqbtn-size) !important;
    border-radius: 50% !important;
    display: grid !important; place-items: center !important;
    background: var(--eqbtn-bg) !important;
    border: 1px solid var(--eqbtn-border) !important;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 8px 22px rgba(0,0,0,.45) !important;
    padding: 0 !important;
    position: relative !important;
    overflow: hidden !important;
  }
  #open-eq.eq-fab:hover{
    box-shadow: 0 10px 28px rgba(0,0,0,.5), 0 0 0 3px var(--eqbtn-ring) !important;
    transform: translateY(-1px);
  }
  #open-eq .eq-ico{ width: 66%; height: 66%; display:block; }
  #open-eq .eq-ico .bar{
    transform-origin: 50% 100%;
    animation: g73-eq-bounce 2.25s cubic-bezier(.42,0,.2,1) infinite;
    animation-play-state: paused;
  }
  #open-eq.is-playing .eq-ico .bar{ animation-play-state: running; }
  #open-eq:not(.is-playing) .eq-ico .bar{
    animation: g73-eq-idle 6.6s cubic-bezier(.42,0,.2,1) infinite;
    animation-play-state: running; opacity: .9;
  }
  @media (prefers-reduced-motion: reduce){
    #open-eq .eq-ico .bar{ animation: none !important; }
  }
  #open-eq .eq-label{
    position: absolute; inset: 0;
    display: grid; place-items: center;
    pointer-events: none; user-select: none;
    font-weight: 800; letter-spacing: .04em; font-size: 14px;
    color: #ffffff;
    text-shadow: 0 0 2px rgba(0,0,0,.55), 0 1px 6px rgba(0,0,0,.45);
  }
  #open-eq .eq-label::after{
    content: '';
    position: absolute; width: 46%; height: 1px; bottom: 16%;
    left: 27%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
    filter: blur(.3px);
  }
  @keyframes g73-eq-bounce{
    0%   { transform: scaleY(.28); }
    18%  { transform: scaleY(.92); }
    36%  { transform: scaleY(.44); }
    54%  { transform: scaleY(.80); }
    72%  { transform: scaleY(.38); }
    100% { transform: scaleY(.70); }
  }
  @keyframes g73-eq-idle{
    0%,100%{ transform: scaleY(.42); }
    50%    { transform: scaleY(.56); }
  }
  `;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

  // ---------- Render ----------
  function render(){
    btn.innerHTML = `
      <svg class="eq-ico" viewBox="0 0 48 48" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="g73-eq-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#5fa0ff"/>
            <stop offset="100%" stop-color="#b478ff"/>
          </linearGradient>
          <filter id="g73-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g filter="url(#g73-soft)">
          <rect class="bar" x="8.5"  y="10" width="5" height="28" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.00s"></rect>
          <rect class="bar" x="17.5" y="6"  width="5" height="32" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.30s"></rect>
          <rect class="bar" x="26.5" y="12" width="5" height="26" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.60s"></rect>
          <rect class="bar" x="35.5" y="4"  width="5" height="34" rx="2.5" fill="url(#g73-eq-grad)" style="animation-delay:-0.90s"></rect>
          <rect class="bar" x="22"   y="8"  width="3" height="30" rx="1.5" fill="url(#g73-eq-grad)" style="animation-delay:-1.20s; opacity:.9"></rect>
        </g>
      </svg>
      <div class="eq-label">EQ</div>
    `;
  }

  render();

  // ---------- Playback state ----------
  const audio = document.getElementById('main-audio');
  if (audio){
    const setState = ()=> btn.classList.toggle('is-playing', !audio.paused && !audio.ended && audio.currentTime > 0);
    ['play','playing','pause','ended','timeupdate'].forEach(ev=>audio.addEventListener(ev, setState, {passive:true}));
    setTimeout(setState, 0);
  }

  btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Open Equalizer');
})();
