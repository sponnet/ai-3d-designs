const { cylinder, roundedCylinder, cuboid } = require('@jscad/modeling').primitives
const { union, intersect, subtract } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// Bottom plug / foot for a tube with a 49mm inner diameter: a long plug
// that push-fits up into the tube's bottom opening, with a flat
// cylindrical foot below it that ends up touching the ground once
// installed. The whole piece is a hollow shell, WALL_THICKNESS thick
// throughout, instead of solid.
//
// The foot is a plain flat cylinder (no dome/bulge), flush across its
// full FOOT_DIAMETER, with its bottom outer edge rounded off by
// FOOT_ROUND_RADIUS -- built as a roundedCylinder rounded on both ends,
// then clipped flat at Z=0 so only the bottom rounding survives.
//
// Modeled with the foot at Z < 0 (flat bottom, rounded edge) and the
// plug at Z > 0 (up to PLUG_HEIGHT), matching the piece's physical
// orientation once installed. For printing, reorienting plug-side-down
// in the slicer gives a flat base with no overhangs.

const TUBE_ID = 49
const PLUG_CLEARANCE = 0 // no push-fit clearance -- plug diameter matches the tube ID exactly
const PLUG_DIAMETER = TUBE_ID - PLUG_CLEARANCE
const PLUG_HEIGHT = 100

const FOOT_DIAMETER = 51
const FOOT_HEIGHT = 20 / 3 // same as the plug's own previous height
const FOOT_ROUND_RADIUS = 2 // rounds the foot's bottom outer edge

const WALL_THICKNESS = 3
const SEGMENTS = 96
const CAVITY_OVERLAP = 1 // extra depth so the plug's and foot's inner
// cavities overlap cleanly at Z=0 instead of just touching

const SLOT_WIDTH = 2 // assumed -- not specified
const SLOT_OVERSHOOT = 1 // clears past the outer surface and into the
// already-hollow cavity, for a clean full-thickness cut regardless of
// the plug's local radius

const plugOuter3D = () =>
  translate([0, 0, PLUG_HEIGHT / 2], cylinder({ radius: PLUG_DIAMETER / 2, height: PLUG_HEIGHT, segments: SEGMENTS }))

// Same shape as plugOuter3D, radius shrunk by WALL_THICKNESS -- the
// cavity that makes the plug hollow. Extends CAVITY_OVERLAP below Z=0
// so it overlaps cleanly with the foot's inner cavity.
const plugInner3D = () => {
  const cavityHeight = PLUG_HEIGHT + CAVITY_OVERLAP
  return translate(
    [0, 0, PLUG_HEIGHT / 2 - CAVITY_OVERLAP / 2],
    cylinder({ radius: PLUG_DIAMETER / 2 - WALL_THICKNESS, height: cavityHeight, segments: SEGMENTS })
  )
}

// A flat cylinder from Z=-FOOT_HEIGHT to Z=0, bottom outer edge rounded
// off by roundRadius. Built as a roundedCylinder tall enough to round
// both its ends, positioned so only its (correctly rounded) bottom end
// falls within [-FOOT_HEIGHT, 0]; intersecting with that Z-range clips
// away the fictitious top rounding, leaving a flat top at Z=0.
const footCylinder3D = (radius, roundRadius) => {
  const totalHeight = FOOT_HEIGHT + roundRadius
  const centerZ = roundRadius / 2 - FOOT_HEIGHT / 2
  const rc = translate([0, 0, centerZ], roundedCylinder({ radius, height: totalHeight, roundRadius, segments: SEGMENTS }))
  const clip = translate([0, 0, -FOOT_HEIGHT / 2], cuboid({ size: [2 * radius + 10, 2 * radius + 10, FOOT_HEIGHT] }))
  return intersect(rc, clip)
}

// A relief slot cut radially through the plug's wall, from the (already
// hollow) cavity out past the outer surface, along the plug's full
// height -- lets the wall flex/compress a little if the push-fit into
// the tube ends up too tight, instead of being a fully rigid ring.
// Runs from near the center out along +X so it fully clears the wall at
// any radius, without needing to track the local radius.
const slot3D = () => {
  const outerReach = PLUG_DIAMETER / 2 + SLOT_OVERSHOOT
  const xStart = -SLOT_OVERSHOOT
  return translate(
    [(xStart + outerReach) / 2, 0, PLUG_HEIGHT / 2],
    cuboid({ size: [outerReach - xStart, SLOT_WIDTH, PLUG_HEIGHT + 2 * SLOT_OVERSHOOT] })
  )
}

const main = () => {
  const outer = union(plugOuter3D(), footCylinder3D(FOOT_DIAMETER / 2, FOOT_ROUND_RADIUS))
  const footInnerHeight = FOOT_HEIGHT - WALL_THICKNESS + CAVITY_OVERLAP
  const footInnerBottom = -(FOOT_HEIGHT - WALL_THICKNESS)
  const inner = union(
    plugInner3D(),
    translate(
      [0, 0, footInnerBottom + footInnerHeight / 2],
      cylinder({
        radius: FOOT_DIAMETER / 2 - WALL_THICKNESS,
        height: footInnerHeight,
        segments: SEGMENTS
      })
    )
  )
  return subtract(outer, inner, slot3D())
}

module.exports = { main, plugOuter3D, footCylinder3D }
