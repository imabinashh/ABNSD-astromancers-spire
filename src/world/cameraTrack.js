import * as THREE from 'three';

// ============================================================================
// Multi-Island Archipelago Guided Flight Path (Continuous Catmull-Rom Spline):
// 1. Initial Overview -> Smooth glide in to Main Spire
// 2. Slow, intimate orbit around Main Spire (entrance door, cauldron, timber study, roof)
// 3. Arched rope bridge crossing -> Pumpkin Grove FRONT (lantern, pumpkins, crane)
// 4. Pumpkin Grove orbit from FRONT to BACK
// 5. Rear Fly-By behind the Main Spire (chimney smoke, rear crags, clouds)
// 6. Cottage Outpost BACK side
// 7. Cottage Outpost orbit from BACK to FRONT (turquoise roof, belfry, stepping stones)
// 8. Grand Pullback back to initial panoramic overview framed by the rainbow
// ============================================================================

export function createCameraTrack() {
  const overviewPos = new THREE.Vector3(10.0, 10.8, 32.5);
  const overviewTarget = new THREE.Vector3(0.0, 5.2, 0.0);
  const overviewFov = 42;

  // 1. Camera Flight Waypoints (16 synchronized control points)
  const camPoints = [
    new THREE.Vector3(10.0, 10.8, 32.5),   // 0 (p = 0.000): Panoramic Initial Overview
    new THREE.Vector3(7.2, 7.8, 20.0),     // 1 (p = 0.067): Gliding in toward the Sanctuary Spire
    new THREE.Vector3(4.2, 5.6, 12.8),     // 2 (p = 0.133): Spire Front-Right: bubbling cauldron & study
    new THREE.Vector3(0.0, 5.8, 12.8),     // 3 (p = 0.200): Spire Front-Center: arched door, windows & crooked roof
    new THREE.Vector3(-4.5, 5.2, 12.2),    // 4 (p = 0.267): Spire Front-Left: pine forest & red mushrooms
    new THREE.Vector3(-8.0, 4.2, 13.5),    // 5 (p = 0.333): Low glide along arched wooden rope bridge
    new THREE.Vector3(-11.5, 3.8, 16.5),   // 6 (p = 0.400): Pumpkin Grove FRONT: hanging lantern crane & pumpkins
    new THREE.Vector3(-18.5, 3.8, 5.0),    // 7 (p = 0.467): Pumpkin Grove Outer Left Flank
    new THREE.Vector3(-11.5, 4.2, -5.5),   // 8 (p = 0.533): Pumpkin Grove BACK side
    new THREE.Vector3(-5.5, 6.8, -13.5),   // 9 (p = 0.600): Behind Spire: left rear crag
    new THREE.Vector3(0.0, 7.5, -15.0),    // 10 (p = 0.667): Behind Spire: chimney smoke & rear observatory
    new THREE.Vector3(6.0, 6.5, -13.5),    // 11 (p = 0.733): Behind Spire: gliding toward Cottage Outpost
    new THREE.Vector3(11.5, 4.5, -15.5),   // 12 (p = 0.800): Cottage Outpost BACK side
    new THREE.Vector3(18.5, 4.2, -4.5),    // 13 (p = 0.867): Cottage Outpost Outer Right Flank
    new THREE.Vector3(11.5, 4.2, 7.5),     // 14 (p = 0.933): Cottage Outpost FRONT: belfry & stepping stones
    new THREE.Vector3(10.0, 10.8, 32.5)    // 15 (p = 1.000): Grand Pullback to Panoramic Overview
  ];

  // 2. Synchronized Camera Look-At Target Waypoints (Matches camPoints 1-to-1)
  const targetPoints = [
    new THREE.Vector3(0.0, 5.2, 0.0),      // 0: Spire center overview
    new THREE.Vector3(0.0, 5.2, 0.0),      // 1: Spire center
    new THREE.Vector3(0.8, 4.5, 0.8),      // 2: Spire cauldron & lower window
    new THREE.Vector3(0.0, 5.0, 0.0),      // 3: Spire front door & timber study
    new THREE.Vector3(-1.0, 4.5, 0.5),     // 4: Spire pine grove & base
    new THREE.Vector3(-9.5, 1.8, 5.5),     // 5: Rope bridge mid-span
    new THREE.Vector3(-11.5, 0.8, 5.0),    // 6: Pumpkin Grove center
    new THREE.Vector3(-11.5, 0.8, 5.0),    // 7: Pumpkin Grove center
    new THREE.Vector3(-11.5, 0.8, 5.0),    // 8: Pumpkin Grove center
    new THREE.Vector3(0.0, 5.2, 0.0),      // 9: Spire rear center
    new THREE.Vector3(0.0, 5.5, 0.0),      // 10: Spire chimney & observatory
    new THREE.Vector3(9.0, 3.0, -5.5),     // 11: Floating stepping stones
    new THREE.Vector3(11.5, 1.2, -4.5),    // 12: Cottage Outpost center
    new THREE.Vector3(11.5, 1.2, -4.5),    // 13: Cottage Outpost center
    new THREE.Vector3(11.5, 1.2, -4.5),    // 14: Cottage Outpost center
    new THREE.Vector3(0.0, 5.2, 0.0)       // 15: Spire center overview
  ];

  // 3. Dynamic Field of View Keyframes
  const fovKeyframes = [
    { p: 0.00, fov: 42 }, // Overview
    { p: 0.13, fov: 38 }, // Spire cauldron & study
    { p: 0.20, fov: 38 }, // Spire front
    { p: 0.27, fov: 38 }, // Spire pines
    { p: 0.33, fov: 39 }, // Rope bridge
    { p: 0.40, fov: 38 }, // Pumpkin Grove Front
    { p: 0.47, fov: 38 }, // Pumpkin Grove Flank
    { p: 0.53, fov: 38 }, // Pumpkin Grove Back
    { p: 0.67, fov: 40 }, // Spire rear chimney smoke
    { p: 0.80, fov: 38 }, // Cottage Outpost Back
    { p: 0.93, fov: 38 }, // Cottage Outpost Front
    { p: 1.00, fov: 42 }  // Return to Overview
  ];

  // Centripetal Catmull-Rom splines guarantee smooth C1 continuity without overshoot
  const camCurve = new THREE.CatmullRomCurve3(camPoints, false, 'centripetal', 0.5);
  const targetCurve = new THREE.CatmullRomCurve3(targetPoints, false, 'centripetal', 0.5);

  const _tempPos = new THREE.Vector3();
  const _tempTarget = new THREE.Vector3();

  function getFov(progress) {
    for (let i = 0; i < fovKeyframes.length - 1; i++) {
      const k1 = fovKeyframes[i];
      const k2 = fovKeyframes[i + 1];
      if (progress >= k1.p && progress <= k2.p) {
        const t = (progress - k1.p) / (k2.p - k1.p);
        const tSmooth = t * t * (3 - 2 * t);
        return THREE.MathUtils.lerp(k1.fov, k2.fov, tSmooth);
      }
    }
    return overviewFov;
  }

  function getSample(progress) {
    const p = Math.max(0, Math.min(1, progress));
    // Use getPoint(p) to ensure camCurve and targetCurve are 100% synchronized point-by-point!
    camCurve.getPoint(p, _tempPos);
    targetCurve.getPoint(p, _tempTarget);
    const fov = getFov(p);
    return { position: _tempPos, target: _tempTarget, fov };
  }

  const keyframes = [
    { progress: 0.00, label: 'Archipelago Overview' },
    { progress: 0.20, label: "The Astromancer's Spire & Cauldron" },
    { progress: 0.40, label: "The Alchemist's Pumpkin Grove" },
    { progress: 0.67, label: 'Whispering Mists & Chimney Smoke' },
    { progress: 0.93, label: "The Apprentice's Cottage Outpost" },
    { progress: 1.00, label: 'Archipelago Revealed' }
  ];

  return {
    overviewPos,
    overviewTarget,
    overviewFov,
    keyframes,
    getSample
  };
}
