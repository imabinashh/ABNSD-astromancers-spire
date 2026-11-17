import * as THREE from 'three';
import { createScene } from './world/scene.js';
import { createLighting } from './world/lighting.js';
import { createTowerModel } from './world/towerModel.js';
import { createParticles } from './world/particles.js';
import { createCameraTrack } from './world/cameraTrack.js';
import { createScrollConductor } from './conductor/scrollConductor.js';
import { createSynthAudio } from './audio/synthAudio.js';
import { createClouds } from './world/clouds.js';
import { createCelestial } from './world/celestial.js';

// DOM Elements
const canvas = document.getElementById('webgl');
const hudChapterNum = document.getElementById('hud-chapter-num');
const hudPhase = document.getElementById('hud-phase');
const hudTitle = document.getElementById('hud-title');
const hudBody = document.getElementById('hud-body');
const tagFocus = document.getElementById('tag-focus');
const tagAltitude = document.getElementById('tag-altitude');
const progressFill = document.getElementById('progress-fill');
const toggleOrbitBtn = document.getElementById('toggle-orbit-btn');
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const exploreFreelyBtn = document.getElementById('explore-freely-btn');

// 1. Initialize 3D World Core
const { scene, camera, renderer, controls, update: updateScene } = createScene(canvas);
const lighting = createLighting(scene);
const tower = createTowerModel();
scene.add(tower.group);

const particles = createParticles(scene, tower.chimneyOrigin, tower.cauldronOrigin);
const clouds = createClouds(scene);
const celestial = createCelestial(scene);
const cameraTrack = createCameraTrack();
const audio = createSynthAudio();

// Initialize lighting & celestial to default Sunset atmosphere
lighting.applyPreset('sunset');
celestial.setTheme('sunset');

// Current camera interpolation states
const currentCamPos = new THREE.Vector3().copy(camera.position);
const currentCamTarget = new THREE.Vector3(0, 5.8, 0);
let targetFov = 42;

// Cinematic Idle Auto-Orbit State
let idleWeight = 0;
let idleAngle = 0.9;
const towerCenterTarget = new THREE.Vector3(0, 5.8, 0);
const tempIdlePos = new THREE.Vector3();
const blendedCamPos = new THREE.Vector3();
const blendedCamTarget = new THREE.Vector3();

// Adaptive FOV for mobile portrait screens (prevents horizontal cropping)
function getAdaptiveFOV(baseFov, aspect) {
  if (aspect >= 1.0) return baseFov;
  const targetHFOV = 64 * (Math.PI / 180);
  const vFovRad = 2 * Math.atan(Math.tan(targetHFOV / 2) / aspect);
  const vFovDeg = vFovRad * (180 / Math.PI);
  return Math.min(64, Math.max(baseFov, vFovDeg * 0.78));
}

// Mouse parallax tracking (only for pointer devices)
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
if (window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
}

