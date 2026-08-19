const fs = require('fs')
const path = require('path')
const { stl2png, makeStandardMaterial, makeEdgeMaterial, makeAmbientLight, makeDirectionalLight } = require('@scalenc/stl-to-png')
const { serialize } = require('@jscad/stl-serializer')
const { colorize } = require('@jscad/modeling').colors
const { union } = require('@jscad/modeling').booleans
const { rotateX, translate } = require('@jscad/modeling').transforms
const { cylinder } = require('@jscad/modeling').primitives
const { main } = require('./adapter.jscad')

function toBuffer(shape) {
  const raw = serialize({ binary: true }, shape)
  return Buffer.concat(raw.map((ab) => Buffer.from(ab)))
}

const piece1 = main()
const piece2 = rotateX(Math.PI, main())
const tube = translate(
  [30, 0, 0],
  rotateX(Math.PI / 2, cylinder({ radius: 25.5, height: 200, segments: 64 }))
)

const assembly = union(piece1, piece2, tube)
const buf = toBuffer(assembly)

const opts = {
  width: 1000,
  height: 900,
  backgroundColor: 0xffffff,
  materials: [makeStandardMaterial(1, 0x3a7bd5)],
  edgeMaterials: [makeEdgeMaterial(1, 0x1a1a1a)],
  lights: [makeAmbientLight(0xffffff, 0.6), makeDirectionalLight(1, 1, 1, 0xffffff, 0.8)]
}

const views = {
  'assembly-iso.png': [150, -150, 150],
  'assembly-end.png': [200, 0, 0]
}
for (const [file, cameraPosition] of Object.entries(views)) {
  const png = stl2png(buf, { ...opts, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('wrote', file)
}
