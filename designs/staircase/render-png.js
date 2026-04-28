/**
 * Export staircase.scad → staircase.jscad → staircase.stl, then staircase.png.
 * Run from repo root: npm run staircase:png
 * Uses @scalenc/stl-to-png (Three.js + @napi-rs/canvas).
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { stl2png } = require('@scalenc/stl-to-png')
const { PRETTY_RENDER_OPTIONS } = require('../render-style')

const designDir = __dirname
const repoRoot = path.join(designDir, '..', '..')
const jscadSrc = path.join(designDir, 'staircase.scad')
const jscadRun = path.join(designDir, 'staircase.jscad')
const stlPath = path.join(designDir, 'staircase.stl')
const pngPath = path.join(designDir, 'staircase.png')

if (!fs.existsSync(jscadSrc)) {
  console.error('Missing staircase.scad in', designDir)
  process.exit(1)
}

fs.copyFileSync(jscadSrc, jscadRun)
execSync(`npx jscad "${jscadRun}" -o "${stlPath}"`, { cwd: repoRoot, stdio: 'inherit' })

const stlBuf = fs.readFileSync(stlPath)
const pngBuf = stl2png(stlBuf, PRETTY_RENDER_OPTIONS)
fs.writeFileSync(pngPath, pngBuf)
console.log('Wrote', pngPath)
