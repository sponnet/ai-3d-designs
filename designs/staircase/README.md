# Staircase (OpenJSCAD)

- **Source:** `staircase.scad` — JSCAD script using `@jscad/modeling` (despite the `.scad` extension; the CLI expects `.jscad` for export).
- **Outputs:** `staircase.jscad` (copy), `staircase.stl`, `staircase.png` — generated; safe to delete and regenerate.

From the **repository root** (`foamcutter/`):

```bash
npm run staircase:stl   # STL only
npm run staircase:png   # STL + PNG preview
```

See [OPENJSCAD_SKILL.md](../../OPENJSCAD_SKILL.md) for toolchain notes.
