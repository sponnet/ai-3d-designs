const { polygon, rectangle } = require('@jscad/modeling').primitives
const { union } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, rotate, scale } = require('@jscad/modeling').transforms
const { colorize } = require('@jscad/modeling').colors

const BREEDTE       = 800
const HOOGTE        = 1200
const DIKTE         = 60
const KADER_BREEDTE = 50

const getParameterDefinitions = () => [
  { name: 'breedte',       type: 'float',    initial: BREEDTE,       caption: 'Breedte (mm)'       },
  { name: 'hoogte',        type: 'float',    initial: HOOGTE,        caption: 'Hoogte (mm)'        },
  { name: 'dikte',         type: 'float',    initial: DIKTE,         caption: 'Dikte (mm)'         },
  { name: 'kader_breedte', type: 'float',    initial: KADER_BREEDTE, caption: 'Kaderbreedte (mm)'  },
  { name: 'toon_glas',     type: 'checkbox', checked: true,          caption: 'Toon glas'          },
  { name: 'schaal',        type: 'float',    initial: 50,            caption: 'Schaal (1/x)'       },
]

// Pentagon cross-section profile.
// outerPos: position of the outer face along the width axis
// innerPos: position of the inner (glass-side) face
// d: depth (dikte)
// The 45°-cut corner sits at the outer-back edge.
const pentagonProfiel = (outerPos, innerPos, d) => polygon({ points: [
  [outerPos,                       0    ],  // outer-front
  [innerPos,                       0    ],  // inner-front
  [innerPos,                       d    ],  // inner-back
  [(outerPos + innerPos) / 2,      d    ],  // mid-back  (halfway → 45° cut)
  [outerPos,                       d / 2],  // outer-mid-back
]})

// Bottom member: runs along X, outer face at y = -H/2.
// rotate([π/2, 0, π/2]) maps (x,y,z) → (z, x, y):
//   extrusion Z → new X (breedte), profile X → new Y (hoogte), profile Y → new Z (dikte)
const bottomMember = (B, H, kb, d) => {
  const prof = pentagonProfiel(-H/2, -H/2 + kb, d)
  return translate([-B/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: B }, prof)))
}

// Top member: runs along X, outer face at y = +H/2.
const topMember = (B, H, kb, d) => {
  const prof = pentagonProfiel(H/2, H/2 - kb, d)
  return translate([-B/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: B }, prof)))
}

// Left member: runs along Y, outer face at x = -B/2.
// rotate([π/2, 0, 0]) maps (x,y,z) → (x, -z, y):
//   extrusion Z → new Y (hoogte, after translate), profile X → new X, profile Y → new Z (dikte)
const leftMember = (B, H, kb, d) => {
  const prof = pentagonProfiel(-B/2, -B/2 + kb, d)
  return translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, prof)))
}

// Right member: runs along Y, outer face at x = +B/2.
const rightMember = (B, H, kb, d) => {
  const prof = pentagonProfiel(B/2, B/2 - kb, d)
  return translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, prof)))
}

const makeFrame = ({ breedte, hoogte, dikte, kaderBreedte }) => {
  const B = breedte, H = hoogte, kb = kaderBreedte, d = dikte
  return union([
    bottomMember(B, H, kb, d),
    topMember(B, H, kb, d),
    leftMember(B, H, kb, d),
    rightMember(B, H, kb, d),
  ])
}

const makeGlas = ({ breedte, hoogte, dikte, kaderBreedte }) => {
  const glasBreedte = breedte - 2 * kaderBreedte
  const glasHoogte  = hoogte  - 2 * kaderBreedte
  const glasDikte   = 4

  if (glasBreedte <= 0 || glasHoogte <= 0) return null

  const glasPlaat = extrudeLinear({ height: glasDikte }, rectangle({ size: [glasBreedte, glasHoogte] }))
  return translate([0, 0, dikte / 2 - glasDikte / 2], glasPlaat)
}

const main = (params = {}) => {
  const breedte      = params.breedte       ?? BREEDTE
  const hoogte       = params.hoogte        ?? HOOGTE
  const dikte        = params.dikte         ?? DIKTE
  const kaderBreedte = params.kader_breedte ?? KADER_BREEDTE
  const toonGlas     = params.toon_glas !== undefined ? params.toon_glas : true
  const schaalDeler  = params.schaal        ?? 50
  const s            = 1 / schaalDeler

  console.log(`Raam: ${breedte} x ${hoogte} mm | dikte: ${dikte} mm | kader: ${kaderBreedte} mm | schaal: 1/${schaalDeler}`)
  console.log(`Glasopening: ${breedte - 2*kaderBreedte} x ${hoogte - 2*kaderBreedte} mm`)

  const frame = colorize([0.6, 0.4, 0.2, 1], makeFrame({ breedte, hoogte, dikte, kaderBreedte }))

  if (!toonGlas) return scale([s, s, s], frame)

  const glas = makeGlas({ breedte, hoogte, dikte, kaderBreedte })
  if (!glas) return scale([s, s, s], frame)

  return scale([s, s, s], [frame, colorize([0.5, 0.8, 1.0, 0.5], glas)])
}

module.exports = { main, getParameterDefinitions }
