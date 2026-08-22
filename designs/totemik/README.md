# Totemik

Six related explorations for the Totemik project:

- **Ring** and **Partition**: a ring band with a push-fit partition strip
  (see below).
- **Totemik Guts**: a separate, independent exploration of a ring + beam
  design (different dimensions from the Ring above — not interchangeable
  with it).
- **Bottom Plug**: a push-fit foot for the bottom of a 49mm-ID tube,
  unrelated in dimensions to the other explorations.
- **Keypad**: a minimalist 4-key Cherry MX switch bar with mounting tabs,
  also unrelated in dimensions to the other explorations.
- **Gear Ring**: a toothed ring with a raised collar, also unrelated in
  dimensions to the other explorations.

## Ring

### Overview

Circular ring band modeled from a hand sketch: a plain band with a small
notch cut at the top and two bar-shaped blocks sitting on the outer surface,
one on each side of the notch. Each block carries a small retaining lip that
always hangs off its outer end ("tip", the end farthest from the ring) — the
lip tracks that end dynamically as `LIP_DEPTH` or `BLOCK_DEPTH` change —
meant to catch a cord tied around the two blocks (to pinch the notch shut)
so it can't slide off.

### Geometry

- Inner diameter: `51 mm`
- Wall thickness: `1 mm` (outer diameter `53 mm`) — also drives block
  thickness and the lip's sideways overhang, see below
- Extrusion height (band height): `10 mm` — also drives the lip's own height
- Top notch: `5 mm` wide, cut fully through the wall
- Blocks: thickness always equals the wall thickness, `10 mm` tall
  (independent `BLOCK_HEIGHT`, from the band's bottom), one flush against
  each notch edge
- Block protrusion beyond the outer surface: `4 mm` (not given in the
  sketch/spec — assumed; adjust `BLOCK_DEPTH` if a different depth is
  wanted)
- Retaining lip: always flush with the block's outer end (moves with
  `BLOCK_DEPTH`), reaching `1 mm` inward from that end (independent
  `LIP_DEPTH`, not given in the sketch/spec — assumed), `10 mm` tall (=
  extrusion height, regardless of `BLOCK_HEIGHT`) and sticking out `1 mm`
  sideways (= wall thickness) beyond the block's outward-facing side, flush
  with the block on the notch-facing side

`BLOCK_HEIGHT` is independent of `BAND_HEIGHT` and of the lip's own height: a
block shorter than the band sits flush with the band's bottom; taller rises
above the band's top surface. The lip's height always matches the band
regardless.

- Ridges: `8` ridges (`RIDGE_COUNT`), evenly spaced around the full circle,
  each `1.5 mm` wide (`RIDGE_WIDTH`), `3 mm` protrusion beyond the outer
  surface (`RIDGE_PROTRUSION`), full band height. The pattern is offset by
  half the angular spacing from the notch (at 90°), so the notch always
  falls exactly centered between two ridges — never on top of one — however
  `RIDGE_COUNT` is set.

The blocks, lips, and ridges are all built as lobes added to the outer
cylinder before the inner hole is cut, so they fuse cleanly into the wall
and the 51 mm bore stays true (not obstructed) under any of them.

### Source

