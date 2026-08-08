const { polygon, roundedRectangle } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms

// Number of Dupont connector housings held side by side.
const CONNECTOR_COUNT = 8

// Single-housing pocket, sized for one Dupont/KK-2.54 style single-row
// female connector housing. Measure your own connectors and adjust if the
// fit is too tight/loose.
const SLOT_WIDTH = 2.6
const SLOT_HEIGHT = 2.8

// Wall separating two neighbouring connector pockets.
const DIVIDER_THICKNESS = 1.2

// Outer clamp walls around the row of pockets.
const OUTER_SIDE_WALL = 2.5
const OUTER_TOP_BOTTOM_WALL = 2

// How far the clamp grips along the connector housings (front-to-back).
const BODY_THICKNESS = 8

const CORNER_RADIUS = 3
const CORNER_SEGMENTS = 32

// Small polarizing key tab moulded into the left wall of every pocket, so a
// connector can only be inserted the "right way round" (matches the keyed
// slot shown in the reference picture).
const KEY_TAB_ENABLED = true
const KEY_TAB_DEPTH = 0.6
const KEY_TAB_HEIGHT = 1
const KEY_TAB_TOP_MARGIN = 0.6

const clampCount = (count) => Math.max(1, Math.round(count))

const totalWidth = (count) =>
  count * SLOT_WIDTH + (count - 1) * DIVIDER_THICKNESS + 2 * OUTER_SIDE_WALL

const totalHeight = () => SLOT_HEIGHT + 2 * OUTER_TOP_BOTTOM_WALL

// 2D outline of a single connector pocket (hole to subtract), local origin
// at the pocket's bottom-left corner, X to the right, Y up. When
// KEY_TAB_ENABLED, a small tab of material is left behind on the left wall
// so the pocket boundary steps inward there instead of running straight.
const connectorSlot2D = () => {
  if (!KEY_TAB_ENABLED) {
    return polygon({
      points: [
        [0, 0],
        [SLOT_WIDTH, 0],
        [SLOT_WIDTH, SLOT_HEIGHT],
        [0, SLOT_HEIGHT]
      ]
    })
  }

  const tabTop = SLOT_HEIGHT - KEY_TAB_TOP_MARGIN
  const tabBottom = tabTop - KEY_TAB_HEIGHT

  return polygon({
    points: [
      [0, 0],
      [SLOT_WIDTH, 0],
      [SLOT_WIDTH, SLOT_HEIGHT],
      [0, SLOT_HEIGHT],
      [0, tabTop],
      [KEY_TAB_DEPTH, tabTop],
      [KEY_TAB_DEPTH, tabBottom],
      [0, tabBottom]
    ]
  })
}

const clampBody2D = (count) => {
  const width = totalWidth(count)
  const height = totalHeight()

  const body = roundedRectangle({
    size: [width, height],
    roundRadius: CORNER_RADIUS,
    segments: CORNER_SEGMENTS
  })

  const xStart = -width / 2 + OUTER_SIDE_WALL
  const yStart = -height / 2 + OUTER_TOP_BOTTOM_WALL

  const slots = []
  for (let i = 0; i < count; i++) {
    const x = xStart + i * (SLOT_WIDTH + DIVIDER_THICKNESS)
    slots.push(translate([x, yStart, 0], connectorSlot2D()))
  }

  return subtract(body, ...slots)
}

const main = (params = {}) => {
  const count = clampCount(params.connectorCount ?? CONNECTOR_COUNT)
  return extrudeLinear({ height: BODY_THICKNESS }, clampBody2D(count))
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

module.exports = { main, getParameterDefinitions, clampBody2D, connectorSlot2D }
