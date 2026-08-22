const { circle, rectangle } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotateZ } = require('@jscad/modeling').transforms

// Ring with 7 evenly-spaced square teeth sticking out radially, extruded
// 3mm, with a raised hollow-cylinder collar centered on top of it.

const RING_INNER_DIAMETER = 45
const RING_OUTER_DIAMETER = 51
const RING_INNER_RADIUS = RING_INNER_DIAMETER / 2
const RING_OUTER_RADIUS = RING_OUTER_DIAMETER / 2
const BASE_HEIGHT = 3

const TOOTH_COUNT = 7
const TOOTH_WIDTH = 7 // tangential
const TOOTH_PROTRUSION = 10 // radial, beyond the ring's outer edge

const COLLAR_OUTER_DIAMETER = 48.5
const COLLAR_WALL_THICKNESS = 3
const COLLAR_OUTER_RADIUS = COLLAR_OUTER_DIAMETER / 2
const COLLAR_INNER_RADIUS = COLLAR_OUTER_RADIUS - COLLAR_WALL_THICKNESS
const COLLAR_HEIGHT = 5 // assumed -- not specified in the brief

const SEGMENTS = 128

// One tooth, drawn pointing along +X, then rotated into place.
const tooth2D = (angleDeg) => {
  const tooth = rectangle({
    size: [TOOTH_PROTRUSION, TOOTH_WIDTH],
    center: [RING_OUTER_RADIUS + TOOTH_PROTRUSION / 2, 0]
  })
  return rotateZ((angleDeg * Math.PI) / 180, tooth)
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
  const collar = translate(
    [0, 0, BASE_HEIGHT],
    extrudeLinear({ height: COLLAR_HEIGHT }, collar2D())
  )
  return union(base, collar)
}

module.exports = { main, base2D, collar2D }
