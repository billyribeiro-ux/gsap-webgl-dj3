<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // Volumetric raymarching: instead of surfaces, we march a ray THROUGH a 3D
  // density field (fbm noise), accumulating light at every step and marching a
  // few steps toward the sun for self-shadowing. This is how clouds, smoke, fog
  // and god-rays are rendered — participating media, the cinematic frontier.
  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uMouse;
    varying vec2 vUv;

    float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float noise(vec3 x){
      vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                     mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                     mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; } return v; }

    float density(vec3 p, float t){
      float slab = 1.0 - abs(p.y) / 2.2;            // confine clouds to a horizontal band
      if (slab <= 0.0) return 0.0;
      float n = fbm(p * 0.6 + vec3(t * 0.12, 0.0, t * 0.05));
      return clamp((n - 0.52) * slab * 2.2, 0.0, 1.0);
    }

    mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }

    void main(){
      vec2 uv = (vUv - 0.5); uv.x *= uAspect;
      mat3 rot = rotY(uTime * 0.04 + (uMouse.x - 0.5) * 2.5);
      vec3 ro = rot * vec3(0.0, 0.0, 6.0);
      vec3 rd = rot * normalize(vec3(uv, -1.5));

      vec3 sun = normalize(vec3(0.7, 0.5, -0.4));
      vec3 col = mix(vec3(0.03, 0.04, 0.08), vec3(0.10, 0.14, 0.24), vUv.y); // sky
      col += pow(max(dot(rd, sun), 0.0), 64.0) * vec3(1.0, 0.85, 0.6);        // sun glow

      float t = 1.5;
      float transmittance = 1.0;
      vec3 scattered = vec3(0.0);
      for (int i = 0; i < 60; i++){
        vec3 p = ro + rd * t;
        float d = density(p, uTime);
        if (d > 0.01){
          float shadow = 1.0;
          for (int j = 1; j <= 5; j++){
            float ld = density(p + sun * float(j) * 0.22, uTime);
            shadow *= exp(-ld * 0.22 * 5.0);
          }
          float absorb = exp(-d * 0.25 * 4.0);
          vec3 light = vec3(1.0, 0.92, 0.78) * shadow * 2.4 + vec3(0.25, 0.35, 0.55) * 0.5;
          scattered += transmittance * (1.0 - absorb) * light;
          transmittance *= absorb;
          if (transmittance < 0.02) break;
        }
        t += 0.18;
        if (t > 16.0) break;
      }
      col = col * transmittance + scattered;
      col = col / (col + vec3(1.0));      // tone-map
      gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0); // gamma
    }
  `;

  const volumetric: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // volumetrics are fill-heavy
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = { uTime: { value: 0 }, uAspect: { value: 1 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) } };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    canvas.addEventListener('pointermove', onMove);
    const ro = new ResizeObserver(() => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      uniforms.uAspect.value = canvas.clientWidth / canvas.clientHeight;
    });
    ro.observe(canvas);

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
      canvas.removeEventListener('pointermove', onMove);
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach volumetric}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; cursor: grab; }
</style>
