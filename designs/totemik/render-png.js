#!/usr/bin/env node
// One-off PNG preview renderer for ring.stl using @scalenc/stl-to-png
const fs = require('fs')
const path = require('path')
const { stl2png, makeStandardMaterial, makeEdgeMaterial, makeAmbientLight, makeDirectionalLight } = require('@scalenc/stl-to-png')

const stlPath = path.join(__dirname, 'ring.stl')

const stlData = fs.readFileSync(stlPath)

const baseOptions = {
  width: 900,
  height: 900,
  backgroundColor: 0xffffff,
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1, 0x1a1a1a)],
  lights: [
    makeAmbientLight(0xffffff, 0.6),
    makeDirectionalLight(1, 1, 1, 0xffffff, 0.8)
  ]
}

const views = {
  'ring.png': [0, -5, 150], // top-down, matches the hand sketch orientation
  'ring-iso.png': [60, -80, 60] // isometric, shows band height
}

for (const [file, cameraPosition] of Object.entries(views)) {
  const png = stl2png(stlData, { ...baseOptions, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}
