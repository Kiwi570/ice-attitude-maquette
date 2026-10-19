/* ICE Attitude — socle commun : défilement fluide, en-tête, curseur braise, boussole d'azimut,
   révélations, son, mode calme, transitions de page, composants partagés. */
(function () {
  'use strict';
  var ICE = window.ICE = window.ICE || {};
  var html = document.documentElement;
  var calme = html.classList.contains('calme');
  var fin = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger, SplitText = window.SplitText;
  var anim = !calme && !!G && !!ST;
  ICE.calme = calme; ICE.anim = anim; ICE.fin = fin;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  ICE.$ = $; ICE.$$ = $$;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  ICE.store = store;

  if (G) {
    if (ST) G.registerPlugin(ST);
    if (SplitText) G.registerPlugin(SplitText);
    G.defaults({ ease: 'power3.out' });
  }

  /* ---------- Boucle d'animation partagée ---------- */
  var boucles = [];
  ICE.boucle = function (fn) { boucles.push(fn); };
  function tourner() { for (var i = 0; i < boucles.length; i++) boucles[i](); }
  if (G) G.ticker.add(tourner); else (function r() { tourner(); requestAnimationFrame(r); })();

  ICE.visible = function (el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { rootMargin: '120px 0px' }).observe(el);
  };

  /* ---------- Défilement fluide (Lenis) ---------- */
  var lenis = null;
  if (anim && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.3 });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    ICE.lenis = lenis;
  }
  var enteteH = function () { return ($('.entete') || {}).offsetHeight || 70; };
  ICE.allerA = function (cible) {
    var el = typeof cible === 'string' ? document.querySelector(cible) : cible;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: el.id === 'ouverture' ? 0 : -enteteH() + 1, duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (el.id === 'ouverture' ? 0 : enteteH()), behavior: calme ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href*="#"]');
    if (!a || ev.defaultPrevented || ev.metaKey || ev.ctrlKey) return;
    var url = new URL(a.getAttribute('href'), location.href);
    if (url.pathname.replace(/\/index(\.html)?$/, '/') !== location.pathname.replace(/\/index(\.html)?$/, '/') || !url.hash) return;
    var cible = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!cible) return;
    ev.preventDefault();
    fermerMenu();
    ICE.allerA(cible);
    if (cible.id === 'contenu') cible.focus && cible.setAttribute('tabindex', '-1');
  });
  // arrivée sur une ancre depuis une autre page
  window.addEventListener('load', function () {
    var pos = null;
    try { pos = sessionStorage.getItem('ice-scroll'); sessionStorage.removeItem('ice-scroll'); } catch (e) {}
    if (pos) { window.scrollTo(0, +pos); if (lenis) lenis.scrollTo(+pos, { immediate: true }); return; }
    if (location.hash && location.hash.length > 1) {
      var c = document.getElementById(location.hash.slice(1));
      if (c) setTimeout(function () { ICE.allerA(c); }, 350);
    }
  });

  /* ---------- En-tête ---------- */
  var entete = $('[data-entete]'), dernierY = 0;
  function surDefilement(y) {
    if (!entete) return;
    entete.classList.toggle('is-solide', y > 40);
    var cache = y > 520 && y > dernierY + 2 && !html.classList.contains('menu-ouvert');
    if (y < dernierY - 2 || y < 520) cache = false;
    if (Math.abs(y - dernierY) > 2) entete.classList.toggle('is-cache', cache);
    dernierY = y;
    majBoussole(y);
  }
  if (lenis) lenis.on('scroll', function (l) { surDefilement(l.scroll); });
  else window.addEventListener('scroll', function () { surDefilement(window.scrollY); }, { passive: true });

  /* ---------- Menu mobile ---------- */
  var burger = $('[data-burger]'), menu = $('#menu-mobile');
  function fermerMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); html.classList.remove('menu-ouvert');
    if (lenis) lenis.start();
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var ouvrir = menu.hidden;
      if (!ouvrir) { fermerMenu(); return; }
      menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); html.classList.add('menu-ouvert');
      if (lenis) lenis.stop();
      if (anim) G.fromTo(menu.querySelectorAll('li'), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .05, duration: .7 });
      var l = menu.querySelector('a'); if (l) l.focus();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermerMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerMenu(); });
  }

  /* ---------- Dock : son et mode calme ---------- */
  var btnSon = $('[data-son]'), btnCalme = $('[data-calme]');
  if (btnCalme) {
    btnCalme.setAttribute('aria-pressed', calme ? 'true' : 'false');
    btnCalme.addEventListener('click', function () {
      store('ice-calme', calme ? '0' : '1');
      try { sessionStorage.setItem('ice-scroll', String(window.scrollY)); } catch (e) {}
      location.reload();
    });
  }
  function majSon() { if (btnSon) btnSon.setAttribute('aria-pressed', ICE.Son && ICE.Son.actif() ? 'true' : 'false'); }
  if (btnSon && ICE.Son) {
    btnSon.addEventListener('click', function () { var a = ICE.Son.basculer(); store('ice-son', a ? '1' : '0'); majSon(); });
    if (store('ice-son') === '1') {
      // le navigateur exige un geste : on reprend le son au premier clic ou à la première touche
      var reprendre = function (e) {
        if (e.target.closest && e.target.closest('[data-son]')) return;
        if (!ICE.Son.actif()) { ICE.Son.demarrer(); majSon(); }
        window.removeEventListener('pointerdown', reprendre); window.removeEventListener('keydown', reprendre);
      };
      window.addEventListener('pointerdown', reprendre); window.addEventListener('keydown', reprendre);
    }
  }

  /* ---------- Boussole d'azimut ---------- */
  var boussole = $('[data-boussole]'), sections = $$('main > section'), azTxt = boussole && boussole.querySelector('[data-az]');
  var aiguille = boussole && boussole.querySelector('.boussole__aiguille'), angleAff = 0;
  if (boussole) {
    var grad = boussole.querySelector('.boussole__graduations'), ns = 'http://www.w3.org/2000/svg';
    for (var gi = 0; gi < 12; gi++) {
      var a = gi * Math.PI / 6, l = document.createElementNS(ns, 'line'), r1 = gi % 3 === 0 ? 34 : 38;
      l.setAttribute('x1', 50 + Math.sin(a) * r1); l.setAttribute('y1', 50 - Math.cos(a) * r1);
      l.setAttribute('x2', 50 + Math.sin(a) * 43); l.setAttribute('y2', 50 - Math.cos(a) * 43);
      grad.appendChild(l);
    }
    boussole.addEventListener('click', function (e) {
      e.preventDefault();
      var suiv = boussole._suivante;
      if (suiv) ICE.allerA(suiv); else ICE.allerA(sections[0]);
    });
  }
  function majBoussole(y) {
    if (!boussole || !sections.length) return;
    var vh = window.innerHeight, idx = 0, prog = 0;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= vh * .45) { idx = i; prog = Math.min(1, Math.max(0, (vh * .45 - r.top) / Math.max(1, r.height))); }
    }
    var angle = ((idx + prog) / sections.length) * 360;
    if (Math.abs(angle - angleAff) > .5) {
      angleAff = angle;
      aiguille.style.transform = 'rotate(' + angle.toFixed(1) + 'deg)';
      if (azTxt) azTxt.textContent = 'Az ' + String(Math.round(angle) % 360).padStart(3, '0') + '°';
    }
    boussole._suivante = sections[idx + 1] || null;
    boussole.setAttribute('aria-label', sections[idx + 1] ? 'Aller à la section suivante' : 'Revenir en haut de la page');
    var pied = $('.pied');
    boussole.classList.toggle('is-fin', (!!pied && pied.getBoundingClientRect().top < vh * .85) || (y !== undefined ? y : window.scrollY) < vh * .5);
  }
  window.addEventListener('resize', function () { majBoussole(window.scrollY); });
  setTimeout(function () { majBoussole(window.scrollY); }, 100);

  /* ---------- Ouverture du devis (délégué) ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-devis]');
    if (!b || b.hasAttribute('data-allumer') || b.closest('[data-devis-form]')) return;
    e.preventDefault(); fermerMenu();
    if (ICE.Devis) ICE.Devis.ouvrir(b.getAttribute('data-devis') || null);
  });

  /* ---------- Dates minimales ---------- */
  var demain = new Date(Date.now() + 864e5);
  var iso = demain.getFullYear() + '-' + String(demain.getMonth() + 1).padStart(2, '0') + '-' + String(demain.getDate()).padStart(2, '0');
  $$('[data-date-min]').forEach(function (i) { i.min = iso; });

  /* ---------- Révélations ---------- */
  function decouperMots(el, cls) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), noeuds = [], n;
    while ((n = walker.nextNode())) noeuds.push(n);
    var spans = [];
    noeuds.forEach(function (t) {
      var parts = t.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var s = document.createElement('span'); s.className = cls; s.textContent = p; frag.appendChild(s); spans.push(s);
      });
      t.parentNode.replaceChild(frag, t);
    });
    return spans;
  }
  ICE.decouperMots = decouperMots;
  var MOTS_FEU = /^(cohésion|confiance|ensemble|essentiel|marquante|humaine|utile|calme|gestes|urgence|nature|équipe|équipes|organise|avance)$/i;

  function initRevelations() {
  if (anim) {
    // titres : lettres qui montent, d'abord couleur braise
    $$('[data-titre]').forEach(function (el) {
      if (!SplitText) return;
      var sp = new SplitText(el, { type: 'lines,chars', mask: 'lines', linesClass: 'ligne' });
      G.from(sp.chars, {
        yPercent: 115, rotate: 4, color: '#FF8A4C', duration: 1.1, stagger: { each: .018, from: 'start' }, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true }
      });
    });
    // eau filtrée : l'image arrive trouble puis s'éclaircit
    $$('[data-filtre]').forEach(function (el) {
      if (el.closest('[data-journee]')) return;
      if (el.getAttribute('data-filtre') === 'fort') {
        var im = el.querySelector('img'); if (!im) return;
        G.fromTo(im, { filter: 'sepia(1) saturate(1.8) hue-rotate(-14deg) brightness(.38) contrast(.8) blur(14px)', scale: 1.1 },
          { filter: 'sepia(0) saturate(1) hue-rotate(0deg) brightness(1) contrast(1) blur(0px)', scale: 1, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 90%', end: 'center 45%', scrub: .6 } });
        return;
      }
      el.classList.add('filtre-trouble');
      ST.create({ trigger: el, start: 'top 84%', once: true, onEnter: function () { el.classList.remove('filtre-trouble'); } });
    });
    // mots qui s'embrasent au centre de l'écran
    $$('[data-embrase]').forEach(function (el) {
      decouperMots(el, 'mot-brut').forEach(function (s) {
        var nu = s.textContent.replace(/[.,;:!?«»"()]/g, '');
        if (!MOTS_FEU.test(nu)) return;
        s.classList.add('mot');
        ST.create({ trigger: s, start: 'top 62%', end: 'top 36%', toggleClass: 'is-brule' });
      });
    });
    // citations : les mots s'allument au défilement
    $$('[data-mots]').forEach(function (el) {
      if (el.closest('[data-carrousel]')) return;
      var m = decouperMots(el, 'mot-cit');
      G.fromTo(m, { opacity: .14 }, { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: .5 } });
    });
    // parallaxe
    $$('[data-parallax]').forEach(function (el) {
      var v = parseFloat(el.getAttribute('data-parallax')) || .1, hero = el.closest('.hero');
      G.fromTo(el, { yPercent: hero ? 0 : -v * 40 }, {
        yPercent: v * 40, ease: 'none',
        scrollTrigger: { trigger: hero || el.parentElement, start: hero ? 'top top' : 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Boutons magnétiques et cartes inclinables ---------- */
  if (anim && fin) {
    $$('[data-magnetic]').forEach(function (b) {
      var xTo = G.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1, .4)' }), yTo = G.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .28); yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      b.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
    $$('[data-tilt]').forEach(function (c) {
      var rx = G.quickTo(c, 'rotationX', { duration: .7 }), ry = G.quickTo(c, 'rotationY', { duration: .7 });
      G.set(c, { transformPerspective: 900 });
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        ry(px * 9); rx(-py * 7);
      });
      c.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  }

  /* ---------- Curseur braise ---------- */
  if (anim && fin) {
    var cur = $('.curseur'), lab = cur.querySelector('.curseur__label'), pt = cur.querySelector('.curseur__point'), an = cur.querySelector('.curseur__anneau');
    var mx = -100, my = -100, ax = mx, ay = my, vx = 0, vy = 0, lastX = mx, lastY = my;
    var cv = $('.braises-curseur'), cx = cv.getContext('2d'), parts = [], dpr = Math.min(devicePixelRatio || 1, 1.5);
    function tailleCv() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    tailleCv(); window.addEventListener('resize', tailleCv);
    cur.style.opacity = '0';
    window.addEventListener('pointermove', function (e) { if (mx < -50) { ax = e.clientX; ay = e.clientY; lastX = e.clientX; lastY = e.clientY; cur.style.opacity = '1'; } mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target : null; if (!t) return;
      var lb = t.closest('[data-cursor]'), l = t.closest('a, button, summary, label, input[type="range"], [data-avis-section] [data-carrousel]');
      cur.classList.toggle('is-label', !!lb && !l);
      lab.textContent = lb && !l ? lb.getAttribute('data-cursor') : '';
      cur.classList.toggle('is-lien', !!l);
    });
    document.addEventListener('pointerleave', function () { cur.style.opacity = '0'; });
    document.addEventListener('pointerenter', function () { cur.style.opacity = '1'; });
    ICE.curseurPresse = function (on) { cur.classList.toggle('is-presse', on); };
    ICE.boucle(function () {
      ax += (mx - ax) * .2; ay += (my - ay) * .2;
      pt.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      an.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0)';
      var d = Math.hypot(mx - lastX, my - lastY); vx = mx - lastX; vy = my - lastY; lastX = mx; lastY = my;
      var n = Math.min(3, d / 14);
      for (var i = 0; i < n; i++) if (Math.random() < n - i) parts.push({ x: mx - vx * Math.random(), y: my - vy * Math.random(), vx: -vx * .03 + (Math.random() - .5) * .6, vy: -.4 - Math.random() * 1.1, l: 0, m: 38 + Math.random() * 40, r: .7 + Math.random() * 1.6 });
      if (parts.length > 140) parts.splice(0, parts.length - 140);
      cx.clearRect(0, 0, innerWidth, innerHeight);
      if (!parts.length) return;
      cx.globalCompositeOperation = 'lighter';
      for (var k = parts.length - 1; k >= 0; k--) {
        var p = parts[k]; p.l++; p.x += p.vx + Math.sin(p.l * .15) * .25; p.y += p.vy; p.vy -= .01;
        var a = 1 - p.l / p.m; if (a <= 0) { parts.splice(k, 1); continue; }
        cx.fillStyle = 'rgba(255,' + (120 + 80 * a | 0) + ',50,' + (a * .85).toFixed(3) + ')';
        cx.beginPath(); cx.arc(p.x, p.y, p.r * (0.6 + a * .6), 0, 6.283); cx.fill();
      }
      cx.globalCompositeOperation = 'source-over';
    });
  }

  /* ---------- Transitions de page en fumée et braise ---------- */
  var trans = $('.transition'), tcv = trans && trans.querySelector('canvas');
  function dessinerTrou(ctx, w, h, cx0, cy0, r, t) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0F110D'; ctx.fillRect(0, 0, w, h);
    if (r <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath();
    for (var i = 0; i <= 90; i++) {
      var a = i / 90 * 6.2832, n = Math.sin(a * 5 + t * 3) * .05 + Math.sin(a * 11 - t * 5) * .03 + Math.sin(a * 23 + t * 2) * .015;
      var rr = r * (1 + n), x = cx0 + Math.cos(a) * rr, y = cy0 + Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,120,45,.95)'; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(255,110,40,1)'; ctx.shadowBlur = 26;
    ctx.stroke(); ctx.restore();
  }
  function animTrou(de, a, cx0, cy0, duree, fin2) {
    var dpr2 = Math.min(devicePixelRatio || 1, 1.5), w = innerWidth, h = innerHeight;
    tcv.width = w * dpr2; tcv.height = h * dpr2; var ctx = tcv.getContext('2d'); ctx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
    var max = Math.hypot(Math.max(cx0, w - cx0), Math.max(cy0, h - cy0)) * 1.15, t0 = performance.now();
    (function f(now) {
      var p = Math.min(1, (now - t0) / duree), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      dessinerTrou(ctx, w, h, cx0, cy0, max * (de + (a - de) * e), now / 1000);
      if (p < 1) requestAnimationFrame(f); else if (fin2) fin2();
    })(t0);
  }
  if (trans && !calme) {
    if (html.classList.contains('arrive')) {
      try { sessionStorage.removeItem('ice-transition'); } catch (e) {}
      trans.classList.add('is-active');
      animTrou(0, 1, innerWidth / 2, innerHeight * .55, 900, function () { trans.classList.remove('is-active'); html.classList.remove('arrive'); });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) && url.pathname.indexOf('.') > -1) return;
      var memePage = url.pathname.replace(/\/index(\.html)?$/, '/') === location.pathname.replace(/\/index(\.html)?$/, '/');
      if (memePage) return;
      e.preventDefault();
      try { sessionStorage.setItem('ice-transition', '1'); } catch (err) {}
      trans.classList.add('is-active');
      animTrou(1, 0, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 650, function () { location.href = url.href; });
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { trans.classList.remove('is-active'); html.classList.remove('arrive'); } });
  } else if (trans) { html.classList.remove('arrive'); }

  /* ---------- Hero : feu WebGL, allumage, attiser ---------- */
  ICE.initHero = function (opts) {
    opts = opts || {};
    var hero = $('[data-hero]'); if (!hero) return null;
    var titre = hero.querySelector('[data-allumage]'), canvas = hero.querySelector('[data-feu]'), img = hero.querySelector('.hero__img');
    var arrive = html.classList.contains('arrive') || !opts.intro;
    var feu = null;
    if (!calme && canvas && img) {
      feu = new ICE.Feu(canvas, img, { intro: !arrive && anim, doux: canvas.hasAttribute('data-feu-doux') });
      if (feu.webgl) { var fond = hero.querySelector('.hero__fond'); if (fond) fond.appendChild(canvas); }
      var vis = true; ICE.visible(hero, function (v) { vis = v; if (feu) feu.visible = v; if (feu && feu.fallback) feu.fallback.visible = v; });
      ICE.boucle(function () { if (vis) feu.tick(); });
      ICE.feuHero = feu;
      // attiser : maintenir le clic ou le doigt
      var presse = function (on) {
        feu.target = on ? 1 : 0; hero.classList.toggle('is-attise', on);
        if (ICE.curseurPresse) ICE.curseurPresse(on);
        if (ICE.Son) ICE.Son.feu(on ? 1 : .25);
      };
      hero.addEventListener('pointerdown', function (e) { if (e.target.closest('a, button')) return; presse(true); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { hero.addEventListener(t, function () { presse(false); }); });
    }
    var chars = [];
    if (titre && SplitText && anim) {
      var cibles = titre.querySelectorAll('span[aria-hidden]');
      var sp = new SplitText(cibles.length ? cibles : titre, { type: 'words,chars', wordsClass: 'mot-titre', charsClass: 'char' });
      chars = sp.chars;
    }
    var autres = hero.querySelectorAll('.hero__devise, .hero__accroche, .hero__actions, .hero__faits, .puces, .hero__attiser');
    if (anim) {
      var tl = G.timeline({ delay: arrive ? .25 : .1 });
      if (feu && feu.webgl && !arrive) tl.to(feu, { intro: 1, duration: 2.3, ease: 'power2.inOut' }, 0);
      if (chars.length) {
        tl.fromTo(chars, { opacity: 0, yPercent: 18, color: '#3b2516', textShadow: '0 0 0 rgba(255,120,40,0)' },
          { opacity: 1, yPercent: 0, color: '#FFA45C', textShadow: '0 0 28px rgba(255,120,40,.85)', duration: .55, stagger: { each: arrive ? .03 : .055, from: 'random' }, ease: 'power2.out' }, arrive ? 0 : .45)
          .to(chars, { color: '#D9D2C3', textShadow: '0 0 0 rgba(255,120,40,0)', duration: .9, stagger: { each: .03, from: 'random' } }, arrive ? .5 : 1.25);
      }
      tl.from(autres, { opacity: 0, y: 24, duration: .9, stagger: .08 }, arrive ? .3 : 1.35);
      // le titre se consume en quittant l'écran
      if (chars.length) {
        var burn = G.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 20%', scrub: .6 } });
        burn.to(chars, { color: '#FF7A35', textShadow: '0 0 30px rgba(255,110,40,.9)', duration: .3, stagger: { each: .02, from: 'random' } }, 0)
          .to(chars, { opacity: 0, yPercent: -60, filter: 'blur(6px)', duration: .5, stagger: { each: .025, from: 'random' } }, .25);
        if (feu && feu.webgl) burn.to(feu, { out: 1, duration: .8 }, 0);
      }
    }
    return feu;
  };

  /* ---------- Sessions : tri automatique à venir / passées ---------- */
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function dateFr(d) { return d.getDate() + (d.getDate() === 1 ? 'er' : '') + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear(); }
  function plage(s) {
    var a = new Date(s.debut + 'T12:00:00'), b = new Date(s.fin + 'T12:00:00');
    if (s.annee_seule) return String(a.getFullYear());
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return a.getDate() + (a.getDate() === b.getDate() ? '' : '–' + b.getDate()) + ' ' + MOIS[a.getMonth()] + ' ' + a.getFullYear();
    return dateFr(a) + ' – ' + dateFr(b);
  }
  ICE.initSessions = function () {
    var root = $('[data-sessions]'); if (!root || !window.ICE.sessions) return;
    var now = new Date(), av = [], pa = [];
    ICE.sessions.forEach(function (s) { (new Date(s.fin + 'T23:59:59') >= now ? av : pa).push(s); });
    av.sort(function (a, b) { return a.debut < b.debut ? -1 : 1; }); pa.sort(function (a, b) { return a.debut < b.debut ? 1 : -1; });
    function li(s, passee) {
      return '<li class="session' + (passee ? ' session--passee' : '') + '"><p class="session__quand">' + plage(s) + (passee ? '<span class="session__badge">passée</span>' : '') +
        '</p><h3 class="session__titre">' + s.titre + '</h3><p class="session__detail">' + s.lieu + '. ' + s.detail + '</p></li>';
    }
    var ulA = root.querySelector('[data-sessions-avenir]'), ulP = root.querySelector('[data-sessions-passees]');
    if (ulA) ulA.innerHTML = av.map(function (s) { return li(s, false); }).join('');
    if (ulP) ulP.innerHTML = pa.map(function (s) { return li(s, true); }).join('');
    var vide = root.querySelector('[data-sessions-vide]'); if (vide) vide.hidden = av.length > 0;
    // prochain week-end pour les anniversaires
    var sam = new Date(now); sam.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
    if (now.getDay() === 6) sam = new Date(now.getTime() + 7 * 864e5);
    root.querySelectorAll('[data-weekend]').forEach(function (p) {
      p.innerHTML = p.textContent + '<br><span>Prochain week-end : ' + JOURS[sam.getDay()] + ' ' + sam.getDate() + ' ' + MOIS[sam.getMonth()] + ', disponibilités à confirmer</span>';
    });
    // onglets
    var tabs = root.querySelectorAll('[data-onglet]');
    function choisir(t) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
      t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { choisir(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); choisir(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]); }
      });
    });
  };

  /* ---------- Carrousel d'avis ---------- */
  ICE.initAvis = function () {
    var sec = $('[data-avis-section]'); if (!sec) return;
    var car = sec.querySelector('[data-carrousel]'), items = $$('[data-avis]', sec), i = 0, cpt = sec.querySelector('[data-avis-compteur]');
    items.forEach(function (f) { var p = f.querySelector('[data-mots] p'); if (p) f._mots = decouperMots(p, 'mot-avis'); });
    function montrer(n, dir) {
      var old = items[i]; i = (n + items.length) % items.length; var nu = items[i];
      if (old !== nu) {
        old.hidden = true; nu.hidden = false;
        if (anim) G.fromTo(nu, { opacity: 0, x: 40 * (dir || 1) }, { opacity: 1, x: 0, duration: .8 });
      }
      if (cpt) cpt.textContent = (i + 1) + ' / ' + items.length;
      lire(nu);
    }
    function lire(f) {
      if (!f._mots) return;
      if (!anim) { f._mots.forEach(function (m) { m.classList.add('is-lu'); }); return; }
      (f._timers || []).forEach(clearTimeout); f._timers = [];
      f._mots.forEach(function (m) { m.classList.remove('is-lu'); });
      f._mots.forEach(function (m, k) { f._timers.push(setTimeout(function () { m.classList.add('is-lu'); }, 150 + k * Math.min(60, 2600 / f._mots.length))); });
    }
    sec.querySelector('[data-avis-prec]').addEventListener('click', function () { montrer(i - 1, -1); });
    sec.querySelector('[data-avis-suiv]').addEventListener('click', function () { montrer(i + 1, 1); });
    car.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') montrer(i + 1, 1); if (e.key === 'ArrowLeft') montrer(i - 1, -1); });
    var x0 = null;
    car.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    car.addEventListener('pointerup', function (e) { if (x0 === null) return; var d = e.clientX - x0; if (Math.abs(d) > 50) montrer(i + (d < 0 ? 1 : -1), d < 0 ? 1 : -1); x0 = null; });
    if (anim) ST.create({ trigger: car, start: 'top 75%', once: true, onEnter: function () { lire(items[i]); } });
    else lire(items[0]);
  };

  /* ---------- Bandes de logos ---------- */
  ICE.initLogos = function () {
    var bandes = $$('[data-logos] .marquee'); if (!bandes.length) return;
    if (!anim) { html.classList.add('no-marquee'); return; }
    var tweens = [];
    bandes.forEach(function (m) {
      var tr = m.querySelector('.marquee__track'), dir = +m.getAttribute('data-marquee') || 1;
      Array.prototype.slice.call(tr.children).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('img').forEach(function (im) { im.alt = ''; }); tr.appendChild(c); });
      var tw = dir > 0 ? G.fromTo(tr, { xPercent: 0 }, { xPercent: -50, duration: 70, ease: 'none', repeat: -1 }) : G.fromTo(tr, { xPercent: -50 }, { xPercent: 0, duration: 70, ease: 'none', repeat: -1 });
      tweens.push(tw);
      m.addEventListener('pointerenter', function () { G.to(tw, { timeScale: .15, duration: .6 }); });
      m.addEventListener('pointerleave', function () { G.to(tw, { timeScale: 1, duration: .6 }); });
    });
    ST.create({
      trigger: $('[data-logos]'), start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var v = Math.min(6, 1 + Math.abs(self.getVelocity()) / 300);
        tweens.forEach(function (t) { G.to(t, { timeScale: v * (self.direction || 1), duration: .2, overwrite: true }); G.to(t, { timeScale: 1, duration: 1.2, delay: .25 }); });
      }
    });
  };

  /* ---------- Rails à glisser ---------- */
  ICE.initRails = function () {
    $$('[data-rail]').forEach(function (rail) {
      var down = false, x0 = 0, s0 = 0, v = 0, lastX = 0, moved = false, items = rail.children;
      rail.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        down = true; moved = false; x0 = lastX = e.clientX; s0 = rail.scrollLeft; v = 0; rail.classList.add('is-drag');
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true;
        rail.scrollLeft = s0 - dx; v = e.clientX - lastX; lastX = e.clientX;
        if (anim && rail.hasAttribute('data-galerie')) G.to(items, { skewX: Math.max(-6, Math.min(6, -v * .35)), duration: .4, overwrite: true });
      });
      window.addEventListener('pointerup', function () {
        if (!down) return; down = false; rail.classList.remove('is-drag');
        if (anim) {
          var o = { s: rail.scrollLeft };
          G.to(o, { s: rail.scrollLeft - v * 18, duration: 1, ease: 'power3.out', onUpdate: function () { rail.scrollLeft = o.s; } });
          if (rail.hasAttribute('data-galerie')) G.to(items, { skewX: 0, duration: .8, ease: 'elastic.out(1,.5)' });
        }
      });
      rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
      rail.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || rail.scrollWidth <= rail.clientWidth) return;
        e.stopPropagation();
      }, { passive: true });
      rail.setAttribute('tabindex', '0');
      rail.setAttribute('aria-label', 'Galerie à faire défiler horizontalement');
    });
  };

  /* ---------- Canvas d'ambiance ---------- */
  ICE.initAmbiances = function () {
    if (calme) return;
    $$('[data-braises]').forEach(function (c) {
      var b = new ICE.Braises2D(c, { mode: 'champ', rate: .45 }), v = false;
      ICE.visible(c, function (x) { v = x; }); ICE.boucle(function () { if (v) b.tick(); });
    });
    $$('[data-etoiles]').forEach(function (c) {
      var ctx = c.getContext('2d'), etoiles = [], v = false, w, h;
      function taille() {
        var r = Math.min(devicePixelRatio || 1, 1.5); w = c.clientWidth; h = c.clientHeight; c.width = w * r; c.height = h * r; ctx.setTransform(r, 0, 0, r, 0, 0);
        etoiles = []; var n = Math.round(w * h / 5200);
        for (var i = 0; i < n; i++) etoiles.push({ x: Math.random() * w, y: Math.random() * h * .9, r: Math.random() * 1.2 + .2, p: Math.random() * 6.28, s: .5 + Math.random() * 1.5 });
      }
      taille(); window.addEventListener('resize', taille);
      ICE.visible(c, function (x) { v = x; });
      ICE.boucle(function () {
        if (!v) return; var t = performance.now() / 1000; ctx.clearRect(0, 0, w, h);
        
        for (var i = 0; i < etoiles.length; i++) { var e = etoiles[i], a = .35 + .65 * Math.abs(Math.sin(t * e.s + e.p)); ctx.fillStyle = 'rgba(230,226,214,' + (a * .85).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.283); ctx.fill(); }
      });
    });
    $$('[data-code-visual]').forEach(function (c) {
      var b = new ICE.Braises2D(c, { mode: 'champ', rate: .12 }), v = false;
      ICE.visible(c, function (x) { v = x; }); ICE.boucle(function () { if (v) b.tick(); });
    });
  };

  /* ---------- Lancement commun ---------- */
  function demarrer() {
    ICE.initSessions(); ICE.initAvis(); ICE.initLogos(); ICE.initRails(); ICE.initAmbiances();
    initRevelations();
    if (anim) {
      if (ST.sort) ST.sort();
      ST.refresh();
      window.addEventListener('load', function () { ST.refresh(); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    }
    surDefilement(window.scrollY);
  }
  // les scripts de page s'exécutent avant DOMContentLoaded : leurs sections épinglées existent avant les révélations
  if (document.readyState === 'complete') demarrer(); else document.addEventListener('DOMContentLoaded', demarrer);
})();
