/* ICE Attitude — page stage survie 1 journée : programme au fil du jour, mini-jeu du feu par friction,
   calculateur de tarif et réservation simulée. */
(function () {
  'use strict';
  var ICE = window.ICE, G = window.gsap, ST = window.ScrollTrigger;
  var $ = ICE.$, $$ = ICE.$$, anim = ICE.anim;

  ICE.initHero({ intro: false });
  if (anim) G.from('[data-puces] li', { opacity: 0, y: 14, stagger: .06, duration: .7, delay: .9 });

  /* ---------- Programme ---------- */
  var prog = $('[data-programme]');
  if (prog) {
    var horloge = prog.querySelector('[data-horloge]'), fil = prog.querySelector('[data-fil]');
    var heure = function (p) { var m = Math.round((600 + p * 360) / 5) * 5; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    if (anim) {
      var liste = prog.querySelector('[data-ateliers]');
      ST.create({ trigger: liste, start: 'top 60%', end: 'bottom 60%', onUpdate: function (s) {
        if (horloge) horloge.textContent = heure(s.progress);
        if (fil) fil.parentNode.style.setProperty('--fil', s.progress.toFixed(3));
      } });
      $$('.atelier__ico svg', prog).forEach(function (svg) {
        var ps = svg.querySelectorAll('.draw');
        ps.forEach(function (p) { var l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
        var tl = G.timeline({ scrollTrigger: { trigger: svg, start: 'top 80%', once: true } });
        tl.to(ps, { strokeDashoffset: 0, duration: 1.1, stagger: .08, ease: 'power2.inOut' });
        var aig = svg.querySelector('.needle'); if (aig) tl.fromTo(aig, { rotation: -140 }, { rotation: 18, duration: 1.4, ease: 'elastic.out(1,.4)', svgOrigin: '60 60' }, 0);
      });
      $$('.atelier__titre', prog).forEach(function (t) { G.from(t, { yPercent: 40, opacity: 0, duration: .9, scrollTrigger: { trigger: t, start: 'top 85%', once: true } }); });
    }
  }

  /* ---------- Mini-jeu : la braise par friction ---------- */
  var jeu = $('[data-jeu-feu]');
  if (jeu) {
    var cv = jeu.querySelector('[data-jeu-canvas]'), ctx = cv.getContext('2d'), jauge = jeu.querySelector('.jeu-feu__jauge');
    var etat = jeu.querySelector('[data-jeu-etat]'), reset = jeu.querySelector('[data-jeu-reset]');
    var W, H, vis = false, chaleur = 0, archet = 0, archetV = 0, rot = 0, presse = false, lastX = null, fumee = [], braise = false, flamme = 0, tBraise = 0, auto = 0, dernierAnnonce = -1;
    function taille() { var r = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * r; cv.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0); }
    taille(); window.addEventListener('resize', taille);
    ICE.visible(jeu, function (v) { vis = v; });
    function friction(dx) {
      if (braise) return;
      var lim = W * .17;
      var nv = Math.max(-lim, Math.min(lim, archet + dx));
      var reel = nv - archet; archet = nv;
      archetV = reel; rot += reel * .09;
      chaleur = Math.min(1, chaleur + Math.abs(reel) / W * .055);
      if (ICE.Son && Math.abs(reel) > 2 && Math.random() < .25) ICE.Son.feu(.3 + chaleur);
    }
    function demarrerPresse(x) { presse = true; lastX = x; cv.style.cursor = 'grabbing'; if (ICE.curseurPresse) ICE.curseurPresse(true); }
    function finPresse() { presse = false; lastX = null; cv.style.cursor = ''; if (ICE.curseurPresse) ICE.curseurPresse(false); }
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); demarrerPresse(e.clientX); });
    cv.addEventListener('pointermove', function (e) { if (!presse) return; friction((e.clientX - lastX) * 1.3); lastX = e.clientX; });
    cv.addEventListener('pointerup', finPresse); cv.addEventListener('pointercancel', finPresse);
    cv.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); auto = 1; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); friction((e.key === 'ArrowLeft' ? -1 : 1) * W * .12); }
    });
    cv.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Spacebar') auto = 0; });
    reset.addEventListener('click', function () { chaleur = 0; braise = false; flamme = 0; reset.hidden = true; etat.textContent = 'Chaleur : 0 %'; cv.focus(); });

    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    ICE.boucle(function () {
      if (!vis || !W) return;
      var t = performance.now() / 1000;
      if (auto && !braise) friction(Math.cos(t * 9) * W * .02);
      if (!presse && !auto) { archet *= .9; }
      if (!braise) chaleur = Math.max(0, chaleur - .0016 * (presse || auto ? .4 : 1));
      if (chaleur >= .97 && !braise) {
        braise = true; tBraise = t; etat.textContent = 'Braise obtenue ! Le fagot s\'enflamme.'; reset.hidden = false;
        if (ICE.Son) ICE.Son.braise();
      }
      if (braise) flamme = Math.min(1, (t - tBraise) / 2.2);
      jauge.style.setProperty('--chaleur', chaleur.toFixed(3));
      var pct = Math.round(chaleur * 100);
      if (!braise && Math.abs(pct - dernierAnnonce) >= 10) { dernierAnnonce = pct - pct % 10; etat.textContent = 'Chaleur : ' + dernierAnnonce + ' %'; }

      ctx.clearRect(0, 0, W, H);
      var sol = H * .78, cx = W * .5;
      // lueur
      var lum = chaleur * .6 + flamme;
      var g = ctx.createRadialGradient(cx, sol, 0, cx, sol, W * (.25 + lum * .4));
      g.addColorStop(0, 'rgba(255,120,40,' + (.12 + lum * .45) + ')'); g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // nid d'herbe
      ctx.strokeStyle = 'rgba(190,160,100,.75)'; ctx.lineWidth = 1;
      for (var k = 0; k < 26; k++) { var a0 = k / 26 * Math.PI; ctx.beginPath(); ctx.moveTo(cx + W * .2 + Math.cos(a0) * 26, sol + 6 - Math.sin(a0) * 10); ctx.quadraticCurveTo(cx + W * .2, sol - 6, cx + W * .2 - Math.cos(a0) * 24, sol + 4 - Math.sin(a0 + 1) * 8); ctx.stroke(); }
      // planchette
      ctx.fillStyle = '#6b4a2c'; rr(W * .14, sol, W * .72, H * .055, 6); ctx.fill();
      ctx.fillStyle = '#4e341e'; ctx.fillRect(W * .14, sol + H * .04, W * .72, H * .015);
      ctx.fillStyle = 'rgba(20,10,5,.9)'; ctx.beginPath(); ctx.moveTo(cx - 9, sol); ctx.lineTo(cx + 9, sol); ctx.lineTo(cx + 4, sol + H * .055); ctx.lineTo(cx - 4, sol + H * .055); ctx.fill();
      // braise dans l'encoche
      if (chaleur > .35 || braise) {
        var b = braise ? 1 : (chaleur - .35) / .65;
        var gb = ctx.createRadialGradient(cx, sol + 4, 0, cx, sol + 4, 8 + b * 16);
        gb.addColorStop(0, 'rgba(255,220,140,' + b + ')'); gb.addColorStop(.4, 'rgba(255,110,30,' + b * .9 + ')'); gb.addColorStop(1, 'rgba(255,60,10,0)');
        ctx.fillStyle = gb; ctx.beginPath(); ctx.arc(cx, sol + 4, 8 + b * 16, 0, 6.283); ctx.fill();
      }
      // drille
      var dw = W * .028, top = H * .3;
      ctx.save(); rr(cx - dw / 2, top, dw, sol - top, 4); ctx.clip();
      ctx.fillStyle = '#c9a676'; ctx.fillRect(cx - dw / 2, top, dw, sol - top);
      ctx.strokeStyle = 'rgba(90,60,30,.55)'; ctx.lineWidth = 3;
      for (var s = -2; s < 14; s++) { var yy = top + ((s * 24 + rot * 30) % 336 + 336) % 336; ctx.beginPath(); ctx.moveTo(cx - dw, yy); ctx.lineTo(cx + dw, yy - 14); ctx.stroke(); }
      ctx.restore();
      // pommelle
      ctx.fillStyle = '#8a6440'; rr(cx - W * .07, top - H * .05, W * .14, H * .06, 10); ctx.fill();
      // archet et corde
      var ax = cx + archet, ay = H * .56, bl = W * .3;
      ctx.strokeStyle = '#a07a4c'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax - bl, ay); ctx.quadraticCurveTo(ax, ay + H * .12, ax + bl, ay); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,220,200,.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ax - bl, ay); ctx.lineTo(cx - dw / 2, ay + 4); ctx.moveTo(cx + dw / 2, ay - 4); ctx.lineTo(ax + bl, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - dw / 2, ay + 4); ctx.lineTo(cx + dw / 2, ay - 4); ctx.stroke();
      // fumée
      if (Math.random() < chaleur * .8 || (braise && Math.random() < .6)) fumee.push({ x: cx + (Math.random() - .5) * 10, y: sol, r: 4 + Math.random() * 6, l: 0, vx: (Math.random() - .5) * .4 });
      for (var f = fumee.length - 1; f >= 0; f--) {
        var p = fumee[f]; p.l++; p.y -= .7 + chaleur; p.x += p.vx + Math.sin(p.l * .05) * .5; p.r += .25;
        var al = (1 - p.l / 120) * .22; if (al <= 0) { fumee.splice(f, 1); continue; }
        ctx.fillStyle = 'rgba(220,214,200,' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      // flamme du fagot
      if (flamme > 0) {
        var fx = cx + W * .2, fy = sol;
        ctx.globalCompositeOperation = 'lighter';
        for (var q = 0; q < 6; q++) {
          var hh = H * .34 * flamme * (.6 + .4 * Math.sin(t * 6 + q)), ww = 18 + q * 3, sx = fx + Math.sin(t * 5 + q * 2) * 6;
          var gr = ctx.createLinearGradient(0, fy, 0, fy - hh); gr.addColorStop(0, 'rgba(255,200,100,.5)'); gr.addColorStop(.6, 'rgba(255,110,30,.3)'); gr.addColorStop(1, 'rgba(255,60,10,0)');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx - ww, fy); ctx.quadraticCurveTo(sx - ww, fy - hh * .6, sx + Math.sin(t * 7 + q) * 8, fy - hh); ctx.quadraticCurveTo(sx + ww, fy - hh * .6, sx + ww, fy); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (!presse && !braise && chaleur < .02) {
        ctx.fillStyle = 'rgba(217,210,195,.7)'; ctx.font = '15px Fraunces, Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillText('Maintenez et faites aller l\'archet', cx, H * .15);
      }
    });
  }

  /* ---------- Calculateur ---------- */
  var calc = $('[data-calc]');
  if (calc) {
    var T = ICE.tarifs.stage1jour, range = calc.querySelector('[data-calc-range]'), out = calc.querySelector('[data-calc-nb]');
    var total = calc.querySelector('[data-calc-total]'), detail = calc.querySelector('[data-calc-detail]'), pers = calc.querySelector('[data-calc-personnes]');
    var affiche = { v: 0 };
    function maj(n, anime) {
      n = Math.max(10, Math.min(T.max, n)); range.value = n; out.textContent = n;
      range.style.setProperty('--r', ((n - 10) / 10 * 100) + '%');
      var supp = n - T.inclus, tot = T.base + supp * T.supp;
      detail.textContent = '750 € + ' + supp + ' × 75 €' + ', soit ' + Math.round(tot / n) + ' € par personne';
      if (supp === 0) detail.textContent = 'Forfait de base pour 10 personnes, soit 75 € par personne';
      pers.innerHTML = Array.apply(null, Array(n)).map(function (_, i) { return '<i' + (i >= 10 ? ' class="is-supp"' : '') + '></i>'; }).join('');
      if (G && anime && !ICE.calme) G.to(affiche, { v: tot, duration: .6, ease: 'power2.out', onUpdate: function () { total.textContent = Math.round(affiche.v).toLocaleString('fr-FR') + ' €'; } });
      else { affiche.v = tot; total.textContent = tot.toLocaleString('fr-FR') + ' €'; }
    }
    range.addEventListener('input', function () { maj(+range.value, true); });
    calc.querySelector('[data-calc-moins]').addEventListener('click', function () { maj(+range.value - 1, true); });
    calc.querySelector('[data-calc-plus]').addEventListener('click', function () { maj(+range.value + 1, true); });
    calc.querySelector('[data-calc-reserver]').addEventListener('click', function () {
      ICE.Devis.ouvrir('stage-1-jour', { n: +range.value, date: calc.querySelector('[data-calc-date]').value });
    });
    maj(+range.value, false);
  }
})();
