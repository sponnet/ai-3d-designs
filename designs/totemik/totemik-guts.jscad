const { circle, rectangle, cylinder, cuboid } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotateX } = require('@jscad/modeling').transforms

const OUTER_DIAMETER = 49
const WALL_THICKNESS = 3 // 50% thicker than the original 2mm
const NOTCH_WIDTH = 3
const RING_HEIGHT = 5
const CIRCLE_SEGMENTS = 128
const NOTCH_MARGIN = 1

// Beam ("balk") standing in the +Z direction. Its BEAM_WIDTH edge's 2
// corners are pushed into the middle of the ring's wall thickness (not
// just tangent to the inner radius), so there is real solid overlap
// between beam and ring for a printable, connected contact.
//
// The beam is 2 stacked blocks: the bottom half (ring-side) keeps the
// full depth for that overlap, the top half (away from the ring) is
// trimmed to half depth and gets 2 through-holes perpendicular to the
// ring's Z axis, stacked one above the other.
//
// BEAM_NOTCH_SIDE picks which side of the top half gets trimmed away:
// 'inner' (default) removes material toward the ring center, 'outer'
// removes it toward the ring wall instead. Printing one piece of each
// gives 2 halves whose thinned top sections face opposite ways, so they
// nest together into a full-depth lap joint when assembled.
const BEAM_WIDTH = 27
const BEAM_DEPTH = 2.5
const BEAM_DEPTH_TOP = BEAM_DEPTH / 2
const BEAM_HEIGHT = 100

const NOTCH_SIDE_VALUES = ['inner', 'outer']
const NOTCH_SIDE_CAPTIONS = ['Inner (toward ring center)', 'Outer (toward ring wall)']
const BEAM_NOTCH_SIDE_DEFAULT = NOTCH_SIDE_VALUES[0]

const HOLE_DIAMETER = 3
const HOLE_OFFSET_Z = 7
const HOLE_SEGMENTS = 48
const HOLE_OVERSHOOT = 2

const OUTER_RADIUS = OUTER_DIAMETER / 2
const INNER_RADIUS = OUTER_RADIUS - WALL_THICKNESS
const WALL_MID_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2

// Perpendicular distance from the ring center to the beam's outer
// (BEAM_WIDTH-long) edge, chosen so that edge's 2 endpoints land on
// WALL_MID_RADIUS -> those 2 corners sit inside the ring wall.
const BEAM_CONTACT_OFFSET = Math.sqrt(WALL_MID_RADIUS ** 2 - (BEAM_WIDTH / 2) ** 2)

// Stiffening rib for the thin (BEAM_DEPTH_TOP) top half, which is
// otherwise only supported at its 2 far corners. Centered on the beam's
// width, standing on the outer (wall-facing) side, from the base (z=0)
// up to RIB_TOP_MARGIN before the first hole. Its depth reaches from the
// beam's own outer face out to the ring's inner radius -- assumes the
// default beamNotchSide = 'inner', where that outer face is the same Y
// the whole way up (with 'outer', the top half's outer face moves and
// this rib would no longer meet it there).
const RIB_WIDTH = 3 // assumed -- not specified
const RIB_TOP_MARGIN = 5
const TOP_CENTER_Z = (BEAM_HEIGHT / 2 + BEAM_HEIGHT) / 2
const FIRST_HOLE_Z = TOP_CENTER_Z - HOLE_OFFSET_Z
const RIB_HEIGHT = FIRST_HOLE_Z - RIB_TOP_MARGIN

const getParameterDefinitions = () => [
  {
    name: 'beamNotchSide',
    type: 'choice',
    caption: 'Beam top-half notch side',
    values: NOTCH_SIDE_VALUES,
    captions: NOTCH_SIDE_CAPTIONS,
    initial: BEAM_NOTCH_SIDE_DEFAULT
  }
]

