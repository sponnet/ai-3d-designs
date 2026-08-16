const { polygon, cuboid } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { subtract, union } = require('@jscad/modeling').booleans
const { rotateX, rotateY } = require('@jscad/modeling').transforms

// mm, Z up. A standing trapezoidal partition (isoceles, wide base at the
// bottom, flat truncated top), long and thin, with a short slot cut into
// its base at each end — sized to push-fit over a ridge from
// designs/totemik/ring.jscad (RIDGE_WIDTH x RIDGE_PROTRUSION) — while the
// middle of the length stays solid (no repeating slot). The flat top is
// scalloped along its full length with small rectangular notches,
// cross-wise (perpendicular to the length), evenly spaced.
const LENGTH = 150 // overall length
const HEIGHT = 10 // trapezoid height (top above the base)
const BASE = 5 // trapezoid base width (at the bottom)
const TOP_WIDTH = 2 // flat trapezoid top width, cut before the notches
const SLOT_WIDTH = 1.5 // matches the ring's RIDGE_WIDTH (before tolerance)
const SLOT_DEPTH = 3 // matches the ring's RIDGE_PROTRUSION (before tolerance)
const SLOT_END_LENGTH = 6 // length of the slot at each end of the prism
const TOLERANCE = 0.15 // added to slot width/depth for a printed push-fit onto the ridge (not specified, assumed)
const NOTCH_WIDTH = 1 // width of each rectangular notch (its footprint along the length)
const NOTCH_DEPTH = 1 // depth of each notch, from the ridge downward (not specified, assumed)
const NOTCH_SPACING = 2 // spacing between notch centers along the length

const main = (params = {}) => {
  const length = params.LENGTH ?? LENGTH
  const height = params.HEIGHT ?? HEIGHT
  const base = params.BASE ?? BASE
  const topWidth = params.TOP_WIDTH ?? TOP_WIDTH
  const slotWidth = params.SLOT_WIDTH ?? SLOT_WIDTH
  const slotDepth = params.SLOT_DEPTH ?? SLOT_DEPTH
  const slotEndLength = params.SLOT_END_LENGTH ?? SLOT_END_LENGTH
  const tolerance = params.TOLERANCE ?? TOLERANCE
  const notchWidth = params.NOTCH_WIDTH ?? NOTCH_WIDTH
  const notchDepth = params.NOTCH_DEPTH ?? NOTCH_DEPTH
  const notchSpacing = params.NOTCH_SPACING ?? NOTCH_SPACING

  // Push-fit: the slot is sized a touch larger than the ridge so that
  // typical FDM printing error (holes print undersize, pegs print
  // oversize) still leaves a snug, pushable-on fit rather than one that's
  // impossible to assemble or too loose to grip.
  const fitWidth = slotWidth + tolerance
  const fitDepth = slotDepth + tolerance

  // Built in a "natural" extrusion frame first (X = base direction, Y =
  // height direction, Z = length), then reoriented at the end so the
  // finished part stands with X = length, Y = base width, Z = height. The
  // profile is a trapezoid (blunt, flat top) rather than a sharp-apex
  // triangle, so the notches below have a flat surface to cut into.
  const profile = polygon({
    points: [[-base / 2, 0], [base / 2, 0], [topWidth / 2, height], [-topWidth / 2, height]]
  })
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

  // Notch cutters: rectangular slots cut straight down into the top ridge
  // (natural X=0, Y=height), crosswise to the ridge (which runs along
  // natural Z), full width across the ridge (natural X) so each cut passes
  // cleanly through. NOTCH_DEPTH is free to be anything — it's no longer
  // tied to a rounded profile — so the notch can be made as deep as needed.
  // Repeated every NOTCH_SPACING along the full length.
  const makeNotchAt = (z) => cuboid({
    size: [base + 2, notchDepth, notchWidth],
    center: [0, height - notchDepth / 2, z]
  })
  const notches = []
  for (let z = 0; z <= length; z += notchSpacing) {
    notches.push(makeNotchAt(z))
  }
  const notchCutter = union(...notches)

  const withCuts = subtract(prism, slotCutter, notchCutter)

  return rotateX(Math.PI / 2, rotateY(Math.PI / 2, withCuts))
}

const getParameterDefinitions = () => [
  { name: 'LENGTH', type: 'float', initial: 150, caption: 'Overall length (mm)' },
  { name: 'HEIGHT', type: 'float', initial: 10, caption: 'Trapezoid height, top above base (mm)' },
  { name: 'BASE', type: 'float', initial: 5, caption: 'Trapezoid base width (mm)' },
  { name: 'TOP_WIDTH', type: 'float', initial: 2, caption: 'Flat trapezoid top width (mm)' },
  { name: 'SLOT_WIDTH', type: 'float', initial: 1.5, caption: 'Slot width before tolerance — matches ring RIDGE_WIDTH (mm)' },
  { name: 'SLOT_DEPTH', type: 'float', initial: 3, caption: 'Slot depth before tolerance — matches ring RIDGE_PROTRUSION (mm)' },
  { name: 'SLOT_END_LENGTH', type: 'float', initial: 6, caption: 'Slot length at each end of the prism (mm)' },
  { name: 'TOLERANCE', type: 'float', initial: 0.15, caption: 'Added to slot width/depth for a printed push-fit (mm)' },
  { name: 'NOTCH_WIDTH', type: 'float', initial: 1, caption: 'Width of each top-ridge notch (mm)' },
  { name: 'NOTCH_DEPTH', type: 'float', initial: 1, caption: 'Depth of each top-ridge notch (mm)' },
  { name: 'NOTCH_SPACING', type: 'float', initial: 2, caption: 'Spacing between top-ridge notches (mm)' }
]

module.exports = { main, getParameterDefinitions }
