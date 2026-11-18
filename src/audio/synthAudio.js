// Web Audio API pure crystal chime soundscape (Zero external assets, zero muddy hum)

export function createSynthAudio() {
  let ctx = null;
  let isMuted = true;
  let ambientTimer = null;

  function init() {
    if (ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();
  }

  // Play crisp, delicate "ling-tingl" crystalline glass chime (for UI clicks & interactions)
  function playTinkle(index = -1) {
    init();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    try {
      const now = ctx.currentTime;
      // High-register celestial pentatonic chime scale (D6 to D7)
      const scale = [1174.66, 1318.51, 1567.98, 1760.00, 2093.00, 2349.32];
      const freq = index >= 0 && index < scale.length ? scale[index] : scale[Math.floor(Math.random() * scale.length)];

      // 1. Primary fundamental crystal tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.09, now + 0.003); // ultra-crisp ping
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // 2. Harmonic overtone (2.76x physical bell shimmer) with slight micro-delay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.756, now + 0.008);

      gain2.gain.setValueAtTime(0.0001, now + 0.008);
      gain2.gain.linearRampToValueAtTime(0.038, now + 0.012);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.008);
      osc2.stop(now + 0.4);
    } catch (e) {}
  }

  // Play charming cauldron bubble sound
  function playBubble() {
    init();
    if (isMuted || !ctx) return;
    try {
      const now = ctx.currentTime;
      const baseFreq = 420 + Math.random() * 260;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.14);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  // Ambient gentle stardust chimes (airs softly when sound is active, ZERO hum/drone)
  function scheduleAmbientChime() {
    if (ambientTimer) clearTimeout(ambientTimer);
    if (isMuted) return;

    // Random interval between 2.8s and 5.5s
    const nextDelay = 2800 + Math.random() * 2700;
    ambientTimer = setTimeout(() => {
      if (!isMuted && ctx) {
        try {
          const now = ctx.currentTime;
          const ambientNotes = [880.0, 987.77, 1174.66, 1318.51, 1567.98, 1760.0];
          const freq = ambientNotes[Math.floor(Math.random() * ambientNotes.length)];

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.035, now + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.25);
        } catch (e) {}
      }
      if (!isMuted) {
        scheduleAmbientChime();
      }
    }, nextDelay);
  }

  function toggle() {
    init();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    isMuted = !isMuted;
    if (!isMuted) {
      playTinkle(3);
      scheduleAmbientChime();
    } else {
      if (ambientTimer) {
        clearTimeout(ambientTimer);
        ambientTimer = null;
      }
    }
    return !isMuted;
  }

  return {
    toggle,
    playTinkle,
    playChime: playTinkle,
    playBubble,
    isMuted: () => isMuted
  };
}
