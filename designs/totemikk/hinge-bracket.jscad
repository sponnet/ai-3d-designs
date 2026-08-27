const { circle, rectangle } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions

// Hinge bracket, restarted from scratch: a ring (36mm outer diameter,
// 8mm center hole) with its left side squared off -- both the
// bottom-left and top-left corners of the ring's outer edge are
// flattened into a square corner instead of staying round, while the
// right side of the ring stays a plain round curve. The center hole
// stays a full round circle throughout.
//
// Built as a 2D profile in the XY plane, centered on the hole: a right
// half-disc (the round side) unioned with a square block covering the
// left half (giving it 2 square corners there), then the round center
// hole subtracted -- linear-extruded by THICKNESS.

const OUTER_DIAMETER = 36
const OUTER_RADIUS = OUTER_DIAMETER / 2
const HOLE_DIAMETER = 8

const THICKNESS = 5 // flat extrusion thickness, matching wall-hook.jscad

const SEGMENTS = 64 // full-circle resolution

const profile2D = () => {
  // Angles must be given positive; going from 270deg to 90deg wraps
  // through 0deg, i.e. sweeps the right half (a plain circle() can't
  // express a negative startAngle).
  const rightHalf = circle({ radius: OUTER_RADIUS, segments: SEGMENTS, startAngle: (3 * Math.PI) / 2, endAngle: Math.PI / 2 })
  const leftSquare = rectangle({ size: [OUTER_RADIUS, OUTER_DIAMETER], center: [-OUTER_RADIUS / 2, 0] })

  const hole = circle({ radius: HOLE_DIAMETER / 2, segments: SEGMENTS })
  // Cut the hole from each piece before the final union, matching the
  // subtract-after-union pitfall found on the previous version of this
  // part (see OPENJSCAD_SKILL.md) -- subtracting from the already-
  // unioned outerShape silently produced no hole at all last time.
  return union(subtract(rightHalf, hole), subtract(leftSquare, hole))
}

const main = () => extrudeLinear({ height: THICKNESS }, profile2D())

module.exports = { main }
