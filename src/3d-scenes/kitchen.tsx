
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// ─── Surface mesh names ───────────────────────────────────────────────────────
export const SURFACE_NAMES = {
  floor:     'surface_floor',
  wallBack:  'surface_wall_back',
  wallLeft:  'surface_wall_left',
  wallRight: 'surface_wall_right',
} as const;

export type SurfaceName = typeof SURFACE_NAMES[keyof typeof SURFACE_NAMES];
export const WALL_MAT_INDEX = { back: 0, left: 1, right: 2 } as const;

export const TUBE_LIGHT_NAMES = {
  tube1: 'tube_light_1',
  tube2: 'tube_light_2',
} as const;

export interface KitchenRefs {
  tubeLight1:      THREE.RectAreaLight | THREE.PointLight;
  tubeLight2:      THREE.RectAreaLight | THREE.PointLight;
  tubeMat1:        THREE.MeshStandardMaterial;
  tubeMat2:        THREE.MeshStandardMaterial;
  ambientLight:    THREE.AmbientLight;
  hemisphereLight: THREE.HemisphereLight;
  movables:        THREE.Group[];
}

interface SceneBuilderProps {
  scene: THREE.Scene;
  onFloorMaterialReady: (material: THREE.MeshStandardMaterial) => void;
  onWallMaterialsReady: (materials: THREE.MeshStandardMaterial[]) => void;
  onCabinetMaterialsReady?: (materials: THREE.MeshStandardMaterial[]) => void;
}

