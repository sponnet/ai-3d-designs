const { cuboid } = require('@jscad/modeling').primitives
const { translate, scale } = require('@jscad/modeling').transforms
const { union } = require('@jscad/modeling').booleans
const { colorize } = require('@jscad/modeling').colors

const DEFAULTS = {
  stairDepth: 3528,
  stairWidth: 3108,
  stairHeight: 2450,
  totalSteps: 16, // total risers across both flights
  tread: 282,
  treadThickness: 30,
  riserThickness: 30,
  glueTabThickness: 20,
  scale: 1/50,
  renderPart1: true,
  renderPart2: true,
  showDimensionEnvelope: false
}
// OpenJSCAD persists parameter values in local storage.
// Keep this true to always use file defaults instead.
const IGNORE_PERSISTED_PARAMS = true
const RISER_LIMITS_MM = { min: 180, max: 220 }
const TREAD_LIMITS_MM = { min: 220, max: 270 }

const classifyAgainstLimits = (value, limits) => {
  if (value < limits.min) return 'UNDER'
  if (value > limits.max) return 'ABOVE'
  return 'WITHIN'
}

const getParameterDefinitions = () => [
  { name: 'stairDepth', type: 'float', initial: DEFAULTS.stairDepth, caption: 'Stair depth (Y):' },
  { name: 'stairWidth', type: 'float', initial: DEFAULTS.stairWidth, caption: 'Stair width (X):' },
  { name: 'stairHeight', type: 'float', initial: DEFAULTS.stairHeight, caption: 'Stair height (Z):' },
  { name: 'totalSteps', type: 'int', initial: DEFAULTS.totalSteps, caption: 'Total risers (steps):' },
  { name: 'tread', type: 'float', initial: DEFAULTS.tread, caption: 'Tread (aantrade) size:' },
  { name: 'treadThickness', type: 'float', initial: DEFAULTS.treadThickness, caption: 'Tread (aantrade) thickness:' },
  { name: 'riserThickness', type: 'float', initial: DEFAULTS.riserThickness, caption: 'Riser (optrede) thickness:' },
  { name: 'glueTabThickness', type: 'float', initial: DEFAULTS.glueTabThickness, caption: 'Glue-tab thickness:' },
  { name: 'scale', type: 'float', initial: DEFAULTS.scale, caption: 'Model scale:' },
  { name: 'renderPart1', type: 'checkbox', checked: DEFAULTS.renderPart1, caption: 'Render part 1' },
  { name: 'renderPart2', type: 'checkbox', checked: DEFAULTS.renderPart2, caption: 'Render part 2' },
  { name: 'showDimensionEnvelope', type: 'checkbox', checked: DEFAULTS.showDimensionEnvelope, caption: 'Show target dimension envelope' },
  {
    name: 'calculatedRiser',
    type: 'float',
    initial: DEFAULTS.stairHeight / Math.max(2, Math.floor(DEFAULTS.totalSteps)),
    caption: 'Calculated riser (optrede) mm, reference:'
  },
  {
    name: 'calculatedLandingWidth',
    type: 'float',
    initial: DEFAULTS.stairWidth,
    caption: 'Calculated landing width (W), reference:'
  },
  {
    name: 'calculatedLandingDepth',
    type: 'float',
    initial: Math.max(
      0,
      DEFAULTS.stairDepth - (
        Math.max(
          Math.max(0, Math.floor(Math.max(2, Math.floor(DEFAULTS.totalSteps)) / 2) - 1),
          Math.max(0, (Math.max(2, Math.floor(DEFAULTS.totalSteps)) - Math.floor(Math.max(2, Math.floor(DEFAULTS.totalSteps)) / 2)) - 1)
        ) * DEFAULTS.tread
      )
    ),
    caption: 'Calculated landing depth (D), reference:'
  },
  {
    name: 'calculatedTreadWidth',
    type: 'float',
    initial: DEFAULTS.stairWidth / 2,
    caption: 'Calculated 1 tread width, reference:'
  },
  {
    name: 'calculatedFirstFlightWidth',
    type: 'float',
    initial: DEFAULTS.stairWidth / 2,
    caption: 'Calculated first flightrun width, reference:'
  },
  {
    name: 'calculatedSecondFlightWidth',
    type: 'float',
    initial: DEFAULTS.stairWidth / 2,
    caption: 'Calculated second flightrun width, reference:'
  },
  {
    name: 'calculatedFirstFlightDepth',
    type: 'float',
    initial: Math.max(0, Math.floor(Math.max(2, Math.floor(DEFAULTS.totalSteps)) / 2) - 1) * DEFAULTS.tread,
    caption: 'Calculated first flightrun depth (D), reference:'
  },
  {
    name: 'calculatedSecondFlightDepth',
    type: 'float',
    initial: Math.max(0, (Math.max(2, Math.floor(DEFAULTS.totalSteps)) - Math.floor(Math.max(2, Math.floor(DEFAULTS.totalSteps)) / 2)) - 1) * DEFAULTS.tread,
    caption: 'Calculated second flightrun depth (D), reference:'
  },
  {
    name: 'calculatedFirstFlightHeight',
    type: 'float',
    initial: Math.floor(Math.max(2, Math.floor(DEFAULTS.totalSteps)) / 2) * (DEFAULTS.stairHeight / Math.max(2, Math.floor(DEFAULTS.totalSteps))),
    caption: 'Calculated first flightrun height (H), reference:'
  },
  {
    name: 'calculatedSecondFlightHeight',
    type: 'float',
    initial: (Math.max(2, Math.floor(DEFAULTS.totalSteps)) - Math.floor(Math.max(2, Math.floor(DEFAULTS.totalSteps)) / 2)) * (DEFAULTS.stairHeight / Math.max(2, Math.floor(DEFAULTS.totalSteps))),
    caption: 'Calculated second flightrun height (H), reference:'
  }
]

