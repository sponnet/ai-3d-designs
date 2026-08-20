#!/usr/bin/env node
// PNG preview renderer for ring.stl, partition.stl and the totemik-guts
// STLs, using @scalenc/stl-to-png. The partition previews are zoomed
// slices (the full 150mm part renders too small at that scale to see the
// 1.5mm slot or the notches).
const fs = require('fs')
const path = require('path')
const { stl2png, makeStandardMaterial, makeEdgeMaterial, makeAmbientLight, makeDirectionalLight } = require('@scalenc/stl-to-png')
const { main } = require('./partition.jscad')
const { intersect } = require('@jscad/modeling').booleans
const { cuboid } = require('@jscad/modeling').primitives
const { serialize } = require('@jscad/stl-serializer')

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

// --- ring.stl ---
const ringStlData = fs.readFileSync(path.join(__dirname, 'ring.stl'))
const ringViews = {
  'ring.png': [0, -5, 150], // top-down, matches the hand sketch orientation
  'ring-iso.png': [60, -80, 60] // isometric, shows band height
}
for (const [file, cameraPosition] of Object.entries(ringViews)) {
  const png = stl2png(ringStlData, { ...baseOptions, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}

// --- partition.stl ---
const partitionStlData = fs.readFileSync(path.join(__dirname, 'partition.stl'))
const partitionBaseOptions = { ...baseOptions, width: 1400, height: 500 }

const isoPng = stl2png(partitionStlData, { ...partitionBaseOptions, cameraPosition: [40, -60, 40] })
fs.writeFileSync(path.join(__dirname, 'partition-iso.png'), isoPng)
console.log('Wrote partition-iso.png')

function toBuffer(shape) {
  const raw = serialize({ binary: true }, shape)
  return Buffer.concat(raw.map((ab) => Buffer.from(ab)))
}

// Slice from x=-1 to x=12: keeps the part's real end cap (x=0) intact and
// cuts only on the far, already-solid side, so the render shows the actual
// end-slot geometry without an artificial cut face confusing the picture.
const sliced = intersect(main(), cuboid({ size: [13, 10, 15], center: [5.5, 0, 5] }))
const detailPng = stl2png(toBuffer(sliced), {
  width: 1100,
  height: 800,
  backgroundColor: 0xffffff,
  cameraPosition: [-15, 25, -16],
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1.5, 0x000000)],
  lights: [makeAmbientLight(0xffffff, 0.7), makeDirectionalLight(0, -1, -1, 0xffffff, 0.7)]
})
fs.writeFileSync(path.join(__dirname, 'partition-detail.png'), detailPng)
console.log('Wrote partition-detail.png (end slice from below, showing the end-slot)')

// Middle slice, from the top/side: shows the notch pattern along the flat top.
const topSliced = intersect(main(), cuboid({ size: [8, 10, 15], center: [50, 0, 5] }))
const topDetailPng = stl2png(toBuffer(topSliced), {
  width: 1200,
  height: 800,
  backgroundColor: 0xffffff,
  cameraPosition: [50, -12, 15],
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1, 0x000000)],
  lights: [makeAmbientLight(0xffffff, 0.7), makeDirectionalLight(0, -1, 1, 0xffffff, 0.7)]
})
fs.writeFileSync(path.join(__dirname, 'partition-top-detail.png'), topDetailPng)
console.log('Wrote partition-top-detail.png (middle slice, showing the top notches)')

// --- totemik-guts.stl / totemik-guts-outer.stl ---
// Separate ring + beam exploration, different dimensions from ring.jscad.
const gutsFiles = ['totemik-guts.stl', 'totemik-guts-outer.stl']
for (const stlFile of gutsFiles) {
  const stlData = fs.readFileSync(path.join(__dirname, stlFile))
  const png = stl2png(stlData, { ...baseOptions, width: 900, height: 700 })
  const pngFile = stlFile.replace(/\.stl$/, '.png')
  fs.writeFileSync(path.join(__dirname, pngFile), png)
  console.log('Wrote', pngFile)
}

// --- bottom-plug.stl ---
// Tube foot: push-fit plug + large hemisphere, unrelated to ring/partition.
const bottomPlugStlData = fs.readFileSync(path.join(__dirname, 'bottom-plug.stl'))
const bottomPlugViews = {
  'bottom-plug-iso.png': [120, -120, 60],
  'bottom-plug-front.png': [0, -200, 0]
}
for (const [file, cameraPosition] of Object.entries(bottomPlugViews)) {
  const png = stl2png(bottomPlugStlData, { ...baseOptions, width: 900, height: 700, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}
