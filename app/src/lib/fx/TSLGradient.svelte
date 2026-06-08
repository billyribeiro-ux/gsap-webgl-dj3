<script lang="ts">
  // The modern Three.js path (r184+): the WebGPURenderer + TSL — Three Shading
  // Language. Instead of writing raw GLSL/WGSL strings, you compose shaders from
  // JavaScript "nodes" that Three compiles to WGSL on WebGPU (and GLSL on the
  // WebGL2 fallback) automatically. Same aurora as our hand-written shaders, but
  // authored the node way — type-checked, composable, backend-agnostic.
  import * as THREE from 'three/webgpu';
  import { Fn, uv, time, sin, mix, vec3, smoothstep } from 'three/tsl';
  import type { Attachment } from 'svelte/attachments';

  const tsl: Attachment<HTMLCanvasElement> = (canvas) => {
    let raf = 0;
    let destroyed = false;
    let renderer: THREE.WebGPURenderer | null = null;
    let cleanup = () => {};

    (async () => {
      renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
      await renderer.init(); // WebGPURenderer must initialise before first render
      if (destroyed) { renderer.dispose(); return; }

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // The entire fragment shader, as a TSL node graph:
      const colorNode = Fn(() => {
        const u = uv();
        const t = time;
        const v = sin(u.x.mul(6).add(t))
          .add(sin(u.y.mul(7).sub(t)))
          .add(sin(u.x.add(u.y).mul(5).add(t.mul(1.3))))
          .mul(0.33);
        const violet = vec3(0.486, 0.36, 1.0);
        const cyan = vec3(0.098, 0.89, 0.839);
        const pink = vec3(1.0, 0.373, 0.62);
        const base = mix(violet, cyan, smoothstep(-1, 1, v));
        return mix(base, pink, smoothstep(0.4, 1, sin(u.y.mul(3).add(t))).mul(0.6));
      })();

      const material = new THREE.MeshBasicNodeMaterial();
      material.colorNode = colorNode;
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

      const resize = () => renderer!.setSize(canvas.clientWidth, canvas.clientHeight, false);
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      const loop = () => {
        renderer!.renderAsync(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      loop();
      cleanup = () => ro.disconnect();
    })();

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      cleanup();
      renderer?.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach tsl}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; }
</style>
