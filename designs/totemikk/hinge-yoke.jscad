const { circle, rectangle, cuboid } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms

// Hinge yoke: 2 identical rings (36mm outer diameter, 8mm center hole,
// left side squared off -- both the bottom-left and top-left corners
// of the outer edge flattened, right side left as a plain round curve)
// side by side along Z with a GAP between them wide enough for
// something to pivot in (and for an 8mm axle to pass straight through
// both center holes), joined into one rigid piece by a connecting
// plate along their flat (squared) back edge.
//
// The plate sits flush against that flat edge and extends straight
// backward from it (further in -X, away from the rings) by its own
// PLATE_THICKNESS -- it does not cut into or overlap the rings'
// existing footprint at all, just adds onto their back face. It spans
// the full height of the rings and the full Z run from the front of
// the first ring to the back of the second, so it also closes off the
// back of the gap between them, not just touching each ring at a point.

const OUTER_DIAMETER = 36
const OUTER_RADIUS = OUTER_DIAMETER / 2
const HOLE_DIAMETER = 8
const RING_THICKNESS = 5

const GAP = 5.1 // clear space between the 2 rings, along Z
const PLATE_THICKNESS = 5 // how far the connecting plate sticks out
// backward (in -X) from the rings' flat back edge

const SEGMENTS = 64 // full-circle resolution

const ringProfile2D = () => {
  // Angles must be given positive; going from 270deg to 90deg wraps
  // through 0deg, i.e. sweeps the right half (a plain circle() can't
  // express a negative startAngle).
  const rightHalf = circle({ radius: OUTER_RADIUS, segments: SEGMENTS, startAngle: (3 * Math.PI) / 2, endAngle: Math.PI / 2 })
  const leftSquare = rectangle({ size: [OUTER_RADIUS, OUTER_DIAMETER], center: [-OUTER_RADIUS / 2, 0] })

  const hole = circle({ radius: HOLE_DIAMETER / 2, segments: SEGMENTS })
  // Cut the hole from each piece before the final union -- subtracting
  // it from the already-unioned outline instead can silently produce
  // no hole at all (see OPENJSCAD_SKILL.md).
  return union(subtract(rightHalf, hole), subtract(leftSquare, hole))
}

const main = () => {
  const ring = extrudeLinear({ height: RING_THICKNESS }, ringProfile2D())
  const ringA = ring // z: 0 to RING_THICKNESS
  const ringB = translate([0, 0, RING_THICKNESS + GAP], ring) // z: RING_THICKNESS+GAP to 2*RING_THICKNESS+GAP

  const totalDepth = 2 * RING_THICKNESS + GAP
  const plate = translate(
    [-OUTER_RADIUS - PLATE_THICKNESS / 2, 0, totalDepth / 2],
    cuboid({ size: [PLATE_THICKNESS, OUTER_DIAMETER, totalDepth] })
  )

  return union(ringA, ringB, plate)
}

module.exports = { main }
