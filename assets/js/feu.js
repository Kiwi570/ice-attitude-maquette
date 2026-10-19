/* ICE Attitude — le feu : image du hero rendue en WebGL (OGL) avec fumée, braises,
   chaleur qui fait onduler l'air et ouverture « allumage ». Version 2D si WebGL est absent. */
(function () {
  'use strict';
  var ICE = window.ICE = window.ICE || {};

  var VERT = [
    'attribute vec2 uv;', 'attribute vec2 position;', 'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = vec4(position, 0., 1.); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform sampler2D tMap;',
    'uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uFire;',
    'uniform float uTime; uniform float uIntensity; uniform float uIntro; uniform float uDoux; uniform float uOut;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
    'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);',
    '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }',
    'float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }',
    'vec2 cover(vec2 uv){ float rs=uRes.x/uRes.y, ri=uImg.x/uImg.y; vec2 s = rs<ri ? vec2(rs/ri,1.) : vec2(1.,ri/rs); return (uv-.5)*s/1.06+.5; }',
    'float embers(vec2 uv, float t){',
    '  float asp = uRes.x/uRes.y; float acc = 0.;',
    '  for(int i=0;i<3;i++){',
    '    float fi = float(i);',
    '    vec2 g = vec2(asp, 1.)*(10. + fi*9.);',
    '    vec2 q = uv*g;',
    '    float sp = (1.2 + fi*.55)*(1. + uIntensity*1.8);',
    '    q.y -= t*sp; q.x += sin(q.y*.45 + fi*2. + t*.7)*(.55 + uIntensity*.4);',
    '    vec2 id = floor(q); vec2 f = fract(q) - .5;',
    '    float h = hash(id + fi*19.7);',
    '    vec2 o = vec2(hash(id+3.1)-.5, hash(id+7.3)-.5)*.55;',
    '    float d = length(f - o);',
    '    float on = step(.88 - uIntensity*.16 - (1.-uDoux)*.04, h);',
    '    float tw = .55 + .45*sin(t*(6.+h*9.) + h*40.);',
    '    acc += smoothstep(.095 - fi*.022, 0., d)*on*tw*(1.-fi*.22);',
    '  }',
    '  float col = exp(-pow((uv.x - uFire.x)*(1.6 - uIntensity*.5), 2.)*3.);',
    '  float hgt = smoothstep(uFire.y - .08, uFire.y + .05, uv.y)*(1. - smoothstep(uFire.y, 1.05, uv.y));',
    '  return acc*mix(col*hgt*1.6, .55, uDoux);',
    '}',
    'void main(){',
    '  vec2 uv = vUv; float t = uTime; float asp = uRes.x/uRes.y;',
    '  vec2 fa = vec2(uFire.x*asp, uFire.y); vec2 pa = vec2(uv.x*asp, uv.y);',
    '  float dFire = distance(pa, fa);',
    '  float haze = exp(-dFire*2.6)*(1.-uDoux*.6);',
    '  vec2 dis = vec2(noise(vec2(uv.x*9., uv.y*7. - t*1.9)), noise(vec2(uv.x*8. + 4., uv.y*6. - t*1.5))) - .5;',
    '  vec2 iuv = cover(uv + dis*.008*haze*(.6 + uIntensity*1.4));',
    '  vec3 col = texture2D(tMap, iuv).rgb;',
    '  col = pow(col, vec3(1.06))*(.86 + uIntensity*.12);',
    '  float flick = .82 + .18*sin(t*7.3)*sin(t*2.9 + 1.3) + .08*noise(vec2(t*3.,1.));',
    '  float glow = exp(-dFire*(4.2 - uIntensity*1.6));',
    '  vec3 warm = mix(vec3(1., .42, .12), vec3(1., .78, .45), uDoux);',
    '  col += warm*glow*(.3 + uIntensity*.6)*flick*(1. - uDoux*.45);',
    '  vec2 sp = vec2(pa.x*1.5, pa.y*1.3 - t*.05);',
    '  float sm = fbm(sp + vec2(fbm(sp*1.4 + t*.025), 0.));',
    '  float smMask = smoothstep(uFire.y - .1, uFire.y + .5, uv.y)*(.55 + .45*exp(-abs(uv.x - uFire.x)*2.));',
    '  col = mix(col, vec3(.6, .58, .52), sm*sm*.32*smMask*(1. + uIntensity*.6));',
    '  col += vec3(1., .58, .22)*embers(uv, t)*1.9;',
    '  float vig = smoothstep(1.25, .35, distance(uv, vec2(.5, .55))*1.3);',
    '  col *= mix(.55, 1., vig);',
    '  float r = uIntro*uIntro*2.6;',
    '  float reveal = smoothstep(r, r - .45, dFire);',
    '  vec3 dark = vec3(.035, .04, .03);',
    '  float seed = exp(-dFire*dFire*900.)*smoothstep(0., .15, uIntro)*(1. - smoothstep(.55, 1., uIntro));',
    '  col = mix(dark, col, clamp(reveal, 0., 1.)) + vec3(1., .5, .18)*seed*1.6*flick;',
    '  col = mix(col, dark, uOut*.65);',
    '  gl_FragColor = vec4(col, 1.);',
    '}'
  ].join('\n');

  function parsePair(s, def) {
    if (!s) return def;
    var a = s.split(',').map(parseFloat);
    return (a.length === 2 && !isNaN(a[0])) ? a : def;
  }

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  ICE.webgl = webglOK();

  /* ---------- Hero WebGL ---------- */
  ICE.Feu = function (canvas, img, opts) {
    opts = opts || {};
    var self = this;
    this.intensity = 0; this.target = 0; this.intro = opts.intro ? 0 : 1; this.out = 0;
    this.visible = true; this.ok = false;
    if (!ICE.webgl || !window.OGL) { this.fallback = new ICE.Braises2D(canvas, { mode: 'hero', doux: opts.doux }); return; }
    var O = window.OGL;
    var dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.25 : 1);
    var renderer;
    try { renderer = new O.Renderer({ canvas: canvas, dpr: dpr, alpha: false, antialias: false, powerPreference: 'high-performance' }); }
    catch (e) { this.fallback = new ICE.Braises2D(canvas, { mode: 'hero', doux: opts.doux }); return; }
    var gl = renderer.gl;
    var texture = new O.Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    var program = new O.Program(gl, {
      vertex: VERT, fragment: FRAG,
      uniforms: {
        tMap: { value: texture }, uRes: { value: [1, 1] }, uImg: { value: [16, 9] }, uFire: { value: [.6, .35] },
        uTime: { value: 0 }, uIntensity: { value: 0 }, uIntro: { value: this.intro }, uDoux: { value: opts.doux ? 1 : 0 }, uOut: { value: 0 }
      }
    });
    var mesh = new O.Mesh(gl, { geometry: new O.Triangle(gl), program: program });
    var fireD = parsePair(canvas.getAttribute('data-fire'), [.6, .4]);
    var fireM = parsePair(canvas.getAttribute('data-fire-mobile'), fireD);

    function fireScreen() {
      // position du feu dans l'image -> position à l'écran après recadrage « cover »
      var mobile = img.currentSrc && img.currentSrc.indexOf('mobile') > -1;
      var f = mobile ? fireM : fireD;
      var rs = canvas.clientWidth / Math.max(1, canvas.clientHeight), ri = program.uniforms.uImg.value[0] / program.uniforms.uImg.value[1];
      var s = rs < ri ? [rs / ri, 1] : [1, ri / rs];
      var x = (f[0] - .5) * 1.06 / s[0] + .5, y = (f[1] - .5) * 1.06 / s[1] + .5;
      program.uniforms.uFire.value = [x, y];
    }
    function resize() {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
      fireScreen();
    }
    function load() {
      texture.image = img;
      program.uniforms.uImg.value = [img.naturalWidth || 16, img.naturalHeight || 9];
      resize();
      self.ok = true;
      canvas.classList.add('is-pret');
      if (opts.onReady) opts.onReady();
    }
    if (img.complete && img.naturalWidth) load(); else img.addEventListener('load', load, { once: true });
    window.addEventListener('resize', function () { if (self.ok) resize(); });

    var t0 = performance.now(), last = t0, lent = 0, images = 0;
    this.render = function () {
      if (!self.ok || !self.visible) return;
      var now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now;
      self.intensity += (self.target - self.intensity) * (1 - Math.exp(-dt * 3.2));
      // qualité adaptative : si l'ordinateur peine, on réduit la résolution du rendu
      images++; if (dt > .028) lent++;
      if (images === 90) { if (lent > 45 && renderer.dpr > .6) { renderer.dpr = Math.max(.6, renderer.dpr * .75); resize(); } images = 0; lent = 0; }
      var u = program.uniforms;
      u.uTime.value = (performance.now() - t0) / 1000;
      u.uIntensity.value = self.intensity;
      u.uIntro.value = self.intro;
      u.uOut.value = self.out;
      renderer.render({ scene: mesh });
    };
    this.webgl = true;
  };
  ICE.Feu.prototype.tick = function () {
    if (this.fallback) { this.fallback.intensite = this.intensity; this.intensity += (this.target - this.intensity) * .06; this.fallback.tick(); return; }
    if (this.render) this.render();
  };

  /* ---------- Braises 2D (repli, preuves, appel final) ---------- */
  ICE.Braises2D = function (canvas, opts) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.o = opts || {}; this.p = []; this.intensite = 0; this.visible = true;
    var self = this;
    function size() {
      var r = Math.min(window.devicePixelRatio || 1, 1.5);
      self.w = canvas.clientWidth; self.h = canvas.clientHeight;
      canvas.width = Math.max(1, self.w * r); canvas.height = Math.max(1, self.h * r);
      self.ctx.setTransform(r, 0, 0, r, 0, 0);
    }
    size(); window.addEventListener('resize', size);
  };
  ICE.Braises2D.prototype.spawn = function () {
    var o = this.o, w = this.w, h = this.h;
    var cx = o.mode === 'final' ? w * .5 : (o.mode === 'hero' ? w * .62 : Math.random() * w);
    var spread = o.mode === 'final' ? w * (.08 + this.intensite * .2) : (o.mode === 'hero' ? w * .25 : w * .5);
    this.p.push({
      x: cx + (Math.random() - .5) * spread * 2, y: h + 10 - (o.mode === 'hero' ? h * .3 : 0),
      vx: (Math.random() - .5) * .4, vy: -(.4 + Math.random() * 1.3) * (1 + this.intensite * 1.6),
      r: .8 + Math.random() * 2.2, life: 0, max: 140 + Math.random() * 160, s: Math.random() * 6.28
    });
  };
  ICE.Braises2D.prototype.tick = function () {
    if (!this.visible || !this.w) return;
    var ctx = this.ctx, w = this.w, h = this.h, o = this.o;
    var rate = (o.rate || .9) * (1 + this.intensite * 3);
    for (var k = 0; k < rate; k++) if (Math.random() < rate - k) this.spawn();
    ctx.clearRect(0, 0, w, h);
    if (o.mode === 'final') {
      var g = ctx.createRadialGradient(w / 2, h * 1.05, 0, w / 2, h * 1.05, h * (.45 + this.intensite * .4));
      g.addColorStop(0, 'rgba(255,120,40,' + (.35 + this.intensite * .4) + ')'); g.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = this.p.length - 1; i >= 0; i--) {
      var p = this.p[i];
      p.life++; p.s += .05; p.x += p.vx + Math.sin(p.s) * .35; p.y += p.vy;
      var a = 1 - p.life / p.max;
      if (a <= 0 || p.y < -20) { this.p.splice(i, 1); continue; }
      var gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      gl.addColorStop(0, 'rgba(255,190,110,' + a + ')'); gl.addColorStop(.35, 'rgba(255,110,40,' + a * .6 + ')'); gl.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    if (this.p.length > 260) this.p.splice(0, this.p.length - 260);
  };
})();
