/* Procedural responders for the hangar scenario (x = forward, y = up).
   kind: 'turnout' (structural/ARFF gear + SCBA), 'hazmat' (Level A encapsulated suit), 'officer' (white helmet, command vest). */
(function (root) {
'use strict';
const cache = {};
function mats(THREE) {
  if (cache.m) return cache.m;
  const S = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .75, metalness: 0 }, o || {}));
  cache.m = {
    navy: S(0x1c2430, { roughness: .85 }),
    sand: S(0xb59a5c, { roughness: .9 }),
    refl: S(0xd8e08a, { emissive: 0x6d7330, emissiveIntensity: .6, roughness: .35, metalness: .3 }),
    silver: S(0xd9dde2, { emissive: 0x444444, emissiveIntensity: .5, roughness: .3, metalness: .6 }),
    helmY: S(0xf2c21a, { roughness: .35, metalness: .1 }),
    helmW: S(0xf3f3f0, { roughness: .35, metalness: .1 }),
    helmR: S(0xc8141e, { roughness: .35, metalness: .1 }),
    visor: S(0x111a22, { roughness: .08, metalness: .8 }),
    boot: S(0x0d0d0e, { roughness: .6 }),
    glove: S(0x2b2116, { roughness: .9 }),
    cyl: S(0xd8d8d0, { roughness: .35, metalness: .5 }),
    cylBand: S(0xd2b11c, { roughness: .4 }),
    hzA: S(0xd7df1f, { roughness: .45, metalness: .05 }),
    hzSeam: S(0x2a2d10, { roughness: .6 }),
    hzVisor: new THREE.MeshPhysicalMaterial({ color: 0x9fb4c0, roughness: .05, metalness: .1, transparent: true, opacity: .55, side: THREE.DoubleSide }),
    vest: S(0xf6e71a, { emissive: 0x3a3600, roughness: .6 }),
    skin: S(0xb58463, { roughness: .8 })
  };
  return cache.m;
}
function buildResponder(THREE, kind) {
  const M = mats(THREE), g = new THREE.Group(), hz = kind === 'hazmat';
  const mesh = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; (p || g).add(o); return o; };
  const suit = hz ? M.hzA : (kind === 'officer' ? M.navy : M.sand);
  const bulk = hz ? 1.25 : 1;
  // legs (pivot at hip)
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0, .92, s * .11 * bulk); g.add(hip);
    mesh(new THREE.CapsuleGeometry(.085 * bulk, .58, 4, 10), suit, 0, -.4, 0, hip);
    if (!hz) mesh(new THREE.CylinderGeometry(.095, .095, .05, 10), M.refl, 0, -.55, 0, hip);
    mesh(new THREE.BoxGeometry(.27, .12, .13 * bulk), hz ? M.hzSeam : M.boot, .05, -.86, 0, hip);
    legs.push(hip);
  }
  // torso
  const torso = mesh(new THREE.CapsuleGeometry(.2 * bulk, .38, 4, 12), suit, 0, 1.27, 0); torso.scale.set(.75, 1, 1.12);
  if (!hz) {
    for (const y of [1.08, 1.4]) { const b = mesh(new THREE.CylinderGeometry(.205, .205, .055, 16), M.refl, 0, y, 0); b.scale.set(.76, 1, 1.13); }
    const sb = mesh(new THREE.CylinderGeometry(.208, .208, .022, 16), M.silver, 0, 1.08, 0); sb.scale.set(.77, 1, 1.14);
    // SCBA: cylinder + backplate
    mesh(new THREE.BoxGeometry(.05, .5, .26), M.boot, -.17, 1.28, 0);
    mesh(new THREE.CylinderGeometry(.085, .085, .52, 12), M.cyl, -.27, 1.27, 0);
    mesh(new THREE.CylinderGeometry(.087, .087, .05, 12), M.cylBand, -.27, 1.4, 0);
    if (kind === 'officer') { const v = mesh(new THREE.CapsuleGeometry(.205, .3, 4, 12), M.vest, 0, 1.3, 0); v.scale.set(.77, .9, 1.14); }
  } else {
    // encapsulating suit: bulge for the SCBA worn inside + zipper seam
    mesh(new THREE.SphereGeometry(.26, 14, 10), M.hzA, -.16, 1.33, 0).scale.set(.8, 1.15, 1.15);
    mesh(new THREE.BoxGeometry(.012, .55, .03), M.hzSeam, .17, 1.25, 0);
  }
  // arms (pivot at shoulder)
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0, 1.5, s * .27 * bulk); g.add(sh);
    mesh(new THREE.CapsuleGeometry(.07 * bulk, .5, 4, 10), suit, 0, -.3, 0, sh);
    if (!hz) mesh(new THREE.CylinderGeometry(.078, .078, .04, 10), M.refl, 0, -.36, 0, sh);
    mesh(new THREE.SphereGeometry(.07 * bulk, 10, 8), hz ? M.hzSeam : M.glove, 0, -.62, 0, sh);
    arms.push(sh);
  }
  // head
  if (hz) {
    const hood = mesh(new THREE.SphereGeometry(.24, 18, 14), M.hzA, 0, 1.78, 0); hood.scale.set(1, 1.05, 1.05);
    const vis = mesh(new THREE.SphereGeometry(.245, 18, 12, -Math.PI * .38, Math.PI * .76, Math.PI * .28, Math.PI * .38), M.hzVisor, .005, 1.78, 0);
    vis.rotation.y = 0; mesh(new THREE.SphereGeometry(.12, 12, 10), M.skin, .02, 1.78, 0);
  } else {
    mesh(new THREE.SphereGeometry(.105, 14, 10), M.skin, 0, 1.73, 0);
    // full-face mask
    mesh(new THREE.SphereGeometry(.1, 14, 10, -Math.PI * .45, Math.PI * .9, Math.PI * .3, Math.PI * .45), M.visor, .025, 1.72, 0);
    const hm = kind === 'officer' ? M.helmW : M.helmY;
    const helm = mesh(new THREE.SphereGeometry(.15, 18, 12, 0, Math.PI * 2, 0, Math.PI * .55), hm, 0, 1.76, 0); helm.scale.set(1.12, 1, 1);
    mesh(new THREE.CylinderGeometry(.19, .2, .02, 20), hm, -.03, 1.77, 0).scale.set(1.15, 1, 1);
    mesh(new THREE.TorusGeometry(.15, .012, 6, 20), M.refl, 0, 1.79, 0).rotation.x = Math.PI / 2;
  }
  // a hand anchor for nozzles / radios (in front of the chest)
  const hand = new THREE.Object3D(); hand.position.set(.42, 1.12, .05); g.add(hand);
  g.userData = { legs, arms, hand, kind, phase: Math.random() * 6 };
  return g;
}
// walk cycle: s = 0 (idle) .. 1 (walking)
function animateResponder(g, t, s, pose) {
  const u = g.userData, ph = t * 7.5 + u.phase, sw = Math.sin(ph) * .55 * s;
  u.legs[0].rotation.z = sw; u.legs[1].rotation.z = -sw;
  if (pose === 'nozzle') { u.arms[0].rotation.z = 1.25; u.arms[1].rotation.z = 1.35; u.arms[0].rotation.x = -.25; u.arms[1].rotation.x = .35; }
  else if (pose === 'radio') { u.arms[0].rotation.z = -sw * .8; u.arms[1].rotation.z = 2.2; u.arms[1].rotation.x = .5; }
  else { u.arms[0].rotation.z = -sw * .8; u.arms[1].rotation.z = sw * .8; u.arms[0].rotation.x = u.arms[1].rotation.x = 0; }
  const bob = Math.abs(Math.cos(ph)) * .03 * s;
  g.position.y = bob;
}
root.buildResponder = buildResponder;
root.animateResponder = animateResponder;
})(typeof window !== 'undefined' ? window : this);
