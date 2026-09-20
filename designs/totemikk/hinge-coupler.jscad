const { circle } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions

// Hinge coupler: a plain round spacer ring that rides on the 8mm axle
// in the gap between the 2 rings of hinge-yoke.jscad -- 8mm inner
// diameter, 16mm outer diameter, extruded to the same 5.1mm the yoke's
// rings are spaced apart, so it exactly fills that gap.

const OUTER_DIAMETER = 16
const INNER_DIAMETER = 8
const HEIGHT = 5.1

const SEGMENTS = 64

const main = () => {
  const outer = circle({ radius: OUTER_DIAMETER / 2, segments: SEGMENTS })
  const inner = circle({ radius: INNER_DIAMETER / 2, segments: SEGMENTS })
  return extrudeLinear({ height: HEIGHT }, subtract(outer, inner))
}

module.exports = { main }
