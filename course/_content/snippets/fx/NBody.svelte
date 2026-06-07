<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // N-body gravity: every one of 4,096 bodies attracts every other. That's an
  // all-pairs (O(n²)) problem — 16 million force calculations per frame — which
  // would crush the CPU but is trivial for a compute shader. Each thread sums the
  // gravitational pull of all other bodies, integrates, and writes the result.
  // Seeded as a spinning disk, it self-organizes into spiral arms.
  const COUNT = 4096;

  const computeWGSL = /* wgsl */ `
    struct Body { pos: vec2f, vel: vec2f };
    struct U { count: u32, dt: f32, g: f32, soft: f32 };
    @group(0) @binding(0) var<storage, read> inB: array<Body>;
    @group(0) @binding(1) var<storage, read_write> outB: array<Body>;
    @group(0) @binding(2) var<uniform> u: U;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3u) {
      let i = gid.x;
      if (i >= u.count) { return; }
      let me = inB[i];
      var acc = vec2f(0.0);
      for (var j = 0u; j < u.count; j = j + 1u) {
        let d = inB[j].pos - me.pos;
        let r2 = dot(d, d) + u.soft;          // softening avoids the singularity
        acc = acc + d * (u.g / (r2 * sqrt(r2)));
      }
      var vel = (me.vel + acc * u.dt) * 0.9995; // a whisper of damping for stability
      var pos = me.pos + vel * u.dt;
      outB[i] = Body(pos, vel);
    }
  `;

  const renderWGSL = /* wgsl */ `
    struct Body { pos: vec2f, vel: vec2f };
    struct U { count: u32, dt: f32, g: f32, soft: f32 };
    @group(0) @binding(0) var<storage, read> bs: array<Body>;
    @group(0) @binding(1) var<uniform> u: U;
    struct VO { @builtin(position) pos: vec4f, @location(0) col: vec3f };
    @vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
      let b = bs[i];
      var o: VO;
      o.pos = vec4f(b.pos, 0.0, 1.0);
      let s = clamp(length(b.vel) * 1.4, 0.0, 1.0);
      o.col = mix(vec3f(0.486, 0.360, 1.0), vec3f(1.0, 0.85, 0.55), s); // cool → hot
      return o;
    }
    @fragment fn fs(in: VO) -> @location(0) vec4f { return vec4f(in.col, 1.0); }
  `;

  function fallback(canvas: HTMLCanvasElement, msg: string): void {
    const c = canvas.getContext('2d');
    if (!c) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    c.fillStyle = '#05060a';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#8b93a7';
    c.font = '14px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  const nbody: Attachment<HTMLCanvasElement> = (canvas) => {
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

      // Seed a spinning disk: position in a disc, velocity perpendicular (orbit).
      const data = new Float32Array(COUNT * 4);
      for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 0.7;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        const speed = 0.35 * Math.sqrt(r + 0.05);
        data[i * 4 + 0] = x;
        data[i * 4 + 1] = y;
        data[i * 4 + 2] = -Math.sin(a) * speed;
        data[i * 4 + 3] = Math.cos(a) * speed;
      }
      const makeBuf = (init?: Float32Array) => {
        const b = device!.createBuffer({ size: COUNT * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, mappedAtCreation: !!init });
        if (init) { new Float32Array(b.getMappedRange()).set(init); b.unmap(); }
        return b;
      };
      const buf = [makeBuf(data), makeBuf()];

      const uni = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const uniBuf = new ArrayBuffer(16);
      const uniU32 = new Uint32Array(uniBuf);
      const uniF32 = new Float32Array(uniBuf);

      const cMod = device.createShaderModule({ code: computeWGSL });
      const rMod = device.createShaderModule({ code: renderWGSL });
      const cPipe = device.createComputePipeline({ layout: 'auto', compute: { module: cMod, entryPoint: 'main' } });
      const rPipe = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: rMod, entryPoint: 'vs' },
        fragment: { module: rMod, entryPoint: 'fs', targets: [{ format, blend: { color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } } }] },
        primitive: { topology: 'point-list' }
      });

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

      let ping = 0;
      const frame = () => {
        if (destroyed || !device) return;
        uniU32[0] = COUNT;
        uniF32[1] = 0.0016;     // dt
        uniF32[2] = 0.00012;    // G
        uniF32[3] = 0.0009;     // softening
        device.queue.writeBuffer(uni, 0, uniBuf);

        const enc = device.createCommandEncoder();
        const cp = enc.beginComputePass();
        cp.setPipeline(cPipe);
        cp.setBindGroup(0, cBind[ping]);
        cp.dispatchWorkgroups(Math.ceil(COUNT / 64));
        cp.end();
        const written = 1 - ping;
        const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.015, g: 0.015, b: 0.03, a: 1 } }] });
        rp.setPipeline(rPipe);
        rp.setBindGroup(0, rBind[written]);
        rp.draw(COUNT);
        rp.end();
        device.queue.submit([enc.finish()]);
        ping = written;
        raf = requestAnimationFrame(frame);
      };
      frame();
      cleanup = () => ro.disconnect();
    })();

    return () => { destroyed = true; cancelAnimationFrame(raf); cleanup(); device?.destroy(); };
  };
</script>

<canvas class="viewport" {@attach nbody}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; }
</style>
