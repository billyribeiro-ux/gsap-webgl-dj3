<script lang="ts">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import type { Attachment } from 'svelte/attachments';

  // A spectral ocean. Real water isn't one wave — it's a whole *spectrum* of them.
  // We synthesize the surface from ~28 Gerstner waves whose amplitudes and
  // directions are drawn from an oceanographic (Phillips-like) spectrum — the same
  // statistical model an FFT ocean evaluates for thousands of waves at once. The
  // sum displaces a fine mesh, and a physically-flavoured shader adds fresnel sky
  // reflection, sun glints and foam. Drag to look around.
  const WAVES = 28;

  const ocean: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
    camera.position.set(0, 14, 34);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = 1.45;
    controls.enablePan = false;

    // Build the spectrum on the CPU: shorter waves carry less energy, and energy
    // concentrates along the wind direction — the heart of the Phillips spectrum.
    const waveA: THREE.Vector4[] = []; // (dir.x, dir.z, k, amplitude)
    const waveB: THREE.Vector4[] = []; // (omega, steepness, 0, 0)
    const windAngle = 0.5;
    for (let i = 0; i < WAVES; i++) {
      const wavelength = 32 * Math.pow(0.8, i);
      const k = (2 * Math.PI) / wavelength;
      const angle = windAngle + (Math.random() - 0.5) * 1.5;
      const align = Math.pow(Math.max(0, Math.cos(angle - windAngle)), 2);
      const amp = 0.16 * Math.sqrt(wavelength) * (0.4 + 0.6 * align);
      const omega = Math.sqrt(9.81 * k);
      const steep = 0.7 / (k * amp * WAVES * 0.5 + 1.0);
      waveA.push(new THREE.Vector4(Math.cos(angle), Math.sin(angle), k, amp));
      waveB.push(new THREE.Vector4(omega, steep, 0, 0));
    }

    const uniforms = {
      uTime: { value: 0 },
      uWaveA: { value: waveA },
      uWaveB: { value: waveB },
      uCam: { value: camera.position }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec4 uWaveA[${WAVES}];
        uniform vec4 uWaveB[${WAVES}];
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vFoam;

        vec3 gerstner(vec2 p, out float crest) {
          vec3 d = vec3(0.0);
          crest = 0.0;
          for (int i = 0; i < ${WAVES}; i++) {
            vec4 a = uWaveA[i]; vec4 b = uWaveB[i];
            float f = a.z * dot(a.xy, p) - b.x * uTime;
            float c = cos(f); float s = sin(f);
            d.x += b.y * a.w * a.x * c;
            d.z += b.y * a.w * a.y * c;
            d.y += a.w * s;
            crest += b.y * a.z * a.w * s;   // steepness × slope → foam where waves pinch
          }
          return d;
        }
        void main() {
          vec2 xz = position.xz;
          float e = 0.4; float t;
          vec3 d0 = gerstner(xz, t);
          float foamN = t;
          vec3 dX = gerstner(xz + vec2(e, 0.0), t);
          vec3 dZ = gerstner(xz + vec2(0.0, e), t);
          vec3 P0 = vec3(xz.x, 0.0, xz.y) + d0;
          vec3 PX = vec3(xz.x + e, 0.0, xz.y) + dX;
          vec3 PZ = vec3(xz.x, 0.0, xz.y + e) + dZ;
          vNormal = normalize(cross(PZ - P0, PX - P0));
          vWorld = P0;
          vFoam = smoothstep(0.6, 1.4, foamN);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(P0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uCam;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vFoam;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(uCam - vWorld);
          vec3 sun = normalize(vec3(0.6, 0.55, -0.4));
          float fres = mix(0.02, 1.0, pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 5.0));
          vec3 refl = reflect(-V, N);
          vec3 sky = mix(vec3(0.55, 0.72, 0.92), vec3(0.18, 0.34, 0.55), clamp(refl.y, 0.0, 1.0));
          vec3 deep = mix(vec3(0.0, 0.10, 0.16), vec3(0.0, 0.22, 0.32), clamp(N.y, 0.0, 1.0));
          vec3 col = mix(deep, sky, fres);
          vec3 H = normalize(V + sun);
          col += pow(max(dot(N, H), 0.0), 220.0) * vec3(1.0, 0.95, 0.8) * 1.6;  // sun glint
          col = mix(col, vec3(0.9, 0.95, 1.0), vFoam * 0.8);                     // foam
          // distance haze
          float haze = 1.0 - exp(-length(uCam - vWorld) * 0.012);
          col = mix(col, vec3(0.62, 0.78, 0.92), haze * 0.6);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const geo = new THREE.PlaneGeometry(120, 120, 220, 220);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    scene.add(mesh);

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach ocean}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: linear-gradient(#bcdcf0, #6ba8d6); cursor: grab; }
  .viewport:active { cursor: grabbing; }
</style>
