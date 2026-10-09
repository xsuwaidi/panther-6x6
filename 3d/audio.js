/* Synthesized scenario audio (no files): station alarm, siren wail, diesel engine, pump/water roar, fire crackle.
   Starts only after a user gesture (browser autoplay rules). */
(function (root) {
'use strict';
function createAudio() {
  let ctx = null, master, nodes = null, on = false;
  function noiseBuf(c, sec) { const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = w * .5 + last * 3; } return b; }
  function loopNoise(c) { const s = c.createBufferSource(); s.buffer = nodes.noise; s.loop = true; s.start(); return s; }
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    nodes = { noise: noiseBuf(ctx, 3) };
    // siren: wail between ~650 and ~1450 Hz
    const sg = ctx.createGain(); sg.gain.value = 0; sg.connect(master);
    const sf = ctx.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 2600; sf.connect(sg);
    const so = ctx.createOscillator(); so.type = 'sawtooth'; so.frequency.value = 1000; so.connect(sf); so.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = .22; const lg = ctx.createGain(); lg.gain.value = 400; lfo.connect(lg); lg.connect(so.frequency); lfo.start();
    // engine: low sawtooth + filtered noise
    const eg = ctx.createGain(); eg.gain.value = 0; eg.connect(master);
    const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 260; ef.connect(eg);
    const eo = ctx.createOscillator(); eo.type = 'sawtooth'; eo.frequency.value = 42; eo.connect(ef); eo.start();
    const en = loopNoise(ctx); const enf = ctx.createBiquadFilter(); enf.type = 'lowpass'; enf.frequency.value = 180; const eng = ctx.createGain(); eng.gain.value = .6; en.connect(enf); enf.connect(eng); eng.connect(ef);
    // water / pump roar
    const wg = ctx.createGain(); wg.gain.value = 0; wg.connect(master);
    const wn = loopNoise(ctx); const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 900; wf.Q.value = .45; wn.connect(wf); wf.connect(wg);
    // fire: low roar + crackle
    const fg = ctx.createGain(); fg.gain.value = 0; fg.connect(master);
    const fn = loopNoise(ctx); const ff = ctx.createBiquadFilter(); ff.type = 'lowpass'; ff.frequency.value = 420; fn.connect(ff); ff.connect(fg);
    const cg = ctx.createGain(); cg.gain.value = 0; cg.connect(master);
    const cn = loopNoise(ctx); const cf = ctx.createBiquadFilter(); cf.type = 'highpass'; cf.frequency.value = 2500; cn.connect(cf); cf.connect(cg);
    // alarm tone
    const ag = ctx.createGain(); ag.gain.value = 0; ag.connect(master);
    const ao = ctx.createOscillator(); ao.type = 'square'; ao.frequency.value = 880; const af = ctx.createBiquadFilter(); af.type = 'lowpass'; af.frequency.value = 3000; ao.connect(af); af.connect(ag); ao.start();
    Object.assign(nodes, { sg, eg, eo, ef, wg, fg, cg, ag, ao });
  }
  const set = (p, v, tc) => p.setTargetAtTime(v, ctx.currentTime, tc || .15);
  return {
    get on() { return on; },
    toggle() {
      if (!ctx) build();
      on = !on; if (on && ctx.state === 'suspended') ctx.resume();
      set(master.gain, on ? .9 : 0, .2); return on;
    },
    // s: {siren 0..1, speed m/s, flow 0..1+, fire 0..1, alarm bool, t seconds}
    update(s) {
      if (!ctx || !on) return;
      const n = nodes;
      set(n.sg.gain, s.siren * .05);
      set(n.eg.gain, .05 + Math.min(1, s.speed / 30) * .07 + (s.flow > .05 ? .05 : 0));
      set(n.eo.frequency, 38 + Math.min(1, s.speed / 30) * 40 + (s.flow > .05 ? 18 : 0), .4);
      set(n.ef.frequency, 220 + Math.min(1, s.speed / 30) * 260, .4);
      set(n.wg.gain, Math.min(1, s.flow) * .22, .3);
      set(n.fg.gain, s.fire * .16, .4);
      set(n.cg.gain, s.fire * (Math.random() < .25 ? .05 : .004), .02);
      const beep = s.alarm ? ((s.t * 2.5) % 1 < .5 ? 1 : 0) : 0;
      set(n.ag.gain, beep * .035, .01); n.ao.frequency.setValueAtTime(((s.t * 1.25) % 1 < .5) ? 880 : 660, ctx.currentTime);
    }
  };
}
root.createScenarioAudio = createAudio;
})(typeof window !== 'undefined' ? window : this);
