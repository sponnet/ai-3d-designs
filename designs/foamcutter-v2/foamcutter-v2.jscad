const { polygon, cuboid, cylinder } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotateZ } = require('@jscad/modeling').transforms
const { subtract, union } = require('@jscad/modeling').booleans
const { colorize } = require('@jscad/modeling').colors
const { expand } = require('@jscad/modeling').expansions

// --- Inlined X-Acto No. 11 geometry (raw, no tolerance) ---
const XACTO_EXTRUDE_HEIGHT = 0.51
const XACTO_TOLERANCE_2D = 0.17
const BLOCK_LENGTH = 70

const BLOCK_THICKNESS = 3
// Green support block width along Y; length stays BLOCK_LENGTH.
const KNIFE_CUT_DEPTH = 2.8  // how deep does the knife cut
const GREEN_BLOCK_WIDTH = 0.2 // extra offset from the tip of the cut 
const TOP_BLOCK_THICKNESS = 15
const KNIFE_ELEVATION = 3
const YELLOW_BLOCK_HEIGHT = BLOCK_THICKNESS + KNIFE_ELEVATION
const MOUNT_HOLE_DIAMETER = 3.1
/** Perpendicular offset from blade spine (in xacto local / cutter XY) to hole center */
const MOUNT_HOLE_PERP_OFFSET = 2.35
const XACTO_OUTER_POINTS = [
  [-6.90000, -40.90490],
  [-1.10000, -40.90490],
  [-1.10000, -28.90490],
  [0.00000, -25.80490],
  [0.00000, -3.89042],
  [0.00000, 0.00000],
  [-8.36000, -23.56000],
  [-8.36000, -24.79035],
  [-7.88805, -26.12038],
  [-6.90000, -28.90490]
]

const XACTO_HOLE_POINTS = [
  [-4.99268, -37.20286],
  [-5.03566, -37.13041],
  [-5.07337, -37.05509],
  [-5.10560, -36.97727],
  [-5.13220, -36.89734],
  [-5.15303, -36.81573],
  [-5.16799, -36.73283],
  [-5.17699, -36.64908],
  [-5.18000, -36.56490],
  [-5.18000, -32.62490],
  [-5.17699, -32.54072],
  [-5.16799, -32.45697],
  [-5.15303, -32.37407],
  [-5.13220, -32.29246],
  [-5.10560, -32.21253],
  [-5.07337, -32.13471],
  [-5.03566, -32.05939],
  [-4.99268, -31.98694],
  [-4.94464, -31.91775],
  [-4.89178, -31.85216],
  [-4.83439, -31.79051],
  [-4.77274, -31.73312],
  [-4.70715, -31.68026],
  [-4.63796, -31.63222],
  [-4.56551, -31.58924],
  [-4.49019, -31.55153],
  [-4.41237, -31.51930],
  [-4.33244, -31.49270],
  [-4.25083, -31.47187],
  [-4.16793, -31.45691],
  [-4.08418, -31.44791],
  [-4.00000, -31.44490],
  [-3.91582, -31.44791],
  [-3.83207, -31.45691],
  [-3.74917, -31.47187],
  [-3.66756, -31.49270],
  [-3.58763, -31.51930],
  [-3.50981, -31.55153],
  [-3.43449, -31.58924],
  [-3.36204, -31.63222],
  [-3.29285, -31.68026],
  [-3.22726, -31.73312],
  [-3.16561, -31.79051],
  [-3.10822, -31.85216],
  [-3.05536, -31.91775],
  [-3.00732, -31.98694],
  [-2.96434, -32.05939],
  [-2.92663, -32.13471],
  [-2.89440, -32.21253],
  [-2.86780, -32.29246],
  [-2.84697, -32.37407],
  [-2.83201, -32.45697],
  [-2.82301, -32.54072],
  [-2.82000, -32.62490],
  [-2.82000, -36.56490],
  [-2.82301, -36.64908],
  [-2.83201, -36.73283],
  [-2.84697, -36.81573],
  [-2.86780, -36.89734],
  [-2.89440, -36.97727],
  [-2.92663, -37.05509],
  [-2.96434, -37.13041],
  [-3.00732, -37.20286],
  [-3.05536, -37.27205],
  [-3.10822, -37.33764],
  [-3.16561, -37.39929],
  [-3.22726, -37.45668],
  [-3.29285, -37.50954],
  [-3.36204, -37.55758],
  [-3.43449, -37.60056],
  [-3.50981, -37.63827],
  [-3.58763, -37.67050],
  [-3.66756, -37.69710],
  [-3.74917, -37.71793],
  [-3.83207, -37.73289],
  [-3.91582, -37.74189],
  [-4.00000, -37.74490],
  [-4.08418, -37.74189],
  [-4.16793, -37.73289],
  [-4.25083, -37.71793],
  [-4.33244, -37.69710],
  [-4.41237, -37.67050],
  [-4.49019, -37.63827],
  [-4.56551, -37.60056],
  [-4.63796, -37.55758],
  [-4.70715, -37.50954],
  [-4.77274, -37.45668],
  [-4.83439, -37.39929],
  [-4.89178, -37.33764],
  [-4.94464, -37.27205]
]

