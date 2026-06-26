const { polygon, rectangle } = require('@jscad/modeling').primitives
const { union }              = require('@jscad/modeling').booleans
const { extrudeLinear }      = require('@jscad/modeling').extrusions
const { translate, rotate, scale } = require('@jscad/modeling').transforms
const { colorize }           = require('@jscad/modeling').colors

// Alle maten in mm (reële schaal), aan het einde geschaald naar 1:50
const SCHAAL        = 50
const DIKTE         = 90   // diepte van het raamkader mm
const KADER_BREEDTE = 90   // breedte van de kaderprofielen mm

// Pentagonaal profiel met 45°-afschuining aan de binnenkant
const memberProfile = (innerPos, outerPos, d) => {
  const mid = (innerPos + outerPos) / 2
  if (innerPos > outerPos) {
    return polygon({ points: [
      [innerPos, d / 2],
      [mid,      d    ],
      [outerPos, d    ],
      [outerPos, 0    ],
      [innerPos, 0    ],
    ]})
  }
  return polygon({ points: [
    [innerPos, 0    ],
    [outerPos, 0    ],
    [outerPos, d    ],
    [mid,      d    ],
    [innerPos, d / 2],
  ]})
}

const makeFrame = (breedte, hoogte) => {
  const B = breedte, H = hoogte, d = DIKTE, kb = KADER_BREEDTE

  const bottom = translate([-B/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: B }, memberProfile(-H/2 + kb, -H/2, d))))

  const top = translate([-B/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: B }, memberProfile(H/2 - kb, H/2, d))))

  const left = translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, memberProfile(-B/2 + kb, -B/2, d))))

  const right = translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, memberProfile(B/2 - kb, B/2, d))))

  return union([bottom, top, left, right])
}

const makeGlas = (breedte, hoogte) => {
  const gb = breedte - 2 * KADER_BREEDTE
  const gh = hoogte  - 2 * KADER_BREEDTE
  if (gb <= 0 || gh <= 0) return null
  const glasPlaat = extrudeLinear({ height: 4 }, rectangle({ size: [gb, gh] }))
  return translate([0, 0, DIKTE / 2 - 2], glasPlaat)
}

const raam = (breedte, hoogte) =>
  colorize([0.6, 0.4, 0.2, 1], makeFrame(breedte, hoogte))

function main () {
  // Ramen gelijkvloers (maten in mm, reële schaal)
  const specs = [
//    { L: 2274, H: 2470 },  // raam 1
//    { L: 2210, H: 2470 },  // raam 2
//    { L: 2210, H: 2470 },  // raam 3
    { L: 2350, H: 8630 },  // raam voorgevel 1
    { L: 2650, H: 1720 },  // vast raam glvl kleuken
    { L: 2274, H: 2670 },  // vast raam eetkamer
    { L: 3196/2, H: 2670 },  // schuifraam naar achtergeven aan fietsen
    { L: 3196/2, H: 2670 },  // schuifraam naar achtergeven aan fietsen
    { L: (4411+90)/2, H: 2670 },  // schuifraam naar achtergeven aan fietsen
    { L: (4411+90)/2, H: 2670 },  // schuifraam naar achtergeven aan fietsen
    { L: 2900, H: 1520 },  // raam voorgevel 1 2ev
    { L: 4100, H: 1520 },  // raam voorgevel 2 2ev
  

  ]

  const gap = 300  // 300mm tussenruimte (= 6mm op model)
  let xPos = 0
  const ramen = specs.map(({ L, H }) => {
    xPos += L / 2
    const r = translate([xPos, 0, 0], raam(L, H))
    xPos += L / 2 + gap
    return r
  })

  const s = 1 / SCHAAL
  return scale([s, s, s], ramen)
}

module.exports = { main }
