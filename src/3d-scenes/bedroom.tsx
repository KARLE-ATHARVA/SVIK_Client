
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export const SURFACE_NAMES = {
  floor:     "surface_floor",
  wallBack:  "surface_wall_back",
  wallLeft:  "surface_wall_left",
  wallRight: "surface_wall_right",
} as const;

export type SurfaceName = typeof SURFACE_NAMES[keyof typeof SURFACE_NAMES];
export const WALL_MAT_INDEX = { back: 0, left: 1, right: 2 } as const;

export const LAMP_NAMES = {
  leftShade:  "lamp_shade_left",
  rightShade: "lamp_shade_right",
} as const;

export interface BedroomRefs {
  leftLampLight:   THREE.PointLight;
  rightLampLight:  THREE.PointLight;
  leftShadeMat:    THREE.MeshStandardMaterial;
  rightShadeMat:   THREE.MeshStandardMaterial;
  ambientLight:    THREE.AmbientLight;
  hemisphereLight: THREE.HemisphereLight;
  movables:        THREE.Group[];
}

interface SceneBuilderProps {
  scene: THREE.Scene;
  onFloorMaterialReady: (material: THREE.MeshStandardMaterial) => void;
  onWallMaterialsReady: (materials: THREE.MeshStandardMaterial[]) => void;
}

