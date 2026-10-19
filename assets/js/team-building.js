/* ICE Attitude — page team building : objectifs portés par des particules qui se rassemblent en cercle,
   formats à durée qui se remplit, savoir-faire en galerie, devis intégré. */
(function () {
  'use strict';
  var ICE = window.ICE, G = window.gsap, ST = window.ScrollTrigger;
  var $ = ICE.$, $$ = ICE.$$, anim = ICE.anim;

  ICE.initHero({ intro: false });
  if (anim) G.from('[data-puces] li', { opacity: 0, y: 14, stagger: .06, duration: .7, delay: .9 });

  /* ---------- Cohésion : des points épars qui forment un cercle ---------- */
  var sec = $('[data-objectifs-section]');
  if (sec) {
    var items = $$('.objectif', sec), cv = sec.querySelector('[data-cohesion]');
    var progres = { p: 0 };
    function activer(p) {
      var k = Math.min(items.length - 1, Math.floor(p * items.length * .999));
      items.forEach(function (it, i) { it.classList.toggle('is-actif', i <= k); });
    }
    if (anim && cv) {
      var ctx = cv.getContext('2d'), pts = [], W, H, vis = false;
      function taille() {
        var r = Math.min(devicePixelRatio || 1, 1.5); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * r; cv.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0);
        pts = []; var n = W < 700 ? 46 : 80;
        for (var i = 0; i < n; i++) pts.push({ x0: Math.random() * W, y0: Math.random() * H, a: i / n * Math.PI * 2, ph: Math.random() * 6.28, r: 1.2 + Math.random() * 1.8 });
      }
      taille(); window.addEventListener('resize', taille);
      ICE.visible(sec, function (v) { vis = v; });
      ICE.boucle(function () {
        if (!vis) return;
        var t = performance.now() / 1000, p = progres.p, e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var cx = W < 900 ? W * .5 : W * .72, cy = H * .5, R = Math.min(W, H) * (W < 900 ? .32 : .28);
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < pts.length; i++) {
          var q = pts[i], ang = q.a + t * .08 * e;
          var tx = cx + Math.cos(ang) * R, ty = cy + Math.sin(ang) * R;
          var dx = Math.sin(t * .4 + q.ph) * 14 * (1 - e), dy = Math.cos(t * .33 + q.ph) * 14 * (1 - e);
          q.x = q.x0 + (tx - q.x0) * e + dx; q.y = q.y0 + (ty - q.y0) * e + dy;
        }
        if (e > .55) {
          ctx.strokeStyle = 'rgba(255,140,70,' + ((e - .55) * .5).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath();
          for (var j = 0; j < pts.length; j++) { var a = pts[j], b = pts[(j + 1) % pts.length]; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
          ctx.stroke();
        }
        for (var k = 0; k < pts.length; k++) {
          var z = pts[k], glow = .35 + .65 * e;
          ctx.fillStyle = e > .9 ? 'rgba(255,164,92,' + glow + ')' : 'rgba(217,210,195,' + (.35 + .4 * e) + ')';
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1 + e * .5), 0, 6.283); ctx.fill();
        }
      });
      var mm = G.matchMedia();
      mm.add('(min-width: 1000px)', function () {
        sec.classList.add('is-epingle');
        ST.create({ trigger: sec, start: 'top top', end: '+=' + Math.round(window.innerHeight * 1.6), pin: true, scrub: .6, anticipatePin: 1,
          onUpdate: function (s) { progres.p = s.progress; activer(s.progress); } });
      });
      mm.add('(max-width: 999px)', function () {
        ST.create({ trigger: sec, start: 'top 70%', end: 'bottom 40%', scrub: .6, onUpdate: function (s) { progres.p = s.progress; activer(s.progress); } });
      });
    } else { items.forEach(function (it) { it.classList.add('is-actif'); }); }
  }

  /* ---------- Formats : la durée se remplit ---------- */
  if (anim) {
    $$('.format__barre span').forEach(function (b) {
      G.from(b, { scaleX: 0, duration: 1.6, ease: 'power3.inOut', scrollTrigger: { trigger: b, start: 'top 88%', once: true } });
    });
    var rail = $('.competences__rail');
    if (rail) G.from(rail.children, { x: 120, opacity: 0, stagger: .08, duration: 1, scrollTrigger: { trigger: rail, start: 'top 85%', once: true } });
    $$('.mini-membre').forEach(function (m, i) { G.from(m, { opacity: 0, y: 20, duration: .6, delay: i * .05, scrollTrigger: { trigger: m, start: 'top 92%', once: true } }); });
  }
})();
