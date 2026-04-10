const { circle, cuboid } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { subtract } = require('@jscad/modeling').booleans
const { translate, rotateY } = require('@jscad/modeling').transforms
const { colorize } = require('@jscad/modeling').colors

// All dimensions are in millimeters.
// Block in first quadrant; cylindrical pocket; tilted cuboid cut out at x=0 (same geometry as before, now subtracted).

const OUTER_DIAMETER = 10
const OUTER_RADIUS = OUTER_DIAMETER / 2
const OUTER_HEIGHT = 10
const BLOCK_LENGTH = 2 * OUTER_RADIUS
const CAVITY_DIAMETER = 10
const CAVITY_RADIUS = CAVITY_DIAMETER / 2
const CAVITY_HEIGHT = 4.6
const BLOCK_DEPTH = (4 * CAVITY_DIAMETER) / 4 + CAVITY_RADIUS / 2

// Cutout (was visual “red cube”): −X from block; face center on x = 0; rotateY tilt.
const FRONT_CUBE_DEPTH = 8
const FRONT_CUBE_HEIGHT = OUTER_HEIGHT * 2
const CUBE_TILT_DEG = 10
const CUBE_TILT_RAD = (CUBE_TILT_DEG * Math.PI) / 180

/**
 * World translate so the center of the cuboid's +X face (toward the block) lies on the block plane:
 * (0, BLOCK_DEPTH/2, 0) — same as the center of the block's left face (x = 0).
 * rotateY(θ) maps face center (dx/2, 0, 0) → ((dx/2)cos θ, 0, -(dx/2)sin θ).
 */
const translateForFaceCenterOnBlockPlane = (dx, theta) => {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return [-(dx / 2) * c, BLOCK_DEPTH / 2, (dx / 2) * s]
}

/** Full disk in XY, centered on origin (boolean with block clips the pocket). */
const quarterDisk2D = ({ radius, segments = 96 }) => {
  return circle({ radius, segments })
}

const makeFrontCubeCutout = () => {
  const dx = FRONT_CUBE_DEPTH
  const t = translateForFaceCenterOnBlockPlane(dx, CUBE_TILT_RAD)
  return translate(
    t,
    rotateY(
      CUBE_TILT_RAD,
      cuboid({ size: [FRONT_CUBE_DEPTH, BLOCK_DEPTH, FRONT_CUBE_HEIGHT] })
    )
  )
}

const makePillCutter = () => {
  const block = translate(
    [BLOCK_LENGTH / 2, BLOCK_DEPTH / 2, 0],
    cuboid({ size: [BLOCK_LENGTH, BLOCK_DEPTH, OUTER_HEIGHT] })
  )

  const cavity2D = quarterDisk2D({ radius: CAVITY_RADIUS })
  const cavity = translate(
    [0, BLOCK_DEPTH/4, -CAVITY_HEIGHT / 2],
    extrudeLinear({ height: CAVITY_HEIGHT }, cavity2D)
  )

  const cutout = makeFrontCubeCutout()
  return subtract(block, cavity, cutout)
}

const main = () => {
  return colorize([0.2, 0.65, 1.0, 1], makePillCutter())
}

const getParameterDefinitions = () => []

module.exports = { main, getParameterDefinitions }
