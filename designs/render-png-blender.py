#!/usr/bin/env python3
import argparse
import math
import sys
from pathlib import Path

import bpy


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)
    for block in bpy.data.lights:
        bpy.data.lights.remove(block)
    for block in bpy.data.images:
        bpy.data.images.remove(block)


def setup_world():
    world = bpy.data.worlds.new("RenderWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    out = nodes.new(type="ShaderNodeOutputWorld")
    bg = nodes.new(type="ShaderNodeBackground")
    bg.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    bg.inputs["Strength"].default_value = 1.0
    links.new(bg.outputs["Background"], out.inputs["Surface"])


def make_material():
    mat = bpy.data.materials.new(name="ProductBlue")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.66, 0.03, 0.12, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.86
    bsdf.inputs["Specular"].default_value = 0.12

    tex_coord = nodes.new(type="ShaderNodeTexCoord")
    noise = nodes.new(type="ShaderNodeTexNoise")
    noise_fine = nodes.new(type="ShaderNodeTexNoise")
    mix_noise = nodes.new(type="ShaderNodeMixRGB")
    roughness_ramp = nodes.new(type="ShaderNodeValToRGB")
    bump = nodes.new(type="ShaderNodeBump")
    layer_weight = nodes.new(type="ShaderNodeLayerWeight")
    contour_ramp = nodes.new(type="ShaderNodeValToRGB")
    base_red = nodes.new(type="ShaderNodeRGB")
    dark_red = nodes.new(type="ShaderNodeRGB")
    mix_color = nodes.new(type="ShaderNodeMixRGB")

    # Strong grain: combine coarse and fine noise.
    noise.inputs["Scale"].default_value = 120.0
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.7
    noise_fine.inputs["Scale"].default_value = 420.0
    noise_fine.inputs["Detail"].default_value = 3.0
    noise_fine.inputs["Roughness"].default_value = 0.55
    mix_noise.blend_type = "MIX"
    mix_noise.inputs["Fac"].default_value = 0.45

    # Drive roughness variation so grain is more visible under light.
    roughness_ramp.color_ramp.elements[0].position = 0.18
    roughness_ramp.color_ramp.elements[0].color = (0.35, 0.35, 0.35, 1.0)
    roughness_ramp.color_ramp.elements[1].position = 0.88
    roughness_ramp.color_ramp.elements[1].color = (0.95, 0.95, 0.95, 1.0)

    bump.inputs["Strength"].default_value = 0.28
    bump.inputs["Distance"].default_value = 0.5

    # Contour emphasis: darken glancing-angle regions (silhouette bands).
    layer_weight.inputs["Blend"].default_value = 0.22
    contour_ramp.color_ramp.elements[0].position = 0.5
    contour_ramp.color_ramp.elements[1].position = 0.94
    base_red.outputs["Color"].default_value = (0.66, 0.03, 0.12, 1.0)
    dark_red.outputs["Color"].default_value = (0.25, 0.01, 0.04, 1.0)
    mix_color.blend_type = "MIX"

    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])
    links.new(tex_coord.outputs["Object"], noise_fine.inputs["Vector"])
    links.new(noise.outputs["Fac"], mix_noise.inputs["Color1"])
    links.new(noise_fine.outputs["Fac"], mix_noise.inputs["Color2"])
    links.new(mix_noise.outputs["Color"], roughness_ramp.inputs["Fac"])
    links.new(roughness_ramp.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(mix_noise.outputs["Color"], bump.inputs["Height"])

    links.new(layer_weight.outputs["Facing"], contour_ramp.inputs["Fac"])
    links.new(dark_red.outputs["Color"], mix_color.inputs["Color1"])
    links.new(base_red.outputs["Color"], mix_color.inputs["Color2"])
    links.new(contour_ramp.outputs["Color"], mix_color.inputs["Fac"])
    links.new(mix_color.outputs["Color"], bsdf.inputs["Base Color"])

    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def add_lights():
    bpy.ops.object.light_add(type="AREA", location=(4.0, -3.5, 4.8))
    key = bpy.context.object
    key.data.energy = 1200
    key.data.size = 3.8

    bpy.ops.object.light_add(type="AREA", location=(-4.5, 3.0, 2.6))
    fill = bpy.context.object
    fill.data.energy = 520
    fill.data.size = 4.8

    bpy.ops.object.light_add(type="AREA", location=(0.0, 4.5, 2.6))
    back = bpy.context.object
    back.data.energy = 320
    back.data.size = 3.8


def add_shadow_plane(obj):
    bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
    min_z = min(v.z for v in bbox)
    size = max(
        max(v.x for v in bbox) - min(v.x for v in bbox),
        max(v.y for v in bbox) - min(v.y for v in bbox)
    )

    bpy.ops.mesh.primitive_plane_add(size=size * 3.8, location=(0.0, 0.0, min_z - 0.001))
    plane = bpy.context.object
    mat = bpy.data.materials.new(name="ShadowPlane")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.96, 0.96, 0.96, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.7
    plane.data.materials.append(mat)


def focus_camera(obj):
    bpy.ops.object.camera_add(location=(2.8, -2.6, 2.1))
    cam = bpy.context.object
    bpy.context.scene.camera = cam

    constraint = cam.constraints.new(type="TRACK_TO")
    constraint.target = obj
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
    min_x = min(v.x for v in bbox)
    max_x = max(v.x for v in bbox)
    min_y = min(v.y for v in bbox)
    max_y = max(v.y for v in bbox)
    min_z = min(v.z for v in bbox)
    max_z = max(v.z for v in bbox)
    size = max(max_x - min_x, max_y - min_y, max_z - min_z)
    distance = max(2.0, size * 2.4)
    cam.location = (distance * 0.85, -distance * 0.8, distance * 0.65)


def import_and_style(stl_path: Path):
    bpy.ops.import_mesh.stl(filepath=str(stl_path))
    obj = bpy.context.selected_objects[0]
    bpy.context.view_layer.objects.active = obj

    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    obj.location = (0.0, 0.0, 0.0)
    obj.data.use_auto_smooth = True
    obj.data.auto_smooth_angle = math.radians(60)
    bpy.ops.object.shade_smooth()

    mat = make_material()
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


def render_one(stl_path: Path, output_path: Path):
    clear_scene()
    setup_world()
    add_lights()
    obj = import_and_style(stl_path)
    add_shadow_plane(obj)
    focus_camera(obj)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1000
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(output_path)

    bpy.ops.render.render(write_still=True)


def render_all(designs_root: Path):
    stl_paths = sorted(designs_root.rglob("*.stl"))
    for stl_path in stl_paths:
        output_path = stl_path.with_suffix(".png")
        print(f"Rendering {stl_path} -> {output_path}")
        render_one(stl_path, output_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stl")
    parser.add_argument("--out")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--designs-root", default="designs")
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    args = parser.parse_args(argv)

    if args.all:
        designs_root = Path(args.designs_root).resolve()
        render_all(designs_root)
        return

    if not args.stl or not args.out:
        parser.error("either --all or both --stl and --out are required")

    stl_path = Path(args.stl).resolve()
    output_path = Path(args.out).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    render_one(stl_path, output_path)


if __name__ == "__main__":
    import mathutils

    main()
