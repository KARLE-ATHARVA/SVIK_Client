
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export const SURFACE_NAMES = {
  floor: "surface_floor",
  wallBack: "surface_wall_back",
  wallLeft: "surface_wall_left",
  wallRight: "surface_wall_right",
} as const;

export type SurfaceName = typeof SURFACE_NAMES[keyof typeof SURFACE_NAMES];
export const WALL_MAT_INDEX = { back: 0, left: 1, right: 2 } as const;

export const LIVING_LIGHT_NAMES = {
  floorShade:   "living_lamp_shade",
  pendantShade: "living_pendant_shade",
  tubeLight1:   "living_tube_light_1",
  tubeLight2:   "living_tube_light_2",
} as const;

export interface LivingRoomRefs {
  floorLampLight:  THREE.PointLight;
  pendantLight:    THREE.PointLight;
  tubeLight1:      THREE.PointLight;
  tubeLight2:      THREE.PointLight;
  tubeMat1:        THREE.MeshStandardMaterial;
  tubeMat2:        THREE.MeshStandardMaterial;
  floorShadeMat:   THREE.MeshStandardMaterial;
  pendantShadeMat: THREE.MeshStandardMaterial;
  ambientLight:    THREE.AmbientLight;
  hemisphereLight: THREE.HemisphereLight;
  movables:        THREE.Group[];
  /** Call this when a light-related mesh is clicked */
  handleLightClick: (name: string) => boolean;
}

interface SceneBuilderProps {
  scene: THREE.Scene;
  onFloorMaterialReady: (material: THREE.MeshStandardMaterial) => void;
  onWallMaterialsReady: (materials: THREE.MeshStandardMaterial[]) => void;
}

