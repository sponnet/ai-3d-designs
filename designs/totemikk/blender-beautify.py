#!/usr/bin/env python3
"""Blender post-processing pipeline for a JSCAD-exported STL.

Run headless with Blender's own Python (not a system python -- this
script only works loaded via bpy inside Blender):

    blender --background --python blender-beautify.py -- \\
        input.stl output.stl \\
        [--rounding 1.4] [--organic-scale 22] [--erosion 0.8] [--seed 437] \\
        [--voxel-size 0.6] [--decimate-ratio 0.5] [--save-blend out.blend]

Pipeline (mirrors the Mesh-to-Volume / voxel / Volume-to-Mesh idea from
the brief, but built from Blender's ready-made Voxel Remesh modifier --
which already does that OpenVDB round-trip in one step -- instead of
hand-wiring Mesh to Volume / Volume to Mesh nodes):

    import STL
      -> Remesh (Voxel, OpenVDB)      -- cleans/unifies the raw CAD mesh
      -> Bevel (angle-limited)        -- lightly rounds every real corner
      -> Geometry Nodes: organic erosion
           position -> 4D noise (scale, seed)
           position -> blurred position -> distance = local curvature
           curvature -> mask (0 on flat/technical faces, 1 on edges/bumps)
           noise x mask -> 0..-erosion mm along the inward normal
      -> Smooth                       -- relaxes the eroded surface a touch
      -> Decimate (collapse)          -- brings the triangle count back down
      -> export STL

Every run also saves an un-applied .blend next to the output STL (or at
--save-blend) with the full modifier stack still live, so the result can
be opened in Blender and the Remesh/Bevel/Erosion/Smooth/Decimate
settings tweaked interactively instead of re-running this script blind.

Assumptions (not specified in the original brief, flagged here rather
than silently baked in):
- voxel_size (remesh detail) defaults to 0.6mm -- fine detail for a part
  in the ~20-60mm range; shrink it for smaller parts, grow it for bigger
  ones or this step just turns into an expensive no-op / oversmooths.
- Bevel is angle-limited to 30 degrees so it only rounds actual edges,
  not every micro-triangle the voxel remesh introduces on curved faces.
- The curvature mask's "flat" threshold (0.5mm local displacement) is a
  fixed constant tuned by eye for a part around this size, not exposed
  as a CLI flag -- edit CURVATURE_FLAT_MM below if a part erodes its
  flat faces too, or barely erodes its edges at all.
- decimate_ratio 0.5 (keep ~half the triangles) is a print-file-size
  compromise, not a fidelity target.
"""

import argparse
import math
import sys
from pathlib import Path

import bpy

CURVATURE_FLAT_MM = 0.5  # local blur-vs-position displacement below this
# is treated as a flat/technical face (erosion mask -> 0); above it, as an
# edge/corner/already-organic area (erosion mask -> 1)
BLUR_ITERATIONS = 3  # how far the curvature detector looks around each vertex
BEVEL_ANGLE_DEG = 30
BEVEL_SEGMENTS = 3
SMOOTH_FACTOR = 0.4
SMOOTH_ITERATIONS = 2


def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("input_stl")
    p.add_argument("output_stl")
    p.add_argument("--rounding", type=float, default=1.4, help="Bevel width, mm")
    p.add_argument("--organic-scale", type=float, default=22.0, help="Noise feature size, mm")
    p.add_argument("--erosion", type=float, default=0.8, help="Max erosion depth, mm")
    p.add_argument("--seed", type=float, default=437.0, help="Noise seed (any number)")
    p.add_argument("--voxel-size", type=float, default=0.6, help="Voxel remesh detail, mm")
    p.add_argument("--decimate-ratio", type=float, default=0.5, help="Fraction of triangles to keep")
    p.add_argument("--save-blend", default=None, help="Where to save the editable .blend (default: next to output_stl)")
    return p.parse_args(argv)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_stl(path):
    bpy.ops.wm.stl_import(
        filepath=str(path),
        global_scale=1.0,
        use_scene_unit=False,
        forward_axis="Y",
        up_axis="Z",
        use_mesh_validate=True,
    )
    obj = bpy.context.selected_objects[0]
    bpy.context.view_layer.objects.active = obj
    # Freshly imported mesh data reports .users == 2 in this Blender
    # build even though only this one object references it (confirmed
    # via bpy.data.user_map -- looks like an internal reference-count
    # quirk, not a real second user). modifier_apply refuses to run on
    # "multi-user" data, so force it single-user before touching it.
    if obj.data.users > 1:
        obj.data = obj.data.copy()
    return obj


