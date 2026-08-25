const fs = require('fs')
const path = require('path')
const { stl2png } = require('@scalenc/stl-to-png')

const stlPath = path.join(__dirname, 'adapter.stl')
const stl = fs.readFileSync(stlPath)

const views = {
  'adapter-iso.png': [120, -120, 100],
  'adapter-front.png': [0, -200, 0]
}
for (const [file, cameraPosition] of Object.entries(views)) {
  const png = stl2png(stl, { width: 900, height: 700, cameraPosition })
  fs.writeFileSync(path.join(__dirname, file), png)
  console.log('wrote', file)
}
