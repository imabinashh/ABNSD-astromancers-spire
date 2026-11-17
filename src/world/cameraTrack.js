import * as THREE from 'three';

// Camera track with keyframes fulfilling:
// 1. Whole tower visible (Overview)
// 2. Move towards tower top (Spire & Observatory)
// 3. View tower from top to bottom (Vertical descent through timber, stone, to ground level)
// 4. Move away from island again, revealing the entire floating island in all its glory!

export function createCameraTrack() {
  const keyframes = [
    {
      progress: 0.0,
      // Phase 1: Whole tower & floating island visible with plenty of headroom
      pos: new THREE.Vector3(18.5, 14.8, 23.5),
      target: new THREE.Vector3(0.0, 5.8, 0.0),
      fov: 42,
      label: 'The Floating Spire',
      subtitle: 'An ancient sanctuary suspended in the heavens'
    },
    {
      progress: 0.16,
      // Transitioning upward towards the top
      pos: new THREE.Vector3(9.5, 14.5, 13.0),
      target: new THREE.Vector3(-0.4, 9.5, 0.2),
      fov: 40,
      label: 'Ascending to the Spire',
      subtitle: 'Rising above the clouds toward the starry dome'
    },
    {
      progress: 0.35,
      // Phase 2: At the top - crooked wizard hat, chimney, telescope & dormer
      pos: new THREE.Vector3(2.8, 14.8, 6.5),
      target: new THREE.Vector3(-0.8, 12.8, 0.4),
      fov: 37,
      label: 'The Wizard Observatory',
      subtitle: 'Crooked hat roof, stargazing brass refractor & drifting chimney smoke'
    },
    {
      progress: 0.50,
      // Phase 3 (Descent Step A): Upper Tudor Timber Chamber
      pos: new THREE.Vector3(4.8, 8.5, 6.8),
      target: new THREE.Vector3(0.0, 6.8, 0.0),
      fov: 38,
      label: 'Timber-Framed Study',
      subtitle: 'Half-timber oak beams with cozy warm lantern light'
    },
    {
      progress: 0.65,
      // Phase 3 (Descent Step B): Stone Masonry & Mid Window
      pos: new THREE.Vector3(5.2, 4.4, 5.4),
      target: new THREE.Vector3(0.8, 3.4, 1.0),
      fov: 39,
      label: 'Ancient Stone Masonry',
      subtitle: 'Faceted ashlar blocks and an illuminated arched casement'
    },
    {
      progress: 0.78,
      // Phase 3 (Descent Step C): Ground Level Sanctum (close up to door, cauldron, mushrooms)
      pos: new THREE.Vector3(4.2, 2.0, 5.8),
      target: new THREE.Vector3(1.2, 1.1, 1.6),
      fov: 40,
      label: 'Sanctum Grounds & Cauldron',
      subtitle: 'Bubbling emerald potion, red toadstools & the arched threshold'
    },
    {
      progress: 0.89,
      // Phase 4 (Pullback): Camera begins moving away from the island, expanding view
      pos: new THREE.Vector3(11.2, 7.8, 14.5),
      target: new THREE.Vector3(0.4, 3.6, 0.8),
      fov: 41,
      label: 'Departing the Sanctum',
      subtitle: 'Pulling back through the sky as the island opens into view'
    },
    {
      progress: 1.0,
      // Phase 4 (Full Reveal): Fully pulled back, revealing the whole floating island again
      pos: new THREE.Vector3(18.5, 14.8, 23.5),
      target: new THREE.Vector3(0.0, 5.8, 0.0),
      fov: 42,
      label: 'The Island Revealed',
      subtitle: 'The complete sanctuary resting peacefully in the sky'
    }
  ];

  // Helper vectors to avoid GC allocation in render loop
  const _tempPos = new THREE.Vector3();
  const _tempTarget = new THREE.Vector3();

  // Smooth hermite / smoothstep interpolation
  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function getSample(progress) {
    const p = Math.max(0, Math.min(1, progress));

    // Find bounding keyframes
    let k0 = keyframes[0];
    let k1 = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (p >= keyframes[i].progress && p <= keyframes[i + 1].progress) {
        k0 = keyframes[i];
        k1 = keyframes[i + 1];
        break;
      }
    }

    const span = k1.progress - k0.progress;
    const localT = span > 0 ? smoothstep((p - k0.progress) / span) : 0;

    _tempPos.lerpVectors(k0.pos, k1.pos, localT);
    _tempTarget.lerpVectors(k0.target, k1.target, localT);
    const fov = THREE.MathUtils.lerp(k0.fov, k1.fov, localT);

    return {
      position: _tempPos,
      target: _tempTarget,
      fov,
      activeKeyframe: localT > 0.5 ? k1 : k0
    };
  }

  return {
    keyframes,
    getSample
  };
}
