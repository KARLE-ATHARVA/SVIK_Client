import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const FADE_DURATION_MS = 550;

export function createRenderer({ onSelect, onFrame }) {
  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  const tileGroup = new THREE.Group();
  tileGroup.userData.currentMesh = null;
  scene.add(tileGroup);

  const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x3ee6c3,
    transparent: true,
    opacity: 0.7,
  });
  const reticle = new THREE.Mesh(ringGeometry, ringMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", () => onSelect(reticle));
  scene.add(controller);

  let fadeJob = null;

  function applyTexture(texture) {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
    });
    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    tileGroup.add(mesh);

    const fromMesh = tileGroup.userData.currentMesh;
    tileGroup.userData.currentMesh = mesh;
    fadeJob = {
      from: fromMesh,
      to: mesh,
      start: performance.now(),
    };
  }

  function updateFade() {
    if (!fadeJob) return;
    const { from, to, start } = fadeJob;
    const elapsed = performance.now() - start;
    const t = Math.min(elapsed / FADE_DURATION_MS, 1);
    if (to) to.material.opacity = t;
    if (from) from.material.opacity = 1 - t;
    if (t >= 1) {
      if (from) {
        tileGroup.remove(from);
        from.geometry.dispose();
        if (from.material.map) from.material.map.dispose();
        from.material.dispose();
      }
      fadeJob = null;
    }
  }

  function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onWindowResize);

  let hitTestSource = null;
  let hitTestSourceRequested = false;

  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();
      if (!hitTestSourceRequested) {
        session.requestReferenceSpace("viewer").then((viewerSpace) => {
          session.requestHitTestSource({ space: viewerSpace }).then((source) => {
            hitTestSource = source;
          });
        });
        session.addEventListener("end", () => {
          hitTestSourceRequested = false;
          hitTestSource = null;
        });
        hitTestSourceRequested = true;
      }

      if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
    }

    updateFade();
    onFrame(timestamp, frame);
    renderer.render(scene, camera);
  }

  return {
    scene,
    renderer,
    reticle,
    tileGroup,
    applyTexture,
    render,
  };
}
