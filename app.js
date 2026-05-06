import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// ========================================================================
// 9.5 × 11 envelope (Plan A) · ONLY DELTA from prior version:
// dining-E strip widened from 1.0 m to 1.5 m N-S → P5 at y=1.5 (was 2.0)
// Bath/WC zone shrinks from y=0..2 to y=0..1.5 to accommodate.
// ========================================================================

// Sidebar is collapsible at any screen size. State lives on body via the
// `.sidebar-open` class. The canvas takes:
//   - full viewport width on mobile (drawer floats over the canvas), OR
//   - full viewport width on desktop when the sidebar is hidden, OR
//   - viewport - 320 px on desktop when the sidebar is shown.
const isMobile = () => window.innerWidth <= 1024;
const sidebarOpen = () => document.body.classList.contains('sidebar-open');
const sidebarWidth = () => (isMobile() || !sidebarOpen() ? 0 : 320);
const viewW = () => window.innerWidth - sidebarWidth();
const viewH = () => window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9CB3D1);
scene.fog = new THREE.Fog(0x9CB3D1, 60, 200);

let camera = new THREE.PerspectiveCamera(40, viewW() / viewH(), 0.1, 500);
camera.up.set(0, 0, 1);
camera.position.set(20, -16, 12);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('viewport'),
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewW(), viewH());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(4.75, 5.5, 1.5);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.maxPolarAngle = Math.PI * 0.49;
orbit.minDistance = 2;
orbit.maxDistance = 80;

// === LIGHTING ===
// Primary sun — moved high overhead and slightly north so it strikes the
// north-tilted shed roof + solar panels closer to perpendicular (was SW
// at low angle, which made panels look black).
const sun = new THREE.DirectionalLight(0xfff0d0, 2.4);
sun.position.set(4, 9, 22);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.bias = -0.0005;
sun.target.position.set(4.75, 5.5, 0);
scene.add(sun);
scene.add(sun.target);

// Secondary fill — high directional from the south so the south gable
// + roof underside pick up some bounce, and the array is never fully
// in shadow when orbited.
const fill = new THREE.DirectionalLight(0xeaf2ff, 0.65);
fill.position.set(4, -10, 16);
fill.target.position.set(4.75, 5.5, 0);
scene.add(fill);
scene.add(fill.target);

scene.add(new THREE.HemisphereLight(0xc8dcff, 0x4d5b3d, 0.85));   // brighter sky bounce
scene.add(new THREE.AmbientLight(0xffffff, 0.32));                // raised ambient floor

// === MATERIALS ===
const hex = (h) => new THREE.Color(h);
const M = {
  ext:    new THREE.MeshStandardMaterial({ color: hex(0xD9C7A7), roughness: 0.85 }),
  plinth: new THREE.MeshStandardMaterial({ color: hex(0x5A5754), roughness: 0.85 }),
  roof:   new THREE.MeshStandardMaterial({ color: hex(0x2E2E2E), roughness: 0.45, metalness: 0.45 }),
  trim:   new THREE.MeshStandardMaterial({ color: hex(0xFAFAFA), roughness: 0.55 }),
  int:    new THREE.MeshStandardMaterial({ color: hex(0xF5F2EC), roughness: 0.7 }),
  batten: new THREE.MeshStandardMaterial({ color: hex(0x8B5A2B), roughness: 0.6 }),
  floor:  new THREE.MeshStandardMaterial({ color: hex(0xC9B898), roughness: 0.4 }),
  wet:    new THREE.MeshStandardMaterial({ color: hex(0x8C8C8C), roughness: 0.4 }),
  wt:     new THREE.MeshStandardMaterial({ color: hex(0xB8B8B0), roughness: 0.3 }),
  wood:   new THREE.MeshStandardMaterial({ color: hex(0xA0703B), roughness: 0.5 }),
  alu:    new THREE.MeshStandardMaterial({ color: hex(0x3A3A3A), roughness: 0.4, metalness: 0.7 }),
  // Reinforced-concrete colours for Construction view (columns + beams)
  rcCol:  new THREE.MeshStandardMaterial({ color: hex(0xC97851), roughness: 0.85, emissive: hex(0x4a2410), emissiveIntensity: 0.25 }),
  rcBeam: new THREE.MeshStandardMaterial({ color: hex(0x8a6f55), roughness: 0.85, emissive: hex(0x3a2a18), emissiveIntensity: 0.25 }),
  // Matte near-black for window mullions/frames — reads cleanly against glass
  // and against the white wall, like the reference photo.
  winFrame: new THREE.MeshStandardMaterial({ color: hex(0x14161A), roughness: 0.55, metalness: 0.25 }),
  glass:  new THREE.MeshStandardMaterial({ color: hex(0xAECEE0), roughness: 0.05, transparent: true, opacity: 0.30 }),
  grass:  new THREE.MeshStandardMaterial({ color: hex(0x4F6F38), roughness: 0.95 }),
  paving: new THREE.MeshStandardMaterial({ color: hex(0x8C7A65), roughness: 0.85 }),
  gravel: new THREE.MeshStandardMaterial({ color: hex(0x9D9285), roughness: 0.95 }),
  fabric: new THREE.MeshStandardMaterial({ color: hex(0xC8B690), roughness: 0.9 }),
  bedding:new THREE.MeshStandardMaterial({ color: hex(0xEAE4D8), roughness: 0.85 }),
  pillow: new THREE.MeshStandardMaterial({ color: hex(0xF8F4EE), roughness: 0.9 }),
  counter:new THREE.MeshStandardMaterial({ color: hex(0x6B4423), roughness: 0.5 }),
  porc:   new THREE.MeshStandardMaterial({ color: hex(0xF8F8F6), roughness: 0.15 }),
  chrome: new THREE.MeshStandardMaterial({ color: hex(0xD8D8DA), roughness: 0.15, metalness: 0.95 }),
  metal:  new THREE.MeshStandardMaterial({ color: hex(0x4D4D50), roughness: 0.4, metalness: 0.7 }),
  rug:    new THREE.MeshStandardMaterial({ color: hex(0x8C5642), roughness: 0.95 }),
  mountain:new THREE.MeshStandardMaterial({ color: hex(0x4F5C68), roughness: 0.95 }),
  // Solar PV: brighter blue, low metalness, slight self-emissive so panels
  // read clearly even when the sun grazes them at a low angle.
  pv:     new THREE.MeshStandardMaterial({
    color: hex(0x2D4480),
    roughness: 0.45,
    metalness: 0.05,
    emissive: hex(0x0E1830),
    emissiveIntensity: 0.4,
  }),
};

// === LAYERS ===
const LAYER_NAMES = [
  'Site', 'Foundation',
  'Columns', 'Beams',                       // structural — visible in Construction view
  'Walls_Exterior', 'Walls_Interior',
  'Trim_Eaves', 'Roof', 'Ceilings',
  'Doors', 'Windows',
  'Furniture_Master', 'Furniture_BR2', 'Furniture_BR1',
  'Furniture_Dining', 'Furniture_Kitchen',
  'Furniture_Bath', 'Furniture_WC',
  'Lighting_Fixtures',
  'Construction_Annotations',               // 3D labels (C1–C9 etc.) shown only in Construction view
];
const layers = {};
LAYER_NAMES.forEach(n => {
  const g = new THREE.Group();
  g.name = n;
  layers[n] = g;
  scene.add(g);
});

