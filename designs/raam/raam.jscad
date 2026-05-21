const { polygon, rectangle } = require('@jscad/modeling').primitives
const { subtract, union } = require('@jscad/modeling').booleans
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

// Build a triangular prism for the 45°-cut at the inner-back edge of one member.
// innerFace : coordinate of the inner face (glass side) along the member's width axis
// midPoint  : halfway between inner and outer face (determines 45° angle)
// d         : dikte (depth)
// extrudeLen: length of the member (prism length)
// rot/transl: positioning in 3D
const cutPrism = (innerFace, midPoint, d, extrudeLen, rot, transl) => {
  // Triangle: inner-mid-depth → inner-full-depth → mid-full-depth
  const tri = polygon({ points: [
    [innerFace, d / 2],
    [innerFace, d    ],
    [midPoint,  d    ],
  ]})
  return translate(transl, rotate(rot, extrudeLinear({ height: extrudeLen }, tri)))
}

const makeFrame = ({ breedte, hoogte, dikte, kaderBreedte }) => {
  const B = breedte, H = hoogte, d = dikte, kb = kaderBreedte

  // Solid rectangular frame ring at full depth
  const frameBox = extrudeLinear({ height: d },
    subtract(
      rectangle({ size: [B, H] }),
      rectangle({ size: [B - 2 * kb, H - 2 * kb] })
    )
  )

  // rotate([π/2, 0, π/2]) maps (x,y,z)→(z,x,y): extrusion Z becomes X, profile→YZ
  // rotate([π/2, 0, 0])   maps (x,y,z)→(x,-z,y): extrusion Z becomes Y, profile→XZ

  // Bottom member: inner face at y = -H/2+kb, mid at y = -H/2+kb/2
  const cutBottom = cutPrism(-H/2 + kb, -H/2 + kb/2, d, B,
    [Math.PI/2, 0, Math.PI/2], [-B/2, 0, 0])

  // Top member: inner face at y = H/2-kb, mid at y = H/2-kb/2
  const cutTop = cutPrism(H/2 - kb, H/2 - kb/2, d, B,
    [Math.PI/2, 0, Math.PI/2], [-B/2, 0, 0])

  // Left member: inner face at x = -B/2+kb, mid at x = -B/2+kb/2
  const cutLeft = cutPrism(-B/2 + kb, -B/2 + kb/2, d, H,
    [Math.PI/2, 0, 0], [0, H/2, 0])

  // Right member: inner face at x = B/2-kb, mid at x = B/2-kb/2
  const cutRight = cutPrism(B/2 - kb, B/2 - kb/2, d, H,
    [Math.PI/2, 0, 0], [0, H/2, 0])

  return subtract(frameBox, union([cutBottom, cutTop, cutLeft, cutRight]))
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
