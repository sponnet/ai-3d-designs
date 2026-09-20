const { circle, rectangle } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions

// Hinge bracket: a ring (36mm outer diameter, 8mm center hole) with 3
// of its outer corners squared off -- bottom-left, top-left and
// bottom-right are all flattened into a square corner instead of
// staying round; only the top-right corner stays a plain round curve.
// The center hole stays a full round circle throughout.
//
// Built as a 2D profile in the XY plane, centered on the hole: the
// bottom half (full width, squares both bottom corners) plus the
// top-left quarter (a square block, squares that corner) plus the
// top-right quarter (a round pie slice, the one corner left round) --
// unioned together, then the round center hole subtracted -- linear-
// extruded by THICKNESS.

const OUTER_DIAMETER = 36
const OUTER_RADIUS = OUTER_DIAMETER / 2
const HOLE_DIAMETER = 8

const THICKNESS = 5 // flat extrusion thickness, matching wall-hook.jscad

const SEGMENTS = 64 // full-circle resolution

const profile2D = () => {
  const bottomHalf = rectangle({ size: [OUTER_DIAMETER, OUTER_RADIUS], center: [0, -OUTER_RADIUS / 2] })
  const topLeftQuarter = rectangle({ size: [OUTER_RADIUS, OUTER_RADIUS], center: [-OUTER_RADIUS / 2, OUTER_RADIUS / 2] })
  const topRightQuarterRound = circle({ radius: OUTER_RADIUS, segments: SEGMENTS, startAngle: 0, endAngle: Math.PI / 2 })

  const hole = circle({ radius: HOLE_DIAMETER / 2, segments: SEGMENTS })
  // Cut the hole from each piece before the final union -- subtracting
  // it from the already-unioned outline instead can silently produce
  // no hole at all (see OPENJSCAD_SKILL.md).
  return union(subtract(bottomHalf, hole), subtract(topLeftQuarter, hole), subtract(topRightQuarterRound, hole))
}

const main = () => extrudeLinear({ height: THICKNESS }, profile2D())

module.exports = { main }
