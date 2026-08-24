const { cylinder, cuboid } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { rotateZ } = require('@jscad/modeling').transforms

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
//
// Plus NOTCH_COUNT square notches cut into the top cap, at its inner
// (through-hole) edge: the top cap ring is only WALL_THICKNESS (2mm)
// tall but 6mm wide radially (THROUGH_HOLE_RADIUS to OUTER_RADIUS), so
// "5mm deep" can't be a vertical depth (there's only 2mm of material to
// cut through) -- it's read here as a RADIAL depth instead, extending
// NOTCH_DEPTH out from the inner edge into the ring, cut through the
// cap's full WALL_THICKNESS. NOTCH_WIDTH (12mm) is the tangential
// (circumferential) width, measured at the inner edge.

const OUTER_DIAMETER = 63
const HEIGHT = 57
const WALL_THICKNESS = 2
const THROUGH_HOLE_DIAMETER = 51

const CUTOUT_DIAMETER = OUTER_DIAMETER - 2 * WALL_THICKNESS // 59
const CUTOUT_HEIGHT = HEIGHT - 2 * WALL_THICKNESS // 53

const NOTCH_COUNT = 7
const NOTCH_WIDTH = 12 // tangential, at the inner edge
const NOTCH_DEPTH = 5 // radial, from the inner edge outward (leaves 1mm
// of the 6mm-wide top ring remaining at the notch)
const NOTCH_OVERSHOOT = 2

const SEGMENTS = 128

const notch3D = (angleDeg) => {
  const innerRadius = THROUGH_HOLE_DIAMETER / 2
  const radialStart = innerRadius - NOTCH_OVERSHOOT
  const radialEnd = innerRadius + NOTCH_DEPTH
  const zBottom = HEIGHT / 2 - WALL_THICKNESS - NOTCH_OVERSHOOT
  const zTop = HEIGHT / 2 + NOTCH_OVERSHOOT
  const notch = cuboid({
    size: [radialEnd - radialStart, NOTCH_WIDTH, zTop - zBottom],
    center: [(radialStart + radialEnd) / 2, 0, (zBottom + zTop) / 2]
  })
  return rotateZ((angleDeg * Math.PI) / 180, notch)
}

const notches3D = () => {
  const notches = []
  for (let i = 0; i < NOTCH_COUNT; i++) notches.push(notch3D((360 / NOTCH_COUNT) * i))
  return union(...notches)
}

const main = () => {
  const outer = cylinder({ radius: OUTER_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  const cutout = cylinder({ radius: CUTOUT_DIAMETER / 2, height: CUTOUT_HEIGHT, segments: SEGMENTS })
  const throughHole = cylinder({ radius: THROUGH_HOLE_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  return subtract(outer, cutout, throughHole, notches3D())
}

module.exports = { main }
