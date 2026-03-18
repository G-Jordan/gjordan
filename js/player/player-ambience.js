(function(){
  "use strict";

  const root = document.documentElement;
  const STAR_KEY = 'g73-starfield-v1';
  const defaults = {
    enabled: true,
    count: 180,
    size: 1.6,
    twinkle: 0.45,
    speed: 0.18,
    colorMode: 'theme',
    color: '#ffffff'
  };

  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function safeParse(raw){ try { return JSON.parse(raw); } catch { return null; } }
  function hexToRgb(hex){
    const m = String(hex || '').trim().match(/^#?([\da-f]{6})$/i);
    if (!m) return { r:255, g:255, b:255 };
    const v = parseInt(m[1], 16);
    return { r:(v>>16)&255, g:(v>>8)&255, b:v&255 };
  }
  function mix(a,b,t){ return Math.round(a + (b-a) * t); }
  function getTheme(){
    const cs = getComputedStyle(root);
    const primary = (cs.getPropertyValue('--app-primary') || '#5fa0ff').trim() || '#5fa0ff';
    const accent = (cs.getPropertyValue('--app-accent') || '#b478ff').trim() || '#b478ff';
    const glow = (cs.getPropertyValue('--g73-loader-yellow') || '').trim();
    return { primary, accent, glow: glow || accent };
  }
  function loadStarfield(){
    const saved = safeParse(localStorage.getItem(STAR_KEY));
    return Object.assign({}, defaults, saved || {});
  }
  function saveStarfield(next){
    try { localStorage.setItem(STAR_KEY, JSON.stringify(next)); } catch {}
  }

  function syncLoaderTheme(){
    const theme = getTheme();
    const p = theme.primary;
    const a = theme.accent;
    const pr = hexToRgb(p), ar = hexToRgb(a);
    const mid = `rgb(${mix(pr.r, ar.r, 0.5)}, ${mix(pr.g, ar.g, 0.5)}, ${mix(pr.b, ar.b, 0.5)})`;
    root.style.setProperty('--g73-loader-green', p);
    root.style.setProperty('--g73-loader-purple', a);
    root.style.setProperty('--g73-loader-yellow', mid);

    const overlay = document.querySelector('#g73VinylLoader');
    if (!overlay) return;
    overlay.querySelectorAll('[data-g73-primary]').forEach(el => el.setAttribute('fill', p));
    overlay.querySelectorAll('[data-g73-accent]').forEach(el => el.setAttribute('fill', a));
    overlay.querySelectorAll('[data-g73-tertiary]').forEach(el => el.setAttribute('fill', mid));
    overlay.querySelectorAll('[data-g73-stop="0"]').forEach(el => el.setAttribute('stop-color', p));
    overlay.querySelectorAll('[data-g73-stop="1"]').forEach(el => el.setAttribute('stop-color', a));
    overlay.querySelectorAll('[data-g73-stop="2"]').forEach(el => el.setAttribute('stop-color', mid));
  }

  class G73Starfield {
    constructor(){
      this.canvas = null;
      this.gl = null;
      this.program = null;
      this.buffer = null;
      this.raf = 0;
      this.visible = true;
      this.options = loadStarfield();
      this.stars = [];
      this.vertexData = new Float32Array(0);
      this.last = 0;
      this.inject();
      this.bind();
      this.rebuild();
      this.resize();
      this.start();
    }
    inject(){
      const wrapper = document.querySelector('.wrapper');
      if (!wrapper) return;
      this.canvas = document.getElementById('audio-starfield');
      if (!this.canvas){
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'audio-starfield';
        wrapper.insertBefore(this.canvas, wrapper.firstChild);
      }
      this.canvas.setAttribute('aria-hidden', 'true');
      this.gl = this.canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:true, preserveDrawingBuffer:false })
             || this.canvas.getContext('experimental-webgl');
      if (!this.gl) return;
      const vs = `
        attribute vec2 a_position;
        attribute float a_size;
        attribute float a_alpha;
        uniform vec2 u_resolution;
        uniform float u_scale;
        varying float v_alpha;
        void main() {
          vec2 zeroToOne = a_position / u_resolution;
          vec2 zeroToTwo = zeroToOne * 2.0;
          vec2 clip = zeroToTwo - 1.0;
          gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
          gl_PointSize = a_size * u_scale;
          v_alpha = a_alpha;
        }
      `;
      const fs = `
        precision mediump float;
        uniform vec3 u_color;
        varying float v_alpha;
        void main(){
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          float glow = smoothstep(0.5, 0.0, d);
          float core = smoothstep(0.18, 0.0, d);
          float alpha = max(glow * 0.55, core) * v_alpha;
          gl_FragColor = vec4(u_color, alpha);
        }
      `;
      const program = this.createProgram(vs, fs);
      if (!program) return;
      this.program = program;
      this.buffer = this.gl.createBuffer();
      this.aPosition = this.gl.getAttribLocation(program, 'a_position');
      this.aSize = this.gl.getAttribLocation(program, 'a_size');
      this.aAlpha = this.gl.getAttribLocation(program, 'a_alpha');
      this.uResolution = this.gl.getUniformLocation(program, 'u_resolution');
      this.uScale = this.gl.getUniformLocation(program, 'u_scale');
      this.uColor = this.gl.getUniformLocation(program, 'u_color');
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
    createShader(type, src){
      const gl = this.gl; if (!gl) return null;
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
      return sh;
    }
    createProgram(vsSrc, fsSrc){
      const gl = this.gl; if (!gl) return null;
      const vs = this.createShader(gl.VERTEX_SHADER, vsSrc);
      const fs = this.createShader(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
      return program;
    }
    bind(){
      window.addEventListener('resize', () => this.resize(), { passive:true });
      document.addEventListener('visibilitychange', () => { this.visible = document.visibilityState !== 'hidden'; });
      window.addEventListener('theme:changed', () => syncLoaderTheme(), { passive:true });
      window.addEventListener('storage', (e) => {
        if (e.key === STAR_KEY) {
          this.options = loadStarfield();
          this.rebuild();
        }
        if (e.key === 'themeSettings' || e.key === 'siteThemeV1') syncLoaderTheme();
      }, { passive:true });
    }
    resize(){
      if (!this.canvas || !this.gl) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    rebuild(){
      const count = clamp(Number(this.options.count || defaults.count), 20, 900);
      this.stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: 0.5 + Math.random() * Math.max(0.4, Number(this.options.size || defaults.size)) * (0.55 + Math.random()*0.8),
        alpha: 0.28 + Math.random() * 0.72,
        phase: Math.random() * Math.PI * 2,
        drift: 0.15 + Math.random() * 0.85
      }));
      this.vertexData = new Float32Array(count * 4);
    }
    setOptions(next){
      this.options = Object.assign({}, this.options, next || {});
      saveStarfield(this.options);
      this.rebuild();
      this.draw(performance.now());
    }
    getOptions(){ return Object.assign({}, this.options); }
    resolveColor(){
      const mode = this.options.colorMode || 'theme';
      if (mode === 'custom') return hexToRgb(this.options.color || '#ffffff');
      if (mode === 'white') return { r:255, g:255, b:255 };
      const theme = getTheme();
      const a = hexToRgb(theme.primary), b = hexToRgb(theme.accent);
      return { r:mix(a.r, b.r, 0.35), g:mix(a.g, b.g, 0.35), b:mix(a.b, b.b, 0.35) };
    }
    start(){
      const tick = (t) => {
        this.raf = requestAnimationFrame(tick);
        this.draw(t);
      };
      this.raf = requestAnimationFrame(tick);
    }
    draw(now){
      if (!this.canvas || !this.gl || !this.program) return;
      if (!this.options.enabled || !this.visible){
        this.gl.clearColor(0,0,0,0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        return;
      }
      const gl = this.gl;
      const w = this.canvas.width, h = this.canvas.height;
      if (!w || !h) return;
      const delta = this.last ? Math.min(64, now - this.last) : 16;
      this.last = now;
      const speed = Number(this.options.speed || defaults.speed);
      const twinkle = Number(this.options.twinkle || defaults.twinkle);
      for (let i=0; i<this.stars.length; i++){
        const star = this.stars[i];
        star.phase += 0.007 * twinkle * delta;
        star.y += (0.000012 * speed * star.drift * delta);
        if (star.y > 1.05) {
          star.y = -0.04;
          star.x = Math.random();
          star.phase = Math.random() * Math.PI * 2;
        }
        const alpha = clamp(star.alpha * (0.72 + Math.sin(star.phase) * 0.28), 0.12, 1);
        const base = i * 4;
        this.vertexData[base] = star.x * w;
        this.vertexData[base+1] = star.y * h;
        this.vertexData[base+2] = star.size * (0.7 + Math.sin(star.phase * 0.6) * 0.2 + 0.3);
        this.vertexData[base+3] = alpha;
      }
      const color = this.resolveColor();
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.DYNAMIC_DRAW);
      const stride = 4 * 4;
      gl.enableVertexAttribArray(this.aPosition);
      gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(this.aSize);
      gl.vertexAttribPointer(this.aSize, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(this.aAlpha);
      gl.vertexAttribPointer(this.aAlpha, 1, gl.FLOAT, false, stride, 12);
      gl.uniform2f(this.uResolution, w, h);
      gl.uniform1f(this.uScale, Math.min(window.devicePixelRatio || 1, 2));
      gl.uniform3f(this.uColor, color.r / 255, color.g / 255, color.b / 255);
      gl.drawArrays(gl.POINTS, 0, this.stars.length);
    }
  }

  function boot(){
    syncLoaderTheme();
    if (!window.G73Starfield) window.G73Starfield = new G73Starfield();
    else syncLoaderTheme();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
