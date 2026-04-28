const { polygon } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { subtract } = require('@jscad/modeling').booleans
const { expand } = require('@jscad/modeling').expansions

// Derived from: Xacto blade - No 11.STL (projected outer boundary in XY, mm)
// Coordinates are kept in the STL frame for traceability.
const OUTER_POINTS = [
  [1.46, 0.0],
  [7.26, 0.0],
  [7.26, 12.0],
  [8.36, 15.1],
  [8.36, 37.01448],
  [8.36, 40.9049],
  [0.0, 17.3449],
  [0.0, 16.11455],
  [0.47195, 14.78452],
  [1.46, 12.0]
]

// Internal cutout loop, derived from the same STL top-face projection.
const HOLE_POINTS = [
  [3.36732, 3.70204],
  [3.32434, 3.77449],
  [3.28663, 3.84981],
  [3.2544, 3.92763],
  [3.2278, 4.00756],
  [3.20697, 4.08917],
  [3.19201, 4.17207],
  [3.18301, 4.25582],
  [3.18, 4.34],
  [3.18, 8.28],
  [3.18301, 8.36418],
  [3.19201, 8.44793],
  [3.20697, 8.53083],
  [3.2278, 8.61244],
  [3.2544, 8.69237],
  [3.28663, 8.77019],
  [3.32434, 8.84551],
  [3.36732, 8.91796],
  [3.41536, 8.98715],
  [3.46822, 9.05274],
  [3.52561, 9.11439],
  [3.58726, 9.17178],
  [3.65285, 9.22464],
  [3.72204, 9.27268],
  [3.79449, 9.31566],
  [3.86981, 9.35337],
  [3.94763, 9.3856],
  [4.02756, 9.4122],
  [4.10917, 9.43303],
  [4.19207, 9.44799],
  [4.27582, 9.45699],
  [4.36, 9.46],
  [4.44418, 9.45699],
  [4.52793, 9.44799],
  [4.61083, 9.43303],
  [4.69244, 9.4122],
  [4.77237, 9.3856],
  [4.85019, 9.35337],
  [4.92551, 9.31566],
  [4.99796, 9.27268],
  [5.06715, 9.22464],
  [5.13274, 9.17178],
  [5.19439, 9.11439],
  [5.25178, 9.05274],
  [5.30464, 8.98715],
  [5.35268, 8.91796],
  [5.39566, 8.84551],
  [5.43337, 8.77019],
  [5.4656, 8.69237],
  [5.4922, 8.61244],
  [5.51303, 8.53083],
  [5.52799, 8.44793],
  [5.53699, 8.36418],
  [5.54, 8.28],
  [5.54, 4.34],
  [5.53699, 4.25582],
  [5.52799, 4.17207],
  [5.51303, 4.08917],
  [5.4922, 4.00756],
  [5.4656, 3.92763],
  [5.43337, 3.84981],
  [5.39566, 3.77449],
  [5.35268, 3.70204],
  [5.30464, 3.63285],
  [5.25178, 3.56726],
  [5.19439, 3.50561],
  [5.13274, 3.44822],
  [5.06715, 3.39536],
  [4.99796, 3.34732],
  [4.92551, 3.30434],
  [4.85019, 3.26663],
  [4.77237, 3.2344],
  [4.69244, 3.2078],
  [4.61083, 3.18697],
  [4.52793, 3.17201],
  [4.44418, 3.16301],
  [4.36, 3.16],
  [4.27582, 3.16301],
  [4.19207, 3.17201],
  [4.10917, 3.18697],
  [4.02756, 3.2078],
  [3.94763, 3.2344],
  [3.86981, 3.26663],
  [3.79449, 3.30434],
  [3.72204, 3.34732],
  [3.65285, 3.39536],
  [3.58726, 3.44822],
  [3.52561, 3.50561],
  [3.46822, 3.56726],
  [3.41536, 3.63285]
]

const EXTRUDE_HEIGHT = 0.51
const PROFILE_TOLERANCE = 0.1

const bladeOutline2D = () => {
  const outer = polygon({ points: OUTER_POINTS })
  // Keep hole loop orientation consistent with geom2 boolean expectations.
  const hole = polygon({ points: [...HOLE_POINTS].reverse() })
  return subtract(outer, hole)
}

const xactoNo11Raw = () => extrudeLinear({ height: EXTRUDE_HEIGHT }, bladeOutline2D())

// Adds 0.1 mm tolerance on the 2D blade profile before extrusion.
const xactoNo11WithTolerance = () => {
  const tolerantOutline = expand({ delta: PROFILE_TOLERANCE }, bladeOutline2D())
  return extrudeLinear({ height: EXTRUDE_HEIGHT }, tolerantOutline)
}

const xactoNo11 = () => xactoNo11WithTolerance()

const main = () => xactoNo11()

module.exports = {
  main,
  bladeOutline2D,
  xactoNo11Raw,
  xactoNo11WithTolerance,
  xactoNo11,
  'xacto-no11': xactoNo11
}
