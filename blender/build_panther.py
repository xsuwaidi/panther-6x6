# Rosenbauer Panther 6x6 — Blender build script (Blender 4.x / 5.x)
# Builds the truck with bevelled panels and PBR materials, lights it in daylight,
# renders three photos with Cycles and exports a .glb — all into ~/Documents/Panther6x6
import bpy, bmesh, math, os, time
from mathutils import Vector

OUT = os.path.join(os.path.expanduser('~'), 'Documents', 'Panther6x6')
os.makedirs(OUT, exist_ok=True)
LOG = open(os.path.join(OUT, 'build_log.txt'), 'w')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s); LOG.write(s + '\n'); LOG.flush()
log('start', time.ctime(), bpy.app.version_string)

# ---------------------------------------------------------------- scene reset
sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections): bpy.data.collections.remove(c)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
COL = bpy.data.collections.new('Panther6x6'); sc.collection.children.link(COL)
ENV = bpy.data.collections.new('Environment'); sc.collection.children.link(ENV)

# three.js coords (x fwd, y up, z right) -> Blender (X fwd, Y left, Z up)
def P(x, y, z=0.0): return Vector((x, -z, y))

def lin(c):  # sRGB hex -> linear tuple
    r, g, b = ((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255
    f = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

def setin(node, names, val):
    for n in (names if isinstance(names, (list, tuple)) else [names]):
        if n in node.inputs:
            try: node.inputs[n].default_value = val; return True
            except Exception: pass
    return False

def mat(name, color, metal=0.0, rough=0.4, coat=0.0, coat_rough=0.03, emit=None, emit_s=0.0, alpha=1.0, transm=0.0, ior=1.45):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    setin(b, 'Base Color', lin(color)); setin(b, 'Metallic', metal); setin(b, 'Roughness', rough)
    setin(b, ['Coat Weight', 'Clearcoat'], coat); setin(b, ['Coat Roughness', 'Clearcoat Roughness'], coat_rough)
    setin(b, ['Transmission Weight', 'Transmission'], transm); setin(b, 'IOR', ior)
    if emit is not None:
        setin(b, ['Emission Color', 'Emission'], lin(emit)); setin(b, 'Emission Strength', emit_s)
    if alpha < 1:
        setin(b, 'Alpha', alpha)
        try: m.blend_method = 'BLEND'
        except Exception: pass
    return m

M = {
 'red':    mat('paint_red', 0x9c0612, metal=0.15, rough=0.28, coat=1.0),
 'black':  mat('gloss_black', 0x050607, metal=0.2, rough=0.22, coat=1.0),
 'satin':  mat('satin_black', 0x111214, metal=0.2, rough=0.5),
 'matte':  mat('matte_black', 0x0b0b0c, rough=0.85),
 'glass':  mat('tinted_glass', 0x020304, rough=0.02, coat=1.0, coat_rough=0.0, ior=1.52),
 'alu':    mat('aluminium', 0xb9bec4, metal=1.0, rough=0.25),
 'chrome': mat('chrome', 0xe6e9ec, metal=1.0, rough=0.06),
 'rubber': mat('tyre_rubber', 0x141414, rough=0.88),
 'rim':    mat('rim', 0x151719, metal=0.7, rough=0.35),
 'white':  mat('white', 0xf2f3f5, rough=0.35),
 'led':    mat('led', 0xffffff, emit=0xfff4e6, emit_s=6.0),
 'lens':   mat('lamp_lens', 0xdfe6ee, metal=0.9, rough=0.04),
 'amber':  mat('amber', 0x7a4a00, emit=0xffa000, emit_s=2.0, rough=0.3),
 'tail':   mat('tail_red', 0x500000, emit=0xff1010, emit_s=2.0, rough=0.3),
 'blue':   mat('beacon_blue', 0x0b2c8f, emit=0x2a6bff, emit_s=1.5, rough=0.1),
 'reflr':  mat('reflective_red', 0xc00010, rough=0.25, metal=0.3),
 'orange': mat('grab_orange', 0xe0661a, rough=0.5),
 'seat':   mat('seat', 0x16181b, rough=0.8),
}

def chevron_mat():
    m = bpy.data.materials.new('chevron_red_white'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (0, math.radians(45), math.radians(45))
    wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
    wv.inputs['Scale'].default_value = 3.2; wv.inputs['Distortion'].default_value = 0
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'
    cr.color_ramp.elements[0].color = lin(0xd0101e); cr.color_ramp.elements[1].position = 0.5; cr.color_ramp.elements[1].color = lin(0xf1f3f4)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], wv.inputs['Vector'])
    nt.links.new(wv.outputs['Color'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], b.inputs['Base Color'])
    setin(b, 'Roughness', 0.3); return m
M['chev'] = chevron_mat()

def shutter_mat():
    m = bpy.data.materials.new('roller_shutter'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'Z'; wv.inputs['Scale'].default_value = 40
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.8
    nt.links.new(tc.outputs['Object'], wv.inputs['Vector']); nt.links.new(wv.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    setin(b, 'Base Color', lin(0x5f656c)); setin(b, 'Metallic', 0.9); setin(b, 'Roughness', 0.42); return m
M['shutter'] = shutter_mat()

# ---------------------------------------------------------------- mesh helpers
def link(ob, parent=None):
    COL.objects.link(ob)
    if parent: ob.parent = parent
    return ob

def finish(ob, m, bevel=0.0, segs=4, smooth=True):
    me = ob.data
    if m: me.materials.append(m)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    if bevel > 0:
        md = ob.modifiers.new('Bevel', 'BEVEL'); md.width = bevel; md.segments = segs
        md.limit_method = 'ANGLE'; md.angle_limit = math.radians(30)
        try: md.harden_normals = True
        except Exception: pass
    return ob

def qbez(p0, p1, p2, n=10):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(1, n + 1)]]

def profile(spec):
    """spec: list of (x,y) or ('q', ctrl, end) quadratic segments; returns point list"""
    pts = []
    for s in spec:
        if s[0] == 'q': pts += qbez(pts[-1], s[1], s[2])
        else: pts.append(s)
    return pts

def side_extrude(name, spec, depth, m, bevel=0.04, segs=4, zc=0.0):
    pts = profile(spec)
    bm = bmesh.new()
    vs = [bm.verts.new(P(x, y, zc - depth / 2)) for x, y in pts]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=Vector((0, -depth, 0)), verts=nv)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me))
    return finish(ob, m, bevel, segs)

