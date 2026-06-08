<script lang="ts">
  import * as THREE from 'three';
  import type { Attachment } from 'svelte/attachments';

  // The à-trous edge-aware denoiser — the trick that makes real-time ray tracing
  // possible. A 1-sample path trace is pure noise; this filter blurs it while
  // refusing to cross edges, guided by per-pixel normals & object IDs. We render
  // a deliberately-noisy analytic scene, then run a few wavelet passes. Drag the
  // divider to compare noisy (left) vs denoised (right).
  const SCENE = /* glsl */ `
    vec3 RO = vec3(0.0, 1.2, 4.0);
    void hit(vec3 ro, vec3 rd, out float t, out vec3 n, out float id, out vec3 alb) {
      t = 1e9; id = -1.0; n = vec3(0.0); alb = vec3(0.0);
      // ground plane y = 0
      if (rd.y < -0.0001) { float tp = -ro.y / rd.y; if (tp > 0.001 && tp < t) { t = tp; vec3 p = ro + rd*tp; n = vec3(0.0,1.0,0.0); id = 0.0; alb = vec3(0.45) + 0.1*mod(floor(p.x)+floor(p.z),2.0); } }
      vec4 sp[3]; sp[0]=vec4(-1.0,0.5,0.0,0.5); sp[1]=vec4(0.0,0.5,0.0,0.5); sp[2]=vec4(1.0,0.5,0.0,0.5);
      vec3 cols[3]; cols[0]=vec3(0.9,0.3,0.4); cols[1]=vec3(0.95,0.95,1.0); cols[2]=vec3(0.3,0.55,0.95);
      for (int i = 0; i < 3; i++) {
        vec3 oc = ro - sp[i].xyz; float b = dot(oc, rd); float c = dot(oc,oc) - sp[i].w*sp[i].w;
        float disc = b*b - c; if (disc < 0.0) continue; float ts = -b - sqrt(disc);
        if (ts > 0.001 && ts < t) { t = ts; vec3 p = ro + rd*ts; n = normalize(p - sp[i].xyz); id = float(i+1); alb = cols[i]; }
      }
    }
    vec3 shadeClean(vec2 uv, float aspect) {
      vec3 rd = normalize(vec3((uv*2.0-1.0)*vec2(aspect,1.0), -1.6));
      float t; vec3 n; float id; vec3 alb; hit(RO, rd, t, n, id, alb);
      if (id < 0.0) return mix(vec3(0.06,0.08,0.13), vec3(0.20,0.30,0.45), uv.y);
      vec3 L = normalize(vec3(0.6,0.85,0.35)); vec3 p = RO + rd*t;
      float ts; vec3 sn; float sid; vec3 sa; hit(p + n*0.002, L, ts, sn, sid, sa);
      float sh = (sid >= 0.0) ? 0.3 : 1.0;
      float diff = max(dot(n, L), 0.0);
      return alb * (0.18 + diff * sh) + pow(max(dot(reflect(rd,n), L),0.0), 32.0) * 0.4;
    }
    vec4 guide(vec2 uv, float aspect) {
      vec3 rd = normalize(vec3((uv*2.0-1.0)*vec2(aspect,1.0), -1.6));
      float t; vec3 n; float id; vec3 alb; hit(RO, rd, t, n, id, alb);
      return vec4(n, id);
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  `;

  const denoiser: Attachment<HTMLCanvasElement> = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(1);
    const fsScene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    fsScene.add(quad);
    const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

    const noiseMat = new THREE.ShaderMaterial({
      uniforms: { uFrame: { value: 0 }, uAspect: { value: 1 } },
      vertexShader: vert,
      fragmentShader: `varying vec2 vUv; uniform float uFrame; uniform float uAspect;` + SCENE +
        `void main(){ vec3 c = shadeClean(vUv, uAspect); float r = hash(vUv*711.0 + uFrame); c *= 0.3 + 1.4*r; gl_FragColor = vec4(c, 1.0); }`
    });
    const atrousMat = new THREE.ShaderMaterial({
      uniforms: { uInput: { value: null as THREE.Texture | null }, uStep: { value: 1 }, uTexel: { value: new THREE.Vector2() }, uAspect: { value: 1 } },
      vertexShader: vert,
      fragmentShader: `varying vec2 vUv; uniform sampler2D uInput; uniform float uStep; uniform vec2 uTexel; uniform float uAspect;` + SCENE +
        `void main(){
          vec3 cC = texture2D(uInput, vUv).rgb; vec4 gC = guide(vUv, uAspect);
          vec3 sum = vec3(0.0); float wsum = 0.0;
          for (int y=-1; y<=1; y++) for (int x=-1; x<=1; x++) {
            vec2 off = vec2(float(x), float(y)) * uStep * uTexel;
            vec3 cN = texture2D(uInput, vUv + off).rgb; vec4 gN = guide(vUv + off, uAspect);
            float wN = pow(max(dot(gC.xyz, gN.xyz), 0.0), 32.0);
            float wId = (abs(gC.w - gN.w) < 0.5) ? 1.0 : 0.05;
            float wC = exp(-distance(cC, cN) * 4.0);
            float k = (x==0&&y==0) ? 1.0 : 0.5;
            float w = k * wN * wId * wC;
            sum += cN * w; wsum += w;
          }
          gl_FragColor = vec4(sum / max(wsum, 1e-4), 1.0);
        }`
    });
    const showMat = new THREE.ShaderMaterial({
      uniforms: { uNoisy: { value: null as THREE.Texture | null }, uClean: { value: null as THREE.Texture | null }, uSplit: { value: 0.5 } },
      vertexShader: vert,
      fragmentShader: `varying vec2 vUv; uniform sampler2D uNoisy; uniform sampler2D uClean; uniform float uSplit;
        void main(){ vec3 c = vUv.x < uSplit ? texture2D(uNoisy, vUv).rgb : texture2D(uClean, vUv).rgb;
          c = pow(c, vec3(0.4545));
          if (abs(vUv.x - uSplit) < 0.0015) c = vec3(1.0);
          gl_FragColor = vec4(c, 1.0); }`
    });

    const opts: THREE.RenderTargetOptions = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
    let noisy = new THREE.WebGLRenderTarget(2, 2, opts);
    let rtA = new THREE.WebGLRenderTarget(2, 2, opts);
    let rtB = new THREE.WebGLRenderTarget(2, 2, opts);

    const resize = () => {
      const w = Math.max(2, Math.floor(canvas.clientWidth));
      const h = Math.max(2, Math.floor(canvas.clientHeight));
      renderer.setSize(w, h, false);
      noisy.setSize(w, h); rtA.setSize(w, h); rtB.setSize(w, h);
      const a = w / h;
      noiseMat.uniforms.uAspect.value = a; atrousMat.uniforms.uAspect.value = a;
      atrousMat.uniforms.uTexel.value.set(1 / w, 1 / h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let split = 0.5;
    const onMove = (e: PointerEvent) => {
      if (e.buttons === 0) return;
      const r = canvas.getBoundingClientRect();
      split = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);

    const ITER = 5;
    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame++;
      // 1. render a noisy frame
      noiseMat.uniforms.uFrame.value = frame;
      quad.material = noiseMat;
      renderer.setRenderTarget(noisy);
      renderer.render(fsScene, cam);
      // 2. à-trous denoise passes (step doubles each time)
      let read = noisy;
      for (let k = 0; k < ITER; k++) {
        const write = k % 2 === 0 ? rtA : rtB;
        atrousMat.uniforms.uInput.value = read.texture;
        atrousMat.uniforms.uStep.value = Math.pow(2, k);
        quad.material = atrousMat;
        renderer.setRenderTarget(write);
        renderer.render(fsScene, cam);
        read = write;
      }
      // 3. show noisy | denoised wipe
      showMat.uniforms.uNoisy.value = noisy.texture;
      showMat.uniforms.uClean.value = read.texture;
      showMat.uniforms.uSplit.value = split;
      quad.material = showMat;
      renderer.setRenderTarget(null);
      renderer.render(fsScene, cam);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      noisy.dispose(); rtA.dispose(); rtB.dispose();
      noiseMat.dispose(); atrousMat.dispose(); showMat.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    };
  };
</script>

<canvas class="viewport" {@attach denoiser}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; cursor: ew-resize; }
</style>
