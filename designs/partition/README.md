# Partition

## Overview

A long, thin, standing triangular partition — an isoceles triangle in
cross-section, base at the bottom, apex at the top — with a slot cut into
its base sized to clip over the ridges from
[`designs/totemik/ring.jscad`](../totemik/ring.jscad) (`RIDGE_WIDTH` x
`RIDGE_PROTRUSION`). The slot runs the length of the part but is
interrupted with periodic solid bridges so a long, deep channel like this
doesn't need bridging support to print.

## Geometry

- Overall length: `150 mm`
- Triangle height (apex above the base): `10 mm`
- Triangle base width: `5 mm`
- Slot: `1.5 mm` wide, `3 mm` deep — matches the ring's `RIDGE_WIDTH` /
  `RIDGE_PROTRUSION` exactly (no clearance added; adjust `SLOT_WIDTH` /
  `SLOT_DEPTH` if the ridges need a looser or tighter fit)
- Slot interruption: every `10 mm` (`SLOT_PERIOD`), a `1 mm` wide solid
  bridge (`SLOT_BRIDGE_WIDTH`, not specified in the brief — assumed)
  interrupts the slot

## Source

- JSCAD: [`partition.jscad`](./partition.jscad)
- OpenJSCAD: [Open `partition.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/partition/partition.jscad#)

## Outputs

- STL: [`partition.stl`](./partition.stl)
- PNG preview (full length): [`partition-iso.png`](./partition-iso.png)
- PNG preview (24mm slice from underneath, showing the slot and a bridge):
  [`partition-detail.png`](./partition-detail.png)

## Preview

Full length (150 mm — the 1.5 mm slot isn't visible at this scale):

![Partition full length](./partition-iso.png)

Close-up of the underside (one bridge between two slot segments):

![Partition slot detail](./partition-detail.png)
