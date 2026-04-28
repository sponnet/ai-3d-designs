const {
  makeLambertMaterial,
  makeAmbientLight,
  makeDirectionalLight
} = require('@scalenc/stl-to-png')

const PRETTY_RENDER_OPTIONS = {
  width: 1400,
  height: 1000,
  backgroundColor: 0x0f172a,
  backgroundAlpha: 1,
  cameraPosition: [2.2, -1.8, 1.6],
  materials: [makeLambertMaterial(1)],
  edgeMaterials: [],
  lights: [
    makeAmbientLight(0xbfd3ff, 0.95),
    makeDirectionalLight(2.5, 2.0, 2.2, 0xffffff, 1.25),
    makeDirectionalLight(-2.0, -1.0, 1.6, 0x7aa2ff, 0.75),
    makeDirectionalLight(0.0, 0.0, -2.0, 0x1f2a44, 0.35)
  ]
}

module.exports = { PRETTY_RENDER_OPTIONS }
