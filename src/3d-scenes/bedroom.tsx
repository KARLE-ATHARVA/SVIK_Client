
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

export const TUBE_LIGHT_NAMES = {
  tube1: "bedroom_tube_light_1",
  tube2: "bedroom_tube_light_2",
} as const;

export interface BedroomRefs {
  leftLampLight:    THREE.PointLight;
  rightLampLight:   THREE.PointLight;
  leftShadeMat:     THREE.MeshStandardMaterial;
  rightShadeMat:    THREE.MeshStandardMaterial;
  ambientLight:     THREE.AmbientLight;
  hemisphereLight:  THREE.HemisphereLight;
  movables:         THREE.Group[];
  tubeLight1:       THREE.PointLight;
  tubeLight2:       THREE.PointLight;
  tubeMat1:         THREE.MeshStandardMaterial;
  tubeMat2:         THREE.MeshStandardMaterial;
  handleLightClick: (name: string) => boolean;
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

  /**
   * Register a group as a movable furniture piece.
   * Only TOP-LEVEL groups should be registered — child groups (lamps inside
   * nightstands) must NOT be registered separately or they will be dragged
   * independently.
   */
  const markMovable = (obj: THREE.Group, name: string, label: string) => {
    obj.userData.movable = true;
    obj.userData.label   = label;
    obj.name = name;
    movables.push(obj);
  };

  // ─────────────────────────────────────────────
  // Scene & Fog
  // ─────────────────────────────────────────────
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 15, 30);

  // ─────────────────────────────────────────────
  // Lighting
  // ─────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
  scene.add(hemisphereLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
  sunLight.position.set(0, 15, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near   = 0.5;
  sunLight.shadow.camera.far    = 40;
  sunLight.shadow.camera.left   = -12;
  sunLight.shadow.camera.right  =  12;
  sunLight.shadow.camera.top    =  10;
  sunLight.shadow.camera.bottom = -10;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);

  // const ceilingLight = new THREE.PointLight(0xfff8f0, 15, 30, 2);
  // ceilingLight.position.set(0, 5.5, 0);
  // ceilingLight.castShadow = true;
  // scene.add(ceilingLight);
  const ceilingLight = new THREE.PointLight(0xfff8f0, 15, 30, 2);
  ceilingLight.position.set(0, 5.5, 0);
  ceilingLight.castShadow = true;
  scene.add(ceilingLight);

  const tubeLight1PL = new THREE.PointLight(0xfff8f0, 20, 28, 1.5);
  tubeLight1PL.position.set(-4.0, 5.4, 0);
  tubeLight1PL.castShadow = true;
  scene.add(tubeLight1PL);

  const tubeLight2PL = new THREE.PointLight(0xfff8f0, 20, 28, 1.5);
  tubeLight2PL.position.set(4.0, 5.4, 0);
  tubeLight2PL.castShadow = true;
  scene.add(tubeLight2PL);

  // NOTE: leftLampLight / rightLampLight are created INSIDE their lamp groups

  // NOTE: leftLampLight / rightLampLight are created INSIDE their lamp groups
  // below so they automatically follow when the nightstand is dragged.
  // We declare them here so we can return them from this function.
  let leftLampLight!:  THREE.PointLight;
  let rightLampLight!: THREE.PointLight;

  new RGBELoader().load(
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/peppermint_powerplant_1k.hdr",
    (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      // scene.environment = hdr;
    }
  );

  // ─────────────────────────────────────────────
  // Shared materials
  // ─────────────────────────────────────────────
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    metalness: 0.0,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.05,
  });
  onFloorMaterialReady(floorMat);

  const makeWallMat = () => new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    metalness: 0.0,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });

  // const woodMat  = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7,  metalness: 0.05 });
  // const metalMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3,  metalness: 0.8  }); // eslint-disable-line @typescript-eslint/no-unused-vars
  // const goldMat  = new THREE.MeshStandardMaterial({ color: 0xc8960c, roughness: 0.2,  metalness: 0.9, envMapIntensity: 1.5 });
