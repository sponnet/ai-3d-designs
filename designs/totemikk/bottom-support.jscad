const { cylinder, cuboid } = require('@jscad/modeling').primitives
const { subtract, union, intersect } = require('@jscad/modeling').booleans
const { rotateZ, rotateY, translate } = require('@jscad/modeling').transforms

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
// tall but wide radially (THROUGH_HOLE_RADIUS to OUTER_RADIUS), so
// "deep" is read as a RADIAL depth, extending NOTCH_DEPTH out from the
// inner edge into the ring, cut through the cap's full WALL_THICKNESS.
// NOTCH_WIDTH is the tangential (circumferential) width, measured at
// the inner edge.
//
// CUT_RIGHT_HALF splits the finished piece down the middle (through the
// X=0 plane) so it can be printed as 2 separate half-arcs: true removes
// the right half (x>0, keeping x<=0); false removes the left half
// (x<0, keeping x>=0).
//
// A RADIAL_HOLE_DIAMETER hole goes straight through the wall at a fixed
// spot on the -X axis (the angular middle of the left half, x=-34,y=0) --
// it only ends up in the final piece when that region is actually kept
// (CUT_RIGHT_HALF=true), so it naturally lands in just one of the 2
// halves without any extra conditional.
//
// A glue lip runs along each of the wall's 2 seam crossings (where the
// X=0 cutting plane meets the wall band, y=+-OUTER_RADIUS). It stays
// parallel to (flush with) the X=0 cutting plane and fully recessed
// within its own half -- LIP_THICKNESS deep in X, entirely on the kept
// side (x in [-LIP_THICKNESS,0] for the left half, [0,LIP_THICKNESS] for
// the right) rather than protruding across the seam. It points toward
// the cylinder's center: anchored at the wall's outer edge and reaching
// LIP_REACH radially inward, from the bottom up to LIP_TOP_MARGIN short
// of the top. Both halves get the identical rib (just mirrored in X), so
// when the 2 flat seam faces are pressed together, the 2 ribs meet and
// add glue contact area beyond the bare 2mm wall edge -- no tab/slot
// interlock, since neither one crosses x=0.

const OUTER_DIAMETER = 70
const HEIGHT = 50
const WALL_THICKNESS = 2
const THROUGH_HOLE_DIAMETER = 51

const CUTOUT_DIAMETER = OUTER_DIAMETER - 2 * WALL_THICKNESS
const CUTOUT_HEIGHT = HEIGHT - 2 * WALL_THICKNESS

const NOTCH_COUNT = 7
const NOTCH_WIDTH = 12 // tangential, at the inner edge
const NOTCH_DEPTH = 3 // radial, from the inner edge outward (leaves 1mm
// of the 6mm-wide top ring remaining at the notch)
const NOTCH_OVERSHOOT = 2

const RADIAL_HOLE_DIAMETER = 3
const RADIAL_HOLE_SEGMENTS = 32

const LIP_REACH = 6 // how far the lip extends radially inward from the
// wall's outer edge, toward the cylinder's center
const LIP_THICKNESS = 2 // the lip's depth in X, recessed into its own
// half from the seam (not crossing it)
const LIP_TOP_MARGIN = 10 // the lip stops this far short of the top

const CUT_RIGHT_HALF = true

const SEGMENTS = 128
const HALF_CUTTER_MARGIN = 5 // clears the whole piece with room to spare
const OVERSHOOT = 2

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

// A block spanning the full piece in Y/Z, but only x<=0 or x>=0 in X --
// intersecting with this keeps just that half.
const halfCutter = (keepLeft) => {
  const span = OUTER_DIAMETER + 2 * HALF_CUTTER_MARGIN
  const centerX = keepLeft ? -span / 2 : span / 2
  return cuboid({ size: [span, span, span], center: [centerX, 0, 0] })
}

// Radial hole through the wall at the angular middle of the left half
// (x=-34,y=0, i.e. pointing along -X) -- a Z-axis cylinder rotated to
// point along X.
const radialHole3D = () => {
  const radius = OUTER_DIAMETER / 2 - WALL_THICKNESS / 2
  const bore = cylinder({ radius: RADIAL_HOLE_DIAMETER / 2, height: WALL_THICKNESS + OVERSHOOT, segments: RADIAL_HOLE_SEGMENTS })
  return rotateY(Math.PI / 2, translate([0, 0, -radius], bore))
}

// One glue lip at 1 of the wall's 2 seam crossings (y = +-OUTER_RADIUS),
// reaching from the wall's outer edge LIP_REACH inward (toward y=0), and
// LIP_THICKNESS deep in X on the kept side of the seam (never crossing
// x=0).
const lip3D = (ySign, keepLeft) => {
  const outerRadius = OUTER_DIAMETER / 2
  const yStart = ySign * (outerRadius - LIP_REACH)
  const yEnd = ySign * outerRadius
  const zBottom = -HEIGHT / 2
  const zTop = HEIGHT / 2 - LIP_TOP_MARGIN
  const xEnd = keepLeft ? -LIP_THICKNESS : LIP_THICKNESS
  return cuboid({
    size: [Math.abs(xEnd), Math.abs(yEnd - yStart), zTop - zBottom],
    center: [xEnd / 2, (yStart + yEnd) / 2, (zBottom + zTop) / 2]
  })
}

const lips3D = (keepLeft) => union(lip3D(1, keepLeft), lip3D(-1, keepLeft))

const main = () => {
  const outer = cylinder({ radius: OUTER_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  const cutout = cylinder({ radius: CUTOUT_DIAMETER / 2, height: CUTOUT_HEIGHT, segments: SEGMENTS })
  const throughHole = cylinder({ radius: THROUGH_HOLE_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  const full = subtract(outer, cutout, throughHole, notches3D())
  const withHole = subtract(full, radialHole3D())
  const half = intersect(withHole, halfCutter(CUT_RIGHT_HALF))
  // The lip stays fully within the kept half (never crosses x=0), so
  // adding it before or after the half-cut makes no difference here --
  // added after for clarity, matching the hole/half sequence above.
  return union(half, lips3D(CUT_RIGHT_HALF))
}

module.exports = { main }
