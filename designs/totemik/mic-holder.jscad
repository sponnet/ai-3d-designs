const { cuboid, cylinder, roundedRectangle } = require('@jscad/modeling').primitives
const { subtract, union, intersect } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { hull } = require('@jscad/modeling').hulls
const { translate } = require('@jscad/modeling').transforms

// Hollow tray for a microphone, open on the bottom, with 2 cutouts
// through the top: a round hole for the microphone capsule near one end,
// and a rectangular slot near the other end.
//
// The 35 x 15mm footprint and 17mm depth given are the INTERIOR
// (cavity) dimensions, not the outer size -- the outer box is those plus
// WALL_THICKNESS on every side (both sides of length/width, and the top;
// the bottom stays open so it gets none added there).
//
// Both hole positions are likewise measured within that same interior
// space, not against the outer box: the round hole sits
// ROUND_HOLE_DIST from the interior edge opposite the rectangular hole;
// the rectangular hole is flush with the interior's far edge (touching
// the wall's inner face) without crossing into the wall itself, so it
// stays fully within the top surface's open span.
//
// Coordinates: X = along the 35mm interior length, Y = across the 15mm
// interior width, Z = up (Z=0 is the open bottom, Z=EXT_HEIGHT is the
// top wall's outer face).

const WALL_THICKNESS = 2 // per spec -- all 4 side walls and the top wall

const INT_LENGTH = 35 // X, interior
const INT_WIDTH = 15 // Y, interior
const INT_HEIGHT = 17 // Z, interior ("diepte")

const EXT_LENGTH = INT_LENGTH + 2 * WALL_THICKNESS // 39
const EXT_WIDTH = INT_WIDTH + 2 * WALL_THICKNESS // 19
const EXT_HEIGHT = INT_HEIGHT + WALL_THICKNESS // 19 -- only the top adds
// thickness; the bottom stays open

const ROUND_HOLE_DIAMETER = 4 // per user spec
const ROUND_HOLE_SEGMENTS = 32
const ROUND_HOLE_DIST = 7.5 // per spec, measured from the interior edge
// opposite the rectangular hole
const ROUND_HOLE_X = WALL_THICKNESS + ROUND_HOLE_DIST // = 9.5
const ROUND_HOLE_Y = WALL_THICKNESS + INT_WIDTH / 2 // = 9.5, centered

const RECT_HOLE_X_SIZE = 12 // assumed -- the 2 dimensions (9 vs 12mm)
// aren't assigned to axes in the spec, so the hole is oriented as a slot
// reaching in from the interior edge it's flush with
const RECT_HOLE_Y_SIZE = 9 // centered on the interior width
const RECT_HOLE_X = EXT_LENGTH - WALL_THICKNESS - RECT_HOLE_X_SIZE / 2 // flush
// with the interior's far edge (the wall's inner face), extending inward
// -- never crossing into the wall itself
const RECT_HOLE_Y = WALL_THICKNESS + INT_WIDTH / 2 // = 9.5, centered

const HOLE_OVERSHOOT = 2
const CORNER_SEGMENTS = 32

// Vertical (corner) edges are rounded the full height, kept below
// WALL_THICKNESS so the wall never thins out at the corners. The top
// horizontal edge (where the flat top meets the sides) gets its own
// bevel, inset over the last TOP_BEVEL_HEIGHT of height, so no edge on
// the box is left sharp.
const CORNER_ROUND_RADIUS = 1.5 // assumed -- < WALL_THICKNESS (2mm)
const TOP_BEVEL_HEIGHT = 1.5 // assumed
const TOP_BEVEL_INSET = 1.5 // assumed

// Mounting ears: half-round lip at each end, flat edge flush with the
// full exterior width, curved edge sticking outward, flush with the
// bottom, with a 3mm screw hole -- same pattern as keypad.jscad's
// endTab3D.
const TAB_RADIUS = EXT_WIDTH / 2 // = 9.5
const TAB_THICKNESS = 2 // assumed -- flush with the bottom edge
const TAB_HOLE_DIAMETER = 3 // per spec
const TAB_HOLE_INSET = 3 // assumed -- distance from the tab's curved
// outer edge to the hole center

