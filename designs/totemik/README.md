# Totemik Ring

## Overview

Circular ring band modeled from a hand sketch: a plain band with a small
notch cut at the top and two bar-shaped blocks sitting on the outer surface,
one on each side of the notch. Each block has a flat retaining lip on top —
lying in the horizontal plane and sticking out sideways, away from the
notch, rather than continuing the block's own vertical face outward — so a
cord tied around the two blocks (to pinch the notch shut) catches under the
lip instead of sliding off.

## Geometry

- Inner diameter: `51 mm`
- Wall thickness: `1 mm` (outer diameter `53 mm`)
- Extrusion height (band height): `10 mm`
- Top notch: `5 mm` wide, cut fully through the wall
- Blocks: `2 mm` wide, full band height (`10 mm` tall), one flush against
  each notch edge
- Block protrusion beyond the outer surface: `3 mm` (not given in the
  sketch/spec — assumed; adjust `BLOCK_DEPTH` if a different depth is
  wanted)
- Retaining lip: flat cap, `1 mm` thick, sitting on top of each block
  (total height `11 mm` at the blocks), flush with the block on the
  notch-facing side and sticking out `1.5 mm` sideways beyond the block's
  outward-facing side (not specified — assumed; adjust `LIP_HEIGHT` /
  `LIP_PROTRUSION` if a different size is wanted), so a cord wrapped around
  the blocks catches under the lip instead of sliding off

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
