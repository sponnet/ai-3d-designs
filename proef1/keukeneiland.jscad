const { subtract } = require('@jscad/modeling').booleans
const { cuboid } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms

const length = 60
const width  = 24
const height = 18
const wall   = 1

function main() {
  const outer = cuboid({ size: [length, width, height] })

  // Inner void starts one wall-thickness above the bottom, punches through the open top
  const inner = translate(
    [0, 0, wall],
    cuboid({ size: [length - 2 * wall, width - 2 * wall, height] })
  )

  return subtract(outer, inner)
}

module.exports = { main }
