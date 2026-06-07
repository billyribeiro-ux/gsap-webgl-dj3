<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // Conway's Game of Life as a GPU cellular automaton. The grid lives in a
  // storage buffer; a compute shader reads each cell's 8 neighbours and applies
  // the B3/S23 rule, writing to a second buffer (ping-pong). A fragment shader
  // samples the buffer to draw it. Drag to paint living cells.
  const W = 260;
  const H = 180;
  const CELLS = W * H;

  const computeWGSL = /* wgsl */ `
    struct U { w: u32, h: u32 };
    @group(0) @binding(0) var<storage, read> inG: array<u32>;
    @group(0) @binding(1) var<storage, read_write> outG: array<u32>;
    @group(0) @binding(2) var<uniform> u: U;
    fn at(x: i32, y: i32, w: i32, h: i32) -> u32 {
      let xx = (x + w) % w;
      let yy = (y + h) % h;
      return inG[u32(yy * w + xx)];
    }
    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3u) {
      let i = gid.x;
      if (i >= u.w * u.h) { return; }
      let w = i32(u.w); let h = i32(u.h);
      let x = i32(i) % w; let y = i32(i) / w;
      var n = 0u;
      for (var dy = -1; dy <= 1; dy = dy + 1) {
        for (var dx = -1; dx <= 1; dx = dx + 1) {
          if (dx == 0 && dy == 0) { continue; }
          n = n + at(x + dx, y + dy, w, h);
        }
      }
      let alive = inG[i];
      var next = 0u;
      if (alive == 1u) { if (n == 2u || n == 3u) { next = 1u; } } else { if (n == 3u) { next = 1u; } }
      outG[i] = next;
    }
  `;

  const renderWGSL = /* wgsl */ `
    struct U { w: u32, h: u32 };
    @group(0) @binding(0) var<storage, read> g: array<u32>;
    @group(0) @binding(1) var<uniform> u: U;
    struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
    @vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
      var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
      var o: VO; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * 0.5 + 0.5; return o;
    }
    @fragment fn fs(in: VO) -> @location(0) vec4f {
      let xi = min(u32(in.uv.x * f32(u.w)), u.w - 1u);
      let yi = min(u32((1.0 - in.uv.y) * f32(u.h)), u.h - 1u);
      if (g[yi * u.w + xi] == 0u) { return vec4f(0.02, 0.025, 0.04, 1.0); }
      return vec4f(mix(vec3f(0.486, 0.360, 1.0), vec3f(0.098, 0.890, 0.839), in.uv.y), 1.0);
    }
  `;

  function fallback(canvas: HTMLCanvasElement, msg: string): void {
    const c = canvas.getContext('2d'); if (!c) return;
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    c.fillStyle = '#05060a'; c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#8b93a7'; c.font = '14px ui-monospace, monospace'; c.textAlign = 'center';
    c.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  const life: Attachment<HTMLCanvasElement> = (canvas) => {
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

      const seed = new Uint32Array(CELLS);
      for (let i = 0; i < CELLS; i++) seed[i] = Math.random() < 0.22 ? 1 : 0;
      const makeBuf = (init?: Uint32Array) => {
        const b = device!.createBuffer({ size: CELLS * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, mappedAtCreation: !!init });
        if (init) { new Uint32Array(b.getMappedRange()).set(init); b.unmap(); }
        return b;
      };
      const buf = [makeBuf(seed), makeBuf()];

      const uni = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      device.queue.writeBuffer(uni, 0, new Uint32Array([W, H, 0, 0]));

      const cMod = device.createShaderModule({ code: computeWGSL });
      const rMod = device.createShaderModule({ code: renderWGSL });
      const cPipe = device.createComputePipeline({ layout: 'auto', compute: { module: cMod, entryPoint: 'main' } });
      const rPipe = device.createRenderPipeline({ layout: 'auto', vertex: { module: rMod, entryPoint: 'vs' }, fragment: { module: rMod, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });

      const cBind = [
        device.createBindGroup({ layout: cPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf[0] } }, { binding: 1, resource: { buffer: buf[1] } }, { binding: 2, resource: { buffer: uni } }] }),
        device.createBindGroup({ layout: cPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf[1] } }, { binding: 1, resource: { buffer: buf[0] } }, { binding: 2, resource: { buffer: uni } }] })
      ];
      const rBind = [
        device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf[0] } }, { binding: 1, resource: { buffer: uni } }] }),
        device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf[1] } }, { binding: 1, resource: { buffer: uni } }] })
      ];

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      // Paint living cells by dragging.
      let latest = 0;
      let drawing = false;
      const paint = (e: PointerEvent) => {
        if (!drawing || !device) return;
        const r = canvas.getBoundingClientRect();
        const cx = Math.floor(((e.clientX - r.left) / r.width) * W);
        const cy = Math.floor(((e.clientY - r.top) / r.height) * H);
        const one = new Uint32Array([1]);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx, y = cy + dy;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          device.queue.writeBuffer(buf[latest], (y * W + x) * 4, one);
        }
      };
      canvas.addEventListener('pointerdown', (e) => { drawing = true; paint(e); });
      window.addEventListener('pointerup', () => (drawing = false));
      canvas.addEventListener('pointermove', paint);

      let tick = 0;
      const frame = () => {
        if (destroyed || !device) return;
        // Step the simulation every 3rd frame so it's watchable.
        if (tick % 3 === 0) {
          const enc = device.createCommandEncoder();
          const cp = enc.beginComputePass();
          cp.setPipeline(cPipe);
          cp.setBindGroup(0, cBind[latest]);
          cp.dispatchWorkgroups(Math.ceil(CELLS / 64));
          cp.end();
          device.queue.submit([enc.finish()]);
          latest = 1 - latest;
        }
        const enc2 = device.createCommandEncoder();
        const rp = enc2.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.02, g: 0.025, b: 0.04, a: 1 } }] });
        rp.setPipeline(rPipe);
        rp.setBindGroup(0, rBind[latest]);
        rp.draw(3);
        rp.end();
        device.queue.submit([enc2.finish()]);
        tick++;
        raf = requestAnimationFrame(frame);
      };
      frame();
      cleanup = () => ro.disconnect();
    })();

    return () => { destroyed = true; cancelAnimationFrame(raf); cleanup(); device?.destroy(); };
  };
</script>

<canvas class="viewport" {@attach life}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; cursor: crosshair; }
</style>