const woodMat  = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7,  metalness: 0.05 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3,  metalness: 0.8  }); // eslint-disable-line @typescript-eslint/no-unused-vars
  const goldMat  = new THREE.MeshStandardMaterial({ color: 0xc8960c, roughness: 0.2,  metalness: 0.9, envMapIntensity: 1.5 });

  const tubeMat1 = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.12, metalness: 0.1,
    emissive: new THREE.Color(0xfff8f0), emissiveIntensity: 3.0,
    transparent: true, opacity: 0.92,
  });
  const tubeMat2 = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.12, metalness: 0.1,
    emissive: new THREE.Color(0xfff8f0), emissiveIntensity: 3.0,
    transparent: true, opacity: 0.92,
  });
  // ─────────────────────────────────────────────
  // Floor
  // ─────────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = SURFACE_NAMES.floor;
  scene.add(floor);

  // ─────────────────────────────────────────────
  // Walls
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Ceiling
  // ─────────────────────────────────────────────
  // const ceiling = new THREE.Mesh(
  //   new THREE.PlaneGeometry(14, 12),
  //   new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide })
  // );
  // ceiling.rotation.x = Math.PI / 2;
  // ceiling.position.y = 6;
  // ceiling.receiveShadow = true;
  // scene.add(ceiling);
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 6;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // ─────────────────────────────────────────────
  // Tube light fixtures
  // ─────────────────────────────────────────────
  function createBedTubeLight(
    x: number,
    mat: THREE.MeshStandardMaterial,
    tubeName: string
  ) {
    const g = new THREE.Group();

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.07, 3.0),
      new THREE.MeshStandardMaterial({ color: 0xe0e0e4, roughness: 0.3, metalness: 0.7 })
    );
    housing.position.y = -0.035;
    g.add(housing);

    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.025, 2.9),
      mat
    );
    diffuser.position.y = -0.06;
    diffuser.name = tubeName;
    g.add(diffuser);

    for (const ez of [-1.52, 1.52]) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.07, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xb8b8bc, roughness: 0.4, metalness: 0.5 })
      );
      cap.position.set(0, -0.035, ez);
      g.add(cap);
    }

    g.position.set(x, 5.95, 0);
    scene.add(g);

    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    proxy.name = tubeName;
    proxy.position.set(x, 1.8, 0);
    scene.add(proxy);
  }

  createBedTubeLight(-4.0, tubeMat1, TUBE_LIGHT_NAMES.tube1);
  createBedTubeLight( 4.0, tubeMat2, TUBE_LIGHT_NAMES.tube2);

  // ─────────────────────────────────────────────
  // Lamp shade materials (shared so toggle works)

  // ─────────────────────────────────────────────
  // Lamp shade materials (shared so toggle works)
  // ─────────────────────────────────────────────
  const leftShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6d3, roughness: 0.9,
    emissive: new THREE.Color(0xffaa44), emissiveIntensity: 1.0,
    side: THREE.DoubleSide, transparent: true, opacity: 0.92,
  });
  const rightShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6d3, roughness: 0.9,
    emissive: new THREE.Color(0xffaa44), emissiveIntensity: 1.0,
    side: THREE.DoubleSide, transparent: true, opacity: 0.92,
  });

  // ─────────────────────────────────────────────
  // Helper: build a bedside lamp and embed it into a parent group.
  //
  // The lamp's local origin is at the nightstand top surface (y = 0 inside
  // the lamp group, which sits at y = 1.58 relative to the nightstand group).
  // The PointLight is added to this same group so it travels with the lamp —
  // and therefore with the nightstand — automatically.
  // ─────────────────────────────────────────────
  function addLampToGroup(
    parent: THREE.Group,
    localX: number,
    localY: number,
    localZ: number,
    shadeMat: THREE.MeshStandardMaterial,
    shadeName: string,
    isLeft: boolean,
  ): THREE.PointLight {
    const lampGroup = new THREE.Group();
    lampGroup.name = isLeft ? "furniture_lamp_left" : "furniture_lamp_right";
    // Do NOT mark as movable — it inherits movement from the nightstand parent.

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.08, 24), goldMat);
    base.position.y = 0.04;
    base.castShadow = true;
    lampGroup.add(base);

    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 12), goldMat);
    pole.position.y = 0.48;
    pole.castShadow = true;
    lampGroup.add(pole);

    // Bulb (decorative glow sphere)
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffeeaa, emissive: new THREE.Color(0xffdd88), emissiveIntensity: 1.5 }),
    );
    bulb.position.y = 0.87;
    lampGroup.add(bulb);

    // Shade
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.18, 0.38, 24, 1, true),
      shadeMat,
    );
    shade.position.y = 0.88;
    shade.name = shadeName;
    shade.castShadow = true;
    lampGroup.add(shade);

    // PointLight — child of lampGroup so it moves with the nightstand.
    // Position is relative to lampGroup origin (bulb height).
    const pointLight = new THREE.PointLight(0xffd8a8, 12, 8);
    pointLight.position.set(0, 0.87, 0); // at bulb height inside lampGroup
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.set(512, 512); // keep perf reasonable
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far  = 8;
    lampGroup.add(pointLight);

    // Place lamp group inside the parent nightstand group
    lampGroup.position.set(localX, localY, localZ);
    parent.add(lampGroup);

    return pointLight;
  }

  // ─────────────────────────────────────────────
  // Helper: build a nightstand (with lamp embedded)
  // ─────────────────────────────────────────────
  function createNightstand(
    x: number,
    shadeMat: THREE.MeshStandardMaterial,
    shadeName: string,
    isLeft: boolean,
  ): THREE.PointLight {
    const g = new THREE.Group();

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), woodMat);
    body.position.y = 0.75; body.castShadow = true; g.add(body);

    // Top surface
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), woodMat);
    top.position.y = 1.54; top.castShadow = true; g.add(top);

    // Drawer front
    const drawer = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.4, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 }),
    );
    drawer.position.set(0, 0.9, 0.575); g.add(drawer);

    // Drawer handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12), goldMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.9, 0.62); g.add(handle);

    // Decorative items on top surface
    const coaster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.008, 20),
      new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.9 }),
    );
    coaster.position.set(0.2, 1.624, 0.1); g.add(coaster);

    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.035, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 }),
    );
    mug.position.set(0.2, 1.675, 0.1); g.add(mug);

    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.03, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.8 }),
    );
    book.position.set(-0.2, 1.625, -0.1); g.add(book);

    // ── Embed lamp at top-surface height (y = 1.58 above nightstand base) ──
    // localY = 1.58 puts the lamp base just above the top surface (1.54 + 0.04 rim)
    const pointLight = addLampToGroup(g, 0, 1.58, 0, shadeMat, shadeName, isLeft);

    // Position & register the whole nightstand (lamp included) as one movable
    g.position.set(x, 0, -2.55);
    markMovable(
      g,
      isLeft ? "furniture_nightstand_left" : "furniture_nightstand_right",
      isLeft ? "Left Nightstand" : "Right Nightstand",
    );
    scene.add(g);

    return pointLight;
  }

  leftLampLight  = createNightstand(-3.5, leftShadeMat,  LAMP_NAMES.leftShade,  true);
  rightLampLight = createNightstand( 3.5, rightShadeMat, LAMP_NAMES.rightShade, false);

  // ─────────────────────────────────────────────
  // Bed — MOVABLE
  // ─────────────────────────────────────────────
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
    new THREE.MeshStandardMaterial({ color: 0x8a7060, roughness: 0.95 }),
  );
  hbPadding.position.set(0, 1.7, -3.09); bedGroup.add(hbPadding);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(5.08, 0.48, 6.5),
    new THREE.MeshStandardMaterial({ color: 0xc8bfb5, roughness: 0.9 }),
  );
  mattress.position.set(0, 0.59, 0.05); mattress.castShadow = true; bedGroup.add(mattress);

  for (let i = -1.3; i <= 1.3; i += 2.6) {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.25, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf5f0eb, roughness: 0.9 }),
    );
    pillow.position.set(i, 0.9, -2.55); pillow.rotation.x = -0.08; bedGroup.add(pillow);
  }

  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 0.18, 5.2),
    new THREE.MeshStandardMaterial({ color: 0x3d5a78, roughness: 0.92 }),
  );
  blanket.position.set(0, 0.88, 0.9); blanket.castShadow = true; bedGroup.add(blanket);

  bedGroup.position.set(0, 0, -2.55);
  markMovable(bedGroup, "furniture_bed", "Bed");
  scene.add(bedGroup);

  // ─────────────────────────────────────────────
  // Wall Clock
  // ─────────────────────────────────────────────
  const clockGroup = new THREE.Group();
  const clockFrameMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.3 }),
  );
  clockFrameMesh.rotation.x = Math.PI / 2; clockGroup.add(clockFrameMesh);

  const clockFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 32),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.8 }),
  );
  clockFace.position.z = 0.06; clockGroup.add(clockFace);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x000000 }),
    );
    m.position.set(Math.sin(a) * 0.38, Math.cos(a) * 0.38, 0.07);
    m.rotation.z = -a;
    clockGroup.add(m);
  }

  const hHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.2, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x000000 }),
  );
  hHand.position.set(0, 0.08, 0.08); hHand.rotation.z = Math.PI / 6; clockGroup.add(hHand);

  const mHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.3, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x000000 }),
  );
  mHand.position.set(0, 0.12, 0.08); mHand.rotation.z = -Math.PI / 4; clockGroup.add(mHand);

  const pinMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0x000000 }),
  );
  pinMesh.rotation.x = Math.PI / 2; pinMesh.position.z = 0.09; clockGroup.add(pinMesh);
  clockGroup.position.set(0, 4.2, -5.92);
  scene.add(clockGroup);

  // ─────────────────────────────────────────────
  // Split AC
  // ─────────────────────────────────────────────
  const acGroup = new THREE.Group();
  const acBodyMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.35, metalness: 0.12 });

  const acChassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.38, 0.22), acBodyMat);
  acGroup.add(acChassis);

  const acFaceplate = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.34, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xfafaf8, roughness: 0.2, metalness: 0.08 }),
  );
  acFaceplate.position.set(0, 0, 0.13); acGroup.add(acFaceplate);

  for (let i = -5; i <= 5; i++) {
    const grille = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.012, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xd8d8d5, roughness: 0.6, metalness: 0.15 }),
    );
    grille.position.set(0, 0.1 + i * 0.005, 0.12); acGroup.add(grille);
  }

  const outletSlot = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xb0b0ae, roughness: 0.7, metalness: 0.1 }),
  );
  outletSlot.position.set(0, -0.15, 0.13); acGroup.add(outletSlot);

  const flap = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 0.03, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xe8e8e5, roughness: 0.4, metalness: 0.1 }),
  );
  flap.position.set(0, -0.17, 0.14); flap.rotation.x = 0.35; acGroup.add(flap);

  for (let i = -4; i <= 4; i++) {
    const louvre = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.06, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xccccca, roughness: 0.5 }),
    );
    louvre.position.set(i * 0.26, -0.15, 0.13); acGroup.add(louvre);
  }

  const ctrlPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.22, 0.065),
    new THREE.MeshStandardMaterial({ color: 0xf0f0ee, roughness: 0.25, metalness: 0.1 }),
  );
  ctrlPanel.position.set(1.05, 0.02, 0.13); acGroup.add(ctrlPanel);

  const powerLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: new THREE.Color(0x00ff66), emissiveIntensity: 2.0 }),
  );
  powerLed.position.set(0.96, 0.06, 0.165); acGroup.add(powerLed);

  const modeLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: new THREE.Color(0x44aaff), emissiveIntensity: 1.5 }),
  );
  modeLed.position.set(1.06, 0.06, 0.165); acGroup.add(modeLed);

  const brandBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.025, 0.015),
    new THREE.MeshStandardMaterial({ color: 0xc8c8c6, roughness: 0.3, metalness: 0.5 }),
  );
  brandBar.position.set(-0.6, 0.0, 0.16); acGroup.add(brandBar);

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.045, 0.28), acBodyMat);
  ledge.position.set(0, -0.21, 0.02); acGroup.add(ledge);

  acGroup.rotation.y = -Math.PI / 2;
  acGroup.position.set(6.82, 4.55, -1.5);
  scene.add(acGroup);

  // ─────────────────────────────────────────────
  // Wardrobe — MOVABLE
  // ─────────────────────────────────────────────
  const wardrobeGroup = new THREE.Group();

  const wardrobeBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5, 4), woodMat);
  wardrobeBody.position.y = 2.5; wardrobeBody.castShadow = true; wardrobeGroup.add(wardrobeBody);

  const leftDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 4.8, 1.9),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 }),
  );
  leftDoor.position.set(0.76, 2.5, -0.95); wardrobeGroup.add(leftDoor);

  const rightDoor = leftDoor.clone();
  rightDoor.position.z = 0.95;
  wardrobeGroup.add(rightDoor);

  for (const z of [-0.95, 0.95]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.15, 12), goldMat);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(0.84, 2.5, z + (z > 0 ? -0.3 : 0.3));
    wardrobeGroup.add(wh);
  }

  wardrobeGroup.position.set(-6, 0, -2);
  markMovable(wardrobeGroup, "furniture_wardrobe", "Wardrobe");
  scene.add(wardrobeGroup);

  // ─────────────────────────────────────────────
  // Dresser — MOVABLE (mirror attached inside group)
  // ─────────────────────────────────────────────
  const dresserGroup = new THREE.Group();

  const dresserBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.2), woodMat);
  dresserBody.position.y = 0.9; dresserBody.castShadow = true; dresserGroup.add(dresserBody);

  const dresserTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.25), woodMat);
  dresserTop.position.y = 1.84; dresserGroup.add(dresserTop);

  for (let i = 0; i < 3; i++) {
    const dr = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.5, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 }),
    );
    dr.position.set(0, 0.3 + i * 0.6, 0.575); dresserGroup.add(dr);
    for (const x of [-0.5, 0.5]) {
      const dh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), goldMat);
      dh.position.set(x, 0.3 + i * 0.6, 0.62); dresserGroup.add(dh);
    }
  }

  const perfumeBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 }),
  );
  perfumeBottle.position.set(-0.8, 1.93, 0); dresserGroup.add(perfumeBottle);

  const smallPlant = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a6030, roughness: 0.85 }),
  );
  smallPlant.position.set(0.7, 1.97, 0.1); dresserGroup.add(smallPlant);

  const smallPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.06, 0.12, 14),
    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.8 }),
  );
  smallPot.position.set(0.7, 1.9, 0.1); dresserGroup.add(smallPot);

  const mirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 2.2, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.4 }),
  );
  mirrorFrame.position.set(0, 3.08, -0.55); dresserGroup.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xe8f0f8, metalness: 1.0, roughness: 0.02, envMapIntensity: 2.5 }),
  );
  mirrorGlass.position.set(0, 3.08, -0.52); dresserGroup.add(mirrorGlass);

  dresserGroup.position.set(5.5, 0, 3);
  dresserGroup.rotation.y = -Math.PI / 2;
  markMovable(dresserGroup, "furniture_dresser", "Dresser");
  scene.add(dresserGroup);

  // ─────────────────────────────────────────────
  // Plant — MOVABLE
  // ─────────────────────────────────────────────
  const plantGroup = new THREE.Group();

  const plantPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.2, 0.4, 24),
    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.8 }),
  );
  plantPot.position.set(0, 0.2, 0); plantGroup.add(plantPot);

  const potRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.014, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.8 }),
  );
  potRim.rotation.x = Math.PI / 2; potRim.position.y = 0.4; plantGroup.add(potRim);

  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a6b3a, roughness: 0.8 }),
    );
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.15, 0.5 + Math.random() * 0.3, Math.sin(a) * 0.15);
    plantGroup.add(leaf);
  }

  plantGroup.position.set(-5.5, 0, 3);
  markMovable(plantGroup, "furniture_plant", "Plant");
  scene.add(plantGroup);

