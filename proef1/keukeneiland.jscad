const { subtract } = require('@jscad/modeling').booleans
const { cuboid } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms
const { measureBoundingBox } = require('@jscad/modeling').measurements

// Keukeneiland: holle balk, open bovenzijde
// Buitenmaten: 60 x 24 x 18 mm, wanddikte 1 mm, 5 zijden (geen dekplaat)

const LENGTH = 60
const WIDTH  = 24
const HEIGHT = 18
const WALL   =  1

function main () {
  const outer = cuboid({ size: [LENGTH, WIDTH, HEIGHT] })

  // Void starts WALL mm above outer bottom, punches through the open top.
  // Translating center up by WALL shifts bottom from -HEIGHT/2 to (-HEIGHT/2 + WALL),
  // and shifts top to (HEIGHT/2 + WALL) — 1 mm past outer top → open.
  const inner = translate(
    [0, 0, WALL],
    cuboid({ size: [LENGTH - 2 * WALL, WIDTH - 2 * WALL, HEIGHT] })
  )

  const result = subtract(outer, inner)

  const bb = measureBoundingBox(result)
  console.log('BoundingBox:', JSON.stringify(bb))

  return result
}

module.exports = { main }
