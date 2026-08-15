const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans

// mm, Z up, band centered on the finger axis (Z), band footprint in XY
// Sketch: circular band with a notch cut at the top; two bar-shaped blocks
// sit on the outer surface, one on each side of the notch. Each block carries
// a small lip at its top that overhangs further outward than the block
// itself, so a cord tied around the two blocks (to pinch the notch shut)
// can't slide up over the top and fall off.
const INNER_DIAMETER = 51 // ring inner diameter
const WALL_THICKNESS = 1 // radial band thickness
const BAND_HEIGHT = 10 // extrusion height (band width worn on the finger)
const NOTCH_WIDTH = 5 // width of the cutout at the top of the band
const BLOCK_WIDTH = 2 // block width, tangential, flush against each notch edge
const BLOCK_DEPTH = 3 // block protrusion beyond the outer surface (not specified in sketch, assumed)
const LIP_HEIGHT = 1 // height (Z) of the retaining lip at the top of each block
const LIP_PROTRUSION = 1.5 // how far the lip overhangs beyond the block's outer face (not specified, assumed)
const CYLINDER_SEGMENTS = 128

const main = (params = {}) => {
  const innerDiameter = params.INNER_DIAMETER ?? INNER_DIAMETER
  const wall = params.WALL_THICKNESS ?? WALL_THICKNESS
  const bandHeight = params.BAND_HEIGHT ?? BAND_HEIGHT
  const notchWidth = params.NOTCH_WIDTH ?? NOTCH_WIDTH
  const blockWidth = params.BLOCK_WIDTH ?? BLOCK_WIDTH
  const blockDepth = params.BLOCK_DEPTH ?? BLOCK_DEPTH
  const lipHeight = params.LIP_HEIGHT ?? LIP_HEIGHT
  const lipProtrusion = params.LIP_PROTRUSION ?? LIP_PROTRUSION

  const innerR = innerDiameter / 2
  const outerR = innerR + wall
  const blockHeight = bandHeight // blocks run the full band height

  // Add the two block lobes (plus their retaining lips) to the solid outer
  // cylinder *before* the inner hole is cut. This makes them fuse seamlessly
  // with the wall (no tangent-only contact with the curved surface) and lets
  // the inner-cylinder subtraction carve them out down to the same clean
  // bore as the rest of the band, so the inner diameter stays true under the
  // blocks too.
  const outerCyl = cylinder({ height: bandHeight, radius: outerR, segments: CYLINDER_SEGMENTS, center: [0, 0, bandHeight / 2] })

  const blockY = (outerR + blockDepth) / 2
  const lipY = (outerR + (outerR + blockDepth + lipProtrusion)) / 2
  const lipYSize = blockDepth + lipProtrusion
  const lipZ = bandHeight - lipHeight / 2

  const makeBlock = (x) => cuboid({ size: [blockWidth, outerR + blockDepth, blockHeight], center: [x, blockY, bandHeight / 2] })
  const makeLip = (x) => cuboid({ size: [blockWidth, lipYSize, lipHeight], center: [x, lipY, lipZ] })

  const leftX = -(notchWidth / 2 + blockWidth / 2)
  const rightX = notchWidth / 2 + blockWidth / 2

  const outerWithLobes = union(outerCyl, makeBlock(leftX), makeBlock(rightX), makeLip(leftX), makeLip(rightX))

  const inner = cylinder({ height: bandHeight + 2, radius: innerR, segments: CYLINDER_SEGMENTS, center: [0, 0, bandHeight / 2] })
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
  { name: 'WALL_THICKNESS', type: 'float', initial: 1, caption: 'Wall thickness (mm)' },
  { name: 'BAND_HEIGHT', type: 'float', initial: 10, caption: 'Extrusion height / band height (mm)' },
  { name: 'NOTCH_WIDTH', type: 'float', initial: 5, caption: 'Top notch width (mm)' },
  { name: 'BLOCK_WIDTH', type: 'float', initial: 2, caption: 'Block width (mm)' },
  { name: 'BLOCK_DEPTH', type: 'float', initial: 3, caption: 'Block protrusion beyond outer surface (mm)' },
  { name: 'LIP_HEIGHT', type: 'float', initial: 1, caption: 'Retaining lip height at top of block (mm)' },
  { name: 'LIP_PROTRUSION', type: 'float', initial: 1.5, caption: 'Lip overhang beyond block outer face (mm)' }
]

module.exports = { main, getParameterDefinitions }
