const { circle, rectangle } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions

const OUTER_DIAMETER = 49
const WALL_THICKNESS = 2
const NOTCH_WIDTH = 3
const RING_HEIGHT = 5
const CIRCLE_SEGMENTS = 128
const NOTCH_MARGIN = 1

// Beam ("balk") standing in the +Z direction, touching the ring's inner
// wall at exactly 2 points (the 2 corners of its BEAM_WIDTH edge).
const BEAM_WIDTH = 27
const BEAM_DEPTH = 5
const BEAM_HEIGHT = 200

const OUTER_RADIUS = OUTER_DIAMETER / 2
const INNER_RADIUS = OUTER_RADIUS - WALL_THICKNESS

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
  // (BEAM_WIDTH-long) edge, chosen so that edge's 2 endpoints land
  // exactly on INNER_RADIUS -> the beam only touches the ring there.
  const halfWidth = BEAM_WIDTH / 2
  const touchOffset = Math.sqrt(INNER_RADIUS ** 2 - halfWidth ** 2)
  const centerY = touchOffset - BEAM_DEPTH / 2
  return rectangle({ size: [BEAM_WIDTH, BEAM_DEPTH], center: [0, centerY] })
}

const main = () => {
  // Both extrusions start at z = 0, so the ring and beam share the same
  // base plane at the bottom.
  const ring = extrudeLinear({ height: RING_HEIGHT }, ring2D())
  const beam = extrudeLinear({ height: BEAM_HEIGHT }, beam2D())
  return [ring, beam]
}

module.exports = { main, ring2D, beam2D }
