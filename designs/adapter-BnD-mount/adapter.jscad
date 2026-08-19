const { circle, rectangle, cylinder, cuboid } = require('@jscad/modeling').primitives
const { subtract, union, intersect } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotateX, rotateY } = require('@jscad/modeling').transforms

// Adapter that lets a "BnD 20Vmax mount v6" tool holder (its flat
// 60x65mm back plate, measured from BnD_20Vmax_mount_v6_2017.stl) clamp
// onto a 51mm-diameter tube instead of a wall. One printed piece =
// 1) a flat plate matching the mount's 3-hole pattern, lying flat along
//    the tube (tangent at the top of the shell, sunk into the shell wall
//    for a solid printed bond), and
// 2) a 180 degree half-shell that cradles half the tube.
// Two of these pieces, the 2nd rotated 180 degrees around the tube axis
// (X), sandwich the tube; their end flanges (2 holes each) bolt together.
//
// Coordinates: X = tube axis (= shell length = PLATE_WIDTH).
// Y/Z = radial directions, tube centerline at Y=0,Z=0 for all X.

// --- BnD mount back-plate hole pattern (measured from the STL,
// y=3 back face, symmetrized), plate rotated 90 degrees from its first
// version: its 65mm side (was BnD's plate height) now runs along the
// tube axis (X, = shell length), its 60mm side (was BnD's plate width)
// runs across the tube's tangent direction (Y). ---
const PLATE_WIDTH = 65 // X, matches BnD mount height & shell length
const PLATE_LENGTH = 60 // Y, matches BnD mount plate width, tube's tangent direction
const PLATE_THICKNESS = 4
const PLATE_HOLES = [
  { x: 59.1, yFromEdge: 6.0, diameter: 5.0 },
  { x: 59.1, yFromEdge: 54.0, diameter: 5.0 }, // mirrored
  { x: 3.8, yFromEdge: 30.0, diameter: 5.0 } // the shell is cut back under this one, see SHELL_START_X
]

// --- Tube clamp shell ---
const TUBE_DIAMETER = 51
const TUBE_RADIUS = TUBE_DIAMETER / 2
const SHELL_WALL = 3
const SHELL_INNER_R = TUBE_RADIUS
const SHELL_OUTER_R = TUBE_RADIUS + SHELL_WALL
const SHELL_LENGTH = PLATE_WIDTH // shares the plate's X extent
const SHELL_SEGMENTS = 96
// The shell (not the plate, which stays the full BnD-matched length) is
// cut back at the single-hole end, clear of that hole, so there's open
// access behind the plate there to get a nut onto a bolt through it.
const SHELL_START_X = 15

// --- End flanges (one at each of the shell's 2 edges, Y = +/-SHELL_OUTER_R) ---
const EAR_WIDTH = 12 // radial extent beyond the shell's outer surface
const EAR_THICKNESS = 3 // this piece's own contribution; mates with an identical
// piece's ear (rotated 180 deg) to form EAR_THICKNESS*2 of clamped material
const EAR_HOLE_DIAMETER = 4.5 // M4 clearance
const EAR_HOLE_X = [15, SHELL_LENGTH - 15] // 2 holes, 15mm in from each end
const HOLE_OVERSHOOT = 2

// Plate profile drawn directly in global (X,Y): X 0..PLATE_WIDTH (tube
// axis, full BnD-matched length), Y centered on 0 (the tube's tangent/top
// direction) -- this is what makes the plate lie flat, lengthwise along
// the tube, instead of standing up off it.
const plate2D = () => {
  const base = rectangle({ size: [PLATE_WIDTH, PLATE_LENGTH], center: [PLATE_WIDTH / 2, 0] })
  const holes = PLATE_HOLES.map((h) =>
    circle({ radius: h.diameter / 2, segments: 48, center: [h.x, h.yFromEdge - PLATE_LENGTH / 2] })
  )
  return subtract(base, union(...holes))
}

