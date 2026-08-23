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
// Hole size (14x14mm nominal, square) and top-wall thickness (1.8mm)
// match the standard Cherry MX plate spec measured from the reference
// 3MechanicalButtons.3mf. Hole spacing uses the standard 19.05mm MX/
// keycap pitch so 1u keycaps don't collide.
//
// The printed cutout itself (CUTOUT_SIZE) is shrunk slightly below that
// 14mm nominal for a snugger push-fit -- switches were sitting loose at
// the exact nominal size. Everything else (spacing, the inner hollow)
// still uses the full nominal HOLE_SIZE, so only the opening the switch
// clips through gets tighter, not the clearance around its body.
//
// The beam's width (front-to-back) tapers with height: 14mm at the
// bottom (z=0) widening to 18mm at the top, flaring outward
// symmetrically. The taper finishes at TAPER_TOP_Z (where the top wall's
// underside sits, BEAM_HEIGHT - TOP_THICKNESS below the very top) rather
// than at BEAM_HEIGHT itself -- the top wall is already a full
// BEAM_DEPTH_TOP-wide slab, so if the taper only reached full width at
// its very top face, the top wall's edges would overhang past the
// still-narrower wall directly beneath them for that last TOP_THICKNESS
// of height. Finishing the taper 1 TOP_THICKNESS early means the top
// wall sits flush on top of an already-full-width wall, with no ledge.
//
// The wall's inner (hollow-facing) face also tapers, from a HOLE_SIZE -
// 2*MARGIN_Y_BOTTOM-derived width at the bottom (13mm) up to exactly
// HOLE_SIZE (14mm, flush with the switch cutout) at TAPER_TOP_Z --
// keeping wall thickness at a constant, compact MARGIN_Y_BOTTOM (0.5mm)
// at the bottom rather than pinching to 0mm, which a 14mm-wide bottom
// with a fixed 14mm hollow would otherwise force.
//
// Coordinates: X = along the 4 keys, Y = depth (front-to-back), Z = up
// (Z=0 is the open bottom, Z=BEAM_HEIGHT is the top wall's outer face).

const HOLE_SIZE = 14 // nominal Cherry MX plate spec -- still used for hole
// spacing/positioning and the inner hollow (so the switch's actual 14mm
// body has full clearance below the plate); only the printed cutout
// itself is shrunk slightly, via CUTOUT_SIZE below
const HOLE_PITCH = 19.05 // standard MX/keycap center spacing
const NUM_KEYS = 4
const TOP_THICKNESS = 1.8 // matches the measured Cherry MX plate spec

const HOLE_FIT_REDUCTION = 0.2 // assumed -- shrinks the printed cutout
// below the nominal 14mm for a snugger push-fit; switches were sitting
// loose and popping back out at the exact nominal size
const CUTOUT_SIZE = HOLE_SIZE - HOLE_FIT_REDUCTION // = 13.8mm, the
// actual size cut through the top wall

const MARGIN_X = 4 // minimal material beyond the outer hole edges, left/right
const MARGIN_Y_BOTTOM = 0.5 // wall thickness at the bottom (z=0) -- thin,
// for a compact footprint
const MARGIN_Y_TOP = 2 // assumed -- wall thickness at TAPER_TOP_Z, beyond
// the hole edges, front/back -- thicker, for more material around the
// switch cutouts
const END_WALL_THICKNESS = 2 // assumed -- the 2 lengthwise-end walls' X extent
const BEAM_HEIGHT = 12 // assumed -- how far "up" the holes sit; gives
// clearance underneath for switch pins/hot-swap sockets/wiring

