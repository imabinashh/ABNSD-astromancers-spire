import * as THREE from 'three';

// Celestial System: 3D Glowing Sun (Sunset & Day), 3D Glowing Moon (Night),
// Rich Twinkling Starfield, and Shooting Stars
export function createCelestial(scene) {
  const celestialGroup = new THREE.Group();
  celestialGroup.name = 'celestialSystem';
  scene.add(celestialGroup);

  // ==============================================================
  // Shared Radial Gradient Textures for Coronas & Auras
  // ==============================================================

  // 1. Cool Lunar Halo Texture
  const moonHaloCanvas = document.createElement('canvas');
  moonHaloCanvas.width = 128;
  moonHaloCanvas.height = 128;
  const moonHaloCtx = moonHaloCanvas.getContext('2d');
  const moonGrad = moonHaloCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  moonGrad.addColorStop(0, 'rgba(215, 235, 255, 0.95)');
  moonGrad.addColorStop(0.25, 'rgba(170, 205, 255, 0.45)');
  moonGrad.addColorStop(0.6, 'rgba(120, 170, 255, 0.15)');
  moonGrad.addColorStop(1, 'rgba(120, 170, 255, 0)');
  moonHaloCtx.fillStyle = moonGrad;
  moonHaloCtx.fillRect(0, 0, 128, 128);
  const moonHaloTexture = new THREE.CanvasTexture(moonHaloCanvas);

  // 2. Warm Solar Corona Texture
  const sunHaloCanvas = document.createElement('canvas');
  sunHaloCanvas.width = 128;
  sunHaloCanvas.height = 128;
  const sunHaloCtx = sunHaloCanvas.getContext('2d');
  const sunGrad = sunHaloCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  sunGrad.addColorStop(0, 'rgba(255, 255, 245, 1.0)');
  sunGrad.addColorStop(0.2, 'rgba(255, 225, 140, 0.75)');
  sunGrad.addColorStop(0.5, 'rgba(255, 160, 60, 0.28)');
  sunGrad.addColorStop(1, 'rgba(255, 120, 30, 0)');
  sunHaloCtx.fillStyle = sunGrad;
  sunHaloCtx.fillRect(0, 0, 128, 128);
  const sunHaloTexture = new THREE.CanvasTexture(sunHaloCanvas);

  // 3. Wide Solar Atmospheric Aura Texture
  const sunAuraCanvas = document.createElement('canvas');
  sunAuraCanvas.width = 128;
  sunAuraCanvas.height = 128;
  const sunAuraCtx = sunAuraCanvas.getContext('2d');
  const auraGrad = sunAuraCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  auraGrad.addColorStop(0, 'rgba(255, 210, 120, 0.65)');
  auraGrad.addColorStop(0.4, 'rgba(255, 140, 60, 0.22)');
  auraGrad.addColorStop(1, 'rgba(255, 80, 20, 0)');
  sunAuraCtx.fillStyle = auraGrad;
  sunAuraCtx.fillRect(0, 0, 128, 128);
  const sunAuraTexture = new THREE.CanvasTexture(sunAuraCanvas);

  // ==============================================================
  // 1. THE 3D GLOWING SUN (For Sunset and Day atmospheres)
  // Positioned far in the distant sky so the camera orbits BETWEEN
  // the tower and the Sun!
  // ==============================================================
  const sunGroup = new THREE.Group();
  sunGroup.name = 'sunGroup';
  // Positioned in the distant sky: distance from origin ≈ 47
  sunGroup.position.set(-36.0, 16.5, -30.0);

  // Faceted low-poly Sun body (Icosahedron with flat shading & fog disabled)
  const sunGeo = new THREE.IcosahedronGeometry(4.4, 2);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xfff0dd,
    emissive: 0xff5511, // rich sunset fiery amber
    emissiveIntensity: 2.8,
    roughness: 0.15,
    metalness: 0.05,
    flatShading: true,
    transparent: true,
    fog: false, // keeps celestial sun bright through atmospheric fog
    opacity: 1.0
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);

  // Astromancer Faceted Sunburst Ray Ring
  // 14 low-poly diamond cones radiating outward with breathing rotation
  const sunRaysGroup = new THREE.Group();
  sunRaysGroup.name = 'sunRaysGroup';
  const sunRayMat = new THREE.MeshStandardMaterial({
    color: 0xffe299,
    emissive: 0xff7722,
    emissiveIntensity: 2.4,
    roughness: 0.2,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    fog: false,
    opacity: 0.85,
    depthWrite: false // Prevents Z-fighting and clipping into inner sun sphere
  });

  const rayCount = 14;
  for (let i = 0; i < rayCount; i++) {
    const isLong = i % 2 === 0;
    const rayHeight = isLong ? 3.6 : 2.4;
    const rayGeo = new THREE.ConeGeometry(isLong ? 0.6 : 0.38, rayHeight, 4);
    // Align cone so base is at y = 0 and tip extends outward along +y
    rayGeo.translate(0, rayHeight / 2, 0);
    const rayMesh = new THREE.Mesh(rayGeo, sunRayMat);
    const angle = (i / rayCount) * Math.PI * 2;
    // Set base at dist = 4.65 (cleanly outside the 4.4 radius icosahedron, preventing overlap)
    const dist = 4.65;
    rayMesh.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
    rayMesh.rotation.z = angle - Math.PI / 2;
    sunRaysGroup.add(rayMesh);
  }
  sunRaysGroup.renderOrder = 2;
  sunGroup.add(sunRaysGroup);

  // Inner Radiant Solar Corona
  const sunCoronaMat = new THREE.SpriteMaterial({
    map: sunHaloTexture,
    color: 0xff8a3d, // warm sunset orange
    transparent: true,
    fog: false,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sunCoronaSprite = new THREE.Sprite(sunCoronaMat);
  sunCoronaSprite.scale.set(40.0, 40.0, 1.0);
  sunGroup.add(sunCoronaSprite);

  // Outer Soft Atmospheric Sun Aura
  const sunAuraMat = new THREE.SpriteMaterial({
    map: sunAuraTexture,
    color: 0xff4411, // twilight amber-red
    transparent: true,
    fog: false,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sunAuraSprite = new THREE.Sprite(sunAuraMat);
  sunAuraSprite.scale.set(78.0, 78.0, 1.0);
  sunGroup.add(sunAuraSprite);

  celestialGroup.add(sunGroup);

  // ==============================================================
  // 2. THE 3D GLOWING MOON (For Night atmosphere)
  // Low-poly faceted sphere placed in the distant night sky
  // ==============================================================
  const moonGroup = new THREE.Group();
  moonGroup.name = 'moonGroup';
  moonGroup.position.set(-28.0, 26.0, -25.0);

  // Faceted low-poly Moon body (icosahedron with 2 subdivisions)
  const moonGeo = new THREE.IcosahedronGeometry(3.6, 2);
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xf4f7ff,
    emissive: 0xc8ddff,
    emissiveIntensity: 2.2,
    roughness: 0.25,
    metalness: 0.05,
    flatShading: true,
    transparent: true,
    fog: false,
    opacity: 0.0 // starts hidden, fades in at night
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);

  // Luminous Moon Halo Glow (Sprite with soft radial gradient)
  const moonHaloMat = new THREE.SpriteMaterial({
    map: moonHaloTexture,
    color: 0xd0e4ff,
    transparent: true,
    fog: false,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const moonHaloSprite = new THREE.Sprite(moonHaloMat);
  moonHaloSprite.scale.set(28.0, 28.0, 1.0);
  moonGroup.add(moonHaloSprite);

  // Secondary outer soft aura
  const moonAuraMat = new THREE.SpriteMaterial({
    map: moonHaloTexture,
    color: 0x88b5ff,
    transparent: true,
    fog: false,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const moonAuraSprite = new THREE.Sprite(moonAuraMat);
  moonAuraSprite.scale.set(52.0, 52.0, 1.0);
  moonGroup.add(moonAuraSprite);

  celestialGroup.add(moonGroup);

  // ==============================================================
  // 3. RICH TWINKLING STARFIELD (1,600+ Stars)
  // ==============================================================
  const starCount = 1600;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starFlickerOffsets = new Float32Array(starCount);

  const starCanvas = document.createElement('canvas');
  starCanvas.width = 32;
  starCanvas.height = 32;
  const starCtx = starCanvas.getContext('2d');
  const starGrad = starCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  starGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  starGrad.addColorStop(0.3, 'rgba(230, 240, 255, 0.7)');
  starGrad.addColorStop(1, 'rgba(200, 225, 255, 0)');
  starCtx.fillStyle = starGrad;
  starCtx.fillRect(0, 0, 32, 32);
  const starTexture = new THREE.CanvasTexture(starCanvas);

  const starColorPalettes = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xd6e5ff),
    new THREE.Color(0xb5d4ff),
    new THREE.Color(0xffeed6),
    new THREE.Color(0xf5d9ff)
  ];

  for (let i = 0; i < starCount; i++) {
    const r = 90 + Math.random() * 35;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.95);

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi) + 2.0;
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const c = starColorPalettes[Math.floor(Math.random() * starColorPalettes.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;

    starSizes[i] = 0.45 + Math.random() * 1.35;
    starFlickerOffsets[i] = Math.random() * Math.PI * 2;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 0.9,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    fog: false,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const starPoints = new THREE.Points(starGeo, starMaterial);
  celestialGroup.add(starPoints);

  // ==============================================================
  // 4. SHOOTING STARS / METEORS
  // ==============================================================
  const meteorCount = 2;
  const meteors = [];
  const meteorMat = new THREE.LineBasicMaterial({
    color: 0xd8eeff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < meteorCount; i++) {
    const geo = new THREE.BufferGeometry();
    const pts = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const line = new THREE.Line(geo, meteorMat.clone());
    celestialGroup.add(line);
    meteors.push({
      line,
      active: false,
      timer: 4.0 + Math.random() * 8.0,
      head: new THREE.Vector3(),
      tail: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      speed: 70.0,
      life: 0
    });
  }

  // ==============================================================
  // 5. THEME TRANSITIONS & SMOOTH INTERPOLATION STATE
  // ==============================================================
  let currentTheme = 'sunset';

  // Sun transition targets (Default to larger, farther Sunset Sun)
  let targetSunOpacity = 1.0;
  let targetSunScale = 1.35; // Enlarged for glorious sunset horizon presence!
  const targetSunPos = new THREE.Vector3(-36.0, 16.5, -30.0);
  const targetSunColor = new THREE.Color(0xfff0dd);
  const targetSunEmissive = new THREE.Color(0xff5511);
  const targetCoronaColor = new THREE.Color(0xff8a3d);
  const targetAuraColor = new THREE.Color(0xff4411);

  // Moon transition targets
  let targetMoonOpacity = 0.0;
  let targetStarOpacity = 0.15;

  function setTheme(theme) {
    currentTheme = theme;

    if (theme === 'sunset') {
      // 1. Warm, Majestic Enlarged Sunset Sun positioned far out
      targetSunOpacity = 1.0;
      targetSunScale = 1.35; // Larger on horizon!
      targetSunPos.set(-36.0, 16.5, -30.0); // Far distance ≈ 47, camera orbits between
      targetSunColor.setHex(0xfff0dd);
      targetSunEmissive.setHex(0xff5511); // rich fiery sunset orange
      targetCoronaColor.setHex(0xff8a3d);
      targetAuraColor.setHex(0xff4411);

      // Moon fades away
      targetMoonOpacity = 0.0;
      targetStarOpacity = 0.15;
    } else if (theme === 'day') {
      // 2. Radiant Day Sun in distant upper sky
      targetSunOpacity = 1.0;
      targetSunScale = 1.1;
      targetSunPos.set(-30.0, 21.5, -28.0);
      targetSunColor.setHex(0xffffff);
      targetSunEmissive.setHex(0xffd740); // brilliant solar gold
      targetCoronaColor.setHex(0xffea88);
      targetAuraColor.setHex(0xffd54f);

      // Moon fades away
      targetMoonOpacity = 0.0;
      targetStarOpacity = 0.0;
    } else {
      // 3. Night Mode: Sun sinks & Moon rises
      targetSunOpacity = 0.0;
      targetSunPos.set(-36.0, 4.0, -30.0); // sinks below horizon

      // Moon shines bright!
      targetMoonOpacity = 1.0;
      targetStarOpacity = 0.95;
    }
  }

  // Animation update loop
  function update(dt, time) {
    // -------------------------------------------------------------
    // 1. Smoothly interpolate Sun visual properties
    // -------------------------------------------------------------
    sunMat.opacity += (targetSunOpacity - sunMat.opacity) * 0.08;
    sunCoronaMat.opacity += (targetSunOpacity * 0.8 - sunCoronaMat.opacity) * 0.08;
    sunAuraMat.opacity += (targetSunOpacity * 0.5 - sunAuraMat.opacity) * 0.08;
    sunRayMat.opacity += (targetSunOpacity * 0.85 - sunRayMat.opacity) * 0.08;

    // Smooth position lerp with gentle celestial floating bob
    sunGroup.position.lerp(targetSunPos, 0.06);
    sunGroup.position.y += Math.sin(time * 0.4) * 0.02;
    sunGroup.lookAt(0, 8, 0);

    // Smooth color & emissive lerp
    sunMat.color.lerp(targetSunColor, 0.08);
    sunMat.emissive.lerp(targetSunEmissive, 0.08);
    sunCoronaMat.color.lerp(targetCoronaColor, 0.08);
    sunAuraMat.color.lerp(targetAuraColor, 0.08);
    sunRayMat.color.lerp(targetSunColor, 0.08);
    sunRayMat.emissive.lerp(targetSunEmissive, 0.08);

    // Scale lerp
    const curScale = THREE.MathUtils.lerp(sunGroup.scale.x, targetSunScale, 0.08);
    sunGroup.scale.setScalar(curScale);

    // Continuous celestial rotation: slow sun tumble + spinning rayburst
    sunMesh.rotation.y = time * 0.02;
    sunRaysGroup.rotation.z = time * 0.035;
    sunRaysGroup.scale.setScalar(1.0 + Math.sin(time * 2.0) * 0.04);

    // -------------------------------------------------------------
    // 2. Smoothly interpolate Moon visual properties
    // -------------------------------------------------------------
    moonMat.opacity += (targetMoonOpacity - moonMat.opacity) * 0.08;
    moonHaloMat.opacity += (targetMoonOpacity * 0.55 - moonHaloMat.opacity) * 0.08;
    moonAuraMat.opacity += (targetMoonOpacity * 0.25 - moonAuraMat.opacity) * 0.08;
    starMaterial.opacity += (targetStarOpacity - starMaterial.opacity) * 0.08;

    moonGroup.position.y = 26.0 + Math.sin(time * 0.45) * 0.35;
    moonGroup.rotation.y = time * 0.01;

    // -------------------------------------------------------------
    // 3. Twinkle stars with subtle brightness breathing
    // -------------------------------------------------------------
    if (starMaterial.opacity > 0.05) {
      starMaterial.size = 0.85 + Math.sin(time * 2.2) * 0.15;
    }

    // -------------------------------------------------------------
    // 4. Update Shooting Stars (only active at night)
    // -------------------------------------------------------------
    if (currentTheme === 'night' && targetMoonOpacity > 0.5) {
      meteors.forEach(m => {
        if (!m.active) {
          m.timer -= dt;
          if (m.timer <= 0) {
            m.active = true;
            m.life = 0.8 + Math.random() * 0.5;
            const startX = -25 - Math.random() * 25;
            const startY = 32 + Math.random() * 12;
            const startZ = -20 - Math.random() * 25;
            m.head.set(startX, startY, startZ);
            m.dir.set(1.5 + Math.random() * 0.5, -0.8 - Math.random() * 0.4, 0.8 + Math.random() * 0.5).normalize();
            m.tail.copy(m.head);
            m.line.material.opacity = 0.9;
          }
        } else {
          m.life -= dt;
          if (m.life <= 0) {
            m.active = false;
            m.timer = 6.0 + Math.random() * 10.0;
            m.line.material.opacity = 0.0;
          } else {
            m.head.addScaledVector(m.dir, m.speed * dt);
            m.tail.copy(m.head).addScaledVector(m.dir, -4.5);

            const posArr = m.line.geometry.attributes.position.array;
            posArr[0] = m.head.x;
            posArr[1] = m.head.y;
            posArr[2] = m.head.z;
            posArr[3] = m.tail.x;
            posArr[4] = m.tail.y;
            posArr[5] = m.tail.z;
            m.line.geometry.attributes.position.needsUpdate = true;
          }
        }
      });
    }
  }

  return {
    group: celestialGroup,
    sunGroup,
    moonGroup,
    setTheme,
    update
  };
}
