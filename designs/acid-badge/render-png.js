#!/usr/bin/env node
// PNG preview renderer for acid-badge.stl.
const fs = require('fs')
const path = require('path')
const { stl2png, makeStandardMaterial, makeEdgeMaterial, makeAmbientLight, makeDirectionalLight } = require('@scalenc/stl-to-png')

const baseOptions = {
  width: 900,
  height: 900,
  backgroundColor: 0xffffff,
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(0.5, 0x1a1a1a)],
  lights: [
    makeAmbientLight(0xffffff, 0.6),
    makeDirectionalLight(1, 1, 1, 0xffffff, 0.8)
  ]
}

const stlData = fs.readFileSync(path.join(__dirname, 'acid-badge.stl'))
const views = {
  'acid-badge-top.png': [0, 0, 200],
  'acid-badge-iso.png': [60, -60, 60]
}
for (const [file, cameraPosition] of Object.entries(views)) {
  const png = stl2png(stlData, { ...baseOptions, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}
