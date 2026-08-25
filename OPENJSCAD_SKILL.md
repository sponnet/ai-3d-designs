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

## Documentation requirement (for every new design)

When creating or updating a design folder (for example `designs/<name>/`), also maintain a `README.md` in that same folder.

Each design README should include:

1. **Overview** — what the object is for.
2. **Geometry** — key dimensions/features in plain language.
3. **Source** — link(s) to `.jscad` source file(s).
4. **Outputs** — link to generated `.stl` artifact(s) and `.png` preview(s).

Also keep a top-level repo `README.md` updated with:

- a one-line summary for each design
- links to each design folder/README (and optionally direct STL/PNG links).

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

## Case study learnings: blade slot + support blocks (foamcutter-v2)

### Inner-hole tolerance must be handled separately

- `expand({ delta })` on an already-subtracted outline can be ambiguous for readers and easy to misapply.
- For blade-slot cutters, use explicit contour handling:
  - `outerExpanded = expand({ delta: +tol }, outer)`
  - `holeShrunk = expand({ delta: -tol }, hole)`
  - `tolerant = subtract(outerExpanded, holeShrunk)`
- This guarantees the outside grows while the slot/hole shrinks inward.

### Anchor-driven rigid transforms

- When aligning a part to two target points, compute one rigid transform from two source anchors:
  - `angle = atan2(targetB-targetA) - atan2(sourceB-sourceA)`
  - rotate source anchor A, then translate so it lands on target A
- Reuse the same transform for all related debug geometry (e.g. guide bars/planes) to avoid drift.

### Decide what stays fixed first

- If requirements say "block fixed, blade moves", do not recompute block placement from blade anchors.
- If requirements say "blade fixed, block moves", invert that relationship and solve block transform from blade anchors.
- Explicitly encode this choice in helper names (`placeBlade...` vs `blockFrom...`) to prevent regressions.

### Face-touching block constraints

- For support blocks that must always touch a face:
  - keep the touching coordinate derived from size (`centerY = -width/2` to touch at `y=0`, etc.)
  - make only the intended dimension parametric (e.g. width), keep length fixed if required.

### Slot-on-top Z rule

- If a top/support block must share the same bottom plane as base:
  - `yellowHeight = BLOCK_THICKNESS + KNIFE_ELEVATION`
  - center at `z = yellowHeight/2`
- To keep cutter on the top face:
  - place cutter at `z = yellowHeight - cutterHeight`
  - subtract from yellow block only.

## Case study learnings: staircase-with-landing (U-turn)

### Last step as riser (no top tread)

- If each flight must end on a riser, model `steps = risers` and `treads = max(0, risers - 1)`.
- Apply this consistently in:
  - run-depth calculations
  - glue-tab generation (tabs follow treads, not risers)
  - landing-depth derivation.

### U-turn footprint depth vs walking-path length

- For a U-turn stair with two opposite flights, total plan depth is **not** `D1 + Landing + D2` (that is path length).
- Use footprint depth:
  - `TotalDepth = max(D1, D2) + LandingDepth`
- If you expose a dimension check, print the explicit formula line so mismatches are obvious.

### Parameter UI constraints in openjscad.xyz

- `checkbox` parameters require `checked`, not `initial`.
- The parameter panel does not support truly live, computed read-only values.
  - You can expose "reference" fields with computed defaults.
  - For live truth, print deterministic values in `console.log` each render.

### Persisted parameter behavior

- openjscad.xyz restores previous parameter values from local storage.
- If deterministic reproducibility matters (e.g. shareable script defaults), gate params in `main`:
  - `const p = IGNORE_PERSISTED_PARAMS ? { ...DEFAULTS } : { ...DEFAULTS, ...params }`
- Emit a clear log line when persisted values are being ignored.

### Practical staircase validation output

- Useful per-render checks:
  - requested vs recomputed `D/W/H`
  - landing size `(W x D)`
  - per-flight `W`, `D`, `H`
  - single-tread width
  - rule checks (e.g. riser/tread against min/max thresholds)
- For threshold reporting, classify values as `WITHIN`, `UNDER`, or `ABOVE` and print both value and limits.

## Case study learnings: scale models with separate printable parts (staircase-with-landing L-profile)

### Scale inversion: real-mm from desired printed size

- All JSCAD geometry is authored in **real mm**; `scale([s, s, s])` is applied once at the end of `main`.
- To get a specific **printed thickness** (e.g. matching a foamboard sheet), back-calculate:
  - `realMm = desiredPrintedMm / modelScale`
  - Example: 3 mm foamboard at 1/50 scale → `3 / (1/50) = 150 mm` in the JSCAD file.
- Keep this formula explicit in a comment or `console.log` so the relationship stays visible.

### Placing separately-printed parts at an offset

