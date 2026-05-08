const { cylinder } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

const INNER_DIAMETER = 14.1
const SHELL_THICKNESS = 1
const CYLINDER_HEIGHT = 7
const FLANGE_DIAMETER = 30
const FLANGE_HEIGHT = 2
const SEGMENTS = 96
const RIB_COUNT = 24
const RIB_RADIUS = 1
const EPSILON = 0.05

const zBottomCylinder = ({ zBottom, height, radius, segments }) =>
  cylinder({
    height,
    radius,
    segments,
    center: [0, 0, zBottom + (height / 2)]
  })

const main = () => {
  const outerRadius = (INNER_DIAMETER / 2) + SHELL_THICKNESS
  const innerRadius = INNER_DIAMETER / 2
  const flangeRadius = FLANGE_DIAMETER / 2
  const flangeZ = 0
  const cylinderZ = flangeZ + FLANGE_HEIGHT
  const totalHeight = FLANGE_HEIGHT + CYLINDER_HEIGHT

  const flangeRibs = Array.from({ length: RIB_COUNT }, (_, index) => {
    const angle = (index / RIB_COUNT) * Math.PI * 2
    const ribX = Math.cos(angle) * flangeRadius
    const ribY = Math.sin(angle) * flangeRadius
    return translate(
      [ribX, ribY, 0],
      zBottomCylinder({ zBottom: flangeZ, height: FLANGE_HEIGHT, radius: RIB_RADIUS, segments: 24 })
    )
  })

  const outerBody = union(
    union(
      zBottomCylinder({ zBottom: flangeZ, height: FLANGE_HEIGHT, radius: flangeRadius, segments: SEGMENTS }),
      ...flangeRibs
    ),
    translate(
      [0, 0, 0],
      zBottomCylinder({ zBottom: cylinderZ, height: CYLINDER_HEIGHT, radius: outerRadius, segments: SEGMENTS })
    )
  )

  const throughHole = zBottomCylinder({
    zBottom: flangeZ - EPSILON,
    height: totalHeight + (2 * EPSILON),
    radius: innerRadius,
    segments: SEGMENTS
  })

  return subtract(outerBody, throughHole)
}

module.exports = { main }
