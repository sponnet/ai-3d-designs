const { circle, rectangle } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms

// Flat hook: a straight foot, standing on end, that bends 180 degrees at
// its top into a hook -- a simple cane/coat-hook silhouette, flat
// (2D profile extruded straight up), not a round rod.
//
// Built as a 2D profile in the XY plane -- a rectangle for the straight
// foot, plus a half-annulus (an outer half-disc minus an inner
// half-disc, both centered on the same point) for the 180-degree bend
// -- unioned together and linear-extruded by EXTRUDE_HEIGHT. The bend's
// half-annulus is centered BEND_CENTER_OFFSET to the side of the foot's
// centerline, exactly far enough that its flat inner-to-outer edge at
// the bottom lines up with the foot's own top edge, so the 2 pieces
// meet flush with no gap or overlap.

const BAR_WIDTH = 10 // assumed -- the flat bar's own width, not specified
const INNER_RADIUS = 8 // the bend's inner radius
const OUTER_RADIUS = INNER_RADIUS + BAR_WIDTH
const BEND_CENTER_OFFSET = INNER_RADIUS + BAR_WIDTH / 2 // = the bend's
// center point's distance from the foot's centerline

const FOOT_LENGTH = 180 // the straight foot, standing on end
const EXTRUDE_HEIGHT = 5 // flat extrusion thickness

const SEGMENTS = 64 // full-circle resolution; the half-circle bend gets half of this

const main = () => {
  const foot = rectangle({ size: [BAR_WIDTH, FOOT_LENGTH], center: [0, FOOT_LENGTH / 2] })

  const bendCenter = [BEND_CENTER_OFFSET, FOOT_LENGTH]
  const outerHalf = translate(bendCenter, circle({ radius: OUTER_RADIUS, segments: SEGMENTS, startAngle: 0, endAngle: Math.PI }))
  const innerHalf = translate(bendCenter, circle({ radius: INNER_RADIUS, segments: SEGMENTS, startAngle: 0, endAngle: Math.PI }))
  const bend = subtract(outerHalf, innerHalf)

  const profile2D = union(foot, bend)
  return extrudeLinear({ height: EXTRUDE_HEIGHT }, profile2D)
}

module.exports = { main }
