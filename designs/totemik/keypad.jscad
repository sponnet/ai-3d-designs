const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// Minimalist hollow beam, open on the bottom, with 4 Cherry MX switch
// cutouts side by side in the top wall -- raising the switches up on the
// beam's 2 side walls, so there's clearance underneath for switch pins /
// hot-swap sockets / wiring instead of them sitting flush on whatever
// this is mounted to. The 2 lengthwise ends are closed off too (only the
// bottom is open). 2 mounting tabs (each with a 3mm screw hole) sit
// within that open bottom face, one at each end.
//
// Hole size (14x14mm, square) and top-wall thickness (1.8mm) match the
// standard Cherry MX plate spec measured from the reference
// 3MechanicalButtons.3mf. Hole spacing uses the standard 19.05mm MX/
// keycap pitch so 1u keycaps don't collide; everything else (margins,
// wall thickness, beam height, tabs) is kept as small as reasonably
// possible for a minimalist size.
//
// Coordinates: X = along the 4 keys, Y = depth (front-to-back), Z = up
// (Z=0 is the open bottom, Z=BEAM_HEIGHT is the top wall's outer face).

const HOLE_SIZE = 14
const HOLE_PITCH = 19.05 // standard MX/keycap center spacing
const NUM_KEYS = 4
const TOP_THICKNESS = 1.8 // matches the measured Cherry MX plate spec

const MARGIN_X = 4 // minimal material beyond the outer hole edges, left/right
const MARGIN_Y = 4 // minimal material beyond the hole edges, front/back
const WALL_THICKNESS = 2 // assumed -- front/back side walls
const BEAM_HEIGHT = 12 // assumed -- how far "up" the holes sit; gives
// clearance underneath for switch pins/hot-swap sockets/wiring

const BEAM_LENGTH = 2 * MARGIN_X + HOLE_SIZE + (NUM_KEYS - 1) * HOLE_PITCH
const BEAM_DEPTH = 2 * MARGIN_Y + HOLE_SIZE

const TAB_LENGTH = 10 // assumed -- each tab's extent along X
const TAB_THICKNESS = 2 // assumed -- flush with the walls' open bottom edge
const TAB_HOLE_DIAMETER = 3
const HOLE_OVERSHOOT = 2

const keyHoleCenters = () => {
  const firstX = MARGIN_X + HOLE_SIZE / 2
  const centers = []
  for (let i = 0; i < NUM_KEYS; i++) centers.push(firstX + i * HOLE_PITCH)
  return centers
}

const topWall3D = () => {
  const wall = translate(
    [BEAM_LENGTH / 2, BEAM_DEPTH / 2, BEAM_HEIGHT - TOP_THICKNESS / 2],
    cuboid({ size: [BEAM_LENGTH, BEAM_DEPTH, TOP_THICKNESS] })
  )
  const holes = keyHoleCenters().map((x) =>
    translate(
      [x, BEAM_DEPTH / 2, BEAM_HEIGHT - TOP_THICKNESS / 2],
      cuboid({ size: [HOLE_SIZE, HOLE_SIZE, TOP_THICKNESS + HOLE_OVERSHOOT] })
    )
  )
  return subtract(wall, ...holes)
}

const sideWalls3D = () => {
  const front = translate(
    [BEAM_LENGTH / 2, WALL_THICKNESS / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [BEAM_LENGTH, WALL_THICKNESS, BEAM_HEIGHT] })
  )
  const back = translate(
    [BEAM_LENGTH / 2, BEAM_DEPTH - WALL_THICKNESS / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [BEAM_LENGTH, WALL_THICKNESS, BEAM_HEIGHT] })
  )
  return union(front, back)
}

// Closes off the beam's 2 lengthwise ends, same thickness as the side
// walls -- only the bottom stays open.
const endWalls3D = () => {
  const left = translate(
    [WALL_THICKNESS / 2, BEAM_DEPTH / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [WALL_THICKNESS, BEAM_DEPTH, BEAM_HEIGHT] })
  )
  const right = translate(
    [BEAM_LENGTH - WALL_THICKNESS / 2, BEAM_DEPTH / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [WALL_THICKNESS, BEAM_DEPTH, BEAM_HEIGHT] })
  )
  return union(left, right)
}

// Sits within the open bottom face (not sticking out past the beam's
// ends), bridging the 2 side walls, flush with the bottom edge.
const endTab3D = (side) => {
  const cx = side === 'left' ? TAB_LENGTH / 2 : BEAM_LENGTH - TAB_LENGTH / 2
  const tab = translate(
    [cx, BEAM_DEPTH / 2, TAB_THICKNESS / 2],
    cuboid({ size: [TAB_LENGTH, BEAM_DEPTH, TAB_THICKNESS] })
  )
  const hole = translate(
    [cx, BEAM_DEPTH / 2, TAB_THICKNESS / 2],
    cylinder({ radius: TAB_HOLE_DIAMETER / 2, height: TAB_THICKNESS + HOLE_OVERSHOOT, segments: 32 })
  )
  return subtract(tab, hole)
}

const main = () =>
  union(topWall3D(), sideWalls3D(), endWalls3D(), endTab3D('left'), endTab3D('right'))

module.exports = { main, topWall3D, sideWalls3D, endWalls3D }
