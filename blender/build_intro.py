# Cinematic intro — "elite firefighters": slow-motion, low-angle tracking shot of three firefighters
# in full turnout gear walking out of amber smoke, fire raging behind the Panther, embers and ash in
# the air, red/blue emergency strobes cutting through the haze, ending on a push-in to the hero's
# soot-stained helmet and visor reflecting the flames.  2.39:1 anamorphic, Cycles, volumetrics.
#
# Run (Blender 4.2+ / 5.x):   blender -b -P blender/build_intro.py
# It builds the truck (build_panther.py) and crew helpers (build_firefighters.py) first if they are
# not already in this session, then renders ~/Documents/Panther6x6/intro_firefighters.mp4.
# Optional globals (set before exec, or edit here):
#   RENDER_INTRO  False = only build + save the .blend          (default True)
#   INTRO_FRAMES  shot length in frames @24fps                   (default 240 = 10 s)
#   INTRO_PCT     resolution percentage of 3840x1608 (2.39:1)    (default 50 -> 1920x804; 200 = 8K)
#   INTRO_STILLS  list of frames to render as JPEG instead of the movie (quick look-dev)
import bpy, bmesh, math, os, time
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(globals().get('__file__', os.path.join(os.getcwd(), 'blender', 'x'))))
if 'cam' not in globals():
    RENDER = False; exec(compile(open(os.path.join(HERE, 'build_panther.py')).read(), 'build_panther.py', 'exec'))
if 'firefighter' not in globals():
    RENDER_FF = False; exec(compile(open(os.path.join(HERE, 'build_firefighters.py')).read(), 'build_firefighters.py', 'exec'))

LOG = open(os.path.join(OUT, 'build_log.txt'), 'a')
log('intro start', time.ctime())
FPS = 24
NF = globals().get('INTRO_FRAMES', 240)
PRE = 120  # particle pre-roll before the first rendered frame
sc.frame_start, sc.frame_end = 1, NF
sc.render.fps = FPS

# the parked crew from build_firefighters.py stays out of this shot
for o in FFC.all_objects: o.hide_render = True; o.hide_viewport = True
FFC_PARKED = FFC
INTRO = bpy.data.collections.new('Intro'); sc.collection.children.link(INTRO)
FFC = INTRO  # mk()/seg()/ball()/box()/cylz() from build_firefighters.py link into FFC

def empty(name, parent=None, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None); INTRO.objects.link(e); e.parent = parent; e.location = loc
    e.empty_display_size = .1; return e

def keys(target, path, frames_vals, interp):
    # insert keys with a given interpolation (works for legacy and layered actions)
    ed = bpy.context.preferences.edit; old = ed.keyframe_new_interpolation_type
    ed.keyframe_new_interpolation_type = interp
    try:
        for f, v in frames_vals:
            if isinstance(path, tuple): getattr(target, path[0])[path[1]] = v; target.keyframe_insert(path[0], index=path[1], frame=f)
            else: setattr(target, path, v); target.keyframe_insert(path, frame=f)
    finally: ed.keyframe_new_interpolation_type = old

def node(nt, kind, **inp):
    n = nt.nodes.new(kind)
    for k, v in inp.items():
        if k.islower() and hasattr(n, k): setattr(n, k, v)  # node property (operation, ...)
        else: setin(n, k, v)                                # input socket
    return n

