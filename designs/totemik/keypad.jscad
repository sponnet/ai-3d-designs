const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union, intersect } = require('@jscad/modeling').booleans
const { hull } = require('@jscad/modeling').hulls
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
// The beam's width (front-to-back) tapers with height: 15mm at the
// bottom (z=0) widening to 18mm at the top (z=BEAM_HEIGHT), flaring
// outward symmetrically. The inner hollow stays a constant HOLE_SIZE
// (14mm) throughout -- the switch/wiring clearance never pinches down --
// so the taper shows up entirely as wall thickness, thin (0.5mm) at the
// bottom for a compact footprint, thick (2mm) at the top for more
// material right around the switch cutouts, where it matters most
// structurally. The side walls, end walls and top wall (all Y-extent)
// follow this same taper so they stay flush with each other at every z.
//
// Coordinates: X = along the 4 keys, Y = depth (front-to-back), Z = up
// (Z=0 is the open bottom, Z=BEAM_HEIGHT is the top wall's outer face).

const HOLE_SIZE = 14
const HOLE_PITCH = 19.05 // standard MX/keycap center spacing
const NUM_KEYS = 4
const TOP_THICKNESS = 1.8 // matches the measured Cherry MX plate spec

const MARGIN_X = 4 // minimal material beyond the outer hole edges, left/right
const MARGIN_Y_BOTTOM = 0.5 // bottom (z=0) margin/wall-thickness beyond the
// hole edges, front/back -- thin, for a compact 15mm-wide footprint
const MARGIN_Y_TOP = 2 // assumed -- top (z=BEAM_HEIGHT) margin/wall-thickness
// beyond the hole edges, front/back -- thicker, for an 18mm-wide top with
// more material around the switch cutouts
const END_WALL_THICKNESS = 2 // assumed -- the 2 lengthwise-end walls' X extent
const BEAM_HEIGHT = 12 // assumed -- how far "up" the holes sit; gives
// clearance underneath for switch pins/hot-swap sockets/wiring

const BEAM_LENGTH = 2 * MARGIN_X + HOLE_SIZE + (NUM_KEYS - 1) * HOLE_PITCH
const BEAM_DEPTH_BOTTOM = 2 * MARGIN_Y_BOTTOM + HOLE_SIZE // = 15mm
const BEAM_DEPTH_TOP = 2 * MARGIN_Y_TOP + HOLE_SIZE // = 18mm
const CENTER_Y = MARGIN_Y_BOTTOM + HOLE_SIZE / 2 // constant across height,
// since the taper is symmetric about the (fixed) hole center

const TAB_RADIUS = BEAM_DEPTH_BOTTOM / 2 // flat edge flush with the bottom width
const TAB_THICKNESS = 2 // assumed -- flush with the walls' open bottom edge
const TAB_HOLE_DIAMETER = 3
const TAB_HOLE_INSET = 3 // assumed -- distance from the tab's curved outer
// edge to the hole center, leaving that much annular material around it
const HOLE_OVERSHOOT = 2
const TAPER_SLICE_HEIGHT = 0.01 // thin end-cap slices, hulled together to
// form each tapered wall/end-cap's sloped surface

const keyHoleCenters = () => {
  const firstX = MARGIN_X + HOLE_SIZE / 2
  const centers = []
  for (let i = 0; i < NUM_KEYS; i++) centers.push(firstX + i * HOLE_PITCH)
  return centers
}

const topWall3D = () => {
  const wall = translate(
    [BEAM_LENGTH / 2, CENTER_Y, BEAM_HEIGHT - TOP_THICKNESS / 2],
    cuboid({ size: [BEAM_LENGTH, BEAM_DEPTH_TOP, TOP_THICKNESS] })
  )
  const holes = keyHoleCenters().map((x) =>
    translate(
      [x, CENTER_Y, BEAM_HEIGHT - TOP_THICKNESS / 2],
      cuboid({ size: [HOLE_SIZE, HOLE_SIZE, TOP_THICKNESS + HOLE_OVERSHOOT] })
    )
  )
  return subtract(wall, ...holes)
}

// A slice spanning [innerY, outerY] in Y, BEAM_LENGTH long in X, thin in Z
// -- 2 of these (at z=0 and z=BEAM_HEIGHT) get hulled together into a
// tapered wall whose inner (hollow-facing) edge stays flush at innerY for
// the full height, while its outer edge slides from the bottom outerY to
// the top outerY.
const widthSlice = (innerY, outerY, z) =>
  translate(
    [BEAM_LENGTH / 2, (innerY + outerY) / 2, z],
    cuboid({ size: [BEAM_LENGTH, Math.abs(outerY - innerY), TAPER_SLICE_HEIGHT] })
  )

const sideWalls3D = () => {
  const front = hull(
    widthSlice(CENTER_Y - HOLE_SIZE / 2, CENTER_Y - BEAM_DEPTH_BOTTOM / 2, TAPER_SLICE_HEIGHT / 2),
    widthSlice(CENTER_Y - HOLE_SIZE / 2, CENTER_Y - BEAM_DEPTH_TOP / 2, BEAM_HEIGHT - TAPER_SLICE_HEIGHT / 2)
  )
  const back = hull(
    widthSlice(CENTER_Y + HOLE_SIZE / 2, CENTER_Y + BEAM_DEPTH_BOTTOM / 2, TAPER_SLICE_HEIGHT / 2),
    widthSlice(CENTER_Y + HOLE_SIZE / 2, CENTER_Y + BEAM_DEPTH_TOP / 2, BEAM_HEIGHT - TAPER_SLICE_HEIGHT / 2)
  )
  return union(front, back)
}

// Closes off the beam's 2 lengthwise ends -- only the bottom stays open.
// Tapers the same way as sideWalls3D so the two stay flush at every z.
const endWalls3D = () => {
  const endSlice = (cx, z, depth) =>
    translate([cx, CENTER_Y, z], cuboid({ size: [END_WALL_THICKNESS, depth, TAPER_SLICE_HEIGHT] }))
  const buildEnd = (cx) =>
    hull(
      endSlice(cx, TAPER_SLICE_HEIGHT / 2, BEAM_DEPTH_BOTTOM),
      endSlice(cx, BEAM_HEIGHT - TAPER_SLICE_HEIGHT / 2, BEAM_DEPTH_TOP)
    )
  const left = buildEnd(END_WALL_THICKNESS / 2)
  const right = buildEnd(BEAM_LENGTH - END_WALL_THICKNESS / 2)
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
    [endX, CENTER_Y, TAB_THICKNESS / 2],
    cylinder({ radius: TAB_RADIUS, height: TAB_THICKNESS, segments: 64 })
  )
  const outwardHalf = translate(
    [endX + outwardSign * TAB_RADIUS, CENTER_Y, TAB_THICKNESS / 2],
    cuboid({ size: [2 * TAB_RADIUS, 2 * TAB_RADIUS, TAB_THICKNESS + HOLE_OVERSHOOT] })
  )
  const ear = intersect(disc, outwardHalf)
  const holeX = endX + outwardSign * (TAB_RADIUS - TAB_HOLE_INSET)
  const hole = translate(
    [holeX, CENTER_Y, TAB_THICKNESS / 2],
    cylinder({ radius: TAB_HOLE_DIAMETER / 2, height: TAB_THICKNESS + HOLE_OVERSHOOT, segments: 32 })
  )
  return subtract(ear, hole)
}

const main = () =>
  union(topWall3D(), sideWalls3D(), endWalls3D(), endTab3D('left'), endTab3D('right'))

module.exports = { main, topWall3D, sideWalls3D, endWalls3D }
