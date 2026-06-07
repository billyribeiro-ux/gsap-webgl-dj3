<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // Every Three.js scene needs the same three things: a SCENE (the world), a
  // CAMERA (your eye), and a RENDERER (which paints the scene onto a <canvas>
  // each frame). Add a mesh + lights, spin it in a render loop, and you have 3D.
  const scene: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const world = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;

    // A mesh = geometry (shape) + material (surface). MeshStandardMaterial reacts
    // to light, which is what gives it that premium, physically-lit look.
    const geometry = new THREE.IcosahedronGeometry(1.2, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x11141f,
      metalness: 0.6,
      roughness: 0.25,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    world.add(mesh);

    // Two coloured point lights are the whole "cinematic" trick — one warm-violet
    // key light, one cyan rim light, raking across the facets.
    const key = new THREE.PointLight(0x7c5cff, 80);
    key.position.set(3, 3, 4);
    const rim = new THREE.PointLight(0x19e3d6, 60);
    rim.position.set(-4, -2, 2);
    world.add(key, rim, new THREE.AmbientLight(0xffffff, 0.15));

    function resize(): void {
      const { clientWidth: w, clientHeight: h } = canvas;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // The render loop: rotate a touch, then draw. ~60 times a second.
    let raf = 0;
    const tick = (): void => {
      mesh.rotation.x += 0.004;
      mesh.rotation.y += 0.006;
      renderer.render(world, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // Cleanup: stop the loop and free every GPU resource. Skipping this leaks
    // memory across SvelteKit navigations.
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach scene}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; }
</style>
