# Totemik Ring

## Overview

Circular ring band modeled from a hand sketch: a plain band with a small
notch cut at the top and two bar-shaped blocks sitting on the outer surface,
one on each side of the notch. Each block carries a small retaining lip that
always hangs off its outer end ("tip", the end farthest from the ring) — the
lip tracks that end dynamically as `LIP_DEPTH` or `BLOCK_DEPTH` change —
meant to catch a cord tied around the two blocks (to pinch the notch shut)
so it can't slide off.

## Geometry

- Inner diameter: `51 mm`
- Wall thickness: `1 mm` (outer diameter `53 mm`) — also drives block
  thickness and the lip's sideways overhang, see below
- Extrusion height (band height): `10 mm` — also drives the lip's own height
- Top notch: `5 mm` wide, cut fully through the wall
- Blocks: thickness always equals the wall thickness, `10 mm` tall
  (independent `BLOCK_HEIGHT`, from the band's bottom), one flush against
  each notch edge
- Block protrusion beyond the outer surface: `3 mm` (not given in the
  sketch/spec — assumed; adjust `BLOCK_DEPTH` if a different depth is
  wanted)
- Retaining lip: always flush with the block's outer end (moves with
  `BLOCK_DEPTH`), reaching `3 mm` inward from that end (independent
  `LIP_DEPTH`, not given in the sketch/spec — assumed), `10 mm` tall (=
  extrusion height, regardless of `BLOCK_HEIGHT`) and sticking out `1 mm`
  sideways (= wall thickness) beyond the block's outward-facing side, flush
  with the block on the notch-facing side

`BLOCK_HEIGHT` is independent of `BAND_HEIGHT` and of the lip's own height: a
block shorter than the band sits flush with the band's bottom; taller rises
above the band's top surface. The lip's height always matches the band
regardless.

The blocks and lips are built as lobes added to the outer cylinder before the
inner hole is cut, so they fuse cleanly into the wall and the 51 mm bore
stays true (not obstructed) under the blocks.

## Source

- JSCAD: [`ring.jscad`](./ring.jscad)
- OpenJSCAD: [Open `ring.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/totemik/ring.jscad#)

## Outputs

- STL: [`ring.stl`](./ring.stl)
- PNG preview (top view, matches sketch orientation): [`ring.png`](./ring.png)
- PNG preview (isometric): [`ring-iso.png`](./ring-iso.png)

## Preview

![Totemik ring top view](./ring.png)
![Totemik ring isometric view](./ring-iso.png)
