import * as THREE from 'three';

// Satellite Islands:
// 1. Left Island: The Alchemist's Pumpkin Grove with Gnarled Tree & Hanging Lantern,
//    connected via a rustic arched wooden footbridge.
// 2. Right Island: The Astromancer's Miniature Cottage Outpost with Teal Shingle Roof,
//    Watchtower Lookout Turret & Crescent Moon Spire, connected via levitating stepping stones.
export function createSatelliteIslands(scene) {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'satelliteArchipelago';
  scene.add(masterGroup);

  // Common Low-Poly Materials (flatShading enabled)
  const mats = {
    grass: new THREE.MeshStandardMaterial({
      color: 0x74a540,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    }),
    rock: new THREE.MeshStandardMaterial({
      color: 0x785038,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    }),
    rockDark: new THREE.MeshStandardMaterial({
      color: 0x583a28,
      roughness: 0.95,
      flatShading: true
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0x82502e,
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true
    }),
    woodDark: new THREE.MeshStandardMaterial({
      color: 0x56341e,
      roughness: 0.8,
      flatShading: true
    }),
    woodPlank: new THREE.MeshStandardMaterial({
      color: 0xa86e42,
      roughness: 0.7,
      flatShading: true
    }),
    stone: new THREE.MeshStandardMaterial({
      color: 0x9ea4ae,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: true
    }),
    stoneLight: new THREE.MeshStandardMaterial({
      color: 0xbac0ca,
      roughness: 0.8,
      flatShading: true
    }),
    pumpkinOrange: new THREE.MeshStandardMaterial({
      color: 0xee661c,
      roughness: 0.65,
      metalness: 0.0,
      flatShading: true
    }),
    pumpkinDark: new THREE.MeshStandardMaterial({
      color: 0xc84c10,
      roughness: 0.7,
      flatShading: true
    }),
    pumpkinGlow: new THREE.MeshStandardMaterial({
      color: 0xffda55,
      emissive: 0xff9911,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      flatShading: true
    }),
    pumpkinStem: new THREE.MeshStandardMaterial({
      color: 0x4d6b30,
      roughness: 0.85,
      flatShading: true
    }),
    tealRoof: new THREE.MeshStandardMaterial({
      color: 0x1d8a7d,
      roughness: 0.55,
      metalness: 0.1,
      flatShading: true
    }),
    tealRoofTrim: new THREE.MeshStandardMaterial({
      color: 0x2bb0a0,
      roughness: 0.5,
      metalness: 0.15,
      flatShading: true
    }),
    cottageWall: new THREE.MeshStandardMaterial({
      color: 0xb67548,
      roughness: 0.8,
      flatShading: true
    }),
    goldBrass: new THREE.MeshStandardMaterial({
      color: 0xe2a838,
      roughness: 0.35,
      metalness: 0.85,
      flatShading: true
    }),
    windowGlow: new THREE.MeshStandardMaterial({
      color: 0xffe277,
      emissive: 0xffaa22,
      emissiveIntensity: 1.8,
      roughness: 0.25,
      flatShading: true
    })
  };

  function applyShadows(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return obj;
  }

  // Builder for faceted craggy island base
  function createIslandBase(radius, coneHeight, segments = 14) {
    const group = new THREE.Group();

    // 1. Grassy Top Plateau
    const grassGeo = new THREE.CylinderGeometry(radius, radius * 1.03, 0.45, segments);
    const grassMesh = new THREE.Mesh(grassGeo, mats.grass);
    grassMesh.position.y = -0.225;
    group.add(grassMesh);

    // 2. Faceted Stalactite Rocky Crag Underside
    const rockGeo = new THREE.ConeGeometry(radius * 1.02, coneHeight, segments, 5);
    const pos = rockGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < coneHeight * 0.42) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const noise = (Math.sin(angle * 4) * 0.35 + Math.cos(y * 2) * 0.28);
        pos.setX(i, x * (1 + noise * 0.18));
        pos.setZ(i, z * (1 + noise * 0.18));
        pos.setY(i, y + noise * 0.15);
      }
    }
    rockGeo.computeVertexNormals();
    const rockMesh = new THREE.Mesh(rockGeo, mats.rock);
    rockMesh.rotation.x = Math.PI; // point downwards
    rockMesh.position.y = -0.45 - coneHeight * 0.5;
    group.add(rockMesh);

    // 3. Rocky rim fringe accents
    for (let i = 0; i < 5; i++) {
      const bRad = 0.3 + Math.random() * 0.35;
      const bGeo = new THREE.DodecahedronGeometry(bRad, 0);
      const bMesh = new THREE.Mesh(bGeo, mats.rockDark);
      const ang = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
      bMesh.position.set(Math.cos(ang) * (radius - 0.2), -0.3, Math.sin(ang) * (radius - 0.2));
      group.add(bMesh);
    }

    return group;
  }

  // ==============================================================
  // 1. LEFT SATELLITE ISLAND: THE PUMPKIN GROVE & GNARLED TREE
  // Position: (-11.5, -0.6, 5.0)
  // Clean, contiguous gnarled tree with hanging lantern (NO floating fragments!)
  // ==============================================================
  const leftIslandGroup = new THREE.Group();
  leftIslandGroup.name = 'pumpkinGroveIsland';
  leftIslandGroup.position.set(-11.5, -0.6, 5.0);

  // Island Base
  const leftBase = createIslandBase(3.3, 4.4, 14);
  leftIslandGroup.add(leftBase);

  // Gnarled Crooked Tree (One solid, seamlessly connected sculpted structure)
  const treeGroup = new THREE.Group();
  treeGroup.position.set(0.6, 0.0, -0.4);

  // 1. Trunk Base
  const trunkBaseGeo = new THREE.CylinderGeometry(0.32, 0.45, 1.2, 6);
  const trunkBase = new THREE.Mesh(trunkBaseGeo, mats.woodDark);
  trunkBase.position.set(0, 0.6, 0);
  trunkBase.rotation.set(-0.06, 0, 0.12);
  treeGroup.add(trunkBase);

  // 2. Trunk Mid Section (Smoothly overlaps base)
  const trunkMidGeo = new THREE.CylinderGeometry(0.24, 0.32, 1.1, 6);
  const trunkMid = new THREE.Mesh(trunkMidGeo, mats.woodDark);
  trunkMid.position.set(-0.14, 1.55, 0.08);
  trunkMid.rotation.set(-0.12, 0, 0.28);
  treeGroup.add(trunkMid);

  // 3. Trunk Top / Crest (Smoothly connects to mid section)
  const trunkTopGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.0, 6);
  const trunkTop = new THREE.Mesh(trunkTopGeo, mats.woodDark);
  trunkTop.position.set(-0.38, 2.45, 0.18);
  trunkTop.rotation.set(-0.16, 0, 0.42);
  treeGroup.add(trunkTop);

  // 4. Overarching Branch (Solidly anchored directly into the top of trunk)
  // Reaches outward over the pumpkin patch and terminates where the lantern hangs
  const mainBranchGeo = new THREE.CylinderGeometry(0.10, 0.18, 1.9, 5);
  const mainBranch = new THREE.Mesh(mainBranchGeo, mats.woodDark);
  mainBranch.position.set(-1.08, 2.82, 0.38);
  mainBranch.rotation.set(-0.18, 0.35, 1.22);
  treeGroup.add(mainBranch);

  // Branch tip spur
  const spurGeo = new THREE.CylinderGeometry(0.04, 0.09, 0.45, 4);
  const spur = new THREE.Mesh(spurGeo, mats.woodDark);
  spur.position.set(-1.85, 3.12, 0.58);
  spur.rotation.set(-0.1, 0.2, 0.8);
  treeGroup.add(spur);

  // Hanging Pumpkin Lantern (pendulum assembly anchored to branch)
  const lanternPendulum = new THREE.Group();
  lanternPendulum.position.set(-1.75, 2.7, 0.55);

  // Hanging dark cord/vine
  const cordGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.75, 4);
  const cordMesh = new THREE.Mesh(cordGeo, mats.woodDark);
  cordMesh.position.y = -0.375;
  lanternPendulum.add(cordMesh);

  // Carved Glowing Pumpkin Head
  const lanternHead = new THREE.Group();
  lanternHead.position.y = -0.75;

  const lanternBodyGeo = new THREE.DodecahedronGeometry(0.38, 1);
  lanternBodyGeo.scale(1.0, 0.78, 0.95);
  const lanternBody = new THREE.Mesh(lanternBodyGeo, mats.pumpkinOrange);
  lanternHead.add(lanternBody);

  // Glowing Jack-o'-Lantern Face Insert
  const lanternFaceGeo = new THREE.PlaneGeometry(0.26, 0.18);
  const lanternFace = new THREE.Mesh(lanternFaceGeo, mats.pumpkinGlow);
  lanternFace.position.set(0, 0, 0.35);
  lanternHead.add(lanternFace);

  // Warm pumpkin point light
  const pumpkinLight = new THREE.PointLight(0xffa522, 1.4, 5.0, 1.2);
  pumpkinLight.position.set(0, 0, 0.2);
  lanternHead.add(pumpkinLight);

  lanternPendulum.add(lanternHead);
  treeGroup.add(lanternPendulum);
  leftIslandGroup.add(treeGroup);

  // Pumpkin Patch on the Grass
  function createPumpkin(scale = 1.0, hasFace = false) {
    const pGroup = new THREE.Group();
    const pGeo = new THREE.DodecahedronGeometry(0.42 * scale, 1);
    pGeo.scale(1.0, 0.8, 1.0);
    const pMesh = new THREE.Mesh(pGeo, hasFace ? mats.pumpkinOrange : mats.pumpkinDark);
    pGroup.add(pMesh);

    // Green curly stem
    const stemGeo = new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 0.22 * scale, 5);
    const stemMesh = new THREE.Mesh(stemGeo, mats.pumpkinStem);
    stemMesh.position.y = 0.35 * scale;
    stemMesh.rotation.z = 0.2;
    pGroup.add(stemMesh);

    if (hasFace) {
      const faceGeo = new THREE.PlaneGeometry(0.24 * scale, 0.16 * scale);
      const faceMesh = new THREE.Mesh(faceGeo, mats.pumpkinGlow);
      faceMesh.position.set(0, 0, 0.38 * scale);
      pGroup.add(faceMesh);
    }
    return pGroup;
  }

  // Scattered pumpkins
  const pumpkinConfigs = [
    { pos: [-0.6, 0.32, 0.8], scale: 1.15, hasFace: true, rotY: 0.2 },
    { pos: [-1.2, 0.24, 0.5], scale: 0.85, hasFace: false, rotY: 0.7 },
    { pos: [0.3, 0.26, 1.1], scale: 0.95, hasFace: true, rotY: -0.4 },
    { pos: [-0.4, 0.22, 1.5], scale: 0.75, hasFace: false, rotY: 1.2 },
    { pos: [1.2, 0.28, 0.4], scale: 1.05, hasFace: false, rotY: 2.1 }
  ];
  pumpkinConfigs.forEach(cfg => {
    const p = createPumpkin(cfg.scale, cfg.hasFace);
    p.position.set(...cfg.pos);
    p.rotation.y = cfg.rotY;
    leftIslandGroup.add(p);
  });

  // Little Cobblestone Pathway across left island
  for (let i = 0; i < 4; i++) {
    const cobGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.08, 6);
    const cob = new THREE.Mesh(cobGeo, mats.stone);
    cob.position.set(1.4 - i * 0.7, 0.04, 0.6 + (i % 2) * 0.3);
    cob.rotation.y = i * 0.8;
    leftIslandGroup.add(cob);
  }

  // Rustic Wooden Arched Footbridge (Connecting Main Island to Left Island)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.name = 'woodenFootbridge';

  const bridgeStartX = -6.2, bridgeStartY = -0.2, bridgeStartZ = 4.2;
  const bridgeEndX = -9.0, bridgeEndY = -0.5, bridgeEndZ = 4.8;
  const plankCount = 9;

  for (let i = 0; i <= plankCount; i++) {
    const t = i / plankCount;
    const archH = Math.sin(t * Math.PI) * 0.42;
    const px = THREE.MathUtils.lerp(bridgeStartX, bridgeEndX, t);
    const py = THREE.MathUtils.lerp(bridgeStartY, bridgeEndY, t) + archH;
    const pz = THREE.MathUtils.lerp(bridgeStartZ, bridgeEndZ, t);

    const plankGeo = new THREE.BoxGeometry(0.32, 0.08, 0.88);
    const plank = new THREE.Mesh(plankGeo, (i % 2 === 0) ? mats.woodPlank : mats.wood);
    plank.position.set(px, py, pz);

    const dx = bridgeEndX - bridgeStartX;
    const dz = bridgeEndZ - bridgeStartZ;
    const angleY = Math.atan2(dx, dz);
    plank.rotation.y = angleY + Math.PI / 2;
    plank.rotation.x = Math.cos(t * Math.PI) * -0.2;
    bridgeGroup.add(plank);

    if (i === 1 || i === 4 || i === 7) {
      const postGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.65, 5);
      const postL = new THREE.Mesh(postGeo, mats.woodDark);
      const postR = new THREE.Mesh(postGeo, mats.woodDark);

      const sideDist = 0.46;
      const perpX = -Math.cos(angleY) * sideDist;
      const perpZ = Math.sin(angleY) * sideDist;

      postL.position.set(px + perpX, py + 0.3, pz + perpZ);
      postR.position.set(px - perpX, py + 0.3, pz - perpZ);
      bridgeGroup.add(postL);
      bridgeGroup.add(postR);
    }
  }

  masterGroup.add(bridgeGroup);
  masterGroup.add(leftIslandGroup);

  // ==============================================================
  // 2. RIGHT SATELLITE ISLAND: THE APPRENTICE'S COTTAGE OUTPOST
  // Position: (11.5, -0.7, -4.5)
  // Solid, fully-connected low-poly architecture with top house night light!
  // ==============================================================
  const rightIslandGroup = new THREE.Group();
  rightIslandGroup.name = 'cottageOutpostIsland';
  rightIslandGroup.position.set(11.5, -0.7, -4.5);

  // Island Base
  const rightBase = createIslandBase(3.5, 4.6, 14);
  rightIslandGroup.add(rightBase);

  // Miniature Fantasy Cottage Model
  const cottage = new THREE.Group();
  cottage.position.set(-0.2, 0.0, 0.2);
  cottage.rotation.y = -0.4;

  // 1. Ground Floor Main Body (y: 0 to 1.6)
  const baseW = 1.9, baseH = 1.6, baseD = 2.1;
  const bodyGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.cottageWall);
  bodyMesh.position.y = baseH * 0.5;
  cottage.add(bodyMesh);

  // Corner Timber Posts
  const cornerGeo = new THREE.BoxGeometry(0.24, baseH + 0.05, 0.24);
  const corners = [
    [-baseW * 0.5, baseH * 0.5, -baseD * 0.5],
    [baseW * 0.5, baseH * 0.5, -baseD * 0.5],
    [-baseW * 0.5, baseH * 0.5, baseD * 0.5],
    [baseW * 0.5, baseH * 0.5, baseD * 0.5]
  ];
  corners.forEach(([cx, cy, cz]) => {
    const cMesh = new THREE.Mesh(cornerGeo, mats.woodDark);
    cMesh.position.set(cx, cy, cz);
    cottage.add(cMesh);
  });

  // Front Arched Wooden Door with Stone Frame
  const doorGeo = new THREE.BoxGeometry(0.68, 1.15, 0.08);
  const doorMesh = new THREE.Mesh(doorGeo, mats.woodDark);
  doorMesh.position.set(0, 0.58, baseD * 0.5 + 0.04);
  cottage.add(doorMesh);

  // Triangular stone keystone above door
  const stonePeakGeo = new THREE.ConeGeometry(0.22, 0.35, 3);
  const stonePeak = new THREE.Mesh(stonePeakGeo, mats.stoneLight);
  stonePeak.position.set(0, 1.32, baseD * 0.5 + 0.06);
  stonePeak.rotation.z = Math.PI;
  cottage.add(stonePeak);

  // Glowing Diamond Window on Front
  const winGeo = new THREE.PlaneGeometry(0.28, 0.28);
  const winMesh = new THREE.Mesh(winGeo, mats.windowGlow);
  winMesh.position.set(0, 1.32, baseD * 0.5 + 0.08);
  winMesh.rotation.z = Math.PI / 4;
  cottage.add(winMesh);

  // Side Balcony Platform with Wood Railing
  const balconyGeo = new THREE.BoxGeometry(0.65, 0.12, 1.1);
  const balcony = new THREE.Mesh(balconyGeo, mats.wood);
  balcony.position.set(-baseW * 0.5 - 0.3, 1.12, 0.0);
  cottage.add(balcony);

  const railingGeo = new THREE.BoxGeometry(0.08, 0.38, 1.1);
  const railing = new THREE.Mesh(railingGeo, mats.woodDark);
  railing.position.set(-baseW * 0.5 - 0.58, 1.35, 0.0);
  cottage.add(railing);

  // 2. Main Teal Shingled Roof Trim (y: 1.62)
  const roofW = baseW + 0.5;
  const roofD = baseD + 0.4;
  const roofTrimGeo = new THREE.BoxGeometry(roofW, 0.12, roofD);
  const roofTrim = new THREE.Mesh(roofTrimGeo, mats.tealRoofTrim);
  roofTrim.position.set(0, baseH + 0.06, 0);
  cottage.add(roofTrim);

  // 3. Middle Tower Shaft (Rising seamlessly through the roof, y: 1.6 to 3.1)
  // This completely connects the lower cottage body to the upper belfry!
  const shaftW = 1.05, shaftH = 1.5, shaftD = 1.05;
  const shaftGeo = new THREE.BoxGeometry(shaftW, shaftH, shaftD);
  const shaftMesh = new THREE.Mesh(shaftGeo, mats.cottageWall);
  shaftMesh.position.set(0, baseH + shaftH * 0.5, 0);
  cottage.add(shaftMesh);

  // Corner timber posts on the shaft
  const sCornerGeo = new THREE.BoxGeometry(0.16, shaftH + 0.04, 0.16);
  const sCorners = [
    [-shaftW * 0.5, baseH + shaftH * 0.5, -shaftD * 0.5],
    [shaftW * 0.5, baseH + shaftH * 0.5, -shaftD * 0.5],
    [-shaftW * 0.5, baseH + shaftH * 0.5, shaftD * 0.5],
    [shaftW * 0.5, baseH + shaftH * 0.5, shaftD * 0.5]
  ];
  sCorners.forEach(([cx, cy, cz]) => {
    const sc = new THREE.Mesh(sCornerGeo, mats.woodDark);
    sc.position.set(cx, cy, cz);
    cottage.add(sc);
  });

  // Diamond window on the middle tower shaft
  const shaftWinGeo = new THREE.PlaneGeometry(0.24, 0.24);
  const shaftWin = new THREE.Mesh(shaftWinGeo, mats.windowGlow);
  shaftWin.position.set(0, baseH + shaftH * 0.55, shaftD * 0.5 + 0.03);
  shaftWin.rotation.z = Math.PI / 4;
  cottage.add(shaftWin);

  // Main Sloped Teal Roof (Mansard / Hip slope wrapping the shaft, y: 1.68 to 2.45)
  // 4-sided truncated cone forming the steep pitched roof around the shaft
  const mainRoofGeo = new THREE.CylinderGeometry(0.72, 1.65, 0.85, 4);
  mainRoofGeo.rotateY(Math.PI / 4);
  const mainRoof = new THREE.Mesh(mainRoofGeo, mats.tealRoof);
  mainRoof.position.set(0, baseH + 0.45, 0);
  cottage.add(mainRoof);

  // 4. Lookout Turret Platform & Trim (y: 3.1)
  const turretPlatformGeo = new THREE.BoxGeometry(1.25, 0.14, 1.25);
  const turretPlatform = new THREE.Mesh(turretPlatformGeo, mats.wood);
  turretPlatform.position.set(0, baseH + shaftH + 0.07, 0);
  cottage.add(turretPlatform);

  // 5. Open Lookout Belfry / Watchtower Section (y: 3.17 to 4.27)
  const belfryH = 1.1;
  const belfryBaseY = baseH + shaftH + 0.14;
  const belfryPillarGeo = new THREE.CylinderGeometry(0.06, 0.07, belfryH, 5);
  const belfryPillarOffsets = [
    [-0.44, belfryBaseY + belfryH * 0.5, -0.44],
    [0.44, belfryBaseY + belfryH * 0.5, -0.44],
    [-0.44, belfryBaseY + belfryH * 0.5, 0.44],
    [0.44, belfryBaseY + belfryH * 0.5, 0.44]
  ];
  belfryPillarOffsets.forEach(([px, py, pz]) => {
    const pMesh = new THREE.Mesh(belfryPillarGeo, mats.woodDark);
    pMesh.position.set(px, py, pz);
    cottage.add(pMesh);
  });

  // Hanging glowing lantern inside the open belfry (The Night Beacon!)
  const turretLanternGroup = new THREE.Group();
  turretLanternGroup.position.set(0, belfryBaseY + belfryH * 0.52, 0);

  const lanternCoreGeo = new THREE.IcosahedronGeometry(0.18, 1);
  const lanternCore = new THREE.Mesh(lanternCoreGeo, mats.windowGlow);
  turretLanternGroup.add(lanternCore);

  const lanternCageGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.28, 5);
  const lanternCage = new THREE.Mesh(lanternCageGeo, mats.woodDark);
  turretLanternGroup.add(lanternCage);

  // Dedicated Top House Light (Brilliant beacon at night!)
  const topHouseLight = new THREE.PointLight(0xffbe44, 1.8, 7.5, 1.1);
  topHouseLight.position.set(0, 0, 0);
  turretLanternGroup.add(topHouseLight);

  cottage.add(turretLanternGroup);

  // 6. Turret Conical Teal Roof (y: 4.27 to 5.27)
  const tRoofTrimGeo = new THREE.CylinderGeometry(1.02, 1.06, 0.08, 8);
  const tRoofTrim = new THREE.Mesh(tRoofTrimGeo, mats.tealRoofTrim);
  tRoofTrim.position.set(0, belfryBaseY + belfryH + 0.04, 0);
  cottage.add(tRoofTrim);

  const tRoofGeo = new THREE.ConeGeometry(0.96, 0.98, 8);
  const tRoof = new THREE.Mesh(tRoofGeo, mats.tealRoof);
  tRoof.position.set(0, belfryBaseY + belfryH + 0.53, 0);
  cottage.add(tRoof);

  // 7. Brass Spire & Golden Crescent Moon Weather Vane (y: 5.27 to 6.2)
  const spirePoleGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.85, 5);
  const spirePole = new THREE.Mesh(spirePoleGeo, mats.goldBrass);
  spirePole.position.set(0, belfryBaseY + belfryH + 1.35, 0);
  cottage.add(spirePole);

  const crescentGroup = new THREE.Group();
  crescentGroup.position.set(0, belfryBaseY + belfryH + 1.78, 0);

  const moonCurve = new THREE.TorusGeometry(0.19, 0.045, 4, 12, Math.PI * 1.35);
  const moonMesh = new THREE.Mesh(moonCurve, mats.goldBrass);
  moonMesh.rotation.z = Math.PI * 0.35;
  crescentGroup.add(moonMesh);

  cottage.add(crescentGroup);

  // Lower interior light for ground floor
  const lowerCottageLight = new THREE.PointLight(0xffbe44, 1.2, 5.0, 1.2);
  lowerCottageLight.position.set(0, 0.9, 0.3);
  cottage.add(lowerCottageLight);

  rightIslandGroup.add(cottage);

  // Little Cobblestones on Right Island
  for (let i = 0; i < 4; i++) {
    const sGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.08, 6);
    const sMesh = new THREE.Mesh(sGeo, mats.stone);
    sMesh.position.set(-1.4 + i * 0.65, 0.04, -0.2 + (i % 2) * 0.25);
    sMesh.rotation.y = i * 0.9;
    rightIslandGroup.add(sMesh);
  }

  // Chain of Levitating Floating Stepping Stones (Connecting Main Island to Right Island)
  const steppingStonesGroup = new THREE.Group();
  steppingStonesGroup.name = 'levitatingSteppingStones';

  const stoneChain = [];
  const startX = 6.0, startY = -0.2, startZ = -2.0;
  const targetX = 8.8, targetY = -0.5, targetZ = -3.8;
  const stoneCount = 6;

  for (let i = 0; i <= stoneCount; i++) {
    const t = i / stoneCount;
    const arcY = Math.sin(t * Math.PI) * 0.25;
    const sx = THREE.MathUtils.lerp(startX, targetX, t) + (Math.sin(t * Math.PI) * 0.4);
    const sy = THREE.MathUtils.lerp(startY, targetY, t) + arcY;
    const sz = THREE.MathUtils.lerp(startZ, targetZ, t);

    const rad = 0.38 + ((i % 2) * 0.08);
    const h = 0.14 + ((i % 2) * 0.04);
    const geo = new THREE.CylinderGeometry(rad, rad * 1.05, h, 6);
    const mesh = new THREE.Mesh(geo, (i % 2 === 0) ? mats.stoneLight : mats.stone);
    mesh.position.set(sx, sy, sz);
    mesh.rotation.y = i * 0.6;
    steppingStonesGroup.add(mesh);

    stoneChain.push({
      mesh,
      baseY: sy,
      phase: i * 0.65
    });
  }

  masterGroup.add(steppingStonesGroup);
  masterGroup.add(rightIslandGroup);

  // Apply shadow casting and receiving across all archipelago objects
  applyShadows(masterGroup);

  // Time-of-Day theme listener for dynamic night lighting
  let targetTopHouseLight = 1.8;
  let targetLowerLight = 1.2;
  let targetPumpkinLight = 1.4;

  function setTheme(theme) {
    if (theme === 'night') {
      // Brilliant beacon in the night sky!
      targetTopHouseLight = 3.2;
      targetLowerLight = 2.2;
      targetPumpkinLight = 2.4;
      mats.windowGlow.emissiveIntensity = 2.6;
      mats.pumpkinGlow.emissiveIntensity = 2.8;
    } else if (theme === 'sunset') {
      targetTopHouseLight = 1.8;
      targetLowerLight = 1.2;
      targetPumpkinLight = 1.4;
      mats.windowGlow.emissiveIntensity = 1.8;
      mats.pumpkinGlow.emissiveIntensity = 2.2;
    } else {
      // Day
      targetTopHouseLight = 0.6;
      targetLowerLight = 0.5;
      targetPumpkinLight = 0.5;
      mats.windowGlow.emissiveIntensity = 1.0;
      mats.pumpkinGlow.emissiveIntensity = 1.2;
    }
  }

  // Animation Update
  function update(time, dt) {
    // 1. Organic, out-of-phase levitation bobbing for both satellite islands
    leftIslandGroup.position.y = -0.6 + Math.sin(time * 1.05 + 0.8) * 0.12;
    leftIslandGroup.rotation.x = Math.sin(time * 0.8 + 0.4) * 0.012;
    leftIslandGroup.rotation.z = Math.cos(time * 0.7 + 0.9) * 0.012;

    rightIslandGroup.position.y = -0.7 + Math.sin(time * 0.95 + 2.2) * 0.14;
    rightIslandGroup.rotation.x = Math.sin(time * 0.75 + 1.2) * 0.012;
    rightIslandGroup.rotation.z = Math.cos(time * 0.85 + 2.5) * 0.012;

    // 2. Hanging Pumpkin Lantern pendulum breeze sway
    lanternPendulum.rotation.z = Math.sin(time * 2.0) * 0.09;
    lanternPendulum.rotation.x = Math.cos(time * 1.5) * 0.05;

    // 3. Levitating Stepping Stones gentle organic breath
    stoneChain.forEach(st => {
      st.mesh.position.y = st.baseY + Math.sin(time * 1.8 + st.phase) * 0.035;
    });

    // 4. Crescent Moon Weather Vane gentle breeze swivel
    crescentGroup.rotation.y = Math.sin(time * 0.6) * 0.25;

    // 5. Smoothly interpolate lighting intensities
    topHouseLight.intensity += (targetTopHouseLight - topHouseLight.intensity) * 0.08;
    lowerCottageLight.intensity += (targetLowerLight - lowerCottageLight.intensity) * 0.08;
    pumpkinLight.intensity += (targetPumpkinLight - pumpkinLight.intensity) * 0.08;
  }

  return {
    group: masterGroup,
    leftIsland: leftIslandGroup,
    rightIsland: rightIslandGroup,
    setTheme,
    update
  };
}
