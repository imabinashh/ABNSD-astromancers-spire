// Scroll Conductor: deterministic, smooth-damped scroll state manager
// Provides exact (immediate) and smooth (lerped) scroll progress [0..1]

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
    measure();
  }

  function update() {
    if (!isRunning) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

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
      manualOverride
    });

    requestAnimationFrame(update);
  }

  function scrollToProgress(targetProgress, smooth = true) {
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
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    lastTime = performance.now();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    measure();
    smoothProgress = exactProgress;
    requestAnimationFrame(update);
  }

  function destroy() {
    isRunning = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
  }

  return {
    start,
    destroy,
    scrollToChapter,
    scrollToProgress,
    setManualOverride,
    getSmooth: () => smoothProgress,
    getExact: () => exactProgress,
    getChapter: () => activeChapter,
    chapters
  };
}
