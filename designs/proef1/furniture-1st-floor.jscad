const { union, intersect } = require('@jscad/modeling').booleans
const { cuboid, cylinder, polygon } = require('@jscad/modeling').primitives
const { extrudeLinear } = require('@jscad/modeling').extrusions
const { translate, scale, mirror } = require('@jscad/modeling').transforms

// Afmetingen in mm, schaal 1:50  →  model-mm = mm / 50
const SCALE = 1 / 50

// Trapvorm-polygon: CCW, hoogte 56.25cm (= 3 × 18.75cm), bodem 66cm, 3 treden × 22cm.
const TRAP_PROFILE_MM = [
  [660,   0],
  [660, 187.5],
  [440, 187.5],
  [440, 375],
  [220, 375],
  [220, 562.5],
  [  0, 562.5],
  [  0,   0]
]
const TRAP_DIEPTE_MM = 4200  // 420 cm diep

function trapVorm () {
  const prof = extrudeLinear({ height: TRAP_DIEPTE_MM }, polygon({ points: TRAP_PROFILE_MM }))
  return scale([SCALE, SCALE, SCALE], prof)
}

// Reling: 14cm model breed, 90cm hoog, 5×5cm profiel, spijlen om de 20cm.
function reling () {
  const W = 7000      // breedte mm (14cm model @ 1:50 = 700cm echt)
  const H = 900       // hoogte mm
  const T = 50        // profieldikte mm (7.5cm echt)
  const R = 50        // spijl straal mm (diameter 10cm)
  const FOOT_D = 250/2  // diepte voet mm (25cm echt)
  const N_SPIJLEN = 19  // aantal spijlen
  const spacing = (W - T) / (N_SPIJLEN + 1)  // gelijke verdeling tussen de stijlen

  const parts = []

  // Voet: onderste rand 25cm diep
  parts.push(translate([W / 2, FOOT_D / 2, T / 2], cuboid({ size: [W, FOOT_D, T] })))
  // Bovenste rand
  parts.push(translate([W / 2, T / 2, H - T / 2], cuboid({ size: [W, T, T] })))

  // Linker en rechter stijl (volle hoogte)
  parts.push(translate([T / 2,     T / 2, H / 2], cuboid({ size: [T, T, H] })))
  parts.push(translate([W - T / 2, T / 2, H / 2], cuboid({ size: [T, T, H] })))

  // N_SPIJLEN halve cylinders, gelijkmatig verdeeld tussen de stijlen
  const barH = H - 2 * T
  const mask = translate([0, R / 2, 0], cuboid({ size: [2 * R, R, barH] }))
  for (let i = 1; i <= N_SPIJLEN; i++) {
    const x = T + i * spacing
    const half = intersect(cylinder({ radius: R, height: barH }), mask)
    parts.push(translate([x, 0, H / 2], half))
  }

  return scale([SCALE, SCALE, SCALE], union(...parts))
}

function main () {
  const half = reling()
  const vol = union(half, mirror({ normal: [0, 1, 0] }, half))
  return [translate([-7000 * SCALE / 2, 0, -900 * SCALE / 2], vol)]
}

module.exports = { main }
