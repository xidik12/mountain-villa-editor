# Mountain Villa — Browser Editor

Three.js single-page editor that mirrors the Blender model. Click furniture/doors/windows to select and move them; toggle layers; switch cameras; resize the envelope live.

## Run

The page uses ES module imports from a CDN, so it must be served over HTTP (file:// won't work).

```bash
cd editor
python3 -m http.server 8000
```

Then open <http://localhost:8000> in any modern browser.

(Alternative one-liners: `npx serve .`, `php -S localhost:8000`, etc.)

## Controls

| Action | How |
|---|---|
| Orbit camera | Left-drag canvas |
| Pan | Right-drag canvas |
| Zoom | Scroll wheel |
| Select object | Click it |
| Move selected | Drag the colored arrows (gizmo) |
| Switch to rotate | Press **R** (or Rotate button) |
| Switch to scale | Press **S** (or Scale button) |
| Constrain to one axis | Press **X**, **Y**, or **Z** while gizmo is up |
| All axes again | Press **A** |
| Deselect | Press **Esc** or click empty space |

## Sidebar

- **View** — jump to preset cameras (4 aerials + 2 cutaways + top-down) · toggle Orthographic
- **Layers** — toggle visibility of each of the 17 collections (walls, roof, ceilings, doors, windows, per-room furniture, lighting fixtures…)
- **Selection** — name + editable X/Y/Z position + Z rotation for the selected object
- **Dimensions** — change envelope X/Y, wall top, roof peak; click **Apply** to rebuild

## Architecture

| File | What |
|---|---|
| `index.html` | Markup + sidebar + ES module importmap (loads three.js from unpkg CDN) |
| `styles.css` | Sidebar dark theme |
| `app.js` | Scene + materials + villa builder + interaction (~700 lines) |

Coordinate system mirrors the spec: **X = east, Y = north, Z = up**. Origin at SW outer corner.

## Browser console

Useful globals exposed:

```js
window.layers       // { 'Walls_Exterior': Group, 'Furniture_Master': Group, ... }
window.params       // { envX, envY, wallTopZ, peakZ, ... }
window.buildVilla() // rebuild everything from current params
window.scene        // the Three.js scene
```

You can do things like `layers.Roof.visible = false` or `params.peakZ = 6.0; buildVilla()` from the devtools console.

## Known limitations

- Walls are solid boxes — the doors/windows are placed visually on the wall face, not cut into it. So the walls don't have actual punched holes (the wall material is visible behind glass). Acceptable for a quick editor; for proper holes we'd need CSG (`three-bvh-csg`).
- No collision detection when moving furniture — you can drag a bed through a wall. Useful sometimes; can be added.
- Edits don't persist on reload yet. Adding localStorage save/load is straightforward — let me know if you want it.
