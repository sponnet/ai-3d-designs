const { cylinder } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans

// Hollow cylinder (pipe): a simple tube, replacing an earlier torus-based
// design that was too CPU-intensive to generate.

const OUTER_DIAMETER = 63
const HEIGHT = 57
const INNER_DIAMETER = 51

const SEGMENTS = 128

const main = () => {
  const outer = cylinder({ radius: OUTER_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  const inner = cylinder({ radius: INNER_DIAMETER / 2, height: HEIGHT, segments: SEGMENTS })
  return subtract(outer, inner)
}

module.exports = { main }