export function buildBedroomScene({
  scene,
  onFloorMaterialReady,
  onWallMaterialsReady,
}: SceneBuilderProps): BedroomRefs {

  const movables: THREE.Group[] = [];
  const markMovable = (obj: THREE.Group, name: string, label: string) => {
    obj.userData.movable = true;
    obj.userData.label   = label;
    obj.name = name;
    movables.push(obj);
  };

  // ==============================================
  // Scene & Fog
  // ==============================================
  scene.background = new THREE.Color(0xe8ebe8);
  scene.fog = new THREE.Fog(0xe8ebe8, 15, 30);

  // ==============================================
  // Lighting — same as living room
  // ==============================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
  scene.add(hemisphereLight);

  // Straight down — no wall favoured
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
  sunLight.position.set(0, 15, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far  = 40;
  sunLight.shadow.camera.left   = -12;
  sunLight.shadow.camera.right  =  12;
  sunLight.shadow.camera.top    =  10;
  sunLight.shadow.camera.bottom = -10;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);

  const ceilingLight = new THREE.PointLight(0xfff8f0, 15, 30, 2);
  ceilingLight.position.set(0, 5.5, 0);
  ceilingLight.castShadow = true;
  scene.add(ceilingLight);

  const leftLampLight = new THREE.PointLight(0xffd8a8, 12, 8);
  leftLampLight.position.set(-3.5, 3.1, -4.4);
  leftLampLight.castShadow = true;
  scene.add(leftLampLight);

  const rightLampLight = new THREE.PointLight(0xffd8a8, 12, 8);
  rightLampLight.position.set(3.5, 3.1, -4.4);
  rightLampLight.castShadow = true;
  scene.add(rightLampLight);

  new RGBELoader().load(
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/peppermint_powerplant_1k.hdr",
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

  const woodMat  = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7,  metalness: 0.05 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3,  metalness: 0.8  });
  const goldMat  = new THREE.MeshStandardMaterial({ color: 0xc8960c, roughness: 0.2,  metalness: 0.9, envMapIntensity: 1.5 });

  // ==============================================
  // Floor
  // ==============================================
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = SURFACE_NAMES.floor;
  scene.add(floor);

  // ==============================================
  // Walls
  // ==============================================
  const backWallMat  = makeWallMat();
  const leftWallMat  = makeWallMat();
  const rightWallMat = makeWallMat();

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), backWallMat);
  backWall.position.set(0, 3, -6);
  backWall.receiveShadow = true;
  backWall.name = SURFACE_NAMES.wallBack;
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), leftWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-7, 3, 0);
  leftWall.receiveShadow = true;
  leftWall.name = SURFACE_NAMES.wallLeft;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), rightWallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(7, 3, 0);
  rightWall.receiveShadow = true;
  rightWall.name = SURFACE_NAMES.wallRight;
  scene.add(rightWall);

  onWallMaterialsReady([backWallMat, leftWallMat, rightWallMat]);

  // Crown moulding
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 });
  const crownBack = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 0.1), crownMat);
  crownBack.position.set(0, 5.95, -5.95); scene.add(crownBack);
  const crownL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 12), crownMat);
  crownL.position.set(-6.95, 5.95, 0); scene.add(crownL);
  const crownR = crownL.clone(); crownR.position.x = 6.95; scene.add(crownR);

  // Skirting
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.65 });
  const skirtBack = new THREE.Mesh(new THREE.BoxGeometry(14, 0.12, 0.06), skirtMat);
  skirtBack.position.set(0, 0.06, -5.97); scene.add(skirtBack);
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 12), skirtMat);
  skirtL.position.set(-6.97, 0.06, 0); scene.add(skirtL);
  const skirtR = skirtL.clone(); skirtR.position.x = 6.97; scene.add(skirtR);

  // ==============================================
  // Ceiling
  // ==============================================
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 6;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // ==============================================
  // Bed — MOVABLE (all parts inside bedGroup)
  // ==============================================
  const bedGroup = new THREE.Group();

  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 7.2), woodMat);
  bedBase.position.y = 0.175; bedBase.castShadow = true; bedGroup.add(bedBase);

  for (const sx of [-2.6, 2.6]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 6.6), woodMat);
    rail.position.set(sx, 0.55, 0.1); rail.castShadow = true; bedGroup.add(rail);
  }

  const footboard = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.65, 0.18), woodMat);
  footboard.position.set(0, 0.5, 3.35); footboard.castShadow = true; bedGroup.add(footboard);

  const headboard = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 0.5), woodMat);
  headboard.position.set(0, 1.6, -3.35); headboard.castShadow = true; bedGroup.add(headboard);

  const hbPadding = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 2.4, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x8a7060, roughness: 0.95 })
  );
  hbPadding.position.set(0, 1.7, -3.09); bedGroup.add(hbPadding);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(5.08, 0.48, 6.5),
    new THREE.MeshStandardMaterial({ color: 0xc8bfb5, roughness: 0.9 })
  );
  mattress.position.set(0, 0.59, 0.05); mattress.castShadow = true; bedGroup.add(mattress);

  for (let i = -1.3; i <= 1.3; i += 2.6) {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.25, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf5f0eb, roughness: 0.9 })
    );
    pillow.position.set(i, 0.9, -2.55); pillow.rotation.x = -0.08; bedGroup.add(pillow);
  }

  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 0.18, 5.2),
    new THREE.MeshStandardMaterial({ color: 0x3d5a78, roughness: 0.92 })
  );
  blanket.position.set(0, 0.88, 0.9); blanket.castShadow = true; bedGroup.add(blanket);

  bedGroup.position.set(0, 0, -2.55);
  markMovable(bedGroup, "furniture_bed", "Bed");
  scene.add(bedGroup);

  // ==============================================
  // Nightstands — MOVABLE (lamp is separate, placed on top)
  // ==============================================
  function createNightstand(x: number) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), woodMat);
    body.position.y = 0.75; body.castShadow = true; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), woodMat);
    top.position.y = 1.54; top.castShadow = true; g.add(top);
    const drawer = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.4, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 })
    );
    drawer.position.set(0, 0.9, 0.575); g.add(drawer);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12), goldMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.9, 0.62); g.add(handle);

    // Decorative items on nightstand — inside group so they move with it
    const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.008, 20),
      new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.9 }));
    coaster.position.set(0.2, 1.624, 0.1); g.add(coaster);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 }));
    mug.position.set(0.2, 1.675, 0.1); g.add(mug);
    // Small book
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.8 }));
    book.position.set(-0.2, 1.625, -0.1); g.add(book);

    g.position.set(x, 0, -2.55);
    markMovable(g, x < 0 ? "furniture_nightstand_left" : "furniture_nightstand_right",
      x < 0 ? "Left Nightstand" : "Right Nightstand");
    scene.add(g);
  }

  createNightstand(-3.5);
  createNightstand(3.5);

  // ==============================================
  // Bedside Lamps — MOVABLE
  // ==============================================
  const leftShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6d3, roughness: 0.9,
    emissive: 0xffaa44, emissiveIntensity: 1.0,
    side: THREE.DoubleSide, transparent: true, opacity: 0.92,
  });
  const rightShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6d3, roughness: 0.9,
    emissive: 0xffaa44, emissiveIntensity: 1.0,
    side: THREE.DoubleSide, transparent: true, opacity: 0.92,
  });

  function createLamp(x: number, shadeMat: THREE.MeshStandardMaterial, shadeName: string) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.08, 24), goldMat);
    base.position.y = 0.04; g.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 12), goldMat);
    pole.position.y = 0.48; g.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffeeaa, emissive: 0xffdd88, emissiveIntensity: 1.5 }));
    bulb.position.y = 0.87; g.add(bulb);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.18, 0.38, 24, 1, true), shadeMat);
    shade.position.y = 0.88;
    shade.name = shadeName;
    g.add(shade);
    g.position.set(x, 1.58, -2.55);
    markMovable(g, x < 0 ? "furniture_lamp_left" : "furniture_lamp_right",
      x < 0 ? "Left Lamp" : "Right Lamp");
    scene.add(g);
  }

  createLamp(-3.5, leftShadeMat,  LAMP_NAMES.leftShade);
  createLamp( 3.5, rightShadeMat, LAMP_NAMES.rightShade);

  // ==============================================
  // Wall Clock
  // ==============================================
  const clockGroup = new THREE.Group();
  const clockFrameMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.3 })
  );
  clockFrameMesh.rotation.x = Math.PI / 2; clockGroup.add(clockFrameMesh);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.8 }));
  clockFace.position.z = 0.06; clockGroup.add(clockFace);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x000000 }));
    m.position.set(Math.sin(a) * 0.38, Math.cos(a) * 0.38, 0.07); m.rotation.z = -a; clockGroup.add(m);
  }
  const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x000000 }));
  hHand.position.set(0, 0.08, 0.08); hHand.rotation.z = Math.PI / 6; clockGroup.add(hHand);
  const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x000000 }));
  mHand.position.set(0, 0.12, 0.08); mHand.rotation.z = -Math.PI / 4; clockGroup.add(mHand);
  const pinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0x000000 }));
  pinMesh.rotation.x = Math.PI / 2; pinMesh.position.z = 0.09; clockGroup.add(pinMesh);
  clockGroup.position.set(0, 4.2, -5.92);
  scene.add(clockGroup);

  // ==============================================
  // Split AC
  // ==============================================
  const acGroup = new THREE.Group();
  const acBodyMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.35, metalness: 0.12 });
  const acChassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.38, 0.22), acBodyMat);
  acGroup.add(acChassis);
  const acFaceplate = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.34, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xfafaf8, roughness: 0.2, metalness: 0.08 }));
  acFaceplate.position.set(0, 0, 0.13); acGroup.add(acFaceplate);
  for (let i = -5; i <= 5; i++) {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.012, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xd8d8d5, roughness: 0.6, metalness: 0.15 }));
    grille.position.set(0, 0.1 + i * 0.005, 0.12); acGroup.add(grille);
  }
  const outletSlot = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xb0b0ae, roughness: 0.7, metalness: 0.1 }));
  outletSlot.position.set(0, -0.15, 0.13); acGroup.add(outletSlot);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.03, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xe8e8e5, roughness: 0.4, metalness: 0.1 }));
  flap.position.set(0, -0.17, 0.14); flap.rotation.x = 0.35; acGroup.add(flap);
  for (let i = -4; i <= 4; i++) {
    const louvre = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.06, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xccccca, roughness: 0.5 }));
    louvre.position.set(i * 0.26, -0.15, 0.13); acGroup.add(louvre);
  }
  const ctrlPanel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.065),
    new THREE.MeshStandardMaterial({ color: 0xf0f0ee, roughness: 0.25, metalness: 0.1 }));
  ctrlPanel.position.set(1.05, 0.02, 0.13); acGroup.add(ctrlPanel);
  const powerLed = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 2.0 }));
  powerLed.position.set(0.96, 0.06, 0.165); acGroup.add(powerLed);
  const modeLed = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 1.5 }));
  modeLed.position.set(1.06, 0.06, 0.165); acGroup.add(modeLed);
  const brandBar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.025, 0.015),
    new THREE.MeshStandardMaterial({ color: 0xc8c8c6, roughness: 0.3, metalness: 0.5 }));
  brandBar.position.set(-0.6, 0.0, 0.16); acGroup.add(brandBar);
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.045, 0.28), acBodyMat);
  ledge.position.set(0, -0.21, 0.02); acGroup.add(ledge);
  acGroup.rotation.y = -Math.PI / 2;
  acGroup.position.set(6.82, 4.55, -1.5);
  scene.add(acGroup);

  // ==============================================
  // Wardrobe — MOVABLE
  // ==============================================
  const wardrobeGroup = new THREE.Group();
  const wardrobeBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5, 4), woodMat);
  wardrobeBody.position.y = 2.5; wardrobeBody.castShadow = true; wardrobeGroup.add(wardrobeBody);
  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.8, 1.9),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 }));
  leftDoor.position.set(0.76, 2.5, -0.95); wardrobeGroup.add(leftDoor);
  const rightDoor = leftDoor.clone(); rightDoor.position.z = 0.95; wardrobeGroup.add(rightDoor);
  for (const z of [-0.95, 0.95]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.15, 12), goldMat);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(0.84, 2.5, z + (z > 0 ? -0.3 : 0.3)); wardrobeGroup.add(wh);
  }
  wardrobeGroup.position.set(-6, 0, -2);
  markMovable(wardrobeGroup, "furniture_wardrobe", "Wardrobe");
  scene.add(wardrobeGroup);

  // ==============================================
  // Dresser — MOVABLE (mirror added to dresser group)
  // ==============================================
  const dresserGroup = new THREE.Group();
  const dresserBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.2), woodMat);
  dresserBody.position.y = 0.9; dresserBody.castShadow = true; dresserGroup.add(dresserBody);
  const dresserTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.25), woodMat);
  dresserTop.position.y = 1.84; dresserGroup.add(dresserTop);
  for (let i = 0; i < 3; i++) {
    const dr = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 }));
    dr.position.set(0, 0.3 + i * 0.6, 0.575); dresserGroup.add(dr);
    for (const x of [-0.5, 0.5]) {
      const dh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), goldMat);
      dh.position.set(x, 0.3 + i * 0.6, 0.62); dresserGroup.add(dh);
    }
  }
  // Decor on dresser top — inside group so moves with dresser
  const perfumeBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 }));
  perfumeBottle.position.set(-0.8, 1.93, 0); dresserGroup.add(perfumeBottle);
  const smallPlant = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a6030, roughness: 0.85 }));
  smallPlant.position.set(0.7, 1.97, 0.1); dresserGroup.add(smallPlant);
  const smallPot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 14),
    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.8 }));
  smallPot.position.set(0.7, 1.9, 0.1); dresserGroup.add(smallPot);

  // Mirror attached to dresser group — sits on top of dresser, facing forward
  const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.4 }));
  mirrorFrame.position.set(0, 3.08, -0.55); dresserGroup.add(mirrorFrame);
  const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xe8f0f8, metalness: 1.0, roughness: 0.02, envMapIntensity: 2.5 }));
  mirrorGlass.position.set(0, 3.08, -0.52); dresserGroup.add(mirrorGlass);

  dresserGroup.position.set(5.5, 0, 3);
  dresserGroup.rotation.y = -Math.PI / 2;
  markMovable(dresserGroup, "furniture_dresser", "Dresser");
  scene.add(dresserGroup);

  // ==============================================
  // Plant — MOVABLE
  // ==============================================
  const plantGroup = new THREE.Group();
  const plantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.4, 24),
    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.8 }));
  plantPot.position.set(0, 0.2, 0); plantGroup.add(plantPot);
  // Pot rim
  const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.014, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.8 }));
  potRim.rotation.x = Math.PI / 2; potRim.position.y = 0.4; plantGroup.add(potRim);
  // Leaves
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a6b3a, roughness: 0.8 }));
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.15, 0.5 + Math.random() * 0.3, Math.sin(a) * 0.15);
    plantGroup.add(leaf);
  }
  plantGroup.position.set(-5.5, 0, 3);
  markMovable(plantGroup, "furniture_plant", "Plant");
  scene.add(plantGroup);

  return {
    leftLampLight,
    rightLampLight,
    leftShadeMat,
    rightShadeMat,
    ambientLight,
    hemisphereLight,
    movables,
  };
}