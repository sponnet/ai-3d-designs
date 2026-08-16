# Totemik Ring

## Overview

Circular ring band modeled from a hand sketch: a plain band with a small
notch cut at the top and two bar-shaped blocks sitting on the outer surface,
one on each side of the notch. Each block carries a small retaining lip
flush with its own top ("tip") — the lip always tracks the block's own top,
however tall `BLOCK_HEIGHT` is set to — meant to catch a cord tied around
the two blocks (to pinch the notch shut) so it can't slide off.

## Geometry

- Inner diameter: `51 mm`
- Wall thickness: `1 mm` (outer diameter `53 mm`) — also drives block
  thickness and the lip's height/overhang, see below
- Extrusion height (band height): `10 mm`
- Top notch: `5 mm` wide, cut fully through the wall
- Blocks: thickness always equals the wall thickness, `10 mm` tall
  (independent `BLOCK_HEIGHT`, from the band's bottom), one flush against
  each notch edge
- Block protrusion beyond the outer surface: `3 mm` (not given in the
  sketch/spec — assumed; adjust `BLOCK_DEPTH` if a different depth is
  wanted)
- Retaining lip: always flush with the block's own top (moves with
  `BLOCK_HEIGHT`), `1 mm` thick (= wall thickness) and sticking out `1 mm`
  sideways (= wall thickness) beyond the block's outward-facing side, flush
  with the block on the notch-facing side

`BLOCK_HEIGHT` is independent of `BAND_HEIGHT`: a block shorter than the
band sits flush with the band's bottom; taller rises above the band's top
surface. Either way the lip stays pinned to the block's own top.

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