// extrudeLinear extrudes the (X,Y) profile along +Z, which is already the
// right axis here (plate thickness = Z). Sink the bottom face down to the
// shell's inner radius so the plate shares the full wall thickness with
// the shell at Y=0 -- solid overlap, not just a tangent line, for a
// strong bond between plate and shell in the print.
const plate3D = () => {
  const plate = extrudeLinear({ height: PLATE_THICKNESS }, plate2D())
  return translate([0, 0, SHELL_INNER_R], plate)
}

// 180 degree half-annulus (Z >= 0 half), profile drawn in a local (u,v)
// plane that will be mapped onto global (Y,Z) after extrusion + rotation.
const shellProfile2D = () => {
  const outer = circle({ radius: SHELL_OUTER_R, segments: SHELL_SEGMENTS })
  const inner = circle({ radius: SHELL_INNER_R, segments: SHELL_SEGMENTS })
  const annulus = subtract(outer, inner)
  const upperHalf = rectangle({
    size: [2 * SHELL_OUTER_R + 4, SHELL_OUTER_R + 2],
    center: [0, (SHELL_OUTER_R + 2) / 2]
  })
  return intersect(annulus, upperHalf)
}

const shell3D = () => {
  // Shell only spans SHELL_START_X..SHELL_LENGTH (cut back at the
  // single-hole end) -- extrude just that shorter span, then shift it
  // into position along X.
  const shellSpan = SHELL_LENGTH - SHELL_START_X
  const extruded = extrudeLinear({ height: shellSpan }, shellProfile2D())
  // extruded: local X,Y = (Yg,Zg), local Z (0..shellSpan) = length axis.
  // Map local(x,y,z) -> global(Yg,Zg,Xg) = (x,y,z) via 2 rotations, then
  // slide along X to start at SHELL_START_X instead of 0.
  const oriented = rotateX(Math.PI / 2, rotateY(Math.PI / 2, extruded))
  return translate([SHELL_START_X, 0, 0], oriented)
}

const ear2D = () => {
  // Drawn in the same local (u,v) = (Yg,Zg) plane as the shell profile,
  // as a flat rectangle sitting just outside the shell at one edge.
  const u0 = SHELL_OUTER_R
  const u1 = SHELL_OUTER_R + EAR_WIDTH
  return rectangle({ size: [u1 - u0, EAR_THICKNESS], center: [(u0 + u1) / 2, EAR_THICKNESS / 2] })
}

const earHoles = () =>
  EAR_HOLE_X.map((x) =>
    translate(
      [x, SHELL_OUTER_R + EAR_WIDTH / 2, EAR_THICKNESS / 2],
      cylinder({ radius: EAR_HOLE_DIAMETER / 2, height: EAR_THICKNESS + HOLE_OVERSHOOT, segments: 32 })
    )
  )

// One ear at Y=+SHELL_OUTER_R edge, one (mirrored in u) at Y=-SHELL_OUTER_R edge.
const ears3D = () => {
  const earPos = extrudeLinear({ height: SHELL_LENGTH }, ear2D())
  const earPosGlobal = rotateX(Math.PI / 2, rotateY(Math.PI / 2, earPos))
  const earPosHoled = subtract(earPosGlobal, ...earHoles())

  const earNeg2D = rectangle({
    size: [EAR_WIDTH, EAR_THICKNESS],
    center: [-(SHELL_OUTER_R + EAR_WIDTH / 2), EAR_THICKNESS / 2]
  })
  const earNeg = extrudeLinear({ height: SHELL_LENGTH }, earNeg2D)
  const earNegGlobal = rotateX(Math.PI / 2, rotateY(Math.PI / 2, earNeg))
  const earNegHoles = EAR_HOLE_X.map((x) =>
    translate(
      [x, -(SHELL_OUTER_R + EAR_WIDTH / 2), EAR_THICKNESS / 2],
      cylinder({ radius: EAR_HOLE_DIAMETER / 2, height: EAR_THICKNESS + HOLE_OVERSHOOT, segments: 32 })
    )
  )
  const earNegHoled = subtract(earNegGlobal, ...earNegHoles)

  return union(earPosHoled, earNegHoled)
}

const main = () => {
  return union(shell3D(), plate3D(), ears3D())
}

module.exports = { main, plate2D, shellProfile2D }
