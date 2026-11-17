// Scroll Conductor: deterministic, smooth-damped scroll state manager
// Supports:
// 1. Seamless infinite loop: when reaching the bottom, scrolling down seamlessly wraps to the top with ZERO visual jump!
// 2. Idle auto-orbit detection: tracks when viewer is inactive to enable cinematic orbiting!
// 3. Robust touch & wheel tracking across mobile and desktop browsers.

export function createScrollConductor(options = {}) {
  const damping = Number.isFinite(options.damping) ? options.damping : 5.0;
  const onUpdate = typeof options.onUpdate === 'function' ? options.onUpdate : () => {};
  const onChapterChange = typeof options.onChapterChange === 'function' ? options.onChapterChange : () => {};

  let exactProgress = 0;
  let smoothProgress = 0;
  let activeChapter = 0;
  let isRunning = false;
  let lastTime = performance.now();
  let manualOverride = false; // when user enables free-orbit camera

  // Idle tracking for cinematic auto-orbit
  let idleTime = 0;
  let isIdle = false;
  const IDLE_THRESHOLD = 2.5; // seconds of inactivity before cinematic orbit starts

  function resetIdle() {
    idleTime = 0;
    isIdle = false;
  }

  const chapters = options.chapters || [
    { id: 'hero', name: 'The Sanctuary', progress: 0.0 },
    { id: 'ascent', name: 'To The Spire', progress: 0.33 },
    { id: 'descent', name: 'Vertical Descent', progress: 0.66 },
    { id: 'roots', name: 'Underworld Roots', progress: 1.0 }
  ];

  function getScrollY() {
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  function getMaxScroll() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function measure() {
    const max = getMaxScroll();
    const y = Math.max(0, Math.min(max, getScrollY()));
    exactProgress = y / max;
  }

  function onScroll() {
    resetIdle();
    measure();
  }

  // Seamless scroll wrap on wheel (Desktop / Trackpad)
  function onWheel(e) {
    resetIdle();
    if (manualOverride) return;

    const max = getMaxScroll();
    const currentY = getScrollY();

    // If at the very bottom and scrolling down: seamlessly wrap to top!
    if (e.deltaY > 0 && currentY >= max - 3) {
      window.scrollTo({ top: 3, behavior: 'instant' });
      smoothProgress = 0.0;
      exactProgress = 0.0;
      measure();
    }
  }

  // Mobile Touch tracking for seamless loop & responsiveness
  let touchStartY = 0;
  function onTouchStart(e) {
    resetIdle();
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    resetIdle();
    if (manualOverride || !e.touches || e.touches.length === 0) return;

    const currentTouchY = e.touches[0].clientY;
    const dy = touchStartY - currentTouchY; // positive = dragging up / scrolling down
    const max = getMaxScroll();
    const currentY = getScrollY();

    // If reaching bottom and swiping up (scrolling down): wrap to top seamlessly!
    if (dy > 0 && currentY >= max - 4) {
      window.scrollTo({ top: 4, behavior: 'instant' });
      smoothProgress = 0.0;
      exactProgress = 0.0;
      measure();
      touchStartY = currentTouchY;
    }
  }

  function update() {
    if (!isRunning) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Track idle state
    if (!manualOverride) {
      idleTime += dt;
      if (idleTime >= IDLE_THRESHOLD) {
        isIdle = true;
      }
    } else {
      idleTime = 0;
      isIdle = false;
    }

    // Exponential smoothing for buttery 60-120fps motion
    const factor = 1 - Math.exp(-damping * dt);
    smoothProgress += (exactProgress - smoothProgress) * factor;

    if (Math.abs(exactProgress - smoothProgress) < 0.0001) {
      smoothProgress = exactProgress;
    }

    // Determine current active chapter
    let currentChapter = 0;
    for (let i = 0; i < chapters.length; i++) {
      const start = i === 0 ? 0 : (chapters[i - 1].progress + chapters[i].progress) * 0.5;
      const end = i === chapters.length - 1 ? 1.01 : (chapters[i].progress + chapters[i + 1].progress) * 0.5;
      if (smoothProgress >= start && smoothProgress < end) {
        currentChapter = i;
        break;
      }
    }

    if (currentChapter !== activeChapter) {
      activeChapter = currentChapter;
      onChapterChange(activeChapter, chapters[activeChapter]);
    }

    onUpdate({
      exact: exactProgress,
      smooth: smoothProgress,
      chapterIndex: activeChapter,
      chapter: chapters[activeChapter],
      manualOverride,
      isIdle,
      idleTime,
      dt
    });

    requestAnimationFrame(update);
  }

  function scrollToProgress(targetProgress, smooth = true) {
    resetIdle();
    const max = getMaxScroll();
    const targetY = targetProgress * max;
    window.scrollTo({
      top: targetY,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  function scrollToChapter(index) {
    if (index >= 0 && index < chapters.length) {
      scrollToProgress(chapters[index].progress, true);
    }
  }

  function setManualOverride(value) {
    manualOverride = Boolean(value);
    resetIdle();
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    lastTime = performance.now();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // User activity listeners to reset idle
    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('click', resetIdle, { passive: true });

    measure();
    smoothProgress = exactProgress;
    requestAnimationFrame(update);
  }

  function destroy() {
    isRunning = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('mousemove', resetIdle);
    window.removeEventListener('keydown', resetIdle);
    window.removeEventListener('click', resetIdle);
  }

  return {
    start,
    destroy,
    scrollToChapter,
    scrollToProgress,
    setProgress: scrollToProgress,
    setManualOverride,
    resetIdle,
    isIdle: () => isIdle,
    getSmooth: () => smoothProgress,
    getExact: () => exactProgress,
    getChapter: () => activeChapter,
    chapters
  };
}
