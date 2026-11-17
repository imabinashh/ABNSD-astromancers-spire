import * as THREE from 'three';

export function createParticles(scene, chimneyOrigin, cauldronOrigin) {
  const particleGroup = new THREE.Group();
  particleGroup.name = 'particles';
  scene.add(particleGroup);

  // ==========================================
  // 1. LOW-POLY CHIMNEY SMOKE PUFFS
  // ==========================================
  const smokeCount = 14;
  const smokePuffs = [];
  const smokeGeo = new THREE.SphereGeometry(0.35, 6, 5);
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xedebe8,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    opacity: 0.85
  });

  for (let i = 0; i < smokeCount; i++) {
    const mesh = new THREE.Mesh(smokeGeo, smokeMat.clone());
    mesh.castShadow = true;
    particleGroup.add(mesh);
    smokePuffs.push({
      mesh,
      age: (i / smokeCount) * 4.0, // staggered start
      lifetime: 4.0,
      scaleMax: 0.9 + Math.random() * 0.4,
      driftX: (Math.random() - 0.5) * 0.8,
      driftZ: (Math.random() - 0.5) * 0.8
    });
  }

  // ==========================================
  // 2. CAULDRON BUBBLES & GREEN SPARKS
  // ==========================================
  const bubbleCount = 10;
  const cauldronBubbles = [];
  const bubbleGeo = new THREE.SphereGeometry(0.12, 6, 5);
  const bubbleMat = new THREE.MeshStandardMaterial({
    color: 0x48ff72,
    emissive: 0x30e058,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    flatShading: true,
    transparent: true,
    opacity: 0.85
  });

  for (let i = 0; i < bubbleCount; i++) {
    const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    particleGroup.add(mesh);
    cauldronBubbles.push({
      mesh,
      age: (i / bubbleCount) * 2.0,
      lifetime: 2.0,
      radiusOffset: Math.random() * 0.45,
      angle: Math.random() * Math.PI * 2,
      maxScale: 0.6 + Math.random() * 0.6
    });
  }

  // ==========================================
  // 3. SKY MAGIC MOTES / FIREFLIES
  // ==========================================
  const moteCount = 60;
  const moteGeo = new THREE.BufferGeometry();
  const motePositions = new Float32Array(moteCount * 3);
  const moteBasePos = [];

  for (let i = 0; i < moteCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = 2.0 + Math.random() * 8.0;
    const y = -1.0 + Math.random() * 16.0;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    motePositions[i * 3] = x;
    motePositions[i * 3 + 1] = y;
    motePositions[i * 3 + 2] = z;

    moteBasePos.push({ x, y, z, speed: 0.5 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2 });
  }

  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));

  // Point material with glowing circular particle
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 240, 180, 1)');
  grad.addColorStop(0.4, 'rgba(255, 200, 100, 0.6)');
  grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const moteTexture = new THREE.CanvasTexture(canvas);

  const moteMat = new THREE.PointsMaterial({
    size: 0.4,
    map: moteTexture,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const motePoints = new THREE.Points(moteGeo, moteMat);
  particleGroup.add(motePoints);

  function triggerCauldronBurst() {
    cauldronBubbles.forEach(b => {
      b.age = 0;
      b.maxScale = 1.2 + Math.random() * 0.8;
    });
  }

  function update(dt, time) {
    // 1. Update smoke puffs
    smokePuffs.forEach(puff => {
      puff.age += dt;
      if (puff.age > puff.lifetime) {
        puff.age = 0;
      }
      const progress = puff.age / puff.lifetime; // 0 to 1

      // Upward motion with gentle wind drift
      const currentY = chimneyOrigin.y + progress * 4.8;
      const currentX = chimneyOrigin.x + puff.driftX * progress + Math.sin(time * 1.5 + puff.age) * 0.2;
      const currentZ = chimneyOrigin.z + puff.driftZ * progress + Math.cos(time * 1.2 + puff.age) * 0.2;

      puff.mesh.position.set(currentX, currentY, currentZ);

      // Scale expands as it rises, then slowly shrinks
      const scaleCurve = Math.sin(progress * Math.PI);
      const s = Math.max(0.01, puff.scaleMax * (0.3 + scaleCurve * 0.9));
      puff.mesh.scale.set(s, s * 0.9, s);

      // Fade out near end of life
      puff.mesh.material.opacity = Math.max(0, 0.85 * (1 - progress * 0.9));
    });

    // 2. Update cauldron bubbles
    cauldronBubbles.forEach(b => {
      b.age += dt;
      if (b.age > b.lifetime) {
        b.age = 0;
        b.radiusOffset = Math.random() * 0.45;
        b.angle = Math.random() * Math.PI * 2;
      }
      const prog = b.age / b.lifetime;
      const bx = cauldronOrigin.x + Math.cos(b.angle) * b.radiusOffset;
      const bz = cauldronOrigin.z + Math.sin(b.angle) * b.radiusOffset;
      const by = cauldronOrigin.y + prog * 1.1;

      b.mesh.position.set(bx, by, bz);
      const s = Math.sin(prog * Math.PI) * b.maxScale;
      b.mesh.scale.set(s, s, s);
    });

    // 3. Update sky motes
    const positions = moteGeo.attributes.position.array;
    for (let i = 0; i < moteCount; i++) {
      const b = moteBasePos[i];
      const curY = b.y + Math.sin(time * b.speed + b.phase) * 0.6;
      const curX = b.x + Math.cos(time * 0.4 * b.speed + b.phase) * 0.4;
      const curZ = b.z + Math.sin(time * 0.5 * b.speed + b.phase) * 0.4;

      positions[i * 3] = curX;
      positions[i * 3 + 1] = curY;
      positions[i * 3 + 2] = curZ;
    }
    moteGeo.attributes.position.needsUpdate = true;
  }

  return {
    group: particleGroup,
    triggerCauldronBurst,
    update
  };
}