def rbox(name, w, h, d, m, x, y, z=0.0, bevel=0.03, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * w, v.co.z * d * -1, v.co.y * h)) if False else Vector((v.co.x * w, v.co.y * d, v.co.z * h))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me)); ob.location = P(x, y, z); ob.rotation_euler = rot
    return finish(ob, m, bevel, 3)

def cyl(name, r, depth, m, loc, axis='Y', verts=40, bevel=0.0, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me)); ob.location = loc
    if axis == 'Y': ob.rotation_euler = (math.radians(90), 0, 0)
    elif axis == 'X': ob.rotation_euler = (0, math.radians(90), 0)
    return finish(ob, m, bevel, 3)

def tube(name, pts, radius, m):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = radius; cu.bevel_resolution = 4
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (p.x, p.y, p.z, 1)
    ob = link(bpy.data.objects.new(name, cu)); cu.materials.append(m); return ob

def text(name, body, size, m, loc, rot, extrude=0.004, italic=False):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size; cu.extrude = extrude
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    if italic: cu.shear = 0.25
    ob = link(bpy.data.objects.new(name, cu)); ob.location = loc; ob.rotation_euler = rot; cu.materials.append(m); return ob

W, HW, CW, CHW, XR, XCAB = 2.96, 1.48, 2.8, 1.4, -5.75, 2.05

