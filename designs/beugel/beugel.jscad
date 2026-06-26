const { subtract, intersect, union } = require('@jscad/modeling').booleans
const { cylinder, cuboid }           = require('@jscad/modeling').primitives
const { translate, rotateY }         = require('@jscad/modeling').transforms

const CHORD    = 100   // breedte plat vlak mm
const HEIGHT   = 15    // dikte mm
const HOLE_R   = 4     // breed deel gatstraal (Ø 8 mm)
const NARROW_R = 2     // smal deel gatstraal (Ø 4 mm) — aan ondervlak
const LIP_H    = 5     // hoogte van het smalle deel (randje) mm
const HOLE_INS = 20    // afstand gat tot kant mm
const SEGS     = 64

// Straal berekend zodat koorde = CHORD mm (met /0.8 clip-formule)
const RADIUS = (() => {
  const half = CHORD / 2
  const a = 0.4375, b = -1.125, c = -(half * half) - 0.5625
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
})()

const X_CUT = (RADIUS + 1) * 0.75   // x-positie van het platte vlak

function body () {
  const cyl  = cylinder({ radius: RADIUS, height: HEIGHT, segments: SEGS })
  const clip = cuboid({
    size:   [RADIUS + 1, RADIUS * 2 + 2, HEIGHT + 2],
    center: [(RADIUS + 1) / 0.8, 0, 0]
  })
  return intersect(cyl, clip)
}

// Horizontaal gat langs X door het platte vlak:
//   - Ø4mm aan het platte vlak (ingang, x = X_CUT) voor LIP_H mm
//   - Ø8mm daarna tot aan het gebogen vlak
function holeCutter (y) {
  // Smal deel (Ø4mm): van het platte vlak door de volledige diepte
  const narrowL  = RADIUS - X_CUT + 2
  const narrowCx = (X_CUT + RADIUS) / 2
  const narrow = translate([narrowCx, y, 0],
    rotateY(Math.PI / 2, cylinder({ radius: NARROW_R, height: narrowL, segments: 32 }))
  )

  // Breed deel (Ø8mm): vanaf LIP_H mm binnen het platte vlak tot gebogen vlak
  const wideL  = RADIUS - (X_CUT + LIP_H) + 2
  const wideCx = (X_CUT + LIP_H + RADIUS) / 2
  const wide = translate([wideCx, y, 0],
    rotateY(Math.PI / 2, cylinder({ radius: HOLE_R, height: wideL, segments: 32 }))
  )

  return [narrow, wide]
}

function main () {
  const holeY = CHORD / 2 - HOLE_INS   // 30 mm van middelpunt
  const [n1, w1] = holeCutter( holeY)
  const [n2, w2] = holeCutter(-holeY)
  const shape = subtract(body(), n1, w1, n2, w2)
  // center bounding box at origin: flat face at +X_CUT, curved edge at ~+RADIUS → offset X
  const depthCenter = (X_CUT + RADIUS) / 2
  return translate([-depthCenter, 0, 0], shape)
}

module.exports = { main }
