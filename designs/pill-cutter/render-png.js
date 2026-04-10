/**
 * Export pill-cutter.jscad → pill-cutter.stl → pill-cutter.png.
 * Run from repo root: node designs/pill-cutter/render-png.js
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { stl2png } = require('@scalenc/stl-to-png')

const designDir = __dirname
const repoRoot = path.join(designDir, '..', '..')
const jscadFile = path.join(designDir, 'pill-cutter.jscad')
const stlPath = path.join(designDir, 'pill-cutter.stl')
const pngPath = path.join(designDir, 'pill-cutter.png')

if (!fs.existsSync(jscadFile)) {
  console.error('Missing pill-cutter.jscad in', designDir)
  process.exit(1)
}

execSync(`npx jscad "${jscadFile}" -o "${stlPath}"`, {
  cwd: repoRoot,
  stdio: 'inherit'
})

const stlBuf = fs.readFileSync(stlPath)
const pngBuf = stl2png(stlBuf, {
  width: 1024,
  height: 768,
  backgroundColor: 0xffffff,
  backgroundAlpha: 1
})

fs.writeFileSync(pngPath, pngBuf)
console.log('Wrote', pngPath)