const BEAM_LENGTH = 2 * MARGIN_X + HOLE_SIZE + (NUM_KEYS - 1) * HOLE_PITCH
const BEAM_DEPTH_BOTTOM = 14 // capped per spec (was 15mm)
const BEAM_DEPTH_TOP = 2 * MARGIN_Y_TOP + HOLE_SIZE // = 18mm
const CENTER_Y = BEAM_DEPTH_BOTTOM / 2 // constant across height -- the
// taper is symmetric about this fixed centerline
const TAPER_TOP_Z = BEAM_HEIGHT - TOP_THICKNESS // where the taper reaches
// full BEAM_DEPTH_TOP width, flush with the top wall's underside

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
      cuboid({ size: [CUTOUT_SIZE, CUTOUT_SIZE, TOP_THICKNESS + HOLE_OVERSHOOT] })
    )
  )
  return subtract(wall, ...holes)
}

// A slice spanning [innerY, outerY] in Y, BEAM_LENGTH long in X, thin in Z
// -- 2 of these (a bottom and a top one) get hulled together into a
// tapered wall connecting them with a straight sloped surface on both
// the inner and outer edges.
const widthSlice = (innerY, outerY, z) =>
  translate(
    [BEAM_LENGTH / 2, (innerY + outerY) / 2, z],
    cuboid({ size: [BEAM_LENGTH, Math.abs(outerY - innerY), TAPER_SLICE_HEIGHT] })
  )

// Inner (hollow-facing) half-width at the bottom vs. TAPER_TOP_Z --
// unlike the outer edge (which follows BEAM_DEPTH_BOTTOM/TOP directly),
// the inner edge also moves, from BEAM_DEPTH_BOTTOM/2 - MARGIN_Y_BOTTOM
// up to exactly HOLE_SIZE/2 (flush with the switch cutout).
const INNER_HALF_WIDTH_BOTTOM = BEAM_DEPTH_BOTTOM / 2 - MARGIN_Y_BOTTOM
const INNER_HALF_WIDTH_TOP = HOLE_SIZE / 2

const sideWalls3D = () => {
  const front = hull(
    widthSlice(CENTER_Y - INNER_HALF_WIDTH_BOTTOM, CENTER_Y - BEAM_DEPTH_BOTTOM / 2, TAPER_SLICE_HEIGHT / 2),
    widthSlice(CENTER_Y - INNER_HALF_WIDTH_TOP, CENTER_Y - BEAM_DEPTH_TOP / 2, TAPER_TOP_Z - TAPER_SLICE_HEIGHT / 2)
  )
  const back = hull(
    widthSlice(CENTER_Y + INNER_HALF_WIDTH_BOTTOM, CENTER_Y + BEAM_DEPTH_BOTTOM / 2, TAPER_SLICE_HEIGHT / 2),
    widthSlice(CENTER_Y + INNER_HALF_WIDTH_TOP, CENTER_Y + BEAM_DEPTH_TOP / 2, TAPER_TOP_Z - TAPER_SLICE_HEIGHT / 2)
  )
  return union(front, back)
}

// Closes off the beam's 2 lengthwise ends -- only the bottom stays open.
// Tapers the same way as sideWalls3D (reaching full width at TAPER_TOP_Z,
// not BEAM_HEIGHT) so the 2 stay flush at every z with no ledge; a
// constant-width cap fills the remaining TOP_THICKNESS up to BEAM_HEIGHT,
// flush with the top wall.
const endWalls3D = () => {
  const endSlice = (cx, z, depth) =>
    translate([cx, CENTER_Y, z], cuboid({ size: [END_WALL_THICKNESS, depth, TAPER_SLICE_HEIGHT] }))
  const buildEnd = (cx) => {
    const tapered = hull(
      endSlice(cx, TAPER_SLICE_HEIGHT / 2, BEAM_DEPTH_BOTTOM),
      endSlice(cx, TAPER_TOP_Z - TAPER_SLICE_HEIGHT / 2, BEAM_DEPTH_TOP)
    )
    const cap = translate(
      [cx, CENTER_Y, TAPER_TOP_Z + TOP_THICKNESS / 2],
      cuboid({ size: [END_WALL_THICKNESS, BEAM_DEPTH_TOP, TOP_THICKNESS] })
    )
    return union(tapered, cap)
  }
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