// === HELPERS ===
function assembly(name, layerName) {
  const g = new THREE.Group();
  g.name = name;
  g.userData = { isAssembly: true, layer: layerName };
  layers[layerName].add(g);
  return g;
}
function partBox(parent, suffix, pos, size, mat) {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.name = parent.name + suffix;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function partCyl(parent, suffix, pos, r, h, mat, axis = 'z') {
  const geo = new THREE.CylinderGeometry(r, r, h, 24);
  const mesh = new THREE.Mesh(geo, mat);
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  else if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.name = parent.name + suffix;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function soloBox(name, layerName, pos, size, mat) {
  const a = assembly(name, layerName);
  partBox(a, '', pos, size, mat);
  setAnchor(a, pos[0], pos[1], pos[2]);
  return a;
}

// After parts are added at world coords, snap the group's origin to (ax, ay, az)
// and offset every child by the inverse so world positions don't change.
// Effect: group.position IS the world location of the assembly, scale & gizmo move work properly.
function setAnchor(group, ax, ay, az = 0) {
  group.children.forEach(child => {
    child.position.x -= ax;
    child.position.y -= ay;
    child.position.z -= az;
  });
  group.position.set(ax, ay, az);
}

// === PARAMS — v6.2 (3.5 m floor-to-ceiling · FFL raised to +0.60 m for tropical flood protection · 11 columns · shed roof + solar) ===
// Roof is a single plane that's HIGH on the south (over dining) and LOW on the north (over bedrooms).
// The dining ceiling vaults up toward the south wall; bedrooms get flat ceilings + small attic.
const params = {
  envX: 9.5, envY: 11.0,
  wallBtmZ: 0.60,        // FFL — 600 mm plinth (v6.2 tropical flood protection)
  wallTopZ: 4.10,        // LOW edge — N wall top
  wallTopS: 5.06,        // HIGH edge — S wall top (= FFL + 3.5 + 0.96 m rise over 11 m at 5° pitch / 8.75 % slope)
  roofPitchDeg: 5,       // shallower roof per v6.3 — 8.75 % slope (was 10°/17.6 %)
  // Legacy hip params kept so older code paths don't crash if referenced
  peakZ: 5.06, ridgeY: 0, ridgeXfromW: 1.4, ridgeXfromE: 1.4,
  extWT: 0.20, intWT: 0.15,
  ovh: { n: 0.8, s: 0.8, e: 0.8, w: 1.2 },
  roofThick: 0.10,
  P2_y: 7.5,          // bedroom-row south wall (v6: was 7.0)
  P4_y: 4.0,          // BR1 south / dining-E strip top (v6: was 3.5)
  roofType: 'shed',   // v6 canonical: 'shed' | 'hip' | 'flat'
  parapetH: 0.30,
  // Solar PV — FULL-ROOF carpet. 48 × 410 W = 19.68 kW (massive — feeds villa, EV charger, grid export).
  // Panels follow the 10° N-tilt of the shed roof. ~70 % of ideal yield vs perfect-S panels;
  // the trade-off is paid back by the much larger area. For peak efficiency, tilted racks recommended (see spec § 9b).
  pvPanels: 48,
  pvCols: 8,          // 8 columns E-W × 1.134 m portrait = 9.07 m (fits 9.5 m envelope)
  pvRows: 6,          // 6 rows N-S × 1.722 m portrait = 10.33 m (fits 11 m envelope)
  pvPanelW: 1.134,    // along E-W (portrait orientation)
  pvPanelH: 1.722,    // along slope (N-S)
  pvCenterX: 4.75,    // envelope midpoint E-W
  pvCenterY: 5.5,     // envelope midpoint N-S — array spans whole roof
};

function clearAllLayers() {
  Object.values(layers).forEach(g => {
    while (g.children.length) {
      const c = g.children[0];
      g.remove(c);
      c.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
  });
}

// === WALL DEFINITIONS (filled by buildVilla) + rebuild from current door/window positions ===
const wallDefs = [];

function findWallAssembly(id) {
  for (const layerName of ['Walls_Exterior', 'Walls_Interior']) {
    const found = layers[layerName].children.find(c => c.name === id);
    if (found) return found;
  }
  return null;
}

function rebuildWallById(id) {
  const def = wallDefs.find(d => d.id === id);
  if (!def) return;
  const wall = findWallAssembly(id);
  if (!wall) return;
  // Clear current segments
  while (wall.children.length) {
    const c = wall.children[0];
    wall.remove(c);
    if (c.geometry) c.geometry.dispose();
  }
  // Collect openings whose userData.wallId == id and which sit close enough to the wall
  // (any door dragged > 0.5 m perpendicular to the wall is treated as "detached" and ignored)
  const ops = [];
  ['Doors', 'Windows'].forEach(layerName => {
    layers[layerName].children.forEach(o => {
      if (o.userData?.wallId !== id || !o.visible) return;
      const perp = def.axis === 'x' ? o.position.y : o.position.x;
      if (Math.abs(perp - def.lineCoord) > 0.5) return;
      const along = def.axis === 'x' ? o.position.x : o.position.y;
      // Effective opening dims = base × current scale on the relevant axes
      const scaleAlong = def.axis === 'x' ? o.scale.x : o.scale.y;
      const w = (o.userData.openingW || 0.9) * Math.abs(scaleAlong);
      const baseSill = o.userData.openingSill;
      const baseTop  = o.userData.openingTop;
      const baseH = baseTop - baseSill;
      // Anchor was set to baseSill (or FFL for doors), so group.position.z is the current world bottom
      const sill = o.position.z;
      const top  = sill + baseH * Math.abs(o.scale.z);
      // Skip if the opening would poke past the wall ends
      if (along - w/2 < def.alongStart - 0.01) return;
      if (along + w/2 > def.alongEnd + 0.01) return;
      ops.push({ c: along, w, sill, top });
    });
  });
  ops.sort((a, b) => a.c - b.c);
  // Build segments around openings
  const wallTop = params.wallTopZ, wallBot = params.wallBtmZ;
  const addSeg = (alongCenter, alongLen, zCenter, zHeight) => {
    if (alongLen < 0.001 || zHeight < 0.001) return;
    const pos = def.axis === 'x'
      ? [alongCenter, def.lineCoord, zCenter]
      : [def.lineCoord, alongCenter, zCenter];
    const size = def.axis === 'x'
      ? [alongLen, def.thickness, zHeight]
      : [def.thickness, alongLen, zHeight];
    partBox(wall, `_seg_${alongCenter.toFixed(2)}_${zCenter.toFixed(2)}`, pos, size, def.mat);
  };
  let prev = def.alongStart;
  for (const op of ops) {
    const opStart = op.c - op.w / 2;
    const opEnd   = op.c + op.w / 2;
    if (opStart > prev + 0.001) addSeg((prev + opStart) / 2, opStart - prev, (wallBot + wallTop) / 2, wallTop - wallBot);
    if (op.sill > wallBot + 0.001) addSeg(op.c, op.w, (wallBot + op.sill) / 2, op.sill - wallBot);
    if (op.top < wallTop - 0.001) addSeg(op.c, op.w, (op.top + wallTop) / 2, wallTop - op.top);
    prev = opEnd;
  }
  if (def.alongEnd > prev + 0.001) addSeg((prev + def.alongEnd) / 2, def.alongEnd - prev, (wallBot + wallTop) / 2, wallTop - wallBot);
}

function rebuildAllWalls() {
  wallDefs.forEach(def => rebuildWallById(def.id));
}

// ========================================================================
// VILLA BUILDER (9.5 × 11 — prior layout with strip-width tweak)
// ========================================================================
function buildVilla() {
  clearAllLayers();
  const p = params;
  const FFL = p.wallBtmZ;
  const cx = p.envX / 2;
  const cy = p.envY / 2;

  // === SITE ===
  soloBox('Ground',      'Site', [cx, cy, -0.05], [40, 30, 0.1], M.grass);
  soloBox('FrontPaving', 'Site', [p.envX + 5, cy, 0.005], [4, 9, 0.01], M.paving);
  soloBox('Driveway',    'Site', [p.envX + 8, cy, 0], [4, 6, 0.01], M.gravel);
  soloBox('Mountain_W',  'Site', [-25, cy, 8], [10, 30, 16], M.mountain);
  soloBox('Mountain_SW', 'Site', [-30, -5, 6], [8, 15, 12], M.mountain);
  soloBox('Mountain_NW', 'Site', [-30, p.envY + 5, 7], [8, 15, 14], M.mountain);

  // === FOUNDATION (v6.2 — plinth raised to 600 mm, FFL = +0.60 m) ===
  // Slab top sits at FFL. Slab thickness 0.10 → slab centre Z = FFL - 0.05.
  const slabTopZ = FFL;            // top of slab = FFL
  const slabCenterZ = FFL - 0.05;  // slab is 100 mm thick
  const plinthBotZ = 0.05;         // 5 cm above grade
  const plinthCenterZ = (FFL + plinthBotZ) / 2;
  const plinthH = FFL - plinthBotZ;
  soloBox('FloorSlab', 'Foundation', [cx, cy, slabCenterZ], [p.envX + 0.2, p.envY + 0.2, 0.10], M.floor);
  soloBox('Plinth_S',  'Foundation', [cx, -0.075, plinthCenterZ], [p.envX + 0.3, 0.05, plinthH], M.plinth);
  soloBox('Plinth_N',  'Foundation', [cx, p.envY + 0.075, plinthCenterZ], [p.envX + 0.3, 0.05, plinthH], M.plinth);
  soloBox('Plinth_W',  'Foundation', [-0.075, cy, plinthCenterZ], [0.05, p.envY + 0.2, plinthH], M.plinth);
  soloBox('Plinth_E',  'Foundation', [p.envX + 0.075, cy, plinthCenterZ], [0.05, p.envY + 0.2, plinthH], M.plinth);
  // Wet floor overlays — Bath at (6-8, 0-2), WC at (8-9.5, 0-2)
  const wetTopZ = FFL + 0.0025;
  soloBox('FloorTile_Bath', 'Foundation', [7.0,  1.0, wetTopZ], [1.825, 1.825, 0.005], M.wet);
  soloBox('FloorTile_WC',   'Foundation', [8.75, 1.0, wetTopZ], [1.325, 1.825, 0.005], M.wet);

  // === STRUCTURAL CONCRETE (Columns + Beams — visible in Construction view) ===
  buildStructure();

  // === WALL DEFINITIONS (metadata only — geometry rebuilt later from openings) ===
  const wallTop = p.wallTopZ, wallBot = p.wallBtmZ;
  const doorTop = wallBot + 2.1;

  // Reset and populate the global wallDefs[] (used by rebuildWallById on edits)
  wallDefs.length = 0;
  wallDefs.push(
    { id: 'EW_S_south_wall', layer: 'Walls_Exterior', axis: 'x', lineCoord: 0,         alongStart: -p.extWT/2, alongEnd: p.envX + p.extWT/2, thickness: p.extWT, mat: M.ext },
    { id: 'EW_N_north_wall', layer: 'Walls_Exterior', axis: 'x', lineCoord: p.envY,    alongStart: -p.extWT/2, alongEnd: p.envX + p.extWT/2, thickness: p.extWT, mat: M.ext },
    { id: 'EW_W_west_wall',  layer: 'Walls_Exterior', axis: 'y', lineCoord: 0,         alongStart: -p.extWT/2, alongEnd: p.envY + p.extWT/2, thickness: p.extWT, mat: M.ext },
    { id: 'EW_E_east_wall',  layer: 'Walls_Exterior', axis: 'y', lineCoord: p.envX,    alongStart: -p.extWT/2, alongEnd: p.envY + p.extWT/2, thickness: p.extWT, mat: M.ext },
    { id: 'P1_master_BR2',        layer: 'Walls_Interior', axis: 'y', lineCoord: 4,       alongStart: p.P2_y,  alongEnd: 11,        thickness: p.intWT, mat: M.int },
    { id: 'P2_bedrooms_dining',   layer: 'Walls_Interior', axis: 'x', lineCoord: p.P2_y,  alongStart: 0,       alongEnd: p.envX,    thickness: p.intWT, mat: M.int },
    { id: 'P3_dining_BR1',        layer: 'Walls_Interior', axis: 'y', lineCoord: 5.5,     alongStart: p.P4_y,  alongEnd: p.P2_y,    thickness: p.intWT, mat: M.int },
    { id: 'P4_BR1_diningEstrip',  layer: 'Walls_Interior', axis: 'x', lineCoord: p.P4_y,  alongStart: 5.5,     alongEnd: p.envX,    thickness: p.intWT, mat: M.int },
    { id: 'P5_diningEstrip_wet',  layer: 'Walls_Interior', axis: 'x', lineCoord: 2,       alongStart: 6,       alongEnd: p.envX,    thickness: p.intWT, mat: M.int },
    { id: 'P6_kitchen_bath',      layer: 'Walls_Interior', axis: 'y', lineCoord: 6,       alongStart: 0,       alongEnd: 2,         thickness: p.intWT, mat: M.int },
    { id: 'P7_bath_WC',           layer: 'Walls_Interior', axis: 'y', lineCoord: 8,       alongStart: 0,       alongEnd: 2,         thickness: p.intWT, mat: M.int },
  );

  // Create empty wall assemblies (segments added by rebuildWallById once openings exist)
  wallDefs.forEach(def => assembly(def.id, def.layer));

  // === DOORS — each is an assembly tagged with the wall it belongs to,
  //    so when it moves the wall opening follows automatically.
  function door(name, x, y, w, h, dirn, leafMat, wallId) {
    const a = assembly(name, 'Doors');
    Object.assign(a.userData, { wallId, openingW: w, openingSill: FFL, openingTop: FFL + h, openingDirn: dirn });
    const z = FFL + h / 2;
    const fw = 0.08, fd = 0.12;
    if (dirn === 'y') {
      partBox(a, '_FrL', [x - w/2 - fw/2, y, z], [fw, fd, h + fw], M.trim);
      partBox(a, '_FrR', [x + w/2 + fw/2, y, z], [fw, fd, h + fw], M.trim);
      partBox(a, '_FrT', [x, y, FFL + h + fw/2], [w + 2*fw, fd, fw], M.trim);
      partBox(a, '_Leaf', [x, y, z], [w - 0.02, 0.04, h - 0.02], leafMat);
      partBox(a, '_Knob', [x + w/2 - 0.1, y + 0.06, FFL + 1.0], [0.04, 0.03, 0.04], M.alu);
    } else {
      partBox(a, '_FrL', [x, y - w/2 - fw/2, z], [fd, fw, h + fw], M.trim);
      partBox(a, '_FrR', [x, y + w/2 + fw/2, z], [fd, fw, h + fw], M.trim);
      partBox(a, '_FrT', [x, y, FFL + h + fw/2], [fd, w + 2*fw, fw], M.trim);
      partBox(a, '_Leaf', [x, y, z], [0.04, w - 0.02, h - 0.02], leafMat);
      partBox(a, '_Knob', [x + 0.06, y + w/2 - 0.1, FFL + 1.0], [0.03, 0.04, 0.04], M.alu);
    }
    // Anchor to door bottom (FFL) so SZ scale stretches upward from the floor
    setAnchor(a, x, y, FFL);
    return a;
  }
  function slider(name, x, y, w, h, dirn, wallId) {
    const a = assembly(name, 'Doors');
    Object.assign(a.userData, { wallId, openingW: w, openingSill: FFL, openingTop: FFL + h, openingDirn: dirn });
    const z = FFL + h / 2;
    if (dirn === 'y') {
      partBox(a, '_TopRail', [x, y, FFL + h - 0.04], [w + 0.16, 0.10, 0.08], M.alu);
      partBox(a, '_BotRail', [x, y, FFL + 0.04],     [w + 0.16, 0.10, 0.08], M.alu);
      partBox(a, '_LJamb', [x - w/2 - 0.04, y, z], [0.08, 0.10, h], M.alu);
      partBox(a, '_RJamb', [x + w/2 + 0.04, y, z], [0.08, 0.10, h], M.alu);
      partBox(a, '_GlassL', [x - w/4, y, z], [w/2 - 0.05, 0.025, h - 0.10], M.glass);
      partBox(a, '_GlassR', [x + w/4, y, z], [w/2 - 0.05, 0.025, h - 0.10], M.glass);
      partBox(a, '_Handle', [x, y + 0.07, z], [0.20, 0.02, 0.03], M.alu);
    } else {
      partBox(a, '_TopRail', [x, y, FFL + h - 0.04], [0.10, w + 0.16, 0.08], M.alu);
      partBox(a, '_BotRail', [x, y, FFL + 0.04],     [0.10, w + 0.16, 0.08], M.alu);
      partBox(a, '_LJamb', [x, y - w/2 - 0.04, z], [0.10, 0.08, h], M.alu);
      partBox(a, '_RJamb', [x, y + w/2 + 0.04, z], [0.10, 0.08, h], M.alu);
      partBox(a, '_GlassL', [x, y - w/4, z], [0.025, w/2 - 0.05, h - 0.10], M.glass);
      partBox(a, '_GlassR', [x, y + w/4, z], [0.025, w/2 - 0.05, h - 0.10], M.glass);
      partBox(a, '_Handle', [x + 0.07, y, z], [0.02, 0.20, 0.03], M.alu);
    }
    setAnchor(a, x, y, FFL);
    return a;
  }

  // Door schedule (v6 — taller leaves 2.4 m for 3.5 m ceiling)
  door('D1_master_door',  2.0,   p.P2_y, 0.9, 2.4, 'y', M.wood, 'P2_bedrooms_dining');
  door('D2_BR2_door',     4.75,  p.P2_y, 0.9, 2.4, 'y', M.wood, 'P2_bedrooms_dining');
  door('D3_BR1_door',     5.5,   6.85,   0.9, 2.4, 'x', M.wood, 'P3_dining_BR1');     // v6: NW corner of BR1 (was 6.35)
  door('D4_bath_door',    7.0,   2.0,    0.8, 2.4, 'y', M.trim, 'P5_diningEstrip_wet');
  door('D5_WC_door',      8.75,  2.0,    0.8, 2.4, 'y', M.trim, 'P5_diningEstrip_wet');   // v6.2: bumped 700→800 for accessibility
  door('D7_service_door', p.envX, 3.0,   0.9, 2.4, 'x', M.wood, 'EW_E_east_wall');    // mid of widened dining-E strip
  slider('D6_main_entry', 4.0,   0,      1.5, 2.4, 'y',         'EW_S_south_wall');

  // === WINDOWS — also tagged with their wall ===
  // Renders a casement matching the reference frame diagram:
  //   - Outer chunky black aluminum frame
  //   - 2 full-height vertical mullions    → 3 columns
  //   - 2 full-WIDTH horizontal mullions   → 3 rows (top/bottom short, middle tall)
  //   - Top and bottom row = h × 0.25 each (= square panes alongside square columns)
  //   - Middle row = h × 0.50 (= tall rectangle panes)
  // Total = 9 panes (3 squares + 3 tall rects + 3 squares)
  //
  // `sillAFFL` is metres above FFL.
  function casement(name, x, y, w, h, sillAFFL, dirn, wallId) {
    const a = assembly(name, 'Windows');
    const sill = FFL + sillAFFL;        // absolute Z of bottom of window opening
    Object.assign(a.userData, { wallId, openingW: w, openingSill: sill, openingTop: sill + h, openingDirn: dirn });
    const z = sill + h / 2;
    // Chunkier frame — face 70 mm, depth 100 mm
    const fw = 0.07, fd = 0.10;
    // Internal mullions match outer frame thickness so the grid reads clearly
    const mw = fw, md = fd;
    // Vertical mullions: 2 for wide, 1 for medium, 0 for narrow → respective columns
    const nVert  = w >= 1.5 ? 2 : (w >= 1.0 ? 1 : 0);
    const vertOffs = [];
    for (let i = 1; i <= nVert; i++) vertOffs.push(-w/2 + (w * i) / (nVert + 1));
    // Horizontal mullions: ratios (fractions of h) where mullions sit. Top and
    // bottom rows are short (0.25 h), middle row is tall (0.5 h).
    let horizRatios = [];
    if (h >= 1.5)      horizRatios = [0.25, 0.75];
    else if (h >= 1.0) horizRatios = [0.5];
    const horizZs = horizRatios.map(r => sill + h * r);

    if (dirn === 'y') {
      // Window in N/S wall — width spans X
      partBox(a, '_FrT', [x, y, sill + h + fw/2], [w + 2*fw, fd, fw], M.winFrame);
      partBox(a, '_FrB', [x, y, sill - fw/2],     [w + 2*fw, fd, fw], M.winFrame);
      partBox(a, '_FrL', [x - w/2 - fw/2, y, z], [fw, fd, h], M.winFrame);
      partBox(a, '_FrR', [x + w/2 + fw/2, y, z], [fw, fd, h], M.winFrame);
      vertOffs.forEach((dx, i) => {
        partBox(a, `_VMull${i+1}`, [x + dx, y, z], [mw, md, h], M.winFrame);
      });
      horizZs.forEach((zh, i) => {
        partBox(a, `_HMull${i+1}`, [x, y, zh], [w, md, mw], M.winFrame);
      });
      partBox(a, '_Glass', [x, y, z], [w - 0.05, 0.025, h - 0.05], M.glass);
      partBox(a, '_Sill', [x, y - 0.06, sill - 0.06], [w + 0.20, 0.22, 0.06], M.plinth);
    } else {
      // Window in W/E wall — width spans Y
      partBox(a, '_FrT', [x, y, sill + h + fw/2], [fd, w + 2*fw, fw], M.winFrame);
      partBox(a, '_FrB', [x, y, sill - fw/2],     [fd, w + 2*fw, fw], M.winFrame);
      partBox(a, '_FrL', [x, y - w/2 - fw/2, z], [fd, fw, h], M.winFrame);
      partBox(a, '_FrR', [x, y + w/2 + fw/2, z], [fd, fw, h], M.winFrame);
      vertOffs.forEach((dy, i) => {
        partBox(a, `_VMull${i+1}`, [x, y + dy, z], [md, mw, h], M.winFrame);
      });
      horizZs.forEach((zh, i) => {
        partBox(a, `_HMull${i+1}`, [x, y, zh], [md, w, mw], M.winFrame);
      });
      partBox(a, '_Glass', [x, y, z], [0.025, w - 0.05, h - 0.05], M.glass);
      const off = x < cx ? -0.06 : 0.06;
      partBox(a, '_Sill', [x + off, y, sill - 0.06], [0.22, w + 0.20, 0.06], M.plinth);
    }
    setAnchor(a, x, y, sill);
    return a;
  }
  function louver(name, x, y, w, h, sillAFFL, dirn, wallId) {
    const a = assembly(name, 'Windows');
    const sill = FFL + sillAFFL;        // sillAFFL is metres above FFL
    Object.assign(a.userData, { wallId, openingW: w, openingSill: sill, openingTop: sill + h, openingDirn: dirn });
    const z = sill + h / 2;
    const fw = 0.04, fd = 0.06;
    if (dirn === 'y') {
      partBox(a, '_FrT', [x, y, sill + h + fw/2], [w + 2*fw, fd, fw], M.trim);
      partBox(a, '_FrB', [x, y, sill - fw/2],     [w + 2*fw, fd, fw], M.trim);
      partBox(a, '_FrL', [x - w/2 - fw/2, y, z], [fw, fd, h], M.trim);
      partBox(a, '_FrR', [x + w/2 + fw/2, y, z], [fw, fd, h], M.trim);
      const slatH = h / 4;
      for (let i = 0; i < 4; i++) {
        partBox(a, `_S${i}`, [x, y - 0.01, sill + slatH * i + slatH / 2], [w - 0.02, 0.04, slatH * 0.85], M.trim);
      }
      partBox(a, '_Sill', [x, y - 0.06, sill - 0.04], [w + 0.16, 0.16, 0.06], M.plinth);
    }
    setAnchor(a, x, y, sill);
    return a;
  }

  // Window schedule (v6 — ALL aboveground windows 2.5 x 2.6, sill 0.5 — uniform villa-style)
  casement('W1_master_W', 0,      9.25, 2.5, 2.6, 0.5, 'x', 'EW_W_west_wall');
  casement('W2_BR2_E',    p.envX, 9.25, 2.5, 2.6, 0.5, 'x', 'EW_E_east_wall');
  casement('W3_BR1_E',    p.envX, 5.75, 2.5, 2.6, 0.5, 'x', 'EW_E_east_wall');
  casement('W4_dining_W', 0,      5,    2.5, 2.6, 0.5, 'x', 'EW_W_west_wall');
  casement('W5_dining_W', 0,      2,    2.5, 2.6, 0.5, 'x', 'EW_W_west_wall');
  casement('W6_dining_S', 1.5,    0,    2.5, 2.6, 0.5, 'y', 'EW_S_south_wall');
  louver  ('W7_bath_S',   7.0,    0,    0.5, 0.6, 2.8, 'y', 'EW_S_south_wall');  // sill raised with new ceiling
  louver  ('W8_WC_S',     8.75,   0,    0.6, 0.6, 2.8, 'y', 'EW_S_south_wall');

  // === ROOF ===
  if (p.roofType === 'shed')      { buildShedRoof(); buildShedGables(); buildSolarPV(); }
  else if (p.roofType === 'flat') buildFlatRoof();
  else                            buildHipRoof();

  // === CEILINGS (v6 — flat at +3.95 for habitable rooms, +3.35 for wet)
  // Bedroom strip (master + BR2): y=P2_y..11 (3.5 m N-S in v6)
  const brDepth = 11 - p.P2_y;
  const brCy = (p.P2_y + 11) / 2;
  soloBox('Ceil_Bedrooms',  'Ceilings', [cx, brCy, 3.95], [p.envX, brDepth, 0.04], M.int);
  // BR1: x=5.5..9.5, y=P4_y..P2_y
  const br1y = (p.P4_y + p.P2_y) / 2;
  const br1h = p.P2_y - p.P4_y;
  soloBox('Ceil_BR1',       'Ceilings', [7.5, br1y, 3.95], [4.0, br1h, 0.04], M.int);
  // Dining-E strip: x=6..9.5, y=2..P4_y
  const stripY = (2 + p.P4_y) / 2;
  const stripH = p.P4_y - 2;
  soloBox('Ceil_DiningEstrip','Ceilings', [7.75, stripY, 3.95], [3.5, stripH, 0.04], M.int);
  // Bath (2×2) and WC (1.5×2) — flat at +3.35
  soloBox('Ceil_Bath',      'Ceilings', [7.0, 1.0, 3.35], [1.825, 1.825, 0.04], M.int);
  soloBox('Ceil_WC',        'Ceilings', [8.75, 1.0, 3.35], [1.325, 1.825, 0.04], M.int);
  // Dining ceiling — vaulted under shed slope (visible in 'shed' mode); flat in 'flat' mode
  if (params.roofType === 'shed') buildShedVault();
  else if (params.roofType === 'hip') buildVault();
  else soloBox('Ceil_Dining', 'Ceilings', [cx, p.P2_y/2, 3.95], [p.envX, p.P2_y, 0.04], M.int);

  // === TRIM ===
  soloBox('Beam_S', 'Trim_Eaves', [cx, 0,        p.wallTopZ + 0.02], [p.envX + 0.2, 0.25, 0.04], M.trim);
  soloBox('Beam_N', 'Trim_Eaves', [cx, p.envY,   p.wallTopZ + 0.02], [p.envX + 0.2, 0.25, 0.04], M.trim);
  soloBox('Beam_W', 'Trim_Eaves', [0, cy,        p.wallTopZ + 0.02], [0.25, p.envY + 0.2, 0.04], M.trim);
  soloBox('Beam_E', 'Trim_Eaves', [p.envX, cy,   p.wallTopZ + 0.02], [0.25, p.envY + 0.2, 0.04], M.trim);

  buildFurniture();

  // Now that all openings exist, generate wall segments around them.
  rebuildAllWalls();
}

// === STRUCTURE — 9 RC columns + ring beam + tie beam over P2 + door/window lintels ===
// Visible in both views, but stylistically lit (orange-warm RC tone) so they
// stand out against the white walls in Construction mode. Walls hide them
// in Finished mode by being visually dominant; toggling Construction view
// hides walls/finishes so the column grid + beams are clearly readable.
function buildStructure() {
  const p = params;
  const FFL = p.wallBtmZ;
  // Columns top into the ring beam (which sits at top of N wall in our shed roof
  // — i.e., at +wallTopZ). Column extends from grade (slightly above grade) up
  // through the ring beam.
  const colBot = 0.05;                     // just above plinth top
  const colTop = p.wallTopZ + 0.05;        // ~5 cm proud of ring beam top
  const colSec = 0.25;                     // 250 × 250 RC
  // 11 columns (v6.1 — added C10 + C11 after structural review caught two
  // unsupported spans in the original 9-column layout).
  const cols = [
    { id: 'C1',  x: 0.10,           y: 0.10           },
    { id: 'C2',  x: p.envX - 0.10,  y: 0.10           },
    { id: 'C3',  x: 0.10,           y: p.envY - 0.10  },
    { id: 'C4',  x: p.envX - 0.10,  y: p.envY - 0.10  },
    { id: 'C5',  x: 4.75,           y: 0.10           },
    { id: 'C6',  x: 4.75,           y: p.envY - 0.10  },
    { id: 'C7',  x: 0.10,           y: 3.50           },                 // W between mountain windows
    { id: 'C8',  x: 0.10,           y: p.P2_y         },                 // W at P2 tie-in
    { id: 'C9',  x: p.envX - 0.10,  y: p.P2_y         },                 // E at P2 tie-in
    { id: 'C10', x: p.envX - 0.10,  y: 4.00, isNew: true },              // NEW E mid-pier (between D7 + W3)
    { id: 'C11', x: 4.75,           y: p.P2_y, isNew: true },            // NEW P2 tie beam mid-span
  ];
  cols.forEach(c => {
    const a = assembly(`Column_${c.id}`, 'Columns');
    partBox(a, '_shaft', [c.x, c.y, (colBot + colTop) / 2], [colSec, colSec, colTop - colBot], M.rcCol);
    setAnchor(a, c.x, c.y, FFL);
    // Label sprite — placed at top of column, only shown in Construction view
    const label = makeTextSprite(c.id, 0.55);
    label.position.set(c.x, c.y, colTop + 0.7);
    label.userData.isAnnotation = true;
    layers['Construction_Annotations'].add(label);
  });

  // Ring beam — perimeter, 250 × 400, top at wallTopZ
  const ringBeamTop = p.wallTopZ;
  const ringBeamBot = p.wallTopZ - 0.40;
  const ringBeamSec = 0.25;
  const a = assembly('Ring_beam', 'Beams');
  // Four perimeter segments (sit just inside the wall outer face)
  partBox(a, '_S', [p.envX/2, p.extWT/2, (ringBeamTop + ringBeamBot) / 2], [p.envX, ringBeamSec, ringBeamTop - ringBeamBot], M.rcBeam);
  partBox(a, '_N', [p.envX/2, p.envY - p.extWT/2, (ringBeamTop + ringBeamBot) / 2], [p.envX, ringBeamSec, ringBeamTop - ringBeamBot], M.rcBeam);
  partBox(a, '_W', [p.extWT/2, p.envY/2, (ringBeamTop + ringBeamBot) / 2], [ringBeamSec, p.envY - 2*p.extWT, ringBeamTop - ringBeamBot], M.rcBeam);
  partBox(a, '_E', [p.envX - p.extWT/2, p.envY/2, (ringBeamTop + ringBeamBot) / 2], [ringBeamSec, p.envY - 2*p.extWT, ringBeamTop - ringBeamBot], M.rcBeam);

  // Tie beam over P2 (long bedroom-row partition)
  const tieBot = p.wallTopZ - 0.30;
  const tieTop = p.wallTopZ;
  const tie = assembly('Tie_beam_P2', 'Beams');
  partBox(tie, '_main', [p.envX/2, p.P2_y, (tieTop + tieBot) / 2], [p.envX, 0.20, tieTop - tieBot], M.rcBeam);

  // Lintels over each opening (compact RC bands above doors + windows)
  buildLintels();

  // === BEAM + LINTEL LABELS (Construction view only) ===
  // Ring beam labels — one near each side so it's readable from any orbit
  const ringLabelZ = p.wallTopZ + 0.25;
  ['Ring beam', 'Ring beam'].forEach((txt, i) => {
    const lbl = makeTextSprite(txt, 1.6, '#cfe7f0');
    lbl.position.set(i === 0 ? 1.5 : p.envX - 1.5, i === 0 ? -0.4 : p.envY + 0.4, ringLabelZ);
    layers['Construction_Annotations'].add(lbl);
  });
  const tieLbl = makeTextSprite('Tie beam (P2)', 1.5, '#ffd6a0');
  tieLbl.position.set(p.envX / 2, p.P2_y, p.wallTopZ + 0.20);
  layers['Construction_Annotations'].add(tieLbl);

  // === GHOST WALL OUTLINES (faint wireframe so lintels visually connect to openings) ===
  buildGhostWalls();
}

// Wireframe outlines of every wall + opening so the structural beams/lintels
// have visual context in Construction view (without hiding them).
function buildGhostWalls() {
  const p = params;
  const wallTop = p.wallTopZ;
  const wallBot = p.wallBtmZ;
  const ghostMat = new THREE.LineBasicMaterial({
    color: 0x9aa4b0, transparent: true, opacity: 0.35, depthTest: true,
  });
  const a = assembly('Ghost_walls_outline', 'Construction_Annotations');
  function rectFrame(name, cx, cy, cz, sx, sy, sz) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    const edges = new THREE.EdgesGeometry(g);
    const line = new THREE.LineSegments(edges, ghostMat);
    line.position.set(cx, cy, cz);
    line.name = name;
    a.add(line);
    g.dispose();
  }
  // Exterior walls
  const ewT = p.extWT, eh = wallTop - wallBot, ecz = (wallTop + wallBot) / 2;
  rectFrame('ghost_S', p.envX/2, 0,        ecz, p.envX + ewT, ewT, eh);
  rectFrame('ghost_N', p.envX/2, p.envY,   ecz, p.envX + ewT, ewT, eh);
  rectFrame('ghost_W', 0,        p.envY/2, ecz, ewT, p.envY + ewT, eh);
  rectFrame('ghost_E', p.envX,   p.envY/2, ecz, ewT, p.envY + ewT, eh);
  // Interior partitions (P1–P7)
  const iwT = p.intWT;
  rectFrame('ghost_P1', 4,        (p.P2_y + 11)/2, ecz, iwT, 11 - p.P2_y, eh);
  rectFrame('ghost_P2', p.envX/2, p.P2_y,          ecz, p.envX, iwT, eh);
  rectFrame('ghost_P3', 5.5,      (p.P4_y + p.P2_y)/2, ecz, iwT, p.P2_y - p.P4_y, eh);
  rectFrame('ghost_P4', (5.5 + p.envX)/2, p.P4_y,  ecz, p.envX - 5.5, iwT, eh);
  rectFrame('ghost_P5', (6 + p.envX)/2, 2,         ecz, p.envX - 6, iwT, eh);
  rectFrame('ghost_P6', 6,        1,               ecz, iwT, 2, eh);
  rectFrame('ghost_P7', 8,        1,               ecz, iwT, 2, eh);
}

function buildLintels() {
  const p = params;
  const FFL = p.wallBtmZ;
  // Door lintels (200 × 250 above 2.4 m doors → top of lintel at FFL + 2.65)
  const doorLin = [
    { id: 'D1', x: 2.0,    y: p.P2_y, axis: 'y', w: 0.9 },
    { id: 'D2', x: 4.75,   y: p.P2_y, axis: 'y', w: 0.9 },
    { id: 'D3', x: 5.5,    y: 6.85,   axis: 'x', w: 0.9 },
    { id: 'D4', x: 7.0,    y: 2.0,    axis: 'y', w: 0.8 },
    { id: 'D5', x: 8.75,   y: 2.0,    axis: 'y', w: 0.8 },
    { id: 'D6', x: 4.0,    y: 0,      axis: 'y', w: 1.5 },
    { id: 'D7', x: p.envX, y: 3.0,    axis: 'x', w: 0.9 },
  ];
  doorLin.forEach(d => {
    const a = assembly(`Lintel_${d.id}`, 'Beams');
    const z = FFL + 2.4 + 0.125;
    if (d.axis === 'y') partBox(a, '_lin', [d.x, d.y, z], [d.w + 0.40, 0.20, 0.25], M.rcBeam);
    else                partBox(a, '_lin', [d.x, d.y, z], [0.20, d.w + 0.40, 0.25], M.rcBeam);
  });

  // Window lintels — uniform 2.5 × 2.6 casements (W1–W6) get 250 × 350 + steel.
  // W7/W8 get 150 × 200. Top of lintel = top of window opening + 0.25
  const winLin = [
    { id: 'W1', x: 0,       y: 9.25, axis: 'x', w: 2.5, h: 2.6, sill: 0.5, big: true },
    { id: 'W2', x: p.envX,  y: 9.25, axis: 'x', w: 2.5, h: 2.6, sill: 0.5, big: true },
    { id: 'W3', x: p.envX,  y: 5.75, axis: 'x', w: 2.5, h: 2.6, sill: 0.5, big: true },
    { id: 'W4', x: 0,       y: 5.0,  axis: 'x', w: 2.5, h: 2.6, sill: 0.5, big: true },
    { id: 'W5', x: 0,       y: 2.0,  axis: 'x', w: 2.5, h: 2.6, sill: 0.5, big: true },
    { id: 'W6', x: 1.5,     y: 0,    axis: 'y', w: 2.5, h: 2.6, sill: 0.5, big: true },
    { id: 'W7', x: 7.0,     y: 0,    axis: 'y', w: 0.5, h: 0.6, sill: 2.8, big: false },
    { id: 'W8', x: 8.75,    y: 0,    axis: 'y', w: 0.6, h: 0.6, sill: 2.8, big: false },
  ];
  winLin.forEach(wn => {
    const a = assembly(`Lintel_${wn.id}`, 'Beams');
    const linH = wn.big ? 0.35 : 0.20;
    const linDepth = wn.big ? 0.25 : 0.15;
    const linTop = FFL + wn.sill + wn.h + linH;
    const z = linTop - linH/2;
    if (wn.axis === 'y') partBox(a, '_lin', [wn.x, wn.y, z], [wn.w + 0.40, linDepth, linH], M.rcBeam);
    else                 partBox(a, '_lin', [wn.x, wn.y, z], [linDepth, wn.w + 0.40, linH], M.rcBeam);
  });
}

// Billboarded text sprite for Construction-view labels.
// Short text (C1, etc.) → yellow circle. Longer text → wider rounded pill.
function makeTextSprite(text, size = 0.5, bg = '#ffec64') {
  const canvas = document.createElement('canvas');
  const isShort = text.length <= 3;
  const w = isShort ? 256 : 768;
  const h = 256;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Pill background
  ctx.fillStyle = bg;
  if (isShort) {
    ctx.beginPath();
    ctx.arc(w/2, h/2, h/2 - 18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const r = 60;
    ctx.beginPath();
    ctx.moveTo(20 + r, 30);
    ctx.lineTo(w - 20 - r, 30);
    ctx.arcTo(w - 20, 30, w - 20, 30 + r, r);
    ctx.lineTo(w - 20, h - 30 - r);
    ctx.arcTo(w - 20, h - 30, w - 20 - r, h - 30, r);
    ctx.lineTo(20 + r, h - 30);
    ctx.arcTo(20, h - 30, 20, h - 30 - r, r);
    ctx.lineTo(20, 30 + r);
    ctx.arcTo(20, 30, 20 + r, 30, r);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#1a1d22';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#1a1d22';
  ctx.font = `bold ${isShort ? 130 : 100}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w/2, h/2 + 6);
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  // Width-aware scale so wide pills stay readable
  sprite.scale.set(size * (w / h), size, 1);
  sprite.name = `Label_${text}`;
  return sprite;
}

function buildFlatRoof() {
  const p = params;
  const ovh = p.ovh;
  const xMin = -ovh.w, xMax = p.envX + ovh.e;
  const yMin = -ovh.s, yMax = p.envY + ovh.n;
  const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
  const w = xMax - xMin, d = yMax - yMin;
  const baseZ = p.wallTopZ + 0.10;
  const slabT = 0.20;
  const parapetH = p.parapetH;
  const parapetT = 0.10;
  const a = assembly('Roof_main', 'Roof');
  partBox(a, '_slab', [cx, cy, baseZ + slabT/2], [w, d, slabT], M.roof);
  // perimeter parapet — capped on the slab so the roof looks finished
  const pTop = baseZ + slabT + parapetH / 2;
  partBox(a, '_parapet_S', [cx, yMin + parapetT/2, pTop], [w, parapetT, parapetH], M.ext);
  partBox(a, '_parapet_N', [cx, yMax - parapetT/2, pTop], [w, parapetT, parapetH], M.ext);
  partBox(a, '_parapet_W', [xMin + parapetT/2, cy, pTop], [parapetT, d - 2*parapetT, parapetH], M.ext);
  partBox(a, '_parapet_E', [xMax - parapetT/2, cy, pTop], [parapetT, d - 2*parapetT, parapetH], M.ext);
  // White cap on top of parapet (concrete coping)
  partBox(a, '_coping_S', [cx, yMin + parapetT/2, baseZ + slabT + parapetH + 0.025], [w + 0.04, parapetT + 0.04, 0.05], M.trim);
  partBox(a, '_coping_N', [cx, yMax - parapetT/2, baseZ + slabT + parapetH + 0.025], [w + 0.04, parapetT + 0.04, 0.05], M.trim);
  partBox(a, '_coping_W', [xMin + parapetT/2, cy, baseZ + slabT + parapetH + 0.025], [parapetT + 0.04, d - 2*parapetT + 0.04, 0.05], M.trim);
  partBox(a, '_coping_E', [xMax - parapetT/2, cy, baseZ + slabT + parapetH + 0.025], [parapetT + 0.04, d - 2*parapetT + 0.04, 0.05], M.trim);
  setAnchor(a, cx, cy, baseZ + slabT/2);
}

function buildHipRoof() {
  const p = params;
  const ovh = p.ovh;
  const eaveTop = p.wallTopZ + 0.10;
  const eaveBot = p.wallTopZ;
  const peakTop = p.peakZ + 0.10;
  const peakBot = p.peakZ;
  const rxW = p.ridgeXfromW;
  const rxE = p.envX - p.ridgeXfromE;
  const ry = p.ridgeY;

  const top = [
    [-ovh.w, -ovh.s, eaveTop],
    [p.envX + ovh.e, -ovh.s, eaveTop],
    [p.envX + ovh.e, p.envY + ovh.n, eaveTop],
    [-ovh.w, p.envY + ovh.n, eaveTop],
    [rxW, ry, peakTop],
    [rxE, ry, peakTop],
  ];
  const bot = [
    [-ovh.w, -ovh.s, eaveBot],
    [p.envX + ovh.e, -ovh.s, eaveBot],
    [p.envX + ovh.e, p.envY + ovh.n, eaveBot],
    [-ovh.w, p.envY + ovh.n, eaveBot],
    [rxW, ry, peakBot],
    [rxE, ry, peakBot],
  ];
  const topFaces = [[0,1,5,4],[2,3,4,5],[3,0,4],[1,2,5]];
  const botFaces = [[0,4,5,1],[2,5,4,3],[3,4,0],[1,5,2]];
  const edgeFaces = [[0,1],[1,2],[2,3],[3,0]];
  const verts = [], indices = [];
  top.forEach(v => verts.push(...v));
  bot.forEach(v => verts.push(...v));
  const offBot = top.length;
  const pushFace = (f, off=0) => {
    if (f.length === 3) indices.push(f[0]+off, f[1]+off, f[2]+off);
    else { indices.push(f[0]+off, f[1]+off, f[2]+off); indices.push(f[0]+off, f[2]+off, f[3]+off); }
  };
  topFaces.forEach(f => pushFace(f, 0));
  botFaces.forEach(f => pushFace(f, offBot));
  edgeFaces.forEach(([a,b]) => {
    indices.push(a, offBot+a, offBot+b);
    indices.push(a, offBot+b, b);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const a = assembly('Roof_main', 'Roof');
  const m = new THREE.Mesh(geo, M.roof);
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = 'Roof_main_shell';
  a.add(m);
  partBox(a, '_ridge_cap', [(rxW + rxE)/2, ry, peakTop + 0.04], [rxE - rxW + 0.2, 0.18, 0.08], M.roof);
}

// === SHED (mono-pitch) ROOF — single inclined plane, HIGH at S (over dining), LOW at N (over bedrooms) ===
function buildShedRoof() {
  const p = params;
  const ovh = p.ovh;
  const xMin = -ovh.w, xMax = p.envX + ovh.e;
  const yMin = -ovh.s, yMax = p.envY + ovh.n;
  // S = high, N = low. Slope is consistent across overhangs (negative dz/dy).
  const slope = (p.wallTopS - p.wallTopZ) / p.envY;        // ≈ 0.176 (10°)
  const zSlope = (y) => p.wallTopS - slope * y;            // bottom-of-roof at given y (peak at y=0)
  const t = p.roofThick;
  // 8 corner verts: 4 underside + 4 topside
  const v = [
    // underside (bottom face)
    [xMin, yMin, zSlope(yMin)],
    [xMax, yMin, zSlope(yMin)],
    [xMax, yMax, zSlope(yMax)],
    [xMin, yMax, zSlope(yMax)],
    // topside (offset perpendicular-ish; close enough at small angles to add t straight up)
    [xMin, yMin, zSlope(yMin) + t],
    [xMax, yMin, zSlope(yMin) + t],
    [xMax, yMax, zSlope(yMax) + t],
    [xMin, yMax, zSlope(yMax) + t],
  ];
  const idx = [
    // bottom (visible from below)
    0, 2, 1,  0, 3, 2,
    // top (visible from above)
    4, 5, 6,  4, 6, 7,
    // S edge
    0, 1, 5,  0, 5, 4,
    // N edge
    3, 7, 6,  3, 6, 2,
    // W edge
    0, 4, 7,  0, 7, 3,
    // E edge
    1, 2, 6,  1, 6, 5,
  ];
  const verts = [];
  v.forEach(p2 => verts.push(...p2));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const a = assembly('Roof_main', 'Roof');
  const m = new THREE.Mesh(geo, M.roof);
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = 'Roof_shed_shell';
  a.add(m);
  // Fascia at N eave (low edge — most visible from rear/garden side)
  partBox(a, '_fascia_N', [(xMin + xMax)/2, yMax + 0.02, zSlope(yMax) - 0.10], [xMax - xMin, 0.04, 0.20], M.trim);
}

// === GABLE WALLS — fill the gap between flat low wall tops and the sloping roof ===
// HIGH side is south (over dining), so the south gable is the rectangular tall one.
function buildShedGables() {
  const p = params;
  // South gable — rectangular wall above S wall, height = wallTopS - wallTopZ ≈ 1.94 m
  const sh = p.wallTopS - p.wallTopZ;
  const scz = (p.wallTopZ + p.wallTopS) / 2;
  soloBox('Gable_S', 'Walls_Exterior',
    [p.envX/2, 0, scz],
    [p.envX + p.extWT, p.extWT, sh],
    M.ext);
  // East + West gables — triangular wedge, peak at S (z = wallTopS), low at N (z = wallTopZ)
  function makeGableTri(xLine, name) {
    const verts = [
      xLine, 0,        p.wallTopS,    // top corner at S
      xLine, p.envY,   p.wallTopZ,    // bottom corner at N (no extra height needed — flat with N wall)
      xLine, 0,        p.wallTopZ,    // bottom corner at S (sits at low wall top, fills the wedge below ridge)
    ];
    const idx = [0, 1, 2,  0, 2, 1];   // both sides
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const wrap = assembly(name, 'Walls_Exterior');
    const m = new THREE.Mesh(geo, M.ext);
    m.name = name + '_face';
    wrap.add(m);
  }
  makeGableTri(0,        'Gable_W');
  makeGableTri(p.envX,   'Gable_E');
}

// === SOLAR PV ARRAY — full-roof carpet, lying flush along the shed slope ===
function buildSolarPV() {
  const p = params;
  // Same slope direction as the shed roof (HIGH at S, LOW at N)
  const slope = (p.wallTopS - p.wallTopZ) / p.envY;
  const zSlope = (y) => p.wallTopS - slope * y;
  const standoff = p.roofThick + 0.04;       // panel sits ~40 mm above roof skin
  const cols = p.pvCols;
  const rows = p.pvRows;
  const totalW = cols * p.pvPanelW;
  const totalH = rows * p.pvPanelH;
  const x0 = p.pvCenterX - totalW / 2;
  const y0 = p.pvCenterY - totalH / 2;
  // Shed roof tilts down toward +y (north), so panel faces face up + slightly N
  // (rotation about +x by -tilt to match dz/dy = -slope).
  const tilt = Math.atan(slope);
  const a = assembly('Solar_PV_array', 'Roof');
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      n++;
      const cx = x0 + c * p.pvPanelW + p.pvPanelW / 2;
      const cy = y0 + r * p.pvPanelH + p.pvPanelH / 2;
      const cz = zSlope(cy) + standoff;
      const panel = partBox(a, `_panel${n}`,
        [cx, cy, cz],
        [p.pvPanelW - 0.02, p.pvPanelH - 0.02, 0.035],
        M.pv);
      panel.rotation.x = -tilt;
    }
  }
  // Continuous mounting rails along E-W under each row of panels
  for (let r = 0; r < rows; r++) {
    const cy = y0 + r * p.pvPanelH + p.pvPanelH / 2;
    const cz = zSlope(cy) + standoff - 0.025;
    const rail = partBox(a, `_rail${r}`,
      [p.pvCenterX, cy, cz],
      [totalW + 0.12, 0.05, 0.035],
      M.alu);
    rail.rotation.x = -tilt;
  }
  setAnchor(a, p.pvCenterX, p.pvCenterY, zSlope(p.pvCenterY) + standoff);
}

// Dining vault for the SHED roof: peaks at S (over dining), drops linearly to BR row south wall (P2_y).
function buildShedVault() {
  const p = params;
  const slope = (p.wallTopS - p.wallTopZ) / p.envY;
  // Underside of roof drops 20 cm below the structural slope for finish + insulation
  const ZUNDER = (y) => p.wallTopS - slope * y - 0.20;
  // Dining main: x = 0..5.5, y = 0..P2_y (vaulted slope)
  const x1 = 0, x2 = 5.5;
  const y1 = 0, y2 = p.P2_y;
  const verts = [
    x1, y1, ZUNDER(y1),
    x2, y1, ZUNDER(y1),
    x2, y2, ZUNDER(y2),
    x1, y2, ZUNDER(y2),
  ];
  const idx = [0, 1, 2,  0, 2, 3];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const a = assembly('Ceil_Dining_Vault', 'Ceilings');
  const m = new THREE.Mesh(geo, M.batten);
  m.name = 'Ceil_Dining_Vault_face';
  a.add(m);
  // Dining-E strip already has flat ceiling. Above-strip portion (y=2..P4_y, x=5.5..envX) also vaults gently
  const x3 = 5.5, x4 = p.envX;
  const yA = 0, yB = p.P4_y;
  const verts2 = [
    x3, yA, ZUNDER(yA),
    x4, yA, ZUNDER(yA),
    x4, yB, ZUNDER(yB),
    x3, yB, ZUNDER(yB),
  ];
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.Float32BufferAttribute(verts2, 3));
  geo2.setIndex(idx);
  geo2.computeVertexNormals();
  const a2 = assembly('Ceil_DiningE_Vault', 'Ceilings');
  const m2 = new THREE.Mesh(geo2, M.batten);
  m2.name = 'Ceil_DiningE_Vault_face';
  a2.add(m2);
}

function buildVault() {
  // (Legacy) Hip-roof dining vault, kept for backward compat
  const peakV = 5.30, eaveV = 3.20;
  const xMin = 1.4, xMax = 5.5;   // constrained to ridge x-range so it stays below the hipped roof slopes
  function make(name, vs) {
    const verts = [];
    vs.forEach(v => verts.push(...v));
    const idx = [0, 1, 2, 0, 2, 3];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const a = assembly(name, 'Ceilings');
    const m = new THREE.Mesh(g, M.batten);
    m.name = name + '_face';
    a.add(m);
    return a;
  }
  make('Ceil_Vault_S', [[xMin, 0, eaveV], [xMax, 0, eaveV], [xMax, 5.5, peakV], [xMin, 5.5, peakV]]);
  const zN = peakV - 1.5 * ((peakV - eaveV) / 5.5);
  make('Ceil_Vault_N', [[xMin, 5.5, peakV], [xMax, 5.5, peakV], [xMax, 7, zN], [xMin, 7, zN]]);
}

// ========================================================================
// FURNITURE (prior 9.5×11 layout)
// ========================================================================
function buildFurniture() {
  const FFL = params.wallBtmZ;
  const p = params;

  function bed(name, cx, cy, headDir, layer) {
    const a = assembly(name, layer);
    const L = (headDir === 'north' || headDir === 'south') ? 1.6 : 2.0;
    const W = (headDir === 'north' || headDir === 'south') ? 2.0 : 1.6;
    partBox(a, '_frame',    [cx, cy, FFL + 0.18], [L + 0.05, W + 0.05, 0.30], M.wood);
    partBox(a, '_mattress', [cx, cy, FFL + 0.45], [L - 0.05, W - 0.05, 0.20], M.bedding);
    if (headDir === 'north') {
      partBox(a, '_headboard', [cx, cy + W/2 - 0.02, FFL + 0.55], [L + 0.05, 0.06, 1.10], M.wood);
      partBox(a, '_pillow1',   [cx - 0.35, cy + W/2 - 0.40, FFL + 0.59], [0.55, 0.30, 0.10], M.pillow);
      partBox(a, '_pillow2',   [cx + 0.35, cy + W/2 - 0.40, FFL + 0.59], [0.55, 0.30, 0.10], M.pillow);
      partBox(a, '_duvet',     [cx, cy - 0.30, FFL + 0.57], [L - 0.10, W - 0.7, 0.04], M.bedding);
    } else if (headDir === 'west') {
      partBox(a, '_headboard', [cx - L/2 + 0.02, cy, FFL + 0.55], [0.06, W + 0.05, 1.10], M.wood);
      partBox(a, '_pillow1',   [cx - L/2 + 0.40, cy - 0.35, FFL + 0.59], [0.30, 0.55, 0.10], M.pillow);
      partBox(a, '_pillow2',   [cx - L/2 + 0.40, cy + 0.35, FFL + 0.59], [0.30, 0.55, 0.10], M.pillow);
      partBox(a, '_duvet',     [cx + 0.30, cy, FFL + 0.57], [L - 0.7, W - 0.10, 0.04], M.bedding);
    }
    setAnchor(a, cx, cy, FFL + 0.30);
    return a;
  }
  function nightstand(name, cx, cy, layer, w = 0.35, d = 0.40, h = 0.60) {
    return soloBox(name, layer, [cx, cy, FFL + h/2], [w, d, h], M.wood);
  }
  function wardrobe(name, cx, cy, layer, w = 2.2, d = 0.55, h = 2.2, axis = 'ew') {
    const sz = axis === 'ew' ? [w, d, h] : [d, w, h];
    return soloBox(name, layer, [cx, cy, FFL + h/2], sz, M.wood);
  }
  function dresser(name, cx, cy, layer, w = 0.5, d = 0.8, h = 1.0, axis = 'ew') {
    const sz = axis === 'ns' ? [w, d, h] : [d, w, h];
    return soloBox(name, layer, [cx, cy, FFL + h/2], sz, M.wood);
  }
  function roundChair(name, cx, cy, layer, r = 0.25) {
    const a = assembly(name, layer);
    partCyl(a, '_seat', [cx, cy, FFL + 0.42], r, 0.05, M.fabric);
    partCyl(a, '_back', [cx, cy, FFL + 0.65], r, 0.45, M.fabric);
    setAnchor(a, cx, cy, FFL + 0.45);
    return a;
  }
  function fan(name, cx, cy, mountZ = 2.8) {
    const a = assembly(name, 'Lighting_Fixtures');
    partCyl(a, '_body', [cx, cy, mountZ + 0.10], 0.10, 0.20, M.alu);
    for (let i = 0; i < 5; i++) {
      const ang = i * (2 * Math.PI / 5);
      const bx = cx + 0.65 * Math.cos(ang);
      const by = cy + 0.65 * Math.sin(ang);
      const blade = partBox(a, `_blade${i}`, [bx, by, mountZ + 0.05], [1.20, 0.10, 0.02], M.wood);
      blade.rotation.z = ang;
    }
    setAnchor(a, cx, cy, mountZ + 0.10);
    return a;
  }
  function chair(name, cx, cy, facing, layer) {
    const a = assembly(name, layer);
    partBox(a, '_seat', [cx, cy, FFL + 0.45], [0.40, 0.45, 0.05], M.wood);
    if (facing === 'north') partBox(a, '_back', [cx, cy + 0.20, FFL + 0.70], [0.40, 0.04, 0.40], M.wood);
    if (facing === 'south') partBox(a, '_back', [cx, cy - 0.20, FFL + 0.70], [0.40, 0.04, 0.40], M.wood);
    setAnchor(a, cx, cy, FFL + 0.50);
    return a;
  }

  const P4y = params.P4_y;

  // === MASTER BD3 (v6 — 4 × 3.5, x=0-4, y=7.5-11) — wardrobe relocated to east wall
  bed('Master_bed', 2.0, 9.85, 'north', 'Furniture_Master');
  nightstand('Master_nightstand_L', 0.85, 10.65, 'Furniture_Master', 0.4, 0.4, 0.6);
  nightstand('Master_nightstand_R', 3.15, 10.65, 'Furniture_Master', 0.4, 0.4, 0.6);
  // Wardrobe along east wall (P1) — was on south wall blocking D1 in v5
  wardrobe('Master_wardrobe', 3.65, 8.475, 'Furniture_Master', 1.8, 0.55, 2.4, 'ns');
  roundChair('Master_reading_chair', 0.5, 9.5, 'Furniture_Master');
  fan('Master_ceiling_fan', 2.0, 9.25);

  // === BR2 (v6 — 5.5 × 3.5, x=4-9.5, y=7.5-11)
  bed('BR2_bed', 6.75, 9.85, 'north', 'Furniture_BR2');
  nightstand('BR2_nightstand_L', 5.675, 10.65, 'Furniture_BR2', 0.4, 0.4, 0.6);
  nightstand('BR2_nightstand_R', 7.85, 10.65, 'Furniture_BR2', 0.4, 0.4, 0.6);
  wardrobe('BR2_wardrobe', 6.6, 7.85, 'Furniture_BR2', 2.2, 0.55, 2.4, 'ew');
  soloBox('BR2_desk', 'Furniture_BR2', [9.075, 9.0, FFL + 0.375], [0.5, 0.8, 0.75], M.wood);
  roundChair('BR2_desk_chair', 9.0, 8.45, 'Furniture_BR2');
  roundChair('BR2_sitting_chair', 4.5, 9.5, 'Furniture_BR2');
  fan('BR2_ceiling_fan', 6.75, 9.25);

  // === BR1 (v6 — 4 × 3.5, x=5.5-9.5, y=4-7.5), bed E-W head W
  const br1cy = (P4y + p.P2_y) / 2;
  bed('BR1_bed', 6.575, 4.875, 'west', 'Furniture_BR1');
  nightstand('BR1_nightstand', 7.875, 4.875, 'Furniture_BR1', 0.35, 0.35, 0.6);
  wardrobe('BR1_wardrobe', 7.6, 7.15, 'Furniture_BR1', 2.2, 0.55, 2.4, 'ew');   // along N wall, clear of D3
  dresser('BR1_dresser', 9.175, 6.4, 'Furniture_BR1', 0.5, 1.0, 1.0, 'ns');     // E wall
  fan('BR1_ceiling_fan', 7.5, br1cy);

  // === DINING (L-shape main rect x=0..5.5, y=0..7)
  const dt = assembly('Dining_table', 'Furniture_Dining');
  partBox(dt, '_top', [2.4, 3.1, FFL + 0.74], [2.40, 1.00, 0.04], M.wood);
  for (const [i, [ox, oy]] of [[-1.10, -0.45], [1.10, -0.45], [-1.10, 0.45], [1.10, 0.45]].entries()) {
    partBox(dt, `_leg${i}`, [2.4 + ox, 3.1 + oy, FFL + 0.36], [0.06, 0.06, 0.72], M.wood);
  }
  setAnchor(dt, 2.4, 3.1, FFL + 0.4);
  for (let i = 0; i < 3; i++) {
    const x = [1.6, 2.4, 3.2][i];
    chair(`Dining_chair_N${i+1}`, x, 3.85, 'south', 'Furniture_Dining');
    chair(`Dining_chair_S${i+1}`, x, 2.35, 'north', 'Furniture_Dining');
  }
  soloBox('Dining_sideboard', 'Furniture_Dining', [0.4, 3.5, FFL + 0.45], [0.6, 1.6, 0.90], M.wood);
  soloBox('Dining_rug', 'Furniture_Dining', [2.4, 3.0, FFL + 0.005], [2.8, 1.8, 0.005], M.rug);
  const pen = assembly('Dining_pendant', 'Lighting_Fixtures');
  partCyl(pen, '_cord', [2.4, 3.1, FFL + 2.30], 0.01, 0.80, M.metal);
  partBox(pen, '_lamp', [2.4, 3.1, FFL + 1.85], [0.70, 0.30, 0.20], M.metal);
  setAnchor(pen, 2.4, 3.1, FFL + 2.0);
  fan('Dining_ceiling_fan', 4.0, 5.5);

  // === KITCHEN (against bath W wall = P6 inner face x=5.925)
  const kit = assembly('Kitchen_counter', 'Furniture_Kitchen');
  partBox(kit, '_base', [5.65, 1.0, FFL + 0.425], [0.6, 1.8, 0.85], M.wood);
  partBox(kit, '_top',  [5.65, 1.0, FFL + 0.86], [0.62, 1.82, 0.04], M.counter);
  partBox(kit, '_sink', [5.65, 0.25, FFL + 0.83], [0.50, 0.40, 0.04], M.chrome);
  partBox(kit, '_stove',[5.65, 1.70, FFL + 0.88], [0.55, 0.55, 0.02], M.alu);
  setAnchor(kit, 5.65, 1.0, FFL + 0.5);
  soloBox('Kitchen_range_hood', 'Furniture_Kitchen', [5.65, 1.70, FFL + 1.95], [0.62, 0.42, 0.40], M.alu);
  soloBox('Kitchen_upper_cabinets', 'Furniture_Kitchen', [5.50, 1.0, FFL + 1.85], [0.35, 1.80, 0.70], M.wood);
  // Fridge moved out of D6 entry path — now west of kitchen counter (counter at x=5.65)
  soloBox('Kitchen_fridge', 'Furniture_Kitchen', [5.05, 0.45, FFL + 0.85], [0.6, 0.6, 1.70], M.alu);

  // === BATH (2×2, x=6-8, y=0-2) — shower NE corner
  const sh = assembly('Bath_shower', 'Furniture_Bath');
  partBox(sh, '_tray', [7.57, 0.63, FFL + 0.025], [0.78, 0.78, 0.05], M.wt);
  partBox(sh, '_glassN', [7.57, 1.02, FFL + 1.05], [0.78, 0.01, 2.10], M.glass);
  partBox(sh, '_glassW', [7.18, 0.63, FFL + 1.05], [0.01, 0.78, 2.10], M.glass);
  setAnchor(sh, 7.57, 0.63, FFL + 1.0);
  soloBox('Bath_sink', 'Furniture_Bath', [6.275, 0.4, FFL + 0.85], [0.40, 0.50, 0.18], M.porc);
  soloBox('Bath_mirror', 'Furniture_Bath', [6.10, 0.4, FFL + 1.65], [0.06, 0.50, 0.70], M.alu);

  // === WC (1.5×2, x=8-9.5, y=0-2)
  const toilet = assembly('WC_toilet', 'Furniture_WC');
  partBox(toilet, '_tank', [8.75, 0.30, FFL + 0.55], [0.40, 0.20, 0.50], M.porc);
  partBox(toilet, '_bowl', [8.75, 0.65, FFL + 0.20], [0.40, 0.50, 0.40], M.porc);
  partBox(toilet, '_seat', [8.75, 0.65, FFL + 0.41], [0.36, 0.46, 0.03], M.porc);
  setAnchor(toilet, 8.75, 0.5, FFL + 0.4);
  soloBox('WC_basin', 'Furniture_WC', [9.275, 1.475, FFL + 0.85], [0.25, 0.35, 0.15], M.porc);
}

buildVilla();

// ========================================================================
// SELECTION + UI
// ========================================================================
const transform = new TransformControls(camera, renderer.domElement);
transform.addEventListener('dragging-changed', e => {
  orbit.enabled = !e.value;
  if (!e.value && selected) {
    // Drag end → if the moved object is a door/window linked to a wall:
    //   1. Snap it back onto the wall plane (perpendicular axis = wall's lineCoord)
    //   2. Clamp the along-axis position so the opening stays inside the wall ends
    //   3. Rebuild the wall around the new opening position
    if (selected.userData?.wallId) {
      const def = wallDefs.find(d => d.id === selected.userData.wallId);
      if (def) {
        // Snap to wall plane (lock perpendicular)
        if (def.axis === 'x') selected.position.y = def.lineCoord;
        else                  selected.position.x = def.lineCoord;
        // Clamp along the wall — use SCALED opening width
        const scaleAlong = def.axis === 'x' ? selected.scale.x : selected.scale.y;
        const halfW = ((selected.userData.openingW || 0.9) * Math.abs(scaleAlong)) / 2;
        const minAlong = def.alongStart + halfW + 0.05;
        const maxAlong = def.alongEnd   - halfW - 0.05;
        const along = def.axis === 'x' ? selected.position.x : selected.position.y;
        const clamped = Math.max(minAlong, Math.min(maxAlong, along));
        if (def.axis === 'x') selected.position.x = clamped;
        else                  selected.position.y = clamped;
        if (selectionHelper) selectionHelper.update();
      }
      rebuildWallById(selected.userData.wallId);
    }
    refreshSelectionFields();
  }
});
transform.addEventListener('change', () => {
  if (selected) {
    refreshSelectionFields();
    if (selectionHelper) selectionHelper.update();
  }
});
scene.add(transform);

let selected = null;
let selectionHelper = null;

function findAssembly(obj) {
  let cur = obj;
  while (cur && !cur.userData?.isAssembly) cur = cur.parent;
  return cur;
}

function setSelected(obj) {
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.geometry.dispose();
    selectionHelper.material.dispose();
    selectionHelper = null;
  }
  selected = obj;
  // Reset gizmo to all 3 axes (clears any X/Y/Z lock from previous selection)
  transform.showX = transform.showY = transform.showZ = true;
  // Mode buttons: refresh "all axes" indicator if you added any (none right now)
  if (obj) {
    selectionHelper = new THREE.BoxHelper(obj, 0x00aaff);
    selectionHelper.material.depthTest = false;
    selectionHelper.renderOrder = 999;
    scene.add(selectionHelper);
    transform.attach(obj);
    showSelection(obj);
    document.querySelectorAll('.tree-item').forEach(r => r.classList.toggle('active', r.dataset.name === obj.name));
  } else {
    transform.detach();
    document.getElementById('selection').innerHTML = '<em class="muted">Click any object to select</em>';
    document.querySelectorAll('.tree-item').forEach(r => r.classList.remove('active'));
  }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function allMeshes() {
  const out = [];
  Object.values(layers).forEach(g => {
    if (!g.visible) return;
    g.traverse(o => { if (o.isMesh) out.push(o); });
  });
  return out;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  let moved = false;
  const startX = e.clientX, startY = e.clientY;
  const onMove = (m) => { if (Math.abs(m.clientX - startX) + Math.abs(m.clientY - startY) > 4) moved = true; };
  const onUp = (u) => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (moved) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((u.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((u.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(allMeshes(), false);
    if (hits.length > 0) {
      const a = findAssembly(hits[0].object);
      if (a) setSelected(a);
    } else {
      setSelected(null);
    }
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
});

const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
document.body.appendChild(tooltip);

renderer.domElement.addEventListener('pointermove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(allMeshes(), false);
  if (hits.length > 0) {
    const a = findAssembly(hits[0].object);
    if (a) {
      tooltip.textContent = `${a.name}  ·  ${a.userData.layer}`;
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top  = (e.clientY + 12) + 'px';
      tooltip.style.display = 'block';
      return;
    }
  }
  tooltip.style.display = 'none';
});
renderer.domElement.addEventListener('pointerleave', () => { tooltip.style.display = 'none'; });

function deleteAssembly(g) {
  if (selected === g) setSelected(null);
  g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  if (g.parent) g.parent.remove(g);
  buildSidebar();
}

function buildSidebar() {
  const layersEl = document.getElementById('layers');
  // Remember which layers were expanded so refresh doesn't collapse them
  const wasOpen = new Set();
  layersEl.querySelectorAll('.layer-block').forEach(blk => {
    const tree = blk.querySelector('.tree');
    if (tree && tree.style.display === 'block') {
      wasOpen.add(blk.querySelector('.lname').textContent);
    }
  });
  layersEl.innerHTML = '';
  LAYER_NAMES.forEach((name) => {
    const group = layers[name];
    const wrap = document.createElement('div');
    wrap.className = 'layer-block';

    const hdr = document.createElement('div');
    hdr.className = 'layer-row';
    hdr.innerHTML = `
      <input type="checkbox" ${group.visible ? 'checked' : ''} data-layer="${name}">
      <span class="caret">${wasOpen.has(name) ? '▼' : '▶'}</span>
      <span class="lname">${name}</span>
      <span class="count">${group.children.length}</span>
    `;
    wrap.appendChild(hdr);

    const tree = document.createElement('div');
    tree.className = 'tree';
    tree.style.display = wasOpen.has(name) ? 'block' : 'none';
    wrap.appendChild(tree);

    group.children.forEach(child => {
      if (!child.userData?.isAssembly) return;
      const row = document.createElement('div');
      row.className = 'tree-item';
      row.dataset.name = child.name;
      row.innerHTML = `
        <button class="ti-vis ${child.visible ? '' : 'hidden'}" title="Toggle visibility">${child.visible ? '●' : '○'}</button>
        <span class="ti-name">${child.name}</span>
        <button class="ti-del" title="Delete">×</button>
      `;
      row.querySelector('.ti-name').addEventListener('click', () => setSelected(child));
      row.querySelector('.ti-vis').addEventListener('click', e => {
        e.stopPropagation();
        child.visible = !child.visible;
        const btn = e.currentTarget;
        btn.textContent = child.visible ? '●' : '○';
        btn.classList.toggle('hidden', !child.visible);
        if (selected === child && !child.visible) setSelected(null);
        if (child.userData?.wallId) rebuildWallById(child.userData.wallId);  // wall follows
        if (typeof recordChange === 'function') recordChange();
      });
      row.querySelector('.ti-del').addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm(`Delete "${child.name}"?`)) return;
        const wallId = child.userData?.wallId;
        deleteAssembly(child);
        if (wallId) rebuildWallById(wallId);
        if (typeof recordChange === 'function') recordChange();
      });
      tree.appendChild(row);
    });

    hdr.querySelector('.caret').addEventListener('click', (e) => {
      e.stopPropagation();
      const open = tree.style.display === 'block';
      tree.style.display = open ? 'none' : 'block';
      hdr.querySelector('.caret').textContent = open ? '▶' : '▼';
    });
    hdr.querySelector('.lname').addEventListener('click', () => {
      const open = tree.style.display === 'block';
      tree.style.display = open ? 'none' : 'block';
      hdr.querySelector('.caret').textContent = open ? '▶' : '▼';
    });
    hdr.querySelector('input').addEventListener('change', (e) => {
      group.visible = e.target.checked;
      if (selected && !e.target.checked && findLayerOf(selected) === name) setSelected(null);
      if (typeof recordChange === 'function') recordChange();
    });

    layersEl.appendChild(wrap);
  });
}

function findLayerOf(obj) {
  let cur = obj;
  while (cur) {
    if (LAYER_NAMES.includes(cur.name)) return cur.name;
    cur = cur.parent;
  }
  return null;
}
buildSidebar();

// === VIEW MODE TABS — Finished / Construction ===
// Construction mode hides walls/roof/finishes/furniture and shows the
// foundation, columns, beams, and 3D column-ID labels. Finished mode is
// the full villa with everything visible.
const VIEW_PRESETS = {
  finished: {
    show: ['Site', 'Foundation', 'Walls_Exterior', 'Walls_Interior', 'Trim_Eaves',
           'Roof', 'Ceilings', 'Doors', 'Windows',
           'Furniture_Master', 'Furniture_BR2', 'Furniture_BR1',
           'Furniture_Dining', 'Furniture_Kitchen', 'Furniture_Bath', 'Furniture_WC',
           'Lighting_Fixtures'],
    hide: ['Columns', 'Beams', 'Construction_Annotations'],
    hint: 'Finished: full villa with roof + finishes + furniture.',
  },
  construction: {
    show: ['Site', 'Foundation', 'Columns', 'Beams', 'Construction_Annotations'],
    hide: ['Walls_Exterior', 'Walls_Interior', 'Trim_Eaves',
           'Roof', 'Ceilings', 'Doors', 'Windows',
           'Furniture_Master', 'Furniture_BR2', 'Furniture_BR1',
           'Furniture_Dining', 'Furniture_Kitchen', 'Furniture_Bath', 'Furniture_WC',
           'Lighting_Fixtures'],
    hint: 'Construction view: vertical orange shafts = 11 RC columns (C1–C11; C10 + C11 added in v6.1 to fix two unsupported beam spans). Horizontal bars at the top = ring beam (perimeter). The single bar across the middle = tie beam over P2 (now with mid-column C11). Short bars above each opening = 15 lintels (7 doors + 6 large windows + 2 louvers). Faint grey wireframes show the wall outlines. Click Finished to switch back.',
  },
};
let currentView = 'finished';
function applyViewMode(mode) {
  const preset = VIEW_PRESETS[mode];
  if (!preset) return;
  currentView = mode;
  preset.show.forEach(n => { if (layers[n]) layers[n].visible = true; });
  preset.hide.forEach(n => { if (layers[n]) layers[n].visible = false; });
  document.querySelectorAll('.view-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.view === mode);
  });
  const hintEl = document.getElementById('view-hint');
  if (hintEl) hintEl.textContent = preset.hint;
}
document.querySelectorAll('.view-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    applyViewMode(btn.dataset.view);
    buildSidebar();             // refresh layer-panel checkboxes
  });
});
applyViewMode('finished');

const camerasDiv = document.getElementById('cameras');
camerasDiv.innerHTML = '';
const camPresets = {
  'Aerial SW (golden hour)': { pos: [-12, -7, 7], target: [4.75, 5.5, 1.5] },
  'Aerial S (front)':         { pos: [4.75, -14, 12], target: [4.75, 5.5, 1] },
  'Aerial N (back)':          { pos: [4.75, 25, 12], target: [4.75, 5.5, 1] },
  'Aerial W (mountain side)': { pos: [-14, 5.5, 12], target: [4.75, 5.5, 1] },
  'Aerial E (front yard)':    { pos: [24, 5.5, 12], target: [4.75, 5.5, 1] },
  'Top-down':                 { pos: [4.75, 5.5, 22], target: [4.75, 5.5, 0] },
  'Cutaway SE':               { pos: [18, -8, 14], target: [4.75, 5.5, 0.5], hide: ['Roof', 'Ceilings', 'Trim_Eaves', 'Lighting_Fixtures'] },
  'Cutaway NW':               { pos: [-10, 18, 12], target: [4.75, 5, 1], hide: ['Roof', 'Ceilings', 'Trim_Eaves', 'Lighting_Fixtures'] },
};
Object.entries(camPresets).forEach(([label, c]) => {
  const row = document.createElement('div');
  row.className = 'camera-row';
  row.innerHTML = `<button class="cam-btn">${label}</button>`;
  row.querySelector('button').addEventListener('click', () => {
    camera.position.set(...c.pos);
    orbit.target.set(...c.target);
    orbit.update();
    document.querySelectorAll('input[data-layer]').forEach(cb => {
      const layerName = cb.dataset.layer;
      const shouldHide = c.hide && c.hide.includes(layerName);
      cb.checked = !shouldHide;
      layers[layerName].visible = !shouldHide;
    });
  });
  camerasDiv.appendChild(row);
});

document.querySelectorAll('button.mode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('button.mode').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    transform.setMode(btn.dataset.mode);
  });
});
document.getElementById('deselect').addEventListener('click', () => setSelected(null));

document.getElementById('envX').value = params.envX;
document.getElementById('envY').value = params.envY;
document.getElementById('wallTopZ').value = params.wallTopZ;
document.getElementById('peakZ').value = params.wallTopS;        // shed: HIGH side; legacy: hip-roof peak
document.getElementById('roofType').value = params.roofType;
document.getElementById('rebuild').addEventListener('click', () => {
  params.envX = parseFloat(document.getElementById('envX').value);
  params.envY = parseFloat(document.getElementById('envY').value);
  params.wallTopZ = parseFloat(document.getElementById('wallTopZ').value);
  // peakZ input now drives wallTopS (shed high side); also keep peakZ alias for hip-roof legacy
  const peakInput = parseFloat(document.getElementById('peakZ').value);
  params.wallTopS = peakInput;
  params.peakZ = peakInput;
  params.roofType = document.getElementById('roofType').value;
  setSelected(null);
  buildVilla();
  buildSidebar();
  if (typeof applyViewMode === 'function') applyViewMode(currentView);
  if (typeof recordChange === 'function') recordChange();
});

function showSelection(g) {
  const sel = document.getElementById('selection');
  sel.innerHTML = `
    <div class="name">${g.name}</div>
    <div class="layer-tag">${g.userData.layer}</div>
    <div class="sel-section">Position</div>
    <div class="field"><span>X</span><input type="number" step="0.05" id="sel-x" value="${g.position.x.toFixed(2)}"></div>
    <div class="field"><span>Y</span><input type="number" step="0.05" id="sel-y" value="${g.position.y.toFixed(2)}"></div>
    <div class="field"><span>Z</span><input type="number" step="0.05" id="sel-z" value="${g.position.z.toFixed(2)}"></div>
    <div class="sel-section">Scale</div>
    <div class="field"><span>SX</span><input type="number" step="0.05" id="sel-sx" value="${g.scale.x.toFixed(2)}"></div>
    <div class="field"><span>SY</span><input type="number" step="0.05" id="sel-sy" value="${g.scale.y.toFixed(2)}"></div>
    <div class="field"><span>SZ</span><input type="number" step="0.05" id="sel-sz" value="${g.scale.z.toFixed(2)}"></div>
    <div class="sel-section">Rotation</div>
    <div class="field"><span>RZ°</span><input type="number" step="5" id="sel-rz" value="${THREE.MathUtils.radToDeg(g.rotation.z).toFixed(0)}"></div>
    <div class="sel-actions">
      <button id="sel-vis" class="full">${g.visible ? 'Hide' : 'Show'}</button>
      <button id="sel-dup" class="full">Duplicate</button>
      <button id="sel-del" class="full danger">Delete</button>
    </div>
  `;
  // Debounced wall rebuild for typing in input fields
  let wallTimer = null;
  const queueWallRebuild = () => {
    if (!g.userData?.wallId) return;
    clearTimeout(wallTimer);
    wallTimer = setTimeout(() => rebuildWallById(g.userData.wallId), 120);
  };
  ['x', 'y', 'z'].forEach(ax => {
    sel.querySelector(`#sel-${ax}`).addEventListener('input', e => {
      g.position[ax] = parseFloat(e.target.value);
      if (selectionHelper) selectionHelper.update();
      queueWallRebuild();
      if (typeof recordChange === 'function') recordChange();
    });
    sel.querySelector(`#sel-s${ax}`).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (v > 0.01) {
        g.scale[ax] = v;
        if (selectionHelper) selectionHelper.update();
        queueWallRebuild();   // wall hole follows scale change
        if (typeof recordChange === 'function') recordChange();
      }
    });
  });
  sel.querySelector('#sel-rz').addEventListener('input', e => {
    g.rotation.z = THREE.MathUtils.degToRad(parseFloat(e.target.value));
    if (selectionHelper) selectionHelper.update();
    if (typeof recordChange === 'function') recordChange();
  });
  sel.querySelector('#sel-vis').addEventListener('click', () => {
    g.visible = !g.visible;
    if (g.userData?.wallId) rebuildWallById(g.userData.wallId);  // wall fills hole when door hidden
    showSelection(g);
    buildSidebar();
    if (typeof recordChange === 'function') recordChange();
  });
  sel.querySelector('#sel-dup').addEventListener('click', () => {
    const clone = g.clone(true);
    clone.name = g.name + '_copy';
    // Deep-clone userData so the copy carries its own opening tags
    clone.userData = { ...g.userData };
    clone.position.x += 0.5;
    g.parent.add(clone);
    if (clone.userData?.wallId) rebuildWallById(clone.userData.wallId);  // new opening
    buildSidebar();
    setSelected(clone);
    if (typeof recordChange === 'function') recordChange();
  });
  sel.querySelector('#sel-del').addEventListener('click', () => {
    if (!confirm(`Delete "${g.name}"?`)) return;
    const wallId = g.userData?.wallId;
    deleteAssembly(g);
    if (wallId) rebuildWallById(wallId);  // wall fills hole
    if (typeof recordChange === 'function') recordChange();
  });
}

