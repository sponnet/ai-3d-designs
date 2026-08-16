const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
const { rotateZ } = require('@jscad/modeling').transforms

// mm, Z up, band centered on the finger axis (Z), band footprint in XY
// A plain band with a notch cut at the top and two bar-shaped blocks on the
// outer surface flanking it. Each block carries a small retaining lip that
// always hangs off its outer end (radially, away from the ring) — the lip
// tracks that end dynamically as LIP_DEPTH or BLOCK_DEPTH change. The lip's
// own Z height always matches the band's extrusion height (not the block's,
// which is independently adjustable), and its sideways overhang always
// matches the wall thickness, so a cord tied around the two blocks to pinch
// the notch shut catches under it.
const INNER_DIAMETER = 51 // ring inner diameter
const WALL_THICKNESS = 1 // radial band thickness; also block thickness and lip overhang
const BAND_HEIGHT = 10 // extrusion height (band width worn on the finger); also lip height
const NOTCH_WIDTH = 5 // width of the cutout at the top of the band
const BLOCK_HEIGHT = 10 // block height along Z, from the band's bottom (z=0)
const BLOCK_DEPTH = 3 // block protrusion beyond the outer surface (not specified in sketch, assumed)
const LIP_DEPTH = 3 // how far the lip reaches inward from the block's outer end (not specified, assumed)
const RIDGE_COUNT = 8 // number of ridges, evenly spaced around the full circle
const RIDGE_WIDTH = 1.5 // ridge width, tangential
const RIDGE_PROTRUSION = 3 // ridge protrusion beyond the outer surface
const CYLINDER_SEGMENTS = 128

const main = (params = {}) => {
  const innerDiameter = params.INNER_DIAMETER ?? INNER_DIAMETER
  const wall = params.WALL_THICKNESS ?? WALL_THICKNESS
  const bandHeight = params.BAND_HEIGHT ?? BAND_HEIGHT
  const notchWidth = params.NOTCH_WIDTH ?? NOTCH_WIDTH
  const blockHeight = params.BLOCK_HEIGHT ?? BLOCK_HEIGHT
  const blockDepth = params.BLOCK_DEPTH ?? BLOCK_DEPTH
  const lipDepth = params.LIP_DEPTH ?? LIP_DEPTH
  const ridgeCount = params.RIDGE_COUNT ?? RIDGE_COUNT
  const ridgeWidth = params.RIDGE_WIDTH ?? RIDGE_WIDTH
  const ridgeProtrusion = params.RIDGE_PROTRUSION ?? RIDGE_PROTRUSION

  const innerR = innerDiameter / 2
  const outerR = innerR + wall
  const blockWidth = wall // block thickness always matches the wall thickness
  const lipHeight = bandHeight // lip Z-height always matches the extrusion height
  const lipProtrusion = wall // lip sideways overhang always matches the wall thickness

  // Add the two block lobes (plus their lips) to the solid outer cylinder
  // *before* the inner hole is cut. This makes them fuse seamlessly with the
  // wall (no tangent-only contact with the curved surface) and lets the
  // inner-cylinder subtraction carve them out down to the same clean bore as
  // the rest of the band, so the inner diameter stays true under the blocks
  // too. The inner cutter is sized to whichever of band/block is tallest, so
  // the bore stays clear even if a block rises above (or stops below) the
  // band's own height.
  const outerCyl = cylinder({ height: bandHeight, radius: outerR, segments: CYLINDER_SEGMENTS, center: [0, 0, bandHeight / 2] })

  const blockTipY = outerR + blockDepth // the block's outer end
  // blockPillarY centers a pillar that runs from the ring's axis out to the
  // block's outer end, while lipY centers just the lipDepth-deep segment
  // that ends exactly at that same outer end, however LIP_DEPTH is set.
  const blockPillarY = blockTipY / 2
  const lipY = blockTipY - lipDepth / 2

  const makeBlock = (x) => cuboid({ size: [blockWidth, blockTipY, blockHeight], center: [x, blockPillarY, blockHeight / 2] })
  // Lip: flush with the block on the notch-facing side, extends sideways
  // (away from the notch, in +/-X) beyond the block's outward-facing side.
  const makeLip = (x, sign) => cuboid({
    size: [blockWidth + lipProtrusion, lipDepth, lipHeight],
    center: [x + sign * (lipProtrusion / 2), lipY, lipHeight / 2]
  })

  const leftX = -(notchWidth / 2 + blockWidth / 2)
  const rightX = notchWidth / 2 + blockWidth / 2

  // Ridges: N spokes evenly spaced around the full circle, built the same
  // way as the blocks (a pillar running from the ring's axis out to its own
  // tip) and rotated into place, so they also fuse cleanly and stay clear
  // of the bore after the inner-cylinder subtraction below.
  const ridgeTipY = outerR + ridgeProtrusion
  const ridgePillar = cuboid({ size: [ridgeWidth, ridgeTipY, bandHeight], center: [0, ridgeTipY / 2, bandHeight / 2] })
  const ridges = []
  for (let i = 0; i < ridgeCount; i++) {
    ridges.push(rotateZ((2 * Math.PI * i) / ridgeCount, ridgePillar))
  }

  const outerWithLobes = union(outerCyl, makeBlock(leftX), makeBlock(rightX), makeLip(leftX, -1), makeLip(rightX, 1), ...ridges)

  const innerHeight = Math.max(bandHeight, blockHeight)
  const inner = cylinder({ height: innerHeight + 4, radius: innerR, segments: CYLINDER_SEGMENTS, center: [0, 0, innerHeight / 2] })
  const bandWithBlocks = subtract(outerWithLobes, inner)

  // Notch: cut fully through the wall at the top of the circle (+Y direction)
  const notch = cuboid({
    size: [notchWidth, wall + 2, bandHeight + 2],
    center: [0, (innerR + outerR) / 2, bandHeight / 2]
  })

  return subtract(bandWithBlocks, notch)
}

const getParameterDefinitions = () => [
  { name: 'INNER_DIAMETER', type: 'float', initial: 51, caption: 'Inner diameter (mm)' },
  { name: 'WALL_THICKNESS', type: 'float', initial: 1, caption: 'Wall thickness (mm) — also block thickness and lip overhang' },
  { name: 'BAND_HEIGHT', type: 'float', initial: 10, caption: 'Extrusion height / band height (mm) — also lip height' },
  { name: 'NOTCH_WIDTH', type: 'float', initial: 5, caption: 'Top notch width (mm)' },
  { name: 'BLOCK_HEIGHT', type: 'float', initial: 10, caption: 'Block height (mm)' },
  { name: 'BLOCK_DEPTH', type: 'float', initial: 3, caption: 'Block protrusion beyond outer surface (mm)' },
  { name: 'LIP_DEPTH', type: 'float', initial: 3, caption: 'Lip reach inward from the block\'s outer end (mm)' },
  { name: 'RIDGE_COUNT', type: 'int', initial: 8, caption: 'Number of ridges around the circle' },
  { name: 'RIDGE_WIDTH', type: 'float', initial: 1.5, caption: 'Ridge width, tangential (mm)' },
  { name: 'RIDGE_PROTRUSION', type: 'float', initial: 3, caption: 'Ridge protrusion beyond outer surface (mm)' }
]

module.exports = { main, getParameterDefinitions }
