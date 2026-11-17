import * as THREE from 'three';

// Celestial System: 3D Glowing Moon, Rich Twinkling Starfield, and Shooting Stars
export function createCelestial(scene) {
  const celestialGroup = new THREE.Group();
  celestialGroup.name = 'celestialSystem';
  scene.add(celestialGroup);

  // ==============================================================
  // 1. THE 3D GLOWING MOON
  // Positioned in the upper sky: (-15, 27, -13)
  // Visible above and behind the tower, casting glorious silvery moonlight
  // ==============================================================
  const moonGroup = new THREE.Group();
  moonGroup.name = 'moonGroup';
  moonGroup.position.set(-15, 27, -13);

  // Faceted low-poly Moon body (icosahedron with 2 subdivisions)
  const moonGeo = new THREE.IcosahedronGeometry(2.4, 2);
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xf4f7ff,
    emissive: 0xc8ddff,
    emissiveIntensity: 1.8,
    roughness: 0.25,
    metalness: 0.05,
    flatShading: true,
    transparent: true,
    opacity: 0.0 // starts hidden, fades in at night
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonMesh);

  // Luminous Moon Halo Glow (Sprite with soft radial gradient)
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const haloCtx = haloCanvas.getContext('2d');
  const gradient = haloCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(215, 235, 255, 0.95)');
  gradient.addColorStop(0.25, 'rgba(170, 205, 255, 0.45)');
  gradient.addColorStop(0.6, 'rgba(120, 170, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(120, 170, 255, 0)');
  haloCtx.fillStyle = gradient;
  haloCtx.fillRect(0, 0, 128, 128);

  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTexture,
    color: 0xd0e4ff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.scale.set(14.0, 14.0, 1.0);
  moonGroup.add(haloSprite);

  // Secondary outer soft aura
  const auraMat = new THREE.SpriteMaterial({
    map: haloTexture,
    color: 0x88b5ff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const auraSprite = new THREE.Sprite(auraMat);
  auraSprite.scale.set(24.0, 24.0, 1.0);
  moonGroup.add(auraSprite);

  // Dedicated Moon Light (casts beautiful silvery-blue rays directly from the moon!)
  const moonLight = new THREE.DirectionalLight(0xb2d2ff, 0.0);
  moonLight.position.copy(moonGroup.position);
  moonLight.target.position.set(0, 5.0, 0);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  moonLight.shadow.camera.near = 2;
  moonLight.shadow.camera.far = 70;
  moonLight.shadow.camera.left = -15;
  moonLight.shadow.camera.right = 15;
  moonLight.shadow.camera.top = 22;
  moonLight.shadow.camera.bottom = -10;
  moonLight.shadow.bias = -0.0005;
  moonLight.shadow.normalBias = 0.02;

  scene.add(moonLight);
  scene.add(moonLight.target);
  celestialGroup.add(moonGroup);

  // ==============================================================
  // 2. RICH TWINKLING STARFIELD (1,500+ Stars)
  // Multi-sized, shimmering stars with soft color variations
  // ==============================================================
  const starCount = 1600;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starFlickerOffsets = new Float32Array(starCount);

  // Star texture canvas
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
    new THREE.Color(0xffffff), // Diamond white
    new THREE.Color(0xd6e5ff), // Pale blue sapphire
    new THREE.Color(0xb5d4ff), // Ethereal azure
    new THREE.Color(0xffeed6), // Warm champagne gold
    new THREE.Color(0xf5d9ff)  // Soft twilight violet
  ];

  for (let i = 0; i < starCount; i++) {
    // Distribute across upper celestial hemisphere
    const r = 85 + Math.random() * 35;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.95); // mostly above horizon

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi) + 2.0; // elevated above ground
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Random star color
    const c = starColorPalettes[Math.floor(Math.random() * starColorPalettes.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;

    // Random star size and flicker rate
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
    opacity: 0.15, // subtle by default, fully brilliant at night
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const starPoints = new THREE.Points(starGeo, starMaterial);
  celestialGroup.add(starPoints);

  // ==============================================================
  // 3. SHOOTING STARS / METEORS
  // Occasional streak across the night sky
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
    const pts = new Float32Array(6); // 2 points (head and tail)
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

  // Target opacity and intensity for smooth fading between Day / Sunset / Night
  let targetMoonOpacity = 0.0;
  let targetMoonIntensity = 0.0;
  let targetStarOpacity = 0.15;
  let currentTheme = 'sunset';

  function setTheme(theme) {
    currentTheme = theme;
    if (theme === 'night') {
      targetMoonOpacity = 1.0;
      targetMoonIntensity = 2.4; // beautiful bright moonlight!
      targetStarOpacity = 0.95;  // brilliant twinkling stars!
    } else if (theme === 'sunset') {
      targetMoonOpacity = 0.0;
      targetMoonIntensity = 0.0;
      targetStarOpacity = 0.18;  // faint evening stars
    } else {
      targetMoonOpacity = 0.0;
      targetMoonIntensity = 0.0;
      targetStarOpacity = 0.0;   // daytime sky
    }
  }

  // Animation update loop
  function update(dt, time) {
    // 1. Smoothly interpolate Moon and Star opacity
    moonMat.opacity += (targetMoonOpacity - moonMat.opacity) * 0.08;
    haloMat.opacity += (targetMoonOpacity * 0.55 - haloMat.opacity) * 0.08;
    auraMat.opacity += (targetMoonOpacity * 0.25 - auraMat.opacity) * 0.08;
    moonLight.intensity += (targetMoonIntensity - moonLight.intensity) * 0.08;
    starMaterial.opacity += (targetStarOpacity - starMaterial.opacity) * 0.08;

    // 2. Twinkle stars with subtle brightness breathing
    if (starMaterial.opacity > 0.05) {
      starMaterial.size = 0.85 + Math.sin(time * 2.2) * 0.15;
    }

    // 3. Gentle Moon hover bob
    moonGroup.position.y = 27.0 + Math.sin(time * 0.5) * 0.35;
    moonGroup.rotation.y = time * 0.01;

    // 4. Update Shooting Stars (only active at night)
    if (currentTheme === 'night' && targetMoonOpacity > 0.5) {
      meteors.forEach(m => {
        if (!m.active) {
          m.timer -= dt;
          if (m.timer <= 0) {
            // Spawn new shooting star
            m.active = true;
            m.life = 0.8 + Math.random() * 0.5;
            const startX = -20 - Math.random() * 25;
            const startY = 32 + Math.random() * 12;
            const startZ = -15 - Math.random() * 25;
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
            // Advance head and tail
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
    moonGroup,
    moonLight,
    setTheme,
    update
  };
}
