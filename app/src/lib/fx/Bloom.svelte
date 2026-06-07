<script lang="ts">
  import * as THREE from 'three';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import type { Attachment } from 'svelte/attachments';

  // Postprocessing is what makes 3D look like a movie. We render the scene, then
  // push it through a chain of full-screen passes: UnrealBloom makes bright
  // pixels glow, and a custom shader adds chromatic aberration at the edges. This
  // is the "EffectComposer" pipeline every cinematic Three.js site uses.
  const ChromaticAberration = {
    uniforms: { tDiffuse: { value: null as THREE.Texture | null }, uAmount: { value: 0.004 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uAmount;
      varying vec2 vUv;
      void main() {
        vec2 dir = vUv - 0.5;
        float offset = uAmount * length(dir) * 2.0;        // stronger toward the edges
        vec2 n = normalize(dir + 1e-5);
        float r = texture2D(tDiffuse, vUv + n * offset).r;
        float g = texture2D(tDiffuse, vUv).g;
        float b = texture2D(tDiffuse, vUv - n * offset).b;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `
  };

  const pipeline: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    // A dark object with a bright EMISSIVE color — bloom only blooms bright pixels.
    const geo = new THREE.TorusKnotGeometry(1, 0.3, 160, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x05060a,
      emissive: new THREE.Color('#7c5cff'),
      emissiveIntensity: 2.2,
      metalness: 0.5,
      roughness: 0.3
    });
    const knot = new THREE.Mesh(geo, mat);
    scene.add(knot);
    scene.add(new THREE.PointLight(0x19e3d6, 40, 0, 1.6).translateX(4).translateY(3));

    // ── The composer chain ──────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.15, 0.5, 0.0);
    composer.addPass(bloom);

    const chroma = new ShaderPass(ChromaticAberration);
    composer.addPass(chroma); // final pass → renders to the canvas

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom.setSize(w, h);
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
      knot.rotation.x = t * 0.3;
      knot.rotation.y = t * 0.4;
      mat.emissiveIntensity = 2.0 + Math.sin(t * 2.0) * 0.6; // gentle pulse
      composer.render(); // NOT renderer.render — the composer drives the chain
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      composer.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach pipeline}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; background: #05060a; border-radius: 12px; }
</style>
