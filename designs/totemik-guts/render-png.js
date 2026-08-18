const fs = require('fs')
const path = require('path')
const { stl2png } = require('@scalenc/stl-to-png')

const stlPath = path.join(__dirname, 'totemik-guts.stl')
const pngPath = path.join(__dirname, 'totemik-guts.png')

const stl = fs.readFileSync(stlPath)
const png = stl2png(stl, { width: 900, height: 700 })
fs.writeFileSync(pngPath, png)
console.log('wrote', pngPath)
