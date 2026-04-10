const { cuboid, polygon } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { union } = require('@jscad/modeling').booleans
const { translate, rotateZ, mirrorY } = require('@jscad/modeling').transforms
const { colorize } = require('@jscad/modeling').colors

// All dimensions are in millimeters.

// -----------------------------
// Example staircase parameters (edit these)
// -----------------------------
const stairWidth = 100
const straightSteps = 13
const straightTotalRun = 320
const stepThickness = 2   // thickness of one step (tread), mm
const turningSteps = 6
const innerRadiusRatio = 0  // inner radius of turning steps as fraction of stair width (0 = point, 1 = full)
const wallThickness = 2  // thickness of side beam (straight) and far wall (turning), mm

// Total rise for the whole staircase (floor to top of last step). Straight and turning
// rises are derived from this and the step counts above.
const totalRise = 300

const turnDirection = 'right'  // 'right' or 'left'
const renderStraight = true    // render straight part
const renderRotated = true     // render turning part

// Straight stair with side beam
// totalRise = floor (z=0) to top of last step. Step rise is auto: totalRise / steps.
// opts = {
//   steps: number of treads,
//   totalRise: total vertical height floor -> top last step (mm),
//   totalRun: horizontal length along X (mm),
//   stepThickness: thickness of each tread (mm),
//   width: stair width (mm),
//   beamThickness: optional side beam thickness (mm)
// }
const makeStraightStair = (opts) => {
  const {
    steps,
    totalRise,
    totalRun,
    stepThickness,
    width,
    beamThickness = stepThickness
  } = opts

  const risePerStep = totalRise / steps
  // Use an effective run that leaves space for the first riser thickness
  const effectiveRun = totalRun - stepThickness
  const depthPerStep = effectiveRun / steps

  const stepsSolids = []
  const risers = []

  for (let i = 0; i < steps; i++) {
    // Step i top at (i+1)*risePerStep so first step is above floor
    const stepTopZ = (i + 1) * risePerStep
    const stepCenterZ = stepTopZ - stepThickness / 2

    const isLast = i === steps - 1
    const stepDepth = isLast ? depthPerStep - stepThickness : depthPerStep

    const step = cuboid({
      size: [stepDepth, width, stepThickness]
    })

    // Steps start after the first riser thickness. The last step is
    // shortened by one stepThickness (on the front side) so it visually
    // fits better with the rotating section.
    const baseCenterX = stepThickness + i * depthPerStep + depthPerStep / 2
    const stepCenterX = isLast ? baseCenterX - stepThickness / 2 : baseCenterX

    const stepSolid = translate(
      [
        stepCenterX,
        width / 2,
        stepCenterZ
      ],
      step
    )

    stepsSolids.push(stepSolid)

    // Vertical riser in front of each step to close the staircase
    const riserHeight = risePerStep
    const riser = cuboid({
      size: [stepThickness, width, riserHeight]
    })
    // First riser starts at x = 0 and has thickness = stepThickness.
    const riserSolid = translate(
      [
        i * depthPerStep + stepThickness / 2,
        width / 2,
        i * risePerStep + riserHeight / 2
      ],
      riser
    )
    risers.push(riserSolid)
  }

  // Jagged side wall: one vertical panel per step, from floor up to the top of that step only
  const wallSegments = []
  for (let i = 0; i < steps; i++) {
    const stepTopZ = (i + 1) * risePerStep
    const segment = cuboid({
      size: [depthPerStep, beamThickness, stepTopZ]
    })
    const segmentSolid = translate(
      [
        i * depthPerStep + depthPerStep / 2,
        beamThickness / 2,
        stepTopZ / 2
      ],
      segment
    )
    wallSegments.push(segmentSolid)
  }

  return union(...wallSegments, ...risers, ...stepsSolids)
}

