import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createScene(canvas) {
  // 1. Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xc8b5d0, 0.012);

  // 2. Camera
  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    250
  );
  camera.position.set(18.5, 14.8, 23.5);
  camera.lookAt(0, 5.8, 0);

  // 3. Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 4. Orbit Controls (for free exploration mode)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3.5;
  controls.maxDistance = 45;
  controls.maxPolarAngle = Math.PI * 0.95;
  controls.target.set(0, 5.2, 0);
  controls.enabled = false; // default to scroll conductor mode

  // 5. Stylized Floating Low-Poly Clouds in Background
  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'backgroundClouds';
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0ee,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    opacity: 0.75
  });

  function createCloud(scale = 1.0) {
    const cg = new THREE.Group();
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.DodecahedronGeometry((1.2 + Math.random() * 0.9) * scale, 1);
      const mesh = new THREE.Mesh(geo, cloudMat);
      mesh.position.set(
        (i - count * 0.5) * 1.5 * scale,
        (Math.random() - 0.5) * 0.8 * scale,
        (Math.random() - 0.5) * 1.2 * scale
      );
      cg.add(mesh);
    }
    return cg;
  }

  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const c = createCloud(0.8 + Math.random() * 0.6);
    const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 32 + Math.random() * 18;
    c.position.set(
      Math.sin(angle) * dist,
      2 + Math.random() * 16,
      Math.cos(angle) * dist
    );
    cloudGroup.add(c);
    clouds.push({
      group: c,
      speed: 0.003 + Math.random() * 0.006,
      angle,
      dist,
      y: c.position.y
    });
  }
  scene.add(cloudGroup);

  // Resize handler
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  }
  window.addEventListener('resize', onResize);

  function update(dt, time) {
    // Slowly rotate background clouds
    clouds.forEach(c => {
      c.angle += c.speed * dt;
      c.group.position.x = Math.sin(c.angle) * c.dist;
      c.group.position.z = Math.cos(c.angle) * c.dist;
    });
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    cloudMat,
    onResize,
    update
  };
}
