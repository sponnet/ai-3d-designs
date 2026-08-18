const { circle, rectangle } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions

const OUTER_DIAMETER = 49
const WALL_THICKNESS = 2
const NOTCH_WIDTH = 3
const HEIGHT = 5
const CIRCLE_SEGMENTS = 128
const NOTCH_MARGIN = 1

const OUTER_RADIUS = OUTER_DIAMETER / 2
const INNER_RADIUS = OUTER_RADIUS - WALL_THICKNESS

const ring2D = () => {
  const outer = circle({ radius: OUTER_RADIUS, segments: CIRCLE_SEGMENTS })
  const inner = circle({ radius: INNER_RADIUS, segments: CIRCLE_SEGMENTS })
  const annulus = subtract(outer, inner)

  const notchWidth = WALL_THICKNESS + 2 * NOTCH_MARGIN
  const notchCenterX = (OUTER_RADIUS + INNER_RADIUS) / 2
  const notch = rectangle({
    size: [notchWidth, NOTCH_WIDTH],
    center: [notchCenterX, 0]
  })

  return subtract(annulus, notch)
}

const main = () => {
  return extrudeLinear({ height: HEIGHT }, ring2D())
}

module.exports = { main, ring2D }