function refreshSelectionFields() {
  if (!selected) return;
  const sx = document.getElementById('sel-x');
  if (!sx) return;
  sx.value = selected.position.x.toFixed(2);
  document.getElementById('sel-y').value = selected.position.y.toFixed(2);
  document.getElementById('sel-z').value = selected.position.z.toFixed(2);
  document.getElementById('sel-rz').value = THREE.MathUtils.radToDeg(selected.rotation.z).toFixed(0);
}

window.addEventListener('keydown', (e) => {
  // Undo/Redo (Cmd+Z, Cmd+Shift+Z, Ctrl+Y) — work even when an input has focus
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
    return;
  }
  if (cmd && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (e.target.tagName === 'INPUT') return;
  switch (e.key.toLowerCase()) {
    case 'g': transform.setMode('translate'); setActiveModeBtn('translate'); break;
    case 'r': transform.setMode('rotate'); setActiveModeBtn('rotate'); break;
    case 's': transform.setMode('scale'); setActiveModeBtn('scale'); break;
    // X/Y/Z axis-lock removed — too easy to hit by accident.
    case 'a': transform.showX = transform.showY = transform.showZ = true; break;
    case 'escape': setSelected(null); break;
  }
});

function setActiveModeBtn(mode) {
  document.querySelectorAll('button.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

window.addEventListener('resize', () => {
  if (camera.isPerspectiveCamera) camera.aspect = viewW() / viewH();
  camera.updateProjectionMatrix();
  renderer.setSize(viewW(), viewH());
});

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  if (selectionHelper) selectionHelper.update();
  renderer.render(scene, camera);
}
animate();

// ========================================================================
// PERSISTENCE (localStorage auto-save + JSON export/import)
// ========================================================================
const STATE_KEY = 'mountain-villa-state-v2';

function snapshotState() {
  const s = {
    version: 1,
    timestamp: new Date().toISOString(),
    params: { ...params },
    layerVisibility: {},
    assemblies: {},
  };
  LAYER_NAMES.forEach(n => {
    s.layerVisibility[n] = layers[n].visible;
    s.assemblies[n] = [];
    layers[n].children.forEach(c => {
      if (c.userData?.isAssembly) {
        s.assemblies[n].push({
          name: c.name,
          pos: [c.position.x, c.position.y, c.position.z],
          rot: [c.rotation.x, c.rotation.y, c.rotation.z],
          scale: [c.scale.x, c.scale.y, c.scale.z],
          visible: c.visible,
        });
      }
    });
  });
  return s;
}

function restoreState(state) {
  if (!state) return;
  if (state.params) Object.assign(params, state.params);
  setSelected(null);
  buildVilla();
  // Index assemblies by name
  const byName = new Map();
  Object.values(layers).forEach(g => g.children.forEach(c => {
    if (c.userData?.isAssembly) byName.set(c.name, c);
  }));
  // Identify defaults that no longer exist in saved state → delete them
  const survived = new Set();
  if (state.assemblies) {
    Object.entries(state.assemblies).forEach(([layerName, items]) => {
      items.forEach(item => {
        survived.add(item.name);
        const obj = byName.get(item.name);
        if (obj) {
          obj.position.set(item.pos[0], item.pos[1], item.pos[2]);
          obj.rotation.set(item.rot[0], item.rot[1], item.rot[2]);
          obj.scale.set(item.scale[0], item.scale[1], item.scale[2]);
          obj.visible = item.visible;
        }
      });
    });
  }
  // Remove default assemblies missing from state (= user deleted them previously).
  // BUT skip structural + annotation layers — those are always rebuilt from
  // params and should never be deleted by stale localStorage state.
  const ALWAYS_REBUILT_LAYERS = new Set(['Columns', 'Beams', 'Construction_Annotations']);
  Object.entries(layers).forEach(([layerName, g]) => {
    if (ALWAYS_REBUILT_LAYERS.has(layerName)) return;
    [...g.children].forEach(c => {
      if (c.userData?.isAssembly && !survived.has(c.name)) {
        c.traverse(x => { if (x.geometry) x.geometry.dispose(); });
        g.remove(c);
      }
    });
  });
  if (state.layerVisibility) {
    Object.entries(state.layerVisibility).forEach(([n, v]) => {
      if (layers[n] && !ALWAYS_REBUILT_LAYERS.has(n)) layers[n].visible = v;
    });
  }
  // After restoring all door/window positions, rebuild walls so cuts match
  rebuildAllWalls();
  buildSidebar();
  // Re-apply view mode so structural layers + annotations follow the active tab
  if (typeof applyViewMode === 'function') applyViewMode(currentView);
}

function saveLocal() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(snapshotState())); } catch (e) { console.warn(e); }
}
function loadLocal() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearLocal() { localStorage.removeItem(STATE_KEY); }

