<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // A shader is a tiny program that runs on the GPU once per pixel, every frame.
  // The fragment shader below computes a flowing aurora purely from the pixel's
  // position (vUv) and a time uniform — no textures, no geometry detail. This is
  // where the most jaw-dropping web visuals come from.
  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.35;
      // Layered sine waves = organic, flowing interference pattern.
      float v = sin(uv.x * 6.0 + t)
              + sin(uv.y * 7.0 - t)
              + sin((uv.x + uv.y) * 5.0 + t * 1.3);
      v *= 0.33;
      vec3 violet = vec3(0.486, 0.360, 1.0);
      vec3 cyan   = vec3(0.098, 0.890, 0.839);
      vec3 pink   = vec3(1.0, 0.373, 0.620);
      vec3 col = mix(violet, cyan, smoothstep(-1.0, 1.0, v));
      col = mix(col, pink, smoothstep(0.4, 1.0, sin(uv.y * 3.0 + t)) * 0.6);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const sketch: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    // An orthographic camera + a 2×2 plane perfectly fills the clip space.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const resize = () => renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach sketch}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; }
</style>
