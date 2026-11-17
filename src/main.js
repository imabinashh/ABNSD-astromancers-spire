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
import { createSatelliteIslands } from './world/satelliteIslands.js';

// DOM Elements
const canvas = document.getElementById('webgl');
const progressFill = document.getElementById('progress-fill');

// Navigation & Menu DOM
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const hamburgerIcon = menuToggleBtn ? menuToggleBtn.querySelector('.hamburger-icon') : null;
const closeIcon = menuToggleBtn ? menuToggleBtn.querySelector('.close-icon') : null;
const navMenuDrawer = document.getElementById('nav-menu-drawer');
const menuPillBtns = document.querySelectorAll('.menu-pill-btn');
const menuOrbitBtn = document.getElementById('menu-orbit-btn');

// Top-Right Controls DOM
const themeBtns = document.querySelectorAll('.theme-pill-btn');
const cameraOrbitBtn = document.getElementById('camera-orbit-btn');
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const soundIconOn = audioToggleBtn ? audioToggleBtn.querySelector('.sound-icon-on') : null;
const soundIconOff = audioToggleBtn ? audioToggleBtn.querySelector('.sound-icon-off') : null;

// Modal & Toast DOM
const aboutModal = document.getElementById('about-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const landmarkToast = document.getElementById('landmark-toast');

// Floating Camera HUD DOM
const cameraControlsHud = document.getElementById('camera-controls-hud');
const camResetBtn = document.getElementById('cam-reset-btn');
const camZoomInBtn = document.getElementById('cam-zoom-in-btn');
const camZoomOutBtn = document.getElementById('cam-zoom-out-btn');
const camRotateLeftBtn = document.getElementById('cam-rotate-left-btn');
const camRotateRightBtn = document.getElementById('cam-rotate-right-btn');

// 1. Initialize 3D World Core
const { scene, camera, renderer, controls, update: updateScene } = createScene(canvas);
const lighting = createLighting(scene);
const tower = createTowerModel();
scene.add(tower.group);

const particles = createParticles(scene, tower.chimneyOrigin, tower.cauldronOrigin);
const clouds = createClouds(scene);
const celestial = createCelestial(scene);
const satelliteIslands = createSatelliteIslands(scene);
const cameraTrack = createCameraTrack();
const audio = createSynthAudio();

// Initialize lighting, celestial & archipelago to default Sunset atmosphere
lighting.applyPreset('sunset');
celestial.setTheme('sunset');
satelliteIslands.setTheme('sunset');

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

// Landmark Waypoint Camera State
let waypointMode = false;
const waypointCamPos = new THREE.Vector3();
const waypointTarget = new THREE.Vector3();
let waypointFov = 42;
let toastTimeout = null;

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

// Toast Helper
function showToast(text) {
  if (!landmarkToast) return;
  landmarkToast.textContent = text;
  landmarkToast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    landmarkToast.classList.add('hidden');
  }, 3200);
}

// Fly smoothly to landmark
function flyToWaypoint(camPos, targetPos, fov, toastText) {
  if (controls.enabled) {
    disableFreeOrbit();
  }
  waypointMode = true;
  waypointCamPos.copy(camPos);
  waypointTarget.copy(targetPos);
  waypointFov = fov;
  conductor.resetIdle();
  showToast(toastText);
}

