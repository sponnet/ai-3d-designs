const { polygon, cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { rotateY, translate } = require('@jscad/modeling').transforms

const TOTAL_LENGTH = 50
const PROFILE_WIDTH = 5
const CENTER_TAB_HEIGHT = 25

const CHAMFER_LENGTH = 4
const CENTER_TAB_DEPTH = 0
const THICKNESS = 25
const SIDE_HOLE_DIAMETER = 4
const CENTER_HOLE_DIAMETER = 20
const SMALL_HOLE_CHAMFER_DEPTH = 1
const SMALL_HOLE_CHAMFER_DIAMETER = 6
const SIDE_HOLE_Y = TOTAL_LENGTH / 3

const mountingHook2D = () => {
  const xRight = PROFILE_WIDTH / 2
  const xLeft = -PROFILE_WIDTH / 2
  const xTab = xLeft + CENTER_TAB_DEPTH

  const yTop = TOTAL_LENGTH / 2
  const yBottom = -TOTAL_LENGTH / 2
  const yTabTop = CENTER_TAB_HEIGHT / 2
  const yTabBottom = -CENTER_TAB_HEIGHT / 2

  const points = [
    [xLeft, yTop - CHAMFER_LENGTH],
    [xLeft, yTabTop],
    [xTab, yTabTop],
    [xTab, yTabBottom],
    [xLeft, yTabBottom],
    [xLeft, yBottom + CHAMFER_LENGTH],
    [xRight, yBottom],
    [xRight, yTop]
  ]

  return polygon({ points })
}

const main = () => {
  const xRight = PROFILE_WIDTH / 2
  const body = extrudeLinear({ height: THICKNESS }, mountingHook2D())
  const sideHole = translate(
    [0, SIDE_HOLE_Y, THICKNESS / 2],
    rotateY(
      Math.PI / 2,
      cylinder({ height: PROFILE_WIDTH + 2 , radius: SIDE_HOLE_DIAMETER / 2, segments: 64 })
    )
  )
  const sideHole2 = translate(
    [0, -SIDE_HOLE_Y, THICKNESS / 2],
    rotateY(
      Math.PI / 2,
      cylinder({ height: PROFILE_WIDTH + 2 , radius: SIDE_HOLE_DIAMETER / 2, segments: 64 })
    )
  )
  const centerHole = translate(
    [0, 0, THICKNESS / 2],
    rotateY(
      Math.PI / 2,
      cylinder({ height: PROFILE_WIDTH + 2, radius: CENTER_HOLE_DIAMETER / 2, segments: 96 })
    )
  )
  const sideHoleChamfer = translate(
    [xRight - SMALL_HOLE_CHAMFER_DEPTH / 2, SIDE_HOLE_Y, THICKNESS / 2],
    rotateY(
      Math.PI / 2,
      cylinder({
        height: SMALL_HOLE_CHAMFER_DEPTH,
        radiusStart: SIDE_HOLE_DIAMETER / 2,
        radiusEnd: SMALL_HOLE_CHAMFER_DIAMETER / 2,
        segments: 64
      })
    )
  )
  const sideHole2Chamfer = translate(
    [xRight - SMALL_HOLE_CHAMFER_DEPTH / 2, -SIDE_HOLE_Y, THICKNESS / 2],
    rotateY(
      Math.PI / 2,
      cylinder({
        height: SMALL_HOLE_CHAMFER_DEPTH,
        radiusStart: SIDE_HOLE_DIAMETER / 2,
        radiusEnd: SMALL_HOLE_CHAMFER_DIAMETER / 2,
        segments: 64
      })
    )
  )
  return subtract(body, sideHole, sideHole2, centerHole, sideHoleChamfer, sideHole2Chamfer)
}

module.exports = { main, mountingHook2D }
