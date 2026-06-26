const { subtract, union } = require('@jscad/modeling').booleans
const { cuboid }          = require('@jscad/modeling').primitives
const { translate }       = require('@jscad/modeling').transforms

const DEPTH = 53.4  // extrusiediepte mm

// rechthoekig profiel, bodem op z=0, gecentreerd in x en y
function box (w, h) {
  return translate([0, 0, h / 2], cuboid({ size: [w, DEPTH, h] }))
}

function main () {
  const gap = 10
  let cx = 0

  // ── Vorm 1: platte balk  6 × 3 mm ──────────────────────
  cx = 3  // helft van 6mm
  const vorm1 = translate([cx, 0, 0], box(6, 3))

  // ── Vorm 2: Γ-profiel  10×10 mm, uitsnede 4×4 rechts-onder ──
  // Buitenste blok 10×10, minus 4×4 blok rechts-onder
  cx += 3 + gap + 5
  const vorm2 = subtract(
    translate([cx, 0, 0], box(10, 10)),
    translate([cx + 3, 0, 2], cuboid({ size: [4, DEPTH, 4] }))
    //   cx+3 = center van notch (x: cx+1 tot cx+5 = rechts 4mm)
    //   z=2  = center van notch (z: 0 tot 4 = onder 4mm)
  )

  // ── Vorm 3: T-profiel ──────────────────────────────────
  // Basis:  20mm breed × 6mm hoog
  // Steel:  3mm breed × 12mm hoog, bovenop basis
  //         links=7mm, rechts=10mm → steelcenter = 7+1.5 = 8.5mm van links
  //         = 8.5 - 10 = -1.5mm t.o.v. basismidden
  cx += 5 + gap + 10  // 10 = helft van 20mm basisbreedte
  const vorm3 = union(
    translate([cx,       0, 0],  box(20, 6)),       // basis
    translate([cx - 1.5, 0, 6],  box(3, 12))        // steel, bovenop basis
  )

  // ── Vorm 4: rechthoek  6 × 17 mm ───────────────────────
  cx += 8 + gap + 3
  const vorm4 = translate([cx, 0, 0], box(6, 17))

  return [vorm1, vorm2, vorm3, vorm4]
}

module.exports = { main }
