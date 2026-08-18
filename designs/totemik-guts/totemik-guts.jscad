const { circle, rectangle } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions

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
const BEAM_WIDTH = 27
const BEAM_DEPTH = 5
const BEAM_HEIGHT = 200

const OUTER_RADIUS = OUTER_DIAMETER / 2
const INNER_RADIUS = OUTER_RADIUS - WALL_THICKNESS
const WALL_MID_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2

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

const beam2D = () => {
  // Perpendicular distance from the ring center to the beam's outer
  // (BEAM_WIDTH-long) edge, chosen so that edge's 2 endpoints land on
  // WALL_MID_RADIUS -> those 2 corners sit inside the ring wall.
  const halfWidth = BEAM_WIDTH / 2
  const contactOffset = Math.sqrt(WALL_MID_RADIUS ** 2 - halfWidth ** 2)
  const centerY = contactOffset - BEAM_DEPTH / 2
  return rectangle({ size: [BEAM_WIDTH, BEAM_DEPTH], center: [0, centerY] })
}

const main = () => {
  // Both extrusions start at z = 0, so the ring and beam share the same
  // base plane at the bottom. They genuinely overlap in the ring wall,
  // so union them into one printable solid.
  const ring = extrudeLinear({ height: RING_HEIGHT }, ring2D())
  const beam = extrudeLinear({ height: BEAM_HEIGHT }, beam2D())
  return union(ring, beam)
}

module.exports = { main, ring2D, beam2D }
