import * as THREE from 'three';
import gsap from 'gsap';

// ============================================================================
// Atmospheric Ethereal Sky Rainbow
// Pure light shader rendered on a single large PlaneGeometry in the distant sky.
// Smooth spectral gradient, organic feathering, horizon mist fade, and additive blending.
// ============================================================================
export function createRainbow(scene) {
  const planeWidth = 140.0;
  const planeHeight = 45.0;
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);

  const uniforms = {
    uOpacity: { value: 0.28 },
    uAspect: { value: planeWidth / planeHeight },
    uArcCenter: { value: new THREE.Vector2(0.5, -0.15) },
    uRadiusInner: { value: 0.74 },
    uRadiusOuter: { value: 0.92 },
    uTime: { value: 0.0 }
  };

  const vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uOpacity;
    uniform float uAspect;
    uniform vec2 uArcCenter;
    uniform float uRadiusInner;
    uniform float uRadiusOuter;
    uniform float uTime;

    varying vec2 vUv;

    // Continuous 7-step optical spectrum (Violet -> Blue -> Cyan -> Green -> Yellow -> Orange -> Red)
    // Zero hard bands or polygon facets via continuous smoothstep interpolation
    vec3 getSpectralColor(float t) {
      vec3 cViolet = vec3(0.52, 0.22, 0.86);
      vec3 cBlue   = vec3(0.12, 0.38, 0.96);
      vec3 cCyan   = vec3(0.08, 0.82, 0.88);
      vec3 cGreen  = vec3(0.18, 0.90, 0.32);
      vec3 cYellow = vec3(0.98, 0.86, 0.12);
      vec3 cOrange = vec3(0.98, 0.48, 0.08);
      vec3 cRed    = vec3(0.96, 0.16, 0.14);

      float s = clamp(t, 0.0, 1.0) * 6.0;
      if (s < 1.0) {
        return mix(cViolet, cBlue, smoothstep(0.0, 1.0, s));
      } else if (s < 2.0) {
        return mix(cBlue, cCyan, smoothstep(1.0, 2.0, s));
      } else if (s < 3.0) {
        return mix(cCyan, cGreen, smoothstep(2.0, 3.0, s));
      } else if (s < 4.0) {
        return mix(cGreen, cYellow, smoothstep(3.0, 4.0, s));
      } else if (s < 5.0) {
        return mix(cYellow, cOrange, smoothstep(4.0, 5.0, s));
      } else {
        return mix(cOrange, cRed, smoothstep(5.0, 6.0, s));
      }
    }

    void main() {
      if (uOpacity <= 0.001) {
        discard;
      }

      // 1. Radial distance from arc center point (vec2(0.5, -0.15))
      vec2 p = vUv - uArcCenter;
      p.x *= uAspect;
      float dist = length(p);

      // 2. Smooth feathering on both inner and outer edges of the arc
      float feather = 0.038;
      float edgeInner = smoothstep(uRadiusInner - feather, uRadiusInner + feather, dist);
      float edgeOuter = smoothstep(uRadiusOuter + feather, uRadiusOuter - feather, dist);
      float bandIntensity = edgeInner * edgeOuter;

      // 3. Smooth continuous spectrum mapping (Violet at inner, Red at outer)
      float t = clamp((dist - uRadiusInner) / (uRadiusOuter - uRadiusInner), 0.0, 1.0);
      vec3 spectrum = getSpectralColor(t);

      // 4. Vertical horizon fade: dissolve gradually into sunset mist (smoothstep(0.05, 0.35, vUv.y))
      float horizonFade = smoothstep(0.05, 0.35, vUv.y);

      // 5. Plane boundary feathering (avoid hard geometry edges at top or sides)
      float topFade = smoothstep(1.0, 0.88, vUv.y);
      float edgeFadeX = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);

      float totalAlpha = bandIntensity * horizonFade * topFade * edgeFadeX * uOpacity;

      if (totalAlpha < 0.001) {
        discard;
      }

      gl_FragColor = vec4(spectrum, totalAlpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphericRainbow';

  // Position far behind the floating islands across the horizon
  mesh.position.set(2.0, 7.5, -46.0);
  // Orient to face the front-facing archipelago camera angle
  mesh.lookAt(10.0, 7.5, 32.5);

  scene.add(mesh);

  let fadeTween = null;
  let currentTheme = 'sunset';

  // Synchronize with atmosphere state (Sunset: 0.28, Day: 0.24, Night: 0.0)
  function setTheme(theme, duration = 1.2) {
    currentTheme = theme;

    let targetOpacity = 0.0;
    if (theme === 'sunset') {
      targetOpacity = 0.28;
    } else if (theme === 'day') {
      targetOpacity = 0.24;
    } else {
      // Night: completely faded out
      targetOpacity = 0.0;
    }

    if (targetOpacity > 0.0) {
      mesh.visible = true;
    }

    if (duration <= 0) {
      if (fadeTween) fadeTween.kill();
      uniforms.uOpacity.value = targetOpacity;
      if (targetOpacity <= 0.0) {
        mesh.visible = false;
      }
      return;
    }

    if (fadeTween) fadeTween.kill();
    fadeTween = gsap.to(uniforms.uOpacity, {
      value: targetOpacity,
      duration,
      ease: "power2.inOut",
      onComplete: () => {
        if (targetOpacity <= 0.001) {
          mesh.visible = false;
        }
      }
    });
  }

  function update(dt, time) {
    uniforms.uTime.value = time;
  }

  return {
    mesh,
    material,
    setTheme,
    update
  };
}
