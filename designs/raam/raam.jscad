const { rectangle, polygon } = require('@jscad/modeling').primitives
const { subtract } = require('@jscad/modeling').booleans
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, scale } = require('@jscad/modeling').transforms
const { colorize } = require('@jscad/modeling').colors

// Standaard afmetingen (mm)
const BREEDTE       = 800   // totale buitenbreedte
const HOOGTE        = 1200  // totale buitenhoogte
const DIKTE         = 60    // diepte van het raamkader
const KADER_BREEDTE = 50    // breedte van de kaderprofielen

const getParameterDefinitions = () => [
  { name: 'breedte',       type: 'float',    initial: BREEDTE,       caption: 'Breedte (mm)'       },
  { name: 'hoogte',        type: 'float',    initial: HOOGTE,        caption: 'Hoogte (mm)'        },
  { name: 'dikte',         type: 'float',    initial: DIKTE,         caption: 'Dikte (mm)'         },
  { name: 'kader_breedte', type: 'float',    initial: KADER_BREEDTE, caption: 'Kaderbreedte (mm)'  },
  { name: 'toon_glas',     type: 'checkbox', checked: true,          caption: 'Toon glas'          },
  { name: 'schaal',        type: 'float',    initial: 50,            caption: 'Schaal (1/x)'       },
]

// Buitenprofiel: rechthoek met 45°-afsnede linksbovenaan.
// Bovenzijde = halve breedte (van rechts), linkerzijde = halve hoogte (van onder),
// diagonaal verbindt die twee middelpunten.
const buitenProfielVorm = (breedte, hoogte) => {
  const W = breedte / 2
  const H = hoogte  / 2
  return polygon({ points: [
    [-W, -H],   // linksonder
    [ W, -H],   // rechtsonder
    [ W,  H],   // rechtsboven
    [ 0,  H],   // midden bovenkant (halve breedte)
    [-W,  0],   // midden linkerkant (halve hoogte)
  ]})
}

const makeFrame = ({ breedte, hoogte, dikte, kaderBreedte }) => {
  const glasBreedte = breedte - 2 * kaderBreedte
  const glasHoogte  = hoogte  - 2 * kaderBreedte

  if (glasBreedte <= 0 || glasHoogte <= 0) {
    console.log('WAARSCHUWING: kaderbreedte te groot – glasopening is nul of negatief')
    return extrudeLinear({ height: dikte }, buitenProfielVorm(breedte, hoogte))
  }

  const buitenProfiel = buitenProfielVorm(breedte, hoogte)
  const binnenProfiel = rectangle({ size: [glasBreedte, glasHoogte] })
  const kaderProfiel  = subtract(buitenProfiel, binnenProfiel)

  return extrudeLinear({ height: dikte }, kaderProfiel)
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
