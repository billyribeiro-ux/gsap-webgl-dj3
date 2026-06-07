<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // A real-time PATH TRACER. Every frame, a compute shader fires one ray per
  // pixel, bounces it through the scene sampling materials by Monte Carlo, and
  // ADDS the result into an accumulation buffer. Averaging thousands of samples
  // over a few seconds resolves true global illumination — soft shadows, colour
  // bleeding, reflections — the same algorithm as offline film renderers, live.
  // Drag to orbit (which resets the accumulation).
  const W = 512;
  const H = 320;
  const PIX = W * H;

  const computeWGSL = /* wgsl */ `
    struct U { w: u32, h: u32, frame: u32, reset: u32, yaw: f32, pitch: f32, _a: f32, _b: f32 };
    @group(0) @binding(0) var<storage, read_write> accum: array<vec4f>;
    @group(0) @binding(1) var<uniform> u: U;

    var<private> rng: u32;
    fn rand() -> f32 {
      rng = rng * 747796405u + 2891336453u;
      var w = ((rng >> ((rng >> 28u) + 4u)) ^ rng) * 277803737u;
      w = (w >> 22u) ^ w;
      return f32(w) / 4294967295.0;
    }
    fn randUnit() -> vec3f {
      let z = rand() * 2.0 - 1.0; let a = rand() * 6.2831853; let r = sqrt(max(0.0, 1.0 - z * z));
      return vec3f(r * cos(a), r * sin(a), z);
    }

    struct Sphere { c: vec3f, r: f32, albedo: vec3f, mat: f32, emit: vec3f, fuzz: f32 };
    fn scene(i: i32) -> Sphere {
      if (i == 0) { return Sphere(vec3f(0.0, -1000.5, 0.0), 1000.0, vec3f(0.5, 0.5, 0.55), 0.0, vec3f(0.0), 0.0); }
      if (i == 1) { return Sphere(vec3f(-1.1, 0.0, 0.0), 0.5, vec3f(0.9, 0.3, 0.4), 0.0, vec3f(0.0), 0.0); }
      if (i == 2) { return Sphere(vec3f(0.0, 0.0, 0.0), 0.5, vec3f(0.95, 0.95, 1.0), 1.0, vec3f(0.0), 0.04); }
      if (i == 3) { return Sphere(vec3f(1.1, 0.0, 0.0), 0.5, vec3f(0.3, 0.55, 0.95), 0.0, vec3f(0.0), 0.0); }
      return Sphere(vec3f(1.6, 2.4, 1.6), 0.7, vec3f(0.0), 2.0, vec3f(10.0, 8.5, 7.0), 0.0); // light
    }

    fn hitSphere(ro: vec3f, rd: vec3f, s: Sphere) -> f32 {
      let oc = ro - s.c;
      let b = dot(oc, rd);
      let c = dot(oc, oc) - s.r * s.r;
      let disc = b * b - c;
      if (disc < 0.0) { return -1.0; }
      let sq = sqrt(disc);
      var t = -b - sq;
      if (t < 0.001) { t = -b + sq; }
      if (t < 0.001) { return -1.0; }
      return t;
    }

    fn skyColor(rd: vec3f) -> vec3f {
      let t = 0.5 * (rd.y + 1.0);
      return mix(vec3f(0.10, 0.12, 0.16), vec3f(0.30, 0.40, 0.55), t) * 0.6;
    }

    fn trace(ro0: vec3f, rd0: vec3f) -> vec3f {
      var ro = ro0; var rd = rd0;
      var col = vec3f(0.0); var thr = vec3f(1.0);
      for (var bounce = 0; bounce < 6; bounce = bounce + 1) {
        var tBest = 1e30; var idx = -1;
        for (var i = 0; i < 5; i = i + 1) {
          let t = hitSphere(ro, rd, scene(i));
          if (t > 0.0 && t < tBest) { tBest = t; idx = i; }
        }
        if (idx < 0) { col = col + thr * skyColor(rd); break; }
        let s = scene(idx);
        let p = ro + rd * tBest;
        let nrm = normalize(p - s.c);
        col = col + thr * s.emit;
        if (s.mat < 0.5) {                                   // diffuse (Lambertian)
          rd = normalize(nrm + randUnit());
          thr = thr * s.albedo;
        } else if (s.mat < 1.5) {                            // metal
          rd = normalize(reflect(rd, nrm) + s.fuzz * randUnit());
          thr = thr * s.albedo;
          if (dot(rd, nrm) < 0.0) { break; }
        } else {                                             // emissive — stop
          break;
        }
        ro = p + nrm * 0.001;
        // Russian-roulette-ish early out on dim paths.
        let m = max(thr.r, max(thr.g, thr.b));
        if (m < 0.02) { break; }
      }
      return col;
    }

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3u) {
      let i = gid.x;
      if (i >= u.w * u.h) { return; }
      rng = i * 1973u + u.frame * 9277u + 26699u;
      rand(); rand();
      let x = f32(i % u.w); let y = f32(i / u.w);
      let aspect = f32(u.w) / f32(u.h);
      let uv = (vec2f((x + rand()) / f32(u.w), (y + rand()) / f32(u.h)) * 2.0 - 1.0) * vec2f(aspect, 1.0);

      let cy = cos(u.yaw); let sy = sin(u.yaw); let cp = cos(u.pitch); let sp = sin(u.pitch);
      let ro = vec3f(sy * cp, sp, cy * cp) * 4.6;
      let fwd = normalize(-ro);
      let right = normalize(cross(fwd, vec3f(0.0, 1.0, 0.0)));
      let up = cross(right, fwd);
      let rd = normalize(fwd * 1.5 + right * uv.x + up * uv.y);

      let radiance = trace(ro, rd);
      if (u.reset == 1u) { accum[i] = vec4f(radiance, 1.0); }
      else { accum[i] = accum[i] + vec4f(radiance, 1.0); }
    }
  `;

  const renderWGSL = /* wgsl */ `
    struct U { w: u32, h: u32, frame: u32, reset: u32, yaw: f32, pitch: f32, _a: f32, _b: f32 };
    @group(0) @binding(0) var<storage, read> accum: array<vec4f>;
    @group(0) @binding(1) var<uniform> u: U;
    struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
    @vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
      var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
      var o: VO; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * 0.5 + 0.5; return o;
    }
    @fragment fn fs(in: VO) -> @location(0) vec4f {
      let xi = min(u32(in.uv.x * f32(u.w)), u.w - 1u);
      let yi = min(u32((1.0 - in.uv.y) * f32(u.h)), u.h - 1u);
      let s = accum[yi * u.w + xi];
      var col = s.rgb / max(s.a, 1.0);
      col = col / (col + vec3f(1.0));                 // tone-map
      return vec4f(pow(col, vec3f(0.4545)), 1.0);     // gamma
    }
  `;

  function fallback(canvas: HTMLCanvasElement, msg: string): void {
    const c = canvas.getContext('2d'); if (!c) return;
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    c.fillStyle = '#05060a'; c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#8b93a7'; c.font = '14px ui-monospace, monospace'; c.textAlign = 'center';
    c.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  const pathtracer: Attachment<HTMLCanvasElement> = (canvas) => {
    let raf = 0;
    let destroyed = false;
    let device: GPUDevice | null = null;
    let cleanup = () => {};

    (async () => {
      if (!navigator.gpu) { fallback(canvas, 'WebGPU is not available in this browser.'); return; }
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) { fallback(canvas, 'No suitable GPU adapter found.'); return; }
      device = await adapter.requestDevice();
      if (destroyed) { device.destroy(); return; }
      const ctx = canvas.getContext('webgpu') as GPUCanvasContext;
      const format = navigator.gpu.getPreferredCanvasFormat();
      ctx.configure({ device, format, alphaMode: 'premultiplied' });

      const accum = device.createBuffer({ size: PIX * 16, usage: GPUBufferUsage.STORAGE });
      const uni = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

      const cPipe = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: computeWGSL }), entryPoint: 'main' } });
      const rMod = device.createShaderModule({ code: renderWGSL });
      const rPipe = device.createRenderPipeline({ layout: 'auto', vertex: { module: rMod, entryPoint: 'vs' }, fragment: { module: rMod, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });
      const cBind = device.createBindGroup({ layout: cPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: accum } }, { binding: 1, resource: { buffer: uni } }] });
      const rBind = device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: accum } }, { binding: 1, resource: { buffer: uni } }] });

      const ro = new ResizeObserver(() => {
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      });
      ro.observe(canvas);

      // Orbit by dragging; any drag resets the accumulation so it re-converges.
      let yaw = 0.6, pitch = 0.35, frame = 0, reset = 1, dragging = false, lx = 0, ly = 0;
      canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
      window.addEventListener('pointerup', () => (dragging = false));
      canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        yaw -= (e.clientX - lx) * 0.005;
        pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - ly) * 0.005));
        lx = e.clientX; ly = e.clientY; reset = 1;
      });

      const uData = new ArrayBuffer(32);
      const uU = new Uint32Array(uData);
      const uF = new Float32Array(uData);

      const frameFn = () => {
        if (destroyed || !device) return;
        if (reset === 1) frame = 0;
        frame++;
        uU[0] = W; uU[1] = H; uU[2] = frame; uU[3] = reset;
        uF[4] = yaw; uF[5] = pitch;
        device.queue.writeBuffer(uni, 0, uData);
        reset = 0;

        const enc = device.createCommandEncoder();
        const cp = enc.beginComputePass();
        cp.setPipeline(cPipe); cp.setBindGroup(0, cBind);
        cp.dispatchWorkgroups(Math.ceil(PIX / 64));
        cp.end();
        const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }] });
        rp.setPipeline(rPipe); rp.setBindGroup(0, rBind); rp.draw(3); rp.end();
        device.queue.submit([enc.finish()]);
        raf = requestAnimationFrame(frameFn);
      };
      frameFn();
      cleanup = () => ro.disconnect();
    })();

    return () => { destroyed = true; cancelAnimationFrame(raf); cleanup(); device?.destroy(); };
  };
</script>

<canvas class="viewport" {@attach pathtracer}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; cursor: grab; }
  .viewport:active { cursor: grabbing; }
</style>
