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
import { createRainbow } from './world/rainbow.js';

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
const modeScrollBtn = document.getElementById('mode-scroll-btn');
const modeOrbitBtn = document.getElementById('mode-orbit-btn');
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const soundIconOn = audioToggleBtn ? audioToggleBtn.querySelector('.sound-icon-on') : null;
const soundIconOff = audioToggleBtn ? audioToggleBtn.querySelector('.sound-icon-off') : null;

// Modal & Toast DOM
const aboutModal = document.getElementById('about-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const landmarkToast = document.getElementById('landmark-toast');

// Pure Floating Story Overlay DOM (Zero containers, pure typography)
const storyOverlay = document.getElementById('story-overlay');
const storyTag = document.getElementById('story-tag');
const storyTitle = document.getElementById('story-title');
const storyDesc = document.getElementById('story-desc');
const storyPrompt = document.getElementById('story-prompt');

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
const rainbow = createRainbow(scene);
const cameraTrack = createCameraTrack();
const audio = createSynthAudio();

// Initialize lighting, celestial & archipelago to default Radiant Day atmosphere
lighting.applyPreset('day', 0);
celestial.setTheme('day');
satelliteIslands.setTheme('day');
clouds.setTheme('day', 0);
rainbow.setTheme('day', 0);
document.body.classList.remove('theme-sunset', 'theme-night');
document.body.classList.add('theme-day');

// Current camera interpolation states
const currentCamPos = new THREE.Vector3().copy(camera.position);
const currentCamTarget = new THREE.Vector3(0, 5.2, 0);
let targetFov = 42;

// Cinematic Idle Auto-Orbit State
let idleWeight = 0;
let sanctuaryOrbitAngle = Math.atan2(10.0, 32.5);
let islandOrbitAngle = 0;
const towerCenterTarget = new THREE.Vector3(0, 5.2, 0);
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
    onUpdate: () => {
      camera.position.copy(currentCamPos);
      if (controls.enabled) controls.update();
    },
    onComplete: () => {
      isFlightActive = false;
      if (controls.enabled) controls.update();
    }
  });

  camTargetTween = gsap.to(currentCamTarget, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: 1.4,
    ease: "power2.inOut",
    onUpdate: () => {
      if (controls.enabled) {
        controls.target.copy(currentCamTarget);
        controls.update();
      }
    }
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

// State tracking for journey progress and end-of-scroll actions
let hasCompletedInitialLanding = false;
let hasAutoOpenedMenuAtEnd = false;
let storyFadeTimeout = null;

// Pure Floating Storytelling Chapters (Mapped to slow reading plateaus & islands)
const storyBeats = [
  {
    id: 'welcome',
    range: [0.00, 0.08],
    tag: "THE CELESTIAL SANCTUARY",
    title: "Welcome, Traveler",
    desc: "A quiet sanctuary of ancient starcraft floating high above the clouds.",
    prompt: "Scroll down to embark"
  },
  {
    id: 'spire',
    range: [0.09, 0.22],
    tag: "HEART OF THE SANCTUARY",
    title: "The Astromancer's Spire",
    desc: "Ancient stone masonry and simmering potion draughts guard the celestial leylines.",
    prompt: ""
  },
  {
    id: 'chimney',
    range: [0.34, 0.43],
    tag: "THE WIZARD'S HEARTH",
    title: "Chimney & Whispering Mists",
    desc: "Drifting hearth smoke ascends from the crooked slate roof into the peaceful mountain sky.",
    prompt: ""
  },
  {
    id: 'pumpkin',
    range: [0.63, 0.72],
    tag: "THE ALCHEMIST'S GARDEN",
    title: "Pumpkin Grove",
    desc: "Glowing autumn gourds rest upon stone pedestals beneath the silent lantern crane.",
    prompt: ""
  },
  {
    id: 'cottage',
    range: [0.86, 0.94],
    tag: "THE APPRENTICE'S WATCH",
    title: "Cottage Outpost",
    desc: "Across floating stepping stones, the turquoise belfry lantern keeps watch over the quiet void.",
    prompt: ""
  }
];

let currentBeatIndex = -1;

function hideStoryTemporarily() {
  if (!storyOverlay || storyOverlay.classList.contains('hidden')) return;
  gsap.to(storyOverlay, {
    opacity: 0,
    y: -4,
    duration: 0.5,
    ease: "power2.inOut",
    onComplete: () => {
      storyOverlay.classList.add('hidden');
    }
  });
}

function updateStoryText(progress) {
  if (controls.enabled || waypointMode) {
    if (storyOverlay && !storyOverlay.classList.contains('hidden')) {
      storyOverlay.classList.add('hidden');
    }
    return;
  }

  // Once user scrolls past initial overview, mark that journey has started
  if (progress > 0.08) {
    hasCompletedInitialLanding = true;
  }

  // When completing the scroll (reaching overview pullback at the end):
  // 1. Do NOT show welcome message again!
  // 2. Open navigation menu automatically so user can see menu items and choose!
  if (progress >= 0.96) {
    if (storyOverlay && !storyOverlay.classList.contains('hidden')) {
      storyOverlay.classList.add('hidden');
    }
    if (hasCompletedInitialLanding && !hasAutoOpenedMenuAtEnd) {
      hasAutoOpenedMenuAtEnd = true;
      setTimeout(() => {
        if (!menuOpen && !controls.enabled) {
          openMenu();
        }
      }, 450);
    }
    return;
  } else if (progress < 0.90) {
    // Reset auto-open flag if user scrolls back up into the journey
    hasAutoOpenedMenuAtEnd = false;
  }

  // If user scrolls back to the very top after having completed landing:
  // Do NOT show welcome message again!
  if (progress <= 0.08 && hasCompletedInitialLanding) {
    if (storyOverlay && !storyOverlay.classList.contains('hidden')) {
      storyOverlay.classList.add('hidden');
    }
    return;
  }

  // Find active beat for current progress
  let activeBeatIndex = -1;
  for (let i = 0; i < storyBeats.length; i++) {
    const [min, max] = storyBeats[i].range;
    if (progress >= min && progress <= max) {
      activeBeatIndex = i;
      break;
    }
  }

  // If in a transition zone between landmarks (e.g. while revolving around the back/flank)
  if (activeBeatIndex === -1) {
    if (currentBeatIndex !== -1) {
      currentBeatIndex = -1;
      clearTimeout(storyFadeTimeout);
      hideStoryTemporarily();
    }
    return;
  }

  if (activeBeatIndex === currentBeatIndex) return;
  currentBeatIndex = activeBeatIndex;
  const beat = storyBeats[activeBeatIndex];

  if (!storyOverlay || !storyTag || !storyTitle || !storyDesc) return;

  clearTimeout(storyFadeTimeout);
  storyOverlay.classList.remove('hidden');

  // Kill existing tweens on story elements to prevent jerking
  gsap.killTweensOf([storyOverlay, storyTag, storyTitle, storyDesc, storyPrompt]);

  // Silky smooth cross-fade without layout shift or jerk
  gsap.to([storyTag, storyTitle, storyDesc, storyPrompt], {
    opacity: 0,
    y: -5,
    duration: 0.18,
    ease: "power2.in",
    onComplete: () => {
      storyTag.textContent = beat.tag;
      storyTitle.textContent = beat.title;
      storyDesc.textContent = beat.desc;

      if (storyPrompt) {
        if (beat.prompt) {
          const promptSpan = storyPrompt.querySelector('span');
          if (promptSpan) promptSpan.textContent = beat.prompt;
          storyPrompt.style.display = 'inline-flex';
        } else {
          storyPrompt.style.display = 'none';
        }
      }

      gsap.fromTo(
        [storyTag, storyTitle, storyDesc, storyPrompt],
        { opacity: 0, y: 7 },
        {
          opacity: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.04,
          ease: "power2.out"
        }
      );

      // Auto-disappear after 4.2 seconds so it never lingers while user inspects!
      if (activeBeatIndex > 0) {
        storyFadeTimeout = setTimeout(() => {
          hideStoryTemporarily();
        }, 4200);
      }
    }
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

    // Update pure floating story typography
    updateStoryText(smooth);

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

function updateCameraModeUI(isOrbit) {
  if (modeScrollBtn) {
    modeScrollBtn.classList.toggle('active', !isOrbit);
    modeScrollBtn.setAttribute('aria-checked', String(!isOrbit));
  }
  if (modeOrbitBtn) {
    modeOrbitBtn.classList.toggle('active', isOrbit);
    modeOrbitBtn.setAttribute('aria-checked', String(isOrbit));
  }
  if (menuOrbitBtn) {
    menuOrbitBtn.textContent = isOrbit ? 'Guided Scroll' : 'Free Orbit';
    menuOrbitBtn.classList.toggle('active', isOrbit);
  }
}

// 3. Free Orbit Mode Toggle
function enableFreeOrbit(silent = false) {
  stopFlightTweens();
  controls.enabled = true;
  conductor.setManualOverride(true);
  controls.target.copy(currentCamTarget);
  document.body.classList.add('mode-free-orbit');
  if (cameraControlsHud) {
    cameraControlsHud.classList.remove('hidden');
  }
  if (storyOverlay) {
    storyOverlay.classList.add('hidden');
  }
  updateCameraModeUI(true);
  if (!silent) {
    showToast('Free Orbit Active • Drag to inspect 360°');
    audio.playTinkle();
  }
}

function disableFreeOrbit(silent = false) {
  stopFlightTweens();
  controls.enabled = false;
  conductor.setManualOverride(false);
  document.body.classList.remove('mode-free-orbit');
  if (cameraControlsHud) {
    cameraControlsHud.classList.add('hidden');
  }
  if (storyOverlay) {
    storyOverlay.classList.remove('hidden');
  }
  updateCameraModeUI(false);
  currentBeatIndex = -1;
  updateStoryText(conductor.getSmooth());
  if (!silent) {
    showToast('Guided Scroll Active');
    audio.playTinkle();
  }
}

function toggleFreeOrbit() {
  if (controls.enabled) {
    disableFreeOrbit();
  } else {
    enableFreeOrbit();
  }
}

if (modeScrollBtn) {
  modeScrollBtn.addEventListener('click', () => {
    if (controls.enabled) disableFreeOrbit();
  });
}

if (modeOrbitBtn) {
  modeOrbitBtn.addEventListener('click', () => {
    if (!controls.enabled) enableFreeOrbit();
  });
}

// Camera HUD Controls with silky GSAP easing
function zoomCamera(factor) {
  if (!controls.enabled) enableFreeOrbit(true);
  resetUserIdle();
  conductor.resetIdle();
  audio.playTinkle();
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
  if (!controls.enabled) enableFreeOrbit(true);
  resetUserIdle();
  conductor.resetIdle();
  audio.playTinkle();
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
  audio.playTinkle();
  flyToWaypoint(
    new THREE.Vector3(10.0, 10.8, 32.5),
    new THREE.Vector3(0, 5.2, 0),
    42,
    'Full Archipelago View Reset',
    'sanctuary'
  );
  conductor.setProgress(0.0, false);
  window.scrollTo({ top: 0, behavior: 'instant' });
  currentBeatIndex = -1;
  hasCompletedInitialLanding = false;
  hasAutoOpenedMenuAtEnd = false;
  clearTimeout(storyFadeTimeout);
  if (storyOverlay) {
    storyOverlay.classList.remove('hidden');
  }
  updateStoryText(0);
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

// Helper to focus any island dynamically with GSAP (Dead Center Island Framing)
function focusIsland(islandId) {
  audio.playTinkle();
  if (storyOverlay) {
    storyOverlay.classList.add('hidden');
  }
  if (islandId === 'pumpkin') {
    flyToWaypoint(
      new THREE.Vector3(-11.5, 3.8, 16.5),
      new THREE.Vector3(-11.5, 0.6, 5.0),
      38,
      "Pumpkin Grove • The Alchemist's Garden",
      'pumpkin'
    );
  } else if (islandId === 'cottage') {
    flyToWaypoint(
      new THREE.Vector3(11.5, 4.2, 7.5),
      new THREE.Vector3(11.5, 1.2, -4.5),
      38,
      "Cottage Outpost • The Apprentice's Watch",
      'cottage'
    );
  } else {
    flyToWaypoint(
      new THREE.Vector3(4.5, 6.8, 14.5),
      new THREE.Vector3(0.0, 5.2, 0.0),
      40,
      "The Astromancer's Spire & Sanctuary",
      'sanctuary'
    );
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
      focusIsland('sanctuary');
      conductor.setProgress(0.0, false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (target === 'pumpkin') {
      focusIsland('pumpkin');
    } else if (target === 'cottage') {
      focusIsland('cottage');
    } else if (target === 'orbit') {
      toggleFreeOrbit();
    } else if (target === 'about') {
      audio.playTinkle();
      openAboutModal();
    }
  });
});

// About Modal Event Listeners
if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    audio.playTinkle();
    closeAboutModal();
  });
}

if (aboutModal) {
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
      audio.playTinkle();
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
    audio.playTinkle();

    // Update body class for CSS gradient backdrop
    document.body.classList.remove('theme-sunset', 'theme-night', 'theme-day');
    document.body.classList.add(`theme-${theme}`);

    // Update 3D Lighting & Celestial presets with smooth 1.2s GSAP transitions
    lighting.applyPreset(theme, 1.2);
    celestial.setTheme(theme);
    satelliteIslands.setTheme(theme);
    rainbow.setTheme(theme, 1.2);

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

// 7. Smart Canvas Drag Detection & Interactive 3D Island Focus
let pointerStartPos = { x: 0, y: 0 };
let isPointerDown = false;
let hasDragged = false;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

canvas.addEventListener('pointerdown', (e) => {
  pointerStartPos = { x: e.clientX, y: e.clientY };
  isPointerDown = true;
  hasDragged = false;
});

canvas.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  const dist = Math.hypot(e.clientX - pointerStartPos.x, e.clientY - pointerStartPos.y);
  if (dist > 6) {
    hasDragged = true;
    // Seamlessly auto-engage Free Orbit when a user clicks & drags on canvas!
    if (!controls.enabled) {
      enableFreeOrbit(false);
    }
  }
});