// 2. Initialize Scroll Conductor
const conductor = createScrollConductor({
  damping: 5.0,
  onUpdate: ({ smooth, exact, isIdle }) => {
    // Update bottom progress bar
    if (progressFill) {
      progressFill.style.width = `${(smooth * 100).toFixed(1)}%`;
    }

    // When viewing a landmark waypoint, do not let scroll track override camera
    if (waypointMode) {
      return;
    }

    // Sample camera choreography track
    const sample = cameraTrack.getSample(smooth);

    if (!controls.enabled) {
      // Smoothly interpolate current camera position and target
      currentCamPos.lerp(sample.position, 0.12);
      currentCamTarget.lerp(sample.target, 0.12);

      // Check if user is idle for cinematic auto-orbit
      const targetIdleWeight = isIdle ? 1.0 : 0.0;
      idleWeight += (targetIdleWeight - idleWeight) * 0.04;

      if (idleWeight > 0.01) {
        // Orbit around tower center smoothly
        idleAngle += 0.0035;
        const currentDist = Math.hypot(currentCamPos.x, currentCamPos.z);
        const orbitRadius = Math.max(16.0, Math.min(30.0, currentDist));
        const orbitHeight = Math.max(8.0, currentCamPos.y);

        tempIdlePos.set(
          Math.sin(idleAngle) * orbitRadius,
          orbitHeight,
          Math.cos(idleAngle) * orbitRadius
        );
      }

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
    audio.playChime();
  }
});

conductor.start();

// Exit landmark waypoint view when viewer physically scrolls or swipes
window.addEventListener('wheel', (e) => {
  if (waypointMode && Math.abs(e.deltaY) > 8) {
    waypointMode = false;
    showToast('🔭 Guided Scroll Resumed');
  }
}, { passive: true });

window.addEventListener('touchmove', () => {
  if (waypointMode) {
    waypointMode = false;
    showToast('🔭 Guided Scroll Resumed');
  }
}, { passive: true });

// 3. Free Orbit Mode Toggle
function enableFreeOrbit() {
  controls.enabled = true;
  conductor.setManualOverride(true);
  controls.target.copy(currentCamTarget);
  document.body.classList.add('mode-free-orbit');
  if (cameraControlsHud) {
    cameraControlsHud.classList.remove('hidden');
  }
  if (cameraOrbitBtn) {
    cameraOrbitBtn.classList.add('active');
    const textEl = cameraOrbitBtn.querySelector('.camera-btn-text');
    if (textEl) textEl.textContent = 'Guided Scroll';
  }
  if (menuOrbitBtn) {
    menuOrbitBtn.textContent = 'Guided Scroll';
    menuOrbitBtn.classList.add('active');
  }
}

function disableFreeOrbit() {
  controls.enabled = false;
  conductor.setManualOverride(false);
  document.body.classList.remove('mode-free-orbit');
  if (cameraControlsHud) {
    cameraControlsHud.classList.add('hidden');
  }
  if (cameraOrbitBtn) {
    cameraOrbitBtn.classList.remove('active');
    const textEl = cameraOrbitBtn.querySelector('.camera-btn-text');
    if (textEl) textEl.textContent = 'Free Orbit';
  }
  if (menuOrbitBtn) {
    menuOrbitBtn.textContent = 'Free Orbit';
    menuOrbitBtn.classList.remove('active');
  }
}

if (cameraOrbitBtn) {
  cameraOrbitBtn.addEventListener('click', () => {
    toggleFreeOrbit();
  });
}

function toggleFreeOrbit() {
  if (controls.enabled) {
    disableFreeOrbit();
    showToast('🔭 Guided Scroll Active');
  } else {
    enableFreeOrbit();
    showToast('🌐 Free Orbit Active • Drag to inspect in 360°');
  }
}

// Camera HUD Controls
function zoomCamera(factor) {
  if (!controls.enabled) enableFreeOrbit();
  conductor.resetIdle();
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  offset.multiplyScalar(factor);
  const dist = offset.length();
  if (dist >= controls.minDistance && dist <= controls.maxDistance) {
    camera.position.addVectors(controls.target, offset);
    controls.update();
  }
}

function rotateCamera(angle) {
  if (!controls.enabled) enableFreeOrbit();
  conductor.resetIdle();
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  camera.position.addVectors(controls.target, offset);
  controls.update();
}

function resetCameraView() {
  if (!controls.enabled) enableFreeOrbit();
  conductor.resetIdle();
  controls.target.set(0, 5.8, 0);
  camera.position.set(18.5, 14.8, 23.5);
  camera.fov = 42;
  camera.updateProjectionMatrix();
  controls.update();
  showToast('⟲ Camera View Reset');
}

if (camResetBtn) camResetBtn.addEventListener('click', resetCameraView);
if (camZoomInBtn) camZoomInBtn.addEventListener('click', () => zoomCamera(0.82));
if (camZoomOutBtn) camZoomOutBtn.addEventListener('click', () => zoomCamera(1.22));
if (camRotateLeftBtn) camRotateLeftBtn.addEventListener('click', () => rotateCamera(Math.PI / 10));
if (camRotateRightBtn) camRotateRightBtn.addEventListener('click', () => rotateCamera(-Math.PI / 10));

// 4. Dropdown Menu Trigger & Drawer Controls
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  navMenuDrawer.classList.remove('hidden');
  menuToggleBtn.classList.add('open');
  menuToggleBtn.setAttribute('aria-expanded', 'true');
  if (hamburgerIcon) hamburgerIcon.classList.add('hidden');
  if (closeIcon) closeIcon.classList.remove('hidden');
}

function closeMenu() {
  menuOpen = false;
  navMenuDrawer.classList.add('hidden');
  menuToggleBtn.classList.remove('open');
  menuToggleBtn.setAttribute('aria-expanded', 'false');
  if (hamburgerIcon) hamburgerIcon.classList.remove('hidden');
  if (closeIcon) closeIcon.classList.add('hidden');
}

if (menuToggleBtn) {
  menuToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (menuOpen && !e.target.closest('.nav-menu-wrapper')) {
    closeMenu();
  }
});

// Menu Pill Item Actions
menuPillBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    menuPillBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    closeMenu();

    if (target === 'sanctuary') {
      flyToWaypoint(
        new THREE.Vector3(18.5, 14.8, 23.5),
        new THREE.Vector3(0, 5.8, 0),
        42,
        '✦ The Sanctuary • Full Archipelago View'
      );
      conductor.setProgress(0.0, false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      audio.playChime();
    } else if (target === 'pumpkin') {
      flyToWaypoint(
        new THREE.Vector3(-6.2, 3.8, 14.2),
        new THREE.Vector3(-11.5, 0.8, 5.0),
        40,
        '🎃 Pumpkin Grove • The Alchemist\'s Garden'
      );
      audio.playBubble();
    } else if (target === 'cottage') {
      flyToWaypoint(
        new THREE.Vector3(17.8, 4.2, 5.2),
        new THREE.Vector3(11.5, 1.4, -4.5),
        38,
        '🌙 Cottage Outpost • The Apprentice\'s Watch'
      );
      audio.playChime();
    } else if (target === 'orbit') {
      toggleFreeOrbit();
    } else if (target === 'about') {
      if (aboutModal) {
        aboutModal.classList.remove('hidden');
      }
    }
  });
});

