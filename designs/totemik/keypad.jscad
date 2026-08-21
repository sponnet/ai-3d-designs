const { rectangle, roundedRectangle, circle } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions

// Minimalist bar with 4 Cherry MX switch cutouts side by side, plus 2
// mounting tabs (each with a 3mm screw hole) at the bottom corners, for
// screwing the whole keypad onto something.
//
// Hole size (14x14mm, square) and plate thickness (1.8mm) match the
// standard Cherry MX plate spec measured from the reference
// 3MechanicalButtons.3mf. Hole spacing uses the standard 19.05mm MX/
// keycap pitch so 1u keycaps don't collide; everything else (margins,
// tabs) is kept as small as reasonably possible for a minimalist size.

const HOLE_SIZE = 14
const HOLE_PITCH = 19.05 // standard MX/keycap center spacing
const NUM_KEYS = 4
const PLATE_THICKNESS = 1.8

const MARGIN_X = 4 // minimal material beyond the outer hole edges, left/right
const MARGIN_Y = 4 // minimal material above/below the hole edges
const PLATE_CORNER_RADIUS = 2

const PLATE_LENGTH = 2 * MARGIN_X + HOLE_SIZE + (NUM_KEYS - 1) * HOLE_PITCH
const PLATE_HEIGHT = 2 * MARGIN_Y + HOLE_SIZE

const TAB_WIDTH = 10 // how far each tab sticks out past the plate's end
const TAB_HEIGHT = 10 // tab's own Y extent, aligned to the plate's bottom edge
const TAB_CORNER_RADIUS = 3
const TAB_HOLE_DIAMETER = 3
const TAB_OVERLAP = 1 // extra reach into the plate, for a solid union join

const keyHoleCenters = () => {
  const firstX = MARGIN_X + HOLE_SIZE / 2
  const centers = []
  for (let i = 0; i < NUM_KEYS; i++) centers.push(firstX + i * HOLE_PITCH)
  return centers
}

const plate2D = () => {
  const base = roundedRectangle({
    size: [PLATE_LENGTH, PLATE_HEIGHT],
    center: [PLATE_LENGTH / 2, PLATE_HEIGHT / 2],
    roundRadius: PLATE_CORNER_RADIUS,
    segments: 16
  })
  const holes = keyHoleCenters().map((x) =>
    rectangle({ size: [HOLE_SIZE, HOLE_SIZE], center: [x, PLATE_HEIGHT / 2] })
  )
  return subtract(base, union(...holes))
}

// Tabs sit at the bottom (Y: 0..TAB_HEIGHT) of each end, reaching TAB_OVERLAP
// past the plate's edge so the union is a solid join, not just edge-touching.
const tab2D = (side) => {
  const cx =
    side === 'left'
      ? -TAB_WIDTH / 2 + TAB_OVERLAP
      : PLATE_LENGTH + TAB_WIDTH / 2 - TAB_OVERLAP
  const body = roundedRectangle({
    size: [TAB_WIDTH, TAB_HEIGHT],
    center: [cx, TAB_HEIGHT / 2],
    roundRadius: TAB_CORNER_RADIUS,
    segments: 16
  })
  const hole = circle({ radius: TAB_HOLE_DIAMETER / 2, segments: 32, center: [cx, TAB_HEIGHT / 2] })
  return subtract(body, hole)
}

const keypad2D = () => union(plate2D(), tab2D('left'), tab2D('right'))

const main = () => extrudeLinear({ height: PLATE_THICKNESS }, keypad2D())

module.exports = { main, keypad2D, plate2D }
