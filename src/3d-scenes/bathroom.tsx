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

// ─── Tube light names for raycasting ─────────────────────────────────────────
export const TUBE_LIGHT_NAMES = {
  tube1: 'bath_tube_light_1',
  tube2: 'bath_tube_light_2',
} as const;

export interface BathroomRefs {
  tubeLight1:      THREE.PointLight;
  tubeLight2:      THREE.PointLight;
  tubeMat1:        THREE.MeshStandardMaterial;
  tubeMat2:        THREE.MeshStandardMaterial;
  ambientLight:    THREE.AmbientLight;
  hemisphereLight: THREE.HemisphereLight;
  // ── NEW: movable furniture groups ──
  movables:        THREE.Group[];
}

interface SceneBuilderProps {
  scene: THREE.Scene;
  onFloorMaterialReady: (material: THREE.MeshStandardMaterial) => void;
  onWallMaterialsReady: (materials: THREE.MeshStandardMaterial[]) => void;
}

export function buildBathroomScene({
  scene,
  onFloorMaterialReady,
  onWallMaterialsReady,
}: SceneBuilderProps): BathroomRefs {

  // ── NEW: movables array + helper ─────────────────────────────────────────
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
  scene.background = new THREE.Color(0xd8e0e8);
  scene.fog = new THREE.Fog(0xd8e0e8, 10, 25);

  // ==============================================
  // Lighting
  // ==============================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xb8c5d6, 0.4);
  scene.add(hemisphereLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
  sunLight.position.set(8, 12, 6);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 30;
  sunLight.shadow.camera.left = -8;
  sunLight.shadow.camera.right = 8;
  sunLight.shadow.camera.top = 8;
  sunLight.shadow.camera.bottom = -8;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);

  // Mirror accent light (always on)
  const mirrorLight = new THREE.PointLight(0xffffff, 7, 5);
  mirrorLight.position.set(-4.4, 3.8, -3.8);
  scene.add(mirrorLight);

  // ── Tube light point lights (start ON) ──
  const tubeLightPL1 = new THREE.PointLight(0xfff8f0, 18, 20, 1.6);
  tubeLightPL1.position.set(-2, 4.92, -1.0);
  tubeLightPL1.castShadow = true;
  scene.add(tubeLightPL1);

  const tubeLightPL2 = new THREE.PointLight(0xfff8f0, 18, 20, 1.6);
  tubeLightPL2.position.set(2.5, 4.92, -1.0);
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
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.15 });
  onFloorMaterialReady(floorMat);

  const makeWallMat = () => new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.5, metalness: 0.08, side: THREE.DoubleSide,
  });

  const vanityMat    = new THREE.MeshStandardMaterial({ color: 0x6b5438, roughness: 0.65, metalness: 0.05 });
  const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xfcfcfc, roughness: 0.12, metalness: 0.2 });
  const chromeMat    = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, metalness: 0.96, roughness: 0.08, envMapIntensity: 1.2 });

  // Tube diffuser materials — glowing when ON
  const tubeMat1 = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.5, metalness: 0.0,
    emissive: 0xfff4e0, emissiveIntensity: 2.5,
    transparent: true, opacity: 0.92,
  });
  const tubeMat2 = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.5, metalness: 0.0,
    emissive: 0xfff4e0, emissiveIntensity: 2.5,
    transparent: true, opacity: 0.92,
  });

  // ==============================================
  // Floor
  // ==============================================
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), floorMat);
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
  

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), backWallMat);
  backWall.position.set(0, 2.5, -4.5);
  backWall.receiveShadow = true;
  backWall.name = SURFACE_NAMES.wallBack;
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), leftWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-6, 2.5, 0);
  leftWall.receiveShadow = true;
  leftWall.name = SURFACE_NAMES.wallLeft;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), rightWallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(6, 2.5, 0);
  rightWall.receiveShadow = true;
  rightWall.name = SURFACE_NAMES.wallRight;
  scene.add(rightWall);

  onWallMaterialsReady([backWallMat, leftWallMat, rightWallMat]);

  // ==============================================
  // Ceiling
  // ==============================================
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // Baseboard
  const baseboard = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.15, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.6 })
  );
  baseboard.position.set(0, 0.075, -4.46);
  scene.add(baseboard);

  // ==============================================
  // Tube Lights — ceiling mounted, clickable
  // ==============================================
  function createTubeLight(
    x: number,
    z: number,
    tubeMat: THREE.MeshStandardMaterial,
    tubeName: string,
    lengthDir: 'x' | 'z' = 'x'
  ) {
    const g = new THREE.Group();
    const tubeLen = 2.2;

    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(
        lengthDir === 'x' ? tubeLen + 0.2 : 0.12,
        0.05,
        lengthDir === 'x' ? 0.12 : tubeLen + 0.2
      ),
      new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.4, metalness: 0.6 })
    );
    bracket.position.y = -0.025;
    g.add(bracket);

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(
        lengthDir === 'x' ? tubeLen : 0.16,
        0.09,
        lengthDir === 'x' ? 0.16 : tubeLen
      ),
      new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.35, metalness: 0.5 })
    );
    housing.position.y = -0.09;
    g.add(housing);

    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(
        lengthDir === 'x' ? tubeLen - 0.1 : 0.12,
        0.022,
        lengthDir === 'x' ? 0.12 : tubeLen - 0.1
      ),
      tubeMat
    );
    diffuser.position.y = -0.135;
    diffuser.name = tubeName;
    g.add(diffuser);

    const capPositions = lengthDir === 'x'
      ? [[-tubeLen / 2 - 0.06, 0], [tubeLen / 2 + 0.06, 0]]
      : [[0, -tubeLen / 2 - 0.06], [0, tubeLen / 2 + 0.06]];
    for (const [cx, cz] of capPositions) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.09, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.4, metalness: 0.5 })
      );
      cap.position.set(cx, -0.09, cz);
      g.add(cap);
    }

    g.position.set(x, 4.98, z);
    scene.add(g);
  }

  createTubeLight(-2.0, -1.0, tubeMat1, TUBE_LIGHT_NAMES.tube1, 'x');
  createTubeLight( 2.5, -1.0, tubeMat2, TUBE_LIGHT_NAMES.tube2, 'x');

  // ==============================================
  // Vanity + Sink  ── wrapped in a movable group
  // ==============================================
  const vanityGroup = new THREE.Group();

  const vanityBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 1.1), vanityMat);
  vanityBase.position.set(0, 0.575, 0);
  vanityBase.castShadow = true;
  vanityGroup.add(vanityBase);

  const countertop = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.08, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.2, metalness: 0.4 })
  );
  countertop.position.set(0, 1.09, 0);
  countertop.castShadow = true;
  vanityGroup.add(countertop);

  const sinkOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.31, 0.22, 32), porcelainMat);
  sinkOuter.position.set(0, 1.25, 0);
  sinkOuter.castShadow = true;
  vanityGroup.add(sinkOuter);

  const sinkInner = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.24, 0.2, 32), porcelainMat);
  sinkInner.position.set(0, 1.28, 0);
  vanityGroup.add(sinkInner);

  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16), chromeMat);
  drain.position.set(0, 1.16, 0);
  vanityGroup.add(drain);

  const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 16), chromeMat);
  faucetBase.position.set(0, 1.37, 0.3);
  vanityGroup.add(faucetBase);

  const faucetNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12), chromeMat);
  faucetNeck.position.set(0, 1.6, 0.3);
  faucetNeck.castShadow = true;
  vanityGroup.add(faucetNeck);

  const faucetSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.22, 12), chromeMat);
  faucetSpout.position.set(0, 1.7, 0.1);
  faucetSpout.rotation.x = Math.PI / 3;
  vanityGroup.add(faucetSpout);

  for (let i = 0; i < 2; i++) {
    const drawer = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.38, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 })
    );
    drawer.position.set(i === 0 ? -0.6 : 0.6, 0.55, 0.54);
    vanityGroup.add(drawer);
    const dhandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12), chromeMat);
    dhandle.rotation.z = Math.PI / 2;
    dhandle.position.set(i === 0 ? -0.6 : 0.6, 0.55, 0.57);
    vanityGroup.add(dhandle);
  }

  vanityGroup.position.set(-4.4, 0, -3.1);
  markMovable(vanityGroup, 'furniture_vanity', 'Vanity & Sink');
  scene.add(vanityGroup);

  // ==============================================
  // Mirror + light bar  ── movable group
  // ==============================================
  const mirrorGroup = new THREE.Group();

  const mirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 2.0, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.6 })
  );
  mirrorFrame.position.set(0, 0, 0);
  mirrorFrame.castShadow = true;
  mirrorGroup.add(mirrorFrame);

  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xe8f0f8, metalness: 1.0, roughness: 0.02, envMapIntensity: 2.5 })
  );
  mirror.position.set(0, 0, 0.06);
  mirrorGroup.add(mirror);

  const lightBar = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.08, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.2, metalness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.4 })
  );
  lightBar.position.set(0, 1.12, 0.06);
  mirrorGroup.add(lightBar);

  mirrorGroup.position.set(-4.4, 2.5, -4.22);
  markMovable(mirrorGroup, 'furniture_mirror', 'Mirror');
  scene.add(mirrorGroup);

  // ==============================================
  // Towel holder + towel  ── movable group
  // ==============================================
  const towelGroup = new THREE.Group();

  const towelBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 16), chromeMat);
  towelBar.rotation.z = Math.PI / 2;
  towelBar.position.set(0, 0, 0);
  towelBar.castShadow = true;
  towelGroup.add(towelBar);

  for (const tx of [-0.55, 0.55]) {
    const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16), chromeMat);
    mount.position.set(tx, 0, -0.02);
    towelGroup.add(mount);
  }

  const towel = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.55, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xe8d8c8, roughness: 0.95 })
  );
  towel.position.set(0, -0.25, -0.02);
  towelGroup.add(towel);

  towelGroup.position.set(-2.2, 1.6, -4.3);
  markMovable(towelGroup, 'furniture_towel_holder', 'Towel Holder');
  scene.add(towelGroup);

  // ==============================================
  // Geyser  ── movable group
  // ==============================================
  const geyserGroup = new THREE.Group();

  const geyserBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.4, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 0.35, metalness: 0.08 })
  );
  geyserBody.castShadow = true;
  geyserGroup.add(geyserBody);

  const geyserFront = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.25, metalness: 0.05 })
  );
  geyserFront.scale.set(1.2, 1.0, 0.25);
  geyserFront.position.set(0, 0.05, 0.25);
  geyserGroup.add(geyserFront);

  const geyserKnobRed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.12, 20),
    new THREE.MeshStandardMaterial({ color: 0xd23b3b, roughness: 0.3, metalness: 0.1 })
  );
  geyserKnobRed.rotation.x = Math.PI / 2;
  geyserKnobRed.position.set(-0.18, -0.65, 0.3);
  geyserGroup.add(geyserKnobRed);

  const geyserKnobBlue = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.12, 20),
    new THREE.MeshStandardMaterial({ color: 0x2f6bdc, roughness: 0.3, metalness: 0.1 })
  );
  geyserKnobBlue.rotation.x = Math.PI / 2;
  geyserKnobBlue.position.set(0.18, -0.65, 0.3);
  geyserGroup.add(geyserKnobBlue);

  geyserGroup.position.set(0, 3.4, -4.2);
  markMovable(geyserGroup, 'furniture_geyser', 'Geyser');
  scene.add(geyserGroup);

  // ==============================================
  // Wall Mixer Tap  ── movable group
  // ==============================================
  const tapGroup = new THREE.Group();

  const tapBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 24), chromeMat);
  tapBody.rotation.z = Math.PI / 2;
  tapGroup.add(tapBody);

  const tapSpout = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.16), chromeMat);
  tapSpout.position.set(0.35, -0.1, 0.1);
  tapGroup.add(tapSpout);

  const tapHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 20), chromeMat);
  tapHandle.rotation.x = Math.PI / 2;
  tapHandle.position.set(-0.25, 0.15, 0.06);
  tapGroup.add(tapHandle);

  tapGroup.position.set(0, 1.2, -4.15);
  markMovable(tapGroup, 'furniture_tap', 'Wall Tap');
  scene.add(tapGroup);

  // ==============================================
  // Bucket  ── movable group
  // ==============================================
  const bucketGroup = new THREE.Group();

  const bucketBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.34, 0.55, 32, 1, false),
    new THREE.MeshStandardMaterial({ color: 0xe8e8ea, roughness: 0.38, metalness: 0.15 })
  );
  bucketBody.position.y = 0.28;
  bucketBody.castShadow = true;
  bucketGroup.add(bucketBody);

  const bucketBottom = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 28),
    new THREE.MeshStandardMaterial({ color: 0xe8e8ea })
  );
  bucketBottom.rotation.x = -Math.PI / 2;
  bucketBottom.position.y = 0.01;
  bucketGroup.add(bucketBottom);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.025, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0xe8e8ea, roughness: 0.35, metalness: 0.2 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.55;
  bucketGroup.add(rim);

  bucketGroup.position.set(0.5, 0, -2.7);
  markMovable(bucketGroup, 'furniture_bucket', 'Bucket');
  scene.add(bucketGroup);

  // ==============================================
  // Toilet  ── movable group
  // ==============================================
  const toiletGroup = new THREE.Group();

  const toiletBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.52, 28), porcelainMat);
  toiletBase.position.y = 0.26;
  toiletBase.castShadow = true;
  toiletGroup.add(toiletBase);

  const toiletBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.46, 28), porcelainMat);
  toiletBowl.position.y = 0.62;
  toiletBowl.castShadow = true;
  toiletGroup.add(toiletBowl);

  const toiletSeat = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 12, 24), porcelainMat);
  toiletSeat.rotation.x = Math.PI / 2;
  toiletSeat.position.y = 0.85;
  toiletGroup.add(toiletSeat);

  const toiletTank = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.78, 0.26), porcelainMat);
  toiletTank.position.set(0, 1.02, -0.36);
  toiletTank.castShadow = true;
  toiletGroup.add(toiletTank);

  const flushPlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.03), chromeMat);
  flushPlate.position.set(0, 1.08, -0.5);
  toiletGroup.add(flushPlate);

  toiletGroup.position.set(4.8, 0, -3.0);
  markMovable(toiletGroup, 'furniture_toilet', 'Toilet');
  scene.add(toiletGroup);

  // ==============================================
  // Shower (right side)
  // ==============================================
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xc8dde8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35
  });

  const showerGlassSide = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), glassMat);
  showerGlassSide.rotation.y = Math.PI / 2;
  showerGlassSide.position.set(2.7, 1.1, -3.0);
  scene.add(showerGlassSide);

  const showerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12), chromeMat);
  showerArm.rotation.z = Math.PI / 4;
  showerArm.position.set(5.2, 2.6, -3.8);
  scene.add(showerArm);

  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.08, 24), chromeMat);
  showerHead.position.set(5.1, 2.45, -3.8);
  showerHead.rotation.x = Math.PI / 2;
  scene.add(showerHead);

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