const { subtract }  = require('@jscad/modeling').booleans
const { cuboid, cylinder } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms

// Afmetingen in cm, schaal 1:50  →  model-mm = cm * 0.2
const SCALE = 10 / 50   // cm → mm
const WALL  = 0.5        // wanddikte mm

const mm = (cm) => cm * SCALE

// Holle balk, open bovenzijde, bodem op z=0
function hollowBox (B, D, H) {
  const [b, d, h] = [mm(B), mm(D), mm(H)]
  return translate([0, 0, h/2],
    subtract(
      cuboid({ size: [b, d, h] }),
      translate([0, 0, WALL],
        cuboid({ size: [Math.max(0.01, b - 2*WALL),
                        Math.max(0.01, d - 2*WALL),
                        h] }))
    )
  )
}

// Volle balk, bodem op z=0
function solidBox (B, D, H) {
  const [b, d, h] = [mm(B), mm(D), mm(H)]
  return translate([0, 0, h/2], cuboid({ size: [b, d, h] }))
}

// Volle balk in directe mm (geen schaalfactor), bodem op z=0
function solidBoxRaw (b, d, h) {
  return translate([0, 0, h/2], cuboid({ size: [b, d, h] }))
}

// Holle cilinder (buis), open bovenzijde, bodem op z=0
function hollowTube (R, H) {
  const [r, h] = [mm(R), mm(H)]
  return translate([0, 0, h/2],
    subtract(
      cylinder({ radius: r, height: h, segments: 64 }),
      translate([0, 0, WALL],
        cylinder({ radius: Math.max(0.01, r - WALL), height: h, segments: 64 }))
    )
  )
}

function main () {
  const gap = 5  // mm tussenruimte

  // ── Linkerkolom ─────────────────────────────────────────
  // obj1: balk  H:162  B:46,5  D:66,5 cm
  const w1 = mm(46.5)
  let x = w1 / 2
  const obj1 = translate([x, 0, 0], hollowBox(46.5, 66.5, 162))

  // obj2: cilinder  H:82  diameter:63 cm  (straal 31,5)
  const w2 = mm(63)  // gebruik diameter als breedte voor plaatsing
  x += w1/2 + gap + w2/2
  const obj2 = translate([x, 0, 0], hollowTube(31.5, 82))

  // obj3: balk  H:300  B:147  D:31 cm
  const w3 = mm(147)
  x += w2/2 + gap + w3/2
  const obj3 = translate([x, 0, 0], hollowBox(147, 31, 300))

  // ── Rechterkolom ────────────────────────────────────────
  const y2 = -mm(100)  // verspringen in Y-richting

  // obj4: volle kubus  30x30x30 cm
  const w4 = mm(30)
  x = w4 / 2
  const obj4 = translate([x, y2, 0], solidBox(30, 30, 30))

  // obj5: cilinder midden bovenop kubus  H:50  straal:10 cm
  const obj5 = translate([x, y2, mm(30)], hollowTube(10, 50))

  // obj6: balk  H:311  B:287  D:20 cm
  const w6 = mm(287)
  x += w4/2 + gap + w6/2
  const obj6 = translate([x, y2, 0], hollowBox(287, 20, 311))

  // obj7: platte balk  H:130  B:10  D:100 cm
  const w7 = mm(10)
  x += w6/2 + gap + w7/2
  const obj7 = translate([x, y2, 0], hollowBox(10, 100, 130))

  // ── Rij 3: raamplaten (maten rechtstreeks in mm) ────────
  // y2-rij reikt tot y=-30mm; grootste raamplaat is 66.9mm diep (±33.45)
  // → y3 moet minstens -30 - gap - 33.45 ≈ -68mm zijn; gebruik -90 voor marge
  const y3 = -90

  // raam 2:       6 × 45.4 × 2 mm
  x = 6 / 2
  const raam2 = translate([x, y3, 0], solidBoxRaw(6, 45.4, 2))

  // raam 1:       6 × 53 × 2 mm
  x += 6/2 + gap + 6/2
  const raam1 = translate([x, y3, 0], solidBoxRaw(6, 53, 2))

  // keukenraam:   6 × 45.4 × 2 mm
  x += 6/2 + gap + 6/2
  const keukenraam = translate([x, y3, 0], solidBoxRaw(6, 45.4, 2))

  // raam voorgevel: 6 × 51 × 2 mm
  x += 6/2 + gap + 6/2
  const raamVoorgevel = translate([x, y3, 0], solidBoxRaw(6, 51, 2))

  // raam 3:       6 × 66.9 × 2 mm
  x += 6/2 + gap + 6/2
  const raam3 = translate([x, y3, 0], solidBoxRaw(6, 66.9, 2))

  return [obj1, obj2, obj3, obj4, obj5, obj6, obj7,
          raam2, raam1, keukenraam, raamVoorgevel, raam3]
}

module.exports = { main }