- When a secondary piece (jig, bracket, connector) should be **printed apart** from the main assembly, translate it outside the main footprint **in real-mm space** before the global `scale()` is applied.
- Example: `translate([mainWidth + 500, 0, 0], cornerProfile)` — the 500 mm gap stays proportional after scaling.
- This keeps a single `scale()` call at the top level and avoids double-scaling.

### L-shaped (composite cross-section) connector geometry

- Build an L-profile from two cuboids sharing a corner — **no boolean subtract needed**:
  - Horizontal arm: `cuboid([legWidth, length, thickness])` at `z = thickness/2`
  - Vertical arm: `cuboid([thickness, length, legWidth])` at `z = thickness + legWidth/2`
  - The shared strip `[0..thickness, 0..thickness]` is covered by the horizontal arm; union merges cleanly.
- `legWidth = 2 × thickness` gives a practical glue surface for scale-model brackets.
- Length ("how far the L extends into the page") is the dimension the user perceives as the connector's size.

### Guard derived dimensions against zero or negative values

- When deriving a length from the difference of two parameters (e.g. `riser - 2 * treadThickness`), wrap in `Math.max(minSensibleValue, ...)` to prevent zero-length or negative solids that silently fail:
  - `const lLength = Math.max(thickness, riser - 2 * thickness)`

## Case study learnings: totemik series (ring, coupler, keypad, mic-holder, bottom-support, bottom-plug)

These were learned iterating a family of small parametric parts under `designs/totemikk/`, each refined over many small user-directed edits.

### `cylinder()` silently ignores `radiusStart`/`radiusEnd` — use `cylinderElliptic`

- `primitives.cylinder({ radiusStart, radiusEnd, ... })` does **not** error — those keys aren't in its options, so they're silently dropped and `radius` falls back to its **default of 1**. A "chamfer" cone written this way becomes a ~1mm spike, not a taper.
- This bug sat undetected in `bottom-plug.jscad`'s lead-in chamfer for an entire earlier session (looked fine at a glance in low-res previews) until a bounding-box check on the isolated chamfer piece exposed the ~1mm radius.
- Correct API for a tapered cylinder/frustum: `cylinderElliptic({ startRadius: [r1, r1], endRadius: [r2, r2], height, segments })` (elliptic because X/Y radii are given separately; use equal pairs for a circular taper).
- **Takeaway:** when a primitive call uses parameter names you're not 100% sure exist, dump the function's own source (`primitives.cylinder.toString()` in a quick `node -e`) or check its `measureBoundingBox()` in isolation before trusting the render.

### Winding order flips what `subtract()` does with a hole shape

- A `polygon({ points })` used as the subtracted "hole" must be wound **counter-clockwise**, or `subtract(shape, hole)` can return something like the hole itself rather than `shape` minus the hole.
- Found via a V-slot cut into a gear tooth (`gear-ring.jscad`) that came out as just the slot triangle; fixed by swapping the last two points in the polygon's point list. Verify with a minimal repro (`rectangle` minus a hand-wound triangle) if a subtract result looks inverted.

### Torus booleans can be too slow to iterate on — prefer simpler primitives when a shape allows it

- A half-hollow torus (`torus()` twice for the shell, plus a large cylinder to shave off the inner half) was reported as too CPU-intensive to regenerate quickly during iteration.
- Replaced with an outer cylinder minus a smaller, shorter, centered cylinder (a plain "closed canister" shape) — visually and functionally close enough for the part's purpose, and boolean time dropped from multi-second/slow to ~2s.
- **Takeaway:** if a `torus`-based design becomes painful to iterate on, check whether the curved feature can be approximated with cylinder/sphere booleans before optimizing segment counts.

### `hull()` between thin slices = a clean tapered wall