const xactoNo11Raw = () => {
  const outer = polygon({ points: XACTO_OUTER_POINTS })
  const hole = polygon({ points: [...XACTO_HOLE_POINTS].reverse() })
  const outline = subtract(outer, hole)
  return extrudeLinear({ height: XACTO_EXTRUDE_HEIGHT }, outline)
}

const xactoNo11Cutter = () => {
  const outer = polygon({ points: XACTO_OUTER_POINTS })
  const hole = polygon({ points: [...XACTO_HOLE_POINTS].reverse() })
  // Explicit per-contour tolerance:
  // - outer grows outward (+delta)
  // - inner slot shrinks inward (-delta)
  const outerExpanded = expand({ delta: XACTO_TOLERANCE_2D }, outer)
  const holeShrunk = expand({ delta: -XACTO_TOLERANCE_2D }, hole)
  const tolerant2D = subtract(outerExpanded, holeShrunk)
  return extrudeLinear({ height: XACTO_EXTRUDE_HEIGHT }, tolerant2D)
}

const sourceAnchors = () => ({
  a: XACTO_OUTER_POINTS[5], // [0.00000, 0.00000]
  b: XACTO_OUTER_POINTS[6] // [-8.36000, -23.56000]
})

const targetAnchors = () => {
  // Place anchors on opposite long edges (y=0 and y=KNIFE_CUT_DEPTH) while keeping
  // distance equal to source anchor spacing (rigid transform only).
  const { a, b } = sourceAnchors()
  const d = Math.hypot(b[0] - a[0], b[1] - a[1])
  const dx = Math.sqrt(Math.max(0, d * d - KNIFE_CUT_DEPTH * KNIFE_CUT_DEPTH))
  const midX = BLOCK_LENGTH / 2
  return {
    a: [midX - dx / 2, 0],
    b: [midX + dx / 2, KNIFE_CUT_DEPTH]
  }
}

const placementFromAnchors = () => {
  const src = sourceAnchors()
  const dst = targetAnchors()
  const sa = src.a
  const sb = src.b
  const ta = dst.a
  const tb = dst.b

  const sourceAngle = Math.atan2(sb[1] - sa[1], sb[0] - sa[0])
  const targetAngle = Math.atan2(tb[1] - ta[1], tb[0] - ta[0])
  const angle = targetAngle - sourceAngle

  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const saxr = sa[0] * c - sa[1] * s
  const sayr = sa[0] * s + sa[1] * c

  return {
    angle,
    dx: ta[0] - saxr,
    dy: ta[1] - sayr
  }
}

const anchorReferencePlane = () => {
  const { a, b } = sourceAnchors()
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

  const plane = cuboid({ size: [len, 0.2, 5] })
  return translate([mid[0], mid[1], 2.5], rotateZ(angle, plane))
}

