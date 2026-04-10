const { polygon, rectangle, circle, cuboid, cylinder } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { subtract, union } = require('@jscad/modeling').booleans
const { translate, rotateZ } = require('@jscad/modeling').transforms
const { colorize } = require('@jscad/modeling').colors
const { expand } = require('@jscad/modeling').expansions

const longSide = 61.6
const shortSide = 33.5
const bladeHeight = 19
const gapDiameter = 3.5
const gapDepth = 4.5
const gapDistance = 3
const thickness = 0.6
const segments = 48
const bladeClearance = 0.1

const blockLength = 80
const blockWidth = 22
const topBlockThickness = 4.5
const middleBlockThickness = 3

const bladeInsideDepth = 4.5
const bladeOutsideProtrusion = 4.

const screwHoleDiameter = 3.1
const screwHoleOffsetX = 10

const DEBUG = 1

const rotatePointZ = (angle, point) => {
  const [x, y] = point
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [
    x * c - y * s,
    x * s + y * c
  ]
}

const holeAlongZ = (x, yCenter, zCenter, diameter, length) => {
  return translate(
    [x, yCenter, zCenter],
    cylinder({ height: length, radius: diameter / 2, segments: 48 })
  )
}

const utilityKnifeBlade2D = () => {
  const blade = polygon({
    points: [
      [-longSide / 2, bladeHeight],
      [-shortSide / 2, 0],
      [ shortSide / 2, 0],
      [ longSide / 2, bladeHeight]
    ]
  })

  const notches = [-1, 1].map((i) => {
    const x = -gapDiameter / 2 + i * (gapDistance / 2 + gapDiameter / 2)

    const slot = translate(
      [x + gapDiameter / 2, (gapDepth - gapDiameter / 2) / 2],
      rectangle({ size: [gapDiameter, gapDepth - gapDiameter / 2] })
    )

    const cap = translate(
      [x + gapDiameter / 2, gapDepth - gapDiameter / 2],
      circle({ radius: gapDiameter / 2, segments })
    )

    return union(slot, cap)
  })

  const bladeWithNotches = subtract(blade,...notches)

  // Add 0.1 mm tolerance on the 2D blade profile using expansions.expand
  return expand({ delta: 0.1 }, bladeWithNotches)
}

const utilityKnifeBlade = () => {
  return translate(
    [0, 0, -thickness / 2],
    extrudeLinear({ height: thickness }, utilityKnifeBlade2D())
  )
}

const utilityKnifeBladeCavity = () => {
  const expandedBlade2D =  utilityKnifeBlade2D()

  return translate(
    [0, 0, -thickness / 2],
    extrudeLinear({ height: thickness }, expandedBlade2D)
  )
}

const bladePlacementData = () => {
  const leftTip = [-longSide / 2, bladeHeight]
  const rightTip = [longSide / 2, bladeHeight]

  const bladeTipDelta = bladeInsideDepth + bladeOutsideProtrusion
  const angle = Math.asin(bladeTipDelta / longSide)

  const leftTipRot = rotatePointZ(angle, leftTip)
  const rightTipRot = rotatePointZ(angle, rightTip)

  const edgeMidX = (leftTipRot[0] + rightTipRot[0]) / 2
  const tx = blockLength / 2 - edgeMidX

  // Position so left tip is bladeInsideDepth inside the block
  const ty = (blockWidth - bladeInsideDepth) - leftTipRot[1]
  const tz = thickness / 2

  return {
    angle,
    tx,
    ty,
    tz
  }
}

const placeBladeAgainstSide = (bladeShape) => {
  const p = bladePlacementData()

  return translate(
    [p.tx, p.ty, p.tz],
    rotateZ(p.angle, bladeShape)
  )
}

const baseHoleGeometry = () => {
  const zMin = -middleBlockThickness
  const zMax = topBlockThickness
  const holeCenterZ = (zMin + zMax) / 2
  const holeLength = (zMax - zMin) + 4
  const holeCenterY = blockWidth / 2

  const leftHole = holeAlongZ(
    screwHoleOffsetX,
    holeCenterY,
    holeCenterZ,
    screwHoleDiameter,
    holeLength
  )

  const rightHole = holeAlongZ(
    blockLength - screwHoleOffsetX,
    holeCenterY,
    holeCenterZ,
    screwHoleDiameter,
    holeLength
  )

  return { leftHole, rightHole }
}

const topBlock = () => {
  const baseHoles = baseHoleGeometry()

  const mainBlock = translate(
    [blockLength / 2, blockWidth / 2, topBlockThickness / 2],
    cuboid({ size: [blockLength, blockWidth, topBlockThickness] })
  )

  // Extra block on top: 2 mm high, overhanging 5 mm toward the blade side.
  const extraHeight = 2
  const overhang = 5

  const extraBlock = translate(
    [
      blockLength / 2,
      blockWidth / 2 + overhang / 2, // extend toward blade side
      topBlockThickness + extraHeight / 2
    ],
    cuboid({ size: [blockLength, blockWidth + overhang, extraHeight] })
  )

  const blockSolid = union(mainBlock, extraBlock)

  const blade = placeBladeAgainstSide(utilityKnifeBladeCavity())

  return subtract(blockSolid, blade, baseHoles.leftHole, baseHoles.rightHole)
}

const middleBlock = () => {
  const baseHoles = baseHoleGeometry()

  const blockSolid = translate(
    [blockLength / 2, blockWidth / 2, -middleBlockThickness / 2],
    cuboid({ size: [blockLength, blockWidth, middleBlockThickness] })
  )

  return subtract(blockSolid, baseHoles.leftHole, baseHoles.rightHole)
}

const bladeVisual = () => {
  return colorize(
    [1, 0, 0, 0.9],
    placeBladeAgainstSide(utilityKnifeBlade())
  )
}

const assembly = () => {
  return [
    colorize([0.8, 0.8, 0.8, 1], topBlock()),
    colorize([0.5, 0.7, 1.0, 1], middleBlock()),
    ...(DEBUG ? [bladeVisual()] : [])
  ]
}

const getParameterDefinitions = () => {
  return [
    {
      name: 'part',
      type: 'choice',
      caption: 'Part',
      values: ['assembly', 'top', 'middle', 'blade'],
      captions: ['Assembly', 'Top block', 'Middle block', 'Blade (visual)'],
      initial: 'assembly'
    }
  ]
}

// Browser workflow for exporting:
// 1) Choose a value for "Part" in the parameters UI.
// 2) Wait for regeneration.
// 3) Use Export → STL to save the current part, then repeat for other parts.

const main = (params = {}) => {
  const part = params.part || 'assembly'

  if (part === 'top') {
    return topBlock()
  }

  if (part === 'middle') {
    return middleBlock()
  }

  if (part === 'blade') {
    return bladeVisual()
  }

  return assembly()
}

module.exports = {
  main,
  getParameterDefinitions,
  topBlock,
  middleBlock,
  utilityKnifeBlade,
  bladeVisual,
  assembly
}
