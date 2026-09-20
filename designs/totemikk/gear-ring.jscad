const { circle, rectangle, polygon } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { rotateZ } = require('@jscad/modeling').transforms

// Ring with 7 evenly-spaced square teeth sticking out radially, extruded
// 3mm, with a raised hollow-cylinder collar centered on top of it.
//
// Each tooth is sunk all the way in to the ring's inner radius (not just
// touching at the outer edge) for a solid printed bond, and has a
// V-shaped slot cut through it: 0mm wide where it starts at the ring's
// (original) outer edge, widening to SLOT_WIDTH at the tooth's tip --
// splitting the protruding part of the tooth into 2 prongs, joined only
// at their sunk-in root inside the ring.

const RING_INNER_DIAMETER = 45
const RING_OUTER_DIAMETER = 51
const RING_INNER_RADIUS = RING_INNER_DIAMETER / 2
const RING_OUTER_RADIUS = RING_OUTER_DIAMETER / 2
const BASE_HEIGHT = 2 // first-layer extrusion thickness

const TOOTH_COUNT = 7
const TOOTH_WIDTH = 7 // tangential
const TOOTH_PROTRUSION = 10 // radial, beyond the ring's outer edge
const TOOTH_TIP_RADIUS = RING_OUTER_RADIUS + TOOTH_PROTRUSION
const TOOTH_SUNK_RADIUS = RING_INNER_RADIUS // tooth's inner edge, sunk
// through the full ring wall instead of just meeting the outer surface

const SLOT_WIDTH = 2 // at the tooth's tip
const SLOT_START_RADIUS = RING_OUTER_RADIUS // the V's point (0mm wide)

const COLLAR_OUTER_DIAMETER = 48.5
const COLLAR_WALL_THICKNESS = 3
const COLLAR_OUTER_RADIUS = COLLAR_OUTER_DIAMETER / 2
const COLLAR_INNER_RADIUS = COLLAR_OUTER_RADIUS - COLLAR_WALL_THICKNESS
const COLLAR_RISE = 5 // assumed -- how far the collar rises above the base
// layer's top surface. The collar itself runs all the way down to Z=0
// (the very bottom), not just starting on top of the base layer.
const COLLAR_HEIGHT = BASE_HEIGHT + COLLAR_RISE

const SEGMENTS = 128

// One tooth, drawn pointing along +X, then rotated into place.
const tooth2D = (angleDeg) => {
  const tooth = rectangle({
    size: [TOOTH_TIP_RADIUS - TOOTH_SUNK_RADIUS, TOOTH_WIDTH],
    center: [(TOOTH_SUNK_RADIUS + TOOTH_TIP_RADIUS) / 2, 0]
  })
  // Points wound counter-clockwise -- required for subtract() to treat
  // this as a hole rather than (as with clockwise winding) replacing the
  // tooth with just the slot triangle itself.
  const slot = polygon({
    points: [
      [SLOT_START_RADIUS, 0],
      [TOOTH_TIP_RADIUS, -SLOT_WIDTH / 2],
      [TOOTH_TIP_RADIUS, SLOT_WIDTH / 2]
    ]
  })
  const toothSlotted = subtract(tooth, slot)
  return rotateZ((angleDeg * Math.PI) / 180, toothSlotted)
}

const base2D = () => {
  const outer = circle({ radius: RING_OUTER_RADIUS, segments: SEGMENTS })
  const inner = circle({ radius: RING_INNER_RADIUS, segments: SEGMENTS })
  const ring = subtract(outer, inner)
  const teeth = []
  for (let i = 0; i < TOOTH_COUNT; i++) {
    teeth.push(tooth2D((360 / TOOTH_COUNT) * i))
  }
  return union(ring, ...teeth)
}

const collar2D = () => {
  const outer = circle({ radius: COLLAR_OUTER_RADIUS, segments: SEGMENTS })
  const inner = circle({ radius: COLLAR_INNER_RADIUS, segments: SEGMENTS })
  return subtract(outer, inner)
}

const main = () => {
  const base = extrudeLinear({ height: BASE_HEIGHT }, base2D())
  // Starts at Z=0, same as the base -- runs all the way to the bottom
  // instead of sitting only on top of the base layer.
  const collar = extrudeLinear({ height: COLLAR_HEIGHT }, collar2D())
  return union(base, collar)
}

module.exports = { main, base2D, collar2D }