/** Two cylinders (axis +Z) through the yellow footprint, straddling the blade slot. */
const yellowBlockMountHoleCutters = (angle, dx, dy) => {
  const { a: sa, b: sb } = sourceAnchors()
  const vx = sb[0] - sa[0]
  const vy = sb[1] - sa[1]
  const vlen = Math.hypot(vx, vy)
  const px = -vy / vlen
  const py = vx / vlen

  const wx0 = BLOCK_LENGTH / 2
  const wy0 = KNIFE_CUT_DEPTH + TOP_BLOCK_THICKNESS / 2
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const cx0 = (wx0 - dx) * c + (wy0 - dy) * s
  const cy0 = -(wx0 - dx) * s + (wy0 - dy) * c

  const hole1Local = [cx0 + px * MOUNT_HOLE_PERP_OFFSET, cy0 + py * MOUNT_HOLE_PERP_OFFSET]
  const hole2Local = [cx0 - px * MOUNT_HOLE_PERP_OFFSET, cy0 - py * MOUNT_HOLE_PERP_OFFSET]

  const toWorldXY = ([lx, ly]) => [lx * c - ly * s + dx, lx * s + ly * c + dy]

  const [x1, y1] = toWorldXY(hole1Local)
  const [x2, y2] = toWorldXY(hole2Local)
  const hz = YELLOW_BLOCK_HEIGHT + 0.02
  const cyl = () =>
    cylinder({ height: hz, radius: MOUNT_HOLE_DIAMETER / 2, segments: 48 })

  return union(
    translate([x1, y1, YELLOW_BLOCK_HEIGHT / 2], cyl()),
    translate([x2, y2, YELLOW_BLOCK_HEIGHT / 2], cyl())
  )
}

const foamcutterV2 = () => {
  const block = translate(
    [BLOCK_LENGTH / 2, KNIFE_CUT_DEPTH / 2, BLOCK_THICKNESS / 2],
    cuboid({ size: [BLOCK_LENGTH, KNIFE_CUT_DEPTH, BLOCK_THICKNESS] })
  )
  const oppositeSideBlock = translate(
    [BLOCK_LENGTH / 2, -GREEN_BLOCK_WIDTH / 2, BLOCK_THICKNESS / 2],
    cuboid({ size: [BLOCK_LENGTH, GREEN_BLOCK_WIDTH, BLOCK_THICKNESS] })
  )
  // Secondary support block runs along +Y (not stacked in Z).
  const topBlock = translate(
    [BLOCK_LENGTH / 2, KNIFE_CUT_DEPTH + TOP_BLOCK_THICKNESS / 2, YELLOW_BLOCK_HEIGHT / 2],
    cuboid({ size: [BLOCK_LENGTH, TOP_BLOCK_THICKNESS, YELLOW_BLOCK_HEIGHT] })
  )
  const { angle, dx, dy } = placementFromAnchors()
  // Keep the cutout on the top face: cutter occupies the top XACTO_EXTRUDE_HEIGHT of yellow block.
  const bladeCutter = translate(
    [dx, dy, YELLOW_BLOCK_HEIGHT - XACTO_EXTRUDE_HEIGHT],
    rotateZ(angle, xactoNo11Cutter())
  )
  const mountHoles = yellowBlockMountHoleCutters(angle, dx, dy)
  const topBlockWithSlot = subtract(topBlock, union(bladeCutter, mountHoles))
  const guide = translate([dx, dy, YELLOW_BLOCK_HEIGHT], rotateZ(angle, anchorReferencePlane()))

  return [
    colorize([0.18, 0.55, 0.9, 1.0], block),
    colorize([0.94, 0.79, 0.16, 0.95], topBlockWithSlot),
    colorize([0.1, 0.8, 0.2, 0.95], oppositeSideBlock),
    // colorize([0.1, 0.8, 0.2, 0.9], guide)
  ]
}

const main = () => foamcutterV2()

module.exports = { main, foamcutterV2, xactoNo11Raw }


