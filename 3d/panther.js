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
    glass: new Phys(Object.assign({ color: 0x0c141b, roughness: .04, metalness: .1, transparent: true, opacity: .62, envMapIntensity: 1.3, side: THREE.DoubleSide, name: 'smoked_glass' }, LITE ? {} : { clearcoat: 1, clearcoatRoughness: 0 })),
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


  const W = 2.96, HW = W / 2, CW = 2.8, CHW = CW / 2, XR = -5.75, XB = 1.85, XC = 1.95;
  const XF = 2.55, XT = [XF - 4.8, XF - 6.4], R = .74, AR = .93;   // axles (4,800 mm wheelbase per Rosenbauer data), tyre radius, arch radius
  Object.assign(M, {
    dash: new THREE.MeshStandardMaterial({ color: 0x3b4047, roughness: .7, metalness: .2, name: 'dash' }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0a1420, emissive: 0x3f8fd8, emissiveIntensity: .9, roughness: .2, name: 'screen' }),
    doorGlass: new THREE.MeshStandardMaterial({ color: 0x0b1117, roughness: .05, metalness: .5, envMapIntensity: 2, name: 'door_glass' }),
    suit: new THREE.MeshStandardMaterial({ color: 0x1e2733, roughness: .85, name: 'driver_suit' }),
    skin: new THREE.MeshStandardMaterial({ color: 0xa87a58, roughness: .8, name: 'skin' }),
    helm: new THREE.MeshStandardMaterial({ color: 0xf2c21a, roughness: .35, name: 'helmet' })
  });
  // extrude a cross-section (z,y) along x from x0 to x1
  function lengthExtrude(pts, x0, x1, mat, bev) {
    const s = shapeFrom(pts), b = bev || 0;
    const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0 - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b * .9, bevelSegments: 3, curveSegments: 6 });
    g.rotateY(Math.PI / 2); g.translate(x0 + b, 0, 0); return { g, mesh: () => add(new THREE.Mesh(g, mat)) };
  }
  // arch helper for side profiles: arc around (cx,cy) radius r from angle a0 to a1 (clockwise)
  function arcPts(cx, cy, r, a0, a1, n) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }

  /* ---------------- chassis ---------------- */
  rbox(11.0, .34, 1.1, .05, M.matte, -.1, .78, 0);
  for (const x of [XF, ...XT]) { cyl(.17, .17, 2.25, M.satin, x, R, 0, 'z'); rbox(.55, .34, .95, .06, M.satin, x, R, 0); }
  rbox(1.4, .55, .55, .12, M.alu, -.6, .8, .78); rbox(1.0, .5, .5, .1, M.satin, 1.0, .82, -.78);
  for (const s of [-1, 1]) cyl(.07, .07, 3.2, M.satin, -1.5, .62, s * .35, 'x');

  /* ---------------- rear body: angular upper shell + skirts with arches ---------------- */
  // upper shell cross-section: vertical sides, big chamfer on the top edges (Panther's faceted look)
  const up = lengthExtrude([[-1.44, 1.6], [1.44, 1.6], [1.44, 2.92], [1.13, 3.42], [-1.13, 3.42], [-1.44, 2.92]], XR, XB, M.red, .05);
  { const p = up.g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); if (x < XR + .3 && y > 2.3) p.setX(i, x + (y - 2.3) * .55); } p.needsUpdate = true; up.g.computeVertexNormals(); }
  const bodyShell = up.mesh(); bodyShell.name = 'body_shell';
  // skirts (side profile) with the tandem arches and a low locker section between the axles
  const mid = (XT[0] + XT[1]) / 2, am = Math.acos((mid - XT[1]) / AR);
  const skirtPts = [[XR, 1.64], [XR, 1.0], [XT[1] - Math.sqrt(AR * AR - (1 - R) * (1 - R)), 1.0],
    ...arcPts(XT[1], R, AR, Math.PI - Math.asin((1 - R) / AR), am, 10).slice(1),
    ...arcPts(XT[0], R, AR, Math.PI - am, Math.asin((1 - R) / AR), 10).slice(1),
    [XT[0] + .9, .72], [1.45, .72], [1.62, 1.0], [XB, 1.0], [XB, 1.64]];
  const skirt = add(sideExtrude(skirtPts, W, M.red, .04, 3)); skirt.name = 'body_skirt';
  // black fender liners in the arches
  for (const x of XT) for (const s of [-1, 1]) { const t = mesh(new THREE.TorusGeometry(AR - .02, .045, 6, 24, Math.PI * .86), M.satin, x, R, s * (HW - .02)); t.rotation.z = Math.PI * .07; }
  rbox(XB - XR - .1, .2, W - .1, .05, M.satin, (XB + XR) / 2, .98, 0);
  // walkway + railing on the roof
  const walk = tex(256, 256, (g, w, h) => { g.fillStyle = '#2b2e33'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a4f56'; for (let y = 4; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) g.fillRect(x, y, 6, 6); }); walk.wrapS = walk.wrapT = THREE.RepeatWrapping; walk.repeat.set(14, 4);
  const wk = mesh(new THREE.PlaneGeometry(6.6, 2.1), new THREE.MeshStandardMaterial({ map: walk, roughness: .6, metalness: .5 }), -1.55, 3.425, 0); wk.rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) { const zz = s * 1.05; rod(new THREE.Vector3(-4.7, 3.78, zz), new THREE.Vector3(1.6, 3.78, zz), .025, M.alu); for (let x = -4.7; x <= 1.7; x += 1.05) rod(new THREE.Vector3(x, 3.42, zz), new THREE.Vector3(x, 3.78, zz), .022, M.alu); }
  rbox(2.3, .42, 1.25, .08, M.satin, -3.4, 3.62, 0);              // hose / equipment box
  rbox(1.0, .3, .7, .06, M.red, -1.0, 3.56, -.45); cyl(.24, .24, .08, M.alu, -1.0, 3.74, -.45);  // tank manhole
  // compartments with roller shutters
  const comps = [[.3, 1.65, .86, 2.92], [-1.15, .15, .86, 2.92]];
  const shutterMat = new THREE.MeshStandardMaterial({ map: shutterTex, bumpMap: shutterBump, bumpScale: .02, roughness: .38, metalness: .8, name: 'roller_shutter' });
  for (const s of [-1, 1]) {
    const zf = s * (HW + .012);
    for (const [x0, x1, y0, y1] of comps) {
      const sh = mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), shutterMat, (x0 + x1) / 2, (y0 + y1) / 2, zf); if (s < 0) sh.rotation.y = Math.PI;
      const fw = .05;
      rbox(x1 - x0 + .1, fw, .05, .02, M.satin, (x0 + x1) / 2, y1 + .02, zf); rbox(x1 - x0 + .1, fw, .05, .02, M.satin, (x0 + x1) / 2, y0 - .02, zf);
      rbox(fw, y1 - y0 + .1, .05, .02, M.satin, x0 - .02, (y0 + y1) / 2, zf); rbox(fw, y1 - y0 + .1, .05, .02, M.satin, x1 + .02, (y0 + y1) / 2, zf);
      rbox(.36, .05, .06, .02, M.alu, (x0 + x1) / 2, y0 + .1, zf + s * .02);
    }
    // panel seams, crease highlight, reflective band
    for (const x of [-1.5, -3.2]) box(.012, 1.25, .01, M.satin, x, 2.28, s * (1.44 + .006));
    box(XB - XR - .4, .025, .01, M.white, (XB + XR) / 2 + .1, 1.66, s * (1.44 + .008));
    box(XB - XR - 1.0, .05, .01, M.reflR, (XB + XR) / 2 - .2, 1.12, s * (HW + .01));
    decal(wordTex('rosenbauer', s < 0, { font: 'bold 118px Arial, sans-serif' }), 1.9, .36, -3.3, 2.35, s * (1.44 + .02), s < 0 ? Math.PI : 0);
    for (const x of [-5.3, -1.0, 1.7]) rbox(.12, .06, .04, .02, M.amber, x, 1.2, s * (HW + .015));
    for (const x of [-4.85, 1.5]) { rbox(.42, .12, .06, .03, M.satin, x, 2.86, s * (1.44 + .02)); box(.36, .07, .02, M.led, x, 2.86, s * (1.44 + .055)); }
    box(.03, .45, .55, M.rubber, -5.3, .62, s * 1.18);
  }
  // rear: ladder up the sloped back, lights, bumper
  for (let y = .95; y < 2.3; y += .3) rod(new THREE.Vector3(XR - .08, y, .62), new THREE.Vector3(XR - .08, y, 1.12), .02, M.alu);
  for (const z of [.62, 1.12]) { rod(new THREE.Vector3(XR - .08, .85, z), new THREE.Vector3(XR - .08, 2.3, z), .025, M.alu); rod(new THREE.Vector3(XR - .08, 2.3, z), new THREE.Vector3(XR + .52, 3.7, z), .025, M.alu); }
  for (const s of [-1, 1]) {
    rbox(.08, .62, .3, .05, M.satin, XR - .03, 1.3, s * 1.1); box(.02, .2, .22, M.tail, XR - .08, 1.18, s * 1.1); box(.02, .12, .22, M.amber, XR - .08, 1.4, s * 1.1); box(.02, .1, .22, M.led, XR - .08, 1.53, s * 1.1);
    const lb = rbox(.08, .1, .5, .04, M.amber, XR + .52, 3.3, s * .75); lb.rotation.z = -.5;
  }
  rbox(.28, .3, W, .06, M.satin, XR - .06, .82, 0);
  for (let i = -3; i <= 3; i++) box(.02, .05, .3, M.reflR, XR - .21, .82, i * .4);

  /* ---------------- cab ---------------- */
  const cabG = new THREE.Group(); cabG.name = 'cab'; body.add(cabG);
  // red lower cab, cut around the front wheel
  const aStart = Math.PI - Math.acos((XF - XC) / AR);
  add(sideExtrude([[XC, 1.8], [XC, R + Math.sin(aStart) * AR], ...arcPts(XF, R, AR, aStart, 0, 12).slice(1), [XF + AR + .02, .8], [5.18, .8], [5.36, 1.1], [5.32, 1.8]], CW, M.red, .1, 5), cabG);
  // glass greenhouse: steep, slightly convex windscreen sweeping into the roof
  const WS0 = [5.3, 1.74], WS1 = [4.32, 3.33], WSC = [4.95, 2.55];
  const glassShape = [[XC + .03, 1.72], [WS0[0], 1.72], [WSC[0], WSC[1], WS1[0], WS1[1]], [4.2, 3.47, 3.9, 3.47], [XC + .03, 3.47]];
  const green = add(sideExtrude(glassShape, CW - .04, M.glass, .2, 10), cabG); green.name = 'cab_glass';
  // black roof cap and rear wall
  add(sideExtrude([[XC, 3.3], [4.0, 3.3], [4.25, 3.36, 4.1, 3.53], [XC, 3.55]], CW + .02, M.black, .08, 5), cabG);
  rbox(.12, 1.8, CW, .05, M.black, XC + .02, 2.6, 0, cabG);
  const aPath = new THREE.QuadraticBezierCurve3(new THREE.Vector3(WS0[0] + .03, WS0[1], 0), new THREE.Vector3(WSC[0] + .03, WSC[1], 0), new THREE.Vector3(WS1[0], WS1[1] + .05, 0));
  for (const s of [-1, 1]) {
    const zc = s * (CHW - .12), zs = s * (CHW + .012);
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(aPath.getPoints(12).map(p => new THREE.Vector3(p.x, p.y, zc))), 24, .075, 10, false), M.black), cabG);   // A-pillar
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(aPath.getPoints(12).map(p => new THREE.Vector3(p.x - .12, p.y, zs))), 24, .05, 8, false), M.black), cabG);
    rbox(.12, 1.75, .07, .035, M.black, 3.42, 2.6, zs, cabG);          // B-pillar (door rear edge)
    rbox(.14, 1.75, .07, .035, M.black, XC + .1, 2.6, zs, cabG);       // C-pillar
    rbox(2.5, .08, .07, .035, M.black, 3.2, 1.76, zs, cabG);           // beltline
    rbox(1.3, .07, .07, .035, M.black, 3.85, 3.36, zs, cabG);          // door top
    rbox(.05, 1.6, .05, .025, M.black, 2.68, 2.6, zs, cabG);           // rear side window divider
    // door: lower glass panel + black frame, handle, 'PANTHER' badge
    const dg = mesh(new THREE.PlaneGeometry(.95, .62), M.doorGlass, 4.08, 1.3, s * (CHW + .11), cabG); if (s < 0) dg.rotation.y = Math.PI;
    rbox(1.05, .05, .05, .02, M.black, 4.08, 1.63, s * (CHW + .1), cabG); rbox(1.05, .05, .05, .02, M.black, 4.08, .97, s * (CHW + .1), cabG);
    rbox(.05, .7, .05, .02, M.black, 3.56, 1.3, s * (CHW + .1), cabG); rbox(.05, .7, .05, .02, M.black, 4.6, 1.3, s * (CHW + .1), cabG);
    rbox(.17, .32, .05, .03, M.satin, 3.62, 2.0, s * (CHW + .06), cabG); rbox(.09, .2, .03, .015, M.alu, 3.62, 2.0, s * (CHW + .09), cabG);
    decal(wordTex('PANTHER', s < 0, { bar: true }), 1.1, .21, 4.2, 1.82, s * (CHW + .1), s < 0 ? Math.PI : 0, cabG);
    decal(wordTex('R', s < 0, { font: 'bold 170px Arial', w: 192, h: 192 }), .22, .22, 2.25, 3.05, s * (CHW + .04), s < 0 ? Math.PI : 0, cabG);
    // entry steps under the door + grab handle
    rbox(.85, .05, .34, .02, M.alu, 4.1, .5, s * (CHW - .06), cabG); rbox(.85, .05, .3, .02, M.alu, 4.1, .78, s * (CHW - .02), cabG);
    rod(new THREE.Vector3(3.48, 1.25, s * (CHW + .1)), new THREE.Vector3(3.48, 2.9, s * (CHW + .1)), .022, M.orange, cabG);
    rbox(.14, .07, .04, .02, M.amber, 5.05, 1.12, s * (CHW + .06), cabG);
    // fender lip over the front wheel
    const lip = mesh(new THREE.TorusGeometry(AR + .02, .06, 8, 28, Math.PI * .78), M.satin, XF, R, s * (CHW + .02), cabG); lip.rotation.z = Math.PI * .02;
  }
  // interior: dashboard with screens, steering wheel, seats, turret joystick, driver
  const dsh = add(sideExtrude([[4.5, 1.8], [5.12, 1.8], [4.98, 2.18], [4.58, 2.24]], CW - .3, M.dash, .04, 3), cabG); dsh.name = 'dashboard';
  const look = (o, dx, dy, dz) => { o.updateMatrixWorld(); o.lookAt(o.position.x + dx, o.position.y + dy, o.position.z + dz); };
  for (const [z, w] of [[-.62, .34], [0, .42], [.62, .34]]) { const sc = mesh(new THREE.PlaneGeometry(w, .2), M.screen, 4.66, 2.27, z, cabG); look(sc, -1, .9, 0); }
  const sw = mesh(new THREE.TorusGeometry(.2, .025, 8, 28), M.matte, 4.38, 2.32, -.62, cabG); look(sw, -1, .7, 0);
  rod(new THREE.Vector3(4.38, 2.32, -.62), new THREE.Vector3(4.62, 2.0, -.62), .03, M.matte, cabG);
  rbox(.4, .25, .3, .05, M.dash, 4.3, 1.92, 0, cabG); cyl(.025, .03, .22, M.matte, 4.3, 2.15, 0, null, cabG); mesh(new THREE.SphereGeometry(.045, 10, 8), M.orange, 4.3, 2.27, 0, cabG);
  for (const z of [-.62, .62]) { rbox(.55, .18, .52, .08, M.seat, 3.85, 1.92, z, cabG); const bk = rbox(.14, .72, .52, .07, M.seat, 3.6, 2.35, z, cabG); bk.rotation.z = -.12; rbox(.12, .18, .3, .05, M.seat, 3.55, 2.82, z, cabG); rbox(.04, .5, .04, .02, M.orange, 3.52, 2.35, z + .27 * Math.sign(z), cabG); }
  rbox(.5, .18, CW - .5, .08, M.seat, 2.55, 1.92, 0, cabG); rbox(.14, .72, CW - .5, .07, M.seat, 2.25, 2.35, 0, cabG);
  rbox(2.6, .04, CW - .3, .02, M.interior, 3.4, 1.82, 0, cabG);
  if (opts.driver !== false) {
    const dv = new THREE.Group(); dv.name = 'driver'; dv.position.set(3.82, 2.02, -.62); cabG.add(dv);
    const tor = mesh(new THREE.CapsuleGeometry(.17, .34, 4, 10), M.suit, -.05, .38, 0, dv); tor.rotation.z = -.12; tor.scale.set(.85, 1, 1.15);
    mesh(new THREE.CapsuleGeometry(.08, .38, 4, 8), M.suit, .25, .02, -.1, dv).rotation.z = Math.PI / 2;
    mesh(new THREE.CapsuleGeometry(.08, .38, 4, 8), M.suit, .25, .02, .1, dv).rotation.z = Math.PI / 2;
    mesh(new THREE.SphereGeometry(.1, 14, 10), M.skin, -.02, .78, 0, dv);
    const hm = mesh(new THREE.SphereGeometry(.13, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), M.helm, -.03, .8, 0, dv); hm.scale.set(1.1, 1, 1);
    for (const s of [-1, 1]) rod(new THREE.Vector3(-.02, .55, s * .2), new THREE.Vector3(.55, .5, s * .15), .045, M.suit, dv);
  }
  for (const z of [-.62, .5]) { const w = rbox(1.0, .03, .04, .01, M.satin, 5.2, 1.95, z, cabG); w.rotation.z = Math.atan2(WS1[1] - WS0[1], WS1[0] - WS0[0]) * .9; }
  parts.beacons = [];
  for (const s of [-1, 1]) {
    rbox(.5, .06, .55, .03, M.satin, 3.72, 3.58, s * 1.0, cabG);
    const lb = rbox(.44, .12, .5, .05, M.blue.clone(), 3.72, 3.66, s * 1.0, cabG); parts.beacons.push(lb);
  }
  rbox(.08, .05, .5, .02, M.led, 2.2, 3.6, 0, cabG);
  rod(new THREE.Vector3(2.3, 3.55, -.9), new THREE.Vector3(2.25, 4.25, -.9), .008, M.satin, cabG);

  /* ---------------- mirrors (long arms off the A-pillars) ---------------- */
  for (const s of [-1, 1]) {
    const V = (x, y, z) => new THREE.Vector3(x, y, s * z);
    rod(V(4.42, 3.18, CHW - .02), V(5.0, 3.28, CHW + .45), .03, M.satin, cabG);
    rod(V(5.0, 3.28, CHW + .45), V(5.08, 3.05, CHW + .55), .03, M.satin, cabG);
    rod(V(4.7, 2.5, CHW + .02), V(5.06, 2.62, CHW + .5), .028, M.satin, cabG);
    const hd = new THREE.Group(); hd.position.set(5.1, 2.66, s * (CHW + .58)); hd.rotation.y = s * .14; cabG.add(hd);
    rbox(.16, .84, .42, .07, M.black, 0, 0, 0, hd); box(.02, .76, .36, M.lens, -.08, 0, 0, hd);
    const wd = new THREE.Group(); wd.position.set(4.98, 3.34, s * (CHW + .68)); wd.rotation.y = s * .5; cabG.add(wd);
    rbox(.12, .16, .56, .06, M.black, 0, 0, 0, wd); box(.02, .12, .5, M.lens, -.06, 0, 0, wd);
  }

  /* ---------------- front module: angular red nose with chevron corners ---------------- */
  const fr = new THREE.Group(); fr.name = 'front'; body.add(fr);
  {
    const X0 = 5.05, XN = 6.2, Y0 = .42, H = 1.0;
    const plan = [[X0, -1.38], [5.78, -1.38], [XN, -.92], [XN, .92], [5.78, 1.38], [X0, 1.38]];
    const g = new THREE.ExtrudeGeometry(shapeFrom(plan), { depth: H, steps: 10, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); g.translate(0, Y0, 0);
    // side profile: lower lip slopes back, upper face slopes up to the windscreen
    const fx = y => y < .72 ? 5.95 + (y - Y0) / .3 * .25 : y < 1.12 ? XN - (y - .72) * .1 : 6.16 - (y - 1.12) / .3 * .62;
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const k = (fx(y) - X0) / (XN - X0); p.setX(i, X0 + (x - X0) * Math.min(1.02, k)); }
    p.needsUpdate = true; g.computeVertexNormals();
    add(new THREE.Mesh(g, M.red), fr).name = 'nose';
  }
  // red/white chevrons on the corner facets and the front face corners
  for (const s of [-1, 1]) {
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(.66, .44), new THREE.MeshStandardMaterial({ map: chevTex, roughness: .3, metalness: .1, polygonOffset: true, polygonOffsetFactor: -2 }));
    cp.material.side = THREE.DoubleSide; cp.position.set(5.99, .93, s * 1.16); cp.rotation.y = s > 0 ? Math.PI / 4 : Math.PI * 3 / 4; if (s < 0) cp.scale.x = -1; fr.add(cp);
    const cf = new THREE.Mesh(new THREE.PlaneGeometry(.5, .38), cp.material); cf.position.set(6.215, .92, s * .66); cf.rotation.y = Math.PI / 2; if (s < 0) cf.scale.x = -1; fr.add(cf);
    // headlight cluster in the black band
    const pod = new THREE.Group(); pod.position.set(6.2, .92, s * .22); fr.add(pod);
    for (let k = 0; k < 2; k++) { cyl(.055, .055, .03, M.lens, .01, 0, s * k * .16, 'x', pod, 18); cyl(.032, .032, .035, M.led, .015, 0, s * k * .16, 'x', pod, 12); }
    parts['head' + s] = pod;
    for (const z of [.55, .8]) box(.02, .025, .2, M.led, 6.12, 1.2, s * z);
  }
  box(.03, .26, .32, M.black, 6.205, .92, 0, fr);
  box(.03, .04, 1.8, M.led, 6.19, .76, 0, fr);
  rbox(1.05, .12, 2.5, .04, M.matte, 5.55, .38, 0, fr);                     // splitter
  for (const s of [-1, 1]) { const t = mesh(new THREE.TorusGeometry(.07, .024, 10, 20), M.satin, 6.05, .5, s * .7, fr); t.rotation.y = Math.PI / 2; }
  decal(wordTex('rosenbauer', false, { font: 'bold 118px Arial, sans-serif' }), .55, .1, 6.215, 1.1, -.05, Math.PI / 2, fr);
  const bt = new THREE.Group(); bt.name = 'bumper_turret'; bt.position.set(5.92, 1.38, -.55); fr.add(bt);
  cyl(.14, .17, .14, M.satin, 0, -.08, 0, null, bt); mesh(new THREE.SphereGeometry(.16, 24, 16), M.red, 0, .06, 0, bt);
  cyl(.055, .085, .44, M.black, .26, .06, 0, 'x', bt); cyl(.07, .07, .06, M.alu, .47, .06, 0, 'x', bt);
  const bumpTip = new THREE.Object3D(); bumpTip.position.set(.52, .06, 0); bt.add(bumpTip);

  /* ---------------- roof turret (articulated boom on the cab roof) ---------------- */
  const turret = new THREE.Group(); turret.name = 'roof_turret'; turret.position.set(3.55, 3.55, 0); cabG.add(turret);
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

  /* ---------------- wheels: big off-road tyres with block tread ---------------- */
  const wheels = [];
  const TW = .62, RIM = .36;
  const prof = []; const seg = 24;
  for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + i / seg * Math.PI; const bulge = Math.pow(Math.cos(a), .6); prof.push(new THREE.Vector2(RIM + (R - .05 - RIM) * Math.min(1, .25 + bulge * .9) + (Math.abs(a) < .5 ? .02 : 0), Math.sin(a) * TW / 2)); }
  prof.unshift(new THREE.Vector2(RIM, -TW / 2 + .02)); prof.push(new THREE.Vector2(RIM, TW / 2 - .02));
  const tyreG = new THREE.LatheGeometry(prof, 64); tyreG.rotateX(Math.PI / 2);
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1b, roughness: .9, name: 'tyre' });
  const blockG = new THREE.BoxGeometry(.16, .075, .24); const shoulderG = new THREE.BoxGeometry(.13, .065, .14);
  const rimProf = [[RIM + .01, -.25], [RIM - .02, -.22], [.3, -.18], [.28, -.06], [.17, -.03], [.11, .01], [0, .02]].map(p => new THREE.Vector2(p[0], p[1]));
  const rimG = new THREE.LatheGeometry(rimProf, 40); rimG.rotateX(Math.PI / 2);
  const boltG = new THREE.CylinderGeometry(.022, .022, .05, 6); boltG.rotateX(Math.PI / 2);
  const holeG = new THREE.CircleGeometry(.04, 14);
  const nB = LITE ? 26 : 34;
  const sideTex = tex(1024, 64, (g, w, h) => { g.fillStyle = '#1a1a1b'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c2c2e'; g.font = 'bold 40px Arial'; g.textBaseline = 'middle'; for (let k = 0; k < 2; k++) g.fillText('MICHELIN  XZL  16.00 R 20', 40 + k * 512, h / 2); });
  for (const x of [XF, ...XT]) for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(x, R, s * 1.17); root3.add(w);
    add(new THREE.Mesh(tyreG, tyreMat), w);
    // directional block tread: two staggered rows of angled blocks + shoulder lugs
    const lugs = new THREE.InstancedMesh(blockG, M.tread, nB * 2), sh = new THREE.InstancedMesh(shoulderG, M.tread, nB * 2);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(); let li = 0, si = 0;
    for (let k = 0; k < nB; k++) { const ang = k / nB * Math.PI * 2;
      for (const side of [-1, 1]) {
        const a = ang + (side < 0 ? 0 : Math.PI / nB);
        p.set(Math.cos(a) * (R - .005), Math.sin(a) * (R - .005), side * .13); e.set(0, side * .45, a + Math.PI / 2); q.setFromEuler(e); m4.compose(p, q, sc); lugs.setMatrixAt(li++, m4);
        p.set(Math.cos(a) * (R - .03), Math.sin(a) * (R - .03), side * (TW / 2 - .03)); e.set(side * .5, 0, a + Math.PI / 2); q.setFromEuler(e); m4.compose(p, q, sc); sh.setMatrixAt(si++, m4);
      } }
    lugs.castShadow = sh.castShadow = true; w.add(lugs); w.add(sh);
    const sw2 = new THREE.Mesh(new THREE.RingGeometry(RIM + .06, R - .1, 64, 1), new THREE.MeshStandardMaterial({ map: sideTex, roughness: .85, transparent: false }));
    sw2.position.z = s * (TW / 2 - .005); if (s < 0) sw2.rotation.y = Math.PI; w.add(sw2);
    const rim = add(new THREE.Mesh(rimG, M.rim), w); rim.scale.z = s; rim.position.z = s * .04;
    cyl(RIM - .01, RIM - .01, TW - .12, M.rim, 0, 0, 0, 'z', w, 32);
    cyl(.15, .19, .1, M.satin, 0, 0, s * .25, 'z', w, 24);
    cyl(.07, .09, .06, M.alu, 0, 0, s * .3, 'z', w, 16);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; mesh(boltG, M.alu, Math.cos(a) * .24, Math.sin(a) * .24, s * .29, w); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + .2; const hm = mesh(holeG, M.matte, Math.cos(a) * .315, Math.sin(a) * .315, s * .2, w); if (s < 0) hm.rotation.y = Math.PI; }
    wheels.push(w);
  }

  root3.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  Object.assign(parts, { body, cab: cabG, wheels, turretYaw: yawG, turretPitch: pitch, roofTip, bumperTurret: bt, bumpTip, materials: M });
  root3.userData.parts = parts;
  return root3;
}
root.buildPanther = buildPanther;
})(typeof window !== 'undefined' ? window : this);