# ---------------------------------------------------------------- materials: sooty canvas, scorched helmet, polished steel
def grimy(name, color, soot=0.45, rough=0.8, coat=0.0, weave=True, metal=0.0):
    m = mat(name, color, rough=rough, coat=coat, metal=metal); nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = node(nt, 'ShaderNodeTexNoise', Scale=3.5, Detail=12.0, Roughness=.62); nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = .38; cr.color_ramp.elements[1].position = .72
    cr.color_ramp.elements[0].color = (1, 1, 1, 1); cr.color_ramp.elements[1].color = (0, 0, 0, 1)
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
    mix.inputs['A'].default_value = lin(color); mix.inputs['B'].default_value = lin(0x1a1410)
    fac = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); fac.inputs[1].default_value = soot
    nt.links.new(cr.outputs['Color'], fac.inputs[0]); nt.links.new(fac.outputs[0], mix.inputs['Factor'])
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    rr = node(nt, 'ShaderNodeMapRange'); rr.inputs['To Min'].default_value = rough; rr.inputs['To Max'].default_value = min(1, rough + .2)
    nt.links.new(cr.outputs['Color'], rr.inputs['Value']); nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])
    bp = node(nt, 'ShaderNodeBump'); bp.inputs['Strength'].default_value = .35 if weave else .12; bp.inputs['Distance'].default_value = .002
    if weave:  # rip-stop canvas weave
        wv = node(nt, 'ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.inputs['Scale'].default_value = 140; wv.inputs['Distortion'].default_value = 2
        wv2 = node(nt, 'ShaderNodeTexWave'); wv2.wave_type = 'BANDS'; wv2.bands_direction = 'Y'; wv2.inputs['Scale'].default_value = 140
        for w in (wv, wv2): nt.links.new(tc.outputs['Object'], w.inputs['Vector'])
        add = node(nt, 'ShaderNodeMath', operation='ADD'); nt.links.new(wv.outputs['Fac'], add.inputs[0]); nt.links.new(wv2.outputs['Fac'], add.inputs[1])
        nt.links.new(add.outputs[0], bp.inputs['Height'])
    else:
        nt.links.new(nz.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

IM = {
 'turnout': grimy('ix_turnout', 0x8d7146, .55, .82),
 'turnout_dark': grimy('ix_turnout_dark', 0x4e4030, .5, .85),
 'helmet': grimy('ix_helmet_black', 0x0d0d0e, .35, .32, coat=.9, weave=False),
 'helmet_y': grimy('ix_helmet_yellow', 0xd9a60e, .6, .38, coat=.7, weave=False),
 'visor': mat('ix_visor_gold', 0xd6a24a, metal=1.0, rough=.035, coat=1.0, coat_rough=0.0),
 'leather': grimy('ix_leather_front', 0x5a0a0c, .4, .45, weave=False),
 'steel': mat('ix_polished_steel', 0xdde1e6, metal=1.0, rough=.1),
 'steel_dark': mat('ix_forged_steel', 0x6d7278, metal=1.0, rough=.32),
 'fiberglass': mat('ix_fiberglass_yellow', 0xe2b00c, rough=.3, coat=.6),
 'axe_red': mat('ix_axe_red', 0x8e0a10, rough=.3, coat=.8, metal=.2),
}

# ---------------------------------------------------------------- articulated walker
LEG_T, LEG_S, ARM_U, ARM_F = .45, .43, .3, .27
def walker(tag, suit, helmet_m, carry=None):
    root = empty('walker_' + tag)
    hips = empty('hips_' + tag, root, (0, 0, .95))
    chest = empty('chest_' + tag, hips)
    V = Vector; body = IM[suit]; legm = IM['turnout_dark']
    box(chest, 'torso', V((0, 0, .36)), (.3, .46, .52), body, .08)
    box(hips, 'pelvis', V((0, 0, .05)), (.27, .4, .24), legm, .05)
    cylz(chest, 'collar', V((0, 0, .66)), .1, .1, body)
    for z in (.2, .36): box(chest, 'tband', V((0, 0, z)), (.31, .47, .045), FM['refl'], .01)
    box(chest, 'coat_hem', V((0, 0, .06)), (.33, .5, .1), body, .04)
    # SCBA
    box(chest, 'backplate', V((-.18, 0, .38)), (.06, .3, .44), FM['strap'], .02)
    cylz(chest, 'tank', V((-.27, 0, .36)), .09, .55, FM['tank']); cylz(chest, 'tank_stripe', V((-.27, 0, .47)), .0915, .06, FM['tank_stripe'])
    ball(chest, 'tank_cap', V((-.27, 0, .63)), .09, FM['tank'], (1, 1, .55))
    for s in (-1, 1): box(chest, 'strap', V((.0, s * .13, .42)), (.31, .05, .5), FM['strap'], .01)
    # head, helmet (traditional: long rear brim, front leather shield), flip-down visor, mask + regulator
    head = empty('head_' + tag, chest, (0, 0, .73))
    ball(head, 'face', V((0, 0, 0)), .1, FM['strap'])
    box(head, 'mask', V((.08, 0, -.02)), (.07, .14, .15), FM['visor'], .035); ball(head, 'regulator', V((.135, 0, -.08)), .042, FM['tank'])
    ball(head, 'helmet', V((-.01, 0, .07)), .15, helmet_m, (1.18, 1.0, .82))
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=40, radius1=.2, radius2=.2, depth=.014)
    for v in bm.verts: v.co.x = v.co.x * 1.25 - (.06 if v.co.x < 0 else 0)
    mk('brim', bm, helmet_m, V((-.02, 0, .02)), head, Euler((0, -.12, 0)).to_quaternion())
    box(head, 'ridge', V((-.02, 0, .19)), (.3, .04, .035), helmet_m, .012)
    box(head, 'front_shield', V((.14, 0, .1)), (.025, .11, .13), IM['leather'], .015, rot=(0, -.35, 0))
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=.165)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x < .07 or v.co.z > .06 or v.co.z < -.11], context='VERTS')
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.004)
    visor = mk('visor', bm, IM['visor'], V((-.02, 0, .02)), head)
    box(head, 'neckflap', V((-.15, 0, -.03)), (.03, .27, .16), legm, .01, rot=(0, .3, 0))
    J = {'root': root, 'hips': hips, 'chest': chest, 'head': head, 'visor': visor}
    for s, sd in ((1, 'L'), (-1, 'R')):
        hp = empty('hip%s_%s' % (sd, tag), hips, (0, s * .11, 0)); kn = empty('knee%s_%s' % (sd, tag), hp, (0, 0, -LEG_T)); an = empty('ankle%s_%s' % (sd, tag), kn, (0, 0, -LEG_S))
        seg(hp, 'thigh', V((0, 0, 0)), V((0, 0, -LEG_T)), .11, .085, legm); seg(kn, 'shin', V((0, 0, 0)), V((0, 0, -LEG_S)), .085, .075, legm)
        band(kn, V((0, 0, 0)), V((0, 0, -LEG_S)), .55, .088, FM['refl']); band(kn, V((0, 0, 0)), V((0, 0, -LEG_S)), .78, .08, FM['refl'])
        box(an, 'boot', V((.06, 0, -.035)), (.31, .12, .15), FM['boot'], .035); box(an, 'boot_top', V((0, 0, .06)), (.14, .12, .14), FM['boot'], .03)
        sh = empty('shoulder%s_%s' % (sd, tag), chest, (0, s * .27, .52)); el = empty('elbow%s_%s' % (sd, tag), sh, (0, 0, -ARM_U))
        seg(sh, 'upper_arm', V((0, 0, 0)), V((0, 0, -ARM_U)), .08, .07, body); seg(el, 'forearm', V((0, 0, 0)), V((0, 0, -ARM_F)), .07, .056, body)
        band(el, V((0, 0, 0)), V((0, 0, -ARM_F)), .5, .072, FM['refl'], .04)
        ball(el, 'glove', V((.0, 0, -ARM_F - .03)), .062, FM['glove'], (1.15, .9, 1.2)); box(el, 'cuff', V((0, 0, -ARM_F + .03)), (.13, .13, .07), FM['glove'], .02)
        J.update({'hip' + sd: hp, 'knee' + sd: kn, 'ankle' + sd: an, 'shoulder' + sd: sh, 'elbow' + sd: el})
    if carry == 'axe':  # flat-head axe hanging from the right hand, head just above the grip
        g = empty('axe_' + tag, J['elbowR'], (0, 0, -ARM_F - .03)); g.rotation_euler = (0, -.15, 0)
        cylz(g, 'axe_handle', V((0, 0, -.28)), .019, .86, IM['fiberglass'])
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co = Vector((v.co.x * .2, v.co.y * .045, v.co.z * .1))
            if v.co.x > 0: v.co.y *= .12; v.co.z *= 1.7
        mk('axe_blade', bm, IM['steel'], V((.09, 0, .12)), g, bevel=.004)
        box(g, 'axe_poll', V((-.04, 0, .12)), (.07, .055, .085), IM['axe_red'], .01)
    if carry == 'halligan':
        g = empty('halligan_' + tag, J['elbowL'], (0, 0, -ARM_F - .03)); g.rotation_euler = (0, -.2, 0)
        cylz(g, 'hal_bar', V((0, 0, -.2)), .017, .82, IM['steel_dark'])
        box(g, 'hal_adze', V((.08, 0, .2)), (.16, .04, .03), IM['steel'], .006, rot=(0, -.3, 0))
        cylz(g, 'hal_pick', V((-.07, 0, .21)), .015, .14, IM['steel'], rot=(0, -1.2, 0))
        box(g, 'hal_fork', V((.03, 0, -.62)), (.1, .05, .012), IM['steel'], .004, rot=(0, -.5, 0))
    return J

