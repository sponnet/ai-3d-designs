// Bluetooth adapter box: small open box + separate push-fit lid.
//
// Inner clear space: 46 x 21 x 8 mm, wall thickness 1.5 mm.
// One short wall has a 10 x 4 mm slot, level with the inner floor, centered.
// The long wall to its right (counterclockwise seen from above) has a 6 mm
// round hole touching the inner floor, 15 mm from the slot wall's inner face.
// The lid has a lip that slides inside the box opening (friction fit) and a
// round speaker-style grille of parallel slots.
// The box is made taller by LIP_HEIGHT so the full 46 x 21 x 8 mm stays
// free below the lip.
//
// Z up, all units mm. Box: floor on z = 0, opening up.
// Lid: modeled in print orientation (top plate on z = 0, lip pointing up).
const { primitives, booleans, transforms, extrusions, colors } = require('@jscad/modeling')
const { cuboid, cylinder, roundedRectangle } = primitives
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
const LIP_WALL = 1.4 // thickness of the lid lip
// Nominal gap per side between lip and box wall (negative = slight overlap).
// A first print with 0.15 had ~0.5 mm total play, i.e. the printer runs
// ~0.2 mm loose overall, so the lip is now 0.4 mm wider in X and Y.
const FIT_CLEARANCE = -0.05
const CORNER_RADIUS = 1.5 // outer corner rounding (= WALL keeps corners 1.5 thick)
const PRINT_GAP = 8 // spacing between box and lid in the print layout
const SLOT_WIDTH = 10 // rectangular hole in the +X short wall, centered in Y
const SLOT_HEIGHT = 4 // measured up from the inner floor (z = WALL)
const ROUND_HOLE_DIAMETER = 6 // round hole in the +Y long wall, touching the inner floor
const ROUND_HOLE_OFFSET = 15 // hole center distance from the +X wall's inner face
const GRILLE_DIAMETER = 17 // circle the lid slots are cut within, centered on the lid
const GRILLE_SLOT_WIDTH = 1 // slots run along Y, rounded ends
const GRILLE_SLOT_PITCH = 1.9 // center-to-center along X (bar = pitch - width)
const GRILLE_MIN_SLOT_LENGTH = 3 // drop slots near the circle edge shorter than this

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
  // Round hole through the +Y long wall; axis along Y, bottom of the circle
  // tangent to the inner floor.
  const roundHole = translate(
    [INNER_X / 2 - ROUND_HOLE_OFFSET, INNER_Y / 2 - EPS + slotDepth / 2, WALL + ROUND_HOLE_DIAMETER / 2],
    rotateX(Math.PI / 2, cylinder({ radius: ROUND_HOLE_DIAMETER / 2, height: slotDepth, segments: 48 }))
  )
  return subtract(outer, cavity, slot, roundHole)
}

// Slot X positions and lengths: a slot at x stays inside the grille circle
// when its rounded end-cap circles do, so
// halfLength = w/2 + sqrt((r - w/2)^2 - x^2).
const grilleSlots = () => {
  const r = GRILLE_DIAMETER / 2
  const w = GRILLE_SLOT_WIDTH
  const slots = []
  for (let i = 0; i * GRILLE_SLOT_PITCH + w / 2 < r; i++) {
    const x = i * GRILLE_SLOT_PITCH
    const length = 2 * (w / 2 + Math.sqrt((r - w / 2) ** 2 - x ** 2))
    if (length < GRILLE_MIN_SLOT_LENGTH) break
    slots.push({ x, length })
    if (i > 0) slots.push({ x: -x, length })
  }
  return slots.sort((a, b) => a.x - b.x)
}

const buildLid = () => {
  const slots = grilleSlots()
  const cutters = slots.map(({ x, length }) =>
    translate(
      [x, 0, -1],
      extrudeLinear(
        { height: WALL + 2 },
        roundedRectangle({ size: [GRILLE_SLOT_WIDTH, length], roundRadius: GRILLE_SLOT_WIDTH / 2 - EPS, segments: 16 })
      )
    )
  )
  // Cut the slots from the plate alone, then add the lip.
  const plate = subtract(roundedBlock(OUTER_X, OUTER_Y, WALL, CORNER_RADIUS), ...cutters)
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
  const slots = grilleSlots()
  console.log(`Grille: ${slots.length} slots of ${GRILLE_SLOT_WIDTH} mm in a ${GRILLE_DIAMETER} mm circle, lengths ${slots.map((s) => s.length.toFixed(1)).join(' / ')} mm`)

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
