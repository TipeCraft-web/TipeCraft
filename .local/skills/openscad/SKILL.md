---
name: openscad
description: Build parametric 3D models on Replit from dimensions and boolean primitives — mechanical parts, enclosures, brackets, fixtures, organizers, containers, and other printable CAD objects — producing editable OpenSCAD source and a downloadable STL preview. Not for realistic or sculptural forms such as vehicles, characters, animals, figurines, or product replicas; OpenSCAD's constructive-solid-geometry approach models those poorly, so use `generate3DModel` (the media-generation skill) for a visual `.glb` mesh of such objects, or an image/web artifact when a flat render or app is what's wanted. (Functional curved parts like handles, grips, and fairings are fine.)
---

# Build 3D Models

Use this skill to turn a user's 3D design request into an editable, parametric model that renders in Replit.

## When To Use This Skill

OpenSCAD builds geometry from dimensioned primitives (cubes, cylinders, spheres) combined with boolean operations. It excels at precise, mechanical, printable shapes and is a poor fit for realistic or sculptural ones.

- **Good fit:** parts, enclosures, brackets, fixtures, organizers, containers, gaskets, stands, jigs, and functional curved objects like handles, grips, and fairings — anything naturally described by dimensions, holes, and tolerances.
- **Poor fit:** realistic vehicles, characters, animals, human figures, faces, statues, and product replicas. These need smooth, sculpted surfaces that constructive solid geometry cannot represent well, and the result will look crude.

When the request is a poor fit, do not force it into OpenSCAD. OpenSCAD is for precise, printable CAD; when the user wants a *visual* 3D model of a realistic or sculptural object, use `generate3DModel` (see the `media-generation` skill), which returns a textured `.glb` mesh. Fall back to a generated image or a web/game app only when a 3D mesh isn't what they're after. Either way, don't ship a blocky OpenSCAD approximation.

## Model The Request

- Build what the user asked for, faithfully. Do not embellish the request or add unrelated constraints — if they say "a mug", make a mug, not an elaborate ceramic vessel.
- Treat millimeters as the default unit unless the user specifies another scale.
- Ask for missing dimensions only when they materially affect fit or function. Otherwise choose sensible defaults and state them.
- Put important dimensions and tolerances in named variables at the top of `src/model.scad` so the user can adjust the design without rewriting geometry.
- Use full descriptive snake_case parameter names (`wall_thickness`, `handle_radius`), never abbreviations like `w_t`. Users edit these variables directly in the source, so they must read well.
- When the model has distinct parts, wrap each in `color()` with a named CSS color exposed as a `*_color` string variable. STL export drops color, but colored parts make the inspection renders far easier to read.
- If the user supplies an STL or other mesh, `import()` it — never recreate it from scratch. Cut from it with `difference()` and add to it with `union()`, and parametrize only your modifications. Work out which way is "up" for the imported model (base at the bottom, front-facing details forward) and rotate it to sit flat on any stand or base, keeping the rotation in top-of-file variables so the user can fine-tune it.
- Use small, named OpenSCAD modules for repeated parts or meaningful subassemblies. Keep one-off geometry inline.
- Prefer simple primitives and boolean operations over dense hard-coded polygons.
- Use a small overlap such as `epsilon = 0.01` where coplanar boolean faces would otherwise produce fragile geometry.
- Choose `$fn` deliberately: keep iteration fast while editing, then use enough segments for smooth final curves.

For functional or printable parts, account for wall thickness, clearance, minimum feature size, orientation, and whether disconnected volumes are intentional. The final geometry should be manifold and watertight.

A request like "a mug" should produce `src/model.scad` shaped like this:

```openscad
// Mug parameters
cup_height = 100;
cup_radius = 40;
handle_radius = 30;
handle_thickness = 10;
wall_thickness = 3;
mug_color = "SteelBlue";

color(mug_color)
difference() {
    union() {
        cylinder(h=cup_height, r=cup_radius);

        translate([cup_radius - 5, 0, cup_height / 2])
        rotate([90, 0, 0])
        torus(handle_radius, handle_thickness / 2);
    }

    translate([0, 0, wall_thickness])
    cylinder(h=cup_height, r=cup_radius - wall_thickness);
}

module torus(r1, r2) {
    rotate_extrude()
    translate([r1, 0, 0])
    circle(r=r2);
}
```

## Use BOSL2 For Threads And Organic Shapes

Do not hand-roll helical threads from `cylinder()` + `linear_extrude()`, and do not approximate organic curves by stacking primitives. Vendor the BSD-licensed BOSL2 library next to the model so `include <BOSL2/std.scad>` resolves relative to `src/model.scad`:

```bash
mkdir -p src/BOSL2
curl -fsSL https://github.com/BelfrySCAD/BOSL2/archive/refs/tags/v2.0.747.tar.gz \
  | tar xz -C src/BOSL2 --strip-components=1 --no-wildcards-match-slash --wildcards '*/*.scad' '*/LICENSE'
```


