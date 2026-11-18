import * as THREE from 'three';

// ============================================================================
// Multi-Island Archipelago Camera Track:
// 1. Archipelago Overview: Panoramic view of all 3 islands & rainbow
// 2. Pumpkin Grove Swoop: Banks low over rope bridge, pumpkin patch & crane lantern
// 3. Spire Ascent & Spiral: Climbs from stone base past timber study to observatory
// 4. Cottage Outpost Flyby: Glides across stepping stones, circling turquoise belfry
// 5. Grand Pullback: Smoothly returns to full panoramic archipelago overview
// ============================================================================

export function createCameraTrack() {
  // 1. Main Overview Framing
  const overviewPos = new THREE.Vector3(10.0, 10.8, 32.5);
  const overviewTarget = new THREE.Vector3(0.0, 5.2, 0.0);
  const overviewFov = 42;

  // 2. Pumpkin Grove Waypoint
  const pumpkinCenter = new THREE.Vector3(-15.5, 4.0, 5.5);
  const pumpkinEntryPos = new THREE.Vector3(-9.5, 7.2, 17.5);
  const pumpkinFocusPos = new THREE.Vector3(-18.5, 6.2, 12.5);

  // 3. Spire Base & Top Observatory Waypoints
  const spireBaseTarget = new THREE.Vector3(0.0, 3.2, 0.0);
  const spireBasePos = new THREE.Vector3(6.5, 4.5, 9.5);
  const spireTopTarget = new THREE.Vector3(-0.4, 12.5, 0.2);
  const spireTopPos = new THREE.Vector3(0.0, 15.0, 9.8);

  // 4. Cottage Outpost Waypoints
  const cottageCenter = new THREE.Vector3(16.5, 4.8, -4.5);
  const cottageEntryPos = new THREE.Vector3(12.5, 7.8, 6.5);
  const cottageFocusPos = new THREE.Vector3(20.5, 7.0, 1.5);

  // Reusable vectors for zero GC allocation in render loop
  const _tempPos = new THREE.Vector3();
  const _tempTarget = new THREE.Vector3();

  function smoothstep(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  }

  // Sample camera choreography at normalized scroll progress [0..1]
  function getSample(progress) {
    const p = Math.max(0, Math.min(1, progress));

    if (p <= 0.16) {
      // -----------------------------------------------------------------
      // Phase 1 (0.00 to 0.16): Full Archipelago Overview
      // -----------------------------------------------------------------
      const t = smoothstep(p / 0.16);
      // Gentle subtle breathing drift
      _tempPos.copy(overviewPos);
      _tempPos.y += Math.sin(t * Math.PI) * 0.35;
      _tempTarget.copy(overviewTarget);
      return { position: _tempPos, target: _tempTarget, fov: overviewFov };
    } else if (p <= 0.42) {
      // -----------------------------------------------------------------
      // Phase 2 (0.16 to 0.42): The Alchemist's Pumpkin Grove Swoop
      // Glides from overview down along the rope bridge and sweeps around pumpkins
      // -----------------------------------------------------------------
      const t = (p - 0.16) / (0.42 - 0.16);
      const tSmooth = smoothstep(t);

      if (tSmooth < 0.5) {
        const subT = tSmooth / 0.5;
        _tempPos.lerpVectors(overviewPos, pumpkinEntryPos, subT);
        _tempTarget.lerpVectors(overviewTarget, pumpkinCenter, subT);
      } else {
        const subT = (tSmooth - 0.5) / 0.5;
        _tempPos.lerpVectors(pumpkinEntryPos, pumpkinFocusPos, subT);
        _tempTarget.copy(pumpkinCenter);
      }
      const fov = THREE.MathUtils.lerp(overviewFov, 38, tSmooth);
      return { position: _tempPos, target: _tempTarget, fov };
    } else if (p <= 0.72) {
      // -----------------------------------------------------------------
      // Phase 3 (0.42 to 0.72): Spire Sanctuary Ascent & Spiral
      // Crosses over to the main spire base and climbs spiraling to the observatory
      // -----------------------------------------------------------------
      const t = (p - 0.42) / (0.72 - 0.42);
      const tSmooth = smoothstep(t);

      if (tSmooth < 0.35) {
        // Transition from Pumpkin patch to Spire base
        const subT = tSmooth / 0.35;
        _tempPos.lerpVectors(pumpkinFocusPos, spireBasePos, subT);
        _tempTarget.lerpVectors(pumpkinCenter, spireBaseTarget, subT);
        const fov = THREE.MathUtils.lerp(38, 40, subT);
        return { position: _tempPos, target: _tempTarget, fov };
      } else {
        // Spiral ascent from spire base to timber study and observatory roof
        const subT = (tSmooth - 0.35) / 0.65;
        const currentAngle = 0.95 + subT * Math.PI * 1.75;
        const currentRadius = THREE.MathUtils.lerp(9.5, 9.0, subT);
        const currentY = THREE.MathUtils.lerp(spireBasePos.y, spireTopPos.y, subT);

        _tempPos.set(
          Math.sin(currentAngle) * currentRadius,
          currentY,
          Math.cos(currentAngle) * currentRadius
        );
        _tempTarget.lerpVectors(spireBaseTarget, spireTopTarget, subT);
        const fov = THREE.MathUtils.lerp(40, 37, subT);
        return { position: _tempPos, target: _tempTarget, fov };
      }
    } else if (p <= 0.90) {
      // -----------------------------------------------------------------
      // Phase 4 (0.72 to 0.90): Cottage Outpost & Belfry Flyby
      // Dives down across the levitating stones to inspect the cottage outpost
      // -----------------------------------------------------------------
      const t = (p - 0.72) / (0.90 - 0.72);
      const tSmooth = smoothstep(t);

      if (tSmooth < 0.5) {
        const subT = tSmooth / 0.5;
        _tempPos.lerpVectors(spireTopPos, cottageEntryPos, subT);
        _tempTarget.lerpVectors(spireTopTarget, cottageCenter, subT);
      } else {
        const subT = (tSmooth - 0.5) / 0.5;
        _tempPos.lerpVectors(cottageEntryPos, cottageFocusPos, subT);
        _tempTarget.copy(cottageCenter);
      }
      const fov = THREE.MathUtils.lerp(37, 38, tSmooth);
      return { position: _tempPos, target: _tempTarget, fov };
    } else {
      // -----------------------------------------------------------------
      // Phase 5 (0.90 to 1.00): Grand Pullback Reveal back to Overview
      // -----------------------------------------------------------------
      const t = (p - 0.90) / (1.00 - 0.90);
      const tSmooth = smoothstep(t);

      _tempPos.lerpVectors(cottageFocusPos, overviewPos, tSmooth);
      _tempTarget.lerpVectors(cottageCenter, overviewTarget, tSmooth);
      const fov = THREE.MathUtils.lerp(38, overviewFov, tSmooth);
      return { position: _tempPos, target: _tempTarget, fov };
    }
  }

  const keyframes = [
    { progress: 0.0, label: 'Archipelago Overview' },
    { progress: 0.28, label: "The Alchemist's Pumpkin Grove" },
    { progress: 0.58, label: "The Astromancer's Spire & Observatory" },
    { progress: 0.82, label: 'Cottage Outpost & Belfry' },
    { progress: 1.0, label: 'Archipelago Revealed' }
  ];

  return {
    overviewPos,
    overviewTarget,
    overviewFov,
    keyframes,
    getSample
  };
}
