<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // A real-time fluid solver — Jos Stam's "stable fluids" — running entirely in
  // WebGPU compute passes. Each frame: advect velocity, add forces, make the
  // field divergence-free with a Jacobi pressure solve, then advect coloured dye
  // through it. This is the algorithm behind every gorgeous "ink in water" hero.
  const N = 160;            // grid resolution
  const CELLS = N * N;
  const ITER = 20;          // pressure Jacobi iterations

  // Shared WGSL header: uniforms + indexing + bilinear samplers are pasted into
  // each pass (every pass binds its own buffers, so the samplers read those).
  const HEAD = /* wgsl */ `
    struct U { n: u32, dt: f32, mx: f32, my: f32, mdx: f32, mdy: f32, mdown: f32, _p: f32 };
    fn ix(x: i32, y: i32, n: i32) -> u32 { return u32(clamp(y, 0, n - 1) * n + clamp(x, 0, n - 1)); }
  `;
  const pass = (bindings: string, body: string) => HEAD + bindings + `\n@compute @workgroup_size(64)\nfn main(@builtin(global_invocation_id) gid: vec3u) {\n  let i = gid.x; if (i >= u.n * u.n) { return; }\n  let n = i32(u.n); let x = i32(i) % n; let y = i32(i) / n;\n  let pos = vec2f(f32(x) + 0.5, f32(y) + 0.5);\n` + body + `\n}`;

  const advectVelWGSL = pass(
    `@group(0) @binding(0) var<storage, read> fin: array<vec2f>;
     @group(0) @binding(1) var<storage, read_write> fout: array<vec2f>;
     @group(0) @binding(2) var<uniform> u: U;
     fn bil(p: vec2f) -> vec2f { let nn = f32(u.n); let cx = clamp(p.x, 0.5, nn - 0.5) - 0.5; let cy = clamp(p.y, 0.5, nn - 0.5) - 0.5; let x0 = i32(floor(cx)); let y0 = i32(floor(cy)); let fx = cx - f32(x0); let fy = cy - f32(y0); let n = i32(u.n); let a = fin[ix(x0,y0,n)]; let b = fin[ix(x0+1,y0,n)]; let c = fin[ix(x0,y0+1,n)]; let d = fin[ix(x0+1,y0+1,n)]; return mix(mix(a,b,fx), mix(c,d,fx), fy); }`,
    `let src = pos - fin[i] * u.dt; fout[i] = bil(src) * 0.999;`
  );

  const splatVelWGSL = pass(
    `@group(0) @binding(0) var<storage, read> fin: array<vec2f>;
     @group(0) @binding(1) var<storage, read_write> fout: array<vec2f>;
     @group(0) @binding(2) var<uniform> u: U;`,
    `var v = fin[i]; if (u.mdown > 0.5) { let d = pos - vec2f(u.mx, u.my); let g = exp(-dot(d, d) / 60.0); v = v + vec2f(u.mdx, u.mdy) * g; } fout[i] = v;`
  );

  const divergeWGSL = pass(
    `@group(0) @binding(0) var<storage, read> vel: array<vec2f>;
     @group(0) @binding(1) var<storage, read_write> divOut: array<f32>;
     @group(0) @binding(2) var<uniform> u: U;`,
    `let l = vel[ix(x-1,y,n)].x; let r = vel[ix(x+1,y,n)].x; let b = vel[ix(x,y-1,n)].y; let t = vel[ix(x,y+1,n)].y; divOut[i] = 0.5 * ((r - l) + (t - b));`
  );

  const jacobiWGSL = pass(
    `@group(0) @binding(0) var<storage, read> pin: array<f32>;
     @group(0) @binding(1) var<storage, read> divIn: array<f32>;
     @group(0) @binding(2) var<storage, read_write> pout: array<f32>;
     @group(0) @binding(3) var<uniform> u: U;`,
    `let l = pin[ix(x-1,y,n)]; let r = pin[ix(x+1,y,n)]; let b = pin[ix(x,y-1,n)]; let t = pin[ix(x,y+1,n)]; pout[i] = (l + r + b + t - divIn[i]) * 0.25;`
  );

  const gradSubWGSL = pass(
    `@group(0) @binding(0) var<storage, read> vin: array<vec2f>;
     @group(0) @binding(1) var<storage, read> pin: array<f32>;
     @group(0) @binding(2) var<storage, read_write> vout: array<vec2f>;
     @group(0) @binding(3) var<uniform> u: U;`,
    `let l = pin[ix(x-1,y,n)]; let r = pin[ix(x+1,y,n)]; let b = pin[ix(x,y-1,n)]; let t = pin[ix(x,y+1,n)]; vout[i] = vin[i] - vec2f(r - l, t - b) * 0.5;`
  );

  const advectDyeWGSL = pass(
    `@group(0) @binding(0) var<storage, read> din: array<vec4f>;
     @group(0) @binding(1) var<storage, read> vel: array<vec2f>;
     @group(0) @binding(2) var<storage, read_write> dout: array<vec4f>;
     @group(0) @binding(3) var<uniform> u: U;
     fn bil(p: vec2f) -> vec4f { let nn = f32(u.n); let cx = clamp(p.x, 0.5, nn - 0.5) - 0.5; let cy = clamp(p.y, 0.5, nn - 0.5) - 0.5; let x0 = i32(floor(cx)); let y0 = i32(floor(cy)); let fx = cx - f32(x0); let fy = cy - f32(y0); let n = i32(u.n); let a = din[ix(x0,y0,n)]; let b = din[ix(x0+1,y0,n)]; let c = din[ix(x0,y0+1,n)]; let d = din[ix(x0+1,y0+1,n)]; return mix(mix(a,b,fx), mix(c,d,fx), fy); }`,
    `let src = pos - vel[i] * u.dt; dout[i] = bil(src) * 0.99;`
  );

  const splatDyeWGSL = pass(
    `@group(0) @binding(0) var<storage, read> din: array<vec4f>;
     @group(0) @binding(1) var<storage, read_write> dout: array<vec4f>;
     @group(0) @binding(2) var<uniform> u: U;`,
    `var c = din[i]; if (u.mdown > 0.5) { let d = pos - vec2f(u.mx, u.my); let g = exp(-dot(d, d) / 40.0); let hue = vec3f(0.5 + 0.5 * sin(u._p), 0.6, 1.0); c = c + vec4f(hue * g, g); } dout[i] = clamp(c, vec4f(0.0), vec4f(3.0));`
  );

  const renderWGSL = /* wgsl */ `
    struct U { n: u32, dt: f32, mx: f32, my: f32, mdx: f32, mdy: f32, mdown: f32, _p: f32 };
    @group(0) @binding(0) var<storage, read> dye: array<vec4f>;
    @group(0) @binding(1) var<uniform> u: U;
    struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
    @vertex fn vs(@builtin(vertex_index) i: u32) -> VO { var p = array<vec2f,3>(vec2f(-1.0,-1.0), vec2f(3.0,-1.0), vec2f(-1.0,3.0)); var o: VO; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * 0.5 + 0.5; return o; }
    @fragment fn fs(in: VO) -> @location(0) vec4f {
      let xi = min(u32(in.uv.x * f32(u.n)), u.n - 1u);
      let yi = min(u32((1.0 - in.uv.y) * f32(u.n)), u.n - 1u);
      let c = dye[yi * u.n + xi].rgb;
      return vec4f(c / (c + vec3f(1.0)), 1.0); // Reinhard tone-map
    }
  `;

  function fallback(canvas: HTMLCanvasElement, msg: string): void {
    const c = canvas.getContext('2d'); if (!c) return;
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    c.fillStyle = '#05060a'; c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#8b93a7'; c.font = '14px ui-monospace, monospace'; c.textAlign = 'center';
    c.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  const fluid: Attachment<HTMLCanvasElement> = (canvas) => {
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

      const SBR = GPUBufferUsage.STORAGE; // all fields start zeroed (WebGPU guarantees)
      const vel = [device.createBuffer({ size: CELLS * 8, usage: SBR }), device.createBuffer({ size: CELLS * 8, usage: SBR })];
      const dye = [device.createBuffer({ size: CELLS * 16, usage: SBR }), device.createBuffer({ size: CELLS * 16, usage: SBR })];
      const prs = [device.createBuffer({ size: CELLS * 4, usage: SBR }), device.createBuffer({ size: CELLS * 4, usage: SBR })];
      const div = device.createBuffer({ size: CELLS * 4, usage: SBR });
      const uni = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

      const comp = (code: string) => device!.createComputePipeline({ layout: 'auto', compute: { module: device!.createShaderModule({ code }), entryPoint: 'main' } });
      const pAdvV = comp(advectVelWGSL), pSplV = comp(splatVelWGSL), pDiv = comp(divergeWGSL), pJac = comp(jacobiWGSL), pGrad = comp(gradSubWGSL), pAdvD = comp(advectDyeWGSL), pSplD = comp(splatDyeWGSL);
      const rMod = device.createShaderModule({ code: renderWGSL });
      const rPipe = device.createRenderPipeline({ layout: 'auto', vertex: { module: rMod, entryPoint: 'vs' }, fragment: { module: rMod, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });

      const bg = (pipe: GPUComputePipeline | GPURenderPipeline, bufs: GPUBuffer[]) =>
        device!.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: bufs.map((b, n) => ({ binding: n, resource: { buffer: b } })) });
      const run = (enc: GPUCommandEncoder, pipe: GPUComputePipeline, bufs: GPUBuffer[]) => {
        const p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, bg(pipe, bufs)); p.dispatchWorkgroups(Math.ceil(CELLS / 64)); p.end();
      };

      const resize = () => { const dpr = Math.min(window.devicePixelRatio, 2); canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr)); canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr)); };
      const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

      let down = 0, mx = N / 2, my = N / 2, pmx = N / 2, pmy = N / 2;
      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width) * N;
        my = (1 - (e.clientY - r.top) / r.height) * N;
        down = 1;
      };
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerleave', () => (down = 0));

      const uniData = new ArrayBuffer(32);
      const uF = new Float32Array(uniData);
      const uU = new Uint32Array(uniData);
      let vp = 0, dp = 0;
      const start = performance.now();

      const frame = () => {
        if (destroyed || !device) return;
        const time = (performance.now() - start) / 1000;
        // Auto-emitter when the user isn't dragging, so the demo is always alive.
        let umx = mx, umy = my, umdx = (mx - pmx), umdy = (my - pmy), udown = down;
        if (down === 0) {
          umx = N / 2 + Math.cos(time * 0.7) * N * 0.28;
          umy = N / 2 + Math.sin(time * 1.1) * N * 0.28;
          umdx = -Math.sin(time * 0.7) * 1.4;
          umdy = Math.cos(time * 1.1) * 1.4;
          udown = 1;
        }
        pmx = mx; pmy = my;
        uU[0] = N; uF[1] = 0.6; uF[2] = umx; uF[3] = umy; uF[4] = umdx; uF[5] = umdy; uF[6] = udown; uF[7] = time;
        device.queue.writeBuffer(uni, 0, uniData);

        const enc = device.createCommandEncoder();
        run(enc, pAdvV, [vel[vp], vel[1 - vp], uni]); vp = 1 - vp;
        run(enc, pSplV, [vel[vp], vel[1 - vp], uni]); vp = 1 - vp;
        run(enc, pDiv, [vel[vp], div, uni]);
        for (let k = 0; k < ITER; k++) { run(enc, pJac, [prs[0], div, prs[1], uni]); const t = prs[0]; prs[0] = prs[1]; prs[1] = t; }
        run(enc, pGrad, [vel[vp], prs[0], vel[1 - vp], uni]); vp = 1 - vp;
        run(enc, pAdvD, [dye[dp], vel[vp], dye[1 - dp], uni]); dp = 1 - dp;
        run(enc, pSplD, [dye[dp], dye[1 - dp], uni]); dp = 1 - dp;
        const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.01, g: 0.01, b: 0.02, a: 1 } }] });
        rp.setPipeline(rPipe); rp.setBindGroup(0, bg(rPipe, [dye[dp], uni])); rp.draw(3); rp.end();
        device.queue.submit([enc.finish()]);
        raf = requestAnimationFrame(frame);
      };
      frame();
      cleanup = () => { ro.disconnect(); canvas.removeEventListener('pointermove', onMove); };
    })();

    return () => { destroyed = true; cancelAnimationFrame(raf); cleanup(); device?.destroy(); };
  };
</script>

<canvas class="viewport" {@attach fluid}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; cursor: crosshair; }
</style>
