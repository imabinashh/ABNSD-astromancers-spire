import * as THREE from 'three';

// ============================================================================
// Multi-Island Archipelago Guided Flight Path (Continuous Catmull-Rom Spline):
// 1. Initial Overview -> Slow, smooth glide in to Main Spire
// 2. Lingers at full-tower front view (Screenshot 2 framing: bottom-to-top visible)
// 3. Slow, generous 360° Spire Orbit (never zooms in too close):
//    - Front Gate & bubbling cauldron
//    - Right flank with warm window
//    - Elevated Rear: crooked slate roof, stone chimney stack & smoke puffs in full view!
//    - Left flank: timber observatory & pine forest
//    - Return to Front Gate
// 4. Glide across arched rope bridge to Pumpkin Grove FRONT (slow plateau)
// 5. Pumpkin Grove flank orbit
// 6. Cross archipelago to Cottage Outpost
// 7. Cottage Outpost FRONT (slow plateau: belfry & stepping stones)
// 8. Grand Pullback reveal back to initial panoramic overview framed by the rainbow
// ============================================================================

export function createCameraTrack() {
  const overviewPos = new THREE.Vector3(10.0, 10.8, 32.5);
  const overviewTarget = new THREE.Vector3(0.0, 5.2, 0.0);
  const overviewFov = 42;

  // 1. Camera Flight Waypoints (22 synchronized control points)
  const camPoints = [
    new THREE.Vector3(10.0, 10.8, 32.5),   // 0 (p = 0.000): Panoramic Initial Overview
    new THREE.Vector3(7.8, 9.2, 26.5),     // 1 (p = 0.048): Gentle glide towards Spire
    new THREE.Vector3(5.5, 7.8, 20.8),     // 2 (p = 0.095): Arrival at Spire Front (Full tower bottom-to-top)
    new THREE.Vector3(5.5, 7.8, 20.8),     // 3 (p = 0.143): Lingering at Full Tower view (Reading plateau)
    new THREE.Vector3(4.8, 7.6, 20.5),     // 4 (p = 0.190): Starting gentle, slow orbit
    new THREE.Vector3(12.5, 7.8, 16.5),    // 5 (p = 0.238): Front-right arc
    new THREE.Vector3(19.5, 8.0, 6.0),     // 6 (p = 0.286): Right flank: timber observatory & masonry
    new THREE.Vector3(12.5, 9.5, -12.0),   // 7 (p = 0.333): Rear-right arc
    new THREE.Vector3(0.0, 11.2, -19.5),   // 8 (p = 0.381): Elevated Rear: chimney stack & smoke in full view!
    new THREE.Vector3(-12.5, 9.5, -12.0),  // 9 (p = 0.429): Rear-left arc
    new THREE.Vector3(-19.0, 8.0, 5.0),    // 10 (p = 0.476): Left flank: timber study & pine grove
    new THREE.Vector3(-8.5, 7.2, 17.5),    // 11 (p = 0.524): Left-front arc returning to gate
    new THREE.Vector3(3.0, 7.2, 20.5),     // 12 (p = 0.571): Front gate complete circle
    new THREE.Vector3(-6.0, 4.8, 15.5),    // 13 (p = 0.619): Gliding along arched wooden rope bridge
    new THREE.Vector3(-11.5, 3.8, 16.5),   // 14 (p = 0.667): Pumpkin Grove FRONT (Reading plateau)
    new THREE.Vector3(-18.5, 4.0, 5.0),    // 15 (p = 0.714): Pumpkin Grove outer flank orbit
    new THREE.Vector3(0.0, 8.5, 12.0),     // 16 (p = 0.762): Sweeping across archipelago toward Cottage
    new THREE.Vector3(11.5, 4.5, -15.5),   // 17 (p = 0.810): Cottage Outpost rear
    new THREE.Vector3(18.5, 4.2, -4.5),    // 18 (p = 0.857): Cottage Outpost flank
    new THREE.Vector3(11.5, 4.2, 7.5),     // 19 (p = 0.905): Cottage Outpost FRONT (Reading plateau)
    new THREE.Vector3(11.0, 8.0, 21.0),    // 20 (p = 0.952): Pullback departure towards sky
    new THREE.Vector3(10.0, 10.8, 32.5)    // 21 (p = 1.000): Grand Pullback to Panoramic Overview
  ];

  // 2. Synchronized Camera Look-At Target Waypoints (Matches camPoints 1-to-1)
  const targetPoints = [
    new THREE.Vector3(0.0, 5.2, 0.0),      // 0: Spire center overview
    new THREE.Vector3(0.0, 5.2, 0.0),      // 1: Spire center
    new THREE.Vector3(0.0, 5.4, 0.0),      // 2: Spire center full tower
    new THREE.Vector3(0.0, 5.4, 0.0),      // 3: Spire center full tower
    new THREE.Vector3(0.0, 5.4, 0.0),      // 4: Spire center
    new THREE.Vector3(0.0, 5.4, 0.0),      // 5: Spire center
    new THREE.Vector3(0.0, 5.5, 0.0),      // 6: Spire study & masonry
    new THREE.Vector3(0.0, 6.0, 0.0),      // 7: Spire upper rafters
    new THREE.Vector3(-0.8, 8.8, -0.6),    // 8: Spire roof, stone chimney stack & smoke!
    new THREE.Vector3(0.0, 6.0, 0.0),      // 9: Spire upper rafters
    new THREE.Vector3(0.0, 5.5, 0.0),      // 10: Spire timber study & pines
    new THREE.Vector3(0.0, 5.4, 0.0),      // 11: Spire center
    new THREE.Vector3(0.0, 5.2, 0.0),      // 12: Spire front gate
    new THREE.Vector3(-8.5, 2.2, 5.5),     // 13: Rope bridge mid-span
    new THREE.Vector3(-11.5, 0.8, 5.0),    // 14: Pumpkin Grove center
    new THREE.Vector3(-11.5, 0.8, 5.0),    // 15: Pumpkin Grove center
    new THREE.Vector3(5.5, 3.5, -1.0),     // 16: Central void
    new THREE.Vector3(11.5, 1.2, -4.5),    // 17: Cottage Outpost center
    new THREE.Vector3(11.5, 1.2, -4.5),    // 18: Cottage Outpost center
    new THREE.Vector3(11.5, 1.2, -4.5),    // 19: Cottage Outpost center
    new THREE.Vector3(4.5, 4.5, 0.0),      // 20: Central archipelago
    new THREE.Vector3(0.0, 5.2, 0.0)       // 21: Spire center overview
  ];

  // 3. Dynamic Field of View Keyframes
  const fovKeyframes = [
    { p: 0.00, fov: 42 }, // Overview
    { p: 0.10, fov: 40 }, // Spire front full tower
    { p: 0.20, fov: 40 }, // Spire front hold
    { p: 0.29, fov: 39 }, // Spire right flank
    { p: 0.38, fov: 41 }, // Spire rear chimney & smoke view
    { p: 0.48, fov: 39 }, // Spire left flank
    { p: 0.57, fov: 40 }, // Spire gate return
    { p: 0.62, fov: 39 }, // Rope bridge crossing
    { p: 0.67, fov: 38 }, // Pumpkin Grove Front
    { p: 0.72, fov: 38 }, // Pumpkin Grove Flank
    { p: 0.77, fov: 40 }, // Archipelago crossing
    { p: 0.82, fov: 38 }, // Cottage Outpost Back
    { p: 0.90, fov: 38 }, // Cottage Outpost Front
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
    { progress: 0.12, label: "The Astromancer's Spire" },
    { progress: 0.38, label: "The Wizard's Hearth & Chimney" },
    { progress: 0.57, label: 'The Timber Observatory' },
    { progress: 0.67, label: "The Alchemist's Pumpkin Grove" },
    { progress: 0.90, label: "The Apprentice's Cottage Outpost" },
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
