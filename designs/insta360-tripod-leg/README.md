# Insta360 tripod leg — sliding slot variant

## Overview

A single tripod leg, styled after the [Insta360 tripod mount on
Cults3D](https://cults3d.com/en/3d-model/gadget/insta360-tripod) and the
reference photos of that print (flat tapered blade, rounded knuckle at
the hub end, pointed foot at the tip).

This is a proposed variation of **one leg only** — the central hub piece
(the cylinder that holds the pole, with its two mounting bosses) is not
modeled yet and will be designed once the leg shape/slot is approved.

The variation from the reference: the reference leg has a round pivot
**hole** near the hub end, fixed in place by a screw + nut. This version
replaces that hole with an elongated **slot** running lengthwise along
the leg's own long axis. The pivot screw can then:

- pivot the leg open/closed like before, and
- **slide** along the slot toward the tip.

Once the three legs are folded flat against the pole, each leg can be
pushed further up (screw sliding away from the hub, toward the tip end
of the slot) to tuck it closer against the pole for a more compact
folded profile — instead of the legs sitting proud at a fixed pivot
radius.

## Geometry

- Flat blade, `130 mm` long (hub center to tip), extruded `4.5 mm` thick.
- Tapers from `20 mm` wide at the hub end to `4 mm` wide at the tip — built
  as a `hull()` of two circles, so the hub end comes out rounded (a
  built-in knuckle, matching the reference) and the taper is smooth.
- Pivot **slot** (not a hole): a stadium shape (`hull()` of two circles)
  centered on the leg's long axis, starting `9 mm` from the hub center and
  running `22 mm` toward the tip. Diameter `5 mm`, sized as a sliding
  clearance fit for the pivot screw shaft.
- All dimensions are parametric — see `getParameterDefinitions()` in
  `leg.jscad`: `LEG_LENGTH`, `PROXIMAL_DIAMETER`, `DISTAL_DIAMETER`,
  `THICKNESS`, `SLOT_SCREW_DIAMETER`, `SLOT_TRAVEL`, `SLOT_START_OFFSET`.

## Source

- [`leg.jscad`](leg.jscad)
- [`render-png.js`](render-png.js) — PNG preview renderer (`@scalenc/stl-to-png`)

## Outputs

- [`leg.stl`](leg.stl)
- [`leg-top.png`](leg-top.png) — top-down view, shows the slot
- [`leg-iso.png`](leg-iso.png) — isometric view

## Status

Proposal for review — one leg only. Next step once the leg shape/slot is
approved: design the central hub piece with its two pivot bosses (each
carrying a screw that rides in a leg's slot) and the pole socket.
