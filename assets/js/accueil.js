/* ICE Attitude — page d'accueil : allumage, formules en galerie horizontale, journée 10h → 16h,
   compteurs, cercle autour du feu, carte azimutale, appel final à maintenir. */
(function () {
  'use strict';
  var ICE = window.ICE, G = window.gsap, ST = window.ScrollTrigger;
  var $ = ICE.$, $$ = ICE.$$, anim = ICE.anim;

  ICE.initHero({ intro: true });

  /* ---------- Icônes au trait ---------- */
  function preparerTrait(svg) {
    if (!svg) return [];
    var ps = svg.querySelectorAll('.draw');
    Array.prototype.forEach.call(ps, function (p) {
      var l = p.getTotalLength ? p.getTotalLength() : 200;
      p.style.strokeDasharray = l; p.style.strokeDashoffset = l;
    });
    return ps;
  }
  function tracer(svg, tl, pos) {
    var ps = preparerTrait(svg);
    var t = tl || G.timeline();
    t.to(ps, { strokeDashoffset: 0, duration: 1, stagger: .08, ease: 'power2.inOut' }, pos || 0);
    var aig = svg.querySelector('.needle');
    if (aig) t.fromTo(aig, { rotation: -140 }, { rotation: 18, duration: 1.4, ease: 'elastic.out(1, .4)', svgOrigin: '60 60' }, (pos || 0));
    var fill = svg.querySelectorAll('.fill-ember, .fill-ash');
    if (fill.length) t.from(fill, { opacity: 0, duration: .4 }, (pos || 0) + .3);
    return t;
  }

  /* ---------- Formules : galerie horizontale épinglée ---------- */
  var formules = $('[data-formules]');
  var mm = anim ? G.matchMedia() : null;
  if (mm && formules) {
    mm.add('(min-width: 1000px)', function () {
      formules.classList.add('is-horizontal');
      var piste = formules, rail = formules.querySelector('.formules__rail'), trace = formules.querySelector('.formules__trace path');
      var dist = function () { return Math.max(0, rail.scrollWidth - window.innerWidth + 40); };
      var tw = G.to(rail, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: piste, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 } });
      if (trace) G.to(trace, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: piste, start: 'top top', end: function () { return '+=' + dist(); }, scrub: true } });
      $$('.formule', rail).forEach(function (c) {
        var prix = c.querySelector('[data-braise]');
        ST.create({ trigger: c, containerAnimation: tw, start: 'left 70%', end: 'right 30%', toggleClass: { targets: prix, className: 'is-allume' } });
        var im = c.querySelector('.formule__media img');
        G.fromTo(im, { scale: 1.18, xPercent: -6 }, { scale: 1.02, xPercent: 6, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { formules.classList.remove('is-horizontal'); G.set(rail, { clearProps: 'transform' }); };
    });
    mm.add('(max-width: 999px)', function () {
      $$('[data-braise]', formules).forEach(function (p) { ST.create({ trigger: p, start: 'top 75%', end: 'bottom 30%', toggleClass: 'is-allume' }); });
    });
  }

  /* ---------- Une journée en forêt ---------- */
  var journee = $('[data-journee]');
  if (journee) {
    var ateliers = $$('.atelier', journee), horloge = journee.querySelector('[data-horloge]');
    var fonds = journee.querySelector('[data-fonds]'), ciel = journee.querySelector('.journee__ciel');
    var teinte = document.createElement('div'); teinte.className = 'journee__teinte'; ciel.appendChild(teinte);
    var calques = ateliers.map(function (a) { var d = document.createElement('div'); d.className = 'fond'; d.style.backgroundImage = 'url("' + a.getAttribute('data-fond') + '")'; fonds.appendChild(d); return d; });
    var teintes = ['#3c6f80', '#4f7d63', '#a88f45', '#c9893a', '#d06a2a', '#cf4a18'];
    function heure(p) { var m = Math.round(600 + p * 360); m = Math.round(m / 5) * 5; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    function majCiel(p) {
      var idx = Math.min(ateliers.length - 1, Math.floor(p * ateliers.length));
      calques.forEach(function (c, i) { c.classList.toggle('is-visible', i === idx); });
      teinte.style.backgroundColor = teintes[idx];
      if (horloge) horloge.textContent = heure(p);
    }
    majCiel(0);
    if (mm) {
      mm.add('(min-width: 1000px)', function () {
        journee.classList.add('is-epingle');
        var arc = journee.querySelector('.arc-trace'), soleil = journee.querySelector('.arc-soleil');
        var n = ateliers.length;
        G.set(ateliers, { autoAlpha: 0 });
        var tl = G.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: journee, start: 'top top', end: function () { return '+=' + window.innerHeight * n * 1.05; }, pin: true, scrub: .7, anticipatePin: 1,
            onUpdate: function (self) {
              var p = self.progress; majCiel(p);
              var t = p, x = (1 - t) * (1 - t) * 40 + 2 * (1 - t) * t * 500 + t * t * 960, y = (1 - t) * (1 - t) * 210 + 2 * (1 - t) * t * -40 + t * t * 210;
              soleil.setAttribute('cx', x.toFixed(1)); soleil.setAttribute('cy', y.toFixed(1));
              arc.style.strokeDashoffset = 0;
              if (ICE.Son) ICE.Son.feu(p > .82 ? (p - .82) * 5 : .2);
            }
          }
        });
        ateliers.forEach(function (a, i) {
          var media = a.querySelector('.atelier__media'), img = media.querySelector('img, .code-visual'), titre = a.querySelector('.atelier__titre');
          var corps = a.querySelectorAll('.atelier__num, .atelier__texte'), ico = a.querySelector('.atelier__ico svg');
          var t0 = i;
          tl.set(a, { autoAlpha: 1 }, t0)
            .fromTo(media, { clipPath: 'inset(100% 0% 0% 0% round 10px)' }, { clipPath: 'inset(0% 0% 0% 0% round 10px)', duration: .45 }, t0)
            .fromTo(img, { scale: 1.25 }, { scale: 1, duration: .9, ease: 'none' }, t0)
            .fromTo(titre, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .35 }, t0 + .08)
            .fromTo(corps, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .35, stagger: .05 }, t0 + .14);
          if (a.getAttribute('data-atelier') === 'eau' && img && img.tagName === 'IMG') {
            tl.fromTo(img, { filter: 'sepia(1) saturate(1.8) hue-rotate(-14deg) brightness(.35) blur(12px)' }, { filter: 'sepia(0) saturate(1) hue-rotate(0deg) brightness(1) blur(0px)', duration: .7, ease: 'none' }, t0 + .1);
          } else if (img && img.tagName === 'IMG') {
            tl.fromTo(img, { filter: 'sepia(.8) brightness(.5) blur(6px)' }, { filter: 'sepia(0) brightness(1) blur(0px)', duration: .4 }, t0);
          }
          if (ico) tracer(ico, tl, t0 + .1);
          if (i < n - 1) tl.to(a, { autoAlpha: 0, duration: .2 }, t0 + .9).to(media, { yPercent: -8, duration: .2 }, t0 + .9);
          else tl.to({}, { duration: .3 }, t0 + .9);
        });
        return function () { journee.classList.remove('is-epingle'); G.set(ateliers, { clearProps: 'all' }); ateliers.forEach(function (a) { G.set(a.querySelectorAll('*'), { clearProps: 'all' }); }); };
      });
      mm.add('(max-width: 999px)', function () {
        ST.create({ trigger: journee, start: 'top top', end: 'bottom bottom', onUpdate: function (s) { majCiel(s.progress); } });
        ateliers.forEach(function (a) {
          var media = a.querySelector('.atelier__media'), ico = a.querySelector('.atelier__ico svg');
          media.classList.add('filtre-trouble');
          ST.create({ trigger: a, start: 'top 75%', once: true, onEnter: function () { media.classList.remove('filtre-trouble'); if (ico) tracer(ico); } });
        });
      });
    }
  }

  /* ---------- Compteurs ---------- */
  $$('[data-compte]').forEach(function (el) {
    var cible = +el.getAttribute('data-compte');
    if (!anim) return;
    var o = { v: 0 };
    el.textContent = '0';
    ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () {
      G.to(o, { v: cible, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); },
        onComplete: function () { G.fromTo(el.parentNode, { textShadow: '0 0 40px rgba(255,130,50,.9)' }, { textShadow: '0 0 0px rgba(255,130,50,0)', duration: 1.4 }); } });
    } });
  });

  /* ---------- Autour du feu ---------- */
  var equipe = $('[data-equipe]');
  if (equipe) {
    var cercle = equipe.querySelector('[data-cercle]'), membres = $$('.membre', cercle), fiche = equipe.querySelector('[data-fiche]');
    var N = membres.length, actif = -1, rot = 0;
    function remplirFiche(i) {
      if (i === actif) return; actif = i;
      membres.forEach(function (m, k) { m.classList.toggle('is-actif', k === i); });
      var m = membres[i], nom = m.querySelector('.membre__nom').textContent, role = m.querySelector('.membre__role').textContent, bio = m.querySelector('.membre__bio').textContent;
      fiche.innerHTML = '<p class="fiche__idx mono">' + (i + 1) + ' / ' + N + '</p><h3 class="fiche__nom">' + nom + '</h3><p class="fiche__role">' + role + '</p><p class="fiche__bio">' + bio + '</p>';
      if (G) G.fromTo(fiche.children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: .05, duration: .5, overwrite: true });
    }
    function placer(angleOff, rx, ry) {
      var best = 0, bestZ = -2;
      membres.forEach(function (m, i) {
        var a = (i / N) * Math.PI * 2 + angleOff, x = Math.cos(a) * rx, y = Math.sin(a) * ry, z = Math.sin(a);
        var s = .62 + (z + 1) * .26;
        m.style.setProperty('--x', x.toFixed(1) + 'px'); m.style.setProperty('--y', y.toFixed(1) + 'px');
        m.style.setProperty('--s', s.toFixed(3)); m.style.setProperty('--z', String(Math.round((z + 1) * 50)));
        m.style.setProperty('--lum', ((z + 1) / 2).toFixed(2));
        if (z > bestZ) { bestZ = z; best = i; }
      });
      remplirFiche(best);
    }
    if (mm) {
      mm.add('(min-width: 1000px)', function () {
        equipe.classList.add('equipe--cercle');
        var scene = equipe.querySelector('.equipe__scene');
        var dims = function () { var w = scene.clientWidth; return [Math.min(w * .27, 330), Math.min(scene.clientHeight * .3, 230)]; };
        var d = dims(); placer(Math.PI / 2, d[0], d[1]);
        var st = ST.create({
          trigger: equipe, start: 'top top', end: function () { return '+=' + window.innerHeight * 2.4; }, pin: true, scrub: true, anticipatePin: 1,
          onUpdate: function (s) { rot = Math.PI / 2 - s.progress * Math.PI * 2 * (N - 1) / N; var dd = dims(); placer(rot, dd[0], dd[1]); },
          onRefresh: function (s) { var dd = dims(); placer(Math.PI / 2 - s.progress * Math.PI * 2 * (N - 1) / N, dd[0], dd[1]); }
        });
        membres.forEach(function (m, i) {
          m.querySelector('.membre__btn').addEventListener('click', function () {
            var y = st.start + (st.end - st.start) * (i / (N - 1));
            if (ICE.lenis) ICE.lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
          });
        });
        // le foyer
        var cv = equipe.querySelector('[data-foyer]'), ctx = cv.getContext('2d'), vis = false, W, H;
        function taille() { var r = Math.min(devicePixelRatio || 1, 1.5); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * r; cv.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0); }
        taille(); window.addEventListener('resize', taille);
        ICE.visible(equipe, function (v) { vis = v; });
        var etinc = [];
        ICE.boucle(function () {
          if (!vis || !W) return;
          // l'image du foyer est vue du dessus : on ajoute seulement la lueur qui respire et les étincelles qui montent
          var t = performance.now() / 1000; ctx.clearRect(0, 0, W, H);
          var cx = W * .49, cy = H * .615, puls = .75 + .25 * Math.sin(t * 3.1) * Math.sin(t * 1.7 + 1);
          var halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * .42);
          halo.addColorStop(0, 'rgba(255,140,50,' + (.32 * puls).toFixed(3) + ')'); halo.addColorStop(1, 'rgba(255,90,20,0)');
          ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'lighter';
          if (Math.random() < .5) etinc.push({ x: cx + (Math.random() - .5) * W * .1, y: cy, vy: -.7 - Math.random() * 1.4, l: 0, m: 60 + Math.random() * 50 });
          for (var e = etinc.length - 1; e >= 0; e--) {
            var p = etinc[e]; p.l++; p.y += p.vy; p.x += Math.sin(p.l * .09 + e) * .45;
            var a = 1 - p.l / p.m; if (a <= 0) { etinc.splice(e, 1); continue; }
            ctx.fillStyle = 'rgba(255,' + (150 + 60 * a | 0) + ',80,' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.1 + a, 0, 6.283); ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
        });
        return function () { equipe.classList.remove('equipe--cercle'); fiche.innerHTML = ''; actif = -1; membres.forEach(function (m) { m.classList.remove('is-actif'); }); };
      });
    }
  }

  /* ---------- Carte azimutale ---------- */
  var zones = $('[data-zones]');
  if (zones && anim) {
    var lignes = zones.querySelectorAll('.zone-ligne'), pts = zones.querySelectorAll('.zone'), rose = zones.querySelector('.zone-rose');
    lignes.forEach(function (l) { var n = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value); l.style.strokeDasharray = n; l.style.strokeDashoffset = n; });
    var tl = G.timeline({ scrollTrigger: { trigger: zones, start: 'top 70%', once: true } });
    tl.from(rose, { rotation: -60, opacity: 0, transformOrigin: '330px 330px', duration: 1.4, ease: 'power3.out' })
      .to(lignes, { strokeDashoffset: 0, duration: 1.1, stagger: .15, ease: 'power2.inOut' }, .4)
      .from(pts, { opacity: 0, scale: .4, transformOrigin: 'center', stagger: .12, duration: .6, ease: 'back.out(2)' }, .7);
  }

  /* ---------- Appel final : maintenir pour allumer ---------- */
  var bouton = $('[data-allumer]'), finalCv = $('[data-final-feu]');
  if (bouton) {
    var feuFinal = null, vfin = false;
    if (finalCv && !ICE.calme) { feuFinal = new ICE.Braises2D(finalCv, { mode: 'final', rate: .7 }); ICE.visible(finalCv, function (v) { vfin = v; }); ICE.boucle(function () { if (vfin) feuFinal.tick(); }); }
    var prog = { p: 0 }, t0 = 0, tw = null, ouvert = false;
    function majP() { bouton.style.setProperty('--p', (1 - prog.p).toFixed(3)); if (feuFinal) feuFinal.intensite = prog.p; }
    function ouvrirDevis() { if (ouvert) return; ouvert = true; if (ICE.Son) ICE.Son.braise(); ICE.Devis.ouvrir(null); setTimeout(function () { ouvert = false; }, 800); }
    bouton.addEventListener('pointerdown', function (e) {
      if (e.button) return; t0 = performance.now();
      if (!G || ICE.calme) return;
      if (tw) tw.kill();
      tw = G.to(prog, { p: 1, duration: 1.3, ease: 'power1.in', onUpdate: majP, onComplete: function () {
        G.fromTo(bouton, { scale: 1.12 }, { scale: 1, duration: .8, ease: 'elastic.out(1,.4)' });
        ouvrirDevis(); G.to(prog, { p: 0, duration: 1, delay: .3, onUpdate: majP });
      } });
      if (ICE.curseurPresse) ICE.curseurPresse(true);
    });
    function relacher() {
      if (ICE.curseurPresse) ICE.curseurPresse(false);
      if (tw && prog.p < 1) { tw.kill(); G.to(prog, { p: 0, duration: .5, onUpdate: majP }); }
    }
    bouton.addEventListener('pointerup', relacher); bouton.addEventListener('pointerleave', relacher); bouton.addEventListener('pointercancel', relacher);
    bouton.addEventListener('click', function (e) {
      e.preventDefault();
      var duree = performance.now() - t0;
      if (!t0 || duree < 450 || ICE.calme || !G) ouvrirDevis();
      t0 = 0;
    });
  }
})();