const footprint2D = (size) => roundedRectangle({ size, center: [EXT_LENGTH / 2, EXT_WIDTH / 2], roundRadius: CORNER_ROUND_RADIUS, segments: CORNER_SEGMENTS })

const outerBox3D = () => {
  const lowerHeight = EXT_HEIGHT - TOP_BEVEL_HEIGHT
  const lower = extrudeLinear({ height: lowerHeight }, footprint2D([EXT_LENGTH, EXT_WIDTH]))
  const bevelBottomSlice = translate([0, 0, lowerHeight], extrudeLinear({ height: 0.01 }, footprint2D([EXT_LENGTH, EXT_WIDTH])))
  const bevelTopSlice = translate(
    [0, 0, EXT_HEIGHT - 0.01],
    extrudeLinear({ height: 0.01 }, footprint2D([EXT_LENGTH - 2 * TOP_BEVEL_INSET, EXT_WIDTH - 2 * TOP_BEVEL_INSET]))
  )
  const bevel = hull(bevelBottomSlice, bevelTopSlice)
  return union(lower, bevel)
}

// Hollows out everything except the 4 side walls and the top wall --
// open on the bottom (the cavity overshoots past Z=0).
const cavity3D = () => {
  const cavityHeight = INT_HEIGHT + HOLE_OVERSHOOT
  return translate(
    [EXT_LENGTH / 2, EXT_WIDTH / 2, cavityHeight / 2 - HOLE_OVERSHOOT],
    cuboid({ size: [INT_LENGTH, INT_WIDTH, cavityHeight] })
  )
}

const roundHole3D = () => {
  const bore = cylinder({ radius: ROUND_HOLE_DIAMETER / 2, height: WALL_THICKNESS + HOLE_OVERSHOOT, segments: ROUND_HOLE_SEGMENTS })
  return translate([ROUND_HOLE_X, ROUND_HOLE_Y, EXT_HEIGHT - WALL_THICKNESS / 2], bore)
}

const rectHole3D = () =>
  translate(
    [RECT_HOLE_X, RECT_HOLE_Y, EXT_HEIGHT - WALL_THICKNESS / 2],
    cuboid({ size: [RECT_HOLE_X_SIZE, RECT_HOLE_Y_SIZE, WALL_THICKNESS + HOLE_OVERSHOOT] })
  )

// Half-round mounting ear sticking out from one end: a TAB_RADIUS disc
// (flat diameter flush with the full exterior width), cut down to the
// outward-facing half, flush with the bottom edge, with a 3mm screw hole
// centered TAB_HOLE_INSET in from its curved outer edge.
const endTab3D = (side) => {
  const endX = side === 'left' ? 0 : EXT_LENGTH
  const outwardSign = side === 'left' ? -1 : 1
  const centerY = EXT_WIDTH / 2
  const disc = translate(
    [endX, centerY, TAB_THICKNESS / 2],
    cylinder({ radius: TAB_RADIUS, height: TAB_THICKNESS, segments: 64 })
  )
  const outwardHalf = translate(
    [endX + outwardSign * TAB_RADIUS, centerY, TAB_THICKNESS / 2],
    cuboid({ size: [2 * TAB_RADIUS, 2 * TAB_RADIUS, TAB_THICKNESS + HOLE_OVERSHOOT] })
  )
  const ear = intersect(disc, outwardHalf)
  const holeX = endX + outwardSign * (TAB_RADIUS - TAB_HOLE_INSET)
  const hole = translate(
    [holeX, centerY, TAB_THICKNESS / 2],
    cylinder({ radius: TAB_HOLE_DIAMETER / 2, height: TAB_THICKNESS + HOLE_OVERSHOOT, segments: 32 })
  )
  return subtract(ear, hole)
}

const main = () => {
  const solid = union(outerBox3D(), endTab3D('left'), endTab3D('right'))
  return subtract(solid, cavity3D(), roundHole3D(), rectHole3D())
}

module.exports = { main, outerBox3D, cavity3D }
