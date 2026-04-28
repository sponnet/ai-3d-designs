const { roundedCuboid, cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { translate, rotateX } = require('@jscad/modeling').transforms

const BLOCK_WIDTH = 9
const BLOCK_LENGTH = 18
const BLOCK_HEIGHT = 7

const CENTER_CUT_DIAMETER = 6.1
const CENTER_CUT_DEPTH = 6
const CENTER_CUT_SEGMENTS = 96
const CENTER_CUT_Y_OFFSET = 2
const SIDE_HOLE_DIAMETER = 3
const SIDE_HOLE_DEPTH = BLOCK_LENGTH / 2
const SIDE_HOLE_SEGMENTS = 64
const EDGE_ROUND_DIAMETER = 3
const EDGE_ROUND_RADIUS = EDGE_ROUND_DIAMETER / 2
const TOP_STEP_DOWN_HEIGHT = 3

const bellHammer = () => {
  const block = roundedCuboid({
    size: [BLOCK_WIDTH, BLOCK_LENGTH, BLOCK_HEIGHT],
    roundRadius: EDGE_ROUND_RADIUS,
    segments: 64
  })

  // Start the cutter at the top face so the pocket is exactly CENTER_CUT_DEPTH.
  const cutout = translate(
    [0, CENTER_CUT_Y_OFFSET, (BLOCK_HEIGHT - CENTER_CUT_DEPTH) / 2],
    cylinder({
      height: CENTER_CUT_DEPTH,
      radius: CENTER_CUT_DIAMETER / 2,
      segments: CENTER_CUT_SEGMENTS
    })
  )

  // Drill from the +Y end face toward the center (half-length depth).
  const sideHole = translate(
    [0, BLOCK_LENGTH / 2 - SIDE_HOLE_DEPTH / 2, 0],
    rotateX(Math.PI / 2,
      cylinder({
        height: SIDE_HOLE_DEPTH,
        radius: SIDE_HOLE_DIAMETER / 2,
        segments: SIDE_HOLE_SEGMENTS
      })
    )
  )

  // Remove top 3mm from the half opposite the side hole (+Y has the hole, so cut -Y half).
  const oppositeSideTopCut = translate(
    [0, -BLOCK_LENGTH / 4 -3.5, BLOCK_HEIGHT / 2 - TOP_STEP_DOWN_HEIGHT / 2],
    cuboid({
      size: [BLOCK_WIDTH, BLOCK_LENGTH / 2, TOP_STEP_DOWN_HEIGHT]
    })
  )

  return subtract(block, cutout, sideHole, oppositeSideTopCut)
}

const main = () => bellHammer()

module.exports = { main, bellHammer }
