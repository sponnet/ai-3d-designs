const { cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans

// Closed hollow cylinder (canister): an outer cylinder with a smaller,
// shorter cylinder subtracted out of its middle -- centered, so it stops
// WALL_THICKNESS short of the top and bottom too -- giving a uniform
// WALL_THICKNESS wall on every side (radial *and* top/bottom caps),
// rather than an open-ended pipe.

const OUTER_DIAMETER = 63
const HEIGHT = 57
const WALL_THICKNESS = 2

const CUTOUT_DIAMETER = OUTER_DIAMETER - 2 * WALL_THICKNESS // 59
const CUTOUT_HEIGHT = HEIGHT - 2 * WALL_THICKNESS // 53

const SEGMENTS = 128

const main = () => {
  const outer = cylinder({ radius: OUTER_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  const cutout = cylinder({ radius: CUTOUT_DIAMETER / 2, height: CUTOUT_HEIGHT, segments: SEGMENTS })
  return subtract(outer, cutout)
}

module.exports = { main }
