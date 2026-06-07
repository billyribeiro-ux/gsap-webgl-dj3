<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // A real GPU simulation. Two chemicals A and B live in the RG channels of a
  // texture; each frame a shader reads every texel's neighbours (a Laplacian) and
  // applies the Gray–Scott reaction-diffusion equations, writing the result to a
  // SECOND texture. We swap them and repeat — "ping-pong" feedback, the same
  // technique fluid solvers use. The result: organic, coral-like patterns that
  // grow and divide. Drag to seed more.
  const SIZE = 256;

  const quadVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  const initFrag = /* glsl */ `
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    void main(){
      float B = 0.0;
      if (distance(vUv, vec2(0.5)) < 0.06) B = 0.9;
      if (hash(floor(vUv * 40.0)) > 0.97) B = 0.9;
      gl_FragColor = vec4(1.0, B, 0.0, 1.0); // A=1, B=seed
    }
  `;

  const simFrag = /* glsl */ `
    uniform sampler2D uPrev;
    uniform float uTexel;
    uniform vec2 uMouse;
    uniform float uDown;
    varying vec2 vUv;
    void main(){
      vec2 c = texture2D(uPrev, vUv).xy;
      vec2 lap = -c;
      lap += texture2D(uPrev, vUv + vec2(uTexel, 0.0)).xy * 0.2;
      lap += texture2D(uPrev, vUv - vec2(uTexel, 0.0)).xy * 0.2;
      lap += texture2D(uPrev, vUv + vec2(0.0, uTexel)).xy * 0.2;
      lap += texture2D(uPrev, vUv - vec2(0.0, uTexel)).xy * 0.2;
      lap += texture2D(uPrev, vUv + vec2(uTexel, uTexel)).xy * 0.05;
      lap += texture2D(uPrev, vUv + vec2(-uTexel, uTexel)).xy * 0.05;
      lap += texture2D(uPrev, vUv + vec2(uTexel, -uTexel)).xy * 0.05;
      lap += texture2D(uPrev, vUv + vec2(-uTexel, -uTexel)).xy * 0.05;

      float A = c.x, B = c.y;
      float reaction = A * B * B;
      float f = 0.055, k = 0.062;
      float nA = A + (1.0 * lap.x - reaction + f * (1.0 - A));
      float nB = B + (0.5 * lap.y + reaction - (k + f) * B);

      if (uDown > 0.5 && distance(vUv, uMouse) < 0.03) nB = 0.9;
      gl_FragColor = vec4(clamp(nA, 0.0, 1.0), clamp(nB, 0.0, 1.0), 0.0, 1.0);
    }
  `;

  const displayFrag = /* glsl */ `
    uniform sampler2D uTex;
    varying vec2 vUv;
    void main(){
      float b = texture2D(uTex, vUv).y;
      vec3 col = mix(vec3(0.02,0.025,0.05), vec3(0.486,0.360,1.0), smoothstep(0.0, 0.25, b));
      col = mix(col, vec3(0.098,0.890,0.839), smoothstep(0.25, 0.45, b));
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const sim: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(1);

    const opts: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false
    };
    let read = new THREE.WebGLRenderTarget(SIZE, SIZE, opts);
    let write = new THREE.WebGLRenderTarget(SIZE, SIZE, opts);

    const fsScene = new THREE.Scene();
    const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    fsScene.add(quad);

    const initMat = new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader: initFrag });
    const simMat = new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: simFrag,
      uniforms: { uPrev: { value: null as THREE.Texture | null }, uTexel: { value: 1 / SIZE }, uMouse: { value: new THREE.Vector2(-1, -1) }, uDown: { value: 0 } }
    });
    const dispMat = new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader: displayFrag, uniforms: { uTex: { value: null as THREE.Texture | null } } });

    // Seed the initial state.
    quad.material = initMat;
    renderer.setRenderTarget(read);
    renderer.render(fsScene, fsCam);

    let down = 0;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      simMat.uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    const onDown = () => (down = 1);
    const onUp = () => (down = 0);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);

    const resize = () => renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const tick = () => {
      // 8 simulation steps per displayed frame.
      for (let i = 0; i < 8; i++) {
        simMat.uniforms.uPrev.value = read.texture;
        simMat.uniforms.uDown.value = down;
        quad.material = simMat;
        renderer.setRenderTarget(write);
        renderer.render(fsScene, fsCam);
        const t = read; read = write; write = t;
      }
      dispMat.uniforms.uTex.value = read.texture;
      quad.material = dispMat;
      renderer.setRenderTarget(null);
      renderer.render(fsScene, fsCam);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onUp);
      read.dispose();
      write.dispose();
      initMat.dispose();
      simMat.dispose();
      dispMat.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach sim}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; cursor: crosshair; }
</style>
