const { rectangle, cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotateX } = require('@jscad/modeling').transforms

// Straight coupler that joins 2 totemik-guts.jscad pieces end to end:
// totemik-guts -> totemik-guts-coupler -> totemik-guts.
//
// Same beam cross-section (27 x 2.5mm) as totemik-guts.jscad's own beam,
// kept full-depth along the middle. At each end, a RECESS_LENGTH-long
// section is thinned to BEAM_DEPTH_TOP (same thinning as totemik-guts'
// beam top half) with 2 holes through it -- this nests with a
// totemik-guts beam's own thinned top end, exactly the lap-joint
// mechanism totemik-guts already uses for its own beamNotchSide halves,
// then bolts through the 2 aligned holes.
//
// The recess is flush with the Y=0 edge (trimmed from the +Y side),
// which is the complementary side to totemik-guts' default
// beamNotchSide = 'inner' (flush with its outer/high-Y edge) -- so this
// coupler is designed to mate with totemik-guts pieces left at that
// default setting.

const BEAM_WIDTH = 27 // matches totemik-guts.jscad's BEAM_WIDTH
const BEAM_DEPTH = 2.5 // matches totemik-guts.jscad's BEAM_DEPTH
const BEAM_DEPTH_TOP = BEAM_DEPTH / 2 // matches totemik-guts.jscad's BEAM_DEPTH_TOP

const HOLE_DIAMETER = 3 // matches totemik-guts.jscad's HOLE_DIAMETER
const HOLE_OFFSET_Z = 7 // matches totemik-guts.jscad's HOLE_OFFSET_Z
const HOLE_SEGMENTS = 48
const HOLE_OVERSHOOT = 2

// totemik-guts.jscad's beam tip (its far, ring-less end) sits at its own
// z = BEAM_HEIGHT = 100, and its 2 holes sit at TOP_CENTER_Z (= 75), i.e.
// GUTS_TIP_TO_HOLE_CENTER (= 25) back from that tip, +- HOLE_OFFSET_Z.
const GUTS_TIP_TO_HOLE_CENTER = 25 // = totemik-guts.jscad's BEAM_HEIGHT - TOP_CENTER_Z

// totemik-guts.jscad's thinned top half runs the whole second half of
// its beam, BEAM_HEIGHT / 2 = 50mm long. The recess here is sized to
// match that exactly, so it fills the guts' own recess/cutout over its
// full length rather than only the short stretch around the holes.
const RECESS_LENGTH = 50 // = totemik-guts.jscad's BEAM_HEIGHT / 2

// COUPLER_LENGTH grows with RECESS_LENGTH so a full-depth middle section
// (COUPLER_MIDDLE_LENGTH) still remains between the 2 recessed ends.
const COUPLER_MIDDLE_LENGTH = 30 // assumed -- not specified
const COUPLER_LENGTH = 2 * RECESS_LENGTH + COUPLER_MIDDLE_LENGTH

// For the lap joint, the recess's far edge is assembled flush against
// the guts' tip (so the coupler's full-depth body starts exactly where
// the guts' own thin material ends, with no collision between them) --
// meaning the recessed end sits GUTS_TIP_TO_HOLE_CENTER + HOLE_OFFSET_Z
// (= 32mm) *inside* the recess from that far edge, i.e.
// RECESS_LENGTH - GUTS_TIP_TO_HOLE_CENTER - HOLE_OFFSET_Z from the
// recess's own (near) end -- not centered on RECESS_LENGTH / 2, which
// only happens to coincide when RECESS_LENGTH = 2 * GUTS_TIP_TO_HOLE_CENTER
// (as it now does, since RECESS_LENGTH = 50 = 2 * 25).
const HOLE_CENTER_FROM_RECESS_START = RECESS_LENGTH - GUTS_TIP_TO_HOLE_CENTER

// Full-depth beam profile, spanning the whole coupler length -- the 2
// recessed ends get carved out of this afterward.
const fullBeam2D = () =>
  rectangle({ size: [BEAM_WIDTH, BEAM_DEPTH], center: [0, BEAM_DEPTH / 2] })

// Cuts a recessed end down to BEAM_DEPTH_TOP, flush with the Y=0 edge.
const endRecessCut2D = () =>
  rectangle({
    size: [BEAM_WIDTH + 2, BEAM_DEPTH - BEAM_DEPTH_TOP],
    center: [0, BEAM_DEPTH_TOP + (BEAM_DEPTH - BEAM_DEPTH_TOP) / 2]
  })

// 2 holes centered on Z, HOLE_OFFSET_Z apart, through the recess depth.
const endHoles = (z) =>
  [z - HOLE_OFFSET_Z, z + HOLE_OFFSET_Z].map((holeZ) =>
    translate(
      [0, BEAM_DEPTH_TOP / 2, holeZ],
      rotateX(
        Math.PI / 2,
        cylinder({
          radius: HOLE_DIAMETER / 2,
          height: BEAM_DEPTH_TOP + HOLE_OVERSHOOT,
          segments: HOLE_SEGMENTS
        })
      )
    )
  )

const main = () => {
  const beam = extrudeLinear({ height: COUPLER_LENGTH }, fullBeam2D())

  const cutBottom = translate(
    [0, 0, -1],
    extrudeLinear({ height: RECESS_LENGTH + 1 }, endRecessCut2D())
  )
  const cutTop = translate(
    [0, 0, COUPLER_LENGTH - RECESS_LENGTH],
    extrudeLinear({ height: RECESS_LENGTH + 1 }, endRecessCut2D())
  )
  const recessed = subtract(beam, cutBottom, cutTop)

  const holesBottom = endHoles(HOLE_CENTER_FROM_RECESS_START)
  const holesTop = endHoles(COUPLER_LENGTH - HOLE_CENTER_FROM_RECESS_START)

  return subtract(recessed, ...holesBottom, ...holesTop)
}

module.exports = { main, fullBeam2D, endRecessCut2D }
