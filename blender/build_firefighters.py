# Firefighter crew for the Panther scene. Run AFTER build_panther.py (shares its globals: bpy, M, mat, sc, ENV, cam, OUT, log, Vector, math, bmesh).
import bpy, bmesh, math, os, time
from mathutils import Vector, Matrix

LOG = open(os.path.join(OUT, 'build_log.txt'), 'a')
FFC = bpy.data.collections.new('Firefighters'); sc.collection.children.link(FFC)
FM = {
 'turnout': mat('ff_turnout', 0x8a6e45, rough=0.8),
 'turnout2': mat('ff_turnout_dark', 0x5a4a30, rough=0.85),
 'prox': mat('ff_proximity', 0xc7cacf, metal=0.85, rough=0.22),
 'gold': mat('ff_gold_visor', 0xc79a3a, metal=1.0, rough=0.08),
 'refl': mat('ff_reflective', 0xdde24a, metal=0.3, rough=0.3, emit=0xdde24a, emit_s=0.15),
 'helmet': mat('ff_helmet', 0xe9e6dc, rough=0.35, coat=0.6),
 'helmet_y': mat('ff_helmet_yellow', 0xe8b90f, rough=0.35, coat=0.6),
 'boot': mat('ff_boot', 0x0c0c0d, rough=0.55),
 'glove': mat('ff_glove', 0x1a1612, rough=0.7),
 'visor': mat('ff_visor', 0x04060a, rough=0.04, coat=1.0, coat_rough=0.0),
 'tank': mat('ff_scba_tank', 0x2c3036, metal=0.6, rough=0.3),
 'tank_stripe': mat('ff_scba_stripe', 0xd8c21c, rough=0.4),
 'strap': mat('ff_strap', 0x15171a, rough=0.8),
 'hose': mat('ff_hose', 0xc9a227, rough=0.6),
 'noz': mat('ff_nozzle', 0xb80a18, rough=0.3, coat=0.8),
}

def mk(name, bm, m, loc, root, q=None, bevel=0.0, segs=3):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); FFC.objects.link(ob); ob.parent = root; ob.location = loc
    if q is not None: ob.rotation_mode = 'QUATERNION'; ob.rotation_quaternion = q
    me.materials.append(m)
    for p in me.polygons: p.use_smooth = True
    if bevel > 0:
        md = ob.modifiers.new('Bevel', 'BEVEL'); md.width = bevel; md.segments = segs; md.limit_method = 'ANGLE'
    return ob

def seg(root, name, a, b, r1, r2, m):
    d = b - a; bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r1, radius2=r2, depth=d.length)
    mk(name, bm, m, (a + b) / 2, root, d.to_track_quat('Z', 'Y'))
    for p, r in ((a, r1), (b, r2)): ball(root, name + '_j', p, r, m)

def ball(root, name, c, r, m, sc3=(1, 1, 1)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sc3[0], v.co.y * sc3[1], v.co.z * sc3[2]))
    return mk(name, bm, m, c, root)

def box(root, name, c, size, m, bevel=0.03, rot=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    q = None
    if rot: q = __import__('mathutils').Euler(rot).to_quaternion()
    return mk(name, bm, m, c, root, q, bevel)

def cylz(root, name, c, r, h, m, rot=None, bevel=0.0):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=r, radius2=r, depth=h)
    q = None
    if rot: q = __import__('mathutils').Euler(rot).to_quaternion()
    return mk(name, bm, m, c, root, q, bevel)

def band(root, a, b, t, r, m, w=0.05):
    c = a + (b - a) * t; d = b - a
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=r, radius2=r, depth=w)
    mk('band', bm, m, c, root, d.to_track_quat('Z', 'Y'))

POSES = {
 'stand': dict(legs=[((.02, .0, .5), (.0, .0, .1)), ((.02, .0, .5), (.0, .0, .1))], arms=[((-.03, .05, 1.2), (.05, .03, .95)), ((-.03, .05, 1.2), (.05, .03, .95))]),
 'walk':  dict(legs=[((.2, 0, .52), (.34, 0, .11)), ((-.1, 0, .52), (-.3, 0, .2))], arms=[((-.12, .04, 1.22), (-.28, .02, 1.02)), ((.14, .04, 1.25), (.3, .03, 1.12))]),
 'hose':  dict(legs=[((.16, 0, .5), (.24, 0, .1)), ((-.06, 0, .5), (-.2, 0, .12))], arms=[((.12, .06, 1.26), (.32, -.08, 1.2)), ((.1, .08, 1.22), (.3, .18, 1.12))]),
}