let saveTimer = null;
function scheduleAutoSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveLocal, 400);
}

// === UNDO / REDO ===
const undoStack = [];
const redoStack = [];
const HISTORY_LIMIT = 50;
let suppressHistory = false;
let historyTimer = null;

function pushHistory() {
  if (suppressHistory) return;
  const snap = JSON.stringify(snapshotState());
  if (undoStack.length && undoStack[undoStack.length - 1] === snap) return;
  undoStack.push(snap);
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
}

function scheduleHistoryPush() {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(pushHistory, 300);
}

function undo() {
  if (undoStack.length < 2) return;
  const current = undoStack.pop();
  redoStack.push(current);
  const prev = undoStack[undoStack.length - 1];
  suppressHistory = true;
  try { restoreState(JSON.parse(prev)); } finally { suppressHistory = false; }
  saveLocal();
}

function redo() {
  if (!redoStack.length) return;
  const next = redoStack.pop();
  undoStack.push(next);
  suppressHistory = true;
  try { restoreState(JSON.parse(next)); } finally { suppressHistory = false; }
  saveLocal();
}

// recordChange() = bump auto-save AND queue a history snapshot
function recordChange() {
  scheduleAutoSave();
  scheduleHistoryPush();
}

window.undo = undo;
window.redo = redo;

