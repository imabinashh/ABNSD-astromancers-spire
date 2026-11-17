// Web Audio API ambient fantasy soundscape (Zero external assets needed)

export function createSynthAudio() {
  let ctx = null;
  let isMuted = true;
  let droneGain = null;
  let osc1 = null;
  let osc2 = null;
  let filter = null;
  let lfo = null;

  function init() {
    if (ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();

    // Master drone gain
    droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.0, ctx.currentTime);
    droneGain.connect(ctx.destination);

    // Filter for warm soft atmosphere
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.connect(droneGain);

    // Warm mystical drone chord (D minor / A)
    osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(146.83, ctx.currentTime); // D3
    osc1.connect(filter);
    osc1.start();

    osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220.0, ctx.currentTime); // A3
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, ctx.currentTime);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc2.start();

    // Subtle LFO for gentle wind breathing
    lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(80, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }

  function toggle() {
    init();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    isMuted = !isMuted;
    if (droneGain) {
      droneGain.gain.setTargetAtTime(isMuted ? 0.0 : 0.12, ctx.currentTime, 0.5);
    }
    return !isMuted;
  }

  // Play charming cauldron bubble sound
  function playBubble() {
    if (isMuted || !ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const baseFreq = 400 + Math.random() * 300;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  // Play soft magic chime
  function playChime() {
    if (isMuted || !ctx) return;
    try {
      const notes = [587.33, 659.25, 783.99, 880.0, 1046.5]; // D5, E5, G5, A5, C6
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch (e) {}
  }

  return {
    toggle,
    playBubble,
    playChime,
    isMuted: () => isMuted
  };
}
