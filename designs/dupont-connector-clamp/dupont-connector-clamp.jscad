const { cuboid } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans

// Number of Dupont connector housings held side by side.
const CONNECTOR_COUNT = 8

// Width taken up by one connector housing; the cutout width is
// CONNECTOR_COUNT * SLOT_WIDTH. Measure your own connectors and adjust if
// the fit is too tight/loose.
const SLOT_WIDTH = 2.6
const SLOT_HEIGHT = 2.8

// Outer clamp walls around the cutout.
const OUTER_SIDE_WALL = 2.5
const OUTER_TOP_BOTTOM_WALL = 2

// How far the clamp grips along the connector housings (front-to-back).
const BODY_THICKNESS = 8

const clampCount = (count) => Math.max(1, Math.round(count))

const cutoutWidth = (count) => count * SLOT_WIDTH

const bodyWidth = (count) => cutoutWidth(count) + 2 * OUTER_SIDE_WALL

const bodyHeight = () => SLOT_HEIGHT + 2 * OUTER_TOP_BOTTOM_WALL

const main = (params = {}) => {
  const count = clampCount(params.connectorCount ?? CONNECTOR_COUNT)

  const body = cuboid({
    size: [bodyWidth(count), bodyHeight(), BODY_THICKNESS]
  })

  const cutout = cuboid({
    size: [cutoutWidth(count), SLOT_HEIGHT, BODY_THICKNESS + 2]
  })

  return subtract(body, cutout)
}

const getParameterDefinitions = () => [
  {
    name: 'connectorCount',
    type: 'int',
    initial: CONNECTOR_COUNT,
    min: 1,
    max: 40,
    caption: 'Number of Dupont connectors'
  }
]

module.exports = { main, getParameterDefinitions }
