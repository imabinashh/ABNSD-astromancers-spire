import * as THREE from 'three';
import gsap from 'gsap';
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
const { scene, camera, renderer, controls, cloudMat: bgCloudMat, update: updateScene } = createScene(canvas);
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
lighting.applyPreset('sunset', 0);
celestial.setTheme('sunset');
satelliteIslands.setTheme('sunset');
clouds.setTheme('sunset', 0);

// Current camera interpolation states
const currentCamPos = new THREE.Vector3().copy(camera.position);
const currentCamTarget = new THREE.Vector3(0, 5.8, 0);
let targetFov = 42;

// Cinematic Idle Auto-Orbit State
let idleWeight = 0;
let sanctuaryOrbitAngle = 0.9;
let islandOrbitAngle = 0;
const towerCenterTarget = new THREE.Vector3(0, 5.8, 0);
const tempIdlePos = new THREE.Vector3();
const blendedCamPos = new THREE.Vector3();
const blendedCamTarget = new THREE.Vector3();
const waypointOrbitPos = new THREE.Vector3();
const sanctuaryOrbitPos = new THREE.Vector3();

// Global User Activity & Idle Tracking
let userIdleTime = 0;
const IDLE_TRIGGER = 2.4; // 2.4 seconds of inactivity

function resetUserIdle() {
  userIdleTime = 0;
}

window.addEventListener('mousemove', resetUserIdle, { passive: true });
window.addEventListener('mousedown', resetUserIdle, { passive: true });
window.addEventListener('touchstart', resetUserIdle, { passive: true });
window.addEventListener('touchmove', resetUserIdle, { passive: true });
window.addEventListener('wheel', resetUserIdle, { passive: true });
window.addEventListener('scroll', resetUserIdle, { passive: true });
window.addEventListener('keydown', resetUserIdle, { passive: true });

// Landmark Waypoint Camera State
let waypointMode = false;
let activeWaypointId = 'sanctuary';
const waypointCamPos = new THREE.Vector3();
const waypointTarget = new THREE.Vector3();
let waypointFov = 42;
let toastTimeout = null;
const _camOffset = new THREE.Vector3();

// Adaptive FOV for mobile portrait screens (prevents horizontal cropping)
function getAdaptiveFOV(baseFov, aspect) {
  if (aspect >= 1.0) return baseFov;
  const t = Math.max(0, Math.min(1, (1.0 - aspect) / 0.6));
  return baseFov + t * 16;
}

// Mouse parallax tracking (only for pointer devices)
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
if (window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
}

// GSAP Flight Tween Handles
let camPosTween = null;
let camTargetTween = null;
let fovTween = null;
let isFlightActive = false;

function stopFlightTweens() {
  if (camPosTween) { camPosTween.kill(); camPosTween = null; }
  if (camTargetTween) { camTargetTween.kill(); camTargetTween = null; }
  if (fovTween) { fovTween.kill(); fovTween = null; }
  isFlightActive = false;
}

// Toast Helper (Cardless floating text at top center with silky GSAP fade & slide)
function showToast(text) {
  if (!landmarkToast) return;
  landmarkToast.textContent = text;
  landmarkToast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  gsap.killTweensOf(landmarkToast);
  gsap.fromTo(landmarkToast,
    { opacity: 0, y: -8 },
    { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" }
  );
  toastTimeout = setTimeout(() => {
    gsap.to(landmarkToast, {
      opacity: 0,
      y: -6,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        landmarkToast.classList.add('hidden');
      }
    });
  }, 3200);
}