// Chapters Metadata corresponding to the 7 keyframe sections
const chapterMetadata = [
  {
    num: 'CHAPTER 01',
    phase: 'THE SANCTUARY',
    title: 'The Floating Spire',
    body: 'Suspended in twilight, the ancient low-poly sanctuary hovers peacefully. The entire tower, grassy plateau, and rocky crags are visible in full panoramic perspective.',
    focus: '🔭 Full View',
    altitude: '4,200m'
  },
  {
    num: 'CHAPTER 02',
    phase: 'ASCENDING',
    title: 'Ascending to the Spire',
    body: 'Moving upwards toward the sky, soaring past the stone walls and timber frames toward the celestial dome above.',
    focus: '☁️ Ascent',
    altitude: '4,450m'
  },
  {
    num: 'CHAPTER 03',
    phase: 'THE OBSERVATORY',
    title: 'The Crooked Wizard Spire',
    body: 'At the summit: the signature bent wizard-hat roof, the stone chimney releasing puffs of warm smoke, the gabled dormer, and a brass telescope pointed toward uncharted stars.',
    focus: '✨ Spire & Stargazer',
    altitude: '4,700m'
  },
  {
    num: 'CHAPTER 04',
    phase: 'DESCENT • TIMBER',
    title: 'Tudor Timber Chamber',
    body: 'Descending downward: the half-timber upper study framed with dark oak cross-beams. Cozy yellow light radiates from the mullioned glass panes into the cool mountain air.',
    focus: '🕯️ Timber Study',
    altitude: '4,400m'
  },
  {
    num: 'CHAPTER 05',
    phase: 'DESCENT • STONE',
    title: 'Ancient Stone Masonry',
    body: 'Gliding further down the tower body: weathered ashlar stone cylinders accented with individual protruding masonry blocks and an illuminated arched casement.',
    focus: '🧱 Masonry Body',
    altitude: '4,150m'
  },
  {
    num: 'CHAPTER 06',
    phase: 'DESCENT • GROUNDS',
    title: 'Sanctum Grounds & Cauldron',
    body: 'Reaching the island surface: the heavy arched stone doorway with iron ring, cobblestone walkway, wild red toadstools, and an alchemist cauldron boiling with glowing green elixir.',
    focus: '🧪 Glowing Cauldron',
    altitude: '3,900m'
  },
  {
    num: 'CHAPTER 07',
    phase: 'DESCENT • CRAG',
    title: 'The Underworld Crag',
    body: 'Sweeping beneath the grassy rim: the jagged, faceted rocky cone anchoring the sanctuary in the endless skies, with crystalline motes swirling below.',
    focus: '🪨 Floating Roots',
    altitude: '3,700m'
  }
];

// 2. Initialize Scroll Conductor
const conductor = createScrollConductor({
  damping: 4.8,
  chapters: cameraTrack.keyframes.map((k, i) => ({
    id: `chapter-${i}`,
    name: k.label,
    progress: k.progress
  })),
  onUpdate({ smooth, exact, chapterIndex, isIdle, dt }) {
    // Update progress bar
    if (progressFill) {
      progressFill.style.width = `${smooth * 100}%`;
    }

    // If Free Orbit mode is NOT enabled, drive camera via conductor or idle orbit
    if (!controls.enabled) {
      const sample = cameraTrack.getSample(smooth);

      // Smooth lerp conductor camera position and target
      currentCamPos.lerp(sample.position, 0.08);
      currentCamTarget.lerp(sample.target, 0.08);

      // If idle, ramp up idleWeight; if active, ramp down quickly
      const step = dt || 0.016;
      if (isIdle) {
        idleWeight = Math.min(1.0, idleWeight + step * 0.75);
        idleAngle += step * 0.16; // gentle cinematic orbit rotation
      } else {
        idleWeight = Math.max(0.0, idleWeight - step * 2.5);
        idleAngle = Math.atan2(currentCamPos.x, currentCamPos.z);
      }

      // Calculate 360-degree cinematic orbit position around tower
      const orbitRadius = 28.5;
      const idleY = 14.8 + Math.sin(idleAngle * 0.5) * 1.8;
      tempIdlePos.set(
        Math.sin(idleAngle) * orbitRadius,
        idleY,
        Math.cos(idleAngle) * orbitRadius
      );

      // Blend between conductor path and cinematic idle orbit
      blendedCamPos.lerpVectors(currentCamPos, tempIdlePos, idleWeight);
      blendedCamTarget.lerpVectors(currentCamTarget, towerCenterTarget, idleWeight);

      // Add subtle organic mouse parallax (only when active)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.copy(blendedCamPos);
      if (idleWeight < 0.95) {
        const pFactor = 1 - idleWeight;
        camera.position.x += mouse.x * 0.35 * pFactor;
        camera.position.y += -mouse.y * 0.25 * pFactor;
      }

      camera.lookAt(blendedCamTarget);

      // Camera FOV lerp with mobile portrait auto-adaptation
      targetFov = getAdaptiveFOV(sample.fov, camera.aspect);
      camera.fov += (targetFov - camera.fov) * 0.08;
      camera.updateProjectionMatrix();
    }
  },
  onChapterChange(index) {
    // Play subtle audio chime on chapter transition
    audio.playChime();
  }
});

