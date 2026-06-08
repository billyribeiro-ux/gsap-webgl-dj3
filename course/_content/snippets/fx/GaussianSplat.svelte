<script lang="ts">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import type { Attachment } from 'svelte/attachments';

  // 3D Gaussian Splatting — the 2023 breakthrough in real-time photoreal rendering.
  // A scene is represented not by triangles but by thousands of anisotropic 3D
  // Gaussians (little fuzzy ellipsoids). To draw one, we project its 3D covariance
  // into a 2D screen-space ellipse (EWA splatting) and rasterize a soft billboard.
  // Here we splat a torus-knot surface; production fits Gaussians to photographs.
  const SPLATS = 14000;

  const splatting: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 5.2);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;

    // Generate splats hugging a torus-knot surface, each an ellipsoid stretched
    // along the tube (the three principal axes are stored, already scaled).
    const center = new Float32Array(SPLATS * 3);
    const color = new Float32Array(SPLATS * 3);
    const ax0 = new Float32Array(SPLATS * 3);
    const ax1 = new Float32Array(SPLATS * 3);
    const ax2 = new Float32Array(SPLATS * 3);
    const violet = new THREE.Color('#7c5cff');
    const cyan = new THREE.Color('#19e3d6');
    const pink = new THREE.Color('#ff5f9e');

    const knot = (t: number) => {
      const r = 0.9 + 0.4 * Math.cos(2 * t);
      return new THREE.Vector3(r * Math.cos(3 * t), r * Math.sin(3 * t), 0.5 * Math.sin(5 * t));
    };
    for (let i = 0; i < SPLATS; i++) {
      const t = (i / SPLATS) * Math.PI * 2;
      const p = knot(t);
      const p2 = knot(t + 0.002);
      const tangent = p2.clone().sub(p).normalize();
      let nrm = new THREE.Vector3(0, 1, 0).cross(tangent);
      if (nrm.lengthSq() < 1e-4) nrm = new THREE.Vector3(1, 0, 0).cross(tangent);
      nrm.normalize();
      const bnm = tangent.clone().cross(nrm).normalize();
      const theta = Math.random() * Math.PI * 2;
      const tubeR = 0.16 + Math.random() * 0.05;
      const offset = nrm.clone().multiplyScalar(Math.cos(theta) * tubeR).add(bnm.clone().multiplyScalar(Math.sin(theta) * tubeR));
      const c = p.clone().add(offset);
      center.set([c.x, c.y, c.z], i * 3);
      const col = violet.clone().lerp(cyan, (Math.sin(3 * t) + 1) / 2).lerp(pink, Math.abs(Math.cos(2 * t)) * 0.4);
      color.set([col.r, col.g, col.b], i * 3);
      // Anisotropic axes: long along the tube, smaller across.
      ax0.set([tangent.x * 0.07, tangent.y * 0.07, tangent.z * 0.07], i * 3);
      ax1.set([nrm.x * 0.035, nrm.y * 0.035, nrm.z * 0.035], i * 3);
      ax2.set([bnm.x * 0.035, bnm.y * 0.035, bnm.z * 0.035], i * 3);
    }

    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.attributes.position = base.attributes.position;
    geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(center, 3));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(color, 3));
    geo.setAttribute('aAxis0', new THREE.InstancedBufferAttribute(ax0, 3));
    geo.setAttribute('aAxis1', new THREE.InstancedBufferAttribute(ax1, 3));
    geo.setAttribute('aAxis2', new THREE.InstancedBufferAttribute(ax2, 3));
    geo.instanceCount = SPLATS;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uModel: { value: new THREE.Matrix4() } },
      vertexShader: /* glsl */ `
        attribute vec3 aCenter;
        attribute vec3 aColor;
        attribute vec3 aAxis0;
        attribute vec3 aAxis1;
        attribute vec3 aAxis2;
        uniform mat4 uModel;
        varying vec2 vG;
        varying vec3 vColor;

        // Project a world point to NDC (xy) given the current MVP.
        vec2 toNDC(vec3 wp, out float w) {
          vec4 clip = projectionMatrix * viewMatrix * uModel * vec4(wp, 1.0);
          w = clip.w;
          return clip.xy / clip.w;
        }
        void main() {
          float w0;
          vec2 c0 = toNDC(aCenter, w0);
          float wj;
          // Finite-difference EWA: project each scaled axis to screen, sum outer products.
          vec2 s0 = toNDC(aCenter + aAxis0, wj) - c0;
          vec2 s1 = toNDC(aCenter + aAxis1, wj) - c0;
          vec2 s2 = toNDC(aCenter + aAxis2, wj) - c0;
          float a = s0.x*s0.x + s1.x*s1.x + s2.x*s2.x;
          float b = s0.x*s0.y + s1.x*s1.y + s2.x*s2.y;
          float d = s0.y*s0.y + s1.y*s1.y + s2.y*s2.y;
          // Eigen-decompose the 2x2 [[a,b],[b,d]] → screen-space ellipse axes.
          float tr = a + d; float det = a*d - b*b;
          float disc = sqrt(max(tr*tr*0.25 - det, 0.0));
          float l1 = tr*0.5 + disc; float l2 = max(tr*0.5 - disc, 0.0);
          vec2 e1;
          if (abs(b) < 1e-7) { e1 = (a >= d) ? vec2(1.0,0.0) : vec2(0.0,1.0); }
          else { e1 = normalize(vec2(b, l1 - a)); }
          vec2 e2 = vec2(-e1.y, e1.x);
          vec2 major = e1 * sqrt(l1);
          vec2 minor = e2 * sqrt(l2);

          vec2 corner = position.xy * 2.0;        // plane is [-0.5,0.5] → [-1,1]
          float SIG = 2.6;
          vec2 offset = corner.x * major * SIG + corner.y * minor * SIG;
          vG = corner * SIG;
          vColor = aColor;
          gl_Position = vec4((c0 + offset) * w0, 0.0, w0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vG;
        varying vec3 vColor;
        void main() {
          float alpha = exp(-0.5 * dot(vG, vG));   // the Gaussian
          if (alpha < 0.004) discard;
          gl_FragColor = vec4(vColor * alpha, alpha);
        }
      `
    });

    const mesh = new THREE.Mesh(geo, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
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
      mesh.rotation.y = t * 0.25;
      mesh.rotation.x = Math.sin(t * 0.2) * 0.3;
      mesh.updateMatrixWorld();
      material.uniforms.uModel.value.copy(mesh.matrixWorld);
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      base.dispose();
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach splatting}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; cursor: grab; }
  .viewport:active { cursor: grabbing; }
</style>
