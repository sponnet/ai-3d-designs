const { rectangle, roundedRectangle, polyhedron } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { subtract, union } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// mm, Z up — bottom face at z = 0 (sketch in XY)

const MAIN_WIDTH = 22
const MAIN_HEIGHT = 70
const PROTRUSION_WIDTH = 16
const PROTRUSION_HEIGHT = 30
const HOLE_WIDTH = 17
const HOLE_HEIGHT = 19
const EXTRUDE_HEIGHT = 7.5
const HOLE_OFFSET = 5
/** Sharp rectangle on +X of the main plate; its own thickness in Z. */
const RIGHT_TAB_WIDTH = 18
const RIGHT_TAB_HEIGHT = 18
const RIGHT_TAB_EXTRUDE = 2
/** Right-triangular lip on the tab: half the tab width in X), 3 mm tall above tab top (see side view). */
const RIGHT_LIP_HEIGHT = 3 
const OUTER_CORNER_RADIUS = 3
const CORNER_SEGMENTS = 24

/** Big rounded rect + small rounded rect (overlapping on −X), minus hole, then extrude. */
const profile2D = (roundRadius) => {
  const mainCenter = [MAIN_WIDTH / 2, MAIN_HEIGHT / 2]
  const protrusionCenter = [-PROTRUSION_WIDTH / 2 + OUTER_CORNER_RADIUS, MAIN_HEIGHT / 2]
  const holeCenter = [HOLE_WIDTH / 2 - HOLE_OFFSET, MAIN_HEIGHT / 2]

  const rr = {
    roundRadius,
    segments: CORNER_SEGMENTS
  }

  const big = translate(
    mainCenter,
    roundedRectangle({ size: [MAIN_WIDTH, MAIN_HEIGHT], ...rr })
  )
  const small = translate(
    protrusionCenter,
    roundedRectangle({ size: [PROTRUSION_WIDTH + 2 * OUTER_CORNER_RADIUS, PROTRUSION_HEIGHT], ...rr })
  )
  const hole = translate(holeCenter, rectangle({ size: [HOLE_WIDTH, HOLE_HEIGHT] }))

  return subtract(union(big, small), hole)
}

/**
 * Closed triangular prism (wedge): vertical edge at tab center (x), base to outer corner, 3 mm tall on tab top.
 * Explicit polyhedron avoids hollow / broken shading from polygon+extrude+rotate.
 */
const rightLipSolid = () => {
  const x0 = MAIN_WIDTH + RIGHT_TAB_WIDTH / 2
  const x1 = MAIN_WIDTH + RIGHT_TAB_WIDTH
  const y0 = (MAIN_HEIGHT - RIGHT_TAB_HEIGHT) / 2
  const y1 = y0 + RIGHT_TAB_HEIGHT
  const z0 = RIGHT_TAB_EXTRUDE
  const z1 = z0 + RIGHT_LIP_HEIGHT

  const points = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x0, y0, z1],
    [x0, y1, z0],
    [x1, y1, z0],
    [x0, y1, z1]
  ]

  const faces = [
    [0, 1, 2],
    [3, 5, 4],
    [0, 3, 4, 1],
    [0, 2, 5, 3],
    [1, 4, 5, 2]
  ]

  return polyhedron({ points, faces })
}

const main = (params = {}) => {
  const h = EXTRUDE_HEIGHT
  const r = OUTER_CORNER_RADIUS

  const plate = extrudeLinear({ height: h }, profile2D(r))

  const rightTab2D = translate(
    [MAIN_WIDTH + RIGHT_TAB_WIDTH / 2, MAIN_HEIGHT / 2],
    rectangle({ size: [RIGHT_TAB_WIDTH, RIGHT_TAB_HEIGHT] })
  )
  const rightTab = extrudeLinear({ height: RIGHT_TAB_EXTRUDE }, rightTab2D)

  const lip = rightLipSolid()

  // Union plate+lip first, then the right tab. A single union(plate, rightTab, lip) makes @jscad/modeling
  // drop the main plate and tab (only the lip remains) — order-dependent boolean issue.
  return union(union(plate, lip), rightTab)
}


module.exports = { main }
