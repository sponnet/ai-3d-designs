const { cylinder, sphere, cuboid } = require('@jscad/modeling').primitives
const { union, intersect } = require('@jscad/modeling').booleans
const { translate } = require('@jscad/modeling').transforms

// Bottom plug / foot for a tube with a 49mm inner diameter: a short plug
// that push-fits up into the tube's bottom opening, with a large rounded
// foot (a hemisphere) below it that ends up touching the ground once
// installed.
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

const FOOT_RADIUS = 25
const SEGMENTS = 96

const plug3D = () => {
  const bodyHeight = PLUG_HEIGHT - PLUG_CHAMFER_HEIGHT
  const body = translate(
    [0, 0, bodyHeight / 2],
    cylinder({ radius: PLUG_DIAMETER / 2, height: bodyHeight, segments: SEGMENTS })
  )
  const chamfer = translate(
    [0, 0, bodyHeight + PLUG_CHAMFER_HEIGHT / 2],
    cylinder({
      radiusStart: PLUG_DIAMETER / 2,
      radiusEnd: (PLUG_DIAMETER - PLUG_CHAMFER_SHRINK) / 2,
      height: PLUG_CHAMFER_HEIGHT,
      segments: SEGMENTS
    })
  )
  return union(body, chamfer)
}

const foot3D = () => {
  const ball = sphere({ radius: FOOT_RADIUS, segments: SEGMENTS })
  const lowerHalf = translate(
    [0, 0, -(FOOT_RADIUS + 1) / 2],
    cuboid({ size: [2 * FOOT_RADIUS + 10, 2 * FOOT_RADIUS + 10, FOOT_RADIUS + 1] })
  )
  return intersect(ball, lowerHalf)
}

const main = () => union(plug3D(), foot3D())

module.exports = { main, plug3D, foot3D }
