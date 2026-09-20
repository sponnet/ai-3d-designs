#!/usr/bin/env node
// PNG preview renderer for leg.stl, using @scalenc/stl-to-png.
const fs = require('fs')
const path = require('path')
const { stl2png, makeStandardMaterial, makeEdgeMaterial, makeAmbientLight, makeDirectionalLight } = require('@scalenc/stl-to-png')

const baseOptions = {
  width: 1200,
  height: 500,
  backgroundColor: 0xffffff,
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1, 0x1a1a1a)],
  lights: [
    makeAmbientLight(0xffffff, 0.6),
    makeDirectionalLight(1, 1, 1, 0xffffff, 0.8)
  ]
}

const stlData = fs.readFileSync(path.join(__dirname, 'leg.stl'))

const views = {
  'leg-top.png': { ...baseOptions, cameraPosition: [65, 10, 250] }, // top-down, shows the slot clearly
  'leg-iso.png': { ...baseOptions, width: 1200, height: 700, cameraPosition: [180, -180, 120] } // isometric
}

for (const [file, options] of Object.entries(views)) {
  const png = stl2png(stlData, options)
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}