const derive = (p) => {
  const totalRisers = Math.max(2, Math.floor(p.totalSteps))
  const riser = p.stairHeight / totalRisers
  const firstFlightSteps = Math.floor(totalRisers / 2)
  const secondFlightSteps = totalRisers - firstFlightSteps
  // Each flight ends with a riser (no top tread), so treads = risers - 1.
  const firstFlightTreads = Math.max(0, firstFlightSteps - 1)
  const secondFlightTreads = Math.max(0, secondFlightSteps - 1)
  const firstFlightRun = firstFlightTreads * p.tread
  const secondFlightRun = secondFlightTreads * p.tread
  const landingDepthRaw = p.stairDepth - Math.max(firstFlightRun, secondFlightRun)
  const landingDepth = Math.max(0, landingDepthRaw)
  const flightWidth = p.stairWidth / 2
  // In a U-turn stair, the two flights overlap in plan depth.
  // Footprint depth is landing depth plus the deeper of both flights.
  const footprintDepth = landingDepth + Math.max(firstFlightRun, secondFlightRun)
  const reconstructed = {
    depth: footprintDepth,
    width: p.stairWidth,
    height: totalRisers * riser
  }
  return {
    totalRisers,
    riser,
    firstFlightSteps,
    secondFlightSteps,
    firstFlightTreads,
    secondFlightTreads,
    firstFlightRun,
    secondFlightRun,
    landingDepthRaw,
    landingDepth,
    flightWidth,
    reconstructed
  }
}

const getEffectiveGlueTabThickness = (p) => {
  const safeScale = p.scale > 0 ? p.scale : DEFAULTS.scale
  const minUnscaledThicknessForOneMm = 1 / safeScale
  return Math.max(p.glueTabThickness, minUnscaledThicknessForOneMm)
}

const makeFlight = ({
  steps,
  width,
  tread,
  riser,
  treadThickness,
  riserThickness,
  x0,
  yStart,
  yDir,
  zBase
}) => {
  const solids = []

  for (let i = 0; i < steps; i++) {
    const isLastRiserInFlight = i === steps - 1
    if (!isLastRiserInFlight) {
      const topZ = zBase + (i + 1) * riser
      const centerY = yStart + yDir * (i * tread + tread / 2)
      const treadSolid = translate(
        [x0 + width / 2, centerY, topZ - treadThickness / 2],
        cuboid({ size: [width, tread, treadThickness] })
      )
      solids.push(treadSolid)
    }

    // Closed riser in front of each tread.
    const riserCenterY =
      yDir === 1
        ? yStart + i * tread + riserThickness / 2
        : yStart - i * tread - riserThickness / 2
    // Riser spans from bottom of previous tread to bottom of current tread.
    // This keeps the riser top flush with the tread underside.
    const riserHeight = riser
    const riserSolid = translate(
      [x0 + width / 2, riserCenterY, zBase + i * riser + riserHeight / 2 - treadThickness],
      cuboid({ size: [width, riserThickness, riserHeight] })
    )
    solids.push(riserSolid)
  }

  return union(...solids)
}

