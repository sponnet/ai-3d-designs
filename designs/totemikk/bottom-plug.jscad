const { cylinder, torus, cuboid } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
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

const SLOT_WIDTH = 2 // assumed -- not specified
const SLOT_OVERSHOOT = 1 // clears past the outer surface and past the
// top face, for a clean full-thickness cut regardless of the plug's
// local radius -- but never below Z=0, so the slot stays confined to
// the (narrower) plug and doesn't cut into the (wider) foot below it

const plugOuter3D = () =>
  translate([0, 0, PLUG_HEIGHT / 2], cylinder({ radius: PLUG_DIAMETER / 2, height: PLUG_HEIGHT, segments: SEGMENTS }))

// Same radius as the plug's own cavity (PLUG_DIAMETER/2 - WALL_THICKNESS),
// but extended all the way down to just inside the foot's rounded
// bottom instead of stopping at Z=0. Keeping this a single cylinder of
// constant radius -- rather than a narrower plug cavity sitting above a
// separate, wider foot cavity -- avoids an inward-facing step/shelf at
// their junction, which would otherwise be an unsupported overhang when
// printed. The resulting wall is WALL_THICKNESS thick alongside the
// plug and thicker than that alongside the foot, which is fine.
const plugInner3D = () => {
  const bottom = -(FOOT_HEIGHT - WALL_THICKNESS)
  const height = PLUG_HEIGHT - bottom
  return translate(
    [0, 0, bottom + height / 2],
    cylinder({ radius: PLUG_DIAMETER / 2 - WALL_THICKNESS, height, segments: SEGMENTS })
  )
}

// A flat cylinder from Z=-FOOT_HEIGHT to Z=0, bottom outer edge rounded
// off by roundRadius, built from 3 pieces instead of jscad's own
// roundedCylinder (which tapers its whole end cap to a point on the
// axis, not a small edge fillet -- see OPENJSCAD_SKILL.md):
//   - a full-radius body from the fillet's top down to Z=0
//   - a torus bridging the body's bottom edge to the cap's edge
//   - a (radius - roundRadius) cap filling in the flat bottom disc
const footCylinder3D = (radius, roundRadius) => {
  const capRadius = radius - roundRadius
  const bodyHeight = FOOT_HEIGHT - roundRadius
  const body = translate([0, 0, -bodyHeight / 2], cylinder({ radius, height: bodyHeight, segments: SEGMENTS }))
  const fillet = translate(
    [0, 0, -FOOT_HEIGHT + roundRadius],
    torus({ innerRadius: roundRadius, outerRadius: capRadius, innerSegments: SEGMENTS, outerSegments: SEGMENTS })
  )
  const cap = translate([0, 0, -FOOT_HEIGHT + roundRadius / 2], cylinder({ radius: capRadius, height: roundRadius, segments: SEGMENTS }))
  return union(body, fillet, cap)
}

// A relief slot cut radially through the plug's wall, from the (already
// hollow) cavity out past the outer surface, along the plug's full
// height -- lets the wall flex/compress a little if the push-fit into
// the tube ends up too tight, instead of being a fully rigid ring.
// Runs from near the center out along +X so it fully clears the wall at
// any radius, without needing to track the local radius. Stops exactly
// at Z=0 (the plug/foot boundary) rather than overshooting below it, so
// it never reaches into the wider foot.
const slot3D = () => {
  const outerReach = PLUG_DIAMETER / 2 + SLOT_OVERSHOOT
  const xStart = -SLOT_OVERSHOOT
  const height = PLUG_HEIGHT + SLOT_OVERSHOOT
  return translate([(xStart + outerReach) / 2, 0, height / 2], cuboid({ size: [outerReach - xStart, SLOT_WIDTH, height] }))
}

const main = () => {
  const outer = union(plugOuter3D(), footCylinder3D(FOOT_DIAMETER / 2, FOOT_ROUND_RADIUS))
  const inner = plugInner3D()
  return subtract(outer, inner, slot3D())
}

module.exports = { main, plugOuter3D, footCylinder3D }