# ---------------------------------------------------------------- body
side_extrude('body_shell', [(XR, .98), (XCAB - .05, .98), (XCAB - .05, 3.0), ('q', (XCAB - .1, 3.36), (XCAB - .5, 3.4)), (XR + .3, 3.4), ('q', (XR, 3.4), (XR, 3.1))], W, M['red'], .1, 6)
rbox('skirt', XCAB - XR - .1, .28, W + .03, M['satin'], (XCAB + XR) / 2 - .05, 1.0)
rbox('chassis', 11.0, .34, 1.1, M['matte'], -.1, .78)
for i, x in enumerate([3.35, -2.45, -4.05]): cyl('axle%d' % i, .17, 2.25, M['satin'], P(x, .74), 'Y')
for s in (-1, 1):
    zf = s * (HW + .006)
    for k, (x0, x1, y0, y1) in enumerate([(1.0, 1.85, 1.2, 3.1), (-.45, .8, 1.2, 3.1), (-5.48, -4.92, 1.72, 3.1)]):
        rbox('shutter_%d_%d' % (k, s), x1 - x0, y1 - y0, .02, M['shutter'], (x0 + x1) / 2, (y0 + y1) / 2, zf, 0.004)
        for (w, h, xx, yy) in [(x1 - x0 + .1, .05, (x0 + x1) / 2, y1 + .02), (x1 - x0 + .1, .05, (x0 + x1) / 2, y0 - .02), (.05, y1 - y0 + .1, x0 - .02, (y0 + y1) / 2), (.05, y1 - y0 + .1, x1 + .02, (y0 + y1) / 2)]:
            rbox('frame', w, h, .05, M['satin'], xx, yy, zf, .015)
        rbox('handle', .36, .05, .05, M['alu'], (x0 + x1) / 2, y0 + .1, zf + s * .02, .015)
    rbox('contour_%d' % s, XCAB - XR - .4, .05, .01, M['reflr'], (XCAB + XR) / 2 + .1, 1.2, s * (HW + .02), 0)
    rbox('pinstripe_%d' % s, XCAB - XR - .4, .03, .01, M['white'], (XCAB + XR) / 2 + .1, 1.42, s * (HW + .02), 0)
    for x in (-5.2, -2.6, .2): rbox('marker', .12, .06, .04, M['amber'], x, 1.12, s * (HW + .02), .015)
    for x in (-5.3, 1.6): rbox('worklight', .4, .1, .05, M['led'], x, 3.27, s * (HW + .03), .02)
    side_extrude('fender_%d' % s, [(-4.95, 1.02), (-1.55, 1.02), ('q', (-1.6, 1.62), (-1.95, 1.62)), (-4.6, 1.62), ('q', (-4.95, 1.62), (-4.95, 1.3))], .14, M['satin'], .02, 3, zc=s * (HW - .03))
    text('rosenbauer_side_%d' % s, 'rosenbauer', .26, M['white'], P(-4.1, 1.28, s * (HW + .025)), (math.radians(90), 0, 0 if s > 0 else math.radians(180)))
# roof rails, walkway, boxes
for s in (-1, 1):
    zz = s * (HW - .22)
    tube('rail', [P(-5.3, 3.75, zz), P(1.6, 3.75, zz)], .025, M['alu'])
    for i in range(7):
        x = -5.3 + i * 1.15; tube('post', [P(x, 3.42, zz), P(x, 3.75, zz)], .022, M['alu'])
rbox('roof_box', 2.3, .42, 1.25, M['satin'], -3.85, 3.62, 0, .06)
rbox('foam_lid', 1.0, .3, .7, M['red'], -1.3, 3.56, -.45, .05)
# rear: ladder, lights, bumper, reflectors
for i in range(8):
    y = .95 + i * .3; tube('rung', [P(XR - .2, y, .62), P(XR - .2, y, 1.12)], .02, M['alu'])
for z in (.62, 1.12): tube('rail_l', [P(XR - .2, .85, z), P(XR - .2, 3.65, z)], .025, M['alu'])
for s in (-1, 1):
    rbox('tail_housing', .08, .62, .3, M['satin'], XR - .17, 1.3, s * 1.1, .03)
    rbox('tail', .03, .2, .22, M['tail'], XR - .23, 1.18, s * 1.1, .01)
    rbox('indicator', .03, .12, .22, M['amber'], XR - .23, 1.4, s * 1.1, .01)
    rbox('reverse', .03, .1, .22, M['led'], XR - .23, 1.53, s * 1.1, .01)
rbox('rear_bumper', .28, .3, W, M['satin'], XR - .12, .82, 0, .05)

