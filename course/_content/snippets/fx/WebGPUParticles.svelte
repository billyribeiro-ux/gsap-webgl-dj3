<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // A million particles, updated entirely by a WebGPU COMPUTE shader. Their
  // positions live in a storage buffer on the GPU; each frame a compute pass runs
  // the simulation in parallel across thousands of GPU threads, then a render pass
  // draws them as additive points. This is the scale WebGL can't reach — and the
  // future of web graphics.
  const COUNT = 1_000_000;

  // Both pipelines share the Particle struct. Compute writes; render reads.
  const computeWGSL = /* wgsl */ `
    struct P { pos: vec2f, vel: vec2f };
    struct U { dt: f32, time: f32, mouse: vec2f, mouseOn: f32, count: u32 };
    @group(0) @binding(0) var<storage, read_write> ps: array<P>;
    @group(0) @binding(1) var<uniform> u: U;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3u) {
      let i = gid.x;
      if (i >= u.count) { return; }
      var p = ps[i];
      // A swirling flow field + optional pull toward the cursor.
      let f = vec2f(
        sin(p.pos.y * 3.0 + u.time) + cos(p.pos.x * 2.0),
        sin(p.pos.x * 3.0 + u.time * 0.8) + cos(p.pos.y * 2.0)) * 0.0006;
      var m = vec2f(0.0);
      if (u.mouseOn > 0.5) { m = (u.mouse - p.pos) * 0.0018; }
      p.vel = (p.vel + f + m) * 0.97;          // damping keeps it calm
      p.pos = p.pos + p.vel;
      if (p.pos.x >  1.0) { p.pos.x = -1.0; }   // wrap around the edges
      if (p.pos.x < -1.0) { p.pos.x =  1.0; }
      if (p.pos.y >  1.0) { p.pos.y = -1.0; }
      if (p.pos.y < -1.0) { p.pos.y =  1.0; }
      ps[i] = p;
    }
  `;

  const renderWGSL = /* wgsl */ `
    struct P { pos: vec2f, vel: vec2f };
    @group(0) @binding(0) var<storage, read> ps: array<P>;
    struct VO { @builtin(position) pos: vec4f, @location(0) col: vec3f };

    @vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
      let p = ps[i];
      var o: VO;
      o.pos = vec4f(p.pos, 0.0, 1.0);
      let s = clamp(length(p.vel) * 45.0, 0.0, 1.0);   // colour by speed
      o.col = mix(vec3f(0.486, 0.360, 1.0), vec3f(0.098, 0.890, 0.839), s);
      return o;
    }
    @fragment fn fs(in: VO) -> @location(0) vec4f { return vec4f(in.col, 1.0); }
  `;

  function fallback(canvas: HTMLCanvasElement, msg: string): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8b93a7';
    ctx.font = '14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  const particles: Attachment<HTMLCanvasElement> = (canvas) => {
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

      // Seed the particle buffer with random positions + velocities (16 bytes each).
      const initial = new Float32Array(COUNT * 4);
      for (let i = 0; i < COUNT; i++) {
        initial[i * 4 + 0] = Math.random() * 2 - 1;
        initial[i * 4 + 1] = Math.random() * 2 - 1;
        initial[i * 4 + 2] = (Math.random() - 0.5) * 0.002;
        initial[i * 4 + 3] = (Math.random() - 0.5) * 0.002;
      }
      const particleBuf = device.createBuffer({ size: initial.byteLength, usage: GPUBufferUsage.STORAGE, mappedAtCreation: true });
      new Float32Array(particleBuf.getMappedRange()).set(initial);
      particleBuf.unmap();

      const uniformBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const uniformData = new ArrayBuffer(32);
      const uf = new Float32Array(uniformData);
      const uu = new Uint32Array(uniformData);

      const computeModule = device.createShaderModule({ code: computeWGSL });
      const renderModule = device.createShaderModule({ code: renderWGSL });

      const computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint: 'main' } });
      const renderPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: renderModule, entryPoint: 'vs' },
        fragment: {
          module: renderModule,
          entryPoint: 'fs',
          targets: [{
            format,
            blend: { color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } }
          }]
        },
        primitive: { topology: 'point-list' }
      });

      const computeBind = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: particleBuf } }, { binding: 1, resource: { buffer: uniformBuf } }]
      });
      const renderBind = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: particleBuf } }]
      });

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      let mouseOn = 0;
      const mouse = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      };
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerenter', () => (mouseOn = 1));
      canvas.addEventListener('pointerleave', () => (mouseOn = 0));

      const start = performance.now();
      const frame = () => {
        if (destroyed || !device) return;
        uf[0] = 0.016;
        uf[1] = (performance.now() - start) / 1000;
        uf[2] = mouse.x;
        uf[3] = mouse.y;
        uf[4] = mouseOn;
        uu[5] = COUNT;
        device.queue.writeBuffer(uniformBuf, 0, uniformData);

        const encoder = device.createCommandEncoder();
        // 1. compute pass — simulate every particle
        const cpass = encoder.beginComputePass();
        cpass.setPipeline(computePipeline);
        cpass.setBindGroup(0, computeBind);
        cpass.dispatchWorkgroups(Math.ceil(COUNT / 64));
        cpass.end();
        // 2. render pass — draw them additively
        const rpass = encoder.beginRenderPass({
          colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.02, g: 0.022, b: 0.04, a: 1 } }]
        });
        rpass.setPipeline(renderPipeline);
        rpass.setBindGroup(0, renderBind);
        rpass.draw(COUNT);
        rpass.end();
        device.queue.submit([encoder.finish()]);
        raf = requestAnimationFrame(frame);
      };
      frame();

      cleanup = () => {
        ro.disconnect();
        canvas.removeEventListener('pointermove', onMove);
      };
    })();

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      cleanup();
      device?.destroy();
    };
  };
</script>

<canvas class="viewport" {@attach particles}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; cursor: crosshair; }
</style>