// Fly smoothly to landmark with GSAP cubic power2.inOut easing
function flyToWaypoint(camPos, targetPos, fov, toastText, waypointId = 'landmark') {
  if (controls.enabled) {
    disableFreeOrbit();
  }
  stopFlightTweens();

  waypointMode = true;
  activeWaypointId = waypointId;
  waypointCamPos.copy(camPos);
  waypointTarget.copy(targetPos);
  waypointFov = fov;
  islandOrbitAngle = Math.atan2(camPos.x - targetPos.x, camPos.z - targetPos.z);
  sanctuaryOrbitAngle = Math.atan2(camPos.x, camPos.z);
  resetUserIdle();
  conductor.resetIdle();
  showToast(toastText);

  isFlightActive = true;
  camPosTween = gsap.to(currentCamPos, {
    x: camPos.x,
    y: camPos.y,
    z: camPos.z,
    duration: 1.4,
    ease: "power2.inOut",
    onComplete: () => {
      isFlightActive = false;
    }
  });

  camTargetTween = gsap.to(currentCamTarget, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: 1.4,
    ease: "power2.inOut"
  });

  const adaptiveFov = getAdaptiveFOV(fov, camera.aspect);
  targetFov = adaptiveFov;
  fovTween = gsap.to(camera, {
    fov: adaptiveFov,
    duration: 1.4,
    ease: "power2.inOut",
    onUpdate: () => camera.updateProjectionMatrix()
  });
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

    if (!controls.enabled && !waypointMode) {
      // Check if user is idle for cinematic auto-orbit in guided scroll
      const isIdle = userIdleTime >= IDLE_TRIGGER;
      const targetIdleWeight = isIdle ? 1.0 : 0.0;
      idleWeight += (targetIdleWeight - idleWeight) * 0.035;

      if (idleWeight > 0.01) {
        // Orbit around tower center smoothly
        sanctuaryOrbitAngle += 0.0028;
        const currentDist = Math.hypot(sample.position.x, sample.position.z);
        const orbitRadius = Math.max(16.0, Math.min(28.0, currentDist));
        const orbitHeight = Math.max(8.0, sample.position.y);

        tempIdlePos.set(
          Math.sin(sanctuaryOrbitAngle) * orbitRadius,
          orbitHeight,
          Math.cos(sanctuaryOrbitAngle) * orbitRadius
        );
      }

      currentCamPos.lerp(sample.position, 0.12);
      currentCamTarget.lerp(sample.target, 0.12);

      blendedCamPos.lerpVectors(currentCamPos, tempIdlePos, idleWeight);
      blendedCamTarget.lerpVectors(currentCamTarget, towerCenterTarget, idleWeight);

      // Add subtle organic mouse parallax (only when active)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      if (camera.aspect < 1.0) {
        const pullback = 1.0 + (1.0 - camera.aspect) * 0.65;
        _camOffset.subVectors(blendedCamPos, blendedCamTarget).multiplyScalar(pullback);
        camera.position.addVectors(blendedCamTarget, _camOffset);
      } else {
        camera.position.copy(blendedCamPos);
      }

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
    stopFlightTweens();
    waypointMode = false;
    showToast('Guided Scroll Resumed');
  }
}, { passive: true });

window.addEventListener('touchmove', () => {
  if (waypointMode) {
    stopFlightTweens();
    waypointMode = false;
    showToast('Guided Scroll Resumed');
  }
}, { passive: true });

function updateCameraBtnText(isOrbit) {
  if (!cameraOrbitBtn) return;
  const textEl = cameraOrbitBtn.querySelector('.camera-btn-text');
  if (!textEl) return;
  const isMobile = window.innerWidth <= 640;
  if (isOrbit) {
    textEl.textContent = isMobile ? 'Scroll' : 'Guided Scroll';
  } else {
    textEl.textContent = isMobile ? 'Orbit' : 'Free Orbit';
  }
}

window.addEventListener('resize', () => {
  updateCameraBtnText(controls.enabled);
});

// 3. Free Orbit Mode Toggle
function enableFreeOrbit() {
  stopFlightTweens();
  controls.enabled = true;
  conductor.setManualOverride(true);
  controls.target.copy(currentCamTarget);
  document.body.classList.add('mode-free-orbit');
  if (cameraControlsHud) {
    cameraControlsHud.classList.remove('hidden');
  }
  if (cameraOrbitBtn) {
    cameraOrbitBtn.classList.add('active');
    updateCameraBtnText(true);
  }
  if (menuOrbitBtn) {
    menuOrbitBtn.textContent = 'Guided Scroll';
    menuOrbitBtn.classList.add('active');
  }
}

function disableFreeOrbit() {
  stopFlightTweens();
  controls.enabled = false;
  conductor.setManualOverride(false);
  document.body.classList.remove('mode-free-orbit');
  if (cameraControlsHud) {
    cameraControlsHud.classList.add('hidden');
  }
  if (cameraOrbitBtn) {
    cameraOrbitBtn.classList.remove('active');
    updateCameraBtnText(false);
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
    showToast('Guided Scroll Active');
  } else {
    enableFreeOrbit();
    showToast('Free Orbit Active • Drag to inspect 360°');
  }
}

// Camera HUD Controls with silky GSAP easing
function zoomCamera(factor) {
  if (!controls.enabled) enableFreeOrbit();
  resetUserIdle();
  conductor.resetIdle();
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const targetOffset = offset.clone().multiplyScalar(factor);
  const dist = targetOffset.length();
  if (dist >= controls.minDistance && dist <= controls.maxDistance) {
    const targetX = controls.target.x + targetOffset.x;
    const targetY = controls.target.y + targetOffset.y;
    const targetZ = controls.target.z + targetOffset.z;
    gsap.to(camera.position, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: () => controls.update()
    });
  }
}

