import * as THREE from 'three';

export function createTowerModel() {
  const modelRoot = new THREE.Group();
  modelRoot.name = 'floatingIslandRoot';

  // Master materials with flatShading enabled for authentic low-poly aesthetic
  const materials = {
    grass: new THREE.MeshStandardMaterial({
      color: 0x76a742,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    }),
    rock: new THREE.MeshStandardMaterial({
      color: 0x7a523a,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    }),
    rockDark: new THREE.MeshStandardMaterial({
      color: 0x5a3c2a,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    }),
    stone: new THREE.MeshStandardMaterial({
      color: 0x9ea4ae,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: true
    }),
    stoneDark: new THREE.MeshStandardMaterial({
      color: 0x7c818c,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    }),
    stoneLight: new THREE.MeshStandardMaterial({
      color: 0xb5bac3,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0x754a2e,
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true
    }),
    woodDark: new THREE.MeshStandardMaterial({
      color: 0x54331e,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true
    }),
    plaster: new THREE.MeshStandardMaterial({
      color: 0xf2e8d7,
      roughness: 0.85,
      metalness: 0.02,
      flatShading: true
    }),
    roofSlate: new THREE.MeshStandardMaterial({
      color: 0x3d4158,
      roughness: 0.65,
      metalness: 0.1,
      flatShading: true
    }),
    roofSlateTrim: new THREE.MeshStandardMaterial({
      color: 0x4e5370,
      roughness: 0.6,
      metalness: 0.15,
      flatShading: true
    }),
    windowGlow: new THREE.MeshStandardMaterial({
      color: 0xffda55,
      emissive: 0xffaa22,
      emissiveIntensity: 1.4,
      roughness: 0.3,
      flatShading: true
    }),
    cauldronIron: new THREE.MeshStandardMaterial({
      color: 0x2b2e3e,
      roughness: 0.5,
      metalness: 0.6,
      flatShading: true
    }),
    potionGlow: new THREE.MeshStandardMaterial({
      color: 0x40ff70,
      emissive: 0x32e562,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      flatShading: true
    }),
    treeFoliageDark: new THREE.MeshStandardMaterial({
      color: 0x387440,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: true
    }),
    treeFoliageLight: new THREE.MeshStandardMaterial({
      color: 0x488b4f,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: true
    }),
    mushroomCap: new THREE.MeshStandardMaterial({
      color: 0xd93836,
      roughness: 0.5,
      metalness: 0.0,
      flatShading: true
    }),
    mushroomStem: new THREE.MeshStandardMaterial({
      color: 0xf5eedc,
      roughness: 0.85,
      flatShading: true
    }),
    brass: new THREE.MeshStandardMaterial({
      color: 0xd9a43e,
      roughness: 0.35,
      metalness: 0.85,
      flatShading: true
    })
  };

  // Helper for shadow flags
  function applyShadows(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return obj;
  }

  // ==========================================
  // 1. FLOATING ISLAND (TOP DISC + UNDERSIDE CRAG)
  // ==========================================
  const islandGroup = new THREE.Group();
  islandGroup.name = 'islandBase';

  // Grassy top plateau (faceted 16-sided cylinder)
  const islandRadius = 7.0;
  const grassGeo = new THREE.CylinderGeometry(islandRadius, islandRadius + 0.2, 0.6, 18);
  const grassMesh = new THREE.Mesh(grassGeo, materials.grass);
  grassMesh.position.y = -0.3;
  islandGroup.add(grassMesh);

  // Underside faceted rocky stalactite cone
  const coneRadius = islandRadius + 0.15;
  const coneHeight = 6.8;
  const rockGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 18, 6);
  // Displace rock vertices to make rugged crystalline facets
  const pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < coneHeight * 0.45) { // below top rim
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(z, x);
      const noise = (Math.sin(angle * 5) * 0.4 + Math.cos(y * 1.5) * 0.35 + Math.sin(angle * 3 + y) * 0.25);
      pos.setX(i, x * (1 + noise * 0.15));
      pos.setZ(i, z * (1 + noise * 0.15));
      pos.setY(i, y + noise * 0.2);
    }
  }
  rockGeo.computeVertexNormals();
  const rockMesh = new THREE.Mesh(rockGeo, materials.rock);
  rockMesh.rotation.x = Math.PI; // point downwards
  rockMesh.position.y = -0.6 - coneHeight * 0.5;
  islandGroup.add(rockMesh);

  // Stepping stones path curving toward the door
  const pathGroup = new THREE.Group();
  const stonePositions = [
    [0.3, 0.04, 3.4, 0.48, 0.12, 0.42],
    [0.7, 0.04, 3.9, 0.42, 0.10, 0.38],
    [1.3, 0.04, 4.3, 0.50, 0.11, 0.45],
    [1.9, 0.04, 4.6, 0.44, 0.10, 0.40],
    [2.6, 0.04, 4.8, 0.38, 0.09, 0.36],
    [3.2, 0.04, 5.1, 0.42, 0.10, 0.38]
  ];
  stonePositions.forEach(([x, y, z, rx, ry, rz], idx) => {
    const sGeo = new THREE.CylinderGeometry(rx, rx * 1.05, ry, 7);
    const sMesh = new THREE.Mesh(sGeo, materials.stoneLight);
    sMesh.position.set(x, y, z);
    sMesh.rotation.y = idx * 0.7;
    pathGroup.add(sMesh);
  });
  islandGroup.add(pathGroup);

  // Cute mushrooms
  const mushroomGroup = new THREE.Group();
  function addMushroom(x, z, scale = 1.0, capRot = 0) {
    const m = new THREE.Group();
    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.35 * scale, 6);
    const stem = new THREE.Mesh(stemGeo, materials.mushroomStem);
    stem.position.y = 0.17 * scale;
    m.add(stem);
    // Cap
    const capGeo = new THREE.ConeGeometry(0.3 * scale, 0.25 * scale, 8);
    const cap = new THREE.Mesh(capGeo, materials.mushroomCap);
    cap.position.y = 0.32 * scale;
    cap.rotation.z = capRot;
    m.add(cap);
    // White spot dots
    for (let i = 0; i < 4; i++) {
      const spotGeo = new THREE.BoxGeometry(0.06 * scale, 0.04 * scale, 0.06 * scale);
      const spot = new THREE.Mesh(spotGeo, materials.mushroomStem);
      const theta = (i / 4) * Math.PI * 2;
      spot.position.set(Math.cos(theta) * 0.15 * scale, 0.26 * scale, Math.sin(theta) * 0.15 * scale);
      m.add(spot);
    }
    m.position.set(x, 0, z);
    mushroomGroup.add(m);
  }
  // Cluster 1 (near door / path)
  addMushroom(-1.3, 3.6, 1.2, 0.1);
  addMushroom(-1.7, 3.8, 0.8, -0.15);
  addMushroom(-1.0, 4.0, 0.7, 0.1);
  // Cluster 2 (near trees)
  addMushroom(-4.2, 2.2, 1.1, -0.1);
  addMushroom(-4.5, 2.6, 0.8, 0.2);
  // Cluster 3 (near cauldron)
  addMushroom(2.5, 2.2, 1.3, 0.15);
  addMushroom(2.8, 1.8, 0.9, -0.1);
  addMushroom(3.8, 2.2, 0.75, 0.05);
  islandGroup.add(mushroomGroup);

  // Alchemist's Cauldron
  const cauldronGroup = new THREE.Group();
  cauldronGroup.name = 'cauldron';
  cauldronGroup.position.set(3.2, 0, 1.2);

  // Cauldron belly (faceted sphere/cylinder)
  const potGeo = new THREE.SphereGeometry(0.75, 10, 8);
  const potMesh = new THREE.Mesh(potGeo, materials.cauldronIron);
  potMesh.position.y = 0.7;
  potMesh.scale.set(1, 0.85, 1);
  cauldronGroup.add(potMesh);

  // Rim collar
  const rimGeo = new THREE.TorusGeometry(0.68, 0.09, 6, 12);
  const rimMesh = new THREE.Mesh(rimGeo, materials.cauldronIron);
  rimMesh.rotation.x = Math.PI * 0.5;
  rimMesh.position.y = 1.18;
  cauldronGroup.add(rimMesh);

  // Green bubbling potion surface
  const potionGeo = new THREE.CircleGeometry(0.65, 12);
  const potionMesh = new THREE.Mesh(potionGeo, materials.potionGlow);
  potionMesh.rotation.x = -Math.PI * 0.5;
  potionMesh.position.y = 1.15;
  cauldronGroup.add(potionMesh);

  // Cauldron wooden support legs
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 5);
    const leg = new THREE.Mesh(legGeo, materials.woodDark);
    leg.position.set(Math.cos(angle) * 0.55, 0.35, Math.sin(angle) * 0.55);
    leg.rotation.z = -Math.cos(angle) * 0.3;
    leg.rotation.x = Math.sin(angle) * 0.3;
    cauldronGroup.add(leg);
  }
  islandGroup.add(cauldronGroup);

  // Clustered Pine / Fir Trees (3 majestic low-poly firs)
  const treesGroup = new THREE.Group();
  function createPineTree(x, z, scale = 1.0, foliageMat = materials.treeFoliageDark) {
    const tree = new THREE.Group();
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.22 * scale, 0.3 * scale, 1.8 * scale, 6);
    const trunk = new THREE.Mesh(trunkGeo, materials.woodDark);
    trunk.position.y = 0.9 * scale;
    tree.add(trunk);

    // Foliage tiers (stacked faceted cones)
    const tiers = [
      { r: 1.4 * scale, h: 1.8 * scale, y: 1.8 * scale },
      { r: 1.15 * scale, h: 1.6 * scale, y: 2.8 * scale },
      { r: 0.85 * scale, h: 1.5 * scale, y: 3.7 * scale },
      { r: 0.55 * scale, h: 1.3 * scale, y: 4.6 * scale }
    ];
    tiers.forEach((t, i) => {
      const fGeo = new THREE.ConeGeometry(t.r, t.h, 7);
      const fMesh = new THREE.Mesh(fGeo, i % 2 === 0 ? foliageMat : materials.treeFoliageLight);
      fMesh.position.y = t.y;
      fMesh.rotation.y = i * 0.4;
      tree.add(fMesh);
    });

    tree.position.set(x, 0, z);
    return tree;
  }
  treesGroup.add(createPineTree(-3.5, 0.0, 1.3, materials.treeFoliageDark));
  treesGroup.add(createPineTree(-4.2, 1.8, 1.0, materials.treeFoliageLight));
  treesGroup.add(createPineTree(-2.8, -1.8, 1.15, materials.treeFoliageDark));
  treesGroup.add(createPineTree(-2.0, -3.2, 0.85, materials.treeFoliageLight));
  islandGroup.add(treesGroup);

  // Small grass blade tufts
  const grassTuftsGroup = new THREE.Group();
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + (Math.sin(i * 3) * 0.2);
    const r = 2.5 + (Math.abs(Math.sin(i * 5)) * 3.8);
    // Don't place under tower or cauldron
    const gx = Math.cos(angle) * r;
    const gz = Math.sin(angle) * r;
    if (Math.hypot(gx, gz) > 2.7) {
      const tuftGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
      const tuft = new THREE.Mesh(tuftGeo, materials.grass);
      tuft.position.set(gx, 0.2, gz);
      tuft.rotation.x = Math.sin(i) * 0.3;
      tuft.rotation.z = Math.cos(i) * 0.3;
      grassTuftsGroup.add(tuft);
    }
  }
  islandGroup.add(grassTuftsGroup);

  modelRoot.add(islandGroup);

  // ==========================================
  // 2. TOWER BODY (LOWER STONE MASONRY)
  // ==========================================
  const towerGroup = new THREE.Group();
  towerGroup.name = 'tower';

  // Base stone cylindrical body (14 segments, slight inward taper)
  const stoneBaseGeo = new THREE.CylinderGeometry(2.35, 2.8, 5.2, 14);
  const stoneBaseMesh = new THREE.Mesh(stoneBaseGeo, materials.stone);
  stoneBaseMesh.position.y = 2.6;
  towerGroup.add(stoneBaseMesh);

  // Protruding accent stone bricks
  const bricksGroup = new THREE.Group();
  const brickGeo = new THREE.BoxGeometry(0.55, 0.3, 0.22);
  const brickCoords = [
    // [y, angle, radius, rotY]
    [0.9, 0.4, 2.7, 0.4],
    [1.4, -0.6, 2.65, -0.6],
    [2.1, 0.2, 2.55, 0.2],
    [2.8, -0.3, 2.5, -0.3],
    [3.5, 0.5, 2.45, 0.5],
    [4.2, -0.4, 2.4, -0.4],
    [1.2, 1.2, 2.65, 1.2],
    [2.6, 1.0, 2.52, 1.0],
    [3.8, 1.3, 2.42, 1.3],
    [0.8, -1.4, 2.72, -1.4],
    [2.3, -1.2, 2.58, -1.2],
    [3.9, -1.0, 2.42, -1.0],
    [1.8, 2.2, 2.6, 2.2],
    [3.2, 2.5, 2.48, 2.5],
    [4.5, 0.1, 2.38, 0.1]
  ];
  brickCoords.forEach(([y, angle, r, rotY]) => {
    const brick = new THREE.Mesh(brickGeo, Math.random() > 0.4 ? materials.stoneDark : materials.stoneLight);
    brick.position.set(Math.sin(angle) * r, y, Math.cos(angle) * r);
    brick.rotation.y = rotY;
    bricksGroup.add(brick);
  });
  towerGroup.add(bricksGroup);

  // Wooden ring trim bands encircling the tower
  const lowerRingGeo = new THREE.CylinderGeometry(2.72, 2.72, 0.2, 14);
  const lowerRing = new THREE.Mesh(lowerRingGeo, materials.wood);
  lowerRing.position.y = 1.6;
  towerGroup.add(lowerRing);

  const midRingGeo = new THREE.CylinderGeometry(2.45, 2.45, 0.22, 14);
  const midRing = new THREE.Mesh(midRingGeo, materials.wood);
  midRing.position.y = 5.1;
  towerGroup.add(midRing);

  // Arched Stone Entrance & Wooden Door
  const entranceGroup = new THREE.Group();
  entranceGroup.position.set(0, 0, 2.5);

  // Stone arch portal surround
  const archSurroundGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.45, 10, 1, false, 0, Math.PI);
  const archSurround = new THREE.Mesh(archSurroundGeo, materials.stoneDark);
  archSurround.rotation.z = Math.PI * 0.5;
  archSurround.position.set(0, 1.8, 0.15);
  entranceGroup.add(archSurround);

  const jambLeftGeo = new THREE.BoxGeometry(0.35, 1.8, 0.45);
  const jambLeft = new THREE.Mesh(jambLeftGeo, materials.stoneDark);
  jambLeft.position.set(-0.9, 0.9, 0.15);
  entranceGroup.add(jambLeft);

  const jambRight = jambLeft.clone();
  jambRight.position.x = 0.9;
  entranceGroup.add(jambRight);

  // Recessed wooden door
  const doorGeo = new THREE.BoxGeometry(1.3, 1.7, 0.15);
  const doorMesh = new THREE.Mesh(doorGeo, materials.woodDark);
  doorMesh.position.set(0, 0.85, 0.05);
  entranceGroup.add(doorMesh);

  // Door iron knocker / handle ring
  const knockerGeo = new THREE.TorusGeometry(0.09, 0.025, 6, 8);
  const knocker = new THREE.Mesh(knockerGeo, materials.cauldronIron);
  knocker.position.set(0.35, 0.85, 0.15);
  entranceGroup.add(knocker);

  towerGroup.add(entranceGroup);

  // Mid-level arched window (with warm glowing interior pane)
  const midWindowGroup = new THREE.Group();
  const mwAngle = 0.5; // facing front-right
  const mwDist = 2.45;
  midWindowGroup.position.set(Math.sin(mwAngle) * mwDist, 3.6, Math.cos(mwAngle) * mwDist);
  midWindowGroup.rotation.y = mwAngle;

  // Window frame surround
  const winFrameGeo = new THREE.BoxGeometry(0.7, 1.0, 0.25);
  const winFrame = new THREE.Mesh(winFrameGeo, materials.wood);
  midWindowGroup.add(winFrame);

  // Glowing pane
  const winPaneGeo = new THREE.PlaneGeometry(0.5, 0.8);
  const winPane = new THREE.Mesh(winPaneGeo, materials.windowGlow);
  winPane.position.z = 0.14;
  midWindowGroup.add(winPane);

  // Wooden window sill
  const sillGeo = new THREE.BoxGeometry(0.85, 0.12, 0.35);
  const sill = new THREE.Mesh(sillGeo, materials.woodDark);
  sill.position.set(0, -0.52, 0.06);
  midWindowGroup.add(sill);

  towerGroup.add(midWindowGroup);

  // ==========================================
  // 3. UPPER TIMBER-FRAMED CHAMBER (TUDOR ROOM)
  // ==========================================
  const upperChamberGroup = new THREE.Group();
  upperChamberGroup.position.y = 5.2;

  // Corbel brackets supporting the overhang
  const corbelRadius = 2.38;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const corbelGeo = new THREE.BoxGeometry(0.2, 0.5, 0.4);
    const corbel = new THREE.Mesh(corbelGeo, materials.woodDark);
    corbel.position.set(Math.sin(angle) * corbelRadius, 0.1, Math.cos(angle) * corbelRadius);
    corbel.rotation.y = angle;
    upperChamberGroup.add(corbel);
  }

  // Wooden floor plate
  const floorPlateGeo = new THREE.CylinderGeometry(2.8, 2.45, 0.3, 14);
  const floorPlate = new THREE.Mesh(floorPlateGeo, materials.wood);
  floorPlate.position.y = 0.35;
  upperChamberGroup.add(floorPlate);

  // Plaster wall cylinder
  const plasterGeo = new THREE.CylinderGeometry(2.7, 2.7, 2.3, 14);
  const plasterMesh = new THREE.Mesh(plasterGeo, materials.plaster);
  plasterMesh.position.y = 1.55;
  upperChamberGroup.add(plasterMesh);

  // Tudor timber framing: vertical posts and diagonal cross braces
  const timberFraming = new THREE.Group();
  const numPosts = 10;
  for (let i = 0; i < numPosts; i++) {
    const angle = (i / numPosts) * Math.PI * 2;
    // Vertical beam
    const postGeo = new THREE.BoxGeometry(0.18, 2.3, 0.15);
    const post = new THREE.Mesh(postGeo, materials.woodDark);
    post.position.set(Math.sin(angle) * 2.72, 1.55, Math.cos(angle) * 2.72);
    post.rotation.y = angle;
    timberFraming.add(post);

    // Diagonal timber brace between alternate posts
    if (i % 2 === 0) {
      const nextAngle = ((i + 1) / numPosts) * Math.PI * 2;
      const midAngle = (angle + nextAngle) * 0.5;
      const braceGeo = new THREE.BoxGeometry(0.12, 2.4, 0.1);
      const brace = new THREE.Mesh(braceGeo, materials.woodDark);
      brace.position.set(Math.sin(midAngle) * 2.71, 1.55, Math.cos(midAngle) * 2.71);
      brace.rotation.y = midAngle;
      brace.rotation.z = 0.55;
      timberFraming.add(brace);
    }
  }
  upperChamberGroup.add(timberFraming);

  // Upper room glowing windows (with cross muntins)
  const upperWindows = [
    { angle: 0.35, y: 1.6 },
    { angle: 1.6, y: 1.6 },
    { angle: -0.9, y: 1.6 },
    { angle: -2.2, y: 1.6 }
  ];
  upperWindows.forEach((w) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(Math.sin(w.angle) * 2.75, w.y, Math.cos(w.angle) * 2.75);
    winGroup.rotation.y = w.angle;

    // Glowing glass
    const gGeo = new THREE.PlaneGeometry(0.7, 0.9);
    const gMesh = new THREE.Mesh(gGeo, materials.windowGlow);
    gMesh.position.z = 0.05;
    winGroup.add(gMesh);

    // Window wood frame surround
    const fGeo = new THREE.BoxGeometry(0.85, 1.05, 0.12);
    const fMesh = new THREE.Mesh(fGeo, materials.wood);
    winGroup.add(fMesh);

    // Cross bars (muntins)
    const hBarGeo = new THREE.BoxGeometry(0.7, 0.06, 0.08);
    const hBar = new THREE.Mesh(hBarGeo, materials.woodDark);
    hBar.position.z = 0.06;
    winGroup.add(hBar);

    const vBarGeo = new THREE.BoxGeometry(0.06, 0.9, 0.08);
    const vBar = new THREE.Mesh(vBarGeo, materials.woodDark);
    vBar.position.z = 0.06;
    winGroup.add(vBar);

    upperChamberGroup.add(winGroup);
  });

  // Top rim wooden collar below roof
  const topCollarGeo = new THREE.CylinderGeometry(2.9, 2.75, 0.25, 14);
  const topCollar = new THREE.Mesh(topCollarGeo, materials.wood);
  topCollar.position.y = 2.75;
  upperChamberGroup.add(topCollar);

  towerGroup.add(upperChamberGroup);

  // ==========================================
  // 4. WIZARD HAT ROOF & CURVED CROOKED SPIRE
  // ==========================================
  const roofGroup = new THREE.Group();
  roofGroup.name = 'wizardRoof';
  roofGroup.position.y = 8.1; // Sits right above upper chamber

  // Flared lower roof eave / brim (circular cone brim)
  const roofBrimGeo = new THREE.CylinderGeometry(2.6, 3.8, 0.65, 14);
  const roofBrim = new THREE.Mesh(roofBrimGeo, materials.roofSlate);
  roofBrim.position.y = 0.35;
  roofGroup.add(roofBrim);

  // Roof eave wooden trim ring
  const brimTrimGeo = new THREE.TorusGeometry(3.78, 0.1, 6, 14);
  const brimTrim = new THREE.Mesh(brimTrimGeo, materials.roofSlateTrim);
  brimTrim.rotation.x = Math.PI * 0.5;
  brimTrim.position.y = 0.05;
  roofGroup.add(brimTrim);

  // Curved Wizard Spire Loft
  // Procedural segmented cone bending and curving smoothly into a crooked wizard tip!
  const spireSegments = 12; // vertical rings
  const spireRadial = 10;   // low poly radial facets
  const spireHeight = 6.4;

  // Bezier curve defining the crooked spine of the wizard hat
  const spireCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0.65, 0),
    new THREE.Vector3(0.05, 2.5, 0.05),
    new THREE.Vector3(-0.6, 4.8, 0.3),
    new THREE.Vector3(-1.35, spireHeight + 0.65, 0.65)
  );

  const spireVerts = [];
  const spireIndices = [];

  for (let j = 0; j <= spireSegments; j++) {
    const t = j / spireSegments;
    const center = spireCurve.getPoint(t);
    const tangent = spireCurve.getTangent(t).normalize();
    // Compute perpendicular frame
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    // Radius tapers from 2.5 down to 0.08 at the tip
    const r = Math.max(0.06, 2.55 * Math.pow(1 - t, 0.88));

    for (let i = 0; i < spireRadial; i++) {
      const theta = (i / spireRadial) * Math.PI * 2;
      const xOffset = (Math.cos(theta) * normal.x + Math.sin(theta) * binormal.x) * r;
      const yOffset = (Math.cos(theta) * normal.y + Math.sin(theta) * binormal.y) * r;
      const zOffset = (Math.cos(theta) * normal.z + Math.sin(theta) * binormal.z) * r;

      spireVerts.push(center.x + xOffset, center.y + yOffset, center.z + zOffset);
    }
  }

  // Generate face indices for the spire rings
  for (let j = 0; j < spireSegments; j++) {
    for (let i = 0; i < spireRadial; i++) {
      const nextI = (i + 1) % spireRadial;
      const r0 = j * spireRadial;
      const r1 = (j + 1) * spireRadial;

      const a = r0 + i;
      const b = r0 + nextI;
      const c = r1 + nextI;
      const d = r1 + i;

      spireIndices.push(a, b, d);
      spireIndices.push(b, c, d);
    }
  }

  // Cap the very tip with a small low-poly beak
  const tipCenter = spireCurve.getPoint(1.0);
  const tipIndex = spireVerts.length / 3;
  spireVerts.push(tipCenter.x - 0.2, tipCenter.y + 0.35, tipCenter.z + 0.15);
  const lastRingStart = spireSegments * spireRadial;
  for (let i = 0; i < spireRadial; i++) {
    const nextI = (i + 1) % spireRadial;
    spireIndices.push(lastRingStart + i, lastRingStart + nextI, tipIndex);
  }

  const spireGeo = new THREE.BufferGeometry();
  spireGeo.setAttribute('position', new THREE.Float32BufferAttribute(spireVerts, 3));
  spireGeo.setIndex(spireIndices);
  spireGeo.computeVertexNormals();

  const spireMesh = new THREE.Mesh(spireGeo, materials.roofSlate);
  roofGroup.add(spireMesh);

  // Roof Dormer Window (Nestled into front-right slope of roof)
  const dormerGroup = new THREE.Group();
  dormerGroup.position.set(1.15, 1.3, 1.45);
  dormerGroup.rotation.y = 0.7;

  // Dormer cottage body
  const dormerBodyGeo = new THREE.BoxGeometry(0.75, 0.75, 0.9);
  const dormerBody = new THREE.Mesh(dormerBodyGeo, materials.plaster);
  dormerGroup.add(dormerBody);

  // Dormer pitched roof
  const dormerRoofGeo = new THREE.ConeGeometry(0.65, 0.5, 4);
  const dormerRoof = new THREE.Mesh(dormerRoofGeo, materials.roofSlate);
  dormerRoof.rotation.y = Math.PI * 0.25;
  dormerRoof.position.set(0, 0.55, 0);
  dormerRoof.scale.set(1.1, 1, 1.3);
  dormerGroup.add(dormerRoof);

  // Dormer twin glowing window
  const dormerWinGeo = new THREE.PlaneGeometry(0.48, 0.48);
  const dormerWin = new THREE.Mesh(dormerWinGeo, materials.windowGlow);
  dormerWin.position.set(0, 0.05, 0.46);
  dormerGroup.add(dormerWin);

  roofGroup.add(dormerGroup);

  // Stone Chimney with low-poly smoke origin
  const chimneyGroup = new THREE.Group();
  chimneyGroup.name = 'chimney';
  chimneyGroup.position.set(-1.6, 2.1, -0.6);
  chimneyGroup.rotation.z = 0.12;
  chimneyGroup.rotation.x = -0.08;

  // Chimney stack
  const chimneyGeo = new THREE.BoxGeometry(0.65, 1.6, 0.65);
  const chimneyMesh = new THREE.Mesh(chimneyGeo, materials.stoneDark);
  chimneyGroup.add(chimneyMesh);

  // Chimney flared rim
  const chimRimGeo = new THREE.BoxGeometry(0.78, 0.18, 0.78);
  const chimRim = new THREE.Mesh(chimRimGeo, materials.stoneLight);
  chimRim.position.y = 0.85;
  chimneyGroup.add(chimRim);

  roofGroup.add(chimneyGroup);

  // Astronomical Brass Telescope on Tripod
  const telescopeGroup = new THREE.Group();
  telescopeGroup.name = 'telescope';
  telescopeGroup.position.set(1.4, 0.8, -1.5);
  telescopeGroup.rotation.y = -1.2;

  // Tripod wooden legs
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5);
    const leg = new THREE.Mesh(legGeo, materials.woodDark);
    leg.position.set(Math.cos(angle) * 0.35, 0.5, Math.sin(angle) * 0.35);
    leg.rotation.z = -Math.cos(angle) * 0.3;
    leg.rotation.x = Math.sin(angle) * 0.3;
    telescopeGroup.add(leg);
  }

  // Brass pivot mount
  const mountGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const mount = new THREE.Mesh(mountGeo, materials.brass);
  mount.position.y = 1.05;
  telescopeGroup.add(mount);

  // Telescope tube (tilted up 42 degrees toward sky)
  const tubeGroup = new THREE.Group();
  tubeGroup.position.y = 1.05;
  tubeGroup.rotation.x = -0.72; // tilted up

  const mainTubeGeo = new THREE.CylinderGeometry(0.12, 0.09, 1.4, 8);
  const mainTube = new THREE.Mesh(mainTubeGeo, materials.brass);
  mainTube.position.z = 0.3;
  mainTube.rotation.x = Math.PI * 0.5;
  tubeGroup.add(mainTube);

  // Objective lens hood
  const hoodGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.25, 8);
  const hood = new THREE.Mesh(hoodGeo, materials.brass);
  hood.position.z = 1.05;
  hood.rotation.x = Math.PI * 0.5;
  tubeGroup.add(hood);

  // Eyepiece
  const eyeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6);
  const eyepiece = new THREE.Mesh(eyeGeo, materials.cauldronIron);
  eyepiece.position.z = -0.45;
  eyepiece.rotation.x = Math.PI * 0.5;
  tubeGroup.add(eyepiece);

  telescopeGroup.add(tubeGroup);
  roofGroup.add(telescopeGroup);

  towerGroup.add(roofGroup);
  modelRoot.add(towerGroup);

  // Enable shadows on all meshes
  applyShadows(modelRoot);

  // Floating Island gentle breathing / bobbing animation state
  let baseTime = 0;
  function update(time, dt) {
    baseTime = time;
    // Gentle hovering bob of the floating island
    const hoverY = Math.sin(time * 1.2) * 0.18;
    const hoverTiltX = Math.sin(time * 0.8) * 0.015;
    const hoverTiltZ = Math.cos(time * 0.9) * 0.015;

    modelRoot.position.y = hoverY;
    modelRoot.rotation.x = hoverTiltX;
    modelRoot.rotation.z = hoverTiltZ;
  }

  // Get landmarks for camera focus points & hotspots
  const landmarks = {
    sanctuary: new THREE.Vector3(0, 5, 0),
    topSpire: new THREE.Vector3(-1.35, 14.8, 0.65),
    telescope: new THREE.Vector3(1.4, 9.8, -1.5),
    chimney: new THREE.Vector3(-1.6, 10.2, -0.6),
    upperChamber: new THREE.Vector3(0, 6.8, 0),
    midWindow: new THREE.Vector3(1.5, 3.6, 1.8),
    entrance: new THREE.Vector3(0, 1.5, 2.5),
    cauldron: new THREE.Vector3(3.2, 1.0, 1.2),
    underworldRoots: new THREE.Vector3(0, -4.5, 0)
  };

  return {
    group: modelRoot,
    materials,
    landmarks,
    chimneyOrigin: new THREE.Vector3(-1.6, 11.2, -0.6),
    cauldronOrigin: new THREE.Vector3(3.2, 1.2, 1.2),
    update
  };
}
