import * as THREE from 'three';

export function createLighting(scene) {
  // Main directional light (Sun / Moon)
  const sunLight = new THREE.DirectionalLight(0xfff1db, 1.8);
  sunLight.position.set(16, 22, 12);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 110;
  sunLight.shadow.camera.left = -16;
  sunLight.shadow.camera.right = 16;
  sunLight.shadow.camera.top = 24;
  sunLight.shadow.camera.bottom = -12;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // Soft fill ambient light
  const ambientLight = new THREE.AmbientLight(0xc3b4d8, 0.9);
  scene.add(ambientLight);

  // Hemisphere light for ground bounce vs sky
  const hemiLight = new THREE.HemisphereLight(0xe4d3f5, 0x6e5246, 0.6);
  scene.add(hemiLight);

  // Cauldron magical glow
  const cauldronLight = new THREE.PointLight(0x44ff77, 2.0, 7, 1.2);
  cauldronLight.position.set(3.2, 0.8, 1.2);
  scene.add(cauldronLight);

  // Mid-window cozy amber glow
  const midWindowLight = new THREE.PointLight(0xffaa33, 1.5, 6, 1.0);
  midWindowLight.position.set(1.5, 3.8, 1.8);
  scene.add(midWindowLight);

  // Upper room warm interior light
  const upperRoomLight = new THREE.PointLight(0xffbe44, 2.2, 8, 1.0);
  upperRoomLight.position.set(0, 6.6, 0);
  scene.add(upperRoomLight);

  // Dormer window light
  const dormerLight = new THREE.PointLight(0xffc855, 1.2, 4, 1.0);
  dormerLight.position.set(0.9, 9.4, 1.1);
  scene.add(dormerLight);

  const presets = {
    sunset: {
      sunColor: 0xff9944,
      sunIntensity: 2.3,
      sunPosition: [-36.0, 16.5, -30.0],
      ambientColor: 0xd2b5d8,
      ambientIntensity: 1.05,
      hemiSky: 0xffd9c7,
      hemiGround: 0x6e4e3f,
      hemiIntensity: 0.7,
      cauldronIntensity: 2.4,
      windowIntensity: 2.2,
      fogColor: 0xc8b5d0,
      fogDensity: 0.011,
      bgTop: '#8c95ba',
      bgBottom: '#e6c8b4'
    },
    night: {
      sunColor: 0xc8ddff,
      sunIntensity: 2.2,
      sunPosition: [-28.0, 26.0, -25.0],
      ambientColor: 0x3e5288,
      ambientIntensity: 1.15,
      // Subtle blue-indigo HemisphereLight: brightens clouds & island underside silhouettes
      hemiSky: 0x627db8,
      hemiGround: 0x384a75,
      hemiIntensity: 1.1,
      cauldronIntensity: 4.8,
      windowIntensity: 4.2,
      fogColor: 0x101628,
      fogDensity: 0.007,
      bgTop: '#090d1a',
      bgBottom: '#1c2540'
    },
    day: {
      sunColor: 0xfffaea,
      sunIntensity: 2.4,
      sunPosition: [-30.0, 21.5, -28.0],
      ambientColor: 0xdbe8ff,
      ambientIntensity: 1.15,
      hemiSky: 0xd8eeff,
      hemiGround: 0x768755,
      hemiIntensity: 0.75,
      cauldronIntensity: 1.5,
      windowIntensity: 1.2,
      fogColor: 0xd4e7f8,
      fogDensity: 0.008,
      bgTop: '#7faadc',
      bgBottom: '#d8e8f8'
    }
  };

  let currentPreset = 'sunset';

  function applyPreset(presetName, duration = 0.8) {
    const p = presets[presetName] || presets.sunset;
    currentPreset = presetName;

    sunLight.color.setHex(p.sunColor);
    sunLight.intensity = p.sunIntensity;
    sunLight.position.set(...p.sunPosition);

    ambientLight.color.setHex(p.ambientColor);
    ambientLight.intensity = p.ambientIntensity;

    hemiLight.color.setHex(p.hemiSky);
    hemiLight.groundColor.setHex(p.hemiGround);
    hemiLight.intensity = p.hemiIntensity || 0.7;

    cauldronLight.intensity = p.cauldronIntensity;
    upperRoomLight.intensity = p.windowIntensity;
    midWindowLight.intensity = p.windowIntensity * 0.7;
    dormerLight.intensity = p.windowIntensity * 0.6;

    if (scene.fog) {
      scene.fog.color.setHex(p.fogColor);
      scene.fog.density = p.fogDensity;
    }

    return p;
  }

  // Update flickering window / cauldron lights
  function update(time) {
    const flicker1 = Math.sin(time * 3.5) * 0.15 + Math.cos(time * 7.1) * 0.08;
    const flicker2 = Math.sin(time * 5.2) * 0.2 + Math.cos(time * 11.0) * 0.1;
    cauldronLight.intensity = Math.max(0.8, presets[currentPreset].cauldronIntensity + flicker2);
    upperRoomLight.intensity = Math.max(0.8, presets[currentPreset].windowIntensity + flicker1);
  }

  return {
    sunLight,
    ambientLight,
    hemiLight,
    cauldronLight,
    applyPreset,
    update,
    getPreset: () => currentPreset,
    presets
  };
}
