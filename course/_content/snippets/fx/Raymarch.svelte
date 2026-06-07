<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // Raymarching renders 3D from a single fragment shader — no geometry, no mesh.
  // The whole scene is a "signed distance function" (SDF): given a point, it
  // returns the distance to the nearest surface. We shoot a ray per pixel and
  // step along it by that distance until we hit something. Smooth-union the
  // shapes and they melt together like liquid metal.
  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uMouse;
    varying vec2 vUv;

    float sdSphere(vec3 p, float r){ return length(p) - r; }
    float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
    // polynomial smooth-min: blends two surfaces into one continuous skin
    float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }

    float map(vec3 p){
      float d = sdSphere(p - vec3(sin(uTime)*0.9, 0.0, 0.0), 0.62);
      d = smin(d, sdSphere(p - vec3(-sin(uTime*1.1)*0.9, cos(uTime*0.7)*0.7, 0.0), 0.52), 0.45);
      d = smin(d, sdSphere(p - vec3(0.0, sin(uTime*0.9)*0.9, cos(uTime)*0.6), 0.42), 0.45);
      d = smin(d, sdTorus(p, vec2(1.25, 0.22)), 0.55);
      return d;
    }
    vec3 calcNormal(vec3 p){
      vec2 e = vec2(0.0012, 0.0);
      return normalize(vec3(
        map(p+e.xyy) - map(p-e.xyy),
        map(p+e.yxy) - map(p-e.yxy),
        map(p+e.yyx) - map(p-e.yyx)));
    }
    mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
    mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,-s, 0.,s,c); }

    void main(){
      vec2 uv = (vUv - 0.5); uv.x *= uAspect;
      mat3 rot = rotY(uTime*0.2 + (uMouse.x-0.5)*3.0) * rotX((uMouse.y-0.5)*1.4);
      vec3 ro = rot * vec3(0.0, 0.0, 4.2);
      vec3 rd = rot * normalize(vec3(uv, -1.6));

      float t = 0.0; vec3 p; float d = 1.0;
      for (int i = 0; i < 90; i++){
        p = ro + rd * t;
        d = map(p);
        if (d < 0.001 || t > 20.0) break;
        t += d;
      }

      vec3 col = vec3(0.02, 0.025, 0.04);
      if (t < 20.0){
        vec3 n = calcNormal(p);
        vec3 L = normalize(vec3(0.7, 0.9, 0.5));
        float diff = max(dot(n, L), 0.0);
        float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 40.0);
        float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
        vec3 base = mix(vec3(0.486,0.360,1.0), vec3(0.098,0.890,0.839), n.y*0.5 + 0.5);
        col = base * (0.15 + diff) + spec * 0.9 + fres * vec3(0.098,0.890,0.839) * 0.7;
      }
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const raymarch: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); // raymarching is fill-heavy
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

<canvas class="viewport" {@attach raymarch}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; cursor: grab; }
</style>