# formation: hero in the middle a half-step ahead, flanks behind; all walk +X toward the lens
SPEED = 1.48 / 64          # one stride cycle (≈1.48 m) every 64 frames  ->  ~0.55 m/s, a 2.5x slow-motion walk
CYCLE = 64
CREW_I = [
 dict(tag='hero', y=0.0, x0=7.6, phase=0.0, suit='turnout', helmet='helmet', carry=None),
 dict(tag='left', y=1.35, x0=6.7, phase=.37, suit='turnout', helmet='helmet_y', carry='axe'),
 dict(tag='right', y=-1.3, x0=6.85, phase=.71, suit='turnout', helmet='helmet', carry='halligan'),
]
def hero_x(f): return CREW_I[0]['x0'] + SPEED * (f - 1)

def animate_walk(J, c):
    hv, kv, av, sv, ev = ({s: [] for s in 'LR'} for _ in range(5)); bob, roll, twist, root, head = [], [], [], [], []
    for f in range(-2, NF + 3):
        ph = math.tau * ((f - 1) / CYCLE + c['phase'])
        for s, o in (('L', 0.0), ('R', math.pi)):
            p = ph + o
            hv[s].append((f, (0, -.42 * math.sin(p), 0)))
            kv[s].append((f, (0, .08 + .62 * max(0.0, math.cos(p)) ** 1.5, 0)))
            av[s].append((f, (0, -.08 - .22 * max(0.0, math.cos(p)) + .12 * max(0.0, -math.cos(p)), 0)))
            sv[s].append((f, (0, .32 * math.sin(p), 0)))
            ev[s].append((f, (0, -.32 - .2 * max(0.0, math.sin(-p)), 0)))
        bob.append((f, (0, 0, .95 + .022 * math.cos(2 * ph))))
        roll.append((f, (.025 * math.sin(ph), .07, 0)))
        twist.append((f, (0, .02, -.06 * math.sin(ph))))
        root.append((f, (c['x0'] + SPEED * (f - 1), c['y'], 0)))
        head.append((f, (-.025 * math.sin(ph) * .8, -.09, .06 * math.sin(ph))))  # head stays level, eyes down the lens
    for s in 'LR':
        keys(J['hip' + s], 'rotation_euler', hv[s], 'LINEAR'); keys(J['knee' + s], 'rotation_euler', kv[s], 'LINEAR')
        keys(J['ankle' + s], 'rotation_euler', av[s], 'LINEAR'); keys(J['shoulder' + s], 'rotation_euler', sv[s], 'LINEAR')
        keys(J['elbow' + s], 'rotation_euler', ev[s], 'LINEAR')
    keys(J['hips'], 'location', bob, 'LINEAR'); keys(J['hips'], 'rotation_euler', roll, 'LINEAR'); keys(J['chest'], 'rotation_euler', twist, 'LINEAR')
    keys(J['root'], 'location', root, 'LINEAR'); keys(J['head'], 'rotation_euler', head, 'LINEAR')