def build_organic_erosion_group(erosion_mm, organic_scale_mm, seed):
    ng = bpy.data.node_groups.new("OrganicErosion", "GeometryNodeTree")
    ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    group_in = ng.nodes.new("NodeGroupInput")
    group_out = ng.nodes.new("NodeGroupOutput")

    position = ng.nodes.new("GeometryNodeInputPosition")
    normal = ng.nodes.new("GeometryNodeInputNormal")

    noise = ng.nodes.new("ShaderNodeTexNoise")
    noise.noise_dimensions = "4D"
    noise.inputs["W"].default_value = seed
    # Bigger organic_scale (mm) -> coarser (lower-frequency) noise, so the
    # slider means "feature size" the way the brief's diagram implies,
    # not raw noise frequency.
    scale_from_size = ng.nodes.new("ShaderNodeMath")
    scale_from_size.operation = "DIVIDE"
    scale_from_size.inputs[0].default_value = 1.0
    scale_from_size.inputs[1].default_value = organic_scale_mm
    ng.links.new(position.outputs["Position"], noise.inputs["Vector"])
    ng.links.new(scale_from_size.outputs["Value"], noise.inputs["Scale"])

    # Local curvature proxy: how far each point sits from a blurred
    # (locally averaged) version of itself -- ~0 on flat faces, bigger on
    # edges, corners and already-bumpy geometry.
    blur = ng.nodes.new("GeometryNodeBlurAttribute")
    blur.data_type = "FLOAT_VECTOR"
    blur.inputs[4].default_value = BLUR_ITERATIONS  # Iterations
    ng.links.new(position.outputs["Position"], blur.inputs[2])  # Value (Vector)

    displacement = ng.nodes.new("ShaderNodeVectorMath")
    displacement.operation = "SUBTRACT"
    ng.links.new(position.outputs["Position"], displacement.inputs[0])
    ng.links.new(blur.outputs[2], displacement.inputs[1])

    curvature = ng.nodes.new("ShaderNodeVectorMath")
    curvature.operation = "LENGTH"
    ng.links.new(displacement.outputs[0], curvature.inputs[0])

    curvature_mask = ng.nodes.new("ShaderNodeMapRange")
    curvature_mask.inputs["From Min"].default_value = 0.0
    curvature_mask.inputs["From Max"].default_value = CURVATURE_FLAT_MM
    curvature_mask.inputs["To Min"].default_value = 0.0
    curvature_mask.inputs["To Max"].default_value = 1.0
    ng.links.new(curvature.outputs[1], curvature_mask.inputs["Value"])  # Value out (Length)

    # Noise -> only ever carves inward: 0 (Fac=0) .. -erosion mm (Fac=1).
    noise_depth = ng.nodes.new("ShaderNodeMapRange")
    noise_depth.inputs["From Min"].default_value = 0.0
    noise_depth.inputs["From Max"].default_value = 1.0
    noise_depth.inputs["To Min"].default_value = 0.0
    noise_depth.inputs["To Max"].default_value = -erosion_mm
    ng.links.new(noise.outputs["Fac"], noise_depth.inputs["Value"])

    masked_depth = ng.nodes.new("ShaderNodeMath")
    masked_depth.operation = "MULTIPLY"
    ng.links.new(noise_depth.outputs["Result"], masked_depth.inputs[0])
    ng.links.new(curvature_mask.outputs["Result"], masked_depth.inputs[1])

    offset = ng.nodes.new("ShaderNodeVectorMath")
    offset.operation = "SCALE"
    ng.links.new(normal.outputs["Normal"], offset.inputs[0])
    ng.links.new(masked_depth.outputs["Value"], offset.inputs["Scale"])

    set_position = ng.nodes.new("GeometryNodeSetPosition")
    ng.links.new(group_in.outputs["Geometry"], set_position.inputs["Geometry"])
    ng.links.new(offset.outputs[0], set_position.inputs["Offset"])
    ng.links.new(set_position.outputs["Geometry"], group_out.inputs["Geometry"])

    return ng


def add_modifiers(obj, args):
    remesh = obj.modifiers.new("VoxelRemesh", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = args.voxel_size
    remesh.adaptivity = 0.0

    bevel = obj.modifiers.new("RoundCorners", "BEVEL")
    bevel.width = args.rounding
    bevel.segments = BEVEL_SEGMENTS
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(BEVEL_ANGLE_DEG)

    erosion_group = build_organic_erosion_group(args.erosion, args.organic_scale, args.seed)
    erosion = obj.modifiers.new("OrganicErosion", "NODES")
    erosion.node_group = erosion_group

    smooth = obj.modifiers.new("RelaxSurface", "SMOOTH")
    smooth.factor = SMOOTH_FACTOR
    smooth.iterations = SMOOTH_ITERATIONS

    decimate = obj.modifiers.new("ReduceTris", "DECIMATE")
    decimate.decimate_type = "COLLAPSE"
    decimate.ratio = args.decimate_ratio

    return [remesh, bevel, erosion, smooth, decimate]


def apply_modifiers(obj, modifiers):
    bpy.context.view_layer.objects.active = obj
    for mod in modifiers:
        bpy.ops.object.modifier_apply(modifier=mod.name)


def export_stl(obj, path):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_mesh.stl(
        filepath=str(path),
        use_selection=True,
        global_scale=1.0,
        use_scene_unit=False,
        ascii=False,
        use_mesh_modifiers=True,
        axis_forward="Y",
        axis_up="Z",
    )


def main():
    args = parse_args()
    in_path = Path(args.input_stl).resolve()
    out_path = Path(args.output_stl).resolve()
    blend_path = Path(args.save_blend).resolve() if args.save_blend else out_path.with_suffix(".blend")

    reset_scene()
    obj = import_stl(in_path)
    before_verts = len(obj.data.vertices)
    before_tris = len(obj.data.polygons)

    modifiers = add_modifiers(obj, args)

    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print(f"Saved editable .blend (modifiers still live): {blend_path}")

    # Evaluate the modifier stack so the reported vertex/tri counts below
    # reflect the actual result, then apply it for a clean export mesh.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    after_verts = len(eval_obj.data.vertices)
    after_tris = len(eval_obj.data.polygons)

    apply_modifiers(obj, modifiers)
    export_stl(obj, out_path)

    print("--- blender-beautify summary ---")
    print(f"input:  {in_path}  ({before_verts} verts, {before_tris} tris)")
    print(f"output: {out_path}  ({after_verts} verts, {after_tris} tris)")
    print(f"rounding={args.rounding}mm  organic_scale={args.organic_scale}mm  "
          f"erosion={args.erosion}mm  seed={args.seed}  "
          f"voxel_size={args.voxel_size}mm  decimate_ratio={args.decimate_ratio}")


if __name__ == "__main__":
    main()