canvas.addEventListener('pointerup', () => {
  isPointerDown = false;
});

// Double-click on canvas resets camera view to full archipelago overview
canvas.addEventListener('dblclick', () => {
  resetCameraView();
});

// Single tap/click on 3D canvas (without drag) focuses on clicked island
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

  // If user was dragging 360° orbit, do not trigger raycast click
  if (hasDragged) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  // 1. Check Pumpkin Grove Island
  if (satelliteIslands && satelliteIslands.leftIsland) {
    const pumpkinHits = raycaster.intersectObjects(satelliteIslands.leftIsland.children, true);
    if (pumpkinHits.length > 0) {
      focusIsland('pumpkin');
      return;
    }
  }

  // 2. Check Cottage Outpost Island
  if (satelliteIslands && satelliteIslands.rightIsland) {
    const cottageHits = raycaster.intersectObjects(satelliteIslands.rightIsland.children, true);
    if (cottageHits.length > 0) {
      focusIsland('cottage');
      return;
    }
  }

  // 3. Check Main Tower & Sanctuary
  const towerHits = raycaster.intersectObjects(tower.group.children, true);
  if (towerHits.length > 0) {
    let hit = towerHits[0].object;
    let namedParent = hit;
    while (namedParent && !namedParent.name && namedParent !== tower.group) {
      namedParent = namedParent.parent;
    }

    const name = namedParent ? namedParent.name : '';

    if (name === 'cauldron' || hit.material === tower.materials.potionGlow) {
      particles.triggerCauldronBurst();
      audio.playBubble();
      showToast('Cauldron Elixir Bubbles');
    } else {
      focusIsland('sanctuary');
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
      // Gently orbit around whatever landmark/island is currently selected
      if (activeWaypointId !== 'sanctuary' && activeWaypointId !== 'overview') {
        islandOrbitAngle += 0.0035;
        const islandRadius = 11.5;
        const orbitX = waypointTarget.x + Math.sin(islandOrbitAngle) * islandRadius;
        const orbitY = waypointCamPos.y + Math.sin(islandOrbitAngle * 0.5) * 0.35;
        const orbitZ = waypointTarget.z + Math.cos(islandOrbitAngle) * islandRadius;
        waypointOrbitPos.set(orbitX, orbitY, orbitZ);

        currentCamPos.lerp(waypointOrbitPos, 0.045);
        currentCamTarget.lerp(waypointTarget, 0.05);
      } else {
        // Orbit around the Sanctuary Spire
        sanctuaryOrbitAngle += 0.0028;
        const sanctuaryRadius = activeWaypointId === 'overview' ? 33.5 : 15.5;
        const orbitX = Math.sin(sanctuaryOrbitAngle) * sanctuaryRadius;
        const orbitY = activeWaypointId === 'overview' ? 10.8 : 7.2;
        const orbitZ = Math.cos(sanctuaryOrbitAngle) * sanctuaryRadius;
        sanctuaryOrbitPos.set(orbitX, orbitY, orbitZ);

        currentCamPos.lerp(sanctuaryOrbitPos, 0.026);
        currentCamTarget.lerp(waypointTarget, 0.035);
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

  // Update atmospheric ethereal sky rainbow
  rainbow.update(dt, time);

  // Update background clouds & twinkling stars
  updateScene(dt, time);

  // Update lighting flickers
  lighting.update(time);

  // Render
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
