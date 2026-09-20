const { circle, rectangle } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms

// Flat hook: a straight foot, standing on end, that bends 180 degrees at
// its top into a hook -- a simple cane/coat-hook silhouette, flat
// (2D profile extruded straight up), not a round rod.
//
// The bend's inner edge (the throat you actually hang something on)
// stays a plain round curve the whole way round. Its outer edge is
// round only for the first quarter-turn coming off the foot (the "left
// side" in the sketch, which must stay round) -- the second
// quarter-turn, toward the open end, is squared off into a sharp
// corner instead of continuing the curve.
//
// Built as a 2D profile in the XY plane: a rectangle for the straight
// foot, a quarter-disc pie slice for the round outer quarter, and a
// square block for the squared-off outer quarter, unioned together --
// then the full round inner half-disc is subtracted from that union to
// cut the throat, and the result is linear-extruded by EXTRUDE_HEIGHT.
// The quarter-disc's straight edge (from its center out to the apex)
// exactly coincides with the square block's inner edge, so the 2 pieces
// meet flush with no seam.

const BAR_WIDTH = 10 // assumed -- the flat bar's own width, not specified
const INNER_RADIUS = 8 // the bend's inner (throat) radius -- stays round
const OUTER_RADIUS = INNER_RADIUS + BAR_WIDTH // the round quarter's radius;
// also the squared quarter's reach, so both quarters end up the same size
const BEND_CENTER_OFFSET = INNER_RADIUS + BAR_WIDTH / 2 // = the bend's
// center point's distance from the foot's centerline

const FOOT_LENGTH = 180 // the straight foot, standing on end
const EXTRUDE_HEIGHT = 5 // flat extrusion thickness

const SEGMENTS = 64 // full-circle resolution; each quarter/half gets its share of this

const main = () => {
  const foot = rectangle({ size: [BAR_WIDTH, FOOT_LENGTH], center: [0, FOOT_LENGTH / 2] })

  const bendCenter = [BEND_CENTER_OFFSET, FOOT_LENGTH]
  // Round quarter, coming straight off the foot: angle 90-180 (standard
  // math convention, 0 = +X from center) -- stays a smooth curve.
  const outerRoundQuarter = translate(bendCenter, circle({ radius: OUTER_RADIUS, segments: SEGMENTS, startAngle: Math.PI / 2, endAngle: Math.PI }))
  // Squared quarter, toward the open end: a plain square block covering
  // the same angle-0-90 corner the round quarter's other half would
  // have occupied, replacing its curve with a sharp corner.
  const outerSquareQuarter = translate(
    [bendCenter[0] + OUTER_RADIUS / 2, bendCenter[1] + OUTER_RADIUS / 2],
    rectangle({ size: [OUTER_RADIUS, OUTER_RADIUS] })
  )
  const outerShape = union(outerRoundQuarter, outerSquareQuarter)

  const innerHalf = translate(bendCenter, circle({ radius: INNER_RADIUS, segments: SEGMENTS, startAngle: 0, endAngle: Math.PI }))
  const bend = subtract(outerShape, innerHalf)

  const profile2D = union(foot, bend)
  return extrudeLinear({ height: EXTRUDE_HEIGHT }, profile2D)
}

module.exports = { main }