conductor.start();

// 3. Free Orbit Mode Toggle
function enableFreeOrbit() {
  controls.enabled = true;
  conductor.setManualOverride(true);
  controls.target.copy(currentCamTarget);
  document.body.classList.add('mode-free-orbit');
  toggleOrbitBtn.classList.add('active');
  toggleOrbitBtn.querySelector('.btn-text').textContent = 'Guided Scroll';
}

function disableFreeOrbit() {
  controls.enabled = false;
  conductor.setManualOverride(false);
  document.body.classList.remove('mode-free-orbit');
  toggleOrbitBtn.classList.remove('active');
  toggleOrbitBtn.querySelector('.btn-text').textContent = 'Free Orbit';
}

toggleOrbitBtn.addEventListener('click', () => {
  if (controls.enabled) {
    disableFreeOrbit();
  } else {
    enableFreeOrbit();
  }
});

if (exploreFreelyBtn) {
  exploreFreelyBtn.addEventListener('click', () => {
    enableFreeOrbit();
  });
}

// 4. Time of Day / Atmosphere Switcher
const themeBtns = document.querySelectorAll('.theme-btn');
themeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme');
    themeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update body class for CSS gradient backdrop
    document.body.classList.remove('theme-sunset', 'theme-night', 'theme-day');
    document.body.classList.add(`theme-${theme}`);

    // Update 3D Lighting preset
    lighting.applyPreset(theme);
    celestial.setTheme(theme);

    // Update cloud materials based on atmosphere
    if (theme === 'night') {
      clouds.cloudMaterial.color.setHex(0x28324a);
      clouds.cloudMatWarm.color.setHex(0x354060);
    } else if (theme === 'sunset') {
      clouds.cloudMaterial.color.setHex(0xfbf8f4);
      clouds.cloudMatWarm.color.setHex(0xffe8d6);
    } else {
      clouds.cloudMaterial.color.setHex(0xffffff);
      clouds.cloudMatWarm.color.setHex(0xf2f7ff);
    }

    audio.playChime();
  });
});

// 5. Audio Toggle
audioToggleBtn.addEventListener('click', () => {
  const isPlaying = audio.toggle();
  audioToggleBtn.querySelector('.audio-icon').textContent = isPlaying ? '🔊' : '🔇';
  audioToggleBtn.classList.toggle('active', isPlaying);
});

// 6. Raycasting & Interactive Hotspots
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Click / Tap interaction on 3D elements (pure visual/audio feedback, zero popups)
window.addEventListener('click', (event) => {
  if (event.target.closest('.site-header')) return;
  conductor.resetIdle();

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(tower.group.children, true);

  if (intersects.length > 0) {
    let hit = intersects[0].object;
    // Find named parent
    let namedParent = hit;
    while (namedParent && !namedParent.name && namedParent !== tower.group) {
      namedParent = namedParent.parent;
    }

    const name = namedParent ? namedParent.name : '';

    if (name === 'cauldron' || hit.material === tower.materials.potionGlow) {
      // Cauldron burst on click!
      particles.triggerCauldronBurst();
      audio.playBubble();
    } else if (name === 'telescope' || name === 'wizardRoof' || name === 'chimney') {
      audio.playChime();
    }
  }
});

// 7. Master Animation & Render Loop
let lastTime = performance.now();

function animate(currentTime) {
  requestAnimationFrame(animate);

  const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
  const time = currentTime * 0.001;
  lastTime = currentTime;

  // Update OrbitControls if active
  if (controls.enabled) {
    controls.update();
  }

  // Update floating island breathing bob
  tower.update(time, dt);

  // Update chimney puffs, cauldron bubbles, sky motes
  particles.update(dt, time);

  // Update island and camera foreground clouds
  clouds.update(dt, time);

  // Update Moon, rich starfield, and shooting stars
  celestial.update(dt, time);

  // Update background clouds & twinkling stars
  updateScene(dt, time);

  // Update lighting flickers
  lighting.update(time);

  // Render
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
