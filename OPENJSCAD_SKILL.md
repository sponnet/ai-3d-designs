# OpenJSCAD / JSCAD Modeling — Skill Notes

General guidance for **JSCAD v2** designs using `@jscad/modeling`, the **CLI**, and the **openjscad.xyz** web app. Use this when adding new 3D designs in this repo (e.g. under `designs/<name>/`).

## Stack overview

| Piece | Role |
|--------|------|
| `@jscad/modeling` | Primitives, booleans, transforms, extrusions, colors (`require('@jscad/modeling')`) |
| `@jscad/cli` | `jscad design.jscad -o out.stl` from Node ([CLI README](https://github.com/jscad/OpenJSCAD.org/blob/master/packages/cli/README.md)) |
| Web UI | [openjscad.xyz](https://openjscad.xyz) — paste or load scripts; parameters via `getParameterDefinitions()` |

Design files are **JavaScript** with `require()` / `module.exports`. File extension is often **`.jscad`** or **`.js`** for tooling; **`.scad` is not accepted by the CLI** — copy or symlink to `.jscad` before CLI export if you keep a `.scad` name for editor clarity.

## Entry point contract

```js
const main = (params = {}) => {
  // return CSG geom3, array of geoms, or colorized shapes
}
module.exports = { main, getParameterDefinitions } // optional getParameterDefinitions
```

- Return a **single** solid, an **array** of solids, or **colorized** geometry for multi-part previews.
- `getParameterDefinitions()` drives the web UI; CLI can pass `--paramName value` ([CLI docs](https://github.com/jscad/OpenJSCAD.org/blob/master/packages/cli/README.md)).

## Coordinates & units

- Default: **millimeters** if you treat numbers as mm (STL export is unit-agnostic).
- Common convention: **Z up**, X/Y in the horizontal plane — stay consistent within one design and when joining sub-assemblies.
- **Right-handed** frames: `rotateZ(θ)` is CCW when looking down +Z.

## Transforms (pitfalls)

- **Mirroring:** On **openjscad.xyz**, `scale([1, -1, 1])` can throw **“factors must be positive”**. Prefer **`mirrorX` / `mirrorY` / `mirrorZ`** from `@jscad/modeling` transforms instead of negative scale.
- **Left vs right** variants: rotation alone often does not mirror “handed” features (e.g. which side a wall sits). Use an explicit **mirror** or rebuild mirrored geometry.
- **Order:** `translate` ∘ `rotate` matters; build helpers for repeated sub-assemblies.

## Alignment, rotation & booleans (workflow learnings)

These patterns come from iterating real designs (e.g. `designs/pill-cutter/`); they apply to any model with **contact planes**, **tilted cutouts**, and **CSG**.

### Preview subtractive parts, then merge

- While tuning **angle, position, and overlap**, return the **cutter** as a **second, distinct shape** (e.g. `colorize` a different color) alongside the base solid.
- When the interaction looks right, **replace** that with a single solid: **`subtract(base, …cutters)`** so export is one mesh for print/CAM.

### Which face you attach to picks the rotation axis

- A **tilt** “in the plane of the floor” relative to one face is not the same transform when you move the same part to **another face** of the base.
- Rule of thumb (axis **⊥** contact plane, **Z** up): **`rotateX`** tilts in the **YZ** plane (good when the contact normal is **±Y**); **`rotateY`** tilts in the **XZ** plane (good when the normal is **±X**); **`rotateZ`** tilts in **XY** (normal **±Z**). Keep the **same angle in degrees** if you want an analogous lean, but **change the axis** to match the new face.

### Bounding-box alignment vs. face-center alignment

- After a rotation, aligning on **max/min along one axis** (e.g. “rightmost point on **x = 0**”) usually pins a **corner** of the solid to the plane, not the **center of the contact face** — the cut can look skewed relative to the intended **midline** of that face.
- If you need the **center of a specific face** on a plane, compute where that face center goes **after** the rotation, then **`translate`** so that point lands on the target (often you must correct **two** coordinates, e.g. **X** and **Z**, when using **`rotateY`**).

### `subtract` with several solids

- In `@jscad/modeling`, **`subtract(a, b, c, …)`** is supported: everything after **`a`** is removed from **`a`**. Same for chaining mental model: one base, multiple tools.

### Dimensions in one place

- Keep **all** key lengths/angles as **`const`** at the **top** of the design file. Avoid scattering magic numbers across helpers and one-off preview scripts so production tweaks stay in one place.

## 2D → 3D

- **`extrudeLinear({ height }, geom2)`** — `height` is along **+Z** from the 2D plane.
- Polygon **winding** must define a valid area; self-intersecting or wrong order breaks booleans and extrusions.
- **SVG export** from CLI is **2D only** — 3D models will error (“only 2D geometries can be serialized to SVG”).

## Parameters & UI

- **Choice** widgets may pass **string values** or **numeric indices** depending on host — normalize in `main` if you support both.
- For stable automation, top-level **`const`** toggles (e.g. render part A/B) are sometimes simpler than UI during iteration.

## CLI: export formats

Supported output types (typical): **`.stl`**, **`.amf`**, **`.obj`**, **`.x3d`**, **`.3mf`**, **`.dxf`**, **`.json`**, etc. **There is no built-in PNG.**

Workflow used in this repo for **PNG previews**:

1. `jscad design.jscad -o out.stl`
2. Rasterize STL → PNG with **`@scalenc/stl-to-png`** (Three.js + `@napi-rs/canvas`), avoiding native **`gl`** (headless WebGL) build issues on some Node/OS combos.

See `designs/staircase/render-png.js` for a reference script.

## Default iteration loop (required in this repo)

For each model edit iteration, run this loop:

1. Export **STL** from the current `.jscad`.
2. Render a **PNG preview** from that STL.
3. Use the PNG to check:
   - no compile/export failures
   - expected silhouette and feature placement
   - no obvious visual artifacts (missing faces, hollow-looking wedges, broken unions)
4. Share the PNG result and ask the user to review/provide feedback before the next geometric tweak.

Treat STL+PNG generation as part of the normal modeling workflow, not an optional final step.

## Debugging checklist

1. **Isolate** — export one part at a time (`union` subsets or flags).
2. **2D first** — validate footprints in XY before extruding.
3. **Booleans** — overlapping coplanar faces can cause flicker or failures; small epsilon offsets if needed.
4. **Alignment** — when merging parts built in different local frames, verify **shared edge** positions numerically (one wrong `translate` shows as gaps or spikes).

## Case study learnings: sketched plate + tab + lip

These were learned while building `designs/sketched-plate/` from a hand sketch.

### Rounded unions can round more than you intended

- Unioning two `roundedRectangle` footprints is fast and often good enough for “plate + tab” outlines.
- But this also rounds **reentrant (inner) corners** where shapes overlap, not just the outer silhouette.
- If only specific corners should be rounded, use an explicit outline (`polygon`) or compose with additional cutters rather than relying on rounded-shape union alone.

### Boolean union can be order-dependent in practice

- We observed `union(a, b, c)` / `union(union(a, b), c)` dropping expected geometry for certain solids.
- Reordering to a different pairing (e.g. `union(union(a, c), b)`) produced correct output with the same parts.
- If a union result looks wrong, test multiple union orders before redesigning geometry.

### Prefer explicit solids for wedge/lip features

- A wedge built as `polygon -> extrudeLinear -> rotate` may preview as hollow or shaded incorrectly in some viewers.
- Building the wedge as an explicit `polyhedron({ points, faces })` is more predictable.
- Keep polyhedron faces **convex**; if a face is concave, split/triangulate it.

### Quick sanity checks that catch geometry bugs early

- Use `measureBoundingBox()` on intermediate and final solids to detect dropped parts quickly.
- Validate suspect solids with `geom3.validate()` to find non-manifold or invalid polyhedron issues.
- Keep dimensions in top-level `const` values so sketch-driven edits (width/height/offset tweaks) stay safe and fast.

## References

- [JSCAD User Guide](https://openjscad.xyz/guide.html)
- [JSCAD API / docs](https://openjscad.xyz/docs/)
- [@jscad/cli README](https://github.com/jscad/OpenJSCAD.org/blob/master/packages/cli/README.md)

## Example in this repo

- **Staircase:** `designs/staircase/` — `npm run staircase:stl` / `npm run staircase:png` from repo root.
- **Foam cutter:** `designs/foamcutter/` — `npm run foamcutter:stl` / `npm run foamcutter:png` from repo root.
- **Pill cutter:** `designs/pill-cutter/` — `node designs/pill-cutter/render-png.js` (see also learnings summarized in **Alignment, rotation & booleans** above).

---

*Derived from staircase and pill-cutter iteration; design-specific geometry was generalized into the sections above.*
