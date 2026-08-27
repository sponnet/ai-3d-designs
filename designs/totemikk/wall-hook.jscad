const { cylinder, sphere, torus } = require('@jscad/modeling').primitives
const { union } = require('@jscad/modeling').booleans
const { translate, rotateY, rotateZ } = require('@jscad/modeling').transforms

// Wall-mount hook for hanging the totem: a round rod, bent flat in a
// single plane, from a hand sketch. Reading the sketch: a long straight
// shaft (rounded, blunt tip at the bottom) sweeps into a wide, generous
// bend at the top that turns the shaft through 90 degrees into a short
// horizontal run -- this is the "1 side made rectangular" part: instead
// of staying round all the way, that top run turns 2 more square-ish
// corners (a small width, then a short drop) before curling back on
// itself into a small round hook that actually does the catching. So
// the piece reads as a round hook whose far end has been squared off
// into a small rectangular profile, with only the very tip staying a
// tight round curl.
//
// Modeled as a 2D bent centerline in the XY plane (a straight run, a
// bend, another straight run, another bend, a third straight run, then
// the hook's curl), with a round ROD_DIAMETER cross-section swept along
// it -- straight runs are cylinders, bends are partial toruses
// (innerRadius = rod radius, outerRadius = bend radius), so the whole
// thing comes out as a real round rod, not a flat plate. Both ends get
// a sphere cap the same radius as the rod, rounding them off instead of
// leaving a flat cut face.
//
// Only TOTAL_HEIGHT (180mm), TOP_WIDTH (24mm), SIDE_LENGTH (16mm) and
// CURL_RADIUS (8mm) come from the sketch. The rod diameter, the top
// bend's radius, the small corner radius, and how far the hook curls
// around aren't dimensioned there, so they're assumed below.

const ROD_DIAMETER = 10 // assumed -- not dimensioned in the sketch
const ROD_RADIUS = ROD_DIAMETER / 2

const TOTAL_HEIGHT = 180 // overall height, tip to tip, including both
// rounded end caps -- matches the sketch's outer dimension line
const TOP_WIDTH = 24 // the short horizontal run at the top, centerline
const SIDE_LENGTH = 16 // the run down the right side, centerline
const CURL_RADIUS = 8 // the hook's own curl, centerline -- the one
// explicitly dimensioned round feature

const TOP_BEND_RADIUS = 12 // assumed -- the wide, generous bend that
// turns the main shaft into the top run
const CORNER_RADIUS = ROD_RADIUS + 1 // assumed -- the corner that gives
// the top section its "rectangular" look; kept just barely larger than
// the rod radius (a torus needs outerRadius > innerRadius) so it reads
// as a snug, printable, near-square corner rather than a knife edge
const CURL_SWEEP_DEG = 270 // assumed -- wraps most of the way around so
// the tip curls back and the opening faces upward, actually catching
// whatever the hook is hung on instead of just being a bare curve

// Straight shaft length, solved so the finished piece's overall height
// (including both end caps and the top bend) comes out to exactly
// TOTAL_HEIGHT: the top bend adds TOP_BEND_RADIUS above the shaft's own
// top, and each end cap sphere adds ROD_RADIUS beyond the centerline.
const SHAFT_LENGTH = TOTAL_HEIGHT - TOP_BEND_RADIUS - 2 * ROD_RADIUS

const SEGMENTS = 32 // rod cross-section resolution (cylinders, torus tube)
const RING_SEGMENTS_PER_360 = 96 // torus ring resolution baseline, scaled
// per bend by its own sweep angle so tight and wide bends both stay smooth

const degToRad = (deg) => (deg * Math.PI) / 180

// A straight rod segment between 2 points in the XY plane (Z=0): a
// Z-axis cylinder laid flat (rotateY) and pointed the right way (rotateZ),
// then moved to the segment's midpoint.
const rodBetween = (p1, p2) => {
  const [x1, y1] = p1
  const [x2, y2] = p2
  const length = Math.hypot(x2 - x1, y2 - y1)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const mid = [(x1 + x2) / 2, (y1 + y2) / 2, 0]
  return translate(mid, rotateZ(angle, rotateY(Math.PI / 2, cylinder({ radius: ROD_RADIUS, height: length, segments: SEGMENTS }))))
}

// A bend: a partial torus centered at `center`, covering the angle range
// [startDeg, startDeg + sweepDeg] (standard math convention -- 0 deg is
// +X from the center, angle increases counter-clockwise). Torus only
// takes a startAngle + a sweep (`outerRotation`), not a startAngle/
// endAngle pair, and which end of the range is "start" vs "end" doesn't
// change the resulting static shape -- only the angle range covered does.
const bend = (center, bendRadius, startDeg, sweepDeg) => {
  const outerSegments = Math.max(8, Math.round((RING_SEGMENTS_PER_360 * sweepDeg) / 360))
  return translate(
    [center[0], center[1], 0],
    torus({
      innerRadius: ROD_RADIUS,
      outerRadius: bendRadius,
      innerSegments: SEGMENTS,
      outerSegments,
      startAngle: degToRad(startDeg),
      outerRotation: degToRad(sweepDeg)
    })
  )
}

const main = () => {
  // Centerline path, bottom (A) to the hook's curled tip.
  const A = [0, 0] // bottom end, rounded off with a sphere cap
  const B = [0, SHAFT_LENGTH] // top of the main shaft, where the top bend starts
  const bend1Center = [TOP_BEND_RADIUS, SHAFT_LENGTH]
  const Bp = [TOP_BEND_RADIUS, SHAFT_LENGTH + TOP_BEND_RADIUS] // end of the top bend
  const C = [Bp[0] + TOP_WIDTH, Bp[1]] // end of the horizontal top run
  const bend2Center = [C[0], C[1] - CORNER_RADIUS]
  const Cp = [bend2Center[0] + CORNER_RADIUS, bend2Center[1]] // end of the corner bend
  const D = [Cp[0], Cp[1] - SIDE_LENGTH] // bottom of the right-side run, where the curl starts
  const bend3Center = [D[0] - CURL_RADIUS, D[1]]
  const curlTip = [bend3Center[0], bend3Center[1] + CURL_RADIUS] // the hook's open tip, rounded off with a sphere cap

  return union(
    translate([...A, 0], sphere({ radius: ROD_RADIUS, segments: SEGMENTS })),
    rodBetween(A, B),
    bend(bend1Center, TOP_BEND_RADIUS, 90, 90),
    rodBetween(Bp, C),
    bend(bend2Center, CORNER_RADIUS, 0, 90),
    rodBetween(Cp, D),
    bend(bend3Center, CURL_RADIUS, 90, CURL_SWEEP_DEG),
    translate([...curlTip, 0], sphere({ radius: ROD_RADIUS, segments: SEGMENTS }))
  )
}

module.exports = { main }