# ---------------------------------------------------------------- cab
side_extrude('cab_tub', [(XCAB, .68), (5.55, .68), (5.88, .9), (5.86, 1.18), (5.6, 1.3), (XCAB, 1.3)], CW, M['black'], .12, 5)
WS0, WS1 = (5.64, 1.27), (4.5, 3.18)
side_extrude('cab_glass', [(XCAB + .02, 1.22), WS0, ('q', (4.98, 2.25), WS1), ('q', (4.4, 3.36), (4.0, 3.38)), (XCAB + .02, 3.38)], CW - .04, M['glass'], .2, 8)
side_extrude('cab_roof', [(XCAB, 3.2), (4.32, 3.2), ('q', (4.6, 3.28), (4.48, 3.4)), (XCAB, 3.42)], CW + .02, M['black'], .08, 5)
apts = [WS0] + qbez(WS0, (4.98, 2.25), WS1, 12)
for s in (-1, 1):
    tube('a_pillar_%d' % s, [P(x - .52, y + .02, s * (CHW + .02)) for x, y in apts], .075, M['black'])
    rbox('b_pillar', .12, 2.15, .08, M['black'], 3.5, 2.28, s * (CHW + .01), .03)
    rbox('c_pillar', .14, 2.15, .08, M['black'], XCAB + .12, 2.28, s * (CHW + .01), .03)
    rbox('sill', 3.4, .09, .08, M['black'], 3.75, 1.62, s * (CHW + .01), .03)
    rbox('door_top', 1.4, .08, .08, M['black'], 4.25, 3.12, s * (CHW + .01), .03)
    side_extrude('armour_door_%d' % s, [(3.66, .72), (4.85, .72), (4.85, 1.0), (4.55, 1.58), (3.66, 1.58)], .1, M['red'], .03, 3, zc=s * (CHW + .03))
    side_extrude('armour_rear_%d' % s, [(XCAB + .06, .72), (3.48, .72), (3.48, 1.56), (2.75, 1.56), (XCAB + .06, 1.15)], .1, M['red'], .03, 3, zc=s * (CHW + .03))
    rbox('door_handle', .17, .3, .05, M['satin'], 4.2, 1.22, s * (CHW + .085), .02)
    text('panther_%d' % s, 'PANTHER', .2, M['white'], P(4.12, 1.86, s * (CHW + .05)), (math.radians(90), 0, 0 if s > 0 else math.radians(180)), italic=True)
    rbox('panther_bar', .9, .03, .005, M['white'], 4.12, 1.72, s * (CHW + .05), 0)
    rbox('step1', .85, .05, .34, M['alu'], 4.2, .42, s * (CHW - .05), .015)
    rbox('step2', .85, .05, .3, M['alu'], 4.2, .7, s * (CHW - .02), .015)
    tube('grab', [P(3.7, 1.5, s * (CHW - .18)), P(3.7, 2.8, s * (CHW - .18))], .022, M['orange'])
for z in (-.7, .7):
    rbox('seat', .55, .95, .55, M['seat'], 3.95, 1.85, z, .1); rbox('seatback', .15, .7, .55, M['seat'], 3.65, 2.5, z, .06)
rbox('dash', .6, .42, CW - .5, M['seat'], 5.02, 1.55, 0, .08)
# roof equipment
for s in (-1, 1):
    rbox('lightbar_base', .36, .07, 1.0, M['satin'], 4.22, 3.46, s * .86, .02)
    rbox('lightbar_%d' % s, .3, .12, .94, M['blue'], 4.22, 3.56, s * .86, .04)
rbox('roof_module', .95, .2, .8, M['red'], 3.02, 3.66, 0, .06); rbox('roof_module_low', .9, .18, .74, M['satin'], 3.02, 3.5, 0, .04)
# mirrors
for s in (-1, 1):
    tube('mirror_arm', [P(4.55, 3.12, s * (CHW - .02)), P(5.12, 3.2, s * (CHW + .42)), P(5.2, 3.0, s * (CHW + .5))], .03, M['satin'])
    tube('mirror_arm2', [P(4.78, 2.5, s * (CHW + .02)), P(5.16, 2.6, s * (CHW + .45))], .028, M['satin'])
    rbox('mirror_head', .16, .84, .42, M['black'], 5.22, 2.6, s * (CHW + .52), .06, rot=(0, 0, s * .14))
    rbox('mirror_glass', .02, .76, .36, M['chrome'], 5.13, 2.6, s * (CHW + .52), 0, rot=(0, 0, s * .14))
    rbox('wide_mirror', .12, .16, .56, M['black'], 5.08, 3.26, s * (CHW + .62), .05, rot=(0, 0, s * .5))

