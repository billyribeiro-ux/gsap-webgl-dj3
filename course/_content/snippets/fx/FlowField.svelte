<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // GPGPU particles: we store 16,384 particle POSITIONS in a texture and advance
  // them on the GPU. A simulation shader reads each position, looks up a velocity
  // from a flow field, and writes the new position to a second texture
  // (ping-pong). Then a Points cloud reads those positions in its vertex shader.
  // The CPU never touches a single particle — this scales to millions.
  const TEX = 128; // 128×128 = 16,384 particles
  const COUNT = TEX * TEX;

  const quadVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  const simFrag = /* glsl */ `
    uniform sampler2D uPos;
    uniform float uTime;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    // A smooth, swirling, near-divergence-free flow (a cheap stand-in for curl noise).
    vec3 flow(vec3 p){
      return vec3(
        sin(p.y*1.5 + uTime*0.5) + cos(p.z*1.2),
        sin(p.z*1.3 + uTime*0.4) + cos(p.x*1.1),
        sin(p.x*1.4 + uTime*0.3) + cos(p.y*1.0)) * 0.5;
    }
    void main(){
      vec3 pos = texture2D(uPos, vUv).xyz;
      pos += flow(pos) * 0.016;
      if (length(pos) > 3.6) {                 // respawn particles that drift away
        pos = (vec3(hash(vUv + uTime), hash(vUv + uTime + 1.7), hash(vUv + uTime + 3.1)) - 0.5) * 3.0;
      }
      gl_FragColor = vec4(pos, 1.0);
    }
  `;

  const flowfield: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 6;

    // Initial positions, packed into a float texture we copy onto the sim target.
    const init = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      init[i * 4 + 0] = (Math.random() - 0.5) * 3;
      init[i * 4 + 1] = (Math.random() - 0.5) * 3;
      init[i * 4 + 2] = (Math.random() - 0.5) * 3;
      init[i * 4 + 3] = 1;
    }
    const initTex = new THREE.DataTexture(init, TEX, TEX, THREE.RGBAFormat, THREE.FloatType);
    initTex.needsUpdate = true;

    const rtOpts: THREE.RenderTargetOptions = { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
    let read = new THREE.WebGLRenderTarget(TEX, TEX, rtOpts);
    let write = new THREE.WebGLRenderTarget(TEX, TEX, rtOpts);

    const fsScene = new THREE.Scene();
    const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    fsScene.add(fsQuad);

    const copyMat = new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: `uniform sampler2D uPos; varying vec2 vUv; void main(){ gl_FragColor = texture2D(uPos, vUv); }`,
      uniforms: { uPos: { value: initTex } }
    });
    const simMat = new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader: simFrag, uniforms: { uPos: { value: null as THREE.Texture | null }, uTime: { value: 0 } } });

    // Seed `read` with the initial positions.
    fsQuad.material = copyMat;
    renderer.setRenderTarget(read);
    renderer.render(fsScene, fsCam);

    // The render cloud: one vertex per particle, each pointing at a texel via aRef.
    const refs = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      refs[i * 2 + 0] = ((i % TEX) + 0.5) / TEX;
      refs[i * 2 + 1] = (Math.floor(i / TEX) + 0.5) / TEX;
    }
    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    cloudGeo.setAttribute('aRef', new THREE.BufferAttribute(refs, 2));
    const cloudMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uPos: { value: null as THREE.Texture | null } },
      vertexShader: /* glsl */ `
        uniform sampler2D uPos;
        attribute vec2 aRef;
        varying vec3 vColor;
        void main(){
          vec3 pos = texture2D(uPos, aRef).xyz;
          vColor = mix(vec3(0.486,0.360,1.0), vec3(0.098,0.890,0.839), pos.y * 0.25 + 0.5);
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 2.4 * (1.0 / -mv.z) * 60.0;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `varying vec3 vColor; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * 0.7); }`
    });
    const cloud = new THREE.Points(cloudGeo, cloudMat);
    scene.add(cloud);

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
      // 1. advance the simulation (ping-pong)
      simMat.uniforms.uPos.value = read.texture;
      simMat.uniforms.uTime.value = clock.getElapsedTime();
      fsQuad.material = simMat;
      renderer.setRenderTarget(write);
      renderer.render(fsScene, fsCam);
      const t = read; read = write; write = t;

      // 2. draw the cloud from the latest positions
      cloudMat.uniforms.uPos.value = read.texture;
      cloud.rotation.y = clock.getElapsedTime() * 0.1;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      read.dispose();
      write.dispose();
      initTex.dispose();
      copyMat.dispose();
      simMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      fsQuad.geometry.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach flowfield}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; }
</style>