function rotateCamera(angle) {
  if (!controls.enabled) enableFreeOrbit();
  resetUserIdle();
  conductor.resetIdle();
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  const targetX = controls.target.x + offset.x;
  const targetY = controls.target.y + offset.y;
  const targetZ = controls.target.z + offset.z;
  gsap.to(camera.position, {
    x: targetX,
    y: targetY,
    z: targetZ,
    duration: 0.5,
    ease: "power2.out",
    onUpdate: () => controls.update()
  });
}

function resetCameraView() {
  if (controls.enabled) {
    disableFreeOrbit();
  }
  flyToWaypoint(
    new THREE.Vector3(18.5, 14.8, 23.5),
    new THREE.Vector3(0, 5.8, 0),
    42,
    'Full Archipelago View Reset',
    'sanctuary'
  );
  conductor.setProgress(0.0, false);
  window.scrollTo({ top: 0, behavior: 'instant' });
  menuPillBtns.forEach(b => b.classList.remove('active'));
  const sanctuaryBtn = document.querySelector('.menu-pill-btn[data-target="sanctuary"]');
  if (sanctuaryBtn) sanctuaryBtn.classList.add('active');
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

  const pills = navMenuDrawer.querySelectorAll('.menu-pill-btn');
  gsap.killTweensOf(pills);
  gsap.fromTo(pills,
    { opacity: 0, x: -14 },
    { opacity: 1, x: 0, duration: 0.32, stagger: 0.045, ease: "power2.out" }
  );
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

function openAboutModal() {
  if (!aboutModal) return;
  aboutModal.classList.remove('hidden');
  const card = aboutModal.querySelector('.modal-card');
  if (card) {
    gsap.killTweensOf(card);
    gsap.fromTo(card,
      { opacity: 0, scale: 0.93, y: 18 },
      { opacity: 1, scale: 1.0, y: 0, duration: 0.36, ease: "power2.out" }
    );
  }
}

function closeAboutModal() {
  if (!aboutModal) return;
  const card = aboutModal.querySelector('.modal-card');
  if (card) {
    gsap.killTweensOf(card);
    gsap.to(card, {
      opacity: 0,
      scale: 0.95,
      y: 12,
      duration: 0.24,
      ease: "power2.in",
      onComplete: () => aboutModal.classList.add('hidden')
    });
  } else {
    aboutModal.classList.add('hidden');
  }
}

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
        'The Sanctuary • Full Archipelago View',
        'sanctuary'
      );
      conductor.setProgress(0.0, false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      audio.playChime();
    } else if (target === 'pumpkin') {
      flyToWaypoint(
        new THREE.Vector3(-6.2, 3.8, 14.2),
        new THREE.Vector3(-11.5, 0.8, 5.0),
        40,
        'Pumpkin Grove • The Alchemist\'s Garden',
        'pumpkin'
      );
      audio.playBubble();
    } else if (target === 'cottage') {
      flyToWaypoint(
        new THREE.Vector3(17.8, 4.2, 5.2),
        new THREE.Vector3(11.5, 1.4, -4.5),
        38,
        'Cottage Outpost • The Apprentice\'s Watch',
        'cottage'
      );
      audio.playChime();
    } else if (target === 'orbit') {
      toggleFreeOrbit();
    } else if (target === 'about') {
      openAboutModal();
    }
  });
});

// About Modal Event Listeners
if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    closeAboutModal();
  });
}

