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

// Pentagon cross-section with 45° cut at the inner-back corner.
// Winding order (CCW) depends on whether inner→outer is increasing or decreasing.
const memberProfile = (innerPos, outerPos, d) => {
  const mid = (innerPos + outerPos) / 2
  if (innerPos > outerPos) {
    // inner→outer is a decreasing direction: use reversed order for CCW
    return polygon({ points: [
      [innerPos, d / 2],
      [mid,      d    ],
      [outerPos, d    ],
      [outerPos, 0    ],
      [innerPos, 0    ],
    ]})
  }
  // inner→outer is increasing: normal CCW
  return polygon({ points: [
    [innerPos, 0    ],
    [outerPos, 0    ],
    [outerPos, d    ],
    [mid,      d    ],
    [innerPos, d / 2],
  ]})
}

const makeFrame = ({ breedte, hoogte, dikte, kaderBreedte }) => {
  const B = breedte, H = hoogte, d = dikte, kb = kaderBreedte

  // rotate([π/2,0,π/2]) maps (x,y,z)→(z,x,y): extrusion Z→X, profile X→Y, profile Y→Z
  // Bottom: outer y=-H/2, inner y=-H/2+kb  (inner > outer → reversed CCW)
  const bottom = translate([-B/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: B }, memberProfile(-H/2 + kb, -H/2, d))))

  // Top: outer y=+H/2, inner y=H/2-kb  (inner < outer → normal CCW)
  const top = translate([-B/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: B }, memberProfile(H/2 - kb, H/2, d))))

  // rotate([π/2,0,0]) maps (x,y,z)→(x,-z,y): extrusion Z→Y, profile X→X, profile Y→Z
  // Left: outer x=-B/2, inner x=-B/2+kb, full height so corners connect cleanly
  const left = translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, memberProfile(-B/2 + kb, -B/2, d))))

  // Right: outer x=+B/2, inner x=B/2-kb, full height
  const right = translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, memberProfile(B/2 - kb, B/2, d))))

  return union([bottom, top, left, right])
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

  const frame = colorize([0.6, 0.4, 0.2, 1], makeFrame({ breedte, hoogte, dikte, kaderBreedte }))
  if (!toonGlas) return scale([s, s, s], frame)
  const glas = makeGlas({ breedte, hoogte, dikte, kaderBreedte })
  if (!glas) return scale([s, s, s], frame)
  return scale([s, s, s], [frame, colorize([0.5, 0.8, 1.0, 0.5], glas)])
}

module.exports = { main, getParameterDefinitions }