CREW_J = []
for c in CREW_I:
    J = walker(c['tag'], c['suit'], IM[c['helmet']], c['carry']); animate_walk(J, c); CREW_J.append(J)
log('intro crew built + animated', len(INTRO.objects))

# ---------------------------------------------------------------- night, wet concrete, kill daylight
for n in ('Sun', 'Fill'):
    if n in bpy.data.objects: bpy.data.objects[n].hide_render = True
wn = sc.world.node_tree
for n in list(wn.nodes):
    if n.type == 'TEX_SKY': wn.nodes.remove(n)
bg = [n for n in wn.nodes if n.type == 'BACKGROUND'][0]
bg.inputs['Color'].default_value = lin(0x24120a); bg.inputs['Strength'].default_value = .25
gm = bpy.data.materials.get('concrete')
if gm:
    gb = gm.node_tree.nodes.get('Principled BSDF')
    for l in list(gb.inputs['Roughness'].links): gm.node_tree.links.remove(l)
    nzw = node(gm.node_tree, 'ShaderNodeTexNoise', Scale=1.6, Detail=6.0)
    pud = node(gm.node_tree, 'ShaderNodeMapRange'); pud.inputs['From Min'].default_value = .45; pud.inputs['From Max'].default_value = .6
    pud.inputs['To Min'].default_value = .55; pud.inputs['To Max'].default_value = .08  # puddles of run-off water
    gm.node_tree.links.new(nzw.outputs['Fac'], pud.inputs['Value']); gm.node_tree.links.new(pud.outputs['Result'], gb.inputs['Roughness'])

def light(name, kind, loc, energy, color, size=.1, rot=None, spot=None, blend=.15):
    d = bpy.data.lights.new(name, kind); d.energy = energy; d.color = lin(color)[:3]
    if kind in ('POINT', 'SPOT'): d.shadow_soft_size = size
    if kind == 'AREA': d.size = size
    if spot: d.spot_size = spot; d.spot_blend = blend
    ob = bpy.data.objects.new(name, d); INTRO.objects.link(ob); ob.location = loc
    if rot: ob.rotation_euler = rot
    return ob

def flicker(seed, f, depth=.45):
    # cheap layered pseudo-noise for fire light
    v = sum(math.sin(f * k + seed * 3.7 * (i + 1)) / (i + 1) for i, k in enumerate((.13, .29, .61, 1.13)))
    return max(.15, 1 + depth * v / 1.6)

# ---------------------------------------------------------------- fire: volumetric blaze behind the truck + off-camera flare-ups
def box01(nt, tc):
    # 0..1 box coordinates (Generated is not available inside Cycles volumes)
    a = nt.nodes.new('ShaderNodeVectorMath'); a.operation = 'ADD'; a.inputs[1].default_value = (.5, .5, .5)
    nt.links.new(tc.outputs['Object'], a.inputs[0]); return a.outputs[0]

