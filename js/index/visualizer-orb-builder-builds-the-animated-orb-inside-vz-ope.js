
  (function(){
    const btn = document.getElementById('vz-open-editor');
    if(!btn) return;

    btn.innerHTML = `
      <svg class="vz-orb" viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="vz-g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stop-color="#4ad6ff"/>
            <stop offset="50%" stop-color="#7aa6ff"/>
            <stop offset="100%" stop-color="#b07bff"/>
            <animateTransform attributeName="gradientTransform" type="rotate" from="0 0.5 0.5" to="360 0.5 0.5" dur="14s" repeatCount="indefinite"/>
          </linearGradient>
          <linearGradient id="vz-g2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stop-color="#59ffc8"/>
            <stop offset="50%" stop-color="#66b3ff"/>
            <stop offset="100%" stop-color="#ff8af5"/>
            <animateTransform attributeName="gradientTransform" type="rotate" from="360 0.5 0.5" to="0 0.5 0.5" dur="18s" repeatCount="indefinite"/>
          </linearGradient>
          <filter id="vz-softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g class="no-reduce" style="transform-origin:24px 24px; animation: orb-spin 7.5s linear infinite, orb-breathe 5.6s ease-in-out infinite;">
          <g filter="url(#vz-softGlow)">
            <circle cx="24" cy="24" r="13.2" fill="none" stroke="url(#vz-g1)"
              stroke-width="2.6" stroke-linecap="round" stroke-dasharray="12 10" pathLength="100"
              class="no-reduce" style="animation: dash-flow 3.2s linear infinite;" />
          </g>
          <g style="transform-origin:24px 24px; animation: orb-spin 11s linear reverse infinite;">
            <circle cx="24" cy="24" r="9.4" fill="none" stroke="url(#vz-g2)"
              stroke-width="2.2" stroke-linecap="round" pathLength="100"
              class="no-reduce" style="animation: dash-flow 4.1s linear infinite;" />
          </g>
          <circle cx="24" cy="24" r="2.4" fill="#a7d8ff" fill-opacity=".6"/>
        </g>
      </svg>
    `;

    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    }, {passive:true});
  })();
  