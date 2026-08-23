const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union, intersect } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// Minimalist hollow beam, open on the bottom, with 4 Cherry MX switch
// cutouts side by side in the top wall -- raising the switches up on the
// beam's 2 side walls, so there's clearance underneath for switch pins /
// hot-swap sockets / wiring instead of them sitting flush on whatever
// this is mounted to. The 2 lengthwise ends are closed off too (only the
// bottom is open). 2 half-round mounting ears, each with a 3mm screw
// hole, stick out from the 2 lengthwise ends.
//
// Hole size (14x14mm, square) and top-wall thickness (1.8mm) match the
// standard Cherry MX plate spec measured from the reference
// 3MechanicalButtons.3mf. Hole spacing uses the standard 19.05mm MX/
// keycap pitch so 1u keycaps don't collide.
//
// BEAM_DEPTH (the beam's width, front-to-back) is capped at 15mm, so
// MARGIN_Y and SIDE_WALL_THICKNESS are both shrunk to the thinnest
// reasonably printable amount (0.5mm) rather than kept at a more
// generous default -- there's very little room left once the 14mm
// square hole itself is accounted for.
//
// Coordinates: X = along the 4 keys, Y = depth (front-to-back), Z = up
// (Z=0 is the open bottom, Z=BEAM_HEIGHT is the top wall's outer face).

const HOLE_SIZE = 14
const HOLE_PITCH = 19.05 // standard MX/keycap center spacing
const NUM_KEYS = 4
const TOP_THICKNESS = 1.8 // matches the measured Cherry MX plate spec

const MARGIN_X = 4 // minimal material beyond the outer hole edges, left/right
const MARGIN_Y = 0.5 // shrunk to fit the 15mm width cap (was 4mm)
const SIDE_WALL_THICKNESS = 0.5 // front/back walls; shrunk to fit the 15mm
// width cap (was 2mm) -- flush with MARGIN_Y so the wall doesn't intrude
// into the switch cutout
const END_WALL_THICKNESS = 2 // assumed -- the 2 lengthwise-end walls;
// doesn't affect BEAM_DEPTH (width), so kept at the sturdier original value
const BEAM_HEIGHT = 12 // assumed -- how far "up" the holes sit; gives
// clearance underneath for switch pins/hot-swap sockets/wiring

const BEAM_LENGTH = 2 * MARGIN_X + HOLE_SIZE + (NUM_KEYS - 1) * HOLE_PITCH
const BEAM_DEPTH = 2 * MARGIN_Y + HOLE_SIZE // = 15mm

const TAB_RADIUS = BEAM_DEPTH / 2 // flat edge flush with the full beam width
const TAB_THICKNESS = 2 // assumed -- flush with the walls' open bottom edge
const TAB_HOLE_DIAMETER = 3
const TAB_HOLE_INSET = 3 // assumed -- distance from the tab's curved outer
// edge to the hole center, leaving that much annular material around it
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
    [BEAM_LENGTH / 2, SIDE_WALL_THICKNESS / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [BEAM_LENGTH, SIDE_WALL_THICKNESS, BEAM_HEIGHT] })
  )
  const back = translate(
    [BEAM_LENGTH / 2, BEAM_DEPTH - SIDE_WALL_THICKNESS / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [BEAM_LENGTH, SIDE_WALL_THICKNESS, BEAM_HEIGHT] })
  )
  return union(front, back)
}

// Closes off the beam's 2 lengthwise ends -- only the bottom stays open.
const endWalls3D = () => {
  const left = translate(
    [END_WALL_THICKNESS / 2, BEAM_DEPTH / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [END_WALL_THICKNESS, BEAM_DEPTH, BEAM_HEIGHT] })
  )
  const right = translate(
    [BEAM_LENGTH - END_WALL_THICKNESS / 2, BEAM_DEPTH / 2, BEAM_HEIGHT / 2],
    cuboid({ size: [END_WALL_THICKNESS, BEAM_DEPTH, BEAM_HEIGHT] })
  )
  return union(left, right)
}

// Half-round mounting ear sticking out from one lengthwise end: a
// TAB_RADIUS disc (flat diameter flush with the full beam width), cut
// down to the outward-facing half, flush with the bottom edge, with a
// 3mm screw hole centered TAB_HOLE_INSET in from its curved outer edge.
const endTab3D = (side) => {
  const endX = side === 'left' ? 0 : BEAM_LENGTH
  const outwardSign = side === 'left' ? -1 : 1
  const disc = translate(
    [endX, BEAM_DEPTH / 2, TAB_THICKNESS / 2],
    cylinder({ radius: TAB_RADIUS, height: TAB_THICKNESS, segments: 64 })
  )
  const outwardHalf = translate(
    [endX + outwardSign * TAB_RADIUS, BEAM_DEPTH / 2, TAB_THICKNESS / 2],
    cuboid({ size: [2 * TAB_RADIUS, 2 * TAB_RADIUS, TAB_THICKNESS + HOLE_OVERSHOOT] })
  )
  const ear = intersect(disc, outwardHalf)
  const holeX = endX + outwardSign * (TAB_RADIUS - TAB_HOLE_INSET)
  const hole = translate(
    [holeX, BEAM_DEPTH / 2, TAB_THICKNESS / 2],
    cylinder({ radius: TAB_HOLE_DIAMETER / 2, height: TAB_THICKNESS + HOLE_OVERSHOOT, segments: 32 })
  )
  return subtract(ear, hole)
}

const main = () =>
  union(topWall3D(), sideWalls3D(), endWalls3D(), endTab3D('left'), endTab3D('right'))

module.exports = { main, topWall3D, sideWalls3D, endWalls3D }