def fire_volume(name, loc, size, temp=1500, glow=5.0, smoke=0.5, scale=1.4, seed=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); INTRO.objects.link(ob); ob.location = loc; ob.scale = size
    m = bpy.data.materials.new(name + '_mat'); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
    out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
    pv = nt.nodes.new('ShaderNodeVolumePrincipled'); nt.links.new(pv.outputs[0], out.inputs['Volume'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(box01(nt, tc), sep.inputs[0])
    mp = nt.nodes.new('ShaderNodeMapping'); nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); mp.inputs['Scale'].default_value = (size[0] * scale * .5, size[1] * scale * .5, size[2] * scale * .25)  # ~metres
    keys(mp.inputs['Location'], ('default_value', 2), [(1, -seed), (NF, -seed - .05 * NF)], 'LINEAR')  # flames climb
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.noise_dimensions = '4D'; nt.links.new(mp.outputs[0], nz.inputs['Vector'])
    setin(nz, 'Scale', 1.0); setin(nz, 'Detail', 9.0); setin(nz, 'Roughness', .58); setin(nz, 'Distortion', .6)
    keys(nz.inputs['W'], 'default_value', [(1, seed), (NF, seed + .004 * NF)], 'LINEAR')
    # field = noise - height, faded at the sides of the box
    hz = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); hz.inputs[1].default_value = .85; nt.links.new(sep.outputs['Z'], hz.inputs[0])
    con = node(nt, 'ShaderNodeMapRange'); con.inputs['From Min'].default_value = .4; con.inputs['From Max'].default_value = .66; nt.links.new(nz.outputs['Fac'], con.inputs['Value'])
    sub = node(nt, 'ShaderNodeMath', operation='SUBTRACT'); nt.links.new(con.outputs['Result'], sub.inputs[0]); nt.links.new(hz.outputs[0], sub.inputs[1])
    def tent(sock):  # 0 at the box faces, 1 in the middle
        inv = node(nt, 'ShaderNodeMath', operation='SUBTRACT'); inv.inputs[0].default_value = 1.0; nt.links.new(sock, inv.inputs[1])
        t = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); nt.links.new(sock, t.inputs[0]); nt.links.new(inv.outputs[0], t.inputs[1])
        return t.outputs[0]
    edge = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); nt.links.new(tent(sep.outputs['X']), edge.inputs[0]); nt.links.new(tent(sep.outputs['Y']), edge.inputs[1])
    e2 = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); e2.inputs[1].default_value = 40.0; e2.use_clamp = True; nt.links.new(edge.outputs[0], e2.inputs[0])
    fld = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); nt.links.new(sub.outputs[0], fld.inputs[0]); nt.links.new(e2.outputs[0], fld.inputs[1])
    dens = node(nt, 'ShaderNodeMapRange'); dens.inputs['From Min'].default_value = .05; dens.inputs['From Max'].default_value = .6
    dens.inputs['To Max'].default_value = smoke; nt.links.new(fld.outputs[0], dens.inputs['Value'])
    flame = node(nt, 'ShaderNodeMapRange'); flame.inputs['From Min'].default_value = .12; flame.inputs['From Max'].default_value = .75
    flame.inputs['To Max'].default_value = glow; nt.links.new(fld.outputs[0], flame.inputs['Value'])
    nt.links.new(dens.outputs['Result'], pv.inputs['Density']); nt.links.new(flame.outputs['Result'], pv.inputs['Blackbody Intensity'])
    setin(pv, 'Color', lin(0x1c1612)); setin(pv, 'Temperature', temp); setin(pv, 'Anisotropy', .2)
    me.materials.append(m)
    return ob

# staggered sheets of flame: thin slabs keep the tongues readable instead of averaging into a glowing block
for i, (x, y, w, h) in enumerate(((-7.0, -1.0, 24, 6.5), (-9.5, 2.0, 26, 8.0), (-12.5, 0.0, 30, 9.5))):
    fire_volume('fire_wall_%d' % i, (x, y, h / 2), (1.6, w, h), seed=i * 2.3)
for i, (x, y) in enumerate(((-2.0, 8.8), (-1.0, -9.4), (1.5, 11.0))):
    fire_volume('fire_side_%d' % i, (x, y, 2.6), (4.5, 1.4, 5.2), seed=7 + i * 1.7)
# out of frame behind the lens: their glow rims the crew and paints the hero's visor
fire_volume('fire_cam_left', (22.0, 4.5, 1.8), (2.0, 3.5, 3.6), glow=1.2, seed=13.2, scale=1.9)
fire_volume('fire_cam_right', (21.0, -5.0, 1.6), (2.0, 3.0, 3.2), glow=1.2, seed=15.4, scale=1.9)

FIRE_L = [
 light('fire_key', 'POINT', (-5.0, .5, 4.5), 1.2e4, 0xff6a1a, 3.0),
 light('fire_key_l', 'POINT', (-2.5, 9.0, 2.0), 9e3, 0xff7a24, 2.0),
 light('fire_key_r', 'POINT', (-1.5, -9.5, 2.2), 1e4, 0xff5a12, 2.0),
 light('fire_rim_l', 'POINT', (20.5, 4.2, 1.6), 4e3, 0xff8a30, 1.5),
 light('fire_rim_r', 'POINT', (19.8, -4.5, 1.4), 3.5e3, 0xff6a1a, 1.5),
]
for i, L in enumerate(FIRE_L):
    base = L.data.energy
    keys(L.data, 'energy', [(f, base * flicker(i, f)) for f in range(-2, NF + 3)], 'LINEAR')

