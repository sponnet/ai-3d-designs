// Bluetooth adapter box: small open box + separate push-fit lid.
//
// Inner clear space: 46 x 21 x 8 mm, wall thickness 1.5 mm.
// One short wall has a 10 x 4 mm slot, level with the inner floor, centered.
// The lid has a lip that slides inside the box opening (friction fit).
// The box is made taller by LIP_HEIGHT so the full 46 x 21 x 8 mm stays
// free below the lip.
//
// Z up, all units mm. Box: floor on z = 0, opening up.
// Lid: modeled in print orientation (top plate on z = 0, lip pointing up).
const { primitives, booleans, transforms, extrusions, colors } = require('@jscad/modeling')
const { cuboid, roundedRectangle } = primitives
const { subtract, union } = booleans
const { translate, rotateX } = transforms
const { extrudeLinear } = extrusions
const { colorize } = colors

// --- Key dimensions ---
const INNER_X = 46
const INNER_Y = 21
const INNER_Z = 8
const WALL = 1.5 // side walls, box floor and lid plate
const LIP_HEIGHT = 2.5 // how deep the lid lip reaches into the box
const LIP_WALL = 1.2 // thickness of the lid lip
const FIT_CLEARANCE = 0.15 // gap per side between lip and box wall (push fit)
const CORNER_RADIUS = 1.5 // outer corner rounding (= WALL keeps corners 1.5 thick)
const PRINT_GAP = 8 // spacing between box and lid in the print layout
const SLOT_WIDTH = 10 // rectangular hole in the +X short wall, centered in Y
const SLOT_HEIGHT = 4 // measured up from the inner floor (z = WALL)

// --- Derived dimensions ---
const OUTER_X = INNER_X + 2 * WALL
const OUTER_Y = INNER_Y + 2 * WALL
const BOX_HEIGHT = WALL + INNER_Z + LIP_HEIGHT
const LIP_OUTER_X = INNER_X - 2 * FIT_CLEARANCE
const LIP_OUTER_Y = INNER_Y - 2 * FIT_CLEARANCE
const LIP_INNER_X = LIP_OUTER_X - 2 * LIP_WALL
const LIP_INNER_Y = LIP_OUTER_Y - 2 * LIP_WALL
const EPS = 0.01

// Rounded-corner block with its bottom on z = 0, centered in XY.
const roundedBlock = (x, y, height, radius) =>
  extrudeLinear({ height }, roundedRectangle({ size: [x, y], roundRadius: radius, segments: 32 }))

// Sharp-corner block with its bottom on z = z0, centered in XY.
const block = (x, y, height, z0 = 0) => cuboid({ size: [x, y, height], center: [0, 0, z0 + height / 2] })

const buildBox = () => {
  const outer = roundedBlock(OUTER_X, OUTER_Y, BOX_HEIGHT, CORNER_RADIUS)
  const cavity = block(INNER_X, INNER_Y, BOX_HEIGHT, WALL) // overshoots the top
  // Slot through the +X short wall only, bottom edge flush with the inner
  // floor. The cutter starts slightly inside the cavity and overshoots outward.
  const slotDepth = WALL + 2
  const slot = cuboid({
    size: [slotDepth, SLOT_WIDTH, SLOT_HEIGHT],
    center: [INNER_X / 2 - EPS + slotDepth / 2, 0, WALL + SLOT_HEIGHT / 2]
  })
  return subtract(outer, cavity, slot)
}

const buildLid = () => {
  const plate = roundedBlock(OUTER_X, OUTER_Y, WALL, CORNER_RADIUS)
  const lip = subtract(
    block(LIP_OUTER_X, LIP_OUTER_Y, LIP_HEIGHT + EPS, WALL - EPS),
    block(LIP_INNER_X, LIP_INNER_Y, LIP_HEIGHT + 2 * EPS, WALL - EPS)
  )
  return union(plate, lip)
}

const getParameterDefinitions = () => [
  {
    name: 'part',
    type: 'choice',
    caption: 'Part',
    values: ['print', 'box', 'lid', 'assembled'],
    captions: ['Box + lid (print layout)', 'Box only', 'Lid only', 'Assembled (preview)'],
    initial: 'print'
  }
]

const main = (params = {}) => {
  const choices = ['print', 'box', 'lid', 'assembled']
  const part = typeof params.part === 'number' ? choices[params.part] : params.part || 'print'

  console.log(`Box outer: ${OUTER_X} x ${OUTER_Y} x ${BOX_HEIGHT} mm, inner: ${INNER_X} x ${INNER_Y} x ${INNER_Z} mm (+${LIP_HEIGHT} lip zone)`)
  console.log(`Lid lip: ${LIP_OUTER_X.toFixed(2)} x ${LIP_OUTER_Y.toFixed(2)} mm, clearance ${FIT_CLEARANCE} mm/side`)

  const box = buildBox()
  const lid = buildLid()

  if (part === 'box') return box
  if (part === 'lid') return lid
  if (part === 'assembled') {
    // Flip the lid so the lip points down, then seat the plate on the box rim.
    const seated = translate([0, 0, BOX_HEIGHT + WALL], rotateX(Math.PI, lid))
    return [colorize([0.23, 0.48, 0.84], box), colorize([0.9, 0.55, 0.15], seated)]
  }
  // Print layout: box and lid side by side, both flat on the bed.
  return [box, translate([0, OUTER_Y + PRINT_GAP, 0], lid)]
}

module.exports = { main, getParameterDefinitions }
