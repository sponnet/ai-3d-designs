const { cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// mm, Z up, base on z = 0
const OUTER_DIAMETER = 15
const WALL_THICKNESS = 0.4
const HEIGHT = 120
const BOTTOM_THICKNESS = 2
const CYLINDER_SEGMENTS = 64

const main = (params = {}) => {
  const od = params.OUTER_DIAMETER ?? OUTER_DIAMETER
  const wall = params.WALL_THICKNESS ?? WALL_THICKNESS
  const h = params.HEIGHT ?? HEIGHT
  const bottom = params.BOTTOM_THICKNESS ?? BOTTOM_THICKNESS

  const outerR = od / 2
  const innerR = Math.max(0, outerR - wall)

  const outer = translate(
    [0, 0, h / 2],
    cylinder({ height: h, radius: outerR, segments: CYLINDER_SEGMENTS })
  )

  if (innerR <= 0 || h <= bottom) {
    return outer
  }

  // Hollow from z = bottom upward; floor is bottom mm thick (independent of wall)
  const innerH = h - bottom
  const inner = translate(
    [0, 0, bottom + innerH / 2],
    cylinder({
      height: innerH + 0.02,
      radius: innerR,
      segments: CYLINDER_SEGMENTS
    })
  )

  return subtract(outer, inner)
}

const getParameterDefinitions = () => [
  { name: 'OUTER_DIAMETER', type: 'float', initial: 15, caption: 'Outer diameter (mm)' },
  { name: 'WALL_THICKNESS', type: 'float', initial: 0.4, caption: 'Wall thickness (mm)' },
  { name: 'HEIGHT', type: 'float', initial: 120, caption: 'Total height (mm)' },
  { name: 'BOTTOM_THICKNESS', type: 'float', initial: 2, caption: 'Closed bottom thickness (mm)' }
]

module.exports = { main, getParameterDefinitions }
