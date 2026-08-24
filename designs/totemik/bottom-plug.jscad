const { cylinder, cylinderElliptic, sphere, cuboid } = require('@jscad/modeling').primitives
const { union, intersect, subtract } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// Bottom plug / foot for a tube with a 49mm inner diameter: a short plug
// that push-fits up into the tube's bottom opening, with a foot below it
// that ends up touching the ground once installed. The whole piece is a
// hollow shell, WALL_THICKNESS thick throughout, instead of solid.
//
// The foot is a shallow spherical cap (not a full hemisphere): flat
// across its full FOOT_DIAMETER at Z=0, bulging down only
// FOOT_CAP_HEIGHT to its lowest point -- much less pronounced than a
// hemisphere of that diameter would be.
//
// Modeled with the foot at Z < 0 (dome pointing down, flat equator at
// Z=0) and the plug at Z > 0 (up to PLUG_HEIGHT), matching the piece's
// physical orientation once installed. For printing, reorienting
// plug-side-down in the slicer gives a flat base and a self-supporting
// dome with no overhangs.

const TUBE_ID = 49
const PLUG_CLEARANCE = 0.4 // assumed FDM push-fit clearance, not specified
const PLUG_DIAMETER = TUBE_ID - PLUG_CLEARANCE
const PLUG_HEIGHT = 20 // assumed -- "kort stukje", not specified
const PLUG_CHAMFER_HEIGHT = 2 // assumed lead-in chamfer, eases insertion
const PLUG_CHAMFER_SHRINK = 2 // diameter reduction at the plug's tip

const FOOT_DIAMETER = 52 // a bit larger than the 49mm tube, for margin
const FOOT_BASE_RADIUS = FOOT_DIAMETER / 2
const FOOT_CAP_HEIGHT = 10 // how far the foot bulges down from Z=0
// Sphere radius/center giving a spherical cap of FOOT_BASE_RADIUS across
// and FOOT_CAP_HEIGHT deep: R = (a^2 + h^2) / 2h, center h above the cap's
// lowest point.
const FOOT_SPHERE_RADIUS = (FOOT_BASE_RADIUS ** 2 + FOOT_CAP_HEIGHT ** 2) / (2 * FOOT_CAP_HEIGHT)
const FOOT_SPHERE_CENTER_Z = FOOT_SPHERE_RADIUS - FOOT_CAP_HEIGHT

const WALL_THICKNESS = 3
const SEGMENTS = 96
const CAVITY_OVERLAP = 1 // extra depth so the plug's and foot's inner
// cavities overlap cleanly at Z=0 instead of just touching

const plugOuter3D = () => {
  const bodyHeight = PLUG_HEIGHT - PLUG_CHAMFER_HEIGHT
  const body = translate(
    [0, 0, bodyHeight / 2],
    cylinder({ radius: PLUG_DIAMETER / 2, height: bodyHeight, segments: SEGMENTS })
  )
  const chamfer = translate(
    [0, 0, bodyHeight + PLUG_CHAMFER_HEIGHT / 2],
    cylinderElliptic({
      startRadius: [PLUG_DIAMETER / 2, PLUG_DIAMETER / 2],
      endRadius: [(PLUG_DIAMETER - PLUG_CHAMFER_SHRINK) / 2, (PLUG_DIAMETER - PLUG_CHAMFER_SHRINK) / 2],
      height: PLUG_CHAMFER_HEIGHT,
      segments: SEGMENTS
    })
  )
  return union(body, chamfer)
}

// Same shape as plugOuter3D, every radius shrunk by WALL_THICKNESS --
// the cavity that makes the plug hollow. Extends CAVITY_OVERLAP below
// Z=0 so it overlaps cleanly with the foot's inner cavity.
const plugInner3D = () => {
  const bodyHeight = PLUG_HEIGHT - PLUG_CHAMFER_HEIGHT
  const bodyCavityHeight = bodyHeight + CAVITY_OVERLAP
  const body = translate(
    [0, 0, bodyHeight / 2 - CAVITY_OVERLAP / 2],
    cylinder({ radius: PLUG_DIAMETER / 2 - WALL_THICKNESS, height: bodyCavityHeight, segments: SEGMENTS })
  )
  const innerChamferStart = PLUG_DIAMETER / 2 - WALL_THICKNESS
  const innerChamferEnd = (PLUG_DIAMETER - PLUG_CHAMFER_SHRINK) / 2 - WALL_THICKNESS
  const chamfer = translate(
    [0, 0, bodyHeight + PLUG_CHAMFER_HEIGHT / 2],
    cylinderElliptic({
      startRadius: [innerChamferStart, innerChamferStart],
      endRadius: [innerChamferEnd, innerChamferEnd],
      height: PLUG_CHAMFER_HEIGHT,
      segments: SEGMENTS
    })
  )
  return union(body, chamfer)
}

// Cutter spans Z from -(FOOT_CAP_HEIGHT + CAVITY_OVERLAP) up to
// topExtension (0 for the true outer surface, which must stop exactly at
// Z=0; CAVITY_OVERLAP for the inner cavity, so it overlaps cleanly with
// plugInner3D's cavity instead of just touching it at Z=0).
const footCap3D = (sphereRadius, topExtension) => {
  const ball = translate([0, 0, FOOT_SPHERE_CENTER_Z], sphere({ radius: sphereRadius, segments: SEGMENTS }))
  const cutterHeight = FOOT_CAP_HEIGHT + CAVITY_OVERLAP + topExtension
  const cutterCenterZ = topExtension / 2 - (FOOT_CAP_HEIGHT + CAVITY_OVERLAP) / 2
  const lowerHalf = translate([0, 0, cutterCenterZ], cuboid({ size: [2 * sphereRadius, 2 * sphereRadius, cutterHeight] }))
  return intersect(ball, lowerHalf)
}

const main = () => {
  const outer = union(plugOuter3D(), footCap3D(FOOT_SPHERE_RADIUS, 0))
  const inner = union(plugInner3D(), footCap3D(FOOT_SPHERE_RADIUS - WALL_THICKNESS, CAVITY_OVERLAP))
  return subtract(outer, inner)
}

module.exports = { main, plugOuter3D, footCap3D }
