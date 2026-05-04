import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// ========================================================================
// 9.5 × 11 envelope (Plan A) · ONLY DELTA from prior version:
// dining-E strip widened from 1.0 m to 1.5 m N-S → P5 at y=1.5 (was 2.0)
// Bath/WC zone shrinks from y=0..2 to y=0..1.5 to accommodate.
// ========================================================================

const sidebarWidth = () => 320;
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
const sun = new THREE.DirectionalLight(0xfff0d0, 2.2);
sun.position.set(-12, -6, 16);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 60;
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.bias = -0.0005;
sun.target.position.set(4.75, 5.5, 0);
scene.add(sun);
scene.add(sun.target);
scene.add(new THREE.HemisphereLight(0xb6d3ff, 0x4d5b3d, 0.55));
scene.add(new THREE.AmbientLight(0xffffff, 0.18));

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
};

// === LAYERS ===
const LAYER_NAMES = [
  'Site', 'Foundation',
  'Walls_Exterior', 'Walls_Interior',
  'Trim_Eaves', 'Roof', 'Ceilings',
  'Doors', 'Windows',
  'Furniture_Master', 'Furniture_BR2', 'Furniture_BR1',
  'Furniture_Dining', 'Furniture_Kitchen',
  'Furniture_Bath', 'Furniture_WC',
  'Lighting_Fixtures',
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

// === PARAMS (per plan-A-plumbing.svg: 9.5 × 11, dining-E strip 1.5 m thick) ===
const params = {
  envX: 9.5, envY: 11.0,
  wallTopZ: 3.25, wallBtmZ: 0.45,
  peakZ: 5.45, ridgeY: 5.5,
  ridgeXfromW: 1.4, ridgeXfromE: 1.4,
  extWT: 0.20, intWT: 0.15,
  ovh: { n: 0.8, s: 0.8, e: 0.8, w: 1.2 },
  roofThick: 0.10,
  P4_y: 3.5,   // moved south 0.5m (was 3.0) → strip 1.5m N-S
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
      // Clamp opening to within wall bounds (so it doesn't poke past the ends)
      const w = o.userData.openingW;
      if (along - w/2 < def.alongStart - 0.01) return;
      if (along + w/2 > def.alongEnd + 0.01) return;
      ops.push({ c: along, w, sill: o.userData.openingSill, top: o.userData.openingTop });
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

  // === FOUNDATION ===
  soloBox('FloorSlab', 'Foundation', [cx, cy, 0.40], [p.envX + 0.2, p.envY + 0.2, 0.10], M.floor);
  soloBox('Plinth_S',  'Foundation', [cx, -0.075, 0.25], [p.envX + 0.3, 0.05, 0.40], M.plinth);
  soloBox('Plinth_N',  'Foundation', [cx, p.envY + 0.075, 0.25], [p.envX + 0.3, 0.05, 0.40], M.plinth);
  soloBox('Plinth_W',  'Foundation', [-0.075, cy, 0.25], [0.05, p.envY + 0.2, 0.40], M.plinth);
  soloBox('Plinth_E',  'Foundation', [p.envX + 0.075, cy, 0.25], [0.05, p.envY + 0.2, 0.40], M.plinth);
  // Wet floor overlays — Bath at (6-8, 0-2), WC at (8-9.5, 0-2)
  soloBox('FloorTile_Bath', 'Foundation', [7.0,  1.0, 0.4525], [1.825, 1.825, 0.005], M.wet);
  soloBox('FloorTile_WC',   'Foundation', [8.75, 1.0, 0.4525], [1.325, 1.825, 0.005], M.wet);

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
    { id: 'P1_master_BR2',        layer: 'Walls_Interior', axis: 'y', lineCoord: 4,       alongStart: 7,       alongEnd: 11,        thickness: p.intWT, mat: M.int },
    { id: 'P2_bedrooms_dining',   layer: 'Walls_Interior', axis: 'x', lineCoord: 7,       alongStart: 0,       alongEnd: p.envX,    thickness: p.intWT, mat: M.int },
    { id: 'P3_dining_BR1',        layer: 'Walls_Interior', axis: 'y', lineCoord: 5.5,     alongStart: p.P4_y,  alongEnd: 7,         thickness: p.intWT, mat: M.int },
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
    setAnchor(a, x, y, 0);   // group.position = (x, y, 0) → wall builder reads correct along-coord
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
    setAnchor(a, x, y, 0);
    return a;
  }

  // Door schedule per plumbing.svg
  door('D1_master_door',  2.0,   7.0,  0.9, 2.1, 'y', M.wood, 'P2_bedrooms_dining');
  door('D2_BR2_door',     4.75,  7.0,  0.9, 2.1, 'y', M.wood, 'P2_bedrooms_dining');
  door('D3_BR1_door',     5.5,   6.35, 0.9, 2.1, 'x', M.wood, 'P3_dining_BR1');
  door('D4_bath_door',    7.0,   2.0,  0.8, 2.1, 'y', M.trim, 'P5_diningEstrip_wet');
  door('D5_WC_door',      8.75,  2.0,  0.7, 2.1, 'y', M.trim, 'P5_diningEstrip_wet');
  door('D7_service_door', p.envX, 2.75, 0.9, 2.1, 'x', M.wood, 'EW_E_east_wall');   // moved to middle of dining-E strip (was 2.5)
  slider('D6_main_entry', 4.0,   0,    1.5, 2.1, 'y',         'EW_S_south_wall');

  // === WINDOWS — also tagged with their wall ===
  function casement(name, x, y, w, h, sill, dirn, wallId) {
    const a = assembly(name, 'Windows');
    Object.assign(a.userData, { wallId, openingW: w, openingSill: sill, openingTop: sill + h, openingDirn: dirn });
    const z = sill + h / 2;
    const fw = 0.05, fd = 0.08;
    if (dirn === 'y') {
      partBox(a, '_FrT', [x, y, sill + h + fw/2], [w + 2*fw, fd, fw], M.alu);
      partBox(a, '_FrB', [x, y, sill - fw/2],     [w + 2*fw, fd, fw], M.alu);
      partBox(a, '_FrL', [x - w/2 - fw/2, y, z], [fw, fd, h], M.alu);
      partBox(a, '_FrR', [x + w/2 + fw/2, y, z], [fw, fd, h], M.alu);
      if (w >= 1.0) partBox(a, '_Mull', [x, y, z], [fw, fd, h], M.alu);
      partBox(a, '_Glass', [x, y, z], [w - 0.04, 0.025, h - 0.04], M.glass);
      partBox(a, '_Sill', [x, y - 0.06, sill - 0.06], [w + 0.18, 0.20, 0.06], M.plinth);
    } else {
      partBox(a, '_FrT', [x, y, sill + h + fw/2], [fd, w + 2*fw, fw], M.alu);
      partBox(a, '_FrB', [x, y, sill - fw/2],     [fd, w + 2*fw, fw], M.alu);
      partBox(a, '_FrL', [x, y - w/2 - fw/2, z], [fd, fw, h], M.alu);
      partBox(a, '_FrR', [x, y + w/2 + fw/2, z], [fd, fw, h], M.alu);
      if (w >= 1.0) partBox(a, '_Mull', [x, y, z], [fd, fw, h], M.alu);
      partBox(a, '_Glass', [x, y, z], [0.025, w - 0.04, h - 0.04], M.glass);
      const off = x < cx ? -0.06 : 0.06;
      partBox(a, '_Sill', [x + off, y, sill - 0.06], [0.20, w + 0.18, 0.06], M.plinth);
    }
    setAnchor(a, x, y, 0);
    return a;
  }
  function louver(name, x, y, w, h, sill, dirn, wallId) {
    const a = assembly(name, 'Windows');
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
    setAnchor(a, x, y, 0);
    return a;
  }

  // Window schedule per plumbing.svg
  casement('W1_master_W', 0,      9, 1.5, 1.2, 1.0, 'x', 'EW_W_west_wall');
  casement('W2_BR2_E',    p.envX, 9, 1.5, 1.2, 1.0, 'x', 'EW_E_east_wall');
  casement('W3_BR1_E',    p.envX, 5, 1.5, 1.2, 1.0, 'x', 'EW_E_east_wall');
  casement('W4_dining_W', 0,      5, 2.5, 1.5, 1.0, 'x', 'EW_W_west_wall');
  casement('W5_dining_W', 0,      2, 2.5, 1.5, 1.0, 'x', 'EW_W_west_wall');
  casement('W6_dining_S', 1.55,   0, 1.2, 1.2, 1.0, 'y', 'EW_S_south_wall');
  louver  ('W7_bath_S',   7.0,    0, 0.5, 0.6, 1.8, 'y', 'EW_S_south_wall');
  louver  ('W8_WC_S',     8.75,   0, 0.6, 0.6, 1.8, 'y', 'EW_S_south_wall');

  // === ROOF ===
  buildHipRoof();

  // === CEILINGS ===
  // Bedroom strip (master + BR2): y=7..11
  soloBox('Ceil_Bedrooms',  'Ceilings', [cx, 9.0, 3.15], [p.envX, 4.0, 0.04], M.int);
  // BR1: x=5.5..9.5 (4m), y=P4_y..7 (3.5m if P4_y=3.5)
  const br1y = (p.P4_y + 7) / 2;
  const br1h = 7 - p.P4_y;
  soloBox('Ceil_BR1',       'Ceilings', [7.5, br1y, 3.15], [4.0, br1h, 0.04], M.int);
  // Dining-E strip: x=6..9.5 (3.5m), y=2..P4_y (1.5m if P4_y=3.5)
  const stripY = (2 + p.P4_y) / 2;
  const stripH = p.P4_y - 2;
  soloBox('Ceil_DiningEstrip','Ceilings', [7.75, stripY, 3.15], [3.5, stripH, 0.04], M.int);
  // Dining-NW under west hip slope: x=0..1.4
  soloBox('Ceil_Dining_NW', 'Ceilings', [0.7, 3.5, 3.15], [1.4, 7.0, 0.04], M.int);
  // Bath (2×2) and WC (1.5×2) — flat at +2.6
  soloBox('Ceil_Bath',      'Ceilings', [7.0, 1.0, 2.60], [1.825, 1.825, 0.04], M.int);
  soloBox('Ceil_WC',        'Ceilings', [8.75, 1.0, 2.60], [1.325, 1.825, 0.04], M.int);
  buildVault();

  // === TRIM ===
  soloBox('Beam_S', 'Trim_Eaves', [cx, 0,        p.wallTopZ + 0.02], [p.envX + 0.2, 0.25, 0.04], M.trim);
  soloBox('Beam_N', 'Trim_Eaves', [cx, p.envY,   p.wallTopZ + 0.02], [p.envX + 0.2, 0.25, 0.04], M.trim);
  soloBox('Beam_W', 'Trim_Eaves', [0, cy,        p.wallTopZ + 0.02], [0.25, p.envY + 0.2, 0.04], M.trim);
  soloBox('Beam_E', 'Trim_Eaves', [p.envX, cy,   p.wallTopZ + 0.02], [0.25, p.envY + 0.2, 0.04], M.trim);

  buildFurniture();

  // Now that all openings exist, generate wall segments around them.
  rebuildAllWalls();
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

function buildVault() {
  // Per spec §10: dining vault peaks at +5.30 (ridge level), eave at +3.20
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

  // === MASTER (4×4, x=0-4, y=7-11)
  bed('Master_bed', 2.0, 9.8, 'north', 'Furniture_Master');
  nightstand('Master_nightstand_L', 1.05, 8.6, 'Furniture_Master');
  nightstand('Master_nightstand_R', 2.95, 8.6, 'Furniture_Master');
  wardrobe('Master_wardrobe', 2.0, 7.35, 'Furniture_Master', 2.2, 0.55, 2.2, 'ew');
  dresser('Master_dresser', 3.65, 8.7, 'Furniture_Master', 0.5, 0.8, 1.0, 'ns');
  roundChair('Master_reading_chair', 0.5, 9.3, 'Furniture_Master');
  fan('Master_ceiling_fan', 2.0, 9.0);

  // === BR2 (5.5×4, x=4-9.5, y=7-11)
  bed('BR2_bed', 6.75, 9.8, 'north', 'Furniture_BR2');
  nightstand('BR2_nightstand_L', 5.8, 8.6, 'Furniture_BR2');
  nightstand('BR2_nightstand_R', 7.7, 8.6, 'Furniture_BR2');
  wardrobe('BR2_wardrobe', 6.75, 7.35, 'Furniture_BR2', 2.2, 0.55, 2.2, 'ew');
  soloBox('BR2_desk', 'Furniture_BR2', [9.15, 8.7, FFL + 0.36], [0.5, 0.8, 0.72], M.wood);
  roundChair('BR2_desk_chair', 9.0, 8.0, 'Furniture_BR2');
  roundChair('BR2_sitting_chair', 4.5, 9.3, 'Furniture_BR2');
  fan('BR2_ceiling_fan', 6.75, 9.0);

  // === BR1 (4 × 3.5, x=5.5-9.5, y=P4_y..7), bed E-W head W
  // Centered at ((5.5+9.5)/2, (P4_y+7)/2) = (7.5, ~5.25)
  const br1cy = (P4y + 7) / 2;
  bed('BR1_bed', 6.575, br1cy, 'west', 'Furniture_BR1');
  nightstand('BR1_nightstand', 8.7, P4y + 0.3, 'Furniture_BR1', 0.35, 0.35, 0.6);
  wardrobe('BR1_wardrobe', 7.5, 6.65, 'Furniture_BR1', 2.2, 0.55, 2.2, 'ew');
  dresser('BR1_dresser', 9.15, 6.3, 'Furniture_BR1', 0.5, 0.8, 1.0, 'ns');
  fan('BR1_ceiling_fan', 7.0, br1cy);

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
        // Clamp along the wall
        const halfW = (selected.userData.openingW || 0.9) / 2;
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
document.getElementById('peakZ').value = params.peakZ;
document.getElementById('rebuild').addEventListener('click', () => {
  params.envX = parseFloat(document.getElementById('envX').value);
  params.envY = parseFloat(document.getElementById('envY').value);
  params.wallTopZ = parseFloat(document.getElementById('wallTopZ').value);
  params.peakZ = parseFloat(document.getElementById('peakZ').value);
  setSelected(null);
  buildVilla();
  buildSidebar();
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
  if (e.target.tagName === 'INPUT') return;
  switch (e.key.toLowerCase()) {
    case 'g': transform.setMode('translate'); setActiveModeBtn('translate'); break;
    case 'r': transform.setMode('rotate'); setActiveModeBtn('rotate'); break;
    case 's': transform.setMode('scale'); setActiveModeBtn('scale'); break;
    case 'x': transform.showX = true; transform.showY = false; transform.showZ = false; break;
    case 'y': transform.showX = false; transform.showY = true; transform.showZ = false; break;
    case 'z': transform.showX = false; transform.showY = false; transform.showZ = true; break;
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
  // Remove default assemblies missing from state (= user deleted them previously)
  Object.values(layers).forEach(g => {
    [...g.children].forEach(c => {
      if (c.userData?.isAssembly && !survived.has(c.name)) {
        c.traverse(x => { if (x.geometry) x.geometry.dispose(); });
        g.remove(c);
      }
    });
  });
  if (state.layerVisibility) {
    Object.entries(state.layerVisibility).forEach(([n, v]) => {
      if (layers[n]) layers[n].visible = v;
    });
  }
  // After restoring all door/window positions, rebuild walls so cuts match
  rebuildAllWalls();
  buildSidebar();
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

// Hook into the transform gizmo's drag end
transform.addEventListener('objectChange', scheduleAutoSave);

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
