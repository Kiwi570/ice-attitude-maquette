/* ICE Attitude — demande de devis en 5 étapes (tiroir et version intégrée).
   Simulation : aucune donnée n'est envoyée. */
(function () {
  'use strict';
  var ICE = window.ICE = window.ICE || {};
  var G = window.gsap;
  var TYPES = (ICE.devisTypes || []), T = ICE.tarifs || {};
  function fmt(n) { return n.toLocaleString('fr-FR') + ' €'; }
  function typeDe(id) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === id) return TYPES[i]; return TYPES[0]; }

  function estimation(t, n, format) {
    if (t.id === 'stage-1-jour') { var s = T.stage1jour, tot = s.base + Math.max(0, n - s.inclus) * s.supp; return { prix: fmt(tot), txt: 'Base 750 € pour 10 personnes, ' + (n > 10 ? (n - 10) + ' × 75 € en plus' : 'aucune personne en plus') }; }
    if (t.id === 'anniversaire') return n <= 10 ? { prix: fmt(T.anniversaire.base), txt: 'Forfait pour 10 enfants, kit survie offert' } : { prix: fmt(T.anniversaire.base) + ' + supplément', txt: 'Forfait pour 10 enfants ; au-delà, tarif à confirmer' };
    if (t.id === 'evg') return /demi/i.test(format || '') ? { prix: 'dès ' + fmt(T.evg.parPers * Math.max(n, T.evg.base)), txt: 'À partir de 55 € par personne pour une demi-journée, base 10 personnes' } : { prix: 'Sur devis', txt: 'Tarif de la journée : sur devis' };
    if (t.id === 'stage-2-jours') { var pp = n >= T.stage2jours.seuil ? T.stage2jours.parPersGroupe : T.stage2jours.parPers; return { prix: fmt(pp * n), txt: pp + ' € par personne' + (n >= 4 ? ' (tarif dès 4 personnes)' : '') }; }
    if (t.id === 'aubrac') return { prix: fmt(T.aubrac.parPers * n), txt: '480 € par personne, tarifs de groupe sur demande' };
    return { prix: 'Sur devis', txt: 'Devis et plaquette personnalisée selon votre projet' };
  }

  function Formulaire(form) {
    var self = this;
    this.form = form; this.etape = 1;
    var etapes = form.querySelectorAll('.devis__etape'), puces = form.querySelectorAll('.devis__etapes li');
    var prec = form.querySelector('[data-prec]'), suiv = form.querySelector('[data-suiv]'), envoyer = form.querySelector('[data-envoyer]');
    var range = form.querySelector('input[name="participants"]'), sortie = form.querySelector('[data-nb-sortie]'), aide = form.querySelector('[data-nb-aide]');
    var formats = form.querySelector('[data-formats]'), objectifs = form.querySelector('[data-objectifs]');
    var recap = form.querySelector('[data-recap]'), estim = form.querySelector('[data-estimation]'), err = form.querySelector('[data-erreur]');
    var succes = form.querySelector('[data-succes]'), nav = form.querySelector('.devis__nav');

    function val(name) { var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('[name="' + name + '"]:not([type="radio"]):not([type="checkbox"])'); return el ? el.value : ''; }
    function majRange() {
      var p = (range.value - range.min) / Math.max(1, range.max - range.min) * 100;
      range.style.setProperty('--r', p + '%'); sortie.textContent = range.value;
    }
    function majType(garderNb) {
      var t = typeDe(val('type'));
      range.min = t.min; range.max = t.max;
      if (!garderNb) range.value = t.defaut;
      range.value = Math.min(t.max, Math.max(t.min, +range.value));
      aide.textContent = 'De ' + t.min + ' à ' + t.max + (t.id === 'anniversaire' ? ' enfants.' : ' participants.') + (t.id === 'anniversaire' ? ' Présence de deux parents demandée.' : '');
      var actuel = val('format');
      formats.innerHTML = t.formats.map(function (f, i) {
        return '<label class="choix"><input type="radio" name="format" value="' + f + '"' + ((actuel === f || (!actuel || t.formats.indexOf(actuel) < 0) && i === 0) ? ' checked' : '') + '><span class="choix__txt">' + f + '</span></label>';
      }).join('');
      objectifs.hidden = t.id !== 'team-building';
      majRange(); majRecap();
    }
    function majRecap() {
      var t = typeDe(val('type')), n = +range.value, f = val('format'), d = val('date'), lieu = val('lieu');
      var obj = Array.prototype.map.call(form.querySelectorAll('[name="objectif"]:checked'), function (c) { return c.value; });
      var dateTxt = d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'À définir';
      if (form.querySelector('[name="flexible"]').checked) dateTxt += ' (flexible)';
      var lignes = [['Projet', t.label], ['Participants', n + (t.id === 'anniversaire' ? ' enfants' : ' personnes')], ['Format', f || '—'], ['Date', dateTxt], ['Lieu', lieu]];
      if (t.id === 'team-building' && obj.length) lignes.push(['Objectifs', obj.join(', ')]);
      recap.innerHTML = lignes.map(function (l) { return '<div><dt>' + l[0] + '</dt><dd>' + l[1] + '</dd></div>'; }).join('');
      var e = estimation(t, n, f);
      estim.innerHTML = 'Estimation<strong>' + e.prix + '</strong>' + e.txt + '.';
    }
    function aller(n) {
      self.etape = Math.max(1, Math.min(5, n));
      etapes.forEach(function (e) { e.classList.toggle('is-active', +e.getAttribute('data-etape') === self.etape); });
      puces.forEach(function (p, i) { p.classList.toggle('is-active', i + 1 === self.etape); p.classList.toggle('is-fait', i + 1 < self.etape); });
      prec.hidden = self.etape === 1; suiv.hidden = self.etape === 5; envoyer.hidden = self.etape !== 5;
      var leg = form.querySelector('.devis__etape.is-active .devis__legende');
      var pan = form.querySelector('.devis__panneaux'); if (pan) pan.scrollTop = 0;
      if (leg && self.focusApres) { leg.setAttribute('tabindex', '-1'); leg.focus({ preventScroll: true }); }
    }
    function valider() {
      var nom = form.querySelector('[name="nom"]'), mail = form.querySelector('[name="email"]'), msgs = [];
      [nom, mail].forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (!nom.value.trim()) { msgs.push('Indiquez votre nom.'); nom.setAttribute('aria-invalid', 'true'); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { msgs.push('Indiquez une adresse e-mail valide, par exemple prenom@entreprise.fr.'); mail.setAttribute('aria-invalid', 'true'); }
      err.hidden = !msgs.length; err.textContent = msgs.join(' ');
      if (msgs.length) (nom.getAttribute('aria-invalid') ? nom : mail).focus();
      return !msgs.length;
    }
    form.addEventListener('change', function (e) { if (e.target.name === 'type') majType(false); else majRecap(); });
    form.addEventListener('input', function (e) { if (e.target === range) { majRange(); majRecap(); } });
    suiv.addEventListener('click', function () { self.focusApres = true; aller(self.etape + 1); });
    prec.addEventListener('click', function () { self.focusApres = true; aller(self.etape - 1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (self.etape < 5) { aller(self.etape + 1); return; }
      if (!valider()) return;
      etapes.forEach(function (x) { x.classList.remove('is-active'); });
      nav.hidden = true; succes.hidden = false; succes.focus();
      puces.forEach(function (p) { p.classList.remove('is-active'); p.classList.add('is-fait'); });
      if (ICE.Son) ICE.Son.braise();
      if (G && !ICE.calme) G.from(succes.children, { opacity: 0, y: 20, stagger: .1, duration: .7 });
    });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit' && self.etape < 5 && e.target.tagName !== 'BUTTON') { e.preventDefault(); self.focusApres = true; aller(self.etape + 1); }
    });
    this.preparer = function (type, opts) {
      opts = opts || {};
      form.reset(); succes.hidden = true; nav.hidden = false; err.hidden = true;
      if (type) { var r = form.querySelector('[name="type"][value="' + type + '"]'); if (r) r.checked = true; }
      majType(false);
      if (opts.n) { range.value = opts.n; majRange(); }
      if (opts.date) form.querySelector('[name="date"]').value = opts.date;
      majRecap();
      self.focusApres = false;
      aller(type ? 2 : 1);
    };
    majType(false); aller(1);
  }

  var formulaires = [];
  document.querySelectorAll('[data-devis-form]').forEach(function (f) { var x = new Formulaire(f); f._f = x; formulaires.push(x); });

  /* ---------- Tiroir ---------- */
  var tiroir = document.querySelector('[data-tiroir]'), dernierFocus = null;
  var tf = tiroir && tiroir.querySelector('[data-devis-form]');
  function piege(e) {
    if (e.key === 'Escape') { fermer(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(tiroir.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'), function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  function ouvrir(type, opts) {
    if (!tiroir) return;
    dernierFocus = document.activeElement;
    tf._f.preparer(type, opts);
    tiroir.hidden = false; document.documentElement.classList.add('tiroir-ouvert');
    if (ICE.lenis) ICE.lenis.stop(); document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { tiroir.classList.add('is-ouvert'); }); });
    setTimeout(function () { var leg = tiroir.querySelector('.devis__etape.is-active .devis__legende'); if (leg) { leg.setAttribute('tabindex', '-1'); leg.focus(); } }, 120);
    document.addEventListener('keydown', piege);
  }
  function fermer() {
    if (!tiroir || tiroir.hidden) return;
    tiroir.classList.remove('is-ouvert');
    document.removeEventListener('keydown', piege);
    setTimeout(function () { tiroir.hidden = true; document.documentElement.classList.remove('tiroir-ouvert'); }, ICE.calme ? 0 : 600);
    if (ICE.lenis) ICE.lenis.start(); document.body.style.overflow = '';
    if (dernierFocus && dernierFocus.focus) dernierFocus.focus();
  }
  if (tiroir) tiroir.querySelectorAll('[data-tiroir-fermer]').forEach(function (b) { b.addEventListener('click', fermer); });
  ICE.Devis = { ouvrir: ouvrir, fermer: fermer, estimation: estimation };
})();