# ---------------------------------------------------------------- front module
side_extrude('cowl', [(5.3, .98), (6.0, .98), (6.03, 1.2), (5.78, 1.38), (5.3, 1.38)], CW - .06, M['black'], .05, 4)
text('logo_front', 'rosenbauer', .1, M['white'], P(6.045, 1.12, -.42), (math.radians(90), 0, math.radians(90)))
side_extrude('red_band', [(5.42, .76), (6.1, .76), (6.13, .98), (5.42, .98)], 1.95, M['red'], .04, 3)
side_extrude('lower_bumper', [(5.45, .36), (6.02, .36), (6.12, .48), (6.12, .76), (5.45, .76)], 2.25, M['black'], .05, 4)
for i in range(4): rbox('grille', .03, .03, 1.1, M['matte'], 6.13, .48 + i * .07, 0, .01)
for z in (-.62, .55):
    rbox('wiper', .05, .035, 1.05, M['satin'], 5.72, 1.42, z, .01)
for s in (-1, 1):
    # corner wedge unit, built in a local frame then rotated
    e = bpy.data.objects.new('corner_unit_%d' % s, None); COL.objects.link(e)
    e.location = P(5.93, .58, s * 1.12); e.rotation_euler = (0, 0, s * .75)
    def L(name, ob):
        ob.parent = e; return ob
    h = side_extrude('corner_housing_%d' % s, [(-.4, -.24), (.04, -.24), (.13, -.14), (.13, .6), (.0, .74), (-.4, .74)], .8, M['black'], .04, 4); h.parent = e
    c = rbox('chevron_%d' % s, .01, .54, .66, M['chev'], .19, .26, 0, 0); c.parent = e
    l = rbox('corner_led_%d' % s, .03, .035, .68, M['led'], .2, .66, 0, .01, rot=(s * .16, 0, 0)); l.parent = e
    k = cyl('corner_lamp_%d' % s, .06, .05, M['lens'], P(.19, -.14, s * .22), 'X', 24); k.parent = e
    cap = side_extrude('corner_cap_%d' % s, [(-.5, .76), (.03, .76), (-.05, .96), (-.5, 1.0)], .62, M['red'], .035, 3); cap.parent = e
# bumper turret
cyl('bt_base', .13, .1, M['satin'], P(6.09, 1.0, .3), 'Z', 24)
bpy.ops.object.select_all(action='DESELECT')
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=.16)
me = bpy.data.meshes.new('bt_ball'); bm.to_mesh(me); bm.free(); ob = link(bpy.data.objects.new('bt_ball', me)); ob.location = P(6.12, 1.1, .3); finish(ob, M['red'])
cyl('bt_nozzle', .085, .44, M['black'], P(6.36, 1.1, .3), 'X', 24, r2=.05)
for s in (-1, 1):
    bpy.ops.mesh.primitive_torus_add(major_radius=.07, minor_radius=.024, location=P(6.13, .44, s * .62), rotation=(0, math.radians(90), 0))
    t = bpy.context.active_object; bpy.context.scene.collection.objects.unlink(t) if t.name in bpy.context.scene.collection.objects else None
    for cl in t.users_collection: cl.objects.unlink(t)
    COL.objects.link(t); finish(t, M['red'])

