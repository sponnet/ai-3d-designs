const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans

// mm, Z up, band centered on the finger axis (Z), band footprint in XY
// A plain band with a notch cut at the top and two bar-shaped blocks on the
// outer surface flanking it. Each block carries a small retaining lip flush
// with its own top (its "tip") — the lip always tracks the block's own top,
// however tall BLOCK_HEIGHT is set to — sized wall_thickness x wall_thickness
// (both its Z height and its sideways overhang beyond the block), so a cord
// tied around the two blocks to pinch the notch shut catches under it.
const INNER_DIAMETER = 51 // ring inner diameter
const WALL_THICKNESS = 1 // radial band thickness; also block thickness and lip height/overhang
const BAND_HEIGHT = 10 // extrusion height (band width worn on the finger)
const NOTCH_WIDTH = 5 // width of the cutout at the top of the band
const BLOCK_HEIGHT = 10 // block height along Z, from the band's bottom (z=0)
const BLOCK_DEPTH = 3 // block protrusion beyond the outer surface (not specified in sketch, assumed)
const CYLINDER_SEGMENTS = 128

const main = (params = {}) => {
  const innerDiameter = params.INNER_DIAMETER ?? INNER_DIAMETER
  const wall = params.WALL_THICKNESS ?? WALL_THICKNESS
  const bandHeight = params.BAND_HEIGHT ?? BAND_HEIGHT
  const notchWidth = params.NOTCH_WIDTH ?? NOTCH_WIDTH
  const blockHeight = params.BLOCK_HEIGHT ?? BLOCK_HEIGHT
  const blockDepth = params.BLOCK_DEPTH ?? BLOCK_DEPTH

  const innerR = innerDiameter / 2
  const outerR = innerR + wall
  const blockWidth = wall // block thickness always matches the wall thickness
  const lipHeight = wall // lip Z-thickness always matches the wall thickness
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

  // blockPillarY centers a pillar that runs from the ring's axis out to the
  // block's outer tip (see the comment above), while lipY centers just the
  // protruding segment (outerR .. outerR + blockDepth) that the lip covers.
  const blockPillarY = (outerR + blockDepth) / 2
  const lipY = outerR + blockDepth / 2
  const lipZ = blockHeight - lipHeight / 2 // flush with the block's own top, whatever BLOCK_HEIGHT is

  const makeBlock = (x) => cuboid({ size: [blockWidth, outerR + blockDepth, blockHeight], center: [x, blockPillarY, blockHeight / 2] })
  // Lip: flush with the block on the notch-facing side, extends sideways
  // (away from the notch, in +/-X) beyond the block's outward-facing side.
  const makeLip = (x, sign) => cuboid({
    size: [blockWidth + lipProtrusion, blockDepth, lipHeight],
    center: [x + sign * (lipProtrusion / 2), lipY, lipZ]
  })

  const leftX = -(notchWidth / 2 + blockWidth / 2)
  const rightX = notchWidth / 2 + blockWidth / 2

  const outerWithLobes = union(outerCyl, makeBlock(leftX), makeBlock(rightX), makeLip(leftX, -1), makeLip(rightX, 1))

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
  { name: 'WALL_THICKNESS', type: 'float', initial: 1, caption: 'Wall thickness (mm) — also block thickness and lip height/overhang' },
  { name: 'BAND_HEIGHT', type: 'float', initial: 10, caption: 'Extrusion height / band height (mm)' },
  { name: 'NOTCH_WIDTH', type: 'float', initial: 5, caption: 'Top notch width (mm)' },
  { name: 'BLOCK_HEIGHT', type: 'float', initial: 10, caption: 'Block height (mm)' },
  { name: 'BLOCK_DEPTH', type: 'float', initial: 3, caption: 'Block protrusion beyond outer surface (mm)' }
]

module.exports = { main, getParameterDefinitions }
