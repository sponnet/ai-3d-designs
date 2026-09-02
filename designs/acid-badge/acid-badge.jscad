const { circle } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms

// Acid badge: a circular band with 24 evenly-spaced 3mm holes running
// through it, 5mm center-to-center apart.
//
// Only the hole count (24), hole diameter (3mm) and hole spacing (5mm)
// were specified. Since evenly spacing 24 holes 5mm apart automatically
// closes into a full ring (no separate "how far around" angle needed),
// that's the reading used here, rather than inventing an arbitrary
// partial-arc angle. "Spacing" is read as the straight-line (chord)
// distance between adjacent hole centers -- the number you'd actually
// measure with calipers -- which fixes the ring's radius:
//   angleStep = 360 / HOLE_COUNT
//   RADIUS = HOLE_SPACING / (2 * sin(angleStep / 2))
// The band's own width and thickness aren't specified either, so
// they're assumed (kept modest, just enough margin around each hole).

const HOLE_DIAMETER = 3
const HOLE_COUNT = 24
const HOLE_SPACING = 5 // chord distance between adjacent hole centers

const BAND_WIDTH = 6 // assumed -- radial width of the band, leaving
// 1.5mm of material on each side of a hole
const THICKNESS = 3 // assumed -- extrusion height

const SEGMENTS = 64

const ANGLE_STEP_DEG = 360 / HOLE_COUNT
const RADIUS = HOLE_SPACING / (2 * Math.sin((ANGLE_STEP_DEG * Math.PI) / 360))

const main = () => {
  const outerRadius = RADIUS + BAND_WIDTH / 2
  const innerRadius = RADIUS - BAND_WIDTH / 2
  const band2D = subtract(circle({ radius: outerRadius, segments: SEGMENTS }), circle({ radius: innerRadius, segments: SEGMENTS }))

  const holes2D = []
  for (let i = 0; i < HOLE_COUNT; i++) {
    const angle = (ANGLE_STEP_DEG * i * Math.PI) / 180
    const center = [RADIUS * Math.cos(angle), RADIUS * Math.sin(angle)]
    holes2D.push(translate(center, circle({ radius: HOLE_DIAMETER / 2, segments: SEGMENTS })))
  }

  let profile2D = band2D
  for (const hole of holes2D) profile2D = subtract(profile2D, hole)

  return extrudeLinear({ height: THICKNESS }, profile2D)
}

module.exports = { main }
