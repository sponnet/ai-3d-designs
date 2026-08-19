# Totemik

Two related parts: the ring band itself, and a partition strip that
push-fits onto the ring's ridges.

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