if (aboutModal) {
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
      closeAboutModal();
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

    // Update 3D Lighting & Celestial presets with smooth 1.2s GSAP transitions
    lighting.applyPreset(theme, 1.2);
    celestial.setTheme(theme);
    satelliteIslands.setTheme(theme);

    // Update cloud materials based on atmosphere with smooth 1.2s GSAP transitions
    clouds.setTheme(theme, 1.2);
    if (theme === 'night') {
      if (bgCloudMat) {
        gsap.to(bgCloudMat.color, { r: 0x28/255, g: 0x38/255, b: 0x5a/255, duration: 1.2, ease: "power2.inOut" });
        gsap.to(bgCloudMat.emissive, { r: 0x1a/255, g: 0x24/255, b: 0x42/255, duration: 1.2, ease: "power2.inOut" });
        gsap.to(bgCloudMat, { emissiveIntensity: 0.85, duration: 1.2, ease: "power2.inOut" });
        if (bgCloudMat.sheenColor) {
          gsap.to(bgCloudMat.sheenColor, { r: 0x78/255, g: 0x9a/255, b: 0xd8/255, duration: 1.2, ease: "power2.inOut" });
        }
      }
      showToast('Midnight Leylines Activated');
    } else if (theme === 'sunset') {
      if (bgCloudMat) {
        gsap.to(bgCloudMat.color, { r: 0xf5/255, g: 0xf0/255, b: 0xee/255, duration: 1.2, ease: "power2.inOut" });
        gsap.to(bgCloudMat.emissive, { r: 0, g: 0, b: 0, duration: 1.2, ease: "power2.inOut" });
        gsap.to(bgCloudMat, { emissiveIntensity: 0.0, duration: 1.2, ease: "power2.inOut" });
        if (bgCloudMat.sheenColor) {
          gsap.to(bgCloudMat.sheenColor, { r: 0xff/255, g: 0xcb/255, b: 0xab/255, duration: 1.2, ease: "power2.inOut" });
        }
      }
      showToast('Golden Sunset Hour');
    } else {
      if (bgCloudMat) {
        gsap.to(bgCloudMat.color, { r: 1, g: 1, b: 1, duration: 1.2, ease: "power2.inOut" });
        gsap.to(bgCloudMat.emissive, { r: 0, g: 0, b: 0, duration: 1.2, ease: "power2.inOut" });
        gsap.to(bgCloudMat, { emissiveIntensity: 0.0, duration: 1.2, ease: "power2.inOut" });
        if (bgCloudMat.sheenColor) {
          gsap.to(bgCloudMat.sheenColor, { r: 0xff/255, g: 0xf8/255, b: 0xf0/255, duration: 1.2, ease: "power2.inOut" });
        }
      }
      showToast('Radiant Daylight Activated');
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
        showToast('Ambient Soundscape Active');
      } else {
        soundIconOn.classList.add('hidden');
        soundIconOff.classList.remove('hidden');
        audioToggleBtn.classList.remove('active');
        showToast('Ambient Soundscape Muted');
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
      showToast('Cauldron Elixir Bubbles');
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

  userIdleTime += dt;
  const isIdle = userIdleTime >= IDLE_TRIGGER;
  const idleActiveDuration = Math.max(0, userIdleTime - IDLE_TRIGGER);

  // 1. Free Orbit Mode
  if (controls.enabled) {
    if (isIdle) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.55;
    } else {
      controls.autoRotate = false;
    }
    controls.update();
  } else if (waypointMode) {
    // 2. Waypoint Landmark Mode (Pumpkin Grove, Cottage Outpost, or Sanctuary)
    if (isFlightActive) {
      // Camera position & target are being smoothly animated by GSAP power2.inOut
    } else if (isIdle) {
      // If at an island, first orbit that island for 6.5s, then slowly zoom out to orbit the whole sanctuary
      if (activeWaypointId !== 'sanctuary' && idleActiveDuration < 6.5) {
        islandOrbitAngle += 0.0035;
        const islandRadius = 10.5;
        const orbitX = waypointTarget.x + Math.sin(islandOrbitAngle) * islandRadius;
        const orbitY = waypointCamPos.y + 0.3;
        const orbitZ = waypointTarget.z + Math.cos(islandOrbitAngle) * islandRadius;
        waypointOrbitPos.set(orbitX, orbitY, orbitZ);

        currentCamPos.lerp(waypointOrbitPos, 0.045);
        currentCamTarget.lerp(waypointTarget, 0.05);
      } else {
        // Slowly zooms out and orbits the whole sanctuary again!
        sanctuaryOrbitAngle += 0.0028;
        const sanctuaryRadius = 23.5;
        const orbitX = Math.sin(sanctuaryOrbitAngle) * sanctuaryRadius;
        const orbitY = 14.5;
        const orbitZ = Math.cos(sanctuaryOrbitAngle) * sanctuaryRadius;
        sanctuaryOrbitPos.set(orbitX, orbitY, orbitZ);

        currentCamPos.lerp(sanctuaryOrbitPos, 0.026);
        currentCamTarget.lerp(towerCenterTarget, 0.035);
        targetFov = 42;
      }
    } else {
      // User is actively looking at the landmark
      currentCamPos.lerp(waypointCamPos, 0.07);
      currentCamTarget.lerp(waypointTarget, 0.07);
    }

    // Subtle organic parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    if (camera.aspect < 1.0 && activeWaypointId === 'sanctuary') {
      const pullback = 1.0 + (1.0 - camera.aspect) * 0.65;
      _camOffset.subVectors(currentCamPos, currentCamTarget).multiplyScalar(pullback);
      camera.position.addVectors(currentCamTarget, _camOffset);
    } else {
      camera.position.copy(currentCamPos);
    }
    camera.position.x += mouse.x * 0.22;
    camera.position.y += -mouse.y * 0.16;

    camera.lookAt(currentCamTarget);

    if (!isFlightActive) {
      targetFov = getAdaptiveFOV(waypointFov, camera.aspect);
      camera.fov += (targetFov - camera.fov) * 0.07;
      camera.updateProjectionMatrix();
    }

    // Keep OrbitControls pivot aligned with current focus
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
