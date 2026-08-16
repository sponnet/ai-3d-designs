const { polygon, cuboid } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { subtract } = require('@jscad/modeling').booleans
const { rotateX, rotateY } = require('@jscad/modeling').transforms

// mm, Z up. A standing triangular partition (isoceles, base at the bottom,
// apex at the top), long and thin, with a slot cut into its base sized to
// clip over the ridges from designs/totemik/ring.jscad (RIDGE_WIDTH x
// RIDGE_PROTRUSION). The slot runs the full length but is interrupted with
// periodic solid bridges so it prints without needing bridging support.
const LENGTH = 150 // overall length
const HEIGHT = 10 // triangle height (apex above the base)
const BASE = 5 // triangle base width (at the bottom)
const SLOT_WIDTH = 1.5 // matches the ring's RIDGE_WIDTH
const SLOT_DEPTH = 3 // matches the ring's RIDGE_PROTRUSION
const SLOT_PERIOD = 10 // spacing between slot interruptions
const SLOT_BRIDGE_WIDTH = 1 // width of each solid bridge interrupting the slot (not specified, assumed)

const main = (params = {}) => {
  const length = params.LENGTH ?? LENGTH
  const height = params.HEIGHT ?? HEIGHT
  const base = params.BASE ?? BASE
  const slotWidth = params.SLOT_WIDTH ?? SLOT_WIDTH
  const slotDepth = params.SLOT_DEPTH ?? SLOT_DEPTH
  const slotPeriod = params.SLOT_PERIOD ?? SLOT_PERIOD
  const slotBridgeWidth = params.SLOT_BRIDGE_WIDTH ?? SLOT_BRIDGE_WIDTH

  // Built in a "natural" extrusion frame first (X = base direction, Y =
  // height direction, Z = length), then reoriented at the end so the
  // finished part stands with X = length, Y = base width, Z = height.
  const profile = polygon({ points: [[-base / 2, 0], [base / 2, 0], [0, height]] })
  const prism = extrudeLinear({ height: length }, profile)

  // Slot cutter: a continuous channel along Z (length), open at the Y=0
  // (base) face, minus small "bridge" blockers every SLOT_PERIOD so the cut
  // stays interrupted instead of running the full length.
  const fullSlot = cuboid({
    size: [slotWidth, slotDepth + 1, length + 2],
    center: [0, (slotDepth - 1) / 2, length / 2]
  })
  const bridges = []
  for (let z = slotPeriod; z < length; z += slotPeriod) {
    bridges.push(cuboid({
      size: [slotWidth + 1, slotDepth + 2, slotBridgeWidth],
      center: [0, (slotDepth - 1) / 2, z]
    }))
  }
  const slotCutter = bridges.length > 0 ? subtract(fullSlot, ...bridges) : fullSlot

  const withSlot = subtract(prism, slotCutter)

  return rotateX(Math.PI / 2, rotateY(Math.PI / 2, withSlot))
}

const getParameterDefinitions = () => [
  { name: 'LENGTH', type: 'float', initial: 150, caption: 'Overall length (mm)' },
  { name: 'HEIGHT', type: 'float', initial: 10, caption: 'Triangle height, apex above base (mm)' },
  { name: 'BASE', type: 'float', initial: 5, caption: 'Triangle base width (mm)' },
  { name: 'SLOT_WIDTH', type: 'float', initial: 1.5, caption: 'Slot width — matches ring RIDGE_WIDTH (mm)' },
  { name: 'SLOT_DEPTH', type: 'float', initial: 3, caption: 'Slot depth — matches ring RIDGE_PROTRUSION (mm)' },
  { name: 'SLOT_PERIOD', type: 'float', initial: 10, caption: 'Spacing between slot interruptions (mm)' },
  { name: 'SLOT_BRIDGE_WIDTH', type: 'float', initial: 1, caption: 'Width of each solid bridge interrupting the slot (mm)' }
]

module.exports = { main, getParameterDefinitions }