# ---------------------------------------------------------------- amber smoke over the whole set
def smoke_domain():
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    me = bpy.data.meshes.new('smoke'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('smoke_domain', me); INTRO.objects.link(ob); ob.location = (4, 0, 4.5); ob.scale = (40, 30, 9)
    m = bpy.data.materials.new('amber_smoke'); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
    out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
    pv = nt.nodes.new('ShaderNodeVolumePrincipled'); nt.links.new(pv.outputs[0], out.inputs['Volume'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs[0])
    mp = nt.nodes.new('ShaderNodeMapping'); nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); mp.inputs['Scale'].default_value = (3.2, 2.6, 4.0)
    keys(mp.inputs['Location'], ('default_value', 1), [(1, 0), (NF, .0012 * NF)], 'LINEAR')   # slow crosswind
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.noise_dimensions = '4D'; nt.links.new(mp.outputs[0], nz.inputs['Vector'])
    setin(nz, 'Detail', 6.0); setin(nz, 'Roughness', .55); setin(nz, 'Distortion', 1.2)
    keys(nz.inputs['W'], 'default_value', [(1, 0), (NF, .0015 * NF)], 'LINEAR')               # swirl
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = .42; cr.color_ramp.elements[1].position = .7
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
    # thicker near the ground (generated z 0..1 over 0..9 m)
    tz = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(box01(nt, tc), tz.inputs[0])
    fall = node(nt, 'ShaderNodeMapRange'); fall.inputs['From Min'].default_value = 0; fall.inputs['From Max'].default_value = .55
    fall.inputs['To Min'].default_value = 1; fall.inputs['To Max'].default_value = .2; nt.links.new(tz.outputs['Z'], fall.inputs['Value'])
    mul = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); nt.links.new(cr.outputs['Color'], mul.inputs[0]); nt.links.new(fall.outputs['Result'], mul.inputs[1])
    dn = node(nt, 'ShaderNodeMapRange'); dn.inputs['To Min'].default_value = .004; dn.inputs['To Max'].default_value = .05
    nt.links.new(mul.outputs[0], dn.inputs['Value']); nt.links.new(dn.outputs['Result'], pv.inputs['Density'])
    setin(pv, 'Color', lin(0xd29a5c)); setin(pv, 'Anisotropy', .55); setin(pv, 'Absorption Color', lin(0x2a1a10))
    me.materials.append(m)
    return ob
smoke_domain()

# ---------------------------------------------------------------- emergency lighting: rotating beacons, strobes, headlight beams
def beacon_dot(name, loc, color):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=.09)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new(name, me); INTRO.objects.link(ob); ob.location = loc
    m = mat(name + '_m', color, emit=color, emit_s=0.0); me.materials.append(m); return ob, m

STROBES = []
for i, (y, col) in enumerate(((.95, 0xff1418), (.35, 0x1846ff), (-.35, 0xff1418), (-.95, 0x1846ff))):
    loc = (5.35, y, 3.62)
    dot, dm = beacon_dot('beacon_%d' % i, loc, col)
    pl = light('beacon_glow_%d' % i, 'POINT', loc, 0.0, col, .08)
    sp = light('beacon_beam_%d' % i, 'SPOT', loc, 0.0, col, .03, spot=math.radians(16), blend=.35)
    STROBES.append((i, col, dm, pl, sp))
for i, (y, col) in enumerate(((1.05, 0xff1418), (-1.05, 0x1846ff))):  # grille strobes
    loc = (6.22, y, 1.05); dot, dm = beacon_dot('grille_strobe_%d' % i, loc, col)
    STROBES.append((4 + i, col, dm, light('grille_glow_%d' % i, 'POINT', loc, 0.0, col, .05), None))

def strobe(i, f):
    # slow-motion double-flash pattern; red and blue banks alternate
    t = (f + (0 if i % 2 == 0 else 18)) % 36
    return 1.0 if t in (0, 1, 2, 3, 7, 8, 9, 10) else (.3 if t in (4, 11) else 0.0)
for i, col, dm, pl, sp in STROBES:
    em = dm.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength']
    vals = [(f, strobe(i, f)) for f in range(-2, NF + 3)]
    keys(em, 'default_value', [(f, 60 * v) for f, v in vals], 'CONSTANT')
    keys(pl.data, 'energy', [(f, (650 if i < 4 else 260) * v) for f, v in vals], 'CONSTANT')
    if sp:  # beams sweep like rotators, slowed down with the rest of the shot
        keys(sp.data, 'energy', [(f, 9000 * (.35 + .65 * v)) for f, v in vals], 'CONSTANT')
        keys(sp, 'rotation_euler', [(f, (math.radians(72), 0, math.radians(90) + math.tau * (f / 96.0 + i / 4))) for f in (-2, NF + 3)], 'LINEAR')

for s in (-1, 1):  # dipped headlights pushing through the smoke behind the crew
    light('headlight_%d' % s, 'SPOT', (6.25, s * 1.05, .78), 500, 0xfff1dc, .06, rot=(0, math.radians(-95), 0), spot=math.radians(48), blend=.5)
light('rim_back', 'SPOT', (1.0, 0.0, 6.5), 1.2e4, 0xff9a40, .5, rot=(0, math.radians(-50), 0), spot=math.radians(40), blend=.6)