// Hook into the transform gizmo on every move tick (debounced save + history)
transform.addEventListener('objectChange', () => {
  scheduleAutoSave();
  scheduleHistoryPush();
});

// Wrap sidebar mutation handlers to trigger auto-save
const origDeleteAssembly = deleteAssembly;
window.deleteAssembly = function(g) { origDeleteAssembly(g); scheduleAutoSave(); };
// (overrides above; the let-defined one is reused via closures already, so we re-bind by assignment)
// Easier: monkey-patch at sites where they matter — done at the end of each handler that fires it.

// Auto-restore on load
const _loaded = loadLocal();
if (_loaded) {
  try {
    restoreState(_loaded);
    console.log('Restored from localStorage:', _loaded.timestamp);
  } catch (e) { console.warn('Restore failed:', e); clearLocal(); }
}
// Initial undo baseline so the first ⌘Z brings you back to load-state
pushHistory();

// === FILE EXPORT/IMPORT ===
function downloadJSON() {
  const data = JSON.stringify(snapshotState(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `villa-state-${now}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function uploadJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        restoreState(JSON.parse(ev.target.result));
        saveLocal();
      } catch (err) { alert('Invalid state file: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function resetToDefaults() {
  if (!confirm('Discard all your changes and reset to the original layout?')) return;
  clearLocal();
  // Re-init params to canonical defaults
  Object.assign(params, {
    envX: 9.5, envY: 11.0,
    wallTopZ: 3.25, wallBtmZ: 0.45,
    peakZ: 5.45, ridgeY: 5.5,
    ridgeXfromW: 1.4, ridgeXfromE: 1.4,
    extWT: 0.20, intWT: 0.15,
    ovh: { n: 0.8, s: 0.8, e: 0.8, w: 1.2 },
    roofThick: 0.10,
    P4_y: 3.5,
  });
  setSelected(null);
  buildVilla();
  buildSidebar();
}

// Hook the File buttons (added via index.html below)
document.getElementById('file-save')?.addEventListener('click', downloadJSON);
document.getElementById('file-load')?.addEventListener('click', uploadJSON);
document.getElementById('file-reset')?.addEventListener('click', resetToDefaults);

window.layers = layers;
window.params = params;
window.buildVilla = buildVilla;
window.buildSidebar = buildSidebar;
window.scene = scene;
window.setSelected = setSelected;
window.snapshotState = snapshotState;
window.restoreState = restoreState;
window.scheduleAutoSave = scheduleAutoSave;
console.log('Editor loaded. envelope=', params.envX, '×', params.envY);
