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

// --- keypad.stl ---
// 4-key Cherry MX bar with mounting tabs, unrelated to the other parts.
const keypadStlData = fs.readFileSync(path.join(__dirname, 'keypad.stl'))
const keypadViews = {
  'keypad-iso.png': [40, -80, 60],
  'keypad-top.png': [40, 11, 200]
}
for (const [file, cameraPosition] of Object.entries(keypadViews)) {
  const png = stl2png(keypadStlData, { ...baseOptions, width: 1100, height: 500, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}

// --- gear-ring.stl ---
// Toothed ring + raised collar, unrelated to the other parts.
const gearRingStlData = fs.readFileSync(path.join(__dirname, 'gear-ring.stl'))
const gearRingViews = {
  'gear-ring-iso.png': [80, -80, 80],
  'gear-ring-top.png': [0, 0, 200]
}
for (const [file, cameraPosition] of Object.entries(gearRingViews)) {
  const png = stl2png(gearRingStlData, { ...baseOptions, width: 900, height: 900, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}

// --- totemik-guts-coupler.stl ---
// Straight coupler joining 2 totemik-guts.jscad pieces end to end.
const couplerStlData = fs.readFileSync(path.join(__dirname, 'totemik-guts-coupler.stl'))
const couplerViews = {
  'totemik-guts-coupler.png': [80, -60, 20]
}
for (const [file, cameraPosition] of Object.entries(couplerViews)) {
  const png = stl2png(couplerStlData, { ...baseOptions, width: 900, height: 700, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}

// --- mic-holder.stl ---
// Open-bottom tray for a microphone, unrelated to the other parts.
const micHolderStlData = fs.readFileSync(path.join(__dirname, 'mic-holder.stl'))
const micHolderViews = {
  'mic-holder-iso.png': [60, -60, 40],
  'mic-holder-top.png': [17.5, 7, 100]
}
for (const [file, cameraPosition] of Object.entries(micHolderViews)) {
  const png = stl2png(micHolderStlData, { ...baseOptions, width: 900, height: 700, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}

// --- bottom-support.stl ---
// Half-arc of a hollow cylinder (only x<=0, per CUT_RIGHT_HALF in the
// source), unrelated to the other parts. A thin slab through the axis
// is also rendered to show the internal wall profile -- a cylinder
// sliced through its own axis shows a rectangle (not a circle), so this
// comes out as a bracket-shaped profile.
const bottomSupportStlData = fs.readFileSync(path.join(__dirname, 'bottom-support.stl'))
const bottomSupportViews = {
  'bottom-support-iso.png': [70, -70, 50],
  'bottom-support-top.png': [0, 0, 150]
}
for (const [file, cameraPosition] of Object.entries(bottomSupportViews)) {
  const png = stl2png(bottomSupportStlData, { ...baseOptions, width: 900, height: 900, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('Wrote', file)
}

const { main: bottomSupportMain } = require('./bottom-support.jscad')
const bottomSupportSliced = intersect(bottomSupportMain(), cuboid({ size: [70, 4, 70], center: [-35, 0, 0] }))
const bottomSupportSlicedPng = stl2png(toBuffer(bottomSupportSliced), {
  width: 900,
  height: 700,
  backgroundColor: 0xffffff,
  cameraPosition: [10, -250, 5],
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1.5, 0x000000)],
  lights: [makeAmbientLight(0xffffff, 0.7), makeDirectionalLight(0, -1, 0, 0xffffff, 0.7)]
})
fs.writeFileSync(path.join(__dirname, 'bottom-support-cross-section.png'), bottomSupportSlicedPng)
console.log('Wrote bottom-support-cross-section.png')

// --- wall-hook.stl ---
// Round rod bent flat in one plane: long shaft (180mm tall), rounded
// tip at the bottom, a wide bend into a short "rectangular" top section
// (24 x 16mm) that curls back into a small round hook (8mm radius) at
// the tip. Unrelated in dimensions to the other parts in this folder.
const wallHookStlData = fs.readFileSync(path.join(__dirname, 'wall-hook.stl'))
// Flat profile lying in the XY plane (only 5mm thick in Z), so a
// top-down camera (looking down the Z axis) is the view that actually
// shows its silhouette, not an edge-on sliver.
const wallHookPng = stl2png(wallHookStlData, { ...baseOptions, width: 400, height: 1000, cameraPosition: [13, 99, 400] })
fs.writeFileSync(path.join(__dirname, 'wall-hook-front.png'), wallHookPng)
console.log('Wrote wall-hook-front.png')

const { main: wallHookMain } = require('./wall-hook.jscad')
// Crop to just the top bend (roughly y = 160..200), where the 180-degree
// hook actually lives -- at the part's full 180mm foot length that
// detail renders too small to read.
const wallHookDetail = intersect(wallHookMain(), cuboid({ size: [50, 50, 15], center: [13, 180, 2.5] }))
const wallHookDetailPng = stl2png(toBuffer(wallHookDetail), {
  width: 900,
  height: 700,
  backgroundColor: 0xffffff,
  cameraPosition: [13, 180, 200],
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1.5, 0x000000)],
  lights: [makeAmbientLight(0xffffff, 0.7), makeDirectionalLight(0, -1, 1, 0xffffff, 0.7)]
})
fs.writeFileSync(path.join(__dirname, 'wall-hook-detail.png'), wallHookDetailPng)
console.log('Wrote wall-hook-detail.png (top bend detail)')

// --- hinge-bracket.stl ---
// Flat mounting base necking into a narrower, rounded-corner boss with
// a pivot hole. Standalone part, unrelated in dimensions to the other
// parts in this folder (not yet coupled to wall-hook.jscad).
const hingeBracketStlData = fs.readFileSync(path.join(__dirname, 'hinge-bracket.stl'))
const hingeBracketPng = stl2png(hingeBracketStlData, { ...baseOptions, width: 600, height: 600, cameraPosition: [0, 0, 300] })
fs.writeFileSync(path.join(__dirname, 'hinge-bracket-front.png'), hingeBracketPng)
console.log('Wrote hinge-bracket-front.png')