// About Modal Event Listeners
if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
  });
}

if (aboutModal) {
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
      aboutModal.classList.add('hidden');
    }
  });
}

// 5. Time of Day / Atmosphere Switcher (Top-Right Dock)
themeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme');
    themeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update body class for CSS gradient backdrop
    document.body.classList.remove('theme-sunset', 'theme-night', 'theme-day');
    document.body.classList.add(`theme-${theme}`);

    // Update 3D Lighting & Celestial presets
    lighting.applyPreset(theme);
    celestial.setTheme(theme);
    satelliteIslands.setTheme(theme);

    // Update cloud materials based on atmosphere
    if (theme === 'night') {
      clouds.cloudMaterial.color.setHex(0x28324a);
      clouds.cloudMatWarm.color.setHex(0x354060);
      showToast('🌙 Midnight Leylines Activated');
    } else if (theme === 'sunset') {
      clouds.cloudMaterial.color.setHex(0xfbf8f4);
      clouds.cloudMatWarm.color.setHex(0xffe8d6);
      showToast('🌅 Golden Sunset Hour');
    } else {
      clouds.cloudMaterial.color.setHex(0xffffff);
      clouds.cloudMatWarm.color.setHex(0xf2f7ff);
      showToast('☀️ Radiant High Daylight');
    }

    audio.playChime();
  });
});

// 6. Audio Toggle
if (audioToggleBtn) {
  audioToggleBtn.addEventListener('click', () => {
    const isPlaying = audio.toggle();
    if (soundIconOn && soundIconOff) {
      if (isPlaying) {
        soundIconOn.classList.remove('hidden');
        soundIconOff.classList.add('hidden');
        audioToggleBtn.classList.add('active');
        showToast('🔊 Ambient Soundscape On');
      } else {
        soundIconOn.classList.add('hidden');
        soundIconOff.classList.remove('hidden');
        audioToggleBtn.classList.remove('active');
        showToast('🔇 Ambient Soundscape Muted');
      }
    }
  });
}

// 7. Raycasting & Interactive Hotspots on Click/Tap
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
  // Ignore clicks on UI elements
  if (
    event.target.closest('.nav-menu-wrapper') ||
    event.target.closest('.controls-dock') ||
    event.target.closest('.camera-controls-hud') ||
    event.target.closest('.modal-card')
  ) {
    return;
  }
  conductor.resetIdle();

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(tower.group.children, true);

  if (intersects.length > 0) {
    let hit = intersects[0].object;
    let namedParent = hit;
    while (namedParent && !namedParent.name && namedParent !== tower.group) {
      namedParent = namedParent.parent;
    }

    const name = namedParent ? namedParent.name : '';

    if (name === 'cauldron' || hit.material === tower.materials.potionGlow) {
      particles.triggerCauldronBurst();
      audio.playBubble();
      showToast('✨ Cauldron Elixir Bubbles!');
    } else if (name === 'telescope' || name === 'wizardRoof' || name === 'chimney') {
      audio.playChime();
    }
  }
});

// 8. Master Animation & Render Loop
let lastTime = performance.now();

function animate(currentTime) {
  requestAnimationFrame(animate);

  const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
  const time = currentTime * 0.001;
  lastTime = currentTime;

  // Update OrbitControls if active
  if (controls.enabled) {
    controls.update();
  } else if (waypointMode) {
    // Smooth camera flight toward landmark waypoint
    currentCamPos.lerp(waypointCamPos, 0.07);
    currentCamTarget.lerp(waypointTarget, 0.07);

    // Subtle organic parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    camera.position.copy(currentCamPos);
    camera.position.x += mouse.x * 0.22;
    camera.position.y += -mouse.y * 0.16;

    camera.lookAt(currentCamTarget);

    targetFov = getAdaptiveFOV(waypointFov, camera.aspect);
    camera.fov += (targetFov - camera.fov) * 0.07;
    camera.updateProjectionMatrix();

    // Keep OrbitControls pivot aligned with landmark
    controls.target.copy(currentCamTarget);
  }

  // Update floating island breathing bob
  tower.update(time, dt);
  satelliteIslands.update(time, dt);

  // Update chimney puffs, cauldron bubbles, sky motes
  particles.update(dt, time);

  // Update island and camera foreground clouds
  clouds.update(dt, time);

  // Update Sun, Moon, rich starfield, and shooting stars
  celestial.update(dt, time);

  // Update background clouds & twinkling stars
  updateScene(dt, time);

  // Update lighting flickers
  lighting.update(time);

  // Render
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
