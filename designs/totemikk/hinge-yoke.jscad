const { cuboid } = require('@jscad/modeling').primitives
const { union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms
const { profile2D, OUTER_DIAMETER, OUTER_RADIUS, THICKNESS } = require('./hinge-bracket.jscad')

// Hinge yoke: 2 hinge-bracket.jscad rings, side by side along Z with a
// GAP between them wide enough for something to pivot in (and for an
// 8mm axle to pass straight through both rings' center holes), joined
// into one rigid piece by a connecting plate along their flat (squared)
// back edge.
//
// The plate sits flush against that flat edge and extends straight
// backward from it (further in -X, away from the rings) by its own
// PLATE_THICKNESS -- it does not cut into or overlap the rings'
// existing footprint at all, just adds onto their back face. It spans
// the full height of the rings and the full Z run from the front of
// the first ring to the back of the second, so it also closes off the
// back of the gap between them, not just touching each ring at a point.

const GAP = 5.1 // clear space between the 2 rings, along Z
const PLATE_THICKNESS = 5 // how far the connecting plate sticks out
// backward (in -X) from the rings' flat back edge

const main = () => {
  const ring = extrudeLinear({ height: THICKNESS }, profile2D())
  const ringA = ring // z: 0 to THICKNESS
  const ringB = translate([0, 0, THICKNESS + GAP], ring) // z: THICKNESS+GAP to 2*THICKNESS+GAP

  const totalDepth = 2 * THICKNESS + GAP
  const plate = translate(
    [-OUTER_RADIUS - PLATE_THICKNESS / 2, 0, totalDepth / 2],
    cuboid({ size: [PLATE_THICKNESS, OUTER_DIAMETER, totalDepth] })
  )

  return union(ringA, ringB, plate)
}

module.exports = { main }
