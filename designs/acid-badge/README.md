# Acid Badge

## Overview

The classic acid-house smiley — traced from the supplied
[`bad-smiley-bw.svg`](./bad-smiley-bw.svg) — with a ring of 24 evenly-
spaced 3mm holes drilled radially through its mouth, 5mm apart
center-to-center. The badge is exported as 4 separate solids (the face
outline ring, the mouth-with-holes, and the 2 eyes), since none of
them touch each other.

### How the SVG became this shape

The SVG's single `evenodd` path has 5 subpaths: the face outline (drawn
as 2 nested circles, i.e. a ring/"stroke" rather than a filled disc),
the 2 eyes, and the mouth (an organic crescent — its distance from the
face center actually varies from about 89 to 169 SVG units around its
own outline, so it's *not* a simple arc at one fixed radius). Each was
traced by flattening the SVG's bezier curves into line segments,
centered on the face circle's own center.

### Fitting the holes to the mouth

The 24 holes sit on an arc centered on the outer face circle's own
center, as asked ("radiaal ... ten opzichte van het centrum van de
buitenste cirkel"). Because the mouth isn't a simple arc, the hole
arc's own radius and angular span were found by checking every hole's
*entire circle* (not just its center point) against the mouth's traced
outline, at the radius/span combination that fits the most holes while
maximizing the chord length between them (radius 140 SVG units, span
133° out of the ~146° available). That chord length then had to become
exactly 5mm once scaled to real size, which is what pins down the
whole badge's final scale — HOLE_SPACING and HOLE_COUNT (given)
determine the mm-per-SVG-unit scale everything else is built at, not
the other way around.

### An earlier, simpler version

The very first pass at "acid badge" (before the SVG was supplied) was
just a plain ring of 24 x 3mm holes with no other shape — 5mm apart,
closing into a full circle since no partial-arc angle was given. That
version is superseded by this one; see git history if it's ever
needed again.

## Geometry

- Holes: `24`, each `3 mm` diameter, `5 mm` apart center-to-center
  (chord distance between adjacent holes), on an arc centered on the
  face's own center, `140 mm` radius (in the design's own SVG-derived
  units) sweeping `133°`
- Extrusion height: `3 mm` (assumed)
- Overall face diameter: `≈183 mm` (derived from the hole spec + the
  SVG's own proportions, not an independently chosen size)

## Source

- Original artwork: [`bad-smiley-bw.svg`](./bad-smiley-bw.svg)
- JSCAD: [`acid-badge.jscad`](./acid-badge.jscad)
- OpenJSCAD: [Open `acid-badge.jscad`](https://openjscad.xyz/v3/#https://raw.githubusercontent.com/sponnet/ai-3d-designs/refs/heads/main/designs/acid-badge/acid-badge.jscad)

## Outputs

- STL: [`acid-badge.stl`](./acid-badge.stl)
- PNG preview (top): [`acid-badge-top.png`](./acid-badge-top.png)
- PNG preview (isometric): [`acid-badge-iso.png`](./acid-badge-iso.png)

## Preview

![Acid badge top view](./acid-badge-top.png)
![Acid badge isometric](./acid-badge-iso.png)

## Real bugs found building this

Two separate, serious bugs in `@jscad/modeling`'s 2D booleans, both
specific to combining *non-convex* traced/organic polygons:

1. **`union()`/`subtract()` between 2 concave polygons whose bounding
   boxes overlap silently drops one operand entirely** — returns just
   the *other* shape, no error. Confirmed it's not about self-
   intersections, duplicate points, or vertex count (all clean here);
   reproduces even with small hand-written concave polygons placed
   inside each other's bbox, and disappears once both shapes are
   convex. `union(a, b, c, d)` with 4+ arguments also came back
   completely empty in one case even though every argument measured
   fine alone and pairwise unions of any 2-3 worked.
2. Triangulating each shape (via `@jscad/modeling`'s own internal
   earcut, so every piece fed into `union()` is convex) fixed bug 1,
   but then accumulating ~130+ sequential `union()` calls per shape
   introduced enough floating-point drift that `extrudeLinear` failed
   with `geometry is not closed at vertex ...` — genuine, sometimes
   large (10+ unit) gaps, not just numerical noise.

Given jscad's own booleans couldn't reliably combine these shapes
either way, the actual fix bypasses them for this: an offline script
uses the (separately installed, well-tested) `polygon-clipping` npm
package to compute the real unions/differences, then merges each
result's holes into its exterior with a "keyhole" bridge (a thin slit
connecting a hole's boundary to the exterior, turning a polygon-with-
holes into one simple loop) — producing point loops that need *no*
jscad boolean operations at all, just `polygon()` + `extrudeLinear()`.
Since the 4 resulting pieces don't touch, `main()` returns an array of
4 separately-extruded solids (jscad/the STL exporter fully support
this) instead of trying to `union()` them into one.
