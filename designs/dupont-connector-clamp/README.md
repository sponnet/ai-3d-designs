# Dupont Connector Clamp

## Overview

A rectangular block with a single rectangular cutout sized to fit a row
of single-pin Dupont/KK-2.54 style female connector housings, side by
side, so a bundle of jumper-wire connectors stays aligned.

## Geometry (see `dupont-connector-clamp.jscad`)

- **Connector count:** `CONNECTOR_COUNT`, default **8**. Also exposed as
  the `connectorCount` parameter for the openjscad.xyz UI / CLI (`--connectorCount`).
- **Cutout width:** `CONNECTOR_COUNT * SLOT_WIDTH` (`SLOT_WIDTH` default
  `2.6 mm` per connector) — one continuous through-cutout across the
  whole row. Measure your own connector housings and adjust `SLOT_WIDTH`
  if the fit is too tight/loose.
- **Cutout height:** `SLOT_HEIGHT` (default `2.8 mm`).
- **Outer walls:** `OUTER_SIDE_WALL` / `OUTER_TOP_BOTTOM_WALL` around the
  cutout; body width/height are derived so the block always fits exactly
  `CONNECTOR_COUNT` connectors.
- **Clamp depth:** `BODY_THICKNESS` (default `8 mm`), how far the block
  grips along the connector housings.

## Source

- JSCAD: [`dupont-connector-clamp.jscad`](./dupont-connector-clamp.jscad)
- OpenJSCAD: [Open `dupont-connector-clamp.jscad`](https://openjscad.xyz/?uri=https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/dupont-connector-clamp/dupont-connector-clamp.jscad#)

## Export

From the repository root:

```bash
npm run dupont-connector-clamp:stl
npm run dupont-connector-clamp:png   # requires Blender (BLENDER_BIN)
```

## Outputs

- STL: [`dupont-connector-clamp.stl`](./dupont-connector-clamp.stl)
- PNG preview: [`dupont-connector-clamp.png`](./dupont-connector-clamp.png)
  (quick `@scalenc/stl-to-png` render generated in this environment since
  Blender wasn't available; regenerate with
  `npm run dupont-connector-clamp:png` for the standard Blender-styled
  preview used by the other designs).

## Preview

![Dupont connector clamp preview](./dupont-connector-clamp.png)
