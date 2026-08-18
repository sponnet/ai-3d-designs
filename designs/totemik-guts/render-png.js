const fs = require('fs')
const path = require('path')
const { stl2png } = require('@scalenc/stl-to-png')

const [, , stlName = 'totemik-guts.stl', pngName = 'totemik-guts.png'] = process.argv
const stlPath = path.join(__dirname, stlName)
const pngPath = path.join(__dirname, pngName)

const stl = fs.readFileSync(stlPath)
const png = stl2png(stl, { width: 900, height: 700 })
fs.writeFileSync(pngPath, png)
console.log('wrote', pngPath)