def firefighter(x, y, yaw, pose, suit, tag):
    root = bpy.data.objects.new('ff_' + tag, None); FFC.objects.link(root); root.location = (x, y, 0); root.rotation_euler = (0, 0, yaw)
    P_ = POSES[pose]; prox = suit == 'prox'
    body = FM['prox'] if prox else FM['turnout']; legm = FM['prox'] if prox else FM['turnout2']
    hel = FM['prox'] if prox else FM['helmet_y']
    V = Vector
    # torso / pelvis
    box(root, 'torso', V((0, 0, 1.3)), (.27, .44, .5), body, .07, rot=(0, .05, 0))
    box(root, 'pelvis', V((0, 0, 1.0)), (.26, .38, .22), legm, .05)
    cylz(root, 'neck', V((0, 0, 1.58)), .055, .1, body)
    for z in (1.16, 1.3): box(root, 'tband', V((0, 0, z)), (.285, .455, .045), FM['refl'], .01)
    for s in (-1, 1):
        # legs
        k, a = P_['legs'][0 if s > 0 else 1]
        hip = V((0, s * .1, .95)); kn = V((k[0], s * .115, k[2])); an = V((a[0], s * .12, a[2]))
        seg(root, 'thigh', hip, kn, .105, .082, legm); seg(root, 'shin', kn, an, .08, .068, legm)
        band(root, kn, an, .55, .084, FM['refl']); band(root, kn, an, .8, .075, FM['refl'])
        box(root, 'boot', an + V(.06, 0, -.01), (.3, .115, .2), FM['boot'], .035)
        # arms
        e, h = P_['arms'][0 if s > 0 else 1]
        sh = V((0, s * .25, 1.48)); el = V((e[0], s * (.26 + e[1]), e[2])); ha = V((h[0], s * (.22 + h[1] * (1 if pose != 'hose' else (1 if s > 0 else -1))), h[2]))
        if pose == 'hose': ha = V(h[0], (.07 if s > 0 else -.07) + (0.0), h[2])
        seg(root, 'upper_arm', sh, el, .075, .066, body); seg(root, 'forearm', el, ha, .066, .052, body)
        band(root, el, ha, .5, .068, FM['refl'], .04); ball(root, 'glove', ha, .06, FM['glove'], (1.2, 1, 1))
    # SCBA
    box(root, 'backplate', V((-.17, 0, 1.33)), (.06, .3, .42), FM['strap'], .02)
    cylz(root, 'tank', V((-.25, 0, 1.3)), .085, .52, FM['tank'], bevel=.0); cylz(root, 'tank_stripe', V((-.25, 0, 1.4)), .0862, .06, FM['tank_stripe'])
    ball(root, 'tank_cap', V((-.25, 0, 1.56)), .085, FM['tank'], (1, 1, .55))
    for s in (-1, 1): box(root, 'strap', V((.0, s * .13, 1.38)), (.285, .05, .5), FM['strap'], .01, rot=(.0, 0, 0))
    # head / helmet / mask
    if prox:
        ball(root, 'hood', V((0, 0, 1.69)), .15, FM['prox'], (1, 1, 1.05))
        ball(root, 'visor', V((.1, 0, 1.69)), .11, FM['gold'], (.7, 1.05, 1.05))
    else:
        ball(root, 'head', V((0, 0, 1.68)), .1, FM['strap'])
        ball(root, 'helmet', V((0, 0, 1.73)), .145, hel, (1.15, 1, .8))
        cylz(root, 'brim', V((.02, 0, 1.69)), .19, .014, hel)
        box(root, 'neckflap', V((-.14, 0, 1.64)), (.03, .26, .14), FM['turnout2'], .01, rot=(0, .3, 0))
        box(root, 'mask', V((.08, 0, 1.66)), (.07, .14, .14), FM['visor'], .035)
        ball(root, 'regulator', V((.13, 0, 1.6)), .04, FM['tank'])
        box(root, 'helmet_ridge', V((0, 0, 1.84)), (.28, .035, .03), hel, .01)
    return root

CREW = [(9.6, 2.5, .12, 'walk', 'turnout'), (11.0, .9, .0, 'hose', 'prox'), (10.3, -.9, -.06, 'hose', 'prox'), (8.9, -2.7, -.15, 'walk', 'turnout'), (8.2, 3.7, .3, 'stand', 'turnout')]
for i, c in enumerate(CREW): firefighter(*c, str(i))

# hose line + nozzle for the two-man hose team
def tube_w(name, pts, r, m):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        bp = sp.bezier_points[i]; bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new(name, cu); FFC.objects.link(ob); cu.materials.append(m)
    for p in cu.splines[0].bezier_points: pass
    return ob
tube_w('hose_line', [Vector(p) for p in [(11.5, .75, 1.2), (10.9, .85, 1.15), (10.55, .1, .85), (10.5, -.85, 1.1), (9.6, -1.7, .12), (7.5, -2.2, .1), (4.5, -2.4, .1), (2.0, -2.4, .1)]], .045, FM['hose'])
nz = bpy.data.objects.new('nozzle_root', None); FFC.objects.link(nz); nz.location = (11.2, .8, 1.2)
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=.06, radius2=.035, depth=.5)
mk('nozzle', bm, FM['noz'], (.12, 0, 0), nz, Vector((1, 0, 0)).to_track_quat('Z', 'Y'))
log('crew built', len(FFC.objects))

# cameras + render
cams2 = [cam('cam_crew', (15.5, -5.6, 1.9), (9.5, .2, 1.2), 42), cam('cam_close', (13.2, 3.6, 1.45), (10.6, .3, 1.25), 60), cam('cam_group', (-3, -13, 3.0), (7.5, 0, 1.2), 38)]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'panther_crew.blend'))
try:
    bpy.ops.object.select_all(action='DESELECT')
    for o in FFC.objects: o.select_set(True)
    bpy.context.view_layer.objects.active = FFC.objects[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'firefighters.glb'), export_format='GLB', use_selection=True, export_apply=True)
    log('exported crew glb')
except Exception as ex: log('crew glb failed', ex)
RENDER_FF = globals().get('RENDER_FF', True)
for c in (cams2 if RENDER_FF else []):
    sc.camera = c; sc.render.filepath = os.path.join(OUT, 'render_%s.jpg' % c.name); t0 = time.time()
    bpy.ops.render.render(write_still=True); log('rendered', c.name, '%.1fs' % (time.time() - t0))
log('CREW DONE')
LOG.close()
