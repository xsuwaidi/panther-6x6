/* Rosenbauer Panther 6x6 — procedural model v2 (x = forward, y = up, z = right).
   Built from field photos; L 11.5 m · W 3 m · H ~4 m. */
(function (root) {
'use strict';
function buildPanther(THREE, opts) {
  opts = opts || {};
  const LITE = !!opts.lite;
  const root3 = new THREE.Group(); root3.name = 'Panther6x6';
  const body = new THREE.Group(); body.name = 'body'; root3.add(body);
  const parts = {};

  /* ---------------- helpers ---------------- */
  function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  function dataTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; }
  const Phys = LITE ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
  function paint(color, o) { const p = Object.assign({ color, roughness: .3, metalness: .2 }, o || {}); if (!LITE) { p.clearcoat = 1; p.clearcoatRoughness = .06; } return new Phys(p); }
  const flakeN = dataTex(256, 256, (g, w, h) => { const id = g.createImageData(w, h); for (let i = 0; i < id.data.length; i += 4) { id.data[i] = 128 + (Math.random() - .5) * 18; id.data[i + 1] = 128 + (Math.random() - .5) * 18; id.data[i + 2] = 255; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); });
  flakeN.wrapS = flakeN.wrapT = THREE.RepeatWrapping; flakeN.repeat.set(12, 12);
  const M = {
    red: paint(0xc40d1c, { roughness: .32, metalness: .25, normalMap: flakeN, normalScale: new THREE.Vector2(.05, .05), name: 'paint_red' }),
    black: paint(0x07080a, { roughness: .25, metalness: .35, name: 'gloss_black' }),
    satin: new THREE.MeshStandardMaterial({ color: 0x121316, roughness: .55, metalness: .3, name: 'satin_black' }),
    matte: new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: .85, metalness: .1, name: 'matte_black' }),
    glass: new Phys(Object.assign({ color: 0x05080b, roughness: .08, metalness: .05, transparent: true, opacity: .93, envMapIntensity: .9, side: THREE.DoubleSide, name: 'smoked_glass' }, LITE ? {} : { clearcoat: 1, clearcoatRoughness: 0 })),
    alu: new THREE.MeshStandardMaterial({ color: 0xb4bac1, roughness: .28, metalness: .95, name: 'aluminium' }),
    tread: new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: .9, metalness: 0, name: 'tread' }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: .78, metalness: 0, name: 'rubber' }),
    rim: new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: .32, metalness: .75, name: 'rim' }),
    white: new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: .35, name: 'white' }),
    led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6ea, emissiveIntensity: 3, name: 'led' }),
    lens: new Phys({ color: 0xdfe6ee, roughness: .05, metalness: .9, name: 'lamp_lens' }),
    amber: new THREE.MeshStandardMaterial({ color: 0x7a4a00, emissive: 0xffa000, emissiveIntensity: .9, roughness: .3, name: 'amber' }),
    tail: new THREE.MeshStandardMaterial({ color: 0x500000, emissive: 0xff1a1a, emissiveIntensity: 1.3, roughness: .3, name: 'tail' }),
    reflR: new THREE.MeshStandardMaterial({ color: 0xc00010, emissive: 0x400004, roughness: .25, metalness: .3, name: 'reflective_red' }),
    blue: new THREE.MeshStandardMaterial({ color: 0x0b2c8f, emissive: 0x2a6bff, emissiveIntensity: 0, roughness: .15, transparent: true, opacity: .95, name: 'beacon_blue' }),
    interior: new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: .9, name: 'interior' }),
    seat: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: .8, name: 'seat' }),
    orange: new THREE.MeshStandardMaterial({ color: 0xe0661a, roughness: .5, name: 'grab_orange' })
  };
  function add(m, parent) { m.castShadow = true; m.receiveShadow = true; (parent || body).add(m); return m; }
  function mesh(geo, mat, x, y, z, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); return add(m, parent); }
  function box(w, h, d, mat, x, y, z, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent); }
  function shapeFrom(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else if (p.length === 6) s.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]); else s.lineTo(p[0], p[1]); } s.closePath(); return s; }
  function sideExtrude(pts, depth, mat, r, segs) {
    r = r === undefined ? .08 : r;
    const g = new THREE.ExtrudeGeometry(shapeFrom(pts), { depth: Math.max(.001, depth - 2 * r), bevelEnabled: r > 0, bevelThickness: r, bevelSize: r * .9, bevelSegments: segs || 6, curveSegments: 18 });
    g.translate(0, 0, -(depth - 2 * r) / 2); g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }
  function rbox(w, h, d, r, mat, x, y, z, parent) {
    r = Math.min(r, w / 2 - .001, h / 2 - .001);
    const s = new THREE.Shape(), x0 = -w / 2 + r, y0 = -h / 2 + r;
    s.moveTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, x0, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, y0); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(x0, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.closePath();
    const bz = Math.min(r, d / 2 - .001);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * bz), bevelEnabled: true, bevelThickness: bz, bevelSize: bz * .85, bevelSegments: 4, curveSegments: 8 });
    g.translate(0, 0, -(d - 2 * bz) / 2); g.computeVertexNormals();
    return mesh(g, mat, x, y, z, parent);
  }
  function cyl(rt, rb, h, mat, x, y, z, axis, parent, seg) { const g = new THREE.CylinderGeometry(rt, rb, h, seg || 24); if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2); return mesh(g, mat, x, y, z, parent); }
  function rod(p0, p1, r, mat, parent) { const v = new THREE.Vector3().subVectors(p1, p0); const m = mesh(new THREE.CylinderGeometry(r, r, v.length(), 10), mat, 0, 0, 0, parent); m.position.copy(p0).addScaledVector(v, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); return m; }
  function decal(t, w, h, x, y, z, ry, parent) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(x, y, z); m.rotation.y = ry || 0; (parent || body).add(m); return m; }
  function wordTex(text, mirror, o) { o = o || {}; return tex(o.w || 1024, o.h || 192, (g, w, h) => { if (mirror) { g.translate(w, 0); g.scale(-1, 1); } g.fillStyle = o.color || '#fff'; g.font = o.font || 'italic 900 128px "Arial Black", Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = o.align || 'center'; if (o.bar) { g.fillRect(30, h / 2 - 8, 330, 16); } g.fillText(text, o.x || (w / 2 + (o.bar ? 160 : 0)), h / 2 + 6); }); }

  /* ---------------- textures ---------------- */
  const shutterTex = tex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#6f767e'); gr.addColorStop(.5, '#9aa1a9'); gr.addColorStop(1, '#6f767e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 14) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, y + 2, w, 1); } });
  const shutterBump = dataTex(64, 256, (g, w, h) => { for (let y = 0; y < h; y += 7) { g.fillStyle = '#000'; g.fillRect(0, y, w, 1); g.fillStyle = '#fff'; g.fillRect(0, y + 1, w, 5); } });
  const chevTex = tex(512, 512, (g, w, h) => { g.fillStyle = '#f1f3f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#d0101e'; for (let x = -h; x < w + h; x += 128) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 64, h); g.lineTo(x + 64 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); } });
  const treadTex = tex(1024, 128, (g, w, h) => { g.fillStyle = '#232324'; g.fillRect(0, 0, w, h); g.fillStyle = '#060606'; for (let x = 0; x < w; x += 42) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 16, 0); g.lineTo(x + 30, h / 2); g.lineTo(x + 16, h); g.lineTo(x, h); g.lineTo(x + 14, h / 2); g.closePath(); g.fill(); } });
  treadTex.wrapS = THREE.RepeatWrapping; treadTex.repeat.set(4, 1);

  const W = 2.96, HW = W / 2, CW = 2.8, CHW = CW / 2, XR = -5.75, XCAB = 2.05;

  /* ---------------- chassis ---------------- */
  rbox(11.0, .34, 1.1, .05, M.matte, -.1, .78, 0);
  for (const x of [3.35, -2.45, -4.05]) { cyl(.17, .17, 2.25, M.satin, x, .74, 0, 'z'); rbox(.5, .32, .9, .06, M.satin, x, .74, 0); }
  rbox(1.4, .55, .55, .12, M.alu, -.6, .8, .78); rbox(1.0, .5, .5, .1, M.satin, 1.2, .82, -.78);
  for (const s of [-1, 1]) cyl(.07, .07, 3.2, M.satin, -1.5, .62, s * .35, 'x');

  /* ---------------- rear body ---------------- */
  const bodyShell = add(sideExtrude([[XR, .98], [XCAB - .05, .98], [XCAB - .05, 3.0], [XCAB - .1, 3.25, XCAB - .45, 3.4], [XR + .3, 3.4], [XR, 3.4, XR, 3.12]], W, M.red, .16, 8));
  bodyShell.name = 'body_shell';
  rbox(XCAB - XR - .1, .28, W + .03, .06, M.satin, (XCAB + XR) / 2 - .05, 1.0, 0);
  const walk = tex(256, 256, (g, w, h) => { g.fillStyle = '#2b2e33'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a4f56'; for (let y = 4; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) g.fillRect(x, y, 6, 6); }); walk.wrapS = walk.wrapT = THREE.RepeatWrapping; walk.repeat.set(14, 5);
  const wk = mesh(new THREE.PlaneGeometry(7.4, W - .4), new THREE.MeshStandardMaterial({ map: walk, roughness: .6, metalness: .5 }), -1.8, 3.415, 0); wk.rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) { const zz = s * (HW - .22); rod(new THREE.Vector3(-5.3, 3.75, zz), new THREE.Vector3(1.6, 3.75, zz), .025, M.alu); for (let x = -5.3; x <= 1.7; x += 1.15) rod(new THREE.Vector3(x, 3.42, zz), new THREE.Vector3(x, 3.75, zz), .022, M.alu); }
  rbox(2.3, .42, 1.25, .08, M.satin, -3.85, 3.62, 0);
  rbox(1.0, .3, .7, .06, M.red, -1.3, 3.56, -.45);
  cyl(.24, .24, .08, M.alu, -1.3, 3.74, -.45);
  const comps = [[1.0, 1.85, 1.2, 3.1], [-.45, .8, 1.2, 3.1], [-5.48, -4.92, 1.72, 3.1]];
  const shutterMat = new THREE.MeshStandardMaterial({ map: shutterTex, bumpMap: shutterBump, bumpScale: .02, roughness: .38, metalness: .8, name: 'roller_shutter' });
  for (const s of [-1, 1]) {
    const zf = s * (HW + .005);
    for (const [x0, x1, y0, y1] of comps) {
      const sh = mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), shutterMat, (x0 + x1) / 2, (y0 + y1) / 2, zf); if (s < 0) sh.rotation.y = Math.PI;
      const fw = .05;
      rbox(x1 - x0 + .1, fw, .05, .02, M.satin, (x0 + x1) / 2, y1 + .02, zf); rbox(x1 - x0 + .1, fw, .05, .02, M.satin, (x0 + x1) / 2, y0 - .02, zf);
      rbox(fw, y1 - y0 + .1, .05, .02, M.satin, x0 - .02, (y0 + y1) / 2, zf); rbox(fw, y1 - y0 + .1, .05, .02, M.satin, x1 + .02, (y0 + y1) / 2, zf);
      rbox(.36, .05, .06, .02, M.alu, (x0 + x1) / 2, y0 + .1, zf + s * .02);
    }
    for (const x of [-1.85, -3.4]) box(.012, 2.0, .01, M.satin, x, 2.15, s * (HW + .012));
    box(XCAB - XR - .4, .05, .01, M.reflR, (XCAB + XR) / 2 + .1, 1.2, s * (HW + .02));
    box(XCAB - XR - .4, .03, .01, M.white, (XCAB + XR) / 2 + .1, 1.42, s * (HW + .02));
    decal(wordTex('rosenbauer', s < 0, { font: 'bold 118px Arial, sans-serif' }), 1.7, .32, -4.1, 1.3, s * (HW + .03), s < 0 ? Math.PI : 0);
    for (const x of [-5.2, -2.6, .2]) rbox(.12, .06, .04, .02, M.amber, x, 1.12, s * (HW + .02));
    for (const x of [-5.3, 1.6]) { rbox(.42, .12, .06, .03, M.satin, x, 3.27, s * (HW + .02)); box(.36, .07, .02, M.led, x, 3.27, s * (HW + .055)); }
    const fender = add(sideExtrude([[-4.95, 1.02], [-1.55, 1.02], [-1.6, 1.5, -1.95, 1.62], [-4.6, 1.62], [-4.95, 1.5, -4.95, 1.02]], .14, M.satin, .03));
    fender.position.z = s * (HW - .03);
    box(.03, .45, .55, M.rubber, -5.2, .62, s * 1.18);
    box(.03, .45, .55, M.rubber, 2.55, .62, s * 1.18);
  }
  for (let y = .95; y < 3.3; y += .3) rod(new THREE.Vector3(XR - .2, y, .62), new THREE.Vector3(XR - .2, y, 1.12), .02, M.alu);
  for (const z of [.62, 1.12]) rod(new THREE.Vector3(XR - .2, .85, z), new THREE.Vector3(XR - .2, 3.65, z), .025, M.alu);
  for (const s of [-1, 1]) {
    rbox(.08, .62, .3, .05, M.satin, XR - .17, 1.3, s * 1.1); box(.02, .2, .22, M.tail, XR - .235, 1.18, s * 1.1); box(.02, .12, .22, M.amber, XR - .235, 1.4, s * 1.1); box(.02, .1, .22, M.led, XR - .235, 1.53, s * 1.1);
    rbox(.08, .1, .55, .04, M.amber, XR - .16, 3.32, s * .85);
  }
  rbox(.28, .3, W, .06, M.satin, XR - .12, .82, 0);
  for (let i = -3; i <= 3; i++) box(.02, .05, .3, M.reflR, XR - .3, .82, i * .4);
  rbox(.1, .08, .14, .03, M.satin, XR - .17, 3.15, 0);

  /* ---------------- cab ---------------- */
  const cabG = new THREE.Group(); cabG.name = 'cab'; body.add(cabG);
  add(sideExtrude([[XCAB, .68], [5.55, .68], [5.88, .9], [5.86, 1.18], [5.6, 1.3], [XCAB, 1.3]], CW, M.black, .14, 6), cabG);
  const WS0 = [5.64, 1.27], WS1 = [4.5, 3.18];
  const green = add(sideExtrude([[XCAB + .02, 1.22], WS0, [4.98, 2.25, WS1[0], WS1[1]], [4.4, 3.36, 4.0, 3.38], [XCAB + .02, 3.38]], CW - .04, M.glass, .24, 10), cabG);
  green.name = 'cab_glass';
  add(sideExtrude([[XCAB, 3.2], [4.32, 3.2], [4.6, 3.28, 4.48, 3.4], [XCAB, 3.42]], CW + .02, M.black, .1, 6), cabG);
  const aPath = new THREE.QuadraticBezierCurve3(new THREE.Vector3(WS0[0] + .04, WS0[1], 0), new THREE.Vector3(5.04, 2.25, 0), new THREE.Vector3(WS1[0] - .02, WS1[1] + .05, 0));
  for (const s of [-1, 1]) {
    const zc = s * (CHW - .2);
    const path = new THREE.CatmullRomCurve3(aPath.getPoints(12).map(p => new THREE.Vector3(p.x + .06, p.y, zc)));
    add(new THREE.Mesh(new THREE.TubeGeometry(path, 24, .085, 10, false), M.black), cabG);
    const sidePath = new THREE.CatmullRomCurve3(aPath.getPoints(12).map(p => new THREE.Vector3(p.x - .1, p.y, s * (CHW + .015))));
    add(new THREE.Mesh(new THREE.TubeGeometry(sidePath, 24, .06, 8, false), M.black), cabG);
    rbox(.12, 2.15, .08, .04, M.black, 3.5, 2.28, s * (CHW + .005), cabG);
    rbox(.14, 2.15, .08, .04, M.black, XCAB + .12, 2.28, s * (CHW + .005), cabG);
    rbox(3.4, .09, .08, .04, M.black, 3.75, 1.62, s * (CHW + .005), cabG);
    rbox(.06, 1.9, .06, .03, M.black, 3.62, 1.75, s * (CHW + .015), cabG);
    rbox(1.4, .08, .08, .04, M.black, 4.25, 3.12, s * (CHW + .005), cabG);
    const arm1 = add(sideExtrude([[3.66, .72], [4.85, .72], [4.85, 1.0], [4.55, 1.58], [3.66, 1.58]], .1, M.red, .035, 4), cabG); arm1.position.z = s * (CHW + .03);
    const arm2 = add(sideExtrude([[XCAB + .06, .72], [3.48, .72], [3.48, 1.56], [2.75, 1.56], [XCAB + .06, 1.15]], .1, M.red, .035, 4), cabG); arm2.position.z = s * (CHW + .03);
    rbox(.17, .32, .05, .03, M.satin, 4.2, 1.22, s * (CHW + .085), cabG); rbox(.09, .2, .03, .015, M.satin, 4.2, 1.22, s * (CHW + .11), cabG);
    decal(wordTex('PANTHER', s < 0, { bar: true }), 1.3, .25, 4.35, 1.82, s * (CHW + .045), s < 0 ? Math.PI : 0, cabG);
    decal(wordTex('R', s < 0, { font: 'bold 170px Arial', w: 192, h: 192 }), .2, .2, 2.32, 2.9, s * (CHW + .045), s < 0 ? Math.PI : 0, cabG);
    rbox(.85, .05, .34, .02, M.alu, 4.2, .42, s * (CHW - .05), cabG); rbox(.85, .05, .3, .02, M.alu, 4.2, .7, s * (CHW - .02), cabG);
    rod(new THREE.Vector3(3.7, 1.5, s * (CHW - .18)), new THREE.Vector3(3.7, 2.8, s * (CHW - .18)), .022, M.orange, cabG);
    rbox(.14, .07, .04, .02, M.amber, 5.2, 1.12, s * (CHW + .03), cabG);
  }
  for (const z of [-.7, .7]) { rbox(.55, .95, .55, .12, M.seat, 3.95, 1.85, z, cabG); rbox(.15, .7, .55, .07, M.seat, 3.65, 2.5, z, cabG); }
  rbox(.6, .42, CW - .5, .1, M.interior, 5.02, 1.55, 0, cabG);
  cyl(.2, .2, .04, M.satin, 4.8, 1.95, .7, 'x', cabG);
  rbox(1.0, .9, CW - .4, .1, M.seat, 2.65, 1.85, 0, cabG);
  for (const z of [-.7, .45]) { const w = rbox(1.05, .03, .04, .01, M.satin, 5.38, 1.72, z, cabG); w.rotation.z = Math.atan2(WS1[1] - WS0[1], WS1[0] - WS0[0]) * .9; }
  parts.beacons = [];
  for (const s of [-1, 1]) {
    rbox(.36, .07, 1.0, .03, M.satin, 4.22, 3.46, s * .86, cabG);
    const lb = rbox(.3, .12, .94, .05, M.blue.clone(), 4.22, 3.56, s * .86, cabG); parts.beacons.push(lb);
  }
  rbox(.95, .2, .8, .07, M.red, 3.02, 3.66, 0, cabG); rbox(.9, .18, .74, .05, M.satin, 3.02, 3.5, 0, cabG);
  rbox(.08, .05, .5, .02, M.led, 3.5, 3.6, 0, cabG);
  rod(new THREE.Vector3(2.4, 3.42, -.9), new THREE.Vector3(2.35, 4.2, -.9), .008, M.satin, cabG);

  /* ---------------- mirrors ---------------- */
  for (const s of [-1, 1]) {
    const V = (x, y, z) => new THREE.Vector3(x, y, s * z);
    rod(V(4.55, 3.12, CHW - .02), V(5.12, 3.2, CHW + .42), .03, M.satin, cabG);
    rod(V(5.12, 3.2, CHW + .42), V(5.2, 3.0, CHW + .5), .03, M.satin, cabG);
    rod(V(4.78, 2.5, CHW + .02), V(5.16, 2.6, CHW + .45), .028, M.satin, cabG);
    const hd = new THREE.Group(); hd.position.set(5.22, 2.6, s * (CHW + .52)); hd.rotation.y = s * .14; cabG.add(hd);
    rbox(.16, .84, .42, .07, M.black, 0, 0, 0, hd); box(.02, .76, .36, M.lens, -.08, 0, 0, hd);
    const wd = new THREE.Group(); wd.position.set(5.08, 3.26, s * (CHW + .62)); wd.rotation.y = s * .5; cabG.add(wd);
    rbox(.12, .16, .56, .06, M.black, 0, 0, 0, wd); box(.02, .12, .5, M.lens, -.06, 0, 0, wd);
  }

  /* ---------------- front module ---------------- */
  const fr = new THREE.Group(); fr.name = 'front'; body.add(fr);
  add(sideExtrude([[5.6, .4], [6.04, .4], [6.12, .55], [6.12, .98], [5.86, 1.1], [5.6, 1.1]], 2.05, M.black, .08, 6), fr);
  for (const s of [-1, 1]) {
    const pod = new THREE.Group(); pod.position.set(5.98, .78, s * 1.22); pod.rotation.y = -s * .62; fr.add(pod);
    rbox(.22, .88, .84, .08, M.black, 0, 0, 0, pod);
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(.74, .62), new THREE.MeshStandardMaterial({ map: chevTex, roughness: .3, metalness: .1, polygonOffset: true, polygonOffsetFactor: -2 })); cp.position.set(.19, -.05, 0); cp.rotation.y = Math.PI / 2; if (s < 0) cp.scale.x = -1; pod.add(cp);
    rbox(.12, .2, .74, .06, M.satin, .06, .4, 0, pod);
    for (let k = -1; k <= 1; k++) { cyl(.055, .055, .03, M.lens, .13, .4, k * .2, 'x', pod, 18); cyl(.03, .03, .035, M.led, .135, .4, k * .2, 'x', pod, 12); }
    box(.03, .03, .66, M.led, .13, .29, 0, pod);
    rbox(.6, .2, .5, .06, M.red, -.14, .6, s * .02, pod);
    parts['head' + s] = pod;
  }
  box(.03, .035, 1.1, M.led, 6.13, .95, 0, fr);
  for (let i = 0; i < 5; i++) rbox(.03, .03, 1.0, .01, M.satin, 6.13, .55 + i * .065, 0, fr);
  decal(wordTex('rosenbauer', false, { font: 'bold 118px Arial, sans-serif' }), .62, .12, 6.14, 1.03, .62, Math.PI / 2, fr);
  for (const s of [-1, 1]) { const t = mesh(new THREE.TorusGeometry(.07, .024, 10, 20), M.red, 6.14, .5, s * .55, fr); t.rotation.y = Math.PI / 2; }
  const bt = new THREE.Group(); bt.name = 'bumper_turret'; bt.position.set(6.15, .78, .3); fr.add(bt);
  mesh(new THREE.SphereGeometry(.17, 24, 16), M.red, 0, 0, 0, bt); cyl(.12, .14, .08, M.satin, -.02, -.15, 0, null, bt);
  cyl(.055, .09, .46, M.black, .25, 0, 0, 'x', bt); cyl(.07, .07, .06, M.alu, .47, 0, 0, 'x', bt);
  const bumpTip = new THREE.Object3D(); bumpTip.position.x = .52; bt.add(bumpTip);
  rbox(.12, .2, 2.4, .04, M.satin, 5.72, .3, 0, fr);

  /* ---------------- roof turret ---------------- */
  const turret = new THREE.Group(); turret.name = 'roof_turret'; turret.position.set(4.05, 3.42, 0); cabG.add(turret);
  cyl(.36, .42, .2, M.satin, 0, .1, 0, null, turret, 32);
  const yawG = new THREE.Group(); yawG.position.y = .2; turret.add(yawG);
  rbox(.62, .34, .56, .1, M.red, 0, .17, 0, yawG);
  cyl(.12, .12, .62, M.satin, .1, .32, 0, 'z', yawG);
  const pitch = new THREE.Group(); pitch.position.set(.12, .34, 0); yawG.add(pitch);
  rbox(3.0, .22, .22, .08, M.black, 1.45, 0, 0, pitch);
  rbox(2.5, .08, .08, .03, M.alu, 1.2, -.19, 0, pitch);
  rbox(.34, .32, .32, .08, M.red, 2.95, 0, 0, pitch);
  cyl(.095, .17, .62, M.black, 3.36, 0, 0, 'x', pitch, 28); cyl(.135, .135, .12, M.red, 3.12, 0, 0, 'x', pitch, 28);
  cyl(.1, .1, .05, M.alu, 3.68, 0, 0, 'x', pitch, 28);
  rbox(.18, .14, .18, .05, M.satin, 2.88, .22, 0, pitch); box(.02, .08, .12, M.led, 2.98, .22, 0, pitch);
  const roofTip = new THREE.Object3D(); roofTip.position.x = 3.72; pitch.add(roofTip);
  pitch.rotation.z = -.02;

  /* ---------------- wheels ---------------- */
  const wheels = [];
  const R = .75, TW = .64;
  const prof = []; const seg = 22;
  for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + i / seg * Math.PI; prof.push(new THREE.Vector2(Math.max(.44, R - .13 + Math.cos(a) * .13), Math.sin(a) * TW / 2)); }
  prof.unshift(new THREE.Vector2(.44, -TW / 2)); prof.push(new THREE.Vector2(.44, TW / 2));
  const tyreG = new THREE.LatheGeometry(prof, 56); tyreG.rotateX(Math.PI / 2);
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1d1d1e, roughness: .86, map: treadTex, name: 'tyre' });
  const lugG = new THREE.BoxGeometry(.15, .07, TW * .42);
  const rimProf = [[.44, -.27], [.42, -.24], [.36, -.2], [.34, -.05], [.2, -.02], [.12, .02], [0, .03]].map(p => new THREE.Vector2(p[0], p[1]));
  const rimG = new THREE.LatheGeometry(rimProf, 40); rimG.rotateX(Math.PI / 2);
  const boltG = new THREE.CylinderGeometry(.022, .022, .05, 6); boltG.rotateX(Math.PI / 2);
  const holeG = new THREE.CircleGeometry(.05, 16);
  const nLug = LITE ? 22 : 30;
  for (const x of [3.35, -2.45, -4.05]) for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(x, R, s * 1.17); root3.add(w);
    add(new THREE.Mesh(tyreG, tyreMat), w);
    const lugs = new THREE.InstancedMesh(lugG, M.tread, nLug * 2); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(); let li = 0;
    for (let k = 0; k < nLug; k++) { const ang = k / nLug * Math.PI * 2; for (const side of [-1, 1]) { const a = ang + (side < 0 ? 0 : Math.PI / nLug); p.set(Math.cos(a) * (R + .015), Math.sin(a) * (R + .015), side * TW * .22); e.set(0, side * .38, a + Math.PI / 2); q.setFromEuler(e); m4.compose(p, q, sc); lugs.setMatrixAt(li++, m4); } }
    lugs.castShadow = true; w.add(lugs);
    const rim = add(new THREE.Mesh(rimG, M.rim), w); rim.scale.z = s; rim.position.z = s * .04;
    cyl(.43, .43, TW - .1, M.rim, 0, 0, 0, 'z', w, 32);
    cyl(.15, .19, .1, M.satin, 0, 0, s * .26, 'z', w, 24);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; mesh(boltG, M.alu, Math.cos(a) * .27, Math.sin(a) * .27, s * .3, w); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + .2; const hm = mesh(holeG, M.matte, Math.cos(a) * .37, Math.sin(a) * .37, s * .245, w); if (s < 0) hm.rotation.y = Math.PI; }
    wheels.push(w);
  }
  for (const s of [-1, 1]) { const arch = mesh(new THREE.TorusGeometry(.97, .11, 12, 36, Math.PI), M.satin, 3.35, .8, s * (HW - .03)); arch.scale.set(1.05, 1.05, 1); }

  root3.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  Object.assign(parts, { body, cab: cabG, wheels, turretYaw: yawG, turretPitch: pitch, roofTip, bumperTurret: bt, bumpTip, materials: M });
  root3.userData.parts = parts;
  return root3;
}
root.buildPanther = buildPanther;
})(typeof window !== 'undefined' ? window : this);
