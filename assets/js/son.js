/* ICE Attitude — ambiance sonore générée en direct (Web Audio) :
   vent dans les feuilles, quelques oiseaux, crépitement du feu.
   Rien ne joue tant que le visiteur n'a pas cliqué sur « Son ». */
(function () {
  'use strict';
  var ICE = window.ICE = window.ICE || {};
  var ctx = null, master = null, on = false, feu = 0, timers = [], vent = null;

  function bruit(sec) {
    var b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2 + w * 0.04; }
    return b;
  }
  function blanc(sec) {
    var b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function init() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // vent : bruit brun filtré, volume qui respire
    var src = ctx.createBufferSource(); src.buffer = bruit(6); src.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .5;
    var g = ctx.createGain(); g.gain.value = .22;
    var lfo = ctx.createOscillator(); lfo.frequency.value = .07; var lg = ctx.createGain(); lg.gain.value = .12;
    lfo.connect(lg); lg.connect(g.gain);
    var lfo2 = ctx.createOscillator(); lfo2.frequency.value = .11; var lg2 = ctx.createGain(); lg2.gain.value = 260;
    lfo2.connect(lg2); lg2.connect(bp.frequency);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(); lfo.start(); lfo2.start();
    vent = g;
    ICE.Son.buffer = blanc(1);
    return true;
  }
  function crepite() {
    if (!on) return;
    var n = 1 + Math.floor(Math.random() * (2 + feu * 4));
    for (var i = 0; i < n; i++) {
      var t = ctx.currentTime + Math.random() * .12;
      var s = ctx.createBufferSource(); s.buffer = ICE.Son.buffer; s.playbackRate.value = .6 + Math.random() * 1.6;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900 + Math.random() * 2600;
      var g = ctx.createGain(); var v = (.05 + Math.random() * .16) * (.45 + feu * 1.1);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .002); g.gain.exponentialRampToValueAtTime(.0001, t + .02 + Math.random() * .06);
      s.connect(hp); hp.connect(g); g.connect(master); s.start(t, Math.random() * .8, .12);
    }
    timers.push(setTimeout(crepite, (90 + Math.random() * 520) / (1 + feu * 2.5)));
  }
  function oiseau() {
    if (!on) return;
    var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = 2600 + Math.random() * 1600;
    o.type = 'sine';
    var notes = 2 + Math.floor(Math.random() * 4);
    g.gain.setValueAtTime(0, t);
    for (var k = 0; k < notes; k++) {
      var tk = t + k * (.09 + Math.random() * .05);
      o.frequency.setValueAtTime(f * (1 + Math.random() * .15), tk);
      o.frequency.exponentialRampToValueAtTime(f * (.75 + Math.random() * .2), tk + .07);
      g.gain.linearRampToValueAtTime(.022, tk + .01); g.gain.linearRampToValueAtTime(0, tk + .075);
    }
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.6 - .8; o.connect(g); g.connect(pan); pan.connect(master); } else { o.connect(g); g.connect(master); }
    o.start(t); o.stop(t + notes * .16 + .1);
    timers.push(setTimeout(oiseau, 5000 + Math.random() * 9000));
  }

  ICE.Son = {
    actif: function () { return on; },
    demarrer: function () {
      if (!ctx && !init()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      on = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(.9, ctx.currentTime, .6);
      crepite(); timers.push(setTimeout(oiseau, 2500));
      return true;
    },
    arreter: function () {
      on = false; timers.forEach(clearTimeout); timers = [];
      if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, .25); }
    },
    basculer: function () { return on ? (this.arreter(), false) : this.demarrer(); },
    feu: function (v) { feu = Math.max(0, Math.min(1, v)); if (vent && ctx) vent.gain.setTargetAtTime(.22 - feu * .08, ctx.currentTime, .3); },
    braise: function () {
      if (!on) return;
      var t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = ICE.Son.buffer;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(3200, t + .8);
      var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .25); g.gain.exponentialRampToValueAtTime(.001, t + 1.6);
      s.loop = true; s.connect(lp); lp.connect(g); g.connect(master); s.start(t); s.stop(t + 1.7);
      this.feu(1); var self = this; setTimeout(function () { self.feu(.3); }, 1800);
    }
  };
})();
