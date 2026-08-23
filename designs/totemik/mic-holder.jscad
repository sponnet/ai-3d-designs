const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// Hollow tray for a microphone, open on the bottom, with 2 cutouts
// through the top: a round hole for the microphone capsule and a
// rectangular slot for something adjacent (cable/connector) at the
// opposite end.
//
// Coordinates: X = along the 35mm side, Y = across the 15mm side, Z = up
// (Z=0 is the open bottom, Z=BOX_HEIGHT is the top wall's outer face).

const BOX_LENGTH = 35 // X
const BOX_WIDTH = 15 // Y
const BOX_HEIGHT = 17 // Z ("diepte")
const WALL_THICKNESS = 2 // assumed -- not specified; applies to the 4
// side walls and the top wall alike

const ROUND_HOLE_DIAMETER = 4 // per user spec
const ROUND_HOLE_SEGMENTS = 32
const ROUND_HOLE_X = 20 // centered on Y, 20mm from the X=0 side
const ROUND_HOLE_Y = BOX_WIDTH / 2

const RECT_HOLE_X_SIZE = 12 // assumed -- extends inward from the X=BOX_LENGTH
// edge; the 2 dimensions (9 vs 12mm) aren't assigned to axes in the spec,
// so the hole is oriented as a slot reaching in from the edge it's
// flush with
const RECT_HOLE_Y_SIZE = 9 // centered on the 15mm (Y) side
const RECT_HOLE_X_CENTER = BOX_LENGTH - RECT_HOLE_X_SIZE / 2 // flush with
// the X=BOX_LENGTH edge (opposite the round hole's reference edge)
const RECT_HOLE_Y_CENTER = BOX_WIDTH / 2

const HOLE_OVERSHOOT = 2

const outerBox3D = () =>
  translate([BOX_LENGTH / 2, BOX_WIDTH / 2, BOX_HEIGHT / 2], cuboid({ size: [BOX_LENGTH, BOX_WIDTH, BOX_HEIGHT] }))

// Hollows out everything except the 4 side walls and the top wall --
// open on the bottom (the cavity overshoots past Z=0).
const cavity3D = () => {
  const cavityHeight = BOX_HEIGHT - WALL_THICKNESS + HOLE_OVERSHOOT
  return translate(
    [BOX_LENGTH / 2, BOX_WIDTH / 2, cavityHeight / 2 - HOLE_OVERSHOOT],
    cuboid({ size: [BOX_LENGTH - 2 * WALL_THICKNESS, BOX_WIDTH - 2 * WALL_THICKNESS, cavityHeight] })
  )
}

const roundHole3D = () => {
  const bore = cylinder({ radius: ROUND_HOLE_DIAMETER / 2, height: WALL_THICKNESS + HOLE_OVERSHOOT, segments: ROUND_HOLE_SEGMENTS })
  return translate([ROUND_HOLE_X, ROUND_HOLE_Y, BOX_HEIGHT - WALL_THICKNESS / 2], bore)
}

const rectHole3D = () =>
  translate(
    [RECT_HOLE_X_CENTER, RECT_HOLE_Y_CENTER, BOX_HEIGHT - WALL_THICKNESS / 2],
    cuboid({ size: [RECT_HOLE_X_SIZE, RECT_HOLE_Y_SIZE, WALL_THICKNESS + HOLE_OVERSHOOT] })
  )

const main = () => subtract(outerBox3D(), cavity3D(), roundHole3D(), rectHole3D())

module.exports = { main, outerBox3D, cavity3D }
