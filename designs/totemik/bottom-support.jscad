const { cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans

// Outer cylinder with 2 cutouts:
// - a centered recess (CUTOUT_DIAMETER x CUTOUT_HEIGHT) stopping
//   WALL_THICKNESS short of the top, bottom and sides, giving a uniform
//   WALL_THICKNESS wall on every side -- so most of the height is a thin-
//   walled canister rather than an open-ended pipe;
// - a THROUGH_HOLE_DIAMETER through-hole running the FULL height,
//   punching through the top/bottom caps that recess leaves solid --
//   since THROUGH_HOLE_DIAMETER < CUTOUT_DIAMETER, this only actually
//   removes material at the 2 end caps (its middle span is already
//   inside the wider recess), leaving a thicker ring at each end and a
//   thin-walled tube in between, all the way through.

const OUTER_DIAMETER = 63
const HEIGHT = 57
const WALL_THICKNESS = 2
const THROUGH_HOLE_DIAMETER = 51

const CUTOUT_DIAMETER = OUTER_DIAMETER - 2 * WALL_THICKNESS // 59
const CUTOUT_HEIGHT = HEIGHT - 2 * WALL_THICKNESS // 53

const SEGMENTS = 128

const main = () => {
  const outer = cylinder({ radius: OUTER_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  const cutout = cylinder({ radius: CUTOUT_DIAMETER / 2, height: CUTOUT_HEIGHT, segments: SEGMENTS })
  const throughHole = cylinder({ radius: THROUGH_HOLE_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  return subtract(outer, cutout, throughHole)
}

module.exports = { main }
