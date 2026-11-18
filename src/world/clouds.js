import * as THREE from 'three';

// Low-poly cloud builder: creates a cinematic frame where the tower is visible THROUGH the clouds
export function createClouds(scene) {
  const masterCloudGroup = new THREE.Group();
  masterCloudGroup.name = 'allClouds';
  scene.add(masterCloudGroup);

  // Soft low-poly cloud materials
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xfdfbf7,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    opacity: 0.78
  });

  const cloudMatWarm = new THREE.MeshStandardMaterial({
    color: 0xfff0df,
    roughness: 0.92,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    opacity: 0.82
  });

  // Builder for fluffy faceted cloud cluster
  function buildCloudMesh(scale = 1.0, isWarm = false) {
    const group = new THREE.Group();
    const puffCount = 5 + Math.floor(Math.random() * 3);
    const mat = isWarm ? cloudMatWarm : cloudMaterial;

    // Center puff
    const coreGeo = new THREE.DodecahedronGeometry(1.2 * scale, 1);
    const coreMesh = new THREE.Mesh(coreGeo, mat);
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    group.add(coreMesh);

    // Surrounding satellite puffs
    for (let i = 0; i < puffCount; i++) {
      const puffRadius = (0.55 + Math.random() * 0.65) * scale;
      const puffGeo = new THREE.DodecahedronGeometry(puffRadius, 1);
      const puffMesh = new THREE.Mesh(puffGeo, mat);
      puffMesh.castShadow = true;
      puffMesh.receiveShadow = true;

      const angle = (i / puffCount) * Math.PI * 2 + Math.random() * 0.3;
      const dist = (0.8 + Math.random() * 0.8) * scale;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = (Math.random() - 0.5) * 0.7 * scale;

      puffMesh.position.set(x, y, z);
      puffMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(puffMesh);
    }

    return group;
  }

  // ==============================================================
  // 1. CLOUDS NEAR CAMERA (Framing the view like a window in mist)
  // Camera starts at (18.5, 14.8, 23.5) looking at (0, 5.8, 0).
  // These clouds are placed at the perimeter edges to frame the tower
  // so the entire tower is visible THROUGH the gap in the clouds!
  // ==============================================================
  const cameraClouds = [];
  const cameraCloudConfigs = [
    // Left Foreground Cloud (Framing left edge of lens)
    { pos: [8.5, 9.5, 23.0], scale: 1.1, driftSpeed: 0.2, phase: 0.0 },
    { pos: [11.0, 6.0, 21.0], scale: 1.0, driftSpeed: 0.18, phase: 1.2 },

    // Right Foreground Cloud (Framing right edge of lens)
    { pos: [22.0, 16.5, 15.0], scale: 1.15, driftSpeed: 0.22, phase: 2.1 },
    { pos: [19.5, 11.0, 14.5], scale: 1.05, driftSpeed: 0.15, phase: 3.5 },

    // Bottom Foreground Cloud Bed (Resting in bottom foreground below the tower view)
    { pos: [15.5, 4.8, 22.5], scale: 1.3, driftSpeed: 0.16, phase: 4.2 },
    { pos: [19.0, 6.2, 18.5], scale: 1.1, driftSpeed: 0.19, phase: 5.1 },

    // Top Right Cloud (High ceiling mist)
    { pos: [14.0, 19.5, 13.5], scale: 1.0, driftSpeed: 0.25, phase: 0.8 },

    // Fly-through cloud during ascent (placed just off to the side)
    { pos: [5.8, 16.2, 9.8], scale: 0.85, driftSpeed: 0.2, phase: 1.9 }
  ];

  cameraCloudConfigs.forEach(cfg => {
    const cloud = buildCloudMesh(cfg.scale, true);
    cloud.position.set(...cfg.pos);
    masterCloudGroup.add(cloud);
    cameraClouds.push({
      group: cloud,
      baseX: cfg.pos[0],
      baseY: cfg.pos[1],
      baseZ: cfg.pos[2],
      scale: cfg.scale,
      speed: cfg.driftSpeed,
      phase: cfg.phase
    });
  });

  // ==============================================================
  // 2. SEA OF CLOUDS BENEATH & AROUND THE FLOATING ISLAND
  // Forms a soft, dreamy cloud bed around the floating sanctuary
  // ==============================================================
  const islandClouds = [];
  const islandCloudConfigs = [
    // Beneath the island plateau & around the rocky underside
    [-7.8, -1.2, 0.5, 1.35, 0.25, 0.0],   // Pine grove flank
    [-6.5, -3.2, -3.5, 1.45, 0.20, 1.4],  // Underneath rear pines
    [7.2, -1.5, 1.8, 1.30, 0.22, 2.8],    // Cauldron flank
    [4.5, -4.8, 3.2, 1.60, 0.18, 3.9],    // Bottom crag stalactite tip
    [-2.8, -5.2, 2.5, 1.40, 0.21, 4.7],   // Bottom crag front
    [-5.0, -1.0, 6.0, 1.25, 0.24, 5.5],   // Front-left edge of grass
    [2.0, -2.2, -7.5, 1.50, 0.19, 1.0],   // Back of the island
    [6.0, -3.5, -4.5, 1.30, 0.23, 2.3],   // Back-right underside
    [-7.0, 3.8, -2.5, 0.95, 0.28, 3.1],   // Mid-tower drift cloud behind trees
    [6.8, 4.5, -1.5, 0.90, 0.26, 4.4]    // Mid-tower drift cloud right
  ];

  islandCloudConfigs.forEach(([x, y, z, s, speed, phase]) => {
    const cloud = buildCloudMesh(s, Math.random() > 0.4);
    cloud.position.set(x, y, z);
    masterCloudGroup.add(cloud);
    islandClouds.push({
      group: cloud,
      baseX: x,
      baseY: y,
      baseZ: z,
      scale: s,
      speed,
      phase
    });
  });

  // Subtle floating breathing animation
  function update(dt, time) {
    // 1. Foreground camera clouds: gentle ambient drift
    cameraClouds.forEach(c => {
      const bobY = Math.sin(time * 0.7 + c.phase) * 0.2;
      const driftX = Math.cos(time * 0.5 + c.phase) * 0.25;
      c.group.position.y = c.baseY + bobY;
      c.group.position.x = c.baseX + driftX;
      c.group.rotation.y = time * 0.015 * c.speed;
    });

    // 2. Island sea-of-clouds: slow swirling orbit
    islandClouds.forEach(c => {
      const bobY = Math.sin(time * 0.75 + c.phase) * 0.28;
      const driftAngle = time * 0.035 * c.speed + c.phase;
      c.group.position.y = c.baseY + bobY;
      c.group.position.x = c.baseX + Math.sin(driftAngle) * 0.45;
      c.group.position.z = c.baseZ + Math.cos(driftAngle) * 0.45;
      c.group.rotation.y = time * 0.02 * c.speed;
    });
  }

  function setTheme(theme) {
    if (theme === 'night') {
      // Subtle blue-indigo emissive rim (#1a2442) so low-poly faceted shapes remain crisp and readable at night
      cloudMaterial.color.setHex(0x28385a);
      cloudMaterial.emissive.setHex(0x1a2442);
      cloudMaterial.emissiveIntensity = 0.92;

      cloudMatWarm.color.setHex(0x32446e);
      cloudMatWarm.emissive.setHex(0x1a2442);
      cloudMatWarm.emissiveIntensity = 1.0;
    } else if (theme === 'sunset') {
      cloudMaterial.color.setHex(0xfbf8f4);
      cloudMaterial.emissive.setHex(0x000000);
      cloudMaterial.emissiveIntensity = 0.0;

      cloudMatWarm.color.setHex(0xffe8d6);
      cloudMatWarm.emissive.setHex(0x000000);
      cloudMatWarm.emissiveIntensity = 0.0;
    } else {
      cloudMaterial.color.setHex(0xffffff);
      cloudMaterial.emissive.setHex(0x000000);
      cloudMaterial.emissiveIntensity = 0.0;

      cloudMatWarm.color.setHex(0xf2f7ff);
      cloudMatWarm.emissive.setHex(0x000000);
      cloudMatWarm.emissiveIntensity = 0.0;
    }
  }

  return {
    group: masterCloudGroup,
    cloudMaterial,
    cloudMatWarm,
    setTheme,
    update
  };
}