# ---------------------------------------------------------------- roof turret (HRET boom)
cyl('turret_base', .4, .2, M['satin'], P(4.05, 3.52), 'Z', 32)
rbox('turret_body', .62, .34, .56, M['red'], 4.05, 3.79, 0, .08)
boom_e = bpy.data.objects.new('boom', None); COL.objects.link(boom_e); boom_e.location = P(4.17, 3.96); boom_e.rotation_euler = (0, math.radians(2), 0)
b1 = rbox('boom_arm', 3.0, .22, .22, M['black'], 1.45, 0, 0, .06); b1.parent = boom_e; b1.location = Vector((1.45, 0, 0))
b2 = rbox('boom_rod', 2.5, .08, .08, M['alu'], 1.2, -.19, 0, .02); b2.parent = boom_e; b2.location = Vector((1.2, 0, -.19))
b3 = rbox('boom_knuckle', .34, .32, .32, M['red'], 2.95, 0, 0, .06); b3.parent = boom_e; b3.location = Vector((2.95, 0, 0))
b4 = cyl('boom_nozzle', .17, .62, M['black'], Vector((3.36, 0, 0)), 'X', 32, r2=.095); b4.parent = boom_e

# ---------------------------------------------------------------- wheels
R, TW = .75, .64
for i, x in enumerate([3.35, -2.45, -4.05]):
    for s in (-1, 1):
        c = P(x, R, s * 1.17)
        t = cyl('tyre_%d_%d' % (i, s), R, TW, M['rubber'], c, 'Y', 64, bevel=.14); t.modifiers['Bevel'].segments = 8
        # tread lugs: radial array around an empty
        e = bpy.data.objects.new('lug_pivot_%d_%d' % (i, s), None); COL.objects.link(e); e.location = c; e.rotation_euler = (0, math.radians(360 / 28), 0)
        for side in (-1, 1):
            lug = rbox('lugs_%d_%d_%d' % (i, s, side), .16, .07, TW * .4, M['rubber'], x, 2 * R - .0, s * 1.17 + side * TW * .22, .015, rot=(0, 0, 0))
            lug.location = c + Vector((side * .04, side * TW * .22, R + .01)); lug.rotation_euler = (0, 0, 0)
            # move origin to wheel centre so the array rotates around the axle
            lug.data.transform(__import__('mathutils').Matrix.Translation(lug.location - c)); lug.location = c
            arr = lug.modifiers.new('Array', 'ARRAY'); arr.count = 28; arr.use_relative_offset = False; arr.use_object_offset = True; arr.offset_object = e
        cyl('rim_%d_%d' % (i, s), .44, TW + .02, M['rim'], c, 'Y', 48, bevel=.03)
        cyl('hub_%d_%d' % (i, s), .19, TW + .12, M['satin'], c, 'Y', 32, bevel=.02, r2=.15)
        for k in range(10):
            a = k / 10 * math.tau
            cyl('bolt', .022, .05, M['chrome'], c + Vector((math.cos(a) * .27, -s * (TW / 2 + .03), math.sin(a) * .27)), 'Y', 6)
for s in (-1, 1):
    bpy.ops.mesh.primitive_torus_add(major_radius=.97, minor_radius=.11, location=P(3.35, .8, s * (HW - .03)), rotation=(math.radians(90), 0, 0))
    t = bpy.context.active_object
    for cl in t.users_collection: cl.objects.unlink(t)
    COL.objects.link(t); finish(t, M['satin'])
    # keep only the upper half of the arch
    bm = bmesh.new(); bm.from_mesh(t.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < 0.12], context='VERTS'); bm.to_mesh(t.data); bm.free()
log('model built', len(COL.objects), 'objects')

# ---------------------------------------------------------------- environment: ground, sky, sun
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=60)
me = bpy.data.meshes.new('ground'); bm.to_mesh(me); bm.free(); g = bpy.data.objects.new('ground', me); ENV.objects.link(g)
gm = bpy.data.materials.new('concrete'); gm.use_nodes = True; nt = gm.node_tree; b = nt.nodes.get('Principled BSDF')
nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 18; nz.inputs['Detail'].default_value = 10
cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = lin(0x4a4946); cr.color_ramp.elements[1].color = lin(0x6c6b67)
bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .15
nt.links.new(nz.outputs['Fac'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], b.inputs['Base Color']); nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
setin(b, 'Roughness', .75); me.materials.append(gm)

world = bpy.data.worlds.new('Sky'); sc.world = world
try: world.use_nodes = True
except Exception: pass
wn = world.node_tree
bg = wn.nodes.get('Background') or wn.nodes.new('ShaderNodeBackground'); sky_ok = False
if not bg.outputs[0].links:
    wo = wn.nodes.get('World Output') or wn.nodes.new('ShaderNodeOutputWorld'); wn.links.new(bg.outputs[0], wo.inputs[0])
