# Totemik Guts

## Overview

Open ring (split-ring) profile with a short beam standing on it in the Z
direction. The beam is pushed sideways so 2 corners of its long edge sit
inside the ring wall, giving real solid overlap (not just a tangent touch)
for a reliably connected 3D print. The beam's top half is thinned down and
carries 2 through-holes.

## Geometry

### Ring

- Outer diameter: `49 mm`
- Wall thickness (radial): `2 mm` (inner diameter `45 mm`)
- Notch/opening at 0°: `3 mm` wide, cut fully through the wall
- Extrusion height: `5 mm`

### Beam

- Base footprint: `27 mm x 5 mm`, extrusion height (Z) `10 mm`, base at
  `z = 0` — same base plane as the ring, so the ring sits at the bottom of
  the beam
- Positioned so its `27 mm` edge forms a chord at `~19.24 mm` from the ring
  center — the 2 endpoints of that edge land on the middle of the ring
  wall (radius `23.5 mm`, halfway between inner `22.5 mm` and outer
  `24.5 mm`), so those 2 corners are embedded in solid ring material
  instead of just touching the inner surface. Placed opposite the 0°
  notch (along +Y) so the two features don't clash.
- Bottom half (`z = 0` to `5 mm`, against the ring): full `5 mm` depth,
  keeping the overlap with the ring wall.
- Top half (`z = 5` to `10 mm`, away from the ring): depth halved to
  `2.5 mm`, trimmed from the inner (center-facing) side — the outer,
  wall-facing edge stays put.
- 2 through-holes in that thinned top half, `3 mm` diameter, axis along Y
  (perpendicular to the ring's Z axis), centered vertically in the top
  half (`z = 7.5 mm`) and spaced `±7 mm` either side of center in X.
- Ring and beam are unioned, then the 2 holes subtracted, into a single
  printable solid.

## Source

- JSCAD: [`totemik-guts.jscad`](./totemik-guts.jscad)
- OpenJSCAD: [Open `totemik-guts.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik-guts/totemik-guts.jscad#)

## Outputs

- STL: [`totemik-guts.stl`](./totemik-guts.stl)
- PNG preview: [`totemik-guts.png`](./totemik-guts.png)

## Preview

![Totemik guts preview](./totemik-guts.png)
