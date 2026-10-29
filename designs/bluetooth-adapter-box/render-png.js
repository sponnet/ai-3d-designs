#!/usr/bin/env node
// PNG previews for the bluetooth adapter box, using @scalenc/stl-to-png.
// Geometry is built directly from the design (same as the exported STLs).
const fs = require('fs')
const path = require('path')
const { stl2png, makeStandardMaterial, makeEdgeMaterial, makeAmbientLight, makeDirectionalLight } = require('@scalenc/stl-to-png')
const { serialize } = require('@jscad/stl-serializer')
const { intersect } = require('@jscad/modeling').booleans
const { cuboid } = require('@jscad/modeling').primitives
const { rotateX } = require('@jscad/modeling').transforms
const { main } = require('./bluetooth-adapter-box.jscad')

const baseOptions = {
  width: 1000,
  height: 800,
  backgroundColor: 0xffffff,
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1, 0x1a1a1a)],
  lights: [makeAmbientLight(0xffffff, 0.6), makeDirectionalLight(1, 1, 1, 0xffffff, 0.8)]
}

// The renderer treats +Y as up; turn the design's Z-up frame into Y-up
// (original -Y side then faces the camera at +Z).
const toBuffer = (shapes) => {
  const yUp = [].concat(shapes).map((g) => rotateX(-Math.PI / 2, g))
  const raw = serialize({ binary: true }, yUp)
  return Buffer.concat(raw.map((ab) => Buffer.from(ab)))
}

const write = (file, stlData, cameraPosition) => {
  fs.writeFileSync(path.join(__dirname, file), stl2png(stlData, { ...baseOptions, cameraPosition }))
  console.log('Wrote', file)
}

write('bluetooth-adapter-box.png', toBuffer(main({ part: 'print' })), [70, 70, 80])
write('box.png', toBuffer(main({ part: 'box' })), [55, 30, -50]) // +X and +Y sides show both holes
write('lid.png', toBuffer(main({ part: 'lid' })), [-40, 60, 60])
write('lid-outside.png', toBuffer(main({ part: 'lid' })), [0, -70, 8]) // plate side with the grille, nearly straight on

// Assembled, cut in half at y = 0 to show the lid lip seated in the box.
const half = cuboid({ size: [60, 20, 30], center: [0, 10, 10] })
const section = main({ part: 'assembled' }).map((g) => intersect(g, half))
write('assembled-section.png', toBuffer(section), [-35, 30, 70])