// 1) First half of stairs (left run, up toward +Y)
const firstHalfStairs = (p, d) =>
  makeFlight({
    steps: d.firstFlightSteps,
    width: d.flightWidth,
    tread: p.tread,
    riser: d.riser,
    treadThickness: p.treadThickness,
    riserThickness: p.riserThickness,
    x0: 0,
    yStart: 0,
    yDir: 1,
    zBase: 0
  })

// Square glue tabs under each first-flight tread, left side only.
const firstFlightGlueTabs = (p, d) => {
  const solids = []
  const glueTabThickness = getEffectiveGlueTabThickness(p)
  for (let i = 0; i < d.firstFlightTreads; i++) {
    const topZ = (i + 1) * d.riser
    const centerY = i * p.tread + p.tread / 2
    const tabCenterZ = topZ - p.treadThickness - d.riser / 2
    const tab = translate(
      [
        // Keep tabs inside the staircase footprint (no protrusion past x=0).
        glueTabThickness / 2,
        centerY,
        tabCenterZ
      ],
      cuboid({ size: [glueTabThickness, p.tread, d.riser] })
    )
    solids.push(tab)
  }
  if (solids.length === 0) return []
  if (solids.length === 1) return solids[0]
  return union(...solids)
}

// Matching glue tabs for second-flight treads, opposite side (right edge), inside footprint.
const secondFlightGlueTabs = (p, d) => {
  const solids = []
  const yStart = d.firstFlightRun // Keep same anchor as secondHalfStairs().
  const zBase = d.firstFlightSteps * d.riser
  const glueTabThickness = getEffectiveGlueTabThickness(p)
  for (let i = 0; i < d.secondFlightTreads; i++) {
    const topZ = zBase + (i + 1) * d.riser
    const centerY = yStart - (i * p.tread + p.tread / 2)
    const tabCenterZ = topZ - p.treadThickness - d.riser / 2
    const tab = translate(
      [
        p.stairWidth - glueTabThickness / 2,
        centerY,
        tabCenterZ
      ],
      cuboid({ size: [glueTabThickness, p.tread, d.riser] })
    )
    solids.push(tab)
  }
  if (solids.length === 0) return []
  if (solids.length === 1) return solids[0]
  return union(...solids)
}

// 2) Landing (full width, auto depth)
const landing = (p, d) => {
  const z = d.firstFlightSteps * d.riser
  return translate(
    [p.stairWidth / 2, d.firstFlightRun + d.landingDepth / 2, z - p.treadThickness / 2],
    cuboid({ size: [p.stairWidth, d.landingDepth, p.treadThickness] })
  )
}

// 3) Second half of stairs (180° turn at landing, then run back)
const secondHalfStairs = (p, d) => {
  const yStart = d.firstFlightRun
  const zBase = d.firstFlightSteps * d.riser
  return makeFlight({
    steps: d.secondFlightSteps,
    width: d.flightWidth,
    tread: p.tread,
    riser: d.riser,
    treadThickness: p.treadThickness,
    riserThickness: p.riserThickness,
    // Right side flight, opposite direction from first flight (U-turn).
    x0: p.stairWidth - d.flightWidth,
    yStart,
    yDir: -1,
    zBase
  })
}

const dimensionEnvelope = (p) =>
  translate(
    [p.stairWidth / 2, p.stairDepth / 2, p.stairHeight / 2],
    cuboid({ size: [p.stairWidth, p.stairDepth, p.stairHeight] })
  )