// Turning winder stair in a square footprint
// totalRise = floor to top of last step. Step rise is auto: totalRise / steps.
// opts = {
//   steps: number of winder treads over 90°,
//   totalRise: total vertical height floor -> top last step (mm),
//   stepThickness: thickness of each tread (mm),
//   width: same stair width as straight part (outer square side),
//   innerRadiusRatio: optional fraction of width used as inner radius,
//   wallThickness: optional thickness of far-end wall (mm),
//   wallExtendDown: optional (mm) extend wall below turning floor to reach full stair floor
// }
const makeTurningStair = (opts) => {
  const {
    steps,
    totalRise,
    stepThickness,
    width,
    innerRadiusRatio = 0.3,
    wallThickness,
    wallExtendDown = 0
  } = opts
  const wallT = wallThickness ?? stepThickness

  const risePerStep = totalRise / steps
  const anglePerStep = (Math.PI / 2) / steps

  // Helper: intersection of a ray from the origin with the
  // enclosing square [0,width] x [0,width], for 0 <= angle <= 90°.
  const pointOnSquare = (angle) => {
    const t = Math.tan(angle)
    if (t <= 1) {
      return [width, t * width]
    }
    return [width / t, width]
  }

  const winders = []

  for (let i = 0; i < steps; i++) {
    const a0 = i * anglePerStep
    const a1 = (i + 1) * anglePerStep

    const outer0 = pointOnSquare(a0)
    const outer1 = pointOnSquare(a1)

    const pOuter0 = outer0
    const pOuter1 = outer1
    const pInner0 = [outer0[0] * innerRadiusRatio, outer0[1] * innerRadiusRatio]
    const pInner1 = [outer1[0] * innerRadiusRatio, outer1[1] * innerRadiusRatio]

    const tread2D = polygon({
      points: [pInner0, pOuter0, pOuter1, pInner1]
    })

    // Step i top at (i+1)*risePerStep so first step is above floor.
    const stepTopZ = (i + 1) * risePerStep
    const supportHeight = Math.max(0, stepTopZ - stepThickness)

    // Vertical support from floor up to just under the tread
    const support = supportHeight > 0
      ? extrudeLinear({ height: supportHeight }, tread2D)
      : null

    // Tread plate sitting on top of the support
    const treadPlate = translate(
      [0, 0, supportHeight],
      extrudeLinear({ height: stepThickness }, tread2D)
    )

    const stepSolid = support ? union(support, treadPlate) : treadPlate

    winders.push(stepSolid)
  }

  // Walls: panels along both outer and inner boundaries.
  // Height: from extended floor (if wallExtendDown > 0) up to the top of the first step only.
  const wallHeight = risePerStep + wallExtendDown
  const wallCenterZ = (risePerStep - wallExtendDown) / 2
  const outerWallPanel = cuboid({
    size: [width, wallT, wallHeight]
  })
  const innerWallPanel = cuboid({
    size: [wallT, width, wallHeight]
  })

  // Original outer wall along y = width
  const outerWall = translate(
    [width / 2, width - wallT / 2, wallCenterZ],
    outerWallPanel
  )
  // New wall on the opposite x-side (x = width), lining up with the straight stair support
  const innerWall = translate(
    [width - wallT / 2, width / 2, wallCenterZ],
    innerWallPanel
  )

  return union(outerWall, innerWall, ...winders)
}

// Example: straight run + turning winder, similar to sketch
// part: 'both' | 'straight' | 'turning'
const exampleStair = (part = 'both') => {
  const totalSteps = straightSteps + turningSteps
  const straightTotalRise = totalRise * (straightSteps / totalSteps)
  const turningTotalRise = totalRise * (turningSteps / totalSteps)

  const straight = makeStraightStair({
    steps: straightSteps,
    totalRise: straightTotalRise,
    totalRun: straightTotalRun,
    stepThickness,
    width: stairWidth,
    beamThickness: wallThickness
  })

  const turningRaw = makeTurningStair({
    steps: turningSteps,
    totalRise: turningTotalRise,
    stepThickness,
    width: stairWidth,
    innerRadiusRatio,
    wallThickness,
    wallExtendDown: straightTotalRise
  })

  // Base geometry for left and right: right is a mirror of left across Y
  const turningLeftBase = turningRaw
  const turningRightBase = mirrorY(turningRaw)

  // Choose orientation according to turnDirection
  const turningOriented =
    turnDirection === 'left'
      ? translate(
          [straightTotalRun - stepThickness, stairWidth, straightTotalRise],
          rotateZ(-Math.PI / 2, turningLeftBase)
        )
      : translate(
          [straightTotalRun - stepThickness, 0, straightTotalRise],
          rotateZ(-Math.PI / 2, turningRightBase)
        )

  // Color parts for clarity
  const straightColored = colorize([0.3, 0.7, 1.0, 1], straight)
  const turningColored = colorize([0.1, 0.4, 0.9, 1], turningOriented)

  if (part === 'straight') return straightColored
  if (part === 'turning') return turningColored
  return union(straightColored, turningColored)
}

const getParameterDefinitions = () => {
  return []
}

const main = () => {
  let part
  if (renderStraight && renderRotated) part = 'both'
  else if (renderStraight) part = 'straight'
  else if (renderRotated) part = 'turning'
  else return []
  return exampleStair(part)
}

module.exports = {
  main,
  getParameterDefinitions,
  makeStraightStair,
  makeTurningStair,
  exampleStair
}

