/* Rosenbauer Panther 6x6 — procedural model (x = forward, y = up, z = right).
   Built from field photos; dimensions L 11.5 m · W 3 m · H ~4 m. */
(function (root) {
'use strict';
function buildPanther(THREE, opts) {
  opts = opts || {};
  const root3 = new THREE.Group(); root3.name = 'Panther6x6';
  const body = new THREE.Group(); body.name = 'body'; root3.add(body);
  const parts = {};

  // ---------- helpers ----------
  function tex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const M = {
    red: new THREE.MeshPhysicalMaterial({ color: 0xd3101f, roughness: .26, metalness: .15, clearcoat: 1, clearcoatRoughness: .08, name: 'paint_red' }),
    redDark: new THREE.MeshStandardMaterial({ color: 0x8e0a14, roughness: .5, metalness: .2, name: 'red_dark' }),
    black: new THREE.MeshPhysicalMaterial({ color: 0x0b0c0e, roughness: .22, metalness: .3, clearcoat: 1, clearcoatRoughness: .1, name: 'gloss_black' }),
    matte: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: .8, metalness: .15, name: 'matte_black' }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: .6, metalness: .1, name: 'trim' }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0d1a26, roughness: .03, metalness: .1, transmission: 0, transparent: true, opacity: .82, envMapIntensity: 2, clearcoat: 1, name: 'glass', side: THREE.DoubleSide }),
    alu: new THREE.MeshStandardMaterial({ color: 0xa7adb4, roughness: .35, metalness: .9, name: 'aluminium' }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd9dee4, roughness: .12, metalness: 1, name: 'chrome' }),
    tire: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .92, metalness: 0, name: 'rubber' }),
    rim: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: .35, metalness: .7, name: 'rim' }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: .4, name: 'white' }),
    led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e6, emissiveIntensity: 2.2, name: 'led' }),
    amber: new THREE.MeshStandardMaterial({ color: 0x664000, emissive: 0xffa000, emissiveIntensity: .8, name: 'amber' }),
    tail: new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1010, emissiveIntensity: 1.2, name: 'tail' }),
    blue: new THREE.MeshStandardMaterial({ color: 0x0a2a8a, emissive: 0x2a6bff, emissiveIntensity: 0, transparent: true, opacity: .95, name: 'beacon_blue' }),
    interior: new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: .9, name: 'interior' })
  };
  if (opts.envIntensity) Object.values(M).forEach(m => m.envMapIntensity = opts.envIntensity);
  if (opts.lite) for (const k in M) { const m = M[k]; if (m.isMeshPhysicalMaterial) { const s = new THREE.MeshStandardMaterial({ color: m.color, roughness: Math.max(.18, m.roughness), metalness: Math.max(.25, m.metalness), transparent: m.transparent, opacity: m.opacity, side: m.side, name: m.name }); M[k] = s; } }
  function mesh(geo, mat, x, y, z, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; (parent || body).add(m); return m; }
  function box(w, h, d, mat, x, y, z, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent); }
  function profileExtrude(pts, depth, mat, bevel, segs) {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]); }
    s.closePath();
    const b = bevel === undefined ? .08 : bevel;
    const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: segs || 4, curveSegments: 14 });
    g.translate(0, 0, -(depth - 2 * b) / 2); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  }
  // flat polygon (in x/y) placed on a side plane z, facing outward (sign)
  function sidePoly(pts, z, sign, mat, uvRect) {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath();
    const g = new THREE.ShapeGeometry(s);
    if (uvRect) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = (uv.getX(i) - uvRect[0]) / uvRect[2], v = (uv.getY(i) - uvRect[1]) / uvRect[3]; uv.setXY(i, sign > 0 ? u : 1 - u, v); } }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.position.z = z; m.receiveShadow = true; return m;
  }
  function quad(a, b, c, d, mat, parent) { // 4 points, double sided
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.material.side = THREE.DoubleSide; (parent || body).add(m); return m;
  }

  // ---------- textures ----------
  const shutterTex = tex(256, 512, (g, w, h) => { g.fillStyle = '#7d848c'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) { g.fillStyle = '#5c636b'; g.fillRect(0, y, w, 3); g.fillStyle = '#a2a9b1'; g.fillRect(0, y + 3, w, 2); } g.fillStyle = '#3a3f45'; g.fillRect(w * .42, h - 26, w * .16, 14); });
  const chevTex = tex(512, 256, (g, w, h) => { g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#d3101f'; for (let x = -h; x < w + h; x += 110) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 55, h); g.lineTo(x + 55 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); } });
  chevTex.wrapS = THREE.RepeatWrapping;
  function wordTex(text, mirror, opt) {
    opt = opt || {};
    return tex(1024, 192, (g, w, h) => { g.clearRect(0, 0, w, h); if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
      g.fillStyle = opt.color || '#ffffff'; g.font = opt.font || 'italic 900 132px "Arial Black", Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
      if (opt.bar) { g.fillRect(40, h / 2 - 9, 300, 18); }
      g.fillText(text, w / 2 + (opt.bar ? 150 : 0), h / 2 + 6); });
  }
  const treadTex = tex(512, 64, (g, w, h) => { g.fillStyle = '#202020'; g.fillRect(0, 0, w, h); g.fillStyle = '#0a0a0a'; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 26, h / 2); g.lineTo(x + 14, h); g.lineTo(x, h); g.lineTo(x + 12, h / 2); g.closePath(); g.fill(); } });
  treadTex.wrapS = THREE.RepeatWrapping; treadTex.repeat.set(5, 1);

  const W = 2.94, HW = W / 2;           // body width
  const CW = 2.78, CHW = CW / 2;        // cab width
  const XF = 5.75, XR = -5.75;          // front / rear
  const XCAB = 2.05;                    // cab rear wall

  // ---------- chassis & under ----------
  box(11.0, .34, 1.1, M.matte, -0.1, .78, 0).name = 'frame';
  for (const x of [3.35, -2.45, -4.05]) { const ax = mesh(new THREE.CylinderGeometry(.16, .16, 2.3, 12), M.matte, x, .74, 0); ax.rotation.x = Math.PI / 2; }
  box(1.4, .55, .6, M.alu, -0.6, .78, .75); // tank
  box(1.0, .5, .55, M.matte, 1.2, .8, -.75);

  // ---------- rear body (red) ----------
  const bodyShell = profileExtrude([[XR, .98], [XCAB - .05, .98], [XCAB - .05, 3.22], [XCAB - .4, 3.4], [XR + .25, 3.4], [XR, 3.15]], W, M.red, .09, 5);
  body.add(bodyShell); bodyShell.name = 'body_shell';
  // black lower skirt
  box(XCAB - XR - .1, .26, W + .02, M.matte, (XCAB + XR) / 2 - .05, 1.0, 0);
  // roof deck & rails
  box(7.3, .06, W - .3, M.matte, -1.75, 3.43, 0);
  for (const s of [-1, 1]) { box(7.2, .05, .05, M.alu, -1.75, 3.72, s * (HW - .2)); for (let x = -5.2; x <= 1.6; x += 1.36) box(.05, .3, .05, M.alu, x, 3.57, s * (HW - .2)); }
  box(2.4, .42, 1.3, M.plastic, -3.8, 3.66, 0).name = 'roof_box';
  
  // compartments: [x0, x1, y0, y1]
  const comps = [[.95, 1.85, 1.18, 3.12], [-.45, .75, 1.18, 3.12], [-5.5, -4.95, 1.68, 3.12]];
  for (const s of [-1, 1]) {
    for (const [x0, x1, y0, y1] of comps) {
      const z = s * (HW + .005);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), new THREE.MeshStandardMaterial({ map: shutterTex, roughness: .45, metalness: .75, name: 'shutter' }));
      sh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); if (s < 0) sh.rotation.y = Math.PI; body.add(sh);
      // frame
      box(x1 - x0 + .1, .05, .03, M.matte, (x0 + x1) / 2, y1 + .03, z); box(x1 - x0 + .1, .05, .03, M.matte, (x0 + x1) / 2, y0 - .03, z);
      box(.05, y1 - y0 + .1, .03, M.matte, x0 - .03, (y0 + y1) / 2, z); box(.05, y1 - y0 + .1, .03, M.matte, x1 + .03, (y0 + y1) / 2, z);
    }
    // thin white stripe along body
    box(XCAB - XR - .3, .045, .01, M.white, (XCAB + XR) / 2, 1.42, s * (HW + .02));
    // rosenbauer word on body
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .3), new THREE.MeshBasicMaterial({ map: wordTex('rosenbauer', s < 0, { font: 'bold 120px Arial, sans-serif' }), transparent: true, depthWrite: false }));
    rw.position.set(-4.25, 1.3, s * (HW + .02)); if (s < 0) rw.rotation.y = Math.PI; body.add(rw);
    // rear wheel fender (tandem) black
    const fender = profileExtrude([[-4.95, 1.02], [-1.5, 1.02], [-1.6, 1.62], [-4.85, 1.62]], .12, M.matte, .02);
    fender.position.z = s * (HW - .02); body.add(fender);
    // step + ladder rear
    box(.5, .05, .3, M.alu, XR + .3, .7, s * 1.2);
  }
  // rear: ladder & lights
  for (let y = .9; y < 3.3; y += .32) box(.04, .04, .5, M.alu, XR - .06, y, .9);
  box(.04, 2.5, .04, M.alu, XR - .06, 2.15, .65); box(.04, 2.5, .04, M.alu, XR - .06, 2.15, 1.15);
  for (const s of [-1, 1]) { box(.05, .35, .22, M.tail, XR - .05, 1.15, s * 1.15); box(.05, .16, .22, M.amber, XR - .05, 1.42, s * 1.15); box(.05, .1, .6, M.amber, XR - .05, 3.3, s * .9); }
  box(.25, .3, W, M.matte, XR - .05, .82, 0);

  // ---------- cab (black glass bubble) ----------
  const cabG = new THREE.Group(); cabG.name = 'cab'; body.add(cabG);
  // lower cab tub (black)
  const tub = profileExtrude([[XCAB, .7], [5.6, .7], [5.85, .95], [5.82, 1.18], [5.6, 1.26], [XCAB, 1.26]], CW, M.black, .1, 4);
  cabG.add(tub);
  // upper cab: glass greenhouse - A pillars / roof frame in black, glass panes inset
  // windshield line from (5.48,1.42) to (4.45,3.22)
  const WS0 = new THREE.Vector2(5.62, 1.24), WS1 = new THREE.Vector2(4.42, 3.22);
  const upper = profileExtrude([[XCAB, 1.22], [WS0.x, WS0.y], [WS1.x, WS1.y], [4.2, 3.36], [XCAB, 3.36]], CW - .02, M.black, .12, 5);
  cabG.add(upper);
  // windshield glass (slightly outside the black shell)
  const n = new THREE.Vector2(WS1.y - WS0.y, -(WS1.x - WS0.x)).normalize(); // outward normal
  const off = .135, zw = CHW - .18;
  const a = [WS0.x + n.x * off, WS0.y + n.y * off], b = [WS1.x + n.x * off, WS1.y + n.y * off];
  parts.windshield = quad([a[0], a[1], -zw], [a[0], a[1], zw], [b[0], b[1], zw], [b[0], b[1], -zw], M.glass, cabG);
  // centre divider + wipers
  const angle = Math.atan2(WS1.y - WS0.y, WS1.x - WS0.x);
  { const d = box(2.3, .06, .07, M.matte, (a[0] + b[0]) / 2 + .005, (a[1] + b[1]) / 2, 0, cabG); d.rotation.z = angle; }
  for (const z of [-.75, .5]) { const wp = box(.95, .025, .04, M.matte, a[0] - .15, a[1] + .35, z, cabG); wp.rotation.z = angle; }
  // side glass: front door window, rear crew window, corner glass
  for (const s of [-1, 1]) {
    const z = s * (CHW + .015);
    const yb = 1.5, yt = 3.18;
    const xAt = y => WS0.x + (y - WS0.y) / (WS1.y - WS0.y) * (WS1.x - WS0.x);
    // door glass (big, from door hinge 3.55 to A-pillar)
    const dg = sidePoly([[3.62, .95], [xAt(yb) - .12, .95], [xAt(yb) - .12, yb], [xAt(yt) - .1, yt], [3.62, yt]], z, s, M.glass); cabG.add(dg);
    // rear crew window
    cabG.add(sidePoly([[2.3, 1.75], [3.42, 1.75], [3.42, 3.15], [2.3, 3.15]], z, s, M.glass));
    // door frame lines
    box(.07, 2.3, .03, M.matte, 3.52, 2.1, z + s * .01, cabG);
    box(.07, 2.3, .03, M.matte, 3.58, 2.1, z + s * .01, cabG);
    // red angular armour panel on lower door (signature)
    const armour = profileExtrude([[3.6, .72], [4.75, .72], [4.75, 1.05], [4.48, 1.62], [3.6, 1.62]], .09, M.red, .03);
    armour.position.z = s * (CHW + .02); cabG.add(armour);
    const armour2 = profileExtrude([[XCAB + .05, .72], [3.45, .72], [3.45, 1.6], [2.6, 1.6], [XCAB + .05, 1.2]], .09, M.red, .03);
    armour2.position.z = s * (CHW + .02); cabG.add(armour2);
    // door handle recess
    box(.16, .3, .03, M.matte, 4.15, 1.25, s * (CHW + .075), cabG);
    // PANTHER lettering on lower door glass
    const pw = new THREE.Mesh(new THREE.PlaneGeometry(1.25, .24), new THREE.MeshBasicMaterial({ map: wordTex('PANTHER', s < 0, { bar: true }), transparent: true, depthWrite: false }));
    pw.position.set(4.3, 1.82, s * (CHW + .03)); if (s < 0) pw.rotation.y = Math.PI; cabG.add(pw);
    // R logo near rear window
    const rl = new THREE.Mesh(new THREE.PlaneGeometry(.18, .18), new THREE.MeshBasicMaterial({ map: wordTex('R', s < 0, { font: 'bold 170px Arial' }), transparent: true, depthWrite: false })); rl.scale.x = 5.3; rl.scale.x = 1;
    rl.position.set(2.2, 2.9, s * (CHW + .03)); if (s < 0) rl.rotation.y = Math.PI; cabG.add(rl);
    // steps
    box(.85, .05, .32, M.alu, 4.15, .45, s * (CHW - .05), cabG); box(.85, .05, .28, M.alu, 4.15, .72, s * (CHW - .02), cabG);
    // grab handle
    const gh = mesh(new THREE.CylinderGeometry(.02, .02, .9, 8), M.alu, 3.55, 2.1, s * (CHW + .06), cabG);
  }
  // interior hint: seats & dashboard (seen through glass)
  box(.5, .9, .55, M.interior, 3.9, 1.85, .7, cabG); box(.5, .9, .55, M.interior, 3.9, 1.85, -.7, cabG);
  box(.6, .4, CW - .4, M.interior, 4.95, 1.6, 0, cabG);
  box(1.2, .9, CW - .3, M.interior, 2.7, 1.85, 0, cabG);

  // roof canopy: red top with black underside lip (signature Panther roof)
  const canopy = profileExtrude([[XCAB - .05, 3.32], [4.25, 3.32], [4.6, 3.38], [4.5, 3.5], [XCAB - .05, 3.52]], CW + .06, M.black, .05);
  cabG.add(canopy);
  box(2.2, .04, CW + .02, M.matte, 3.2, 3.31, 0, cabG);
  // light bar (blue) on front corners of roof
  parts.beacons = [];
  for (const s of [-1, 1]) {
    const lb = box(.3, .12, .9, M.blue.clone(), 4.2, 3.6, s * .9, cabG); parts.beacons.push(lb);
    const base = box(.34, .05, .95, M.matte, 4.2, 3.53, s * .9, cabG);
  }
  // roof module (red box with dark lower half) — camera/light module
  box(.9, .22, .75, M.red, 3.0, 3.72, 0, cabG); box(.86, .18, .7, M.matte, 3.0, 3.53, 0, cabG);
  // side warning lights
  for (const s of [-1, 1]) box(.12, .08, .04, M.amber, 2.3, 3.0, s * (CHW + .04), cabG);

  // ---------- mirrors ----------
  function rod(p0, p1, r, mat, parent) { const v = new THREE.Vector3().subVectors(p1, p0); const m = mesh(new THREE.CylinderGeometry(r, r, v.length(), 8), mat, 0, 0, 0, parent); m.position.copy(p0).addScaledVector(v, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); return m; }
  for (const s of [-1, 1]) {
    const V = (x, y, z) => new THREE.Vector3(x, y, s * z);
    rod(V(4.5, 3.12, CHW - .02), V(5.15, 3.18, CHW + .42), .035, M.matte, cabG);
    rod(V(5.15, 3.18, CHW + .42), V(5.22, 2.98, CHW + .5), .035, M.matte, cabG);
    rod(V(4.75, 2.55, CHW + .02), V(5.18, 2.62, CHW + .45), .03, M.matte, cabG);
    const head = box(.14, .82, .4, M.black, 5.24, 2.58, s * (CHW + .52), cabG); head.rotation.y = s * .12;
    const glassM = box(.02, .74, .34, M.glass, 5.17, 2.58, s * (CHW + .52), cabG); glassM.rotation.y = s * .12;
    const wide = box(.12, .16, .55, M.black, 5.12, 3.24, s * (CHW + .62), cabG); wide.rotation.y = s * .45;
  }

  // ---------- front module ----------
  const fr = new THREE.Group(); fr.name = 'front'; body.add(fr);
  // main bumper (black), chamfered corners
  const bump = profileExtrude([[5.6, .42], [6.06, .42], [6.12, .56], [6.12, .98], [5.85, 1.08], [5.6, 1.08]], 2.05, M.black, .06);
  fr.add(bump);
  // corner chevron pods (angled outward)
  for (const s of [-1, 1]) {
    const pod = new THREE.Group(); pod.position.set(5.98, .78, s * 1.22); pod.rotation.y = -s * .62; fr.add(pod);
    box(.2, .86, .82, M.black, 0, 0, 0, pod);
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(.76, .66), new THREE.MeshStandardMaterial({ map: chevTex, roughness: .35, name: 'chevron' }));
    cp.position.set(.105, -.04, 0); cp.rotation.y = Math.PI / 2; if (s < 0) cp.scale.x = -1; pod.add(cp);
    // LED headlight bar above pod
    const hl = box(.06, .06, .6, M.led, .1, .44, 0, pod);
    const hl2 = box(.06, .04, .45, M.led, .1, .36, 0, pod);
    // red corner fender
    const rf = box(.55, .2, .5, M.red, -.12, .6, s * .02, pod);
    parts['head' + s] = hl;
  }
  // centre LED strips & grille
  box(.03, .04, 1.1, M.led, 6.13, .93, 0, fr);
  for (let i = 0; i < 5; i++) box(.03, .03, 1.0, M.matte, 6.13, .55 + i * .065, 0, fr);
  // rosenbauer logo on front
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(.9, .17), new THREE.MeshBasicMaterial({ map: wordTex('rosenbauer', false, { font: 'bold 120px Arial, sans-serif' }), transparent: true, depthWrite: false }));
  fl.position.set(6.13, 1.02, .62); fl.scale.set(.7,.7,1); fl.rotation.y = Math.PI / 2; fr.add(fl);
  // tow eyes
  for (const s of [-1, 1]) { const t = mesh(new THREE.TorusGeometry(.07, .025, 8, 16), M.red, 6.14, .5, s * .55, fr); t.rotation.y = Math.PI / 2; }
  // bumper turret (red ball + black nozzle) — front centre right
  const bt = new THREE.Group(); bt.name = 'bumper_turret'; bt.position.set(6.15, .78, .3); fr.add(bt);
  mesh(new THREE.SphereGeometry(.17, 18, 12), M.red, 0, 0, 0, bt);
  const btn = mesh(new THREE.CylinderGeometry(.055, .09, .45, 14), M.black, .25, 0, 0, bt); btn.rotation.z = -Math.PI / 2;
  const bumpTip = new THREE.Object3D(); bumpTip.position.x = .5; bt.add(bumpTip);
  // under-run guard
  box(.12, .2, W - .5, M.matte, 5.7, .32, 0, fr);

  // ---------- roof turret (HRET style boom) ----------
  const turret = new THREE.Group(); turret.name = 'roof_turret'; turret.position.set(4.05, 3.52, 0); cabG.add(turret);
  mesh(new THREE.CylinderGeometry(.34, .4, .22, 22), M.matte, 0, .11, 0, turret);
  const yawG = new THREE.Group(); yawG.position.y = .22; turret.add(yawG);
  box(.5, .32, .5, M.red, 0, .16, 0, yawG);
  const pitch = new THREE.Group(); pitch.position.set(.12, .3, 0); yawG.add(pitch);
  // boom: two parallel black tubes + red knuckle
  box(3.0, .2, .2, M.black, 1.45, 0, .0, pitch);
  box(2.4, .1, .1, M.alu, 1.2, -.18, 0, pitch); // hydraulic rod
  box(.28, .3, .3, M.red, 2.95, 0, 0, pitch);
  const nz = mesh(new THREE.CylinderGeometry(.09, .16, .6, 16), M.black, 3.35, 0, 0, pitch); nz.rotation.z = -Math.PI / 2;
  const nzr = mesh(new THREE.CylinderGeometry(.13, .13, .12, 16), M.red, 3.12, 0, 0, pitch); nzr.rotation.z = -Math.PI / 2;
  const roofTip = new THREE.Object3D(); roofTip.position.x = 3.7; pitch.add(roofTip);
  // camera / spot on boom
  box(.16, .14, .16, M.matte, 2.9, .2, 0, pitch);
  pitch.rotation.z = -.02;

  // ---------- wheels ----------
  const wheels = [];
  const R = .74, TW = .62;
  const tireG = new THREE.CylinderGeometry(R, R, TW, 40, 1); tireG.rotateX(Math.PI / 2);
  const tireSideG = new THREE.TorusGeometry(R - .06, .07, 10, 40);
  const rimG = new THREE.CylinderGeometry(.43, .43, TW + .02, 24); rimG.rotateX(Math.PI / 2);
  const hubG = new THREE.CylinderGeometry(.16, .2, TW + .1, 16); hubG.rotateX(Math.PI / 2);
  const lugG = new THREE.BoxGeometry(.13, .07, TW * .46);
  const boltG = new THREE.CylinderGeometry(.025, .025, .06, 6); boltG.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, map: treadTex, roughness: .95, name: 'tread' });
  for (const x of [3.35, -2.45, -4.05]) for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(x, R, s * 1.17); root3.add(w);
    mesh(tireG, [tireMat, M.tire, M.tire], 0, 0, 0, w);
    for (const zz of [-1, 1]) { const ts = mesh(tireSideG, M.tire, 0, 0, zz * (TW / 2 - .02), w); }
    // tread lugs (chevron pattern)
    for (let k = 0; k < 26; k++) { const ang = k / 26 * Math.PI * 2; for (const side of [-1, 1]) { const l = mesh(lugG, M.tire, Math.cos(ang) * (R + .02), Math.sin(ang) * (R + .02), side * TW * .24, w); l.rotation.z = ang + Math.PI / 2; l.rotation.y = side * .35; l.castShadow = false; } }
    mesh(rimG, M.rim, 0, 0, 0, w);
    mesh(hubG, M.matte, 0, 0, 0, w);
    for (let k = 0; k < 10; k++) { const ang = k / 10 * Math.PI * 2; mesh(boltG, M.chrome, Math.cos(ang) * .28, Math.sin(ang) * .28, s * (TW / 2 + .02), w); }
    wheels.push(w);
  }
  // front wheel arch (black, on cab)
  for (const s of [-1, 1]) { const arch = mesh(new THREE.TorusGeometry(.95, .11, 10, 28, Math.PI), M.matte, 3.35, .78, s * (HW - .02)); arch.scale.set(1.05, 1.05, 1); }

  root3.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  Object.assign(parts, { body, cab: cabG, wheels, turretYaw: yawG, turretPitch: pitch, roofTip, bumperTurret: bt, bumpTip, materials: M });
  root3.userData.parts = parts;
  return root3;
}
root.buildPanther = buildPanther;
})(typeof window !== 'undefined' ? window : this);
