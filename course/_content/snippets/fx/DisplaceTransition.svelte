<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // The WebGL "melt" transition: two scenes (here, two procedural gradients —
  // in production, two images) dissolve into each other along a NOISE-distorted
  // wipe, with chromatic aberration glowing along the moving seam. Click to flip.
  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uProgress;
    varying vec2 vUv;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    vec3 sceneA(vec2 uv){
      float v = sin(uv.x*6.0 + uTime) + sin(uv.y*7.0 - uTime) + sin((uv.x+uv.y)*5.0 + uTime*1.3);
      return mix(vec3(0.486,0.360,1.0), vec3(0.098,0.890,0.839), smoothstep(-1.0,1.0,v*0.33));
    }
    vec3 sceneB(vec2 uv){
      float v = sin(uv.y*8.0 - uTime*1.1) + cos(uv.x*5.0 + uTime*0.8);
      return mix(vec3(1.0,0.373,0.620), vec3(1.0,0.70,0.20), smoothstep(-1.0,1.0,v*0.5));
    }

    void main(){
      float n = noise(vUv * 4.0 + uTime * 0.08);
      float fieldY = vUv.y + (n - 0.5) * 0.6;       // the noisy boundary line
      float thr = mix(-0.35, 1.35, uProgress);       // sweeps across as progress runs
      float edge = 1.0 - smoothstep(0.0, 0.16, abs(fieldY - thr));
      float ab = 0.03 * edge;                        // chromatic split only at the seam

      vec2 uv = vUv + (n - 0.5) * 0.07 * edge;       // pull pixels around near the seam
      vec3 a = sceneA(uv);
      vec3 b = sceneB(uv);

      float m  = smoothstep(thr - 0.12, thr + 0.12, fieldY);
      float mr = smoothstep(thr - 0.12, thr + 0.12, fieldY + ab);
      float mb = smoothstep(thr - 0.12, thr + 0.12, fieldY - ab);
      vec3 col = vec3(mix(b.r, a.r, mr), mix(b.g, a.g, m), mix(b.b, a.b, mb));
      col += edge * 0.18;                            // a bright molten seam
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const transition: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = { uTime: { value: 0 }, uProgress: { value: 0 } };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let target = 0;
    const flip = () => (target = target === 0 ? 1 : 0);
    canvas.addEventListener('click', flip);
    const auto = setInterval(flip, 3200); // also flips on its own

    const ro = new ResizeObserver(() => renderer.setSize(canvas.clientWidth, canvas.clientHeight, false));
    ro.observe(canvas);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uProgress.value += (target - uniforms.uProgress.value) * 0.045; // slow melt
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(auto);
      ro.disconnect();
      canvas.removeEventListener('click', flip);
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach transition}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; cursor: pointer; }
</style>
