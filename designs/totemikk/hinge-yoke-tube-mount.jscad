const { circle, rectangle, cuboid, cylinder } = require('@jscad/modeling').primitives
const { union, subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotateX, rotateZ } = require('@jscad/modeling').transforms

// Hinge yoke tube mount: a hollow tube (51mm inner diameter, 2mm wall,
// 36mm tall) with 3 hinge-yoke clevises evenly spaced around its
// outer surface, each oriented the way the reference photo shows a
// printed hinge mounted flush against a flat surface -- its
// connecting plate flush/embedded against the mounting surface, its 2
// rings projecting straight outward from it, and the axle-hole axis
// running tangentially (parallel to the surface, like the bolt in the
// photo), not radially.
//
// Each hinge-yoke is identical to hinge-yoke.jscad's own geometry
// (self-contained here -- see OPENJSCAD_SKILL.md on why not to
// require() another design file), just reoriented and placed:
//   1. rotateX(90deg) swaps the yoke's own Y (ring height) and Z (axle
//      depth) axes so ring height becomes vertical (up the tube) and
//      the axle direction becomes tangential (around the tube).
//   2. translate so the yoke's flat plate face sits MOUNT_EMBED into
//      the tube's 2mm wall (not just touching it) -- guarantees a
//      real solid overlap for the union. The Z offset is fixed at
//      OUTER_RADIUS (the yoke's own half-height), not TUBE_HEIGHT/2,
//      so the yoke's bottom always sits flush on the ground plane
//      (Z=0) no matter what TUBE_HEIGHT is set to, instead of staying
//      vertically centered on the tube.
//   3. rotateZ by each of 3 evenly-spaced angles around the tube's own
//      axis places the 3 copies around its circumference.

const TUBE_INNER_DIAMETER = 51
const TUBE_INNER_RADIUS = TUBE_INNER_DIAMETER / 2
const TUBE_WALL_THICKNESS = 2
const TUBE_OUTER_RADIUS = TUBE_INNER_RADIUS + TUBE_WALL_THICKNESS
const TUBE_HEIGHT = 36

const MOUNT_COUNT = 3
const MOUNT_EMBED = 1 // assumed -- how far the yoke's plate face sits
// inside the tube's outer surface (within the 2mm wall), so the union
// has real solid overlap instead of merely touching it

// -- hinge-yoke geometry, inlined (matches hinge-yoke.jscad exactly) --
const OUTER_DIAMETER = 36
const OUTER_RADIUS = OUTER_DIAMETER / 2
const HOLE_DIAMETER = 8
const RING_THICKNESS = 5
const GAP = 5.1
const PLATE_THICKNESS = 5

const SEGMENTS = 64

const ringProfile2D = () => {
  // 3 of the ring's 4 outer corners are squared off (bottom-left,
  // top-left, bottom-right); only the top-right corner stays round.
  const bottomHalf = rectangle({ size: [OUTER_DIAMETER, OUTER_RADIUS], center: [0, -OUTER_RADIUS / 2] })
  const topLeftQuarter = rectangle({ size: [OUTER_RADIUS, OUTER_RADIUS], center: [-OUTER_RADIUS / 2, OUTER_RADIUS / 2] })
  const topRightQuarterRound = circle({ radius: OUTER_RADIUS, segments: SEGMENTS, startAngle: 0, endAngle: Math.PI / 2 })

  const hole = circle({ radius: HOLE_DIAMETER / 2, segments: SEGMENTS })
  // Cut the hole from each piece before the final union -- subtracting
  // it from the already-unioned outline instead can silently produce
  // no hole at all (see OPENJSCAD_SKILL.md).
  return union(subtract(bottomHalf, hole), subtract(topLeftQuarter, hole), subtract(topRightQuarterRound, hole))
}

const hingeYoke3D = () => {
  const ring = extrudeLinear({ height: RING_THICKNESS }, ringProfile2D())
  const ringA = ring // z: 0 to RING_THICKNESS
  const ringB = translate([0, 0, RING_THICKNESS + GAP], ring)

  const totalDepth = 2 * RING_THICKNESS + GAP
  const plate = translate(
    [-OUTER_RADIUS - PLATE_THICKNESS / 2, 0, totalDepth / 2],
    cuboid({ size: [PLATE_THICKNESS, OUTER_DIAMETER, totalDepth] })
  )

  return union(ringA, ringB, plate)
}
// The yoke's own flat plate face, in its local (unrotated) frame.
const PLATE_FACE_X = -(OUTER_RADIUS + PLATE_THICKNESS)
const YOKE_DEPTH = 2 * RING_THICKNESS + GAP

const main = () => {
  const reoriented = rotateX(Math.PI / 2, hingeYoke3D())
  // After rotateX(90deg): local X unchanged (still the plate/radial
  // axis), local Y is now the old Z (axle/tangential axis), local Z is
  // now the old Y (ring height/vertical axis).
  // Z offset is OUTER_RADIUS (the yoke's own half-height), not
  // TUBE_HEIGHT/2 -- that keeps the yoke's bottom flush with the
  // ground plane (Z=0) regardless of TUBE_HEIGHT, instead of staying
  // vertically centered on the tube (which would lift it off the
  // ground, or sink it below Z=0, whenever TUBE_HEIGHT changes).
  const placedAtAngleZero = translate(
    [TUBE_OUTER_RADIUS - MOUNT_EMBED - PLATE_FACE_X, YOKE_DEPTH / 2, OUTER_RADIUS],
    reoriented
  )

  const mounts = []
  for (let i = 0; i < MOUNT_COUNT; i++) {
    mounts.push(rotateZ((2 * Math.PI * i) / MOUNT_COUNT, placedAtAngleZero))
  }

  const overshoot = 2 // clears the tube's flat top/bottom for a clean through-hole
  const tubeOuter = translate([0, 0, TUBE_HEIGHT / 2], cylinder({ radius: TUBE_OUTER_RADIUS, height: TUBE_HEIGHT, segments: SEGMENTS }))
  const tubeInner = translate([0, 0, TUBE_HEIGHT / 2], cylinder({ radius: TUBE_INNER_RADIUS, height: TUBE_HEIGHT + 2 * overshoot, segments: SEGMENTS }))
  const tube = subtract(tubeOuter, tubeInner)

  // union(tube, ...mounts) -- hollow tube listed FIRST -- silently
  // leaked the tube's hollow interior shut (a probe at the tube's own
  // center came back solid). Listing the hollow tube LAST instead
  // gives the correct result; verified with point probes at the
  // interior, the wall between mounts, and each mount's axle-hole
  // band before trusting this ordering (see OPENJSCAD_SKILL.md).
  return union(...mounts, tube)
}

module.exports = { main }