const lightStates = { tube1: true, tube2: true };
  const defaults = {
    tube1: { light: 20, emissive: 3.0 },
    tube2: { light: 20, emissive: 3.0 },
  };

  function handleLightClick(name: string): boolean {
    if (name === TUBE_LIGHT_NAMES.tube1) {
      lightStates.tube1 = !lightStates.tube1;
      const on = lightStates.tube1;
      tubeLight1PL.intensity     = on ? defaults.tube1.light : 0;
      tubeMat1.emissiveIntensity = on ? defaults.tube1.emissive : 0;
      tubeMat1.emissive.set(on ? 0xfff8f0 : 0x000000);
      return true;
    }
    if (name === TUBE_LIGHT_NAMES.tube2) {
      lightStates.tube2 = !lightStates.tube2;
      const on = lightStates.tube2;
      tubeLight2PL.intensity     = on ? defaults.tube2.light : 0;
      tubeMat2.emissiveIntensity = on ? defaults.tube2.emissive : 0;
      tubeMat2.emissive.set(on ? 0xfff8f0 : 0x000000);
      return true;
    }
    return false;
  }

  return {
    leftLampLight,
    rightLampLight,
    leftShadeMat,
    rightShadeMat,
    ambientLight,
    hemisphereLight,
    movables,
    tubeLight1: tubeLight1PL,
    tubeLight2: tubeLight2PL,
    tubeMat1,
    tubeMat2,
    handleLightClick,
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// SMOOTH DRAG CONTROLLER
//
// Drop this into your scene's pointer-event setup to replace the existing
// drag logic. It uses lerp-based damping so movement feels fluid.
//
// Usage:
//   const dragger = createFurnitureDragger(camera, renderer.domElement, scene);
//   // in your animation loop:
//   dragger.update();
// ═══════════════════════════════════════════════════════════════════════════

// export interface FurnitureDragger {
//   /** Call every frame inside requestAnimationFrame to apply damped movement. */
//   update: () => void;
//   /** Clean up event listeners. */
//   dispose: () => void;
// }

// export function createFurnitureDragger(
//   camera: THREE.Camera,
//   domElement: HTMLElement,
//   scene: THREE.Scene,
//   movables: THREE.Group[],
// ): FurnitureDragger {
//   const DAMPING    = 0.12;  // 0 = no movement, 1 = instant (lower = smoother)
//   const FLOOR_Y    = 0;
//   const raycaster  = new THREE.Raycaster();
//   const pointer    = new THREE.Vector2();

//   // Invisible drag plane at floor level
//   const dragPlane  = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y);
//   const _intersect = new THREE.Vector3();

//   let dragging:     THREE.Group | null = null;
//   let targetPos:    THREE.Vector3      = new THREE.Vector3();
//   let dragOffset:   THREE.Vector3      = new THREE.Vector3();

//   function getNDC(e: PointerEvent) {
//     const rect = domElement.getBoundingClientRect();
//     pointer.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
//     pointer.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
//   }

//   function getRayPlaneHit(): THREE.Vector3 | null {
//     raycaster.setFromCamera(pointer, camera);
//     const hit = new THREE.Vector3();
//     if (raycaster.ray.intersectPlane(dragPlane, hit)) return hit;
//     return null;
//   }

//   function findMovableAncestor(object: THREE.Object3D): THREE.Group | null {
//     let o: THREE.Object3D | null = object;
//     while (o) {
//       if (o.userData.movable) return o as THREE.Group;
//       o = o.parent;
//     }
//     return null;
//   }

//   function onPointerDown(e: PointerEvent) {
//     if (e.button !== 0) return;
//     getNDC(e);
//     raycaster.setFromCamera(pointer, camera);

//     // Collect all meshes inside movable groups for hit-testing
//     const meshes: THREE.Object3D[] = [];
//     movables.forEach(g => g.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); }));

//     const hits = raycaster.intersectObjects(meshes, true);
//     if (!hits.length) return;

//     const ancestor = findMovableAncestor(hits[0].object);
//     if (!ancestor) return;

//     const hit = getRayPlaneHit();
//     if (!hit) return;

//     dragging  = ancestor;
//     dragOffset.copy(ancestor.position).sub(hit);
//     targetPos.copy(ancestor.position);
//     domElement.setPointerCapture(e.pointerId);
//   }

//   function onPointerMove(e: PointerEvent) {
//     if (!dragging) return;
//     getNDC(e);
//     const hit = getRayPlaneHit();
//     if (!hit) return;
//     // Update the TARGET, not the object directly — lerp in update()
//     targetPos.copy(hit).add(dragOffset);
//     targetPos.y = FLOOR_Y; // keep on floor
//   }

//   function onPointerUp(e: PointerEvent) {
//     if (!dragging) return;
//     domElement.releasePointerCapture(e.pointerId);
//     dragging = null;
//   }

//   domElement.addEventListener("pointerdown", onPointerDown);
//   domElement.addEventListener("pointermove", onPointerMove);
//   domElement.addEventListener("pointerup",   onPointerUp);

//   function update() {
//     if (!dragging) return;
//     // Lerp current position toward target — this is the smoothness
//     dragging.position.lerp(targetPos, DAMPING);
//   }

//   function dispose() {
//     domElement.removeEventListener("pointerdown", onPointerDown);
//     domElement.removeEventListener("pointermove", onPointerMove);
//     domElement.removeEventListener("pointerup",   onPointerUp);
//   }

//   return { update, dispose };
// }

export interface FurnitureDragger {
  /** Call every frame inside requestAnimationFrame to apply damped movement. */
  update: () => void;
  /** Clean up event listeners. */
  dispose: () => void;
}
 
// ── Tuning constants ────────────────────────────────────────────────────────
const MIN_DAMPING  = 0.18;   // floor — prevents micro-lag at rest
const MAX_DAMPING  = 0.40;   // ceiling — prevents over-shoot on fast drag
const SPEED_SCALE  = 0.18;   // how strongly distance boosts damping
const SNAP_GRID    = 0;      // set e.g. 0.25 for grid snapping, 0 = off
const HIGHLIGHT    = 0x333333; // emissive boost while dragging (subtle glow)
// ───────────────────────────────────────────────────────────────────────────
 
export function createFurnitureDragger(
  camera:     THREE.Camera,
  domElement: HTMLElement,
  scene:      THREE.Scene,         // kept for API compatibility
  movables:   THREE.Group[],
): FurnitureDragger {
 
  const raycaster  = new THREE.Raycaster();
  const pointer    = new THREE.Vector2();
 
  // ── Dynamic drag plane (camera-facing, placed at click point) ──────────
  // This is the #1 reason objects feel "attached" to the cursor.
  // Instead of always projecting onto y=0, we project onto a plane that:
  //   • faces the camera
  //   • passes through the exact 3-D point where the user clicked
  // Result: the grabbed point under the cursor never drifts.
  const dragPlane  = new THREE.Plane();
  const _intersect = new THREE.Vector3();
 
  let dragging:   THREE.Group | null = null;
  let targetPos   = new THREE.Vector3();
  let dragOffset  = new THREE.Vector3();
 
  // Track original emissive values so we can restore them on release
  const savedEmissive = new Map<THREE.MeshStandardMaterial, THREE.Color>();
 
  // ── Helpers ────────────────────────────────────────────────────────────
  function getNDC(e: PointerEvent) {
    const r = domElement.getBoundingClientRect();
    pointer.x =  ((e.clientX - r.left) / r.width)  * 2 - 1;
    pointer.y = -((e.clientY - r.top)  / r.height) * 2 + 1;
  }
 
  function getRayPlaneHit(): THREE.Vector3 | null {
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(dragPlane, hit) ? hit : null;
  }
 
  function findMovableAncestor(obj: THREE.Object3D): THREE.Group | null {
    let o: THREE.Object3D | null = obj;
    while (o) {
      if (o.userData.movable) return o as THREE.Group;
      o = o.parent;
    }
    return null;
  }
 
  function snap(v: number): number {
    return SNAP_GRID > 0 ? Math.round(v / SNAP_GRID) * SNAP_GRID : v;
  }
 
  // Lift emissive on all child meshes while dragging
  function applyHighlight(group: THREE.Group) {
    group.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat || !('emissive' in mat)) return;
      if (!savedEmissive.has(mat)) {
        savedEmissive.set(mat, mat.emissive.clone());
      }
      mat.emissive.set(HIGHLIGHT);
    });
  }
 
  function removeHighlight() {
    savedEmissive.forEach((saved, mat) => {
      mat.emissive.copy(saved);
    });
    savedEmissive.clear();
  }
 
  // ── Pointer events ──────────────────────────────────────────────────────
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    getNDC(e);
    raycaster.setFromCamera(pointer, camera);
 
    // Hit-test against all meshes inside movable groups
    const meshes: THREE.Object3D[] = [];
    movables.forEach(g => g.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); }));
 
    const hits = raycaster.intersectObjects(meshes, true);
    if (!hits.length) return;
 
    const ancestor = findMovableAncestor(hits[0].object);
    if (!ancestor) return;
 
    // ── Camera-facing drag plane through the exact click point ────────────
    // planeNormal = direction from camera toward scene (reversed = facing us)
    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);        // points INTO screen
    // We want the plane to face the camera, so negate:
    planeNormal.negate();
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, hits[0].point);
 
    // ── Exact hit-point offset — ZERO jump on pickup ──────────────────────
    // Use hits[0].point (mesh surface) not a re-projected plane hit.
    dragOffset.copy(ancestor.position).sub(hits[0].point);
 
    targetPos.copy(ancestor.position);
 
    dragging = ancestor;
    applyHighlight(ancestor);
    domElement.style.cursor = "grabbing";
    domElement.setPointerCapture(e.pointerId);
  }
 
  function onPointerMove(e: PointerEvent) {
    if (!dragging) {
      // Show "grab" cursor when hovering a movable
      getNDC(e);
      raycaster.setFromCamera(pointer, camera);
      const meshes: THREE.Object3D[] = [];
      movables.forEach(g => g.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c); }));
      const hits = raycaster.intersectObjects(meshes, true);
      const overMovable = hits.length > 0 && !!findMovableAncestor(hits[0].object);
      domElement.style.cursor = overMovable ? "grab" : "";
      return;
    }
 
    getNDC(e);
    const hit = getRayPlaneHit();
    if (!hit) return;
 
    // Apply drag offset and optional grid snap
    targetPos.set(
      snap(hit.x + dragOffset.x),
      dragging.position.y,          // keep Y locked — no vertical drift
      snap(hit.z + dragOffset.z),
    );
  }
 
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    removeHighlight();
    domElement.releasePointerCapture(e.pointerId);
    domElement.style.cursor = "";
    dragging = null;
  }
 
  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup",   onPointerUp);
  domElement.addEventListener("pointercancel", onPointerUp);
 
  // ── Per-frame update ────────────────────────────────────────────────────
  function update() {
    if (!dragging) return;
 
    // Adaptive damping: farther from target → snappier response
    const dist = dragging.position.distanceTo(targetPos);
    const t    = THREE.MathUtils.clamp(dist * SPEED_SCALE, MIN_DAMPING, MAX_DAMPING);
 
    dragging.position.lerp(targetPos, t);
  }
 

  function dispose() {
    domElement.removeEventListener("pointerdown",   onPointerDown);
    domElement.removeEventListener("pointermove",   onPointerMove);
    domElement.removeEventListener("pointerup",     onPointerUp);
    domElement.removeEventListener("pointercancel", onPointerUp);
    domElement.style.cursor = "";
  }
 
  return { update, dispose };
}
// ═══════════════════════════════════════════════════════════════════════════
// LAMP TOGGLE HELPER
//
// Call this when the user clicks a lamp or nightstand to toggle the light.
//
// It traverses the group hierarchy to find the shade mesh and its sibling
// PointLight, so it works correctly now that the lamp is embedded inside
// the nightstand group.
//
// Usage:
//   toggleLamp(clickedGroup, leftShadeMat,  leftLampLight);
//   toggleLamp(clickedGroup, rightShadeMat, rightLampLight);
// ═══════════════════════════════════════════════════════════════════════════

export function toggleLampByName(
  root: THREE.Group,
  shadeName: string,
  shadeMat: THREE.MeshStandardMaterial,
  light: THREE.PointLight,
): void {
  // Find the shade mesh anywhere in the hierarchy
  let found = false;
  root.traverse((child) => {
    if (child.name === shadeName) found = true;
  });
  if (!found) return;

  const isOn = light.intensity > 0;

  if (isOn) {
    // Turn off
    light.intensity = 0;
    shadeMat.emissiveIntensity = 0;
  } else {
    // Turn on
    light.intensity = 12;
    shadeMat.emissiveIntensity = 1.0;
  }
}