// Choice widgets may hand back the string value or its numeric index
// depending on host (CLI vs openjscad.xyz) -> normalize here.
const resolveNotchSide = (raw) => {
  if (typeof raw === 'number') return NOTCH_SIDE_VALUES[raw] ?? BEAM_NOTCH_SIDE_DEFAULT
  return NOTCH_SIDE_VALUES.includes(raw) ? raw : BEAM_NOTCH_SIDE_DEFAULT
}

const ring2D = () => {
  const outer = circle({ radius: OUTER_RADIUS, segments: CIRCLE_SEGMENTS })
  const inner = circle({ radius: INNER_RADIUS, segments: CIRCLE_SEGMENTS })
  const annulus = subtract(outer, inner)

  const notchWidth = WALL_THICKNESS + 2 * NOTCH_MARGIN
  const notchCenterX = (OUTER_RADIUS + INNER_RADIUS) / 2
  const notch = rectangle({
    size: [notchWidth, NOTCH_WIDTH],
    center: [notchCenterX, 0]
  })

  return subtract(annulus, notch)
}

const beamBottom2D = () => {
  const centerY = BEAM_CONTACT_OFFSET - BEAM_DEPTH / 2
  return rectangle({ size: [BEAM_WIDTH, BEAM_DEPTH], center: [0, centerY] })
}

// Y-center of the trimmed top half, for the given notch side: 'inner'
// keeps the outer (wall-facing) edge fixed and trims from the center
// side; 'outer' keeps the inner edge fixed and trims from the wall side.
const beamTopCenterY = (notchSide) => {
  if (notchSide === 'outer') {
    const innerEdge = BEAM_CONTACT_OFFSET - BEAM_DEPTH
    return innerEdge + BEAM_DEPTH_TOP / 2
  }
  return BEAM_CONTACT_OFFSET - BEAM_DEPTH_TOP / 2
}

const beamTop2D = (notchSide = BEAM_NOTCH_SIDE_DEFAULT) => {
  const centerY = beamTopCenterY(notchSide)
  return rectangle({ size: [BEAM_WIDTH, BEAM_DEPTH_TOP], center: [0, centerY] })
}

const rib3D = () => {
  const ribDepth = INNER_RADIUS - BEAM_CONTACT_OFFSET
  return translate(
    [0, BEAM_CONTACT_OFFSET + ribDepth / 2, RIB_HEIGHT / 2],
    cuboid({ size: [RIB_WIDTH, ribDepth, RIB_HEIGHT] })
  )
}

const beamTopHole = (z, notchSide) => {
  const centerY = beamTopCenterY(notchSide)
  const bore = cylinder({
    radius: HOLE_DIAMETER / 2,
    height: BEAM_DEPTH_TOP + HOLE_OVERSHOOT,
    segments: HOLE_SEGMENTS
  })
  return translate([0, centerY, z], rotateX(Math.PI / 2, bore))
}

const main = (params = {}) => {
  const notchSide = resolveNotchSide(params.beamNotchSide)

  // All 3 pieces share z = 0 as their base plane. The beam is split at
  // half its height: full-depth bottom half against the ring, half-depth
  // top half further out.
  const ring = extrudeLinear({ height: RING_HEIGHT }, ring2D())
  const beamBottom = extrudeLinear({ height: BEAM_HEIGHT / 2 }, beamBottom2D())
  const beamTop = translate(
    [0, 0, BEAM_HEIGHT / 2],
    extrudeLinear({ height: BEAM_HEIGHT / 2 }, beamTop2D(notchSide))
  )

  const solid = union(ring, beamBottom, beamTop, rib3D())
  return subtract(
    solid,
    beamTopHole(TOP_CENTER_Z - HOLE_OFFSET_Z, notchSide),
    beamTopHole(TOP_CENTER_Z + HOLE_OFFSET_Z, notchSide)
  )
}

module.exports = { main, getParameterDefinitions, ring2D, beamBottom2D, beamTop2D, rib3D }