- Always `include <BOSL2/std.scad>` before any specialty file — they depend on its definitions.
- Standard screws, bolts, nuts, and clearance holes: add `include <BOSL2/screws.scad>` and use `screw()`, `screw_hole()`, `nut()` with spec strings like `"M6x1"` or `"#8-32"`.
- For an internally threaded (tapped) hole, pass `thread=true` to `screw_hole()` (e.g. `screw_hole("M6x1", length=12, thread=true)`). `thread` defaults to `false`, so a bare `screw_hole("M6x1")` cuts an unthreaded clearance hole, not modeled threads — keep that distinct from clearance holes.
- Custom thread profiles: add `include <BOSL2/threading.scad>` and use `threaded_rod()`, `threaded_nut()`, which take numeric diameter and pitch, not spec strings. Expose diameter/length/pitch as parameters and use `$fn = 64` or higher so threads resolve.
- Gears: add `include <BOSL2/gears.scad>`.
- Organic, swept, or lofted shapes (grips, shells, handles, fairings): `include <BOSL2/skin.scad>` for `path_sweep()` and `skin()`, `<BOSL2/beziers.scad>` for Bezier paths, `<BOSL2/rounding.scad>` for `round_corners()` / `offset_sweep()`.

Skip BOSL2 entirely when plain primitives and booleans express the model cleanly.

## Source And Output

- `src/model.scad` is the source of truth. Make CAD changes there, not in the React viewer.
- `public/model.stl` is generated output. Do not hand-edit it.
- The artifact currently presents one STL mesh. A model may contain multiple connected or disconnected solids, but requests for separately downloadable parts should be clarified before combining them into one export.

The dev workflow watches `src/model.scad`, renders it with OpenSCAD, and reloads the preview after a successful render. Outside the dev workflow, render explicitly:

```bash
pnpm --filter @workspace/<slug> run render
```

After each meaningful geometry change, render the model and fix OpenSCAD errors before continuing.

## Look At The Model

You cannot screenshot the in-workspace WebGL preview — capture tools return an empty viewport. Instead, have OpenSCAD render flat PNGs from a few angles and read them. `--viewall --autocenter` frames the model; the `--camera` rotation (`rotx`,`rotz`) picks the angle:

```bash
openscad --viewall --autocenter --colorscheme=Tomorrow --imgsize=1000,750 --camera=0,0,0,55,0,25,0 -o /tmp/scad-iso.png   src/model.scad
openscad --viewall --autocenter --colorscheme=Tomorrow --imgsize=1000,750 --camera=0,0,0,90,0,0,0  -o /tmp/scad-front.png src/model.scad
openscad --viewall --autocenter --colorscheme=Tomorrow --imgsize=1000,750 --camera=0,0,0,90,0,90,0 -o /tmp/scad-side.png  src/model.scad
openscad --viewall --autocenter --colorscheme=Tomorrow --imgsize=1000,750 --camera=0,0,0,0,0,0,0    -o /tmp/scad-top.png   src/model.scad
```

**Always render these PNGs and open them after building and after every geometry change.** Read the images and check the shape, proportions, holes, and that nothing is missing or malformed before continuing or presenting. Do not rely on the reported dimensions and triangle count alone — look at the model. Add extra `--camera` angles (back: `--camera=0,0,0,90,0,180,0`, bottom: `--camera=0,0,0,180,0,0,0`) or a section cut when you need to inspect an interior or rear feature.

Loop write → render → inspect → fix until the views look right. Do not finalize just because OpenSCAD compiled — finalize only when every view satisfies the request. Before stopping, enumerate the features the request implies and confirm each one is visible in the renders. For example, a phone case implies a hollow pocket, camera cutout, port opening, button cutouts, and printable walls; a mug implies a hollow body, rim, base, and handle. Missing, disconnected, floating, or clearly disproportionate geometry means another iteration.

For the final inspection pass, add `--render` to the PNG commands: it forces a full CSG evaluation that surfaces non-manifold or degenerate geometry the fast preview hides. It is slower, so use plain preview renders while iterating.

## OpenSCAD In The Repl

OpenSCAD must be available on `PATH` as `openscad`. Pick the install path by which Nix config the repl actually uses — check for `replit.nix` and `flake.nix` first, because when either exists it is authoritative and edits to `.replit`'s `[nix]` section are ignored:

- If the repl has a `replit.nix`, add `pkgs.openscad` to its `deps` list (the legacy format is `{ pkgs }: { deps = [ pkgs.openscad ]; }`, not a `packages` attr). A repl can have both `replit.nix` and a `.replit` `[nix]` section; `replit.nix` wins, so add it there, not to `.replit`.
- Else if the repl is flake-based (`flake.nix`), add `pkgs.openscad` to the development shell's `packages` list in the root `flake.nix`, then reload the environment.
- Otherwise (a `.replit` file with no `replit.nix`, which is most modern templates), add it to the `[nix]` section — the same field the System Dependencies pane manages, resolved from Replit's pre-indexed Nix cache:

  ```toml
  [nix]
  packages = ["openscad"]
  ```

Do not replace OpenSCAD with a JavaScript parser. The render command is:

```bash
openscad -o public/model.stl src/model.scad
```

## Finish

Before presenting the artifact:

1. Render successfully from the current `src/model.scad`.
2. Render PNGs with OpenSCAD (see "Look At The Model") and read them to confirm the shape is correct from every angle.
3. Confirm the reported dimensions match the intended scale.
4. Check that holes, clearances, walls, and repeated features match the request.
5. Confirm `public/model.stl` downloads from the viewer.
6. Tell the user which top-level parameters control the model and note any dimensions you inferred.

Never tell the user the model is done unless the render-and-inspect loop actually ran on the current source in this turn.

The viewer uses the MIT-licensed Three.js, React Three Fiber, Drei, and `vite-plugin-full-reload` packages. Only modify viewer code when the user asks to change the viewing experience.
