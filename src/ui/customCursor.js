import gsap from 'gsap';

// ============================================================================
// Concept 1: The Celestial Stardust & Orb — Custom Mouse Cursor
// Ethereal, responsive, and magical like an Astromancer's wand tip guiding you
// through the clouds:
// - Core: 4-pointed golden-diamond star dot with cyan stardust core (0 latency)
// - Orbit Ring: Smooth-lerped celestial ring with buttery physics damping
// - Hovering: Luminous cyan-azure rune aura expanding over buttons & menu items
// - Free Orbit Mode: Celestial gyroscope / armillary sphere reticle
// - Click: Emits 3-4 ephemeral stardust sparks that dissipate into the sky
// ============================================================================

export function initCustomCursor() {
  // Only initialize on desktop devices with a precision pointer (mouse / trackpad)
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return null;
  }

  // 1. Create and inject Cursor DOM elements
  const cursorWrap = document.createElement('div');
  cursorWrap.id = 'celestial-cursor-wrap';
  cursorWrap.className = 'celestial-cursor-wrap is-outside';
  cursorWrap.setAttribute('aria-hidden', 'true');

  cursorWrap.innerHTML = `
    <!-- Ephemeral Spark Container -->
    <div class="stardust-container"></div>

    <!-- Smooth-lerped Celestial Orbit Ring / Gyroscope -->
    <div class="celestial-orbit-ring">
      <div class="gyroscope-disc">
        <span class="gyro-ring-h"></span>
        <span class="gyro-ring-v"></span>
      </div>
    </div>

    <!-- Zero-latency Instant Core: 4-Pointed Golden-Diamond Star -->
    <div class="celestial-star-core">
      <svg class="celestial-star-svg" viewBox="0 0 24 24" width="15" height="15">
        <!-- High-contrast dark outline for brilliant daylight/cloud legibility -->
        <path class="star-outline" d="M12 2 C12 7.5 16.5 12 22 12 C16.5 12 12 16.5 12 22 C12 16.5 7.5 12 2 12 C7.5 12 12 7.5 12 2 Z" fill="#080e18" stroke="#080e18" stroke-width="2.6" stroke-linejoin="round" />
        <!-- Radiant Golden Star Fill -->
        <path class="star-fill" d="M12 2 C12 7.5 16.5 12 22 12 C16.5 12 12 16.5 12 22 C12 16.5 7.5 12 2 12 C7.5 12 12 7.5 12 2 Z" fill="url(#celestialStarGold)" />
        <!-- Spectral Cyan Core Spark -->
        <circle cx="12" cy="12" r="2.2" fill="#4deeea" />
        <defs>
          <linearGradient id="celestialStarGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff8db" />
            <stop offset="45%" stop-color="#ffd166" />
            <stop offset="100%" stop-color="#f5a623" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  `;

  document.body.appendChild(cursorWrap);
  document.body.classList.add('custom-cursor-enabled');

  const starCore = cursorWrap.querySelector('.celestial-star-core');
  const orbitRing = cursorWrap.querySelector('.celestial-orbit-ring');
  const sparkContainer = cursorWrap.querySelector('.stardust-container');

  // Physics state
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let isHovering = false;
  let isOrbiting = false;
  let isVisible = false;
  let lastTime = performance.now();
  let rafId = null;

  // 2. Mouse Event Handlers
  function onMouseMove(e) {
    targetX = e.clientX;
    targetY = e.clientY;

    if (!isVisible) {
      isVisible = true;
      cursorWrap.classList.remove('is-outside');
      ringX = targetX;
      ringY = targetY;
    }

    // Zero-latency instant core diamond star tracking
    starCore.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
  }

  function spawnStardustSparks(clientX, clientY) {
    if (!sparkContainer) return;
    const sparkCount = 4;
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'stardust-spark';

      const isCyan = i % 2 === 0;
      spark.style.backgroundColor = isCyan ? '#4deeea' : '#ffd166';
      spark.style.boxShadow = isCyan
        ? '0 0 6px #4deeea, 0 0 12px rgba(77, 238, 234, 0.7)'
        : '0 0 6px #ffd166, 0 0 12px rgba(255, 209, 102, 0.7)';

      // Distribute radially with organic jitter
      const baseAngle = (Math.PI * 2 * i) / sparkCount;
      const angle = baseAngle + (Math.random() - 0.5) * 0.75;
      const distance = 14 + Math.random() * 16;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      spark.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%) scale(1)`;
      sparkContainer.appendChild(spark);

      gsap.to(spark, {
        x: dx,
        y: dy,
        scale: 0.15,
        opacity: 0,
        duration: 0.42 + Math.random() * 0.12,
        ease: 'power2.out',
        onComplete: () => {
          if (spark.parentNode) {
            spark.parentNode.removeChild(spark);
          }
        }
      });
    }
  }

  function onMouseDown(e) {
    cursorWrap.classList.add('is-clicking');
    spawnStardustSparks(e.clientX, e.clientY);
  }

  function onMouseUp() {
    cursorWrap.classList.remove('is-clicking');
  }

  function onMouseLeave() {
    isVisible = false;
    cursorWrap.classList.add('is-outside');
  }

  function onMouseEnter() {
    isVisible = true;
    cursorWrap.classList.remove('is-outside');
  }

  // Interactive Hover Detection using event delegation
  const interactiveSelector = [
    'button',
    'a',
    'input',
    'select',
    '[role="button"]',
    '[data-theme]',
    '[data-mode]',
    '[data-target]',
    '.menu-pill-btn',
    '.camera-mode-btn',
    '.theme-pill-btn',
    '.sound-toggle-btn',
    '.menu-circle-btn',
    '.modal-close-btn'
  ].join(', ');

  function onMouseOver(e) {
    if (e.target && e.target.closest && e.target.closest(interactiveSelector)) {
      if (!isHovering) {
        isHovering = true;
        cursorWrap.classList.add('is-hovering');
      }
    }
  }

  function onMouseOut(e) {
    if (e.target && e.target.closest && e.target.closest(interactiveSelector)) {
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(interactiveSelector)) {
        isHovering = false;
        cursorWrap.classList.remove('is-hovering');
      }
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mousedown', onMouseDown, { passive: true });
  window.addEventListener('mouseup', onMouseUp, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave, { passive: true });
  document.addEventListener('mouseenter', onMouseEnter, { passive: true });
  document.addEventListener('mouseover', onMouseOver, { passive: true });
  document.addEventListener('mouseout', onMouseOut, { passive: true });

  // 3. Buttery Physics Lerp Loop for Trailing Celestial Orbit Ring
  function updatePhysics(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Smooth-lerp trailing physics
    const followFactor = 1 - Math.exp(-18 * dt);
    ringX += (targetX - ringX) * followFactor;
    ringY += (targetY - ringY) * followFactor;

    orbitRing.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;

    rafId = requestAnimationFrame(updatePhysics);
  }

  rafId = requestAnimationFrame(updatePhysics);

  // 4. Public API
  return {
    setOrbitMode(active) {
      isOrbiting = active;
      cursorWrap.classList.toggle('is-orbiting', active);
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      if (cursorWrap.parentNode) cursorWrap.parentNode.removeChild(cursorWrap);
      document.body.classList.remove('custom-cursor-enabled');
    }
  };
}