- To taper a wall's width with height (e.g. a beam that's narrower at the bottom, wider at the top), build two very thin (`height ≈ 0.01`) cross-section slices at the bottom and top Z, each sized/positioned for that level's target width, then `hull(bottomSlice, topSlice)`.
- This produces a straight-sided taper (a loft) on **both** the inner and outer edges if both slices' inner/outer coordinates differ — useful for e.g. a wall that must widen from a 14mm bottom rim to an 18mm top rim while keeping wall thickness sane at each end.
- Order-of-operations pitfall: if a taper is meant to finish **before** a feature sitting on top of it (e.g. a flat lid/cap that's already full-width), stop the taper at that feature's underside, not at the model's very top — otherwise the flat feature's edge overhangs the still-narrower taper for the last stretch, an unsupported ledge. (Caught by slicing the model at several Z heights and checking the width profile was monotonic with no jump.)

### Half-space `intersect()`/`subtract()` to split a part into 2 printable pieces

- A big cuboid spanning the whole model in Y/Z but only `x<=0` (or `x>=0`) in X, `intersect()`ed with the full solid, keeps just that half — a simple, reusable way to split a ring/tube into 2 halves for printing.
- **Order matters for anything added on top that must cross the cut plane.** A feature that's supposed to protrude *past* the half-boundary (e.g. a glue tab reaching into where the other half would be) must be unioned in **after** the half-cut `intersect`, not before — intersecting first clips the very protrusion the feature exists for. (First implementation got this backwards; the tab silently vanished from the output.)
- Conversely, a feature that must stay **fully inside its own half** (recessed, not crossing the seam) doesn't care about the ordering, since the half-cut never touches it anyway.
- For a tab-and-slot pair across such a seam, generate both halves from the *same* fixed-position geometry: add it (`union`) on the half that should get the protruding tab, subtract it (`subtract`) on the half that should get the matching recess — same coordinates both times, just a different boolean.
- A feature can be made to land in "only one of the split halves" for free by giving it a fixed absolute position within one half's territory (not computed relative to "whichever half is kept") — the other half's `intersect` simply never reaches that location, no extra conditional needed.

### Spherical cap formula for a shallow dome (not a full hemisphere)

- For a bulge that's much flatter than a hemisphere — flat across a given base diameter `2a`, bulging only `h` at its center — compute the *much larger* enclosing sphere's radius `R = (a² + h²) / (2h)`, then take only the cap between the sphere's pole and the cutting plane. The sphere's center sits `R − h` above (or below) that cutting plane.
- Build the cap as `intersect(sphere(R) translated to that center, a half-space box)`. For a hollow shell version, use the same construction with a smaller concentric sphere (`R − wallThickness`, same center) for the inner surface — the wall thickness this gives is only exactly `wallThickness` at the very apex, tapering slightly elsewhere, which is normally an acceptable approximation for a shallow cap.
- **Overshoot pitfall:** if the same half-space cutter (with a Z overshoot added for clean union with an adjoining part's cavity) is reused for **both** the outer surface and the inner cavity, the overshoot also lets the *outer* surface bulge past its intended flat cutting plane (since the sphere's radius grows again as Z moves back toward the sphere's own equator). Give the outer cap's cutter box a hard boundary at the true cutting plane, and only add the extra overlap margin to the inner cavity's cutter.

### Orient probe shapes to match what you're testing, not the default axis

- A cheap way to numerically verify a hole/cavity's position is `intersect(solid, smallProbeShape)` and check the resulting polygon count is 0 (open) or non-zero (solid) — much faster than eyeballing renders.
- `cylinder()` defaults to a circular cross-section in **XY**, extruded along **Z**. Probing a hole whose own axis has been rotated (e.g. a radial hole through a tube wall, axis along X) with a default-oriented probe cylinder tests the wrong cross-section — it can report "blocked" even when the hole is genuinely clear, because the probe pokes outside the hole's true (rotated) circular bound in the axis it wasn't checking. Prefer a small **cuboid** probe (isotropic in all 3 axes) unless you've explicitly rotated the probe to match the feature's real orientation.

### Slicing a cylinder through its own axis renders as a rectangle, not a circle

- For a cross-section preview render, a thin box slab cut straight through a cylinder/tube's central axis shows its **side profile** (a rectangle, or a stepped/bracketed outline for a shaped wall) — the circular cross-section only appears when slicing **perpendicular** to the axis. Don't be surprised when an axis-aligned slice "looks wrong" for not being round; that's the correct result for that cut direction.

### Reusing the same helper for outer surface and inner cavity, parameterized by radius/overlap

- Several of these parts hollow out a solid shape by building the *outer* surface and a *shrunk* copy of the same construction for the *inner* cavity, then `subtract(outer, inner)`. Writing the shared shape as a function taking the radius (or radii) as a parameter — rather than duplicating the geometry code once per outer/inner — keeps the two versions from drifting out of sync when a dimension changes, and made the later "also cut a through-hole" and "also add a relief slot" follow-up requests quick, additive changes instead of rewrites.

## References

- [JSCAD User Guide](https://openjscad.xyz/guide.html)
- [JSCAD API / docs](https://openjscad.xyz/docs/)
- [@jscad/cli README](https://github.com/jscad/OpenJSCAD.org/blob/master/packages/cli/README.md)

## Example in this repo

- **Staircase:** `designs/staircase/` — `npm run staircase:stl` / `npm run staircase:png` from repo root.
- **Foam cutter:** `designs/foamcutter/` — `npm run foamcutter:stl` / `npm run foamcutter:png` from repo root.
- **Pill cutter:** `designs/pill-cutter/` — `node designs/pill-cutter/render-png.js` (see also learnings summarized in **Alignment, rotation & booleans** above).
- **Totemik series:** `designs/totemikk/` — several small related parts (ring, coupler, keypad, mic-holder, bottom-support, bottom-plug), each with its own `.jscad` + STL/PNG outputs and a shared `render-png.js`; see also **Case study learnings: totemik series** above.

---

*Derived from staircase, pill-cutter, and staircase-with-landing iteration; design-specific geometry was generalized into the sections above.*
