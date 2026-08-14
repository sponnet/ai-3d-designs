const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans

// mm, Z up, band centered on the finger axis (Z), band footprint in XY
// Sketch: circular band with a notch cut at the top; two bar-shaped blocks
// sit on the outer surface, one on each side of the notch.
const INNER_DIAMETER = 51 // ring inner diameter
const WALL_THICKNESS = 1 // radial band thickness
const BAND_HEIGHT = 10 // extrusion height (band width worn on the finger)
const NOTCH_WIDTH = 5 // width of the cutout at the top of the band
const BLOCK_WIDTH = 5 // block width, tangential, flush against each notch edge
const BLOCK_HEIGHT = 5 // block height along Z, centered on the band height
const BLOCK_DEPTH = 3 // block protrusion beyond the outer surface (not specified in sketch, assumed)
const CYLINDER_SEGMENTS = 128

const main = (params = {}) => {
  const innerDiameter = params.INNER_DIAMETER ?? INNER_DIAMETER
  const wall = params.WALL_THICKNESS ?? WALL_THICKNESS
  const bandHeight = params.BAND_HEIGHT ?? BAND_HEIGHT
  const notchWidth = params.NOTCH_WIDTH ?? NOTCH_WIDTH
  const blockWidth = params.BLOCK_WIDTH ?? BLOCK_WIDTH
  const blockHeight = params.BLOCK_HEIGHT ?? BLOCK_HEIGHT
  const blockDepth = params.BLOCK_DEPTH ?? BLOCK_DEPTH

  const innerR = innerDiameter / 2
  const outerR = innerR + wall

  // Add the two block lobes to the solid outer cylinder *before* the inner
  // hole is cut. This makes the lobes fuse seamlessly with the wall (no
  // tangent-only contact with the curved surface) and lets the inner-cylinder
  // subtraction carve them out down to the same clean bore as the rest of
  // the band, so the inner diameter stays true under the blocks too.
  const outerCyl = cylinder({ height: bandHeight, radius: outerR, segments: CYLINDER_SEGMENTS, center: [0, 0, bandHeight / 2] })
  const lobeY = (outerR + blockDepth) / 2
  const lobeLeft = cuboid({
    size: [blockWidth, outerR + blockDepth, blockHeight],
    center: [-(notchWidth / 2 + blockWidth / 2), lobeY, bandHeight / 2]
  })
  const lobeRight = cuboid({
    size: [blockWidth, outerR + blockDepth, blockHeight],
    center: [notchWidth / 2 + blockWidth / 2, lobeY, bandHeight / 2]
  })
  const outerWithLobes = union(outerCyl, lobeLeft, lobeRight)

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
  { name: 'BLOCK_WIDTH', type: 'float', initial: 5, caption: 'Block width (mm)' },
  { name: 'BLOCK_HEIGHT', type: 'float', initial: 5, caption: 'Block height (mm)' },
  { name: 'BLOCK_DEPTH', type: 'float', initial: 3, caption: 'Block protrusion beyond outer surface (mm)' }
]

module.exports = { main, getParameterDefinitions }