export function buildLivingRoomScene({
  scene,
  onFloorMaterialReady,
  onWallMaterialsReady,
}: SceneBuilderProps): LivingRoomRefs {

  const movables: THREE.Group[] = [];
  const markMovable = (obj: THREE.Group, name: string, label: string) => {
    obj.userData.movable = true;
    obj.userData.label   = label;
    obj.name = name;
    movables.push(obj);
  };

  // ==============================================
  // Scene & Fog — warm evening atmosphere
  // ==============================================
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 15, 30);

  // ==============================================
  // MATERIALS
  // ==============================================

  // Floor — ready for tile overlay
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    metalness: 0.0,
    // emissive: new THREE.Color(0xffffff),
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.05,
  });
  onFloorMaterialReady(floorMat);

  // All walls plain white
  // const makeWallMat = (col = 0xffffff) =>
  //   new THREE.MeshStandardMaterial({
  //     color: col,
  //     roughness: 0.9,
  //     metalness: 0.0,
  //     // emissive: new THREE.Color(0xffffff),
  //     emissive: new THREE.Color(0x000000),
  //     emissiveIntensity: 0.05,
  //     side: THREE.DoubleSide,
  //   });
  const makeWallMat = (col = 0xffffff) =>
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,   // ← match floor exactly
    metalness: 0.0,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });

  // Sofa — deep ocean velvet
  const sofaVelvet = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.85,
    metalness: 0.05,
  });
  // Cushions — warm cream
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0xf2ead8,
    roughness: 0.9,
    metalness: 0.0,
  });
  // Throw blanket — terracotta
  const throwMat = new THREE.MeshStandardMaterial({
    color: 0xb35a35,
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2d1a0e,
    roughness: 0.55,
    metalness: 0.04,
  });
  const lightWoodMat = new THREE.MeshStandardMaterial({
    color: 0x8b6340,
    roughness: 0.62,
    metalness: 0.04,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xc8960c,
    roughness: 0.2,
    metalness: 0.9,
    envMapIntensity: 1.5,
  });
  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    roughness: 0.3,
    metalness: 0.85,
  });
  const marbletopMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d8,
    roughness: 0.18,
    metalness: 0.02,
    envMapIntensity: 0.9,
  });
  const tvFrameMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    roughness: 0.25,
    metalness: 0.7,
  });
  const tvScreenMat = new THREE.MeshStandardMaterial({
    color: 0x080e18,
    roughness: 0.08,
    metalness: 0.6,
    emissive: 0x1a3a6a,
    emissiveIntensity: 0.8,
  });

  // Glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8e0f5,
    roughness: 0.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.15,
    transmission: 0,
    ior: 1.52,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  } as any);

  // Lamp shades
  const floorShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6c8,
    roughness: 0.9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    emissive: 0xff9922,
    emissiveIntensity: 2.0,
  });

  const pendantShadeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.35,
    metalness: 0.65,
    side: THREE.DoubleSide,
    emissive: 0xfff0d0,
    emissiveIntensity: 1.2,
  });

  const tubeMat1 = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.1,
    emissive: 0xfff8f0,
    emissiveIntensity: 3.0,
  });
  const tubeMat2 = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.1,
    emissive: 0xfff8f0,
    emissiveIntensity: 3.0,
  });

  // ==============================================
  // LIGHTING
  // ==============================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
  scene.add(hemisphereLight);

  const sunLight = new THREE.DirectionalLight(0xfff8e8, 0.8);
  sunLight.position.set(0, 15, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 40;
  sunLight.shadow.camera.left = -10;
  sunLight.shadow.camera.right = 10;
  sunLight.shadow.camera.top = 10;
  sunLight.shadow.camera.bottom = -10;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);

  const floorLampLight = new THREE.PointLight(0xfff0d8, 12, 8);
  floorLampLight.position.set(-7, 2.2, 3);
  floorLampLight.castShadow = true;
  floorLampLight.shadow.mapSize.set(512, 512);
  floorLampLight.shadow.bias = -0.001;
  scene.add(floorLampLight);

  const pendantLight = new THREE.PointLight(0xfff5e6, 15, 8);
  pendantLight.position.set(5, 4.2, 0);
  pendantLight.castShadow = true;
  pendantLight.shadow.mapSize.set(512, 512);
  scene.add(pendantLight);

  const tubeLight1 = new THREE.PointLight(0xfff8f0, 22, 14);
  tubeLight1.position.set(-4, 5.6, -1);
  tubeLight1.castShadow = true;
  tubeLight1.shadow.mapSize.set(512, 512);
  scene.add(tubeLight1);

  const tubeLight2 = new THREE.PointLight(0xfff8f0, 22, 14);
  tubeLight2.position.set(5, 5.6, -1);
  tubeLight2.castShadow = true;
  tubeLight2.shadow.mapSize.set(512, 512);
  scene.add(tubeLight2);

  const tvGlow = new THREE.RectAreaLight(0x4080ff, 3, 2.2, 1.2);
  tvGlow.position.set(-4, 1.5, -7.85);
  scene.add(tvGlow);

  // HDRI environment
  new RGBELoader().load(
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/peppermint_powerplant_1k.hdr",
    (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      //scene.environment = hdr;
    }
  );

  // ==============================================
  // LIGHT TOGGLE STATE
  // ==============================================
  const lightStates = {
    floor:   true,
    pendant: true,
    tube1:   true,
    tube2:   true,
  };

  const defaults = {
    floorLamp:   { light: 12,  shade: 2.0,  emissive: 0xff9922 as number },
    pendant:     { light: 15,  shade: 1.2,  emissive: 0xfff0d0 as number },
    tube1:       { light: 22,  emissive: 3.0 },
    tube2:       { light: 22,  emissive: 3.0 },
  };

  function handleLightClick(name: string): boolean {
    if (name === LIVING_LIGHT_NAMES.floorShade) {
      lightStates.floor = !lightStates.floor;
      const on = lightStates.floor;
      floorLampLight.intensity        = on ? defaults.floorLamp.light : 0;
      floorShadeMat.emissiveIntensity = on ? defaults.floorLamp.shade : 0;
      floorShadeMat.emissive.set(on ? defaults.floorLamp.emissive : 0x000000);
      return true;
    }
    if (name === LIVING_LIGHT_NAMES.pendantShade) {
      lightStates.pendant = !lightStates.pendant;
      const on = lightStates.pendant;
      pendantLight.intensity            = on ? defaults.pendant.light : 0;
      pendantShadeMat.emissiveIntensity = on ? defaults.pendant.shade : 0;
      pendantShadeMat.emissive.set(on ? defaults.pendant.emissive : 0x000000);
      return true;
    }
    if (name === LIVING_LIGHT_NAMES.tubeLight1) {
      lightStates.tube1 = !lightStates.tube1;
      const on = lightStates.tube1;
      tubeLight1.intensity       = on ? defaults.tube1.light : 0;
      tubeMat1.emissiveIntensity = on ? defaults.tube1.emissive : 0;
      tubeMat1.emissive.set(on ? 0xfff8f0 : 0x000000);
      return true;
    }
    if (name === LIVING_LIGHT_NAMES.tubeLight2) {
      lightStates.tube2 = !lightStates.tube2;
      const on = lightStates.tube2;
      tubeLight2.intensity       = on ? defaults.tube2.light : 0;
      tubeMat2.emissiveIntensity = on ? defaults.tube2.emissive : 0;
      tubeMat2.emissive.set(on ? 0xfff8f0 : 0x000000);
      return true;
    }
    return false;
  }

  // ==============================================
  // FLOOR
  // ==============================================
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = SURFACE_NAMES.floor;
  scene.add(floor);

  // ==============================================
  // WALLS
  // ==============================================
  const backWallMat  = makeWallMat();
  const leftWallMat  = makeWallMat();
  const rightWallMat = makeWallMat();

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 7), backWallMat);
  backWall.position.set(0, 3.5, -8);
  backWall.receiveShadow = true;
  backWall.name = SURFACE_NAMES.wallBack;
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), leftWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-10, 3.5, 0);
  leftWall.receiveShadow = true;
  leftWall.name = SURFACE_NAMES.wallLeft;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), rightWallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(10, 3.5, 0);
  rightWall.receiveShadow = true;
  rightWall.name = SURFACE_NAMES.wallRight;
  scene.add(rightWall);

  onWallMaterialsReady([backWallMat, leftWallMat, rightWallMat]);

  // Crown moulding
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 });
  const crownBack = new THREE.Mesh(new THREE.BoxGeometry(20, 0.12, 0.12), crownMat);
  crownBack.position.set(0, 6.94, -7.94); scene.add(crownBack);
  const crownL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 16), crownMat);
  crownL.position.set(-9.94, 6.94, 0); scene.add(crownL);
  const crownR = crownL.clone(); crownR.position.x = 9.94; scene.add(crownR);

  // Skirting board
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.65 });
  const skirtBack = new THREE.Mesh(new THREE.BoxGeometry(20, 0.14, 0.08), skirtMat);
  skirtBack.position.set(0, 0.07, -7.96); scene.add(skirtBack);
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 16), skirtMat);
  skirtL.position.set(-9.96, 0.07, 0); scene.add(skirtL);
  const skirtR = skirtL.clone(); skirtR.position.x = 9.96; scene.add(skirtR);

  // ==============================================
  // CEILING — coffered detail
  // ==============================================
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 7;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  const cofferMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 });
  for (let x = -8; x <= 8; x += 4) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 16), cofferMat);
    beam.position.set(x, 6.95, 0); scene.add(beam);
  }
  for (let z = -6; z <= 6; z += 4) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 0.12), cofferMat);
    beam.position.set(0, 6.95, z); scene.add(beam);
  }

  // ==============================================
  // WINDOWS
  // ==============================================
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.75 });
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0xd8c8a0, roughness: 0.95, metalness: 0.0,
    transparent: true, opacity: 0.45, side: THREE.DoubleSide,
  });

  // ── Window mask material ──────────────────────────────────────────────────
  // Matches makeWallMat() exactly so the masked area blends with the wall.
  // Placed in front of the wall plane, it covers the tile/texture overlay
  // so tiles do NOT render inside window openings.
  const windowMaskMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.05,
    side: THREE.FrontSide,
  });
  // ─────────────────────────────────────────────────────────────────────────

  function makeWallWindow(wallX: number, zCenter: number, side: number) {
    const W = 1.4; const H = 1.8; const FT = 0.05;
    const OFF = side * 0.025;
    const centerY = 1.1 + H / 2;
    const g = new THREE.Group();

    // ── TILE MASK ──────────────────────────────────────────────────────────
    // An opaque wall-coloured plane sitting just in front of the wall mesh.
    // It occludes the tile texture in this window region so tiles appear to
    // stop at the window edges rather than continuing behind the frame.
    // renderOrder 0 ensures everything else (sky, glass, frame) draws on top.
    const maskPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(W + 0.6, H + 0.7),
      windowMaskMat
    );
    maskPanel.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    // 4 cm toward the room interior so it clears the wall surface z-fighting
    maskPanel.position.set(side * 0.04, 0, 0);
    maskPanel.renderOrder = 0;
    g.add(maskPanel);
    // ──────────────────────────────────────────────────────────────────────

    // Night sky background
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(W - FT * 2, H * 0.55),
      new THREE.MeshBasicMaterial({ color: 0x08102a, side: THREE.DoubleSide })
    );
    sky.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    sky.position.set(OFF - side * 0.04, H * 0.225, 0);
    sky.renderOrder = 1;
    g.add(sky);

    // City / tree silhouette
    const city = new THREE.Mesh(
      new THREE.PlaneGeometry(W - FT * 2, H * 0.45),
      new THREE.MeshBasicMaterial({ color: 0x1a2840, side: THREE.DoubleSide })
    );
    city.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    city.position.set(OFF - side * 0.04, -H * 0.225, 0);
    city.renderOrder = 1;
    g.add(city);

    // City glow point light
    const cityGlow = new THREE.PointLight(0x3060c0, 1.5, 5);
    cityGlow.position.set(OFF - side * 0.3, 0, 0);
    g.add(cityGlow);

    // Glass pane
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), glassMat);
    glass.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    glass.position.set(OFF, 0, 0);
    glass.renderOrder = 2;
    g.add(glass);

    // Window frame bars
    const makeBar = (bx: number, by: number, bz: number, px: number, py: number, pz: number) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bx, by, bz), frameMat);
      bar.position.set(px, py, pz); g.add(bar);
    };
    makeBar(FT, FT, W + FT * 2, OFF,  H / 2, 0);
    makeBar(FT, FT, W + FT * 2, OFF, -H / 2, 0);
    makeBar(FT, H,  FT,          OFF, 0, -W / 2);
    makeBar(FT, H,  FT,          OFF, 0,  W / 2);
    makeBar(FT, FT, W,           OFF, H * 0.08, 0);

    // Gold curtain rod
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, W + 1.0, 16),
      goldMat
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.set(OFF + side * 0.06, H / 2 + 0.22, 0);
    g.add(rod);
    for (const dz of [-(W + 1.0) / 2, (W + 1.0) / 2]) {
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), goldMat);
      fin.position.set(OFF + side * 0.06, H / 2 + 0.22, dz);
      g.add(fin);
    }

    // Curtain panels
    for (const sign of [-1, 1]) {
      const curtGeo = new THREE.PlaneGeometry(0.38, H + 0.55);
      const curt = new THREE.Mesh(curtGeo, curtainMat);
      curt.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      curt.position.set(OFF + side * 0.04, 0.1, sign * (W / 2 + 0.2));
      g.add(curt);
    }

    g.position.set(wallX, centerY, zCenter);
    scene.add(g);
  }

  makeWallWindow(-10, -3.2,  1);
  makeWallWindow(-10,  3.2,  1);
  makeWallWindow( 10, -3.2, -1);
  makeWallWindow( 10,  3.2, -1);

  // ==============================================
  // TUBE LIGHT FIXTURES (ceiling)
  // ==============================================
  function makeTubeFixture(px: number, pz: number, diffMat: THREE.MeshStandardMaterial, lightName: string) {
    const g = new THREE.Group();

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.06, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xc8c8cc, roughness: 0.3, metalness: 0.75 })
    );
    housing.position.y = -0.03; g.add(housing);

    const diffuser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.85, 16),
      diffMat
    );
    diffuser.rotation.z = Math.PI / 2;
    diffuser.position.y = -0.07;
    diffuser.name = `${lightName}_visual`;
    g.add(diffuser);

    for (const sx of [-0.93, 0.93]) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.035, 12),
        new THREE.MeshStandardMaterial({ color: 0xa0a0a8, metalness: 0.8, roughness: 0.25 })
      );
      cap.rotation.z = Math.PI / 2;
      cap.position.set(sx, -0.07, 0);
      g.add(cap);
    }

    g.position.set(px, 6.97, pz);
    scene.add(g);

    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    proxy.name = lightName;
    proxy.position.set(px, 3.5, pz);
    scene.add(proxy);
  }

  makeTubeFixture(-4, -1, tubeMat1, LIVING_LIGHT_NAMES.tubeLight1);
  makeTubeFixture( 5, -1, tubeMat2, LIVING_LIGHT_NAMES.tubeLight2);

  // ==============================================
  // SOFA — L-shaped sectional
  // ==============================================
  const sofaGroup = new THREE.Group();

  const legMat = blackMetalMat;
  function addSofaLeg(x: number, z: number) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), legMat);
    leg.position.set(x, 0.06, z);
    sofaGroup.add(leg);
  }

  const seatMain = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 1.1), sofaVelvet);
  seatMain.position.set(0, 0.29, 0); sofaGroup.add(seatMain);
  const padMain = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 1.0), sofaVelvet);
  padMain.position.set(0, 0.41, 0); sofaGroup.add(padMain);
  const backMain = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.85, 0.22), sofaVelvet);
  backMain.position.set(0, 0.8, -0.44); sofaGroup.add(backMain);
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 1.1), sofaVelvet);
  arm1.position.set(-1.69, 0.52, 0); sofaGroup.add(arm1);
  const arm2 = arm1.clone(); arm2.position.x = 1.69; sofaGroup.add(arm2);

  for (let i = -1; i <= 1; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.24, 0.98), cushionMat);
    c.position.set(i * 1.1, 0.54, 0.02); c.castShadow = true; sofaGroup.add(c);
  }
  for (let i = -1; i <= 1; i++) {
    const bc = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.55, 0.2), cushionMat);
    bc.position.set(i * 1.1, 0.82, -0.3); sofaGroup.add(bc);
  }

  const throwBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.8), throwMat);
  throwBlanket.position.set(1.5, 0.72, 0.1);
  throwBlanket.rotation.z = 0.3;
  sofaGroup.add(throwBlanket);

  addSofaLeg(-1.62, -0.48); addSofaLeg(1.62, -0.48);
  addSofaLeg(-1.62,  0.48); addSofaLeg(1.62,  0.48);

  sofaGroup.position.set(-4, 0, 3.2);
  sofaGroup.rotation.y = Math.PI;
  markMovable(sofaGroup, 'furniture_sofa', 'Sofa');
  scene.add(sofaGroup);

  // ==============================================
  // ACCENT CHAIR
  // ==============================================
  const chairGroup = new THREE.Group();
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x8b6a40, roughness: 0.8 });
  const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.85), chairMat);
  cSeat.position.y = 0.44; chairGroup.add(cSeat);
  const cPad = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.8), cushionMat);
  cPad.position.y = 0.54; chairGroup.add(cPad);
  const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.18), chairMat);
  cBack.position.set(0, 0.88, -0.335); chairGroup.add(cBack);
  const cBackPad = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.12), cushionMat);
  cBackPad.position.set(0, 0.88, -0.25); chairGroup.add(cBackPad);
  for (const s of [-1, 1]) {
    const cArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.85), chairMat);
    cArm.position.set(s * 0.365, 0.62, 0); chairGroup.add(cArm);
  }
  for (const [x, z] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) {
    const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.35, 12), goldMat);
    cLeg.position.set(x, 0.175, z); chairGroup.add(cLeg);
  }
  chairGroup.position.set(-1.5, 0, 0.5);
  chairGroup.rotation.y = -Math.PI / 8;
  markMovable(chairGroup, 'furniture_accent_chair', 'Accent Chair');
  scene.add(chairGroup);

  // ==============================================
  // COFFEE TABLE — marble top, brass pedestal
  // ==============================================
  const tableGroup = new THREE.Group();
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 48), marbletopMat);
  tableTop.position.y = 0.44; tableTop.castShadow = true; tableGroup.add(tableTop);
  for (let i = 0; i < 3; i++) {
    const vein = new THREE.Mesh(
      new THREE.TorusGeometry(0.3 + i * 0.15, 0.005, 4, 32, Math.PI * 0.4),
      new THREE.MeshStandardMaterial({ color: 0xc0b090, roughness: 0.2 })
    );
    vein.rotation.x = -Math.PI / 2;
    vein.rotation.z = (i * 1.2);
    vein.position.y = 0.48;
    tableGroup.add(vein);
  }
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 0.42, 24), goldMat);
  pedestal.position.y = 0.21; tableGroup.add(pedestal);
  const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 32), goldMat);
  baseDisc.position.y = 0.02; tableGroup.add(baseDisc);
  const shelfGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 48), glassMat);
  shelfGlass.position.y = 0.22; tableGroup.add(shelfGlass);
  tableGroup.position.set(-4, 0, 0.8);
  markMovable(tableGroup, 'furniture_coffee_table', 'Coffee Table');
  scene.add(tableGroup);

  const candleMat = new THREE.MeshStandardMaterial({ color: 0xf5eed0, roughness: 0.9 });
  for (const dx of [-0.25, 0, 0.25]) {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08 + Math.abs(dx) * 0.1, 10), candleMat);
    candle.position.set(dx, 0.52, 0); tableGroup.add(candle);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff9900 })
    );
    flame.position.set(dx, 0.61 + Math.abs(dx) * 0.05, 0); tableGroup.add(flame);
  }
  const candleLight = new THREE.PointLight(0xff8800, 2.5, 2.5);
  candleLight.position.set(0, 0.65, 0); tableGroup.add(candleLight);

  const bookMat = new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.8 });
  const coffeeBook = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.22), bookMat);
  coffeeBook.position.set(-0.2, 0.5, -0.1); tableGroup.add(coffeeBook);
  const smallVase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.03, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a3a2a, roughness: 0.2, metalness: 0.3 })
  );
  smallVase.position.set(0.3, 0.57, 0.1); tableGroup.add(smallVase);

  // ==============================================
  // TV UNIT — floating wall-mounted
  // ==============================================
  const tvGroup = new THREE.Group();
  const console1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 0.55), darkWoodMat);
  console1.position.set(0, 0.5, 0); tvGroup.add(console1);
  for (const x of [-1.8, 0, 1.8]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), blackMetalMat);
    bracket.position.set(x, 0.125, 0); tvGroup.add(bracket);
  }
  for (const x of [-1.8, 0, 1.8]) {
    const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), goldMat);
    pull.rotation.z = Math.PI / 2;
    pull.position.set(x, 0.5, 0.28); tvGroup.add(pull);
  }
  const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.7, 0.06), tvFrameMat);
  tvFrame.position.set(0, 1.85, -0.02); tvGroup.add(tvFrame);
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 1.58), tvScreenMat);
  tvScreen.position.set(0, 1.85, 0.04); tvGroup.add(tvScreen);
  const tvLogo = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.015, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 })
  );
  tvLogo.position.set(0, 1.0, 0.04); tvGroup.add(tvLogo);
  tvGroup.position.set(-4, 0.25, -7.4);
  markMovable(tvGroup, 'furniture_tv', 'TV & Console');
  scene.add(tvGroup);

  // ==============================================
  // BOOKSHELF
  // ==============================================
  const bookshelf = new THREE.Group();
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 0.06), darkWoodMat);
  shelfBack.position.y = 1.6; bookshelf.add(shelfBack);
  for (let i = 0; i < 6; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.05, 0.42), darkWoodMat);
    shelf.position.set(0, i * 0.6 + 0.02, 0.18); bookshelf.add(shelf);
  }
  for (const sx of [-0.97, 0.97]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.2, 0.42), darkWoodMat);
    side.position.set(sx, 1.6, 0.18); bookshelf.add(side);
  }
  const bookColors2 = [0xc84040, 0x4060a0, 0x508040, 0xd09020, 0x804080, 0x206060, 0xe05030];
  for (let s = 0; s < 5; s++) {
    let x = -0.88;
    while (x < 0.88) {
      const w = 0.1 + Math.random() * 0.12;
      const h = 0.28 + Math.random() * 0.24;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 0.24),
        new THREE.MeshStandardMaterial({ color: bookColors2[Math.floor(Math.random() * bookColors2.length)], roughness: 0.85 })
      );
      book.position.set(x + w / 2, s * 0.6 + 0.18 + h / 2, 0.18);
      book.rotation.y = (Math.random() - 0.5) * 0.06;
      book.castShadow = true; bookshelf.add(book);
      x += w + 0.01;
    }
    if (s % 2 === 0) {
      const deco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.04, 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.25, metalness: 0.75 })
      );
      deco.position.set(0.75, s * 0.6 + 0.22, 0.18); bookshelf.add(deco);
    }
  }
  bookshelf.position.set(-8.7, 0, -5.5);
  bookshelf.rotation.y = Math.PI / 2;
  markMovable(bookshelf, 'furniture_bookshelf', 'Bookshelf');
  scene.add(bookshelf);

  // ==============================================
  // SIDE TABLE — marble + gold
  // ==============================================
  const sideTableGroup = new THREE.Group();
  const sttop = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 32), marbletopMat);
  sttop.position.y = 0.62; sideTableGroup.add(sttop);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.6, 12), goldMat);
    tleg.position.set(Math.cos(a) * 0.22, 0.3, Math.sin(a) * 0.22);
    tleg.rotation.z = Math.sin(a) * 0.1;
    sideTableGroup.add(tleg);
  }
  const tlampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.35, 12),
    goldMat
  );
  tlampPole.position.y = 0.82; sideTableGroup.add(tlampPole);
  const tlampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.13, 0.22, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xf5e8d0, roughness: 0.9, side: THREE.DoubleSide,
      transparent: true, opacity: 0.88,
      emissive: 0xff9922, emissiveIntensity: 1.5,
    })
  );
  tlampShade.position.y = 1.05; sideTableGroup.add(tlampShade);
  const tableLampLight = new THREE.PointLight(0xff8822, 8, 4.5);
  tableLampLight.position.y = 1.1;
  sideTableGroup.add(tableLampLight);
  const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.008, 20),
    new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.9 }));
  coaster.position.y = 0.648; sideTableGroup.add(coaster);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 16),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 }));
  mug.position.y = 0.705; sideTableGroup.add(mug);
  sideTableGroup.position.set(-1, 0, 3.5);
  markMovable(sideTableGroup, 'furniture_side_table', 'Side Table');
  scene.add(sideTableGroup);

  // ==============================================
  // FLOOR LAMP — sculptural arc lamp
  // ==============================================
  const lampGroup = new THREE.Group();
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.06, 32), darkWoodMat);
  lampBase.position.y = 0.03; lampGroup.add(lampBase);
  const marbleWeight = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32), marbletopMat);
  marbleWeight.position.y = 0.07; lampGroup.add(marbleWeight);
  const poleMat = blackMetalMat;
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 10), poleMat);
    seg.position.set(t * 0.7, 0.16 + t * 1.8, 0);
    seg.rotation.z = -t * 0.5;
    lampGroup.add(seg);
  }
  const arcShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.28, 0.38, 32, 1, true),
    floorShadeMat
  );
  arcShade.position.set(0.65, 2.05, 0);
  arcShade.castShadow = true;
  arcShade.name = LIVING_LIGHT_NAMES.floorShade;
  lampGroup.add(arcShade);
  const innerDiff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.24, 0.3, 32, 1, false),
    new THREE.MeshStandardMaterial({ color: 0xfff8e8, roughness: 0.9, transparent: true, opacity: 0.6 })
  );
  innerDiff.position.set(0.65, 2.05, 0); lampGroup.add(innerDiff);
  lampGroup.position.set(-7.2, 0, 3.5);
  markMovable(lampGroup, 'furniture_floor_lamp', 'Floor Lamp');
  scene.add(lampGroup);

  const floorLampProxy = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  floorLampProxy.name = LIVING_LIGHT_NAMES.floorShade;
  floorLampProxy.position.set(-7.2 + 0.65, 2.05, 3.5);
  scene.add(floorLampProxy);

  // ==============================================
  // WALL ART — Gallery wall
  // ==============================================
  const artFrameLarge = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 1.5, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })
  );
  artFrameLarge.position.set(3.5, 3.0, -7.92);
  scene.add(artFrameLarge);
  const artCanvas1 = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.7 })
  );
  artCanvas1.position.set(3.5, 3.0, -7.88);
  scene.add(artCanvas1);
  for (const [cx, cy, col] of [[3.2, 3.2, 0xc84040], [3.8, 2.8, 0xe0a030], [3.5, 3.0, 0xf0f0f0]]) {
    const cb = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.3),
      new THREE.MeshStandardMaterial({ color: col as number, roughness: 0.8 })
    );
    cb.position.set(cx as number, cy as number, -7.86);
    scene.add(cb);
  }
  const picLight = new THREE.SpotLight(0xffe8c0, 15, 3, Math.PI / 10, 0.5);
  picLight.position.set(3.5, 4.2, -7.5);
  picLight.target.position.set(3.5, 3.0, -7.9);
  scene.add(picLight);
  scene.add(picLight.target);

  const photoFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.85, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.3, metalness: 0.7 })
  );
  photoFrame.position.set(6.0, 2.8, -7.92);
  scene.add(photoFrame);
  const photoCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 0.8 })
  );
  photoCanvas.position.set(6.0, 2.8, -7.88);
  scene.add(photoCanvas);

  const mirrorRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.06, 12, 48),
    goldMat
  );
  mirrorRim.position.set(7.5, 2.8, -7.92);
  scene.add(mirrorRim);
  const mirrorGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.63, 48),
    new THREE.MeshStandardMaterial({
      color: 0xd8e8f0, roughness: 0.0, metalness: 0.9, envMapIntensity: 2.0,
    })
  );
  mirrorGlass.position.set(7.5, 2.8, -7.89);
  scene.add(mirrorGlass);

  // ==============================================
  // PLANT — tall fiddle leaf fig
  // ==============================================
  const plantGroup = new THREE.Group();
  const potMat = new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.75, metalness: 0.0 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.38, 24), potMat);
  pot.position.y = 0.19; plantGroup.add(pot);
  const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.015, 8, 32), potMat);
  potRim.rotation.x = Math.PI / 2;
  potRim.position.y = 0.38; plantGroup.add(potRim);
  const soilMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.21, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.98 })
  );
  soilMesh.rotation.x = -Math.PI / 2; soilMesh.position.y = 0.385; plantGroup.add(soilMesh);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.2, 12), lightWoodMat);
  trunk.position.y = 0.98; trunk.rotation.z = 0.05; plantGroup.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.75, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const h = 0.6 + Math.random() * 0.8;
    const leafGeo = new THREE.CircleGeometry(0.22, 12);
    leafGeo.scale(0.68, 1.0, 1.0);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(a) * 0.2, 1.2 + h * 0.6, Math.sin(a) * 0.2);
    leaf.rotation.y = a;
    leaf.rotation.z = -0.3;
    leaf.castShadow = true; plantGroup.add(leaf);
  }
  plantGroup.position.set(8.5, 0, 5.5);
  markMovable(plantGroup, 'furniture_plant', 'Fiddle Leaf Plant');
  scene.add(plantGroup);

  // ==============================================
  // DINING AREA
  // ==============================================
  const diningGroup = new THREE.Group();
  const diningTableTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 1.8), lightWoodMat);
  diningTableTop.position.set(0, 0.75, 0); diningTableTop.castShadow = true; diningGroup.add(diningTableTop);
  for (const x of [-1.5, 1.5]) for (const z of [-0.75, 0.75]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), lightWoodMat);
    leg.position.set(x, 0.375, z); leg.castShadow = true; diningGroup.add(leg);
  }

  function addChair(x: number, z: number, rotation: number) {
    const cg = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), lightWoodMat);
    seat.position.y = 0.5; seat.castShadow = true; cg.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.05), lightWoodMat);
    back.position.set(0, 0.75, -0.2); back.castShadow = true; cg.add(back);
    for (const lx of [-0.18, 0.18]) for (const lz of [-0.18, 0.18]) {
      const cleg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12), lightWoodMat);
      cleg.position.set(lx, 0.25, lz); cleg.castShadow = true; cg.add(cleg);
    }
    cg.position.set(x, 0, z); cg.rotation.y = rotation; diningGroup.add(cg);
  }
  addChair(-2,   0,    Math.PI / 2);
  addChair(-2,   0.9,  Math.PI / 2);
  addChair( 2,   0,   -Math.PI / 2);
  addChair( 2,   0.9, -Math.PI / 2);
  addChair( 0,   1.5,  Math.PI);
  addChair( 0,  -1.7,  0);

  const centerpiece = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.12, 0.25, 24),
    new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6, metalness: 0.2 })
  );
  centerpiece.position.set(0, 0.92, -0.5); centerpiece.castShadow = true; diningGroup.add(centerpiece);
  diningGroup.position.set(5, 0, 0);
  markMovable(diningGroup, 'furniture_dining_set', 'Dining Set');
  scene.add(diningGroup);

  // ==============================================
  // PENDANT LAMP above dining table
  // ==============================================
  const pendantCord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })
  );
  pendantCord.position.set(5, 5.9, 0); scene.add(pendantCord);

  const pendantShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.28, 32),
    pendantShadeMat
  );
  pendantShade.position.set(5, 4.6, 0);
  pendantShade.castShadow = true;
  pendantShade.name = LIVING_LIGHT_NAMES.pendantShade;
  scene.add(pendantShade);

  const pendantProxy = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  pendantProxy.name = LIVING_LIGHT_NAMES.pendantShade;
  pendantProxy.position.set(5, 3.8, 0);
  scene.add(pendantProxy);

  // ==============================================
  // CONSOLE behind sofa
  // ==============================================
  const consoleGroup = new THREE.Group();
  const consoleTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.4), marbletopMat);
  consoleTop.position.y = 0.86; consoleGroup.add(consoleTop);
  const consoleBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.82, 0.38), darkWoodMat);
  consoleBody.position.y = 0.41; consoleGroup.add(consoleBody);
  const xBar1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.04), goldMat);
  xBar1.rotation.z = Math.atan2(0.7, 2.0); xBar1.position.set(0, 0.41, 0.2);
  consoleGroup.add(xBar1);
  const xBar2 = xBar1.clone(); xBar2.rotation.z = -Math.atan2(0.7, 2.0);
  consoleGroup.add(xBar2);
  const consoleLamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.04, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.85 })
  );
  consoleLamp.position.set(-0.8, 1.04, 0); consoleGroup.add(consoleLamp);
  const consolePlant = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a6030, roughness: 0.85 })
  );
  consolePlant.position.set(0.7, 1.02, 0); consoleGroup.add(consolePlant);
  consoleGroup.position.set(-4, 0, 1.9);
  consoleGroup.rotation.y = Math.PI;
  markMovable(consoleGroup, 'furniture_console', 'Console Table');
  scene.add(consoleGroup);

  // ==============================================
  // CEILING ROSE
  // ==============================================
  const ceilRose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24),
    cofferMat
  );
  ceilRose.position.set(5, 6.98, 0);
  scene.add(ceilRose);

  return {
    floorLampLight,
    pendantLight,
    tubeLight1,
    tubeLight2,
    tubeMat1,
    tubeMat2,
    floorShadeMat,
    pendantShadeMat,
    ambientLight,
    hemisphereLight,
    movables,
    handleLightClick,
  };
}