const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
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
// space, not against the outer box: the round hole sits INT_LENGTH -
// ROUND_HOLE_INSET from the interior edge nearest the rectangular hole,
// putting it toward the opposite end; the rectangular hole is flush with
// the interior's far edge (touching the wall's inner face) without
// crossing into the wall itself, so it stays fully within the top
// surface's open span.
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
const ROUND_HOLE_INSET = 20 // per spec, measured from the interior edge
// nearest the rectangular hole
const ROUND_HOLE_X = WALL_THICKNESS + (INT_LENGTH - ROUND_HOLE_INSET) // = 17
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

const outerBox3D = () =>
  translate([EXT_LENGTH / 2, EXT_WIDTH / 2, EXT_HEIGHT / 2], cuboid({ size: [EXT_LENGTH, EXT_WIDTH, EXT_HEIGHT] }))

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

const main = () => subtract(outerBox3D(), cavity3D(), roundHole3D(), rectHole3D())

module.exports = { main, outerBox3D, cavity3D }