# ---------------------------------------------------------------- embers and ash drifting through the beams
def particle_cloud(name, inst, count, loc, size, grav, life, rand_sz, vel_up):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    em = bpy.data.objects.new(name, me); INTRO.objects.link(em); em.location = loc; em.scale = size
    ps = em.modifiers.new(name, 'PARTICLE_SYSTEM').particle_system; st = ps.settings
    st.count = count; st.frame_start = 1; st.frame_end = NF + PRE; st.lifetime = life; st.lifetime_random = .5
    st.emit_from = 'VOLUME'; st.distribution = 'RAND'; st.normal_factor = 0; st.object_align_factor[2] = vel_up
    st.factor_random = .02; st.brownian_factor = .015; st.drag_factor = .6; st.effector_weights.gravity = grav
    st.render_type = 'OBJECT'; st.instance_object = inst; st.particle_size = 1.0; st.size_random = rand_sz
    st.use_rotations = True; st.rotation_mode = 'NONE'; st.rotation_factor_random = 1.0; st.angular_velocity_mode = 'RAND'; st.angular_velocity_factor = .4
    em.show_instancer_for_render = False; em.show_instancer_for_viewport = False  # only the particles render
    ps.point_cache.frame_start = 1; ps.point_cache.frame_end = NF + PRE
    return em

bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=1, radius=.012)
me = bpy.data.meshes.new('ember'); bm.to_mesh(me); bm.free(); ember = bpy.data.objects.new('ember', me); INTRO.objects.link(ember)
me.materials.append(mat('ember_glow', 0xff7a1a, emit=0xff8a2a, emit_s=22.0)); ember.location = (0, 0, -50); ember.hide_render = True
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=.014)
me = bpy.data.meshes.new('ash'); bm.to_mesh(me); bm.free(); ash = bpy.data.objects.new('ash', me); INTRO.objects.link(ash)
me.materials.append(mat('ash_flake', 0x8a8580, rough=.9)); ash.location = (0, 0, -50); ash.hide_render = True
particle_cloud('embers', ember, 1800, (9.0, 0, 1.2), (14, 10, 1.2), -.004, 260, .8, .35)
particle_cloud('embers_near', ember, 700, (15.0, 0, 1.4), (5, 6, 1.4), -.003, 260, .9, .25)
particle_cloud('ash', ash, 2200, (10.0, 0, 4.0), (16, 12, 4.0), .004, 300, .7, 0.0)
log('fx built')

# ---------------------------------------------------------------- camera: low tracking shot -> slow push-in on the hero's visor
cd = bpy.data.cameras.new('cam_intro'); cd.sensor_width = 36; cd.sensor_fit = 'HORIZONTAL'
CAM = bpy.data.objects.new('cam_intro', cd); INTRO.objects.link(CAM); sc.camera = CAM
AIM = empty('cam_aim')
tr = CAM.constraints.new('TRACK_TO'); tr.target = AIM; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
cd.dof.use_dof = True; cd.dof.focus_object = CREW_J[0]['head']; cd.dof.aperture_fstop = 1.8; cd.dof.aperture_blades = 0
cd.dof.aperture_ratio = 2.0  # anamorphic: oval bokeh

def ease(t): t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)
cam_k, aim_k, lens_k = [], [], []
for f in list(range(1, NF + 1, 4)) + [NF]:
    hx = hero_x(f); t = (f - 1) / max(1, NF - 1)
    p = ease((t - .35) / .55)                          # push-in from ~35% to 90%, then a slow creep
    d = 6.6 - 1.4 * ease(t / .4) - 4.0 * p - .15 * ease((t - .9) / .1)  # 6.6 m -> 5.2 m -> 1.05 m in front of the hero
    z = .32 + 1.36 * p ** 1.3                           # ground-hugging low angle rising to eye level
    y = -.9 * (1 - p) - .1 * p + .25 * math.sin(t * 2.1) * (1 - p)
    shake = (.006 * math.sin(f * .37), .005 * math.sin(f * .53 + 1), .004 * math.sin(f * .71 + 2))
    cam_k.append((f, (hx + d + shake[0], y + shake[1], z + shake[2])))
    aim_k.append((f, (hx + .05 * p, -.05 * (1 - p), 1.25 + .43 * p)))
    lens_k.append((f, 30 + 30 * p ** 1.5))
keys(CAM, 'location', cam_k, 'BEZIER'); keys(AIM, 'location', aim_k, 'BEZIER'); keys(cd, 'lens', lens_k, 'BEZIER')

# ---------------------------------------------------------------- render: Cycles, 2.39:1, motion blur, filmic grade + anamorphic streaks
sc.render.resolution_x, sc.render.resolution_y = 3840, 1608
sc.render.resolution_percentage = globals().get('INTRO_PCT', 50)
sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = .5
sc.cycles.samples = globals().get('INTRO_SAMPLES', 160 if sc.cycles.device == 'GPU' else 64)
sc.cycles.use_denoising = True
for k, v in (('max_bounces', 6), ('diffuse_bounces', 2), ('glossy_bounces', 3), ('transmission_bounces', 4), ('volume_bounces', 1),
             ('transparent_max_bounces', 8), ('sample_clamp_indirect', 8.0), ('volume_step_rate', 2.0), ('volume_max_steps', 256)):
    try: setattr(sc.cycles, k, v)
    except Exception: pass