try:
    sky = wn.nodes.new('ShaderNodeTexSky')
    for t in ('NISHITA', 'MULTIPLE_SCATTERING', 'SINGLE_SCATTERING', 'HOSEK_WILKIE', 'PREETHAM'):
        try: sky.sky_type = t; break
        except Exception: continue
    try: sky.sun_elevation = math.radians(38); sky.sun_rotation = math.radians(135)
    except Exception: pass
    wn.links.new(sky.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.22; sky_ok = True
except Exception as ex:
    log('sky fallback', ex)
if not sky_ok: bg.inputs['Color'].default_value = (0.45, 0.62, 0.95, 1); bg.inputs['Strength'].default_value = 1.0
sun_d = bpy.data.lights.new('Sun', 'SUN'); sun_d.energy = 3.2; sun_d.angle = math.radians(1.5)
sun = bpy.data.objects.new('Sun', sun_d); ENV.objects.link(sun); sun.rotation_euler = (math.radians(50), 0, math.radians(135))
fill_d = bpy.data.lights.new('Fill', 'AREA'); fill_d.energy = 1500; fill_d.size = 8
fill = bpy.data.objects.new('Fill', fill_d); ENV.objects.link(fill); fill.location = (14, 10, 8); fill.rotation_euler = (math.radians(60), 0, math.radians(125))

# ---------------------------------------------------------------- cameras
def cam(name, loc, target, lens=45):
    cd = bpy.data.cameras.new(name); cd.lens = lens
    c = bpy.data.objects.new(name, cd); ENV.objects.link(c); c.location = loc
    d = Vector(target) - Vector(loc); c.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); return c
cams = [cam('cam_front34', (13.5, 9.5, 2.6), (1.0, 0, 1.6)), cam('cam_side', (0.0, 19.5, 2.0), (0, 0, 1.6), 40), cam('cam_rear34', (-14, -10, 3.2), (-1, 0, 1.6)), cam('cam_front', (16, 0, 1.6), (0, 0, 1.5), 55)]

# ---------------------------------------------------------------- render settings (GPU if available)
sc.render.engine = 'CYCLES'
try:
    pr = bpy.context.preferences.addons['cycles'].preferences
    chosen = None
    for t in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'):
        try:
            pr.compute_device_type = t; pr.get_devices()
            gpus = [d for d in pr.devices if d.type != 'CPU']
            if gpus:
                for d in pr.devices: d.use = (d.type != 'CPU')
                chosen = t; break
        except Exception: continue
    sc.cycles.device = 'GPU' if chosen else 'CPU'
    log('render device', chosen or 'CPU')
except Exception as ex:
    log('device setup failed', ex)
sc.cycles.samples = 128 if sc.cycles.device == 'GPU' else 48
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.view_settings.exposure = -0.35
try: sc.view_settings.view_transform = 'AgX'
except Exception: pass
for lk in ('AgX - Punchy', 'Punchy', 'AgX - Medium High Contrast', 'Medium High Contrast'):
    try: sc.view_settings.look = lk; break
    except Exception: continue
sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 92

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'panther_6x6.blend'))
log('saved blend')

# ---------------------------------------------------------------- export glb (truck only)
try:
    bpy.ops.object.select_all(action='DESELECT')
    for o in COL.objects: o.select_set(True)
    bpy.context.view_layer.objects.active = COL.objects[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'panther_6x6.glb'), export_format='GLB', use_selection=True, export_apply=True)
    log('exported glb')
except Exception as ex:
    log('glb export failed', ex)

# ---------------------------------------------------------------- renders
RENDER = globals().get('RENDER', False)
for c in (cams if RENDER else []):
    t0 = time.time(); sc.camera = c
    sc.render.filepath = os.path.join(OUT, 'render_%s.jpg' % c.name)
    bpy.ops.render.render(write_still=True)
    log('rendered', c.name, '%.1fs' % (time.time() - t0))
sc.camera = cams[0]
log('DONE', OUT)
LOG.close()
