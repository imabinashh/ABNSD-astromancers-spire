// ============================================================================
// Minimalist Arcane Reticle — Custom Mouse Cursor
// High-end, architectural celestial coordinate reticle with dynamic velocity scaling
// and difference blend-mode inversion across daylight, sunset, and starry night.
// ============================================================================

export function initCustomCursor() {
  // Only initialize on desktop devices with a precision pointer (mouse / trackpad)
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return null;
  }

  // 1. Create and inject Cursor DOM elements
  const cursorWrap = document.createElement('div');
  cursorWrap.id = 'arcane-cursor';
  cursorWrap.className = 'arcane-cursor is-outside';
  cursorWrap.setAttribute('aria-hidden', 'true');

  cursorWrap.innerHTML = `
    <div class="cursor-dot"></div>
    <div class="cursor-ring">
      <div class="ring-dial">
        <span class="arcane-inner-ring"></span>
        <span class="crosshair-tick tick-n"></span>
        <span class="crosshair-tick tick-s"></span>
        <span class="crosshair-tick tick-w"></span>
        <span class="crosshair-tick tick-e"></span>
      </div>
    </div>
  `;

  document.body.appendChild(cursorWrap);
  document.body.classList.add('custom-cursor-enabled');

  const dot = cursorWrap.querySelector('.cursor-dot');
  const ring = cursorWrap.querySelector('.cursor-ring');

  // Physics state
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let prevX = targetX;
  let prevY = targetY;
  let smoothSpeed = 0;
  let currentAngle = 0;
  let isOrbiting = false;
  let isDown = false;
  let isHovering = false;
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

    // Zero-latency instant core dot tracking
    dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
  }

  function onMouseDown(e) {
    isDown = true;
    cursorWrap.classList.add('is-clicking');
  }

  function onMouseUp(e) {
    isDown = false;
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
      // Check if we didn't just move into another interactive child
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

  // 3. Fluid Physics & Velocity Dynamic Scaling Loop
  function updatePhysics(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Smooth-lerp trailing physics for the coordinate ring
    const followFactor = 1 - Math.exp(-22 * dt);
    ringX += (targetX - ringX) * followFactor;
    ringY += (targetY - ringY) * followFactor;

    // Velocity computation
    const vx = targetX - prevX;
    const vy = targetY - prevY;
    prevX = targetX;
    prevY = targetY;

    const instantSpeed = Math.hypot(vx, vy);
    smoothSpeed += (instantSpeed - smoothSpeed) * (1 - Math.exp(-15 * dt));

    // Dynamic directional stretch on fast motion
    if (smoothSpeed > 1.2) {
      currentAngle = Math.atan2(vy, vx);
    }

    const stretch = isHovering ? 0 : Math.min(smoothSpeed * 0.007, 0.32);
    const scaleX = 1 + stretch;
    const scaleY = 1 / (1 + stretch * 0.7);

    // Apply hardware-accelerated transform to the outer reticle ring
    ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${currentAngle.toFixed(3)}rad) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;

    rafId = requestAnimationFrame(updatePhysics);
  }

  rafId = requestAnimationFrame(updatePhysics);

  // 4. Public API to toggle Orbit Reticle State
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
