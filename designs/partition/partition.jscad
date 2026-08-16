const { polygon, cuboid } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { subtract, union } = require('@jscad/modeling').booleans
const { rotateX, rotateY } = require('@jscad/modeling').transforms

// mm, Z up. A standing triangular partition (isoceles, base at the bottom,
// apex at the top), long and thin, with a short slot cut into its base at
// each end — sized to push-fit over a ridge from designs/totemik/ring.jscad
// (RIDGE_WIDTH x RIDGE_PROTRUSION) — while the middle of the length stays
// solid (no repeating slot).
const LENGTH = 150 // overall length
const HEIGHT = 10 // triangle height (apex above the base)
const BASE = 5 // triangle base width (at the bottom)
const SLOT_WIDTH = 1.5 // matches the ring's RIDGE_WIDTH (before tolerance)
const SLOT_DEPTH = 3 // matches the ring's RIDGE_PROTRUSION (before tolerance)
const SLOT_END_LENGTH = 6 // length of the slot at each end of the prism
const TOLERANCE = 0.15 // added to slot width/depth for a printed push-fit onto the ridge (not specified, assumed)

const main = (params = {}) => {
  const length = params.LENGTH ?? LENGTH
  const height = params.HEIGHT ?? HEIGHT
  const base = params.BASE ?? BASE
  const slotWidth = params.SLOT_WIDTH ?? SLOT_WIDTH
  const slotDepth = params.SLOT_DEPTH ?? SLOT_DEPTH
  const slotEndLength = params.SLOT_END_LENGTH ?? SLOT_END_LENGTH
  const tolerance = params.TOLERANCE ?? TOLERANCE

  // Push-fit: the slot is sized a touch larger than the ridge so that
  // typical FDM printing error (holes print undersize, pegs print
  // oversize) still leaves a snug, pushable-on fit rather than one that's
  // impossible to assemble or too loose to grip.
  const fitWidth = slotWidth + tolerance
  const fitDepth = slotDepth + tolerance

  // Built in a "natural" extrusion frame first (X = base direction, Y =
  // height direction, Z = length), then reoriented at the end so the
  // finished part stands with X = length, Y = base width, Z = height.
  const profile = polygon({ points: [[-base / 2, 0], [base / 2, 0], [0, height]] })
  const prism = extrudeLinear({ height: length }, profile)

  // Slot cutters: two short channels at the two ends of the length (Z=0 and
  // Z=length), each SLOT_END_LENGTH long, open at the Y=0 (base) face. The
  // middle of the length is left solid.
  const makeEndSlot = (zCenter) => cuboid({
    size: [fitWidth, fitDepth + 1, slotEndLength],
    center: [0, (fitDepth - 1) / 2, zCenter]
  })
  const slotCutter = union(
    makeEndSlot(slotEndLength / 2),
    makeEndSlot(length - slotEndLength / 2)
  )

  const withSlot = subtract(prism, slotCutter)

  return rotateX(Math.PI / 2, rotateY(Math.PI / 2, withSlot))
}

const getParameterDefinitions = () => [
  { name: 'LENGTH', type: 'float', initial: 150, caption: 'Overall length (mm)' },
  { name: 'HEIGHT', type: 'float', initial: 10, caption: 'Triangle height, apex above base (mm)' },
  { name: 'BASE', type: 'float', initial: 5, caption: 'Triangle base width (mm)' },
  { name: 'SLOT_WIDTH', type: 'float', initial: 1.5, caption: 'Slot width before tolerance — matches ring RIDGE_WIDTH (mm)' },
  { name: 'SLOT_DEPTH', type: 'float', initial: 3, caption: 'Slot depth before tolerance — matches ring RIDGE_PROTRUSION (mm)' },
  { name: 'SLOT_END_LENGTH', type: 'float', initial: 6, caption: 'Slot length at each end of the prism (mm)' },
  { name: 'TOLERANCE', type: 'float', initial: 0.15, caption: 'Added to slot width/depth for a printed push-fit (mm)' }
]

module.exports = { main, getParameterDefinitions }
