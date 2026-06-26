const { polygon, cuboid }            = require('@jscad/modeling').primitives
const { union }                      = require('@jscad/modeling').booleans
const { extrudeLinear }              = require('@jscad/modeling').extrusions
const { translate, rotate, scale }   = require('@jscad/modeling').transforms
const { colorize }                   = require('@jscad/modeling').colors

// Alle maten in mm (reële schaal), aan het einde geschaald naar 1:50
const SCHAAL   = 50
const DIKTE    = 90   // diepte van het profiel mm
const KB       = 90   // breedte van de kaderprofielen mm

// 16.5cm × 6.9cm op model = 8250mm × 3450mm echt
const W        = 8250
const H        = 3450
const N_BALKEN = 3

// Pentagonaal profiel met 45°-afschuining aan de binnenkant (zelfde als ramen-gelijkvloers)
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

function makeLichtstraat (W, H) {
  const d  = DIKTE, kb = KB
  const innerW   = W - 2 * kb
  const innerH   = H - 2 * kb
  const barSpace = (innerW - N_BALKEN * kb) / (N_BALKEN + 1)

  // Buitenste kader (zelfde constructie als makeFrame in ramen-gelijkvloers)
  const bottom = translate([-W/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: W }, memberProfile(-H/2 + kb, -H/2, d))))

  const top = translate([-W/2, 0, 0],
    rotate([Math.PI/2, 0, Math.PI/2],
      extrudeLinear({ height: W }, memberProfile(H/2 - kb, H/2, d))))

  const left = translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, memberProfile(-W/2 + kb, -W/2, d))))

  const right = translate([0, H/2, 0],
    rotate([Math.PI/2, 0, 0],
      extrudeLinear({ height: H }, memberProfile(W/2 - kb, W/2, d))))

  const parts = [bottom, top, left, right]

  // Verticale verdelers: rechthoekig profiel
  for (let i = 1; i <= N_BALKEN; i++) {
    const x = -innerW/2 + i * barSpace + (i - 0.5) * kb
    parts.push(translate([x, 0, d/2], cuboid({ size: [kb * 1.5, H, d] })))
  }

  return colorize([0.6, 0.4, 0.2, 1], union(...parts))
}

function main () {
  const s = 1 / SCHAAL
  return scale([s, s, s], makeLichtstraat(W, H))
}

module.exports = { main }
