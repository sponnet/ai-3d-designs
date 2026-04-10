/**
 * Export foamcutter.jscad → foamcutter.stl → foamcutter.png.
 * Run from repo root: npm run foamcutter:png
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { stl2png } = require('@scalenc/stl-to-png')

const designDir = __dirname
const repoRoot = path.join(designDir, '..', '..')
const jscadFile = path.join(designDir, 'foamcutter.jscad')
const stlPath = path.join(designDir, 'foamcutter.stl')
const pngPath = path.join(designDir, 'foamcutter.png')

if (!fs.existsSync(jscadFile)) {
  console.error('Missing foamcutter.jscad in', designDir)
  process.exit(1)
}

execSync(`npx jscad "${jscadFile}" -o "${stlPath}"`, { cwd: repoRoot, stdio: 'inherit' })

const stlBuf = fs.readFileSync(stlPath)
const pngBuf = stl2png(stlBuf, {
  width: 1024,
  height: 768,
  backgroundColor: 0xffffff,
  backgroundAlpha: 1
})
fs.writeFileSync(pngPath, pngBuf)
console.log('Wrote', pngPath)
