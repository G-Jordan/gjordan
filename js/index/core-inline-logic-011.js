
  (function(){
    const btn = document.getElementById('vz-open-editor');
    if(!btn) return;

    btn.innerHTML = `
      <svg class="vz-orb" viewBox="0 0 48 48" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="vz-g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stop-color="#4ad6ff"/>
            <stop offset="100%" stop-color="#b07bff"/>
          </linearGradient>
          <linearGradient id="vz-g2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stop-color="#59ffc8"/>
            <stop offset="100%" stop-color="#ff8af5"/>
          </linearGradient>
          <filter id="vz-softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- Stationary group; only dash properties animate for “wavy” feel -->
        <g class="no-reduce">
          <!-- Outer ring (gentle wave) -->
          <g filter="url(#vz-softGlow)">
            <circle cx="24" cy="24" r="13.2" fill="none" stroke="url(#vz-g1)"
              stroke-width="2.6" stroke-linecap="round" pathLength="100"
              style="animation: dash-wave 2.8s ease-in-out infinite;" />
          </g>
          <!-- Inner ring (counter-phase wave) -->
          <g>
            <circle cx="24" cy="24" r="9.4" fill="none" stroke="url(#vz-g2)"
              stroke-width="2.2" stroke-linecap="round" pathLength="100"
              style="animation: dash-wave-2 3.4s ease-in-out infinite;" />
          </g>
          <!-- Soft center dot -->
          <circle cx="24" cy="24" r="2.6" fill="#a7d8ff" fill-opacity=".65"/>
        </g>
      </svg>
    `;

    // Keep it keyboard-accessible
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    }, {passive:true});
  })();
  