- JSCAD: [`ring.jscad`](./ring.jscad)
- OpenJSCAD: [Open `ring.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik/ring.jscad#)

### Outputs

- STL: [`ring.stl`](./ring.stl)
- PNG preview (top view, matches sketch orientation): [`ring.png`](./ring.png)
- PNG preview (isometric): [`ring-iso.png`](./ring-iso.png)

### Preview

![Totemik ring top view](./ring.png)
![Totemik ring isometric view](./ring-iso.png)

## Partition

### Overview

A long, thin, standing trapezoidal partition — an isoceles trapezoid in
cross-section, wide base at the bottom, flat blunt top — with a short slot
cut into its base at each end, sized to push-fit over a ridge from
[`ring.jscad`](./ring.jscad) (`RIDGE_WIDTH` x `RIDGE_PROTRUSION`). The
middle of the length stays solid; only the last `SLOT_END_LENGTH` at each
end is slotted.

### Geometry

- Overall length: `150 mm`
- Trapezoid height (top above the base): `10 mm`
- Trapezoid base width: `5 mm`
- Flat top width: `2 mm` (`TOP_WIDTH`) — the top is cut blunt/flat first,
  and the notches (below) are cut into that flat top afterward
- Slot: `6 mm` long (`SLOT_END_LENGTH`) at each end of the part, nominally
  `1.5 mm` wide / `3 mm` deep — matching the ring's `RIDGE_WIDTH` /
  `RIDGE_PROTRUSION`
- Push-fit tolerance: `0.15 mm` (`TOLERANCE`, not specified in the brief —
  assumed) added to both the slot width and depth, so the actual cut is
  `1.65 mm` wide x `3.15 mm` deep — sized a touch larger than the ridge so
  typical FDM printing error (holes print undersize, pegs print oversize)
  still leaves a snug push-on fit rather than one that's impossible to
  assemble or too loose to grip
- Top: scalloped along its full length with `1 mm` wide (`NOTCH_WIDTH`)
  rectangular notches, crosswise to the ridge, spaced `2 mm` apart
  (`NOTCH_SPACING`). Each notch is `1 mm` deep (`NOTCH_DEPTH`, not specified
  in the brief — assumed) — a plain straight-walled cut, so depth can be set
  to anything independent of width

### Source

- JSCAD: [`partition.jscad`](./partition.jscad)
- OpenJSCAD: [Open `partition.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik/partition.jscad#)

### Outputs

- STL: [`partition.stl`](./partition.stl)
- PNG preview (full length): [`partition-iso.png`](./partition-iso.png)
- PNG preview (one end, from underneath, showing the end-slot):
  [`partition-detail.png`](./partition-detail.png)
- PNG preview (middle section, showing the top notches):
  [`partition-top-detail.png`](./partition-top-detail.png)

### Preview

Full length (150 mm — the 1.5 mm slot and 1 mm notches aren't visible at
this scale):

![Partition full length](./partition-iso.png)

Close-up of one end (slot open at the tip, stopping after 6 mm):

![Partition slot detail](./partition-detail.png)

Close-up of the top (rectangular notches, one every 2 mm):

![Partition top notch detail](./partition-top-detail.png)

## Totemik Guts

### Overview

Open ring (split-ring) profile with a short beam standing on it in the Z
direction. The beam is pushed sideways so 2 corners of its long edge sit
inside the ring wall, giving real solid overlap (not just a tangent touch)
for a reliably connected 3D print. The beam's top half is thinned down and
carries 2 through-holes. This is a separate exploration from the Ring
above — different dimensions, not interchangeable.

### Geometry

#### Ring

- Outer diameter: `49 mm`
- Wall thickness (radial): `2 mm` (inner diameter `45 mm`)
- Notch/opening at 0°: `3 mm` wide, cut fully through the wall
- Extrusion height: `5 mm`

#### Beam

- Base footprint: `27 mm x 2.5 mm`, extrusion height (Z) `100 mm`, base at
  `z = 0` — same base plane as the ring, so the ring sits at the bottom of
  the beam
- Positioned so its `27 mm` edge forms a chord at `~19.24 mm` from the ring
  center — the 2 endpoints of that edge land on the middle of the ring
  wall (radius `23.5 mm`, halfway between inner `22.5 mm` and outer
  `24.5 mm`), so those 2 corners are embedded in solid ring material
  instead of just touching the inner surface. Placed opposite the 0°
  notch (along +Y) so the two features don't clash.
- Bottom half (`z = 0` to `50 mm`, against the ring): full `2.5 mm` depth,
  keeping the overlap with the ring wall.
- Top half (`z = 50` to `100 mm`, away from the ring): depth halved to
  `1.25 mm`.
- 2 through-holes in that thinned top half, `3 mm` diameter, axis along Y
  (perpendicular to the ring's Z axis), stacked one above the other along
  Z, `±7 mm` either side of the top half's mid-height (`z = 75 mm`).
- Ring and beam are unioned, then the 2 holes subtracted, into a single
  printable solid.

#### `beamNotchSide` parameter — printing 2 interlocking halves

The top half's depth reduction can be trimmed from either side:

- `inner` (default): removes material toward the ring center, keeping the
  outer (wall-facing) edge fixed.
- `outer`: removes material toward the ring wall instead, keeping the
  inner (center-facing) edge fixed — the mirror image of `inner`.

Printing one piece with each setting gives 2 halves whose thinned top
sections face opposite directions, so they nest into a full-depth lap
joint when assembled. The parameter is exposed via
`getParameterDefinitions()`, so it shows up as a choice field in the
openjscad.xyz UI, and can be set from the CLI with
`--beamNotchSide inner` / `--beamNotchSide outer`.

### Source

- JSCAD: [`totemik-guts.jscad`](./totemik-guts.jscad)
- OpenJSCAD: [Open `totemik-guts.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik/totemik-guts.jscad#)

### Outputs

- STL (`beamNotchSide: inner`, default): [`totemik-guts.stl`](./totemik-guts.stl)
- PNG preview: [`totemik-guts.png`](./totemik-guts.png)
- STL (`beamNotchSide: outer`): [`totemik-guts-outer.stl`](./totemik-guts-outer.stl)
- PNG preview: [`totemik-guts-outer.png`](./totemik-guts-outer.png)

### Preview

![Totemik guts preview, inner notch side](./totemik-guts.png)
![Totemik guts preview, outer notch side](./totemik-guts-outer.png)

## Bottom Plug

### Overview

Push-fit foot for the bottom of a tube: a short plug that fits up inside
the tube's bottom opening, with a large rounded foot (a hemisphere) below
it that ends up touching the ground once installed. Modeled with the foot
at `Z < 0` (dome pointing down, flat equator face at `Z = 0`) and the plug
at `Z > 0`, matching the piece's physical orientation once installed —
for printing, reorienting plug-side-down in the slicer gives a flat base
and a self-supporting dome with no overhangs. A separate exploration,
unrelated in dimensions to the Ring/Partition/Totemik Guts above.

### Geometry

- Tube inner diameter: `49 mm`
- Plug diameter: `48.6 mm` (`0.4 mm` push-fit clearance — assumed, not
  specified; adjust `PLUG_CLEARANCE` for a tighter/looser fit)
- Plug height: `20 mm` (assumed — "kort stukje", not specified)
- Plug tip: `2 mm` tall lead-in chamfer, shrinking `2 mm` off the
  diameter, to ease insertion (assumed)
- Foot: hemisphere, radius `25 mm`, flat face flush with the plug's base

### Source

- JSCAD: [`bottom-plug.jscad`](./bottom-plug.jscad)
- OpenJSCAD: [Open `bottom-plug.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik/bottom-plug.jscad#)

### Outputs

- STL: [`bottom-plug.stl`](./bottom-plug.stl)
- PNG preview (isometric): [`bottom-plug-iso.png`](./bottom-plug-iso.png)
- PNG preview (front): [`bottom-plug-front.png`](./bottom-plug-front.png)

### Preview

![Bottom plug isometric](./bottom-plug-iso.png)
![Bottom plug front](./bottom-plug-front.png)

## Keypad

### Overview

Minimalist hollow beam, open only on the bottom, with 4 Cherry MX switch
cutouts side by side in the top wall — raising the switches up on the
beam's 4 closed sides (2 lengthwise side walls, 2 end walls), so there's
clearance underneath for switch pins / hot-swap sockets / wiring instead
of them sitting flush on whatever this is mounted to. 2 mounting tabs
(each with a screw hole) sit within that open bottom face, one at each
end, for screwing the whole keypad onto something. Hole size and top-wall
thickness match the standard Cherry MX plate spec measured from the
reference `3MechanicalButtons.3mf` (14x14mm square cutout, 1.8mm plate).
A separate exploration, unrelated in dimensions to the other parts in
this folder.

### Geometry

- 4 square cutouts, `14 x 14 mm` each, spaced `19.05 mm` center-to-center
  (the standard MX/1u-keycap pitch, so keycaps don't collide), cut through
  the top wall
- Beam footprint: `4 mm` margin beyond the outer hole edges on every side
  (kept as small as reasonably possible) → `79.15 x 22 mm`
- Top wall: `1.8 mm` thick (matches the measured Cherry MX plate spec)
- Side walls (front/back, full beam length) and end walls (the 2
  lengthwise ends): `2 mm` thick (assumed)
- Beam height: `12 mm` (assumed — how far "up" the holes sit, giving
  clearance underneath for switch pins/hot-swap sockets/wiring); only the
  bottom is open
- Mounting tabs: one at each end, sitting *within* the open bottom face
  (not sticking out past the beam's ends) — `10 mm` long, spanning the
  full depth between the 2 side walls, `2 mm` thick, flush with the
  bottom edge, each with a `3 mm` screw hole centered in it (all
  assumed)

### Source

- JSCAD: [`keypad.jscad`](./keypad.jscad)
- OpenJSCAD: [Open `keypad.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik/keypad.jscad#)

### Outputs

- STL: [`keypad.stl`](./keypad.stl)
- PNG preview (isometric): [`keypad-iso.png`](./keypad-iso.png)
- PNG preview (top): [`keypad-top.png`](./keypad-top.png)

### Preview

![Keypad isometric](./keypad-iso.png)
![Keypad top view](./keypad-top.png)

## Gear Ring

### Overview

Ring with 7 evenly-spaced square teeth sticking out radially, extruded
2mm, with a hollow-cylinder collar centered on it that runs all the way
down to the bottom (not just sitting on top). A separate exploration,
unrelated in dimensions to the other parts in this folder.

### Geometry

- Ring: inner diameter `45 mm`, outer diameter `51 mm`
- Teeth: `7`, evenly spaced (every `360/7 ≈ 51.43°`), each `7 mm` wide
  (tangential), sticking `10 mm` past the ring's outer edge (radial) —
  constant-width rectangular tabs, not wedges that widen with radius
- Each tooth is sunk in to the ring's *inner* radius (not just touching
  at the outer surface) — a solid overlap through the full ring wall for
  a strong printed bond, instead of a knife-edge tangent line
- V-shaped slot down the center of each tooth: `0 mm` wide where it
  starts at the ring's outer edge, widening to `2 mm` wide at the tooth's
  tip — cut clean through the tooth's height, splitting the protruding
  part into 2 prongs joined only at their sunk-in root inside the ring.
  Runs along the tooth's own radial line, centered tangentially in the
  tooth's `7 mm` width.
- Base (ring + teeth) extrusion height / first-layer thickness: `2 mm`
- Collar: hollow cylinder centered on the ring's axis, outer diameter
  `48.5 mm`, wall thickness `3 mm` (inner diameter `42.5 mm`) — its inner
  diameter is `2.5 mm` smaller than the base ring's `45 mm` bore, so
  there's a small internal step/lip where they meet. Runs from `Z = 0`
  (the very bottom, flush with the base) up to `Z = 7 mm` — `5 mm`
  above the base's own top surface (that `5 mm` rise is assumed — not
  specified in the brief).

### Source

- JSCAD: [`gear-ring.jscad`](./gear-ring.jscad)
- OpenJSCAD: [Open `gear-ring.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik/gear-ring.jscad#)

### Outputs

- STL: [`gear-ring.stl`](./gear-ring.stl)
- PNG preview (isometric): [`gear-ring-iso.png`](./gear-ring-iso.png)
- PNG preview (top): [`gear-ring-top.png`](./gear-ring-top.png)

### Preview

![Gear ring isometric](./gear-ring-iso.png)
![Gear ring top view](./gear-ring-top.png)
