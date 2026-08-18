const { circle, rectangle, cylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotateX } = require('@jscad/modeling').transforms

const OUTER_DIAMETER = 49
const WALL_THICKNESS = 2
const NOTCH_WIDTH = 3
const RING_HEIGHT = 5
const CIRCLE_SEGMENTS = 128
const NOTCH_MARGIN = 1

// Beam ("balk") standing in the +Z direction. Its BEAM_WIDTH edge's 2
// corners are pushed into the middle of the ring's wall thickness (not
// just tangent to the inner radius), so there is real solid overlap
// between beam and ring for a printable, connected contact.
//
// The beam is 2 stacked blocks sharing the same outer (wall-facing) Y
// edge: the bottom half (ring-side) keeps the full depth for that
// overlap, the top half (away from the ring) is trimmed to half depth,
// and gets 2 through-holes perpendicular to the ring's Z axis, stacked
// one above the other.
const BEAM_WIDTH = 27
const BEAM_DEPTH = 5
const BEAM_DEPTH_TOP = BEAM_DEPTH / 2
const BEAM_HEIGHT = 100

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

const beamTop2D = () => {
  const centerY = BEAM_CONTACT_OFFSET - BEAM_DEPTH_TOP / 2
  return rectangle({ size: [BEAM_WIDTH, BEAM_DEPTH_TOP], center: [0, centerY] })
}

const beamTopHole = (z) => {
  const centerY = BEAM_CONTACT_OFFSET - BEAM_DEPTH_TOP / 2
  const bore = cylinder({
    radius: HOLE_DIAMETER / 2,
    height: BEAM_DEPTH_TOP + HOLE_OVERSHOOT,
    segments: HOLE_SEGMENTS
  })
  return translate([0, centerY, z], rotateX(Math.PI / 2, bore))
}

const main = () => {
  // All 3 pieces share z = 0 as their base plane. The beam is split at
  // half its height: full-depth bottom half against the ring, half-depth
  // top half further out.
  const ring = extrudeLinear({ height: RING_HEIGHT }, ring2D())
  const beamBottom = extrudeLinear({ height: BEAM_HEIGHT / 2 }, beamBottom2D())
  const beamTop = translate(
    [0, 0, BEAM_HEIGHT / 2],
    extrudeLinear({ height: BEAM_HEIGHT / 2 }, beamTop2D())
  )

  const topCenterZ = (BEAM_HEIGHT / 2 + BEAM_HEIGHT) / 2
  const solid = union(ring, beamBottom, beamTop)
  return subtract(
    solid,
    beamTopHole(topCenterZ - HOLE_OFFSET_Z),
    beamTopHole(topCenterZ + HOLE_OFFSET_Z)
  )
}

module.exports = { main, ring2D, beamBottom2D, beamTop2D }
