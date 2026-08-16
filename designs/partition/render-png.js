#!/usr/bin/env node
// PNG preview renderer for partition.stl using @scalenc/stl-to-png.
// Produces a full-length overview and a zoomed-in slice (from below) that
// shows the slot / bridge detail, since the full 150mm part renders too
// small at that scale to see the 1.5mm slot.
const fs = require('fs')
const path = require('path')
const { stl2png, makeStandardMaterial, makeEdgeMaterial, makeAmbientLight, makeDirectionalLight } = require('@scalenc/stl-to-png')
const { main } = require('./partition.jscad')
const { intersect } = require('@jscad/modeling').booleans
const { cuboid } = require('@jscad/modeling').primitives
const { serialize } = require('@jscad/stl-serializer')

const stlPath = path.join(__dirname, 'partition.stl')
const stlData = fs.readFileSync(stlPath)

const baseOptions = {
  width: 1400,
  height: 500,
  backgroundColor: 0xffffff,
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1, 0x1a1a1a)],
  lights: [
    makeAmbientLight(0xffffff, 0.6),
    makeDirectionalLight(1, 1, 1, 0xffffff, 0.8)
  ]
}

const isoPng = stl2png(stlData, { ...baseOptions, cameraPosition: [40, -60, 40] })
fs.writeFileSync(path.join(__dirname, 'partition-iso.png'), isoPng)
console.log('Wrote partition-iso.png')

function toBuffer(shape) {
  const raw = serialize({ binary: true }, shape)
  return Buffer.concat(raw.map((ab) => Buffer.from(ab)))
}

// 24mm slice (spans one bridge + two slot segments), viewed from underneath
const sliced = intersect(main(), cuboid({ size: [24, 10, 15], center: [12, 0, 5] }))
const detailPng = stl2png(toBuffer(sliced), {
  width: 1100,
  height: 800,
  backgroundColor: 0xffffff,
  cameraPosition: [12, 40, -18],
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1.5, 0x000000)],
  lights: [makeAmbientLight(0xffffff, 0.7), makeDirectionalLight(0, -1, -1, 0xffffff, 0.7)]
})
fs.writeFileSync(path.join(__dirname, 'partition-detail.png'), detailPng)
console.log('Wrote partition-detail.png (24mm slice from below, showing the slot + a bridge)')
