const { torus, cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans

// Half hollow donut (torus): a full ring-shaped tube, hollowed out to a
// 2mm wall, with the INNER half of the tube's circular cross-section cut
// away -- leaving a "C"-channel ring, open toward the ring's own center,
// solid/curved on the outward-facing side.
//
// MAJOR_RADIUS is the donut's own radius (center of the overall ring to
// the center of the tube); MINOR_RADIUS is the radius of the tube
// ("donut body") itself. The tube spans radially from
// MAJOR_RADIUS - MINOR_RADIUS to MAJOR_RADIUS + MINOR_RADIUS at its
// widest (Z=0); cutting away everything within MAJOR_RADIUS of the
// central axis removes exactly the inner half of every cross-section
// around the ring, since each cross-section circle is centered exactly
// on MAJOR_RADIUS.

const MAJOR_RADIUS = 25.5 // the donut's own radius
const MINOR_RADIUS = 10 // the donut body (tube) radius
const WALL_THICKNESS = 2

const INNER_SEGMENTS = 64 // tube cross-section resolution
const OUTER_SEGMENTS = 128 // resolution around the main ring
const CUTTER_SEGMENTS = 128
const CUTTER_OVERSHOOT = 2

const outerTorus = () => torus({ innerRadius: MINOR_RADIUS, outerRadius: MAJOR_RADIUS, innerSegments: INNER_SEGMENTS, outerSegments: OUTER_SEGMENTS })

const innerTorus = () => torus({ innerRadius: MINOR_RADIUS - WALL_THICKNESS, outerRadius: MAJOR_RADIUS, innerSegments: INNER_SEGMENTS, outerSegments: OUTER_SEGMENTS })

// Removes everything within MAJOR_RADIUS of the central (Z) axis --
// i.e. the inner half of the tube's cross-section, all the way around.
const innerHalfCutter = () =>
  cylinder({ radius: MAJOR_RADIUS, height: 2 * MINOR_RADIUS + CUTTER_OVERSHOOT, segments: CUTTER_SEGMENTS })

const main = () => subtract(outerTorus(), innerTorus(), innerHalfCutter())

module.exports = { main }
