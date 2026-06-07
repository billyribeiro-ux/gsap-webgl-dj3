<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // Flocking on the GPU. Each frame a compute shader runs once per bird; that
  // thread loops over every other bird and applies the three classic boids rules
  // — separation, alignment, cohesion — then writes the new velocity & position.
  // Emergent flocking from local rules, 1,500 agents, all in parallel. We double-
  // buffer (read last frame, write this frame) so neighbours stay consistent.
  const COUNT = 1500;

  const computeWGSL = /* wgsl */ `
    struct B { pos: vec2f, vel: vec2f };
    struct U { count: u32, dt: f32, aspect: f32, _p: f32 };
    @group(0) @binding(0) var<storage, read> inB: array<B>;
    @group(0) @binding(1) var<storage, read_write> outB: array<B>;
    @group(0) @binding(2) var<uniform> u: U;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3u) {
      let i = gid.x;
      if (i >= u.count) { return; }
      let me = inB[i];
      var sep = vec2f(0.0);
      var ali = vec2f(0.0);
      var coh = vec2f(0.0);
      var nAli = 0.0;
      var nCoh = 0.0;
      for (var j = 0u; j < u.count; j = j + 1u) {
        if (j == i) { continue; }
        let o = inB[j];
        var d = o.pos - me.pos;
        d.x = d.x * u.aspect;
        let dist = length(d);
        if (dist < 0.03) { sep = sep - (o.pos - me.pos); }
        if (dist < 0.07) { ali = ali + o.vel; coh = coh + o.pos; nAli = nAli + 1.0; nCoh = nCoh + 1.0; }
      }
      var vel = me.vel;
      vel = vel + sep * 1.4;
      if (nAli > 0.0) { vel = vel + (ali / nAli - me.vel) * 0.06; }
      if (nCoh > 0.0) { vel = vel + (coh / nCoh - me.pos) * 0.5; }
      let sp = length(vel);
      let maxS = 0.006;
      let minS = 0.0032;
      if (sp > maxS) { vel = vel / sp * maxS; }
      if (sp < minS && sp > 0.0) { vel = vel / sp * minS; }
      var pos = me.pos + vel;
      if (pos.x >  1.0) { pos.x = -1.0; }
      if (pos.x < -1.0) { pos.x =  1.0; }
      if (pos.y >  1.0) { pos.y = -1.0; }
      if (pos.y < -1.0) { pos.y =  1.0; }
      outB[i] = B(pos, vel);
    }
  `;

  const renderWGSL = /* wgsl */ `
    struct B { pos: vec2f, vel: vec2f };
    struct U { count: u32, dt: f32, aspect: f32, _p: f32 };
    @group(0) @binding(0) var<storage, read> bs: array<B>;
    @group(0) @binding(1) var<uniform> u: U;
    struct VO { @builtin(position) pos: vec4f, @location(0) col: vec3f };

    @vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VO {
      let b = bs[ii];
      let dir = normalize(b.vel + vec2f(1e-6, 0.0));
      let perp = vec2f(-dir.y, dir.x);
      let s = 0.014;
      var local = dir * s;
      if (vi == 1u) { local = -dir * s * 0.6 + perp * s * 0.5; }
      if (vi == 2u) { local = -dir * s * 0.6 - perp * s * 0.5; }
      local.x = local.x / u.aspect;        // keep the triangle from stretching
      var o: VO;
      o.pos = vec4f(b.pos + local, 0.0, 1.0);
      o.col = mix(vec3f(0.486, 0.360, 1.0), vec3f(0.098, 0.890, 0.839), clamp(length(b.vel) * 120.0, 0.0, 1.0));
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

  const boids: Attachment<HTMLCanvasElement> = (canvas) => {
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

      const data = new Float32Array(COUNT * 4);
      for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        data[i * 4 + 0] = Math.random() * 2 - 1;
        data[i * 4 + 1] = Math.random() * 2 - 1;
        data[i * 4 + 2] = Math.cos(a) * 0.004;
        data[i * 4 + 3] = Math.sin(a) * 0.004;
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

      let ping = 0;
      const frame = () => {
        if (destroyed || !device) return;
        uniU32[0] = COUNT;
        uniF32[1] = 0.016;
        uniF32[2] = canvas.clientWidth / canvas.clientHeight;
        device.queue.writeBuffer(uni, 0, uniBuf);

        const enc = device.createCommandEncoder();
        const cp = enc.beginComputePass();
        cp.setPipeline(cPipe);
        cp.setBindGroup(0, cBind[ping]);          // read buf[ping] → write buf[1-ping]
        cp.dispatchWorkgroups(Math.ceil(COUNT / 64));
        cp.end();
        const written = 1 - ping;
        const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.02, g: 0.025, b: 0.045, a: 1 } }] });
        rp.setPipeline(rPipe);
        rp.setBindGroup(0, rBind[written]);
        rp.draw(3, COUNT);                          // instanced: 3 verts × COUNT boids
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

<canvas class="viewport" {@attach boids}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; }
</style>