export function buildKitchenScene({
  scene,
  onFloorMaterialReady,
  onWallMaterialsReady,
  onCabinetMaterialsReady,
}: SceneBuilderProps): KitchenRefs {

  const movables: THREE.Group[] = [];
  const markMovable = (obj: THREE.Group, name: string, label: string) => {
    obj.userData.movable = true;
    obj.userData.label   = label;
    obj.name = name;
    movables.push(obj);
  };

  // ==============================================
  // Scene & Fog — same as living room
  // ==============================================
  scene.background = new THREE.Color(0xe8ebe8);
  scene.fog = new THREE.Fog(0xe8ebe8, 15, 30);

  // ==============================================
  // Lighting — same values as living room
  // ==============================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
  scene.add(hemisphereLight);

  // Straight down — no wall favoured over another
  const sunLight = new THREE.DirectionalLight(0xfff8e8, 0.8);
  sunLight.position.set(0, 15, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 40;
  sunLight.shadow.camera.left  = -12;
  sunLight.shadow.camera.right =  12;
  sunLight.shadow.camera.top   =  12;
  sunLight.shadow.camera.bottom = -12;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);

  const underLight = new THREE.PointLight(0xffe8d0, 4, 5);
  underLight.position.set(0, 1.5, -5.2);
  scene.add(underLight);

  const tubeLightPL1 = new THREE.PointLight(0xfff8f0, 20, 28, 1.5);
  tubeLightPL1.position.set(-3, 5.7, 0);
  tubeLightPL1.castShadow = true;
  scene.add(tubeLightPL1);

  const tubeLightPL2 = new THREE.PointLight(0xfff8f0, 20, 28, 1.5);
  tubeLightPL2.position.set(3, 5.7, 0);
  tubeLightPL2.castShadow = true;
  scene.add(tubeLightPL2);

  new RGBELoader().load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/peppermint_powerplant_1k.hdr',
    (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = hdr;
    }
  );

  // ==============================================
  // Materials
  // ==============================================

  // Floor — white, low emissive (same as living room)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    metalness: 0.05,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.05,
  });
  onFloorMaterialReady(floorMat);

  // Walls — white, low emissive (same as living room)
  const makeWallMat = () => new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.02,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });

  // Cabinet — dark walnut
  const cabinetMat  = new THREE.MeshStandardMaterial({ color: 0x2d1a0e, roughness: 0.7, metalness: 0.05 });
  const counterMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.35, envMapIntensity: 1.2 });
  const steelMat    = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.15, metalness: 0.92, envMapIntensity: 1.5 });
  const chromeMat   = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.08, metalness: 0.96, envMapIntensity: 1.8 });
  const goldMat     = new THREE.MeshStandardMaterial({ color: 0xc8960c, roughness: 0.2,  metalness: 0.9,  envMapIntensity: 1.5 });
  const marbleMat   = new THREE.MeshStandardMaterial({ color: 0xe8e2d8, roughness: 0.18, metalness: 0.02, envMapIntensity: 0.9 });
  const cabinetMaterials: THREE.MeshStandardMaterial[] = [];

  const tubeMat1 = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.15, metalness: 0.1,
    emissive: 0xfff8e8, emissiveIntensity: 3.0,
    transparent: true, opacity: 0.92,
  });
  const tubeMat2 = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.15, metalness: 0.1,
    emissive: 0xfff8e8, emissiveIntensity: 3.0,
    transparent: true, opacity: 0.92,
  });

  // ==============================================
  // Floor
  // ==============================================
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = SURFACE_NAMES.floor;
  scene.add(floor);

  // ==============================================
  // Walls — all white with emissive 0.05
  // ==============================================
  const backWallMat  = makeWallMat();
  const leftWallMat  = makeWallMat();
  const rightWallMat = makeWallMat();

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), backWallMat);
  backWall.position.set(0, 3, -7); backWall.receiveShadow = true;
  backWall.name = SURFACE_NAMES.wallBack; scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), leftWallMat);
  leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-8, 3, 0);
  leftWall.receiveShadow = true; leftWall.name = SURFACE_NAMES.wallLeft; scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), rightWallMat);
  rightWall.rotation.y = -Math.PI / 2; rightWall.position.set(8, 3, 0);
  rightWall.receiveShadow = true; rightWall.name = SURFACE_NAMES.wallRight; scene.add(rightWall);

  onWallMaterialsReady([backWallMat, leftWallMat, rightWallMat]);

  // Crown moulding
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 });
  const crownBack = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 0.1), crownMat);
  crownBack.position.set(0, 5.95, -6.95); scene.add(crownBack);
  const crownL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 14), crownMat);
  crownL.position.set(-7.95, 5.95, 0); scene.add(crownL);
  const crownR = crownL.clone(); crownR.position.x = 7.95; scene.add(crownR);

  // Skirting
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.65 });
  const skirtBack = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 0.06), skirtMat);
  skirtBack.position.set(0, 0.06, -6.97); scene.add(skirtBack);
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 14), skirtMat);
  skirtL.position.set(-7.97, 0.06, 0); scene.add(skirtL);
  const skirtR = skirtL.clone(); skirtR.position.x = 7.97; scene.add(skirtR);

  // ==============================================
  // Ceiling
  // ==============================================
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 14),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 6;
  ceiling.receiveShadow = true; scene.add(ceiling);

  // ==============================================
  // Tube Lights — ceiling mounted, clickable
  // ==============================================
  function createTubeLight(x: number, tubeMat: THREE.MeshStandardMaterial, tubeName: string) {
    const g = new THREE.Group();
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.07, 3.0),
      new THREE.MeshStandardMaterial({ color: 0xe0e0e4, roughness: 0.3, metalness: 0.7 })
    );
    housing.position.y = -0.035; g.add(housing);
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 2.9), tubeMat);
    diffuser.position.y = -0.06; diffuser.name = tubeName; g.add(diffuser);
    for (const ez of [-1.52, 1.52]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xb8b8bc, roughness: 0.4, metalness: 0.5 }));
      cap.position.set(0, -0.035, ez); g.add(cap);
    }
    g.position.set(x, 5.98, 0);
    scene.add(g);
    // Proxy sphere for clicking
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    proxy.name = tubeName;
    proxy.position.set(x, 3.5, 0);
    scene.add(proxy);
  }

  createTubeLight(-3, tubeMat1, TUBE_LIGHT_NAMES.tube1);
  createTubeLight( 3, tubeMat2, TUBE_LIGHT_NAMES.tube2);

  // ==============================================
  // Refrigerator — MOVABLE
  // ==============================================
  const fridgeGroup = new THREE.Group();
  const fridgeBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.2), steelMat);
  fridgeBody.position.y = 1.2; fridgeBody.castShadow = true; fridgeGroup.add(fridgeBody);
  const fridgeUpperDoor = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.28, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.2, metalness: 0.85 }));
  fridgeUpperDoor.position.set(0, 1.56, 0.61); fridgeGroup.add(fridgeUpperDoor);
  const fridgeLowerDoor = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.98, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.2, metalness: 0.85 }));
  fridgeLowerDoor.position.set(0, 0.7, 0.61); fridgeGroup.add(fridgeLowerDoor);
  const fridgeHandle1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 0.07), goldMat);
  fridgeHandle1.position.set(0.68, 1.56, 0.65); fridgeGroup.add(fridgeHandle1);
  const fridgeHandle2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.65, 0.07), goldMat);
  fridgeHandle2.position.set(0.68, 0.7, 0.65); fridgeGroup.add(fridgeHandle2);
  const dispPanel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.6 }));
  dispPanel.position.set(-0.45, 1.4, 0.64); fridgeGroup.add(dispPanel);
  fridgeGroup.position.set(-6.8, 0, -5.0);
  fridgeGroup.rotation.y = Math.PI / 2;
  markMovable(fridgeGroup, 'furniture_fridge', 'Refrigerator');
  scene.add(fridgeGroup);

  // ==============================================
  // Lower Cabinets + Countertop + Upper Cabinets — wall-fixed
  // ==============================================
  const lowerBase = new THREE.Mesh(new THREE.BoxGeometry(9, 1.0, 1.4), cabinetMat);
  lowerBase.position.set(0.5, 0.5, -5.8); lowerBase.castShadow = true;
  cabinetMaterials.push(cabinetMat); scene.add(lowerBase);

  for (let i = -1; i <= 2; i++) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.88, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1e0e04, roughness: 0.7 }));
    door.position.set(i * 2.2 + 0.5, 0.5, -5.1); door.castShadow = true; scene.add(door);
    cabinetMaterials.push(door.material as THREE.MeshStandardMaterial);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.15, 12), goldMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(i * 2.2 + 1.2, 0.5, -5.08); scene.add(handle);
  }

  const countertop = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.06, 1.5), marbleMat);
  countertop.position.set(0.5, 1.04, -5.8); countertop.castShadow = true; scene.add(countertop);

  // Countertop edge strip
  const edgeStrip = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.008, 1.52),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.1, metalness: 0.5 }));
  edgeStrip.position.set(0.5, 1.074, -5.8); scene.add(edgeStrip);

  const upperBase = new THREE.Mesh(new THREE.BoxGeometry(9, 1.0, 0.8), cabinetMat);
  upperBase.position.set(0.5, 2.5, -6.2); upperBase.castShadow = true;
  cabinetMaterials.push(cabinetMat); scene.add(upperBase);

  for (let i = -1; i <= 2; i++) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.88, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1e0e04, roughness: 0.7 }));
    door.position.set(i * 2.2 + 0.5, 2.5, -5.81); door.castShadow = true; scene.add(door);
    cabinetMaterials.push(door.material as THREE.MeshStandardMaterial);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 12), goldMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(i * 2.2 + 1.2, 2.5, -5.79); scene.add(handle);
  }

  // Under-cabinet LED strip
  const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.04, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xfff8e8, roughness: 0.2, emissive: 0xfff8e8, emissiveIntensity: 1.5 }));
  ledStrip.position.set(0.5, 2.02, -5.82); scene.add(ledStrip);

  // ==============================================
  // Microwave — MOVABLE
  // ==============================================
  const microwaveGroup = new THREE.Group();
  const microwaveBody = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.5, 0.65), steelMat);
  microwaveBody.castShadow = true; microwaveGroup.add(microwaveBody);
  const microwaveDoor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.7 }));
  microwaveDoor.position.set(-0.12, 0, 0.33); microwaveGroup.add(microwaveDoor);
  const mwPanel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.5 }));
  mwPanel.position.set(0.38, 0, 0.33); microwaveGroup.add(mwPanel);
  const mwHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), goldMat);
  mwHandle.position.set(0.18, 0, 0.35); microwaveGroup.add(mwHandle);
  microwaveGroup.position.set(0.5, 1.33, -5.45);
  markMovable(microwaveGroup, 'furniture_microwave', 'Microwave');
  scene.add(microwaveGroup);

  // ==============================================
  // Sink — wall-fixed
  // ==============================================
  const sinkBasin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 1.0), steelMat);
  sinkBasin.position.set(-2.5, 0.96, -5.8); sinkBasin.castShadow = true; scene.add(sinkBasin);
  const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 16), goldMat);
  faucetBase.position.set(-2.5, 1.12, -5.55); scene.add(faucetBase);
  const faucetNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12), goldMat);
  faucetNeck.position.set(-2.5, 1.38, -5.55); scene.add(faucetNeck);
  const faucetSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.28, 12), goldMat);
  faucetSpout.position.set(-2.5, 1.48, -5.72);
  faucetSpout.rotation.x = Math.PI / 3; scene.add(faucetSpout);

  // ==============================================
  // Stove + Oven — wall-fixed
  // ==============================================
  const stoveTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.5 }));
  stoveTop.position.set(2.0, 1.08, -5.8); stoveTop.castShadow = true; scene.add(stoveTop);
  for (let i = 0; i < 4; i++) {
    const bx = i % 2 === 0 ? -0.38 : 0.38;
    const bz = i < 2 ? 0.28 : -0.28;
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 32),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4 }));
    burner.position.set(2.0 + bx, 1.12, -5.8 + bz); scene.add(burner);
    const grate = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.014, 8, 16), chromeMat);
    grate.position.set(2.0 + bx, 1.16, -5.8 + bz); grate.rotation.x = Math.PI / 2; scene.add(grate);
  }
  const ovenDoor = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.85, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.6 }));
  ovenDoor.position.set(2.0, 0.53, -5.08); scene.add(ovenDoor);
  const ovenHandle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.08), goldMat);
  ovenHandle.position.set(2.0, 0.95, -5.06); scene.add(ovenHandle);

  // ==============================================
  // Kitchen Island — MOVABLE (all decor inside group)
  // ==============================================
  const islandGroup = new THREE.Group();

  const islandBase = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 2.8), cabinetMat);
  islandBase.position.y = 0.6; islandBase.castShadow = true; islandGroup.add(islandBase);
  cabinetMaterials.push(cabinetMat);

  const islandTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.06, 2.9), marbleMat);
  islandTop.position.y = 1.23; islandTop.castShadow = true; islandGroup.add(islandTop);

  // Marble edge
  const islandEdge = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.008, 2.92),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.1, metalness: 0.5 }));
  islandEdge.position.y = 1.264; islandGroup.add(islandEdge);

  // Drawer fronts with gold handles
  for (let i = -1; i <= 1; i++) {
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1e0e04, roughness: 0.7 }));
    drawer.position.set(i * 1.4, 0.6, 1.42); islandGroup.add(drawer);
    cabinetMaterials.push(drawer.material as THREE.MeshStandardMaterial);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 12), goldMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(i * 1.4, 0.6, 1.46); islandGroup.add(handle);
  }

  // Pot + lid — inside islandGroup (moves with island)
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.23, 0.42, 32), steelMat);
  pot.position.set(0.8, 1.52, 0); pot.castShadow = true; islandGroup.add(pot);
  const potLid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.07, 32), steelMat);
  potLid.position.set(0.8, 1.74, 0); islandGroup.add(potLid);
  // Pot handle
  const potHandle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.35), steelMat);
  potHandle.position.set(0.8, 1.73, -0.37); islandGroup.add(potHandle);

  // Fruit bowl — inside islandGroup
  const fruitBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.22, 0.18, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xa8b5a2, roughness: 0.6 })
  );
  fruitBowl.position.set(-1.2, 1.36, 0.3); islandGroup.add(fruitBowl);
  const appleColors = [0xc8463a, 0xd85848, 0xa83a2a];
  for (let i = 0; i < 3; i++) {
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshStandardMaterial({ color: appleColors[i], roughness: 0.7 }));
    const a = (i / 3) * Math.PI * 2;
    apple.position.set(-1.2 + Math.cos(a) * 0.11, 1.45, 0.3 + Math.sin(a) * 0.11);
    apple.castShadow = true; islandGroup.add(apple);
  }

  // Cutting board — inside islandGroup
  const cuttingBoard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.8 }));
  cuttingBoard.position.set(1.5, 1.255, -0.5); islandGroup.add(cuttingBoard);

  // Wine glass — inside islandGroup
  const wineGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.02, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xd8eef8, roughness: 0.0, metalness: 0.0, transparent: true, opacity: 0.4 }));
  wineGlass.position.set(-0.3, 1.365, -0.6); islandGroup.add(wineGlass);

  islandGroup.position.set(0, 0, 1.5);
  markMovable(islandGroup, 'furniture_island', 'Kitchen Island');
  scene.add(islandGroup);

  // ==============================================
  // Coffee Maker — MOVABLE
  // ==============================================
  const coffeeMakerGroup = new THREE.Group();
  const coffeeMakerBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.3 }));
  coffeeMakerBody.castShadow = true; coffeeMakerGroup.add(coffeeMakerBody);
  // Coffee maker details
  const cmPanel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, emissive: 0x004400, emissiveIntensity: 0.5 }));
  cmPanel.position.set(0, 0.15, 0.2); coffeeMakerGroup.add(cmPanel);
  const cmCarafe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.4 }));
  cmCarafe.position.set(0, -0.18, 0.12); coffeeMakerGroup.add(cmCarafe);
  coffeeMakerGroup.position.set(4.5, 1.37, -5.45);
  markMovable(coffeeMakerGroup, 'furniture_coffee_maker', 'Coffee Maker');
  scene.add(coffeeMakerGroup);



  // ==============================================
  // Wall art above upper cabinets
  // ==============================================
  const artFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 }));
  artFrame.position.set(-5.5, 4.5, -6.93); scene.add(artFrame);
  const artCanvas = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.75),
    new THREE.MeshStandardMaterial({ color: 0xd8c8a8, roughness: 0.8 }));
  artCanvas.position.set(-5.5, 4.5, -6.9); scene.add(artCanvas);

  // Small plant on counter
  const plantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.8 }));
  plantPot.position.set(4.8, 1.18, -5.5); scene.add(plantPot);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8 }));
    leaf.position.set(4.8 + Math.cos(a) * 0.06, 1.35, -5.5 + Math.sin(a) * 0.06);
    scene.add(leaf);
  }

  if (onCabinetMaterialsReady) onCabinetMaterialsReady(cabinetMaterials);

  return {
    tubeLight1:      tubeLightPL1,
    tubeLight2:      tubeLightPL2,
    tubeMat1,
    tubeMat2,
    ambientLight,
    hemisphereLight,
    movables,
  };
}