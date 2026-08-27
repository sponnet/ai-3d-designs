const { circle, rectangle } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate } = require('@jscad/modeling').transforms

// Hinge bracket, from a hand sketch: a flat mounting base that necks up
// into a narrower boss (flush with the base's right edge, rounded at
// its top-left corner) carrying a pivot hole. A standalone part for
// now -- not yet coupled to wall-hook.jscad (no matching hole/pin
// there yet), that comes in a later pass.
//
// Only the overall width (36mm), overall height (56mm) and the pivot
// hole's diameter (8mm) come from the sketch. Where the base ends and
// the boss begins, how wide the boss is, its corner radius, and the
// hole's exact position aren't dimensioned there, so they're assumed
// below (kept in proportion to what the sketch roughly shows).
//
// Built as a 2D profile in the XY plane: the base rectangle, unioned
// with the boss rectangle (its sharp top-left corner replaced by a
// quarter-circle fillet -- cut the corner square out, then fill back
// in with just the arc's quarter-disc, leaving the corner rounded
// rather than sharp), then the pivot hole subtracted -- linear-extruded
// by THICKNESS.

const WIDTH = 36 // overall width, at the base
const HEIGHT = 56 // overall height, extreme/max
const THICKNESS = 5 // flat extrusion thickness, matching wall-hook.jscad

const HOLE_DIAMETER = 8 // pivot hole

const BASE_HEIGHT = 20 // assumed -- how tall the full-width mounting base is
const BOSS_WIDTH = 24 // assumed -- the narrower upper boss's width, flush
// with the base's right edge (leaves a WIDTH - BOSS_WIDTH step on the left)
const BOSS_CORNER_RADIUS = 10 // assumed -- the boss's rounded top-left corner

const SEGMENTS = 64 // full-circle resolution

const main = () => {
  const base = rectangle({ size: [WIDTH, BASE_HEIGHT], center: [WIDTH / 2, BASE_HEIGHT / 2] })

  const bossLeft = WIDTH - BOSS_WIDTH
  const bossRect = rectangle({ size: [BOSS_WIDTH, HEIGHT - BASE_HEIGHT], center: [bossLeft + BOSS_WIDTH / 2, BASE_HEIGHT + (HEIGHT - BASE_HEIGHT) / 2] })
  const cornerCut = rectangle({
    size: [BOSS_CORNER_RADIUS, BOSS_CORNER_RADIUS],
    center: [bossLeft + BOSS_CORNER_RADIUS / 2, HEIGHT - BOSS_CORNER_RADIUS / 2]
  })
  const cornerFillet = translate(
    [bossLeft + BOSS_CORNER_RADIUS, HEIGHT - BOSS_CORNER_RADIUS],
    circle({ radius: BOSS_CORNER_RADIUS, segments: SEGMENTS, startAngle: Math.PI / 2, endAngle: Math.PI })
  )
  const boss = union(subtract(bossRect, cornerCut), cornerFillet)

  const holeCenter = [bossLeft + BOSS_WIDTH / 2, BASE_HEIGHT + (HEIGHT - BASE_HEIGHT) / 2]
  const hole = translate(holeCenter, circle({ radius: HOLE_DIAMETER / 2, segments: SEGMENTS }))
  // Subtract the hole from the boss BEFORE unioning with the base --
  // subtracting it afterward (from the already-unioned base+boss shape)
  // silently produced no hole at all, even though the hole geometry and
  // its position were both individually correct; cutting it first,
  // while it's still only touching the boss, avoids whatever edge case
  // that union triggers.
  const bossWithHole = subtract(boss, hole)

  return extrudeLinear({ height: THICKNESS }, union(base, bossWithHole))
}

module.exports = { main }
