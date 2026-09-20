const { circle } = require('@jscad/modeling').primitives
const { hull } = require('@jscad/modeling').hulls
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms

// mm, Z up. Leg lies flat in the XY plane and is extruded along +Z.
// Proximal (hub) end is centered at the origin, tapered tip is at
// x = LEG_LENGTH. Single tripod leg, styled after the Insta360 tripod
// mount (cults3d.com/en/3d-model/gadget/insta360-tripod): a flat tapered
// blade with a rounded knuckle at the hub end.
//
// Variation from the reference: the proximal pivot hole is replaced by
// an elongated slot running lengthwise along the leg's own long axis, so
// the pivot screw can both pivot the leg AND slide along the slot. Once
// the legs are folded flat against the pole, the leg can be pushed
// further up (screw sliding toward the tip end of the slot) to tuck it
// closer against the pole for a more compact folded profile.

const LEG_LENGTH = 130 // proximal center to tip
const PROXIMAL_DIAMETER = 20 // blade width at the hub end
const DISTAL_DIAMETER = 4 // blade width at the tip
const THICKNESS = 4.5 // flat blade thickness

const SLOT_SCREW_DIAMETER = 5 // clearance diameter for the pivot screw shaft
const SLOT_TRAVEL = 22 // how far the screw can slide inside the slot
const SLOT_START_OFFSET = 9 // distance from the proximal center to where the slot travel starts
const SEGMENTS = 48

// Tapered blade outline: hull of a wide circle at the hub end and a
// narrow circle at the tip gives a smooth taper plus a rounded knuckle
// for free (no separate fillet needed at the pivot end).
const legBlade2D = (length, proximalDiameter, distalDiameter) => {
  const proximal = circle({ radius: proximalDiameter / 2, segments: SEGMENTS })
  const distal = translate([length, 0, 0], circle({ radius: distalDiameter / 2, segments: SEGMENTS }))
  return hull(proximal, distal)
}

// Lengthwise pivot slot: hull of two equal circles spaced along the
// blade's long axis, i.e. a stadium shape running toward the tip.
const pivotSlot2D = (startOffset, travel, screwDiameter) => {
  const r = screwDiameter / 2
  const near = translate([startOffset, 0, 0], circle({ radius: r, segments: SEGMENTS }))
  const far = translate([startOffset + travel, 0, 0], circle({ radius: r, segments: SEGMENTS }))
  return hull(near, far)
}

const main = (params = {}) => {
  const legLength = params.LEG_LENGTH ?? LEG_LENGTH
  const proximalDiameter = params.PROXIMAL_DIAMETER ?? PROXIMAL_DIAMETER
  const distalDiameter = params.DISTAL_DIAMETER ?? DISTAL_DIAMETER
  const thickness = params.THICKNESS ?? THICKNESS
  const screwDiameter = params.SLOT_SCREW_DIAMETER ?? SLOT_SCREW_DIAMETER
  const slotTravel = params.SLOT_TRAVEL ?? SLOT_TRAVEL
  const slotStartOffset = params.SLOT_START_OFFSET ?? SLOT_START_OFFSET

  const blade = extrudeLinear({ height: thickness }, legBlade2D(legLength, proximalDiameter, distalDiameter))

  const slotCutter = translate(
    [0, 0, -1],
    extrudeLinear({ height: thickness + 2 }, pivotSlot2D(slotStartOffset, slotTravel, screwDiameter))
  )

  return subtract(blade, slotCutter)
}

const getParameterDefinitions = () => [
  { name: 'LEG_LENGTH', type: 'float', initial: LEG_LENGTH, caption: 'Leg length (mm)' },
  { name: 'PROXIMAL_DIAMETER', type: 'float', initial: PROXIMAL_DIAMETER, caption: 'Width at hub end (mm)' },
  { name: 'DISTAL_DIAMETER', type: 'float', initial: DISTAL_DIAMETER, caption: 'Width at tip (mm)' },
  { name: 'THICKNESS', type: 'float', initial: THICKNESS, caption: 'Blade thickness (mm)' },
  { name: 'SLOT_SCREW_DIAMETER', type: 'float', initial: SLOT_SCREW_DIAMETER, caption: 'Pivot screw clearance diameter (mm)' },
  { name: 'SLOT_TRAVEL', type: 'float', initial: SLOT_TRAVEL, caption: 'Slot travel / slide distance (mm)' },
  { name: 'SLOT_START_OFFSET', type: 'float', initial: SLOT_START_OFFSET, caption: 'Distance from proximal center to slot start (mm)' }
]

module.exports = { main, getParameterDefinitions, legBlade2D, pivotSlot2D }
