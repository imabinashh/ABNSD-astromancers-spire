import * as THREE from 'three';

// Procedural Micro-Texture Generator for Handcrafted Low-Poly Surfaces
// Creates lightweight offscreen <canvas> textures providing tactile clay/paper-craft grain
// without compromising the clean low-poly aesthetic or loading heavy image files.

export function createProceduralNoiseTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Simple deterministic 2D value noise for seamless tiling
  function pseudoNoise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return n - Math.floor(n);
  }

  function smoothNoise(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    // Cubic hermite curve
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    const n00 = pseudoNoise(i % size, j % size);
    const n10 = pseudoNoise((i + 1) % size, j % size);
    const n01 = pseudoNoise(i % size, (j + 1) % size);
    const n11 = pseudoNoise((i + 1) % size, (j + 1) % size);

    const nx0 = n00 * (1 - ux) + n10 * ux;
    const nx1 = n01 * (1 - ux) + n11 * ux;
    return nx0 * (1 - uy) + nx1 * uy;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Layer 1: Broad paper / clay grain fibers
      const n1 = smoothNoise(x * 0.08, y * 0.08);
      // Layer 2: Medium tactile bump
      const n2 = smoothNoise(x * 0.22, y * 0.22);
      // Layer 3: Micro surface tooth / speckle
      const n3 = (Math.random() - 0.5) * 0.25;

      // Tactile matte clay / paper-craft finish:
      // High baseline (0.90) so roughness stays matte (0.78 - 0.98) without specular shine,
      // while subtle variations create authentic micro-relief for bumpMap.
      const val = 0.90 + (n1 * 0.4 + n2 * 0.35 + n3 - 0.38) * 0.20;
      const clamped = Math.max(0, Math.min(255, Math.floor(val * 255)));

      data[idx] = clamped;     // R
      data[idx + 1] = clamped; // G
      data[idx + 2] = clamped; // B
      data[idx + 3] = 255;     // A
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // Scalar maps (roughness, bump) remain in NoColorSpace (linear)
  texture.colorSpace = THREE.NoColorSpace;

  return texture;
}