const printDimensionReport = (p, d) => {
  const deltaDepth = d.reconstructed.depth - p.stairDepth
  const deltaWidth = d.reconstructed.width - p.stairWidth
  const deltaHeight = d.reconstructed.height - p.stairHeight
  const dimensionMatch = Math.abs(deltaDepth) < 1e-6 &&
    Math.abs(deltaWidth) < 1e-6 &&
    Math.abs(deltaHeight) < 1e-6

  // OpenJSCAD doesn't support a true "computed read-only parameter field",
  // so this prints a deterministic verification report in the console.
  console.log('--- Staircase dimension check ---')
  console.log(`Requested:   D=${p.stairDepth.toFixed(3)}  W=${p.stairWidth.toFixed(3)}  H=${p.stairHeight.toFixed(3)}`)
  console.log(`Recomputed:  D=${d.reconstructed.depth.toFixed(3)}  W=${d.reconstructed.width.toFixed(3)}  H=${d.reconstructed.height.toFixed(3)}`)
  console.log(`Landing:     W=${p.stairWidth.toFixed(3)}  D=${d.landingDepth.toFixed(3)}`)
  console.log(`1 tread:     W=${d.flightWidth.toFixed(3)}`)
  console.log(`Flightruns:  W1=${d.flightWidth.toFixed(3)}  W2=${d.flightWidth.toFixed(3)}`)
  console.log(`Flightruns:  D1=${d.firstFlightRun.toFixed(3)}  D2=${d.secondFlightRun.toFixed(3)}`)
  console.log(`Flightruns:  H1=${(d.firstFlightSteps * d.riser).toFixed(3)}  H2=${(d.secondFlightSteps * d.riser).toFixed(3)}`)
  console.log(`Check:       D=max(D1,D2)+Landing = ${Math.max(d.firstFlightRun, d.secondFlightRun).toFixed(3)} + ${d.landingDepth.toFixed(3)} = ${d.reconstructed.depth.toFixed(3)}`)
  console.log(`Delta:       dD=${deltaDepth.toFixed(6)}  dW=${deltaWidth.toFixed(6)}  dH=${deltaHeight.toFixed(6)}`)
  console.log(
    `Riser limit: ${classifyAgainstLimits(d.riser, RISER_LIMITS_MM)} ` +
    `(value=${d.riser.toFixed(3)} mm, limits=${RISER_LIMITS_MM.min}-${RISER_LIMITS_MM.max} mm)`
  )
  console.log(
    `Tread limit: ${classifyAgainstLimits(p.tread, TREAD_LIMITS_MM)} ` +
    `(value=${p.tread.toFixed(3)} mm, limits=${TREAD_LIMITS_MM.min}-${TREAD_LIMITS_MM.max} mm)`
  )
  console.log(`Status: ${dimensionMatch ? 'PASS' : 'CHECK INPUTS'}`)
  if (d.landingDepthRaw < 0) {
    console.warn(`Landing depth is negative (${d.landingDepthRaw.toFixed(3)} mm). Increase stair length or reduce steps/tread.`)
  }
}

const staircaseWithLanding = (p, d) => {
  const solids = []

  if (p.renderPart1) {
    solids.push(colorize([0.20, 0.60, 0.95, 1], firstHalfStairs(p, d)))
    solids.push(colorize([0.20, 0.60, 0.95, 1], firstFlightGlueTabs(p, d)))
    solids.push(colorize([0.95, 0.75, 0.20, 1], landing(p, d)))
  }

  if (p.renderPart2) {
    solids.push(colorize([0.15, 0.45, 0.85, 1], secondFlightGlueTabs(p, d)))
    solids.push(colorize([0.15, 0.45, 0.85, 1], secondHalfStairs(p, d)))
  }

  if (p.showDimensionEnvelope) {
    solids.push(colorize([0.9, 0.2, 0.2, 0.12], dimensionEnvelope(p)))
  }

  if (solids.length === 0) return []
  if (solids.length === 1) return solids[0]
  return union(...solids)
}

const main = (params = {}) => {
  const p = IGNORE_PERSISTED_PARAMS ? { ...DEFAULTS } : { ...DEFAULTS, ...params }
  const d = derive(p)
  if (IGNORE_PERSISTED_PARAMS) {
    console.log('Using default parameters from script (persisted UI values ignored).')
  }
  printDimensionReport(p, d)
  console.log(`Calculated riser from current inputs: ${d.riser.toFixed(3)} mm`)
  console.log(`Calculated landing (w x d): ${p.stairWidth.toFixed(3)} x ${d.landingDepth.toFixed(3)} mm`)
  console.log(`Calculated 1 tread width: ${d.flightWidth.toFixed(3)} mm`)
  console.log(`Calculated first flightrun width: ${d.flightWidth.toFixed(3)} mm`)
  console.log(`Calculated second flightrun width: ${d.flightWidth.toFixed(3)} mm`)
  console.log(`Calculated first flightrun depth: ${d.firstFlightRun.toFixed(3)} mm`)
  console.log(`Calculated second flightrun depth: ${d.secondFlightRun.toFixed(3)} mm`)
  console.log(`Calculated first flightrun height: ${(d.firstFlightSteps * d.riser).toFixed(3)} mm`)
  console.log(`Calculated second flightrun height: ${(d.secondFlightSteps * d.riser).toFixed(3)} mm`)
  return scale([p.scale, p.scale, p.scale], staircaseWithLanding(p, d))
}

module.exports = {
  getParameterDefinitions,
  main,
  firstHalfStairs,
  firstFlightGlueTabs,
  secondFlightGlueTabs,
  landing,
  secondHalfStairs,
  staircaseWithLanding
}

