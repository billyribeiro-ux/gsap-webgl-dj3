<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // Metaballs: each "ball" contributes an inverse-square field to every pixel;
  // where the summed field crosses a threshold, we draw liquid. Because they
  // share one continuous field, blobs merge and split like mercury. All per-pixel
  // on the GPU — and your cursor is just another ball.
  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uMouse;
    uniform float uMouseOn;
    varying vec2 vUv;

    void main(){
      vec2 uv = vUv;
      float field = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 c = vec2(0.5) + vec2(cos(uTime*0.6 + fi*1.7), sin(uTime*0.8 + fi*2.3)) * 0.32;
        float r = 0.07 + 0.02 * sin(uTime + fi);
        vec2 d = uv - c; d.x *= uAspect;        // correct for non-square canvas
        field += (r*r) / dot(d, d);
      }
      vec2 dm = uv - uMouse; dm.x *= uAspect;
      field += uMouseOn * 0.012 / (dot(dm, dm) + 0.0002);

      float m = smoothstep(0.95, 1.08, field);                  // the liquid surface
      vec3 inner = mix(vec3(0.486,0.360,1.0), vec3(0.098,0.890,0.839), clamp(field*0.25, 0.0, 1.0));
      vec3 col = mix(vec3(0.02,0.025,0.04), inner, m);

      float rim = smoothstep(0.86,0.97,field) * (1.0 - smoothstep(1.04,1.18,field)); // glowing edge
      col += rim * vec3(0.35,0.6,1.0) * 0.6;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const metaballs: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseOn: { value: 0 }
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let targetMouseOn = 0;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerenter', () => (targetMouseOn = 1));
    canvas.addEventListener('pointerleave', () => (targetMouseOn = 0));

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      uniforms.uAspect.value = canvas.clientWidth / canvas.clientHeight;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uMouseOn.value += (targetMouseOn - uniforms.uMouseOn.value) * 0.1;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach metaballs}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; cursor: crosshair; }
</style>
