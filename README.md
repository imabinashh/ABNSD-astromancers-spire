# ✦ Astromancer's Spire — Low-Poly 3D Scrollytelling Experience

A whimsical, interactive 3D website built with **Three.js** and **Vite**, inspired by a stylized low-poly fantasy wizard tower on a floating island.

---

## ✨ Features

- **Procedural Low-Poly 3D Modeling:**
  - Whimsical curved/crooked wizard hat roof with faceted polygonal tiles.
  - Half-timber Tudor upper study with dark oak cross braces and glowing lantern windows.
  - Heavy ashlar stone tower body with individual protruding 3D accent blocks.
  - Arched stone portal with wooden door and iron knocker.
  - Floating island with grassy top and faceted jagged rock stalactite beneath.
  - Alchemist's cauldron with glowing green potion and bubbling particles.
  - Clustered pine grove, red toadstools, flagstone walkway, and brass astronomical telescope.
- **Cinematic Scroll Choreography:**
  - **Overview Framing:** Initial view framed through a dreamy opening in the clouds, showing the entire sanctuary.
  - **Ascent:** Smooth flight upward past the walls toward the wizard spire, chimney puffs, and stargazing telescope.
  - **Descent:** Vertical downward sweep examining the Tudor timber room, stone masonry, and ground level threshold.
  - **Pullback Reveal:** Pulls back and away into the clouds, smoothly revealing the entire floating island in all its glory.
- **Atmosphere Switcher:**
  - 🌅 **Sunset** (matching the soft peach/lavender reference image)
  - 🌙 **Midnight** (deep indigo sky with stars and glowing windows)
  - ☀️ **Daylight** (fresh azure sky and crisp sunlight)
- **Mobile & Touch Optimized:**
  - Adaptive vertical FOV calculation that automatically adjusts on portrait mobile screens so the island and tower fit without cropping.
  - Native `touch-action: pan-y` support for responsive, buttery-smooth mobile swipe scrolling.
  - Compact, responsive UI controls.
- **Free 360° Orbit Mode:**
  - Toggle between the guided scroll journey and free OrbitControls at any time.
- **Procedural Soundscape:**
  - Ambient Web Audio synthesizer with gentle fantasy wind chord and cauldron bubble sounds (zero external audio file dependencies).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 🛠️ Tech Stack
- [Three.js](https://threejs.org/) — 3D WebGL Scene, procedural geometry, lighting, and camera interpolation
- [Vite](https://vite.dev/) — Fast frontend tooling and dev server
- HTML5 / CSS3 — Glassmorphism HUD and responsive layout
- Web Audio API — Procedural atmospheric drone and interactive sound effects
