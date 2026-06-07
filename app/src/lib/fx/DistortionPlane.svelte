<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // The signature "premium agency" effect: a full-bleed shader that bends toward
  // the cursor like liquid glass, with chromatic aberration that intensifies on
  // hover. It's a lens distortion + RGB split, all per-pixel on the GPU.
  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    // A flowing aurora — the surface we then distort and split.
    vec3 field(vec2 uv, float t) {
      float v = sin(uv.x * 6.0 + t) + sin(uv.y * 7.0 - t) + sin((uv.x + uv.y) * 5.0 + t * 1.3);
      v *= 0.33;
      vec3 violet = vec3(0.486, 0.360, 1.0);
      vec3 cyan = vec3(0.098, 0.890, 0.839);
      vec3 pink = vec3(1.0, 0.373, 0.620);
      vec3 c = mix(violet, cyan, smoothstep(-1.0, 1.0, v));
      return mix(c, pink, smoothstep(0.4, 1.0, sin(uv.y * 3.0 + t)) * 0.6);
    }

    void main() {
      vec2 uv = vUv;
      float d = distance(uv, uMouse);
      float infl = smoothstep(0.5, 0.0, d) * uHover;   // 1 at cursor → 0 at edge

      // Lens: pull the surface toward the cursor; Ripple: rings radiating out.
      uv -= (uv - uMouse) * infl * 0.32;
      uv += normalize(uv - uMouse + 1e-4) * sin(d * 38.0 - uTime * 5.0) * 0.012 * infl;

      // Chromatic aberration grows with hover influence.
      float ab = 0.014 * infl + 0.002;
      vec3 col;
      col.r = field(uv + vec2(ab, 0.0), uTime).r;
      col.g = field(uv, uTime).g;
      col.b = field(uv - vec2(ab, 0.0), uTime).b;

      // A soft highlight where the cursor lifts the surface.
      col += infl * 0.12;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const distortion: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 }
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let targetHover = 0;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    const onEnter = () => (targetHover = 1);
    const onLeave = () => (targetHover = 0);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);

    const resize = () => renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      // Ease hover toward its target so it ramps in/out smoothly.
      uniforms.uHover.value += (targetHover - uniforms.uHover.value) * 0.08;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach distortion}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; cursor: crosshair; }
</style>
