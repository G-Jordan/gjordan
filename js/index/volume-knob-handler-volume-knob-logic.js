
  (function(){
    const knob = document.getElementById('volume-knob');
    const label = document.getElementById('knob-label');
    const audio = document.getElementById('main-audio');
    if (!knob || !label || !audio) return;

    const svg   = knob.querySelector('svg');
    const arc   = knob.querySelector('.arc');
    const handle= knob.querySelector('.handle');

    const R = 34;
    const CX = 50, CY = 50;
    const MIN_ANG = -135;
    const MAX_ANG =  135;

    const VOL_KEY = 'playerVolume';

    const clamp = (n, a, b)=> Math.max(a, Math.min(b, n));

    function setArcPath(fromDeg, toDeg){
      const p2c = (cx, cy, r, deg)=>{
        const rad = (deg-90) * Math.PI/180;
        return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
      };
      const start = p2c(CX, CY, R, fromDeg);
      const end   = p2c(CX, CY, R, toDeg);
      let sweep = toDeg - fromDeg;
      if (sweep < 0) sweep += 360;
      const largeArc = sweep >= 180 ? 1 : 0;
      const d = `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
      arc.setAttribute('d', d);
    }

    function angleForVolume(v){ return MIN_ANG + (MAX_ANG - MIN_ANG) * v; }
    function volumeForAngle(deg){ return clamp((deg - MIN_ANG) / (MAX_ANG - MIN_ANG), 0, 1); }

    function updateVisual(v){
      const vol = clamp(v, 0, 1);
      const deg = angleForVolume(vol);

      setArcPath(MIN_ANG, deg);

      const rad = (deg-90) * Math.PI/180;
      const hx = CX + R * Math.cos(rad);
      const hy = CY + R * Math.sin(rad);
      handle.setAttribute('cx', hx);
      handle.setAttribute('cy', hy);

      const pct = Math.round(vol*100);
      label.textContent = pct + '%';
      knob.setAttribute('aria-valuenow', pct);
      knob.setAttribute('aria-valuetext', pct + '%');
    }

    function setVolume(v, fromUser=false){
      v = clamp(v, 0, 1);
      audio.volume = v;
      updateVisual(v);
      if (fromUser) {
        try { localStorage.setItem(VOL_KEY, String(v)); } catch {}
      }
    }

    let initial = 1;
    try {
      const saved = localStorage.getItem(VOL_KEY);
      if (saved != null && !isNaN(saved)) initial = clamp(parseFloat(saved), 0, 1);
    } catch{}
    setVolume(initial, false);

    audio.addEventListener('volumechange', ()=> updateVisual(audio.volume), {passive:true});

    let dragging = false;
    function getAngleFromEvent(e){
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top  + rect.height/2;
      const x = (e.clientX != null) ? e.clientX : (e.touches?.[0]?.clientX || 0);
      const y = (e.clientY != null) ? e.clientY : (e.touches?.[0]?.clientY || 0);
      const dx = x - cx;
      const dy = y - cy;
      let deg = Math.atan2(dy, dx) * 180/Math.PI + 90; // 0° at top
      if (deg > 180) deg -= 360;                        // normalize
      deg = clamp(deg, MIN_ANG, MAX_ANG);               // clamp to arc
      return deg;
    }

    const onDown = (e)=>{ dragging = true; knob.focus(); e.preventDefault(); };
    const onMove = (e)=>{
      if (!dragging) return;
      const deg = getAngleFromEvent(e);
      setVolume(volumeForAngle(deg), true);
      e.preventDefault();
    };
    const onUp = ()=>{ dragging = false; };

    knob.addEventListener('pointerdown', onDown, {passive:false});
    window.addEventListener('pointermove', onMove, {passive:false});
    window.addEventListener('pointerup', onUp, {passive:true});

    knob.addEventListener('touchstart', onDown, {passive:false});
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', onUp, {passive:true});

    knob.addEventListener('wheel', (e)=>{
      e.preventDefault();
      const step = (e.deltaY < 0 ? 0.04 : -0.04);
      setVolume(audio.volume + step, true);
    }, {passive:false});

    knob.addEventListener('keydown', (e)=>{
      let v = audio.volume;
      const fine = 0.02, coarse = 0.1;
      switch(e.key){
        case 'ArrowRight':
        case 'ArrowUp':   setVolume(v + fine, true); e.preventDefault(); break;
        case 'ArrowLeft':
        case 'ArrowDown': setVolume(v - fine, true); e.preventDefault(); break;
        case 'PageUp':    setVolume(v + coarse, true); e.preventDefault(); break;
        case 'PageDown':  setVolume(v - coarse, true); e.preventDefault(); break;
        case 'Home':      setVolume(0, true); e.preventDefault(); break;
        case 'End':       setVolume(1, true); e.preventDefault(); break;
        case 'm':
        case 'M':
          if (audio.volume > 0){ knob._lastVol = audio.volume; setVolume(0, true); }
          else setVolume(Math.max(0, Math.min(knob._lastVol || 0.6, 1)), true);
          e.preventDefault();
          break;
      }
    });

  })();
  