sc.view_settings.exposure = .15
try: sc.view_settings.view_transform = 'AgX'
except Exception: pass
for lk in ('AgX - Punchy', 'Punchy', 'AgX - Medium High Contrast', 'Medium High Contrast'):
    try: sc.view_settings.look = lk; break
    except Exception: continue
try:
    sc.view_settings.use_curve_mapping = True; cm = sc.view_settings.curve_mapping
    cm.curves[3].points[0].location = (0.0, 0.015); cm.curves[3].points[1].location = (1.0, .97); cm.update()  # lifted, crushed-amber blacks
except Exception as ex: log('curves', ex)

def comp():
    if hasattr(sc, 'compositing_node_group'):  # Blender 5.x
        nt = bpy.data.node_groups.new('IntroComp', 'CompositorNodeTree'); sc.compositing_node_group = nt
        rl = nt.nodes.new('CompositorNodeRLayers'); go = nt.nodes.new('NodeGroupOutput')
        nt.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor'); out_in = go.inputs[0]
    else:
        sc.use_nodes = True; nt = sc.node_tree
        for n in list(nt.nodes): nt.nodes.remove(n)
        rl = nt.nodes.new('CompositorNodeRLayers'); out_in = nt.nodes.new('CompositorNodeComposite').inputs['Image']
    def glare(src, kind, **kw):
        g = nt.nodes.new('CompositorNodeGlare')
        if 'Type' in g.inputs:
            g.inputs['Type'].default_value = kind
            for k, v in kw.items():
                if k in g.inputs: g.inputs[k].default_value = v
        else:
            g.glare_type = kind.upper().replace(' ', '_'); g.quality = 'HIGH'
            for k, v in kw.items():
                k2 = {'Threshold': 'threshold', 'Streaks': 'streaks', 'Streaks Angle': 'angle_offset', 'Fade': 'fade', 'Strength': 'mix', 'Size': 'size'}.get(k)
                if k2 and hasattr(g, k2): setattr(g, k2, v if k2 != 'mix' else v - 1)
        nt.links.new(src, g.inputs['Image']); return g.outputs['Image']
    img = glare(rl.outputs['Image'], 'Streaks', Threshold=10.0, Streaks=2, **{'Streaks Angle': 0.0, 'Fade': .965, 'Strength': .35})  # horizontal anamorphic flares
    img = glare(img, 'Bloom', Threshold=1.2, Strength=.5, Size=.8)
    ld = nt.nodes.new('CompositorNodeLensdist')
    if 'Dispersion' in ld.inputs: ld.inputs['Dispersion'].default_value = .012; ld.inputs['Distortion'].default_value = -.01
    nt.links.new(img, ld.inputs['Image']); nt.links.new(ld.outputs['Image'], out_in)
try: comp(); log('compositor ok')
except Exception as ex: log('compositor skipped', ex)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'intro_firefighters.blend'))
log('saved intro blend')

# give embers and ash PRE frames to fill the air: slide every animation PRE frames later and start the shot there
def fcurves(act):
    if getattr(act, 'is_action_layered', False):
        return [fc for ly in act.layers for st in ly.strips for cb in st.channelbags for fc in cb.fcurves]
    return list(act.fcurves)
for act in bpy.data.actions:
    for fc in fcurves(act):
        for kp in fc.keyframe_points:
            for pt in (kp.co, kp.handle_left, kp.handle_right): pt.x += PRE
sc.frame_start, sc.frame_end = 1 + PRE, NF + PRE

# simulate embers/ash once from their pre-roll so every frame (and motion blur) reads a settled cache
try:
    with bpy.context.temp_override(scene=sc): bpy.ops.ptcache.bake_all(bake=True)
    log('particles baked')
except Exception as ex: log('particle bake skipped', ex)

STILLS = globals().get('INTRO_STILLS')
if STILLS:
    sc.render.image_settings.file_format = 'JPEG'
    for f in STILLS:
        sc.frame_set(f + PRE); sc.render.filepath = os.path.join(OUT, 'intro_f%03d.jpg' % f); t0 = time.time()
        bpy.ops.render.render(write_still=True); log('intro still', f, '%.1fs' % (time.time() - t0))
elif globals().get('RENDER_INTRO', True):
    ims = sc.render.image_settings
    try:
        if hasattr(ims, 'media_type'): ims.media_type = 'VIDEO'
        ims.file_format = 'FFMPEG'; ff = sc.render.ffmpeg
        ff.format = 'MPEG4'; ff.codec = 'H264'; ff.constant_rate_factor = 'HIGH'; ff.ffmpeg_preset = 'GOOD'
        sc.render.filepath = os.path.join(OUT, 'intro_firefighters.mp4')
    except Exception as ex:
        log('ffmpeg unavailable, writing PNG frames', ex)
        ims.file_format = 'PNG'; sc.render.filepath = os.path.join(OUT, 'intro_frames', 'f_')
    t0 = time.time(); bpy.ops.render.render(animation=True); log('intro rendered', '%.0fs' % (time.time() - t0), sc.render.filepath)
log('INTRO DONE')
LOG.close()
