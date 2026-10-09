/* Procedural responders for the hangar scenario (x = forward, y = up, z = right). Jointed figures (~1.8 m):
   hips/knees, shoulders/elbows, lathe-turned coat, SCBA with mask hose, jet-style ARFF helmet with neck curtain.
   kind: 'turnout' (ARFF gear + SCBA), 'hazmat' (Level A encapsulated suit), 'officer' (white helmet, command vest). */
(function (root) {
'use strict';
const cache = {};
function mats(THREE) {
  if (cache.m) return cache.m;
  const S = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8, metalness: 0 }, o || {}));
  cache.m = {
    sand: S(0xb39a62, { roughness: .92 }), sandDk: S(0x8f7a4c, { roughness: .92 }), navy: S(0x1d2632, { roughness: .88 }),
    refl: S(0xcfd86a, { emissive: 0x5d6326, emissiveIntensity: .7, roughness: .35, metalness: .2 }),
    silver: S(0xd6dade, { emissive: 0x555555, emissiveIntensity: .6, roughness: .25, metalness: .7 }),
    helmY: S(0xf0c419, { roughness: .28, metalness: .1 }), helmW: S(0xf4f4f1, { roughness: .28, metalness: .1 }),
    shield: new THREE.MeshStandardMaterial({ color: 0xd9a531, roughness: .06, metalness: .95, transparent: true, opacity: .85 }),
    visor: S(0x0e151c, { roughness: .06, metalness: .8 }), rubber: S(0x16171a, { roughness: .7 }),
    boot: S(0x0c0c0d, { roughness: .55 }), sole: S(0x1f1a14, { roughness: .9 }), glove: S(0x2a2116, { roughness: .9 }),
    cyl: S(0x2b2f35, { roughness: .35, metalness: .5 }), valve: S(0xb8bec4, { roughness: .3, metalness: .9 }), strap: S(0x141518, { roughness: .8 }),
    hzA: S(0xc9d61c, { roughness: .42, metalness: .05 }), hzDk: S(0x2b3110, { roughness: .6 }),
    hzVisor: new THREE.MeshPhysicalMaterial({ color: 0xa8bcc8, roughness: .03, metalness: .1, transparent: true, opacity: .45, side: THREE.DoubleSide }),
    vest: S(0xf2e21c, { emissive: 0x2e2a00, roughness: .65 }), skin: S(0xa9785a, { roughness: .75 }), radio: S(0x101113, { roughness: .5 })
  };
  return cache.m;
}
function textTex(THREE, txt, bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 64); g.fillStyle = fg; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildResponder(THREE, kind) {
  const M = mats(THREE), g = new THREE.Group(), hz = kind === 'hazmat', off = kind === 'officer';
  const B = hz ? 1.22 : 1;                       // bulk factor
  const suit = hz ? M.hzA : (off ? M.navy : M.sand), suitDk = hz ? M.hzA : (off ? M.navy : M.sandDk);
  const mesh = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; (p || g).add(o); return o; };
  const limb = (r0, r1, len, m, p) => mesh(new THREE.CylinderGeometry(r0, r1, len, 12).translate(0, -len / 2, 0), m, 0, 0, 0, p);
  const ring = (r, h, m, y, p, sx, sz) => { const o = mesh(new THREE.CylinderGeometry(r, r, h, 20, 1, true), m, 0, y, 0, p); o.scale.set(sx || 1, 1, sz || 1); return o; };
  const hips = [], knees = [], shoulders = [], elbows = [];
  // ---- legs: hip -> thigh -> knee -> shin -> boot
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0, .93, s * .1 * B); g.add(hip);
    limb(.095 * B, .08 * B, .45, suit, hip);
    const knee = new THREE.Group(); knee.position.y = -.45; hip.add(knee);
    mesh(new THREE.SphereGeometry(.08 * B, 12, 8), suitDk, 0, 0, 0, knee);
    limb(.08 * B, .07 * B, .4, suit, knee);
    if (!hz) { ring(.082, .045, M.refl, -.3, knee); ring(.083, .014, M.silver, -.3, knee); }
    const boot = mesh(new THREE.BoxGeometry(.27, .13, .12 * B).translate(.04, 0, 0), hz ? M.hzDk : M.boot, 0, -.44, 0, knee);
    mesh(new THREE.BoxGeometry(.29, .03, .13 * B).translate(.04, 0, 0), M.sole, 0, -.065, 0, boot);
    hips.push(hip); knees.push(knee);
  }
  // ---- torso: lathe-turned coat (hem flares slightly), scaled to an oval chest
  const prof = hz ? [[.0, .72], [.23, .72], [.25, .82], [.24, .98], [.26, 1.2], [.25, 1.38], [.2, 1.5], [.1, 1.56], [0, 1.57]]
                  : [[.0, .7], [.205, .7], [.215, .74], [.19, .95], [.205, 1.15], [.21, 1.32], [.19, 1.45], [.12, 1.52], [.07, 1.55], [0, 1.555]];
  const coat = mesh(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 28), suit); coat.scale.set(.74, 1, 1.12);
  if (!hz) {
    for (const y of [.78, 1.17]) { const r = ring(.215, .05, M.refl, y, g, .745, 1.125); r.scale.x = .75; ring(.217, .015, M.silver, y, g, .75, 1.13); }
    mesh(new THREE.BoxGeometry(.012, .78, .02), M.strap, .155, 1.1, 0);              // zip / storm flap
    // collar
    const col = mesh(new THREE.CylinderGeometry(.085, .1, .1, 16, 1, true), suitDk, 0, 1.55, 0); col.material = suitDk;
    // SCBA harness straps, backplate, carbon cylinder with valve
    for (const s of [-1, 1]) { const st = mesh(new THREE.BoxGeometry(.05, .5, .035), M.strap, .14, 1.27, s * .1); st.rotation.x = s * .12; }
    mesh(new THREE.BoxGeometry(.05, .2, .32), M.strap, .02, .98, 0).scale.set(3.4, .4, 1.15);   // waist belt
    mesh(new THREE.BoxGeometry(.04, .55, .28), M.strap, -.17, 1.22, 0);
    mesh(new THREE.CapsuleGeometry(.085, .44, 4, 14), M.cyl, -.27, 1.24, 0);
    mesh(new THREE.CylinderGeometry(.03, .03, .08, 10), M.valve, -.27, .96, 0);
    if (off) { const v = ring(.218, .5, M.vest, 1.18, g, .76, 1.14);
      const lab = mesh(new THREE.PlaneGeometry(.26, .065), new THREE.MeshBasicMaterial({ map: textTex(THREE, 'COMMAND', '#f2e21c', '#111') }), -.165, 1.3, 0); lab.rotation.y = -Math.PI / 2; void v; }
  } else {
    mesh(new THREE.SphereGeometry(.24, 16, 12), M.hzA, -.17, 1.28, 0).scale.set(.8, 1.25, 1.1);   // SCBA hump inside suit
    mesh(new THREE.BoxGeometry(.015, .6, .03), M.hzDk, .19, 1.18, 0);                       // gas-tight zip
    ring(.24, .05, M.hzDk, .96, g, .76, 1.13);                                               // waist belt
  }
  // ---- arms: shoulder -> upper arm -> elbow -> forearm -> glove
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0, 1.43, s * .235 * B); g.add(sh);
    mesh(new THREE.SphereGeometry(.085 * B, 12, 10), suit, 0, 0, 0, sh);
    limb(.075 * B, .066 * B, .3, suit, sh);
    if (!hz) { ring(.077, .04, M.refl, -.22, sh); }
    const el = new THREE.Group(); el.position.y = -.3; sh.add(el);
    mesh(new THREE.SphereGeometry(.066 * B, 10, 8), suitDk, 0, 0, 0, el);
    limb(.066 * B, .058 * B, .27, suit, el);
    if (!hz) ring(.064, .05, M.refl, -.2, el);
    mesh(new THREE.BoxGeometry(.06, .13, .1).translate(0, -.06, 0), hz ? M.hzDk : M.glove, 0, -.27, 0, el);
    shoulders.push(sh); elbows.push(el);
  }
  // ---- head
  const head = new THREE.Group(); head.position.y = 1.58; g.add(head);
  if (hz) {
    const hood = mesh(new THREE.SphereGeometry(.25, 20, 14), M.hzA, -.02, .18, 0, head); hood.scale.set(1, 1.05, 1.05);
    mesh(new THREE.SphereGeometry(.105, 14, 10), M.skin, .03, .17, 0, head);
    mesh(new THREE.SphereGeometry(.09, 12, 8, Math.PI * .7, Math.PI * .6, Math.PI * .45, Math.PI * .3), M.visor, .06, .15, 0, head);     // SCBA mask inside
    const vis = mesh(new THREE.SphereGeometry(.255, 22, 12, Math.PI * .64, Math.PI * .72, Math.PI * .26, Math.PI * .36), M.hzVisor, -.01, .18, 0, head); vis.scale.set(1, 1.05, 1.05);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.03, .03, .03, 10), M.hzDk, -.05, .05, s * .21, head).rotation.x = Math.PI / 2;  // exhaust valves
  } else {
    mesh(new THREE.CylinderGeometry(.05, .055, .08, 10), M.skin, 0, .02, 0, head);
    const sk = mesh(new THREE.SphereGeometry(.105, 16, 12), M.skin, 0, .15, 0, head); sk.scale.set(.95, 1.12, .9);
    // full-face SCBA mask + regulator + hose to the waist
    const mk = mesh(new THREE.SphereGeometry(.112, 16, 12, Math.PI * .58, Math.PI * .84, Math.PI * .28, Math.PI * .5), M.visor, .015, .15, 0, head); mk.scale.set(1, 1.1, .95);
    mesh(new THREE.TorusGeometry(.085, .012, 6, 20, Math.PI * 1.2), M.rubber, .07, .15, 0, head).rotation.set(0, Math.PI / 2, Math.PI * .9);
    const rg = mesh(new THREE.CylinderGeometry(.035, .04, .05, 12), M.rubber, .115, .07, 0, head); rg.rotation.z = Math.PI / 2 - .5;
    const hoseC = new THREE.CatmullRomCurve3([new THREE.Vector3(.13, 1.63, 0), new THREE.Vector3(.2, 1.45, .06), new THREE.Vector3(.18, 1.15, .1), new THREE.Vector3(.12, .98, .13)]);
    mesh(new THREE.TubeGeometry(hoseC, 16, .015, 6, false), M.rubber, 0, 0, 0);
    // jet-style helmet: shell, gold face shield, neck curtain, reflective stripe
    const hm = off ? M.helmW : M.helmY;
    const shell = mesh(new THREE.SphereGeometry(.15, 22, 14, 0, Math.PI * 2, 0, Math.PI * .58), hm, -.015, .17, 0, head); shell.scale.set(1.12, 1.05, 1.02);
    const shield = mesh(new THREE.SphereGeometry(.158, 20, 10, Math.PI * .68, Math.PI * .64, Math.PI * .34, Math.PI * .2), M.shield, -.01, .17, 0, head); shield.scale.set(1.12, 1.05, 1.02);
    shield.rotation.z = .25;
    const curt = mesh(new THREE.CylinderGeometry(.155, .175, .13, 18, 1, true, Math.PI * 1.15, Math.PI * .7), suitDk, -.02, .06, 0, head); curt.material.side = THREE.DoubleSide;
    const st = mesh(new THREE.TorusGeometry(.16, .01, 6, 28), M.refl, -.015, .2, 0, head); st.rotation.x = Math.PI / 2; st.scale.set(1.1, 1, 1);
  }
  // hand anchor for nozzles / radios (in front of the chest), radio for the officer
  const hand = new THREE.Object3D(); hand.position.set(.42, 1.12, .05); g.add(hand);
  if (off) mesh(new THREE.BoxGeometry(.04, .14, .06), M.radio, 0, -.32, 0, elbows[1]);
  g.userData = { hips, knees, shoulders, elbows, legs: hips, arms: shoulders, head, hand, kind, phase: Math.random() * 6 };
  return g;
}
// s = 0 (idle) .. 1 (walking); pose = 'walk' | 'idle' | 'nozzle' | 'radio'
function animateResponder(g, t, s, pose) {
  const u = g.userData, ph = t * 6.2 + u.phase, sw = Math.sin(ph) * .5 * s;
  u.hips[0].rotation.z = sw; u.hips[1].rotation.z = -sw;
  // knee flexes during the swing phase (leg moving forward)
  u.knees[0].rotation.z = -Math.max(0, Math.cos(ph)) * .75 * s - .04;
  u.knees[1].rotation.z = -Math.max(0, -Math.cos(ph)) * .75 * s - .04;
  const breathe = Math.sin(t * 1.6 + u.phase) * .015;
  const [L, Rr] = u.shoulders, [eL, eR] = u.elbows;
  if (pose === 'nozzle') {           // both hands forward on the nozzle / hose
    L.rotation.set(-.35, 0, 1.0); Rr.rotation.set(.3, 0, 1.25); eL.rotation.z = .85; eR.rotation.z = .55;
  } else if (pose === 'radio') {     // left arm relaxed, right hand raised to the mouth with the radio
    L.rotation.set(-.08, 0, -sw * .8 + breathe); Rr.rotation.set(.35, 0, .55); eR.rotation.z = 2.2; eL.rotation.z = .15;
  } else {
    L.rotation.set(-.08, 0, -sw * .8 + breathe); Rr.rotation.set(.08, 0, sw * .8 - breathe); eL.rotation.z = .15 + Math.max(0, -sw) * .5; eR.rotation.z = .15 + Math.max(0, sw) * .5;
  }
  u.head.rotation.y = Math.sin(t * .4 + u.phase) * .12 * (1 - s);
  g.position.y = Math.abs(Math.cos(ph)) * .025 * s;
}
root.buildResponder = buildResponder;
root.animateResponder = animateResponder;
})(typeof window !== 'undefined' ? window : this);
