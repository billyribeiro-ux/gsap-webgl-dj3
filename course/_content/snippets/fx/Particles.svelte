<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // A GPU particle system: every point stores TWO positions (a sphere and a
  // torus knot). The vertex shader mixes between them by a single `uMorph`
  // uniform, so morphing 6,000 particles costs almost nothing — the GPU does it
  // all in parallel. Additive blending gives the glowing, nebula-like look.
  const COUNT = 6000;

  function spherePoint(i: number, n: number): THREE.Vector3 {
    // Fibonacci sphere → evenly distributed points, no clustering at the poles.
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ).multiplyScalar(1.4);
  }

  function knotPoint(i: number, n: number): THREE.Vector3 {
    const t = (i / n) * Math.PI * 2 * 3;
    const r = 0.9 + 0.4 * Math.cos(2 * t);
    return new THREE.Vector3(
      r * Math.cos(3 * t),
      r * Math.sin(3 * t),
      0.5 * Math.sin(5 * t)
    ).multiplyScalar(1.0);
  }

  const cloud: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 4.2;

    const aA = new Float32Array(COUNT * 3);
    const aB = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const violet = new THREE.Color('#7c5cff');
    const cyan = new THREE.Color('#19e3d6');
    for (let i = 0; i < COUNT; i++) {
      const a = spherePoint(i, COUNT);
      const b = knotPoint(i, COUNT);
      aA.set([a.x, a.y, a.z], i * 3);
      aB.set([b.x, b.y, b.z], i * 3);
      const c = violet.clone().lerp(cyan, (a.y + 1.4) / 2.8);
      col.set([c.r, c.g, c.b], i * 3);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(aA, 3)); // required by three
    geo.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
    geo.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));

    const uniforms = { uMorph: { value: 0 } };
    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aA;
        attribute vec3 aB;
        attribute vec3 aColor;
        uniform float uMorph;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec3 pos = mix(aA, aB, uMorph);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 7.0 * (1.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;          // round points
          gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d));
        }
      `
    });

    const points = new THREE.Points(geo, material);
    scene.add(points);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
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
      const t = clock.getElapsedTime();
      uniforms.uMorph.value = 0.5 + 0.5 * Math.sin(t * 0.6); // breathe between shapes
      points.rotation.y = t * 0.25;
      points.rotation.z = t * 0.08;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach cloud}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; }
</style>
