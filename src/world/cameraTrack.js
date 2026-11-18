import * as THREE from 'three';

// ============================================================================
// Multi-Island Archipelago Guided Flight Path (Continuous Catmull-Rom Spline):
// 1. Initial Overview -> Smooth glide in to Main Spire
// 2. Complete 360° Spire Orbit:
//    - Front Gate & bubbling cauldron
//    - Right flank with warm window
//    - Elevated Rear: crooked slate roof, stone chimney stack & smoke puffs in full view!
//    - Left flank: timber observatory & pine forest
//    - Return to Front Gate
// 3. Glide across arched rope bridge to Pumpkin Grove FRONT (lantern crane, pumpkin patch)
// 4. Orbit Pumpkin Grove flank
// 5. Cross archipelago to Cottage Outpost BACK
// 6. Orbit Cottage Outpost from BACK to FRONT (turquoise roof, belfry lantern, stepping stones)
// 7. Grand Pullback reveal back to initial panoramic overview framed by the rainbow
// ============================================================================

export function createCameraTrack() {
  const overviewPos = new THREE.Vector3(10.0, 10.8, 32.5);
  const overviewTarget = new THREE.Vector3(0.0, 5.2, 0.0);
  const overviewFov = 42;

  // 1. Camera Flight Waypoints (16 synchronized control points)
  const camPoints = [
    new THREE.Vector3(10.0, 10.8, 32.5),   // 0 (p = 0.000): Panoramic Initial Overview
    new THREE.Vector3(6.5, 7.8, 20.0),     // 1 (p = 0.067): Smooth glide in toward Sanctuary Spire
    new THREE.Vector3(2.5, 5.8, 14.2),     // 2 (p = 0.133): Spire Front Gate & Cauldron (Start of 360° Orbit)
    new THREE.Vector3(12.5, 6.8, 5.5),     // 3 (p = 0.200): Spire Right Flank: warm mullioned window
    new THREE.Vector3(0.0, 10.5, -16.0),   // 4 (p = 0.267): Spire REAR ELEVATED: stone chimney & smoke in full view!
    new THREE.Vector3(-12.5, 7.0, 3.5),    // 5 (p = 0.333): Spire Left Flank: timber observatory & pine grove
    new THREE.Vector3(-1.5, 5.6, 14.2),    // 6 (p = 0.400): Spire Return to Front Gate (Completing 360° Orbit)
    new THREE.Vector3(-6.5, 4.6, 14.8),    // 7 (p = 0.467): Departing Gate along wooden arched rope bridge
    new THREE.Vector3(-11.5, 3.8, 16.5),   // 8 (p = 0.533): Pumpkin Grove FRONT: lantern crane & pumpkins
    new THREE.Vector3(-18.5, 3.8, 5.0),    // 9 (p = 0.600): Pumpkin Grove Outer Flank Orbit
    new THREE.Vector3(0.0, 8.5, 12.0),     // 10 (p = 0.667): Sweeping across archipelago toward Cottage
    new THREE.Vector3(11.5, 4.5, -15.5),   // 11 (p = 0.733): Cottage Outpost BACK side
    new THREE.Vector3(18.5, 4.2, -4.5),    // 12 (p = 0.800): Cottage Outpost Outer Right Flank
    new THREE.Vector3(11.5, 4.2, 7.5),     // 13 (p = 0.867): Cottage Outpost FRONT: belfry & stepping stones
    new THREE.Vector3(11.0, 7.8, 20.5),    // 14 (p = 0.933): Pullback departure towards sky
    new THREE.Vector3(10.0, 10.8, 32.5)    // 15 (p = 1.000): Grand Pullback to Panoramic Overview
  ];

  // 2. Synchronized Camera Look-At Target Waypoints (Matches camPoints 1-to-1)
  const targetPoints = [
    new THREE.Vector3(0.0, 5.2, 0.0),      // 0: Spire center overview
    new THREE.Vector3(0.0, 5.2, 0.0),      // 1: Spire center
    new THREE.Vector3(0.5, 4.8, 0.5),      // 2: Spire front gate & cauldron
    new THREE.Vector3(0.0, 5.5, 0.0),      // 3: Spire study & masonry
    new THREE.Vector3(-0.8, 8.6, -0.6),    // 4: Spire roof & stone chimney stack!
    new THREE.Vector3(0.0, 5.5, 0.0),      // 5: Spire timber study & pines
    new THREE.Vector3(0.0, 4.8, 0.0),      // 6: Spire front gate & stone path
    new THREE.Vector3(-8.5, 2.2, 5.5),     // 7: Rope bridge mid-span
    new THREE.Vector3(-11.5, 0.8, 5.0),    // 8: Pumpkin Grove center
    new THREE.Vector3(-11.5, 0.8, 5.0),    // 9: Pumpkin Grove center
    new THREE.Vector3(5.5, 3.5, -1.0),     // 10: Stepping stones toward outpost
    new THREE.Vector3(11.5, 1.2, -4.5),    // 11: Cottage Outpost center
    new THREE.Vector3(11.5, 1.2, -4.5),    // 12: Cottage Outpost center
    new THREE.Vector3(11.5, 1.2, -4.5),    // 13: Cottage Outpost center
    new THREE.Vector3(4.5, 4.5, 0.0),      // 14: Central archipelago
    new THREE.Vector3(0.0, 5.2, 0.0)       // 15: Spire center overview
  ];

  // 3. Dynamic Field of View Keyframes
  const fovKeyframes = [
    { p: 0.00, fov: 42 }, // Overview
    { p: 0.13, fov: 38 }, // Spire front gate
    { p: 0.20, fov: 38 }, // Spire right flank
    { p: 0.27, fov: 40 }, // Spire rear chimney & smoke view
    { p: 0.33, fov: 38 }, // Spire timber study
    { p: 0.40, fov: 38 }, // Spire gate return
    { p: 0.47, fov: 39 }, // Rope bridge crossing
    { p: 0.53, fov: 38 }, // Pumpkin Grove Front
    { p: 0.60, fov: 38 }, // Pumpkin Grove Flank
    { p: 0.67, fov: 40 }, // Archipelago crossing
    { p: 0.73, fov: 38 }, // Cottage Outpost Back
    { p: 0.87, fov: 38 }, // Cottage Outpost Front
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
    camCurve.getPoint(p, _tempPos);
    targetCurve.getPoint(p, _tempTarget);
    const fov = getFov(p);
    return { position: _tempPos, target: _tempTarget, fov };
  }

  const keyframes = [
    { progress: 0.00, label: 'Archipelago Overview' },
    { progress: 0.13, label: "The Astromancer's Spire Gate" },
    { progress: 0.27, label: "The Wizard's Hearth & Chimney" },
    { progress: 0.40, label: 'The Timber Observatory' },
    { progress: 0.53, label: "The Alchemist's Pumpkin Grove" },
    { progress: 0.80, label: "The Apprentice's Cottage Outpost" },
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
