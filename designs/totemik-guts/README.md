# Totemik Guts

## Overview

Open ring (split-ring) profile with a long beam standing through it in the
Z direction. The beam is pushed sideways so 2 corners of its long edge sit
inside the ring wall, giving real solid overlap (not just a tangent touch)
for a reliably connected 3D print.

## Geometry

### Ring

- Outer diameter: `49 mm`
- Wall thickness (radial): `2 mm` (inner diameter `45 mm`)
- Notch/opening at 0°: `3 mm` wide, cut fully through the wall
- Extrusion height: `5 mm`

### Beam

- Base footprint: `27 mm x 5 mm`
- Extrusion height (Z): `200 mm`, base at `z = 0` — same base plane as the
  ring, so the ring sits at the bottom of the beam
- Positioned so its `27 mm` edge forms a chord at `~19.24 mm` from the ring
  center — the 2 endpoints of that edge land on the middle of the ring
  wall (radius `23.5 mm`, halfway between inner `22.5 mm` and outer
  `24.5 mm`), so those 2 corners are embedded in solid ring material
  instead of just touching the inner surface. The beam then extends
  `5 mm` further inward. Placed opposite the 0° notch (along +Y) so the
  two features don't clash.
- Ring and beam are unioned into a single printable solid (they genuinely
  overlap, not just touch).

## Source

- JSCAD: [`totemik-guts.jscad`](./totemik-guts.jscad)
- OpenJSCAD: [Open `totemik-guts.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik-guts/totemik-guts.jscad#)

## Outputs

- STL: [`totemik-guts.stl`](./totemik-guts.stl)
- PNG preview: [`totemik-guts.png`](./totemik-guts.png)

## Preview

![Totemik guts preview](./totemik-guts.png)
