# Acid Badge

## Overview

A circular band with 24 evenly-spaced 3mm holes running through it,
5mm apart. Only the hole count, hole diameter and hole spacing were
given; since evenly spacing 24 holes 5mm apart automatically closes
into a full ring (no separate "how far around" angle is needed to make
the design well-defined), that's the reading used here rather than
inventing an arbitrary partial-arc angle. "Spacing" is read as the
straight-line (chord) distance between adjacent hole centers — the
number you'd actually measure with calipers — which fixes the ring's
radius. The band's own width and thickness aren't specified either, so
they're assumed (kept modest — just enough material around each hole).

## Geometry

- Holes: `24`, each `3 mm` diameter, `5 mm` apart center-to-center
  (chord distance between adjacent holes)
- Ring radius (to hole centers): `≈19.15 mm`, derived from the hole
  count/spacing (`angleStep = 360° / 24 = 15°`,
  `radius = 5mm / (2 × sin(7.5°))`)
- Band width: `6 mm` (assumed) — outer radius `≈22.15 mm`, inner
  radius `≈16.15 mm`, leaving `1.5 mm` of material on each side of a
  hole
- Extrusion height: `3 mm` (assumed)

## Source

- JSCAD: [`acid-badge.jscad`](./acid-badge.jscad)
- OpenJSCAD: [Open `acid-badge.jscad`](https://openjscad.xyz/v3/#https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/acid-badge/acid-badge.jscad)

## Outputs

- STL: [`acid-badge.stl`](./acid-badge.stl)
- PNG preview (top): [`acid-badge-top.png`](./acid-badge-top.png)
- PNG preview (isometric): [`acid-badge-iso.png`](./acid-badge-iso.png)

## Preview

![Acid badge top view](./acid-badge-top.png)
![Acid badge isometric](./acid-badge-iso.png)
