const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { translate, scale } = require('@jscad/modeling').transforms
const { colorize } = require('@jscad/modeling').colors

const WALL_THICKNESS = 1 // mm (design-space default)
const BOX_GAP_X = 150 // mm visual spacing between boxes in preview
const CYLINDER_SEGMENTS = 96
const OUTPUT_SCALE = 1 / 50
const MIN_PRINT_WALL_THICKNESS = 0.5 // mm required after scaling
const EFFECTIVE_WALL_THICKNESS = Math.max(
  WALL_THICKNESS,
  MIN_PRINT_WALL_THICKNESS / OUTPUT_SCALE
)

// Dimensions interpreted from screenshot as W x D x H (mm):
// breedte = width, dikte = depth, hoogte = height
const FIGURES = [
  { label: 'Figuur 1', width: 2870, depth: 200, height: 3110 },
  { label: 'Figuur 2', width: 100, depth: 1000, height: 1800 },
  { label: 'Figuur 3', width: 1470, depth: 310, height: 3000 },
  { label: 'Figuur 4', width: 660, depth: 465, height: 1620 },
  { label: 'Figuur 5', width: 800, depth: 800, height: 600 }
]

const CYLINDERS = [
  { label: 'Cylinder 1', radius: 100, height: 1000 },
  { label: 'Cylinder 2', radius: 410, height: 630 }
]

const getParameterDefinitions = () => [
  {
    name: 'objectIndex',
    type: 'int',
    initial: 0,
    caption: 'Object index (0=all, 1..7=single figure):'
  }
]

const makeOpenTopBox = ({ width, depth, height }, wall = EFFECTIVE_WALL_THICKNESS) => {

  if (width <= 2 * wall || depth <= 2 * wall || height <= wall) {
    throw new Error(
      `Invalid dimensions for hollow box (${width}x${depth}x${height}) with wall ${wall}mm`
    )
  }

  const outer = translate(
    [width / 2, depth / 2, height / 2],
    cuboid({ size: [width, depth, height] })
  )

  // Open top: cavity goes up to the top surface.
  const cavityHeight = height - wall
  const inner = translate(
    [width / 2, depth / 2, wall + cavityHeight / 2],
    cuboid({ size: [width - 2 * wall, depth - 2 * wall, cavityHeight] })
  )

  return subtract(outer, inner)
}

const makeOpenTopCylinder = ({ radius, height }, wall = EFFECTIVE_WALL_THICKNESS) => {
  if (radius <= wall || height <= wall) {
    throw new Error(
      `Invalid dimensions for hollow cylinder (R=${radius}, H=${height}) with wall ${wall}mm`
    )
  }

  const outer = translate(
    [0, 0, height / 2],
    cylinder({ height, radius, segments: CYLINDER_SEGMENTS })
  )

  // Open top: cavity reaches the top, leaving only side wall + bottom.
  const cavityHeight = height - wall
  const inner = translate(
    [0, 0, wall + cavityHeight / 2],
    cylinder({ height: cavityHeight, radius: radius - wall, segments: CYLINDER_SEGMENTS })
  )

  return subtract(outer, inner)
}

const createAllObjects = () => {
  let xCursor = 0
  const solids = FIGURES.map((figure, idx) => {
    const box = makeOpenTopBox(figure)
    const placed = translate([xCursor, 0, 0], box)
    xCursor += figure.width + BOX_GAP_X

    const color = idx % 2 === 0 ? [0.2, 0.55, 0.9, 1] : [0.95, 0.7, 0.2, 1]
    return colorize(color, placed)
  })

  CYLINDERS.forEach((spec, idx) => {
    const cyl = makeOpenTopCylinder(spec)
    const placed = translate([xCursor + spec.radius, spec.radius, 0], cyl)
    xCursor += spec.radius * 2 + BOX_GAP_X

    const color = idx % 2 === 0 ? [0.2, 0.8, 0.4, 1] : [0.7, 0.35, 0.95, 1]
    solids.push(colorize(color, placed))
  })

  return solids
}

const buildSingleObject = (index1Based) => {
  const index = Math.floor(index1Based) - 1
  if (index < 0) throw new Error('objectIndex must be >= 1 for single-object export')

  if (index < FIGURES.length) return makeOpenTopBox(FIGURES[index])

  const cylinderIndex = index - FIGURES.length
  if (cylinderIndex < CYLINDERS.length) return makeOpenTopCylinder(CYLINDERS[cylinderIndex])

  throw new Error(`objectIndex out of range: ${index1Based}. Expected 1..${FIGURES.length + CYLINDERS.length}`)
}

const boxMaker = () => union(...createAllObjects())

const main = (params = {}) => {
  const objectIndex = Number(params.objectIndex || 0)
  const raw = objectIndex > 0 ? buildSingleObject(objectIndex) : boxMaker()
  return scale([OUTPUT_SCALE, OUTPUT_SCALE, OUTPUT_SCALE], raw)
}

module.exports = {
  main,
  getParameterDefinitions,
  boxMaker,
  makeOpenTopBox,
  makeOpenTopCylinder,
  FIGURES,
  CYLINDERS,
  buildSingleObject
}
