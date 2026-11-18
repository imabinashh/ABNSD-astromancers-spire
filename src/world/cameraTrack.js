import * as THREE from 'three';

// Camera track with complete 360-degree helical orbit descent:
// 1. Overview: Whole tower & floating island visible through clouds
// 2. Ascent: Glides up towards the crooked wizard spire & observatory
// 3. Complete 360° Orbit Descent: Camera spirals 360° around the tower as it descends from top to bottom
// 4. Pullback: Moves away from the island back to the original overview position!

export function createCameraTrack() {
  // Initial overview values matching front-facing cinematic archipelago view
  const overviewPos = new THREE.Vector3(10.0, 10.8, 32.5);
  const overviewTarget = new THREE.Vector3(0.0, 5.2, 0.0);
  const overviewFov = 42;

  // Starting azimuth angle of the camera relative to tower center (0, 0)
  const angle0 = Math.atan2(overviewPos.x, overviewPos.z); // ≈ 0.6666 rad (~38.2°)
  const overviewRadius = Math.hypot(overviewPos.x, overviewPos.z); // ≈ 29.91

  // Top observatory close-up values
  const topRadius = 9.0;
  const topY = 15.0;
  const topTarget = new THREE.Vector3(-0.4, 12.5, 0.2);
  const topFov = 37;

  // Ground level close-up values
  const groundRadius = 9.0;
  const groundY = 2.4;
  const groundTarget = new THREE.Vector3(0.6, 1.4, 0.8);
  const groundFov = 40;

  // Reusable vectors for zero GC allocation in render loop
  const _tempPos = new THREE.Vector3();
  const _tempTarget = new THREE.Vector3();

  function smoothstep(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  }

  // Sample the camera track at normalized scroll progress [0..1]
  function getSample(progress) {
    const p = Math.max(0, Math.min(1, progress));

    if (p <= 0.25) {
      // -------------------------------------------------------------
      // Phase 1 (0.0 to 0.25): Gliding from Overview up to Spire Top
      // -------------------------------------------------------------
      const t = smoothstep(p / 0.25);

      // Interpolate radius and height toward top
      const r = THREE.MathUtils.lerp(overviewRadius, topRadius, t);
      const y = THREE.MathUtils.lerp(overviewPos.y, topY, t);

      _tempPos.set(
        Math.sin(angle0) * r,
        y,
        Math.cos(angle0) * r
      );
      _tempTarget.lerpVectors(overviewTarget, topTarget, t);
      const fov = THREE.MathUtils.lerp(overviewFov, topFov, t);

      return { position: _tempPos, target: _tempTarget, fov };
    } else if (p <= 0.80) {
      // -------------------------------------------------------------
      // Phase 2 (0.25 to 0.80): COMPLETE 360-DEGREE ORBIT DESCENT!
      // Camera completes a full 360° (2*PI) orbit around the tower
      // while smoothly descending from top observatory to ground level.
      // -------------------------------------------------------------
      const t = (p - 0.25) / (0.80 - 0.25);
      const tSmooth = smoothstep(t);

      // Complete 360-degree rotation (2*PI)
      const currentAngle = angle0 + tSmooth * Math.PI * 2;

      // Smooth descent from top to ground
      const currentY = THREE.MathUtils.lerp(topY, groundY, tSmooth);
      const currentRadius = THREE.MathUtils.lerp(topRadius, groundRadius, tSmooth);

      _tempPos.set(
        Math.sin(currentAngle) * currentRadius,
        currentY,
        Math.cos(currentAngle) * currentRadius
      );

      // Target tracks down from upper spire to ground portal
      _tempTarget.lerpVectors(topTarget, groundTarget, tSmooth);
      const fov = THREE.MathUtils.lerp(topFov, groundFov, tSmooth);

      return { position: _tempPos, target: _tempTarget, fov };
    } else {
      // -------------------------------------------------------------
      // Phase 3 (0.80 to 1.00): Pullback Reveal back to Original View
      // From ground level, camera pulls back & elevates into the clouds,
      // smoothly returning to the exact original overview position!
      // -------------------------------------------------------------
      const t = (p - 0.80) / (1.00 - 0.80);
      const tSmooth = smoothstep(t);

      // Angle remains aligned with angle0 (since angle0 + 2*PI == angle0)
      const r = THREE.MathUtils.lerp(groundRadius, overviewRadius, tSmooth);
      const y = THREE.MathUtils.lerp(groundY, overviewPos.y, tSmooth);

      _tempPos.set(
        Math.sin(angle0) * r,
        y,
        Math.cos(angle0) * r
      );
      _tempTarget.lerpVectors(groundTarget, overviewTarget, tSmooth);
      const fov = THREE.MathUtils.lerp(groundFov, overviewFov, tSmooth);

      return { position: _tempPos, target: _tempTarget, fov };
    }
  }

  const keyframes = [
    { progress: 0.0, label: 'The Floating Spire' },
    { progress: 0.25, label: 'The Wizard Observatory' },
    { progress: 0.52, label: '360° Orbital Descent' },
    { progress: 0.80, label: 'Sanctum Grounds' },
    { progress: 1.0, label: 'The Island Revealed' }
  ];

  return {
    keyframes,
    getSample
  };
}
