<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // Physarum (slime mould): 200,000 agents that each sense a chemical trail
  // ahead, steer toward the strongest, move, and deposit more trail. A second
  // pass diffuses and decays the trail. From those local rules, the colony grows
  // the same transport networks real slime moulds use to solve mazes. Three
  // compute passes per frame; the trail uses atomics so deposits never collide.
  const W = 640;
  const H = 360;
  const CELLS = W * H;
  const AGENTS = 200000;

  const agentWGSL = /* wgsl */ `
    struct Agent { pos: vec2f, angle: f32, pad: f32 };
    struct U { w: u32, h: u32, count: u32, _p: u32, time: f32, sensorDist: f32, sensorAngle: f32, turnSpeed: f32, speed: f32, deposit: f32, decay: f32, _p2: f32 };
    @group(0) @binding(0) var<storage, read_write> agents: array<Agent>;
    @group(0) @binding(1) var<storage, read_write> trail: array<atomic<u32>>;
    @group(0) @binding(2) var<uniform> u: U;

    fn sample(p: vec2f, ang: f32) -> f32 {
      let s = p + vec2f(cos(ang), sin(ang)) * u.sensorDist;
      let xx = ((i32(s.x) % i32(u.w)) + i32(u.w)) % i32(u.w);
      let yy = ((i32(s.y) % i32(u.h)) + i32(u.h)) % i32(u.h);
      return f32(atomicLoad(&trail[u32(yy) * u.w + u32(xx)]));
    }
    fn hash(seed: u32) -> f32 {
      var x = seed;
      x = x ^ (x >> 16u); x = x * 2246822519u;
      x = x ^ (x >> 13u); x = x * 3266489917u;
      x = x ^ (x >> 16u);
      return f32(x) / 4294967295.0;
    }

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3u) {
      let i = gid.x;
      if (i >= u.count) { return; }
      var a = agents[i];
      let fwd = sample(a.pos, a.angle);
      let left = sample(a.pos, a.angle - u.sensorAngle);
      let right = sample(a.pos, a.angle + u.sensorAngle);
      let rnd = hash(i + u32(u.time * 60.0));
      if (fwd > left && fwd > right) {
        // keep heading
      } else if (fwd < left && fwd < right) {
        if (rnd < 0.5) { a.angle = a.angle - u.turnSpeed; } else { a.angle = a.angle + u.turnSpeed; }
      } else if (right > left) {
        a.angle = a.angle + u.turnSpeed;
      } else if (left > right) {
        a.angle = a.angle - u.turnSpeed;
      }
      var np = a.pos + vec2f(cos(a.angle), sin(a.angle)) * u.speed;
      if (np.x < 0.0) { np.x = np.x + f32(u.w); }
      if (np.x >= f32(u.w)) { np.x = np.x - f32(u.w); }
      if (np.y < 0.0) { np.y = np.y + f32(u.h); }
      if (np.y >= f32(u.h)) { np.y = np.y - f32(u.h); }
      a.pos = np;
      agents[i] = a;
      let dx = min(u32(np.x), u.w - 1u);
      let dy = min(u32(np.y), u.h - 1u);
      atomicAdd(&trail[dy * u.w + dx], u32(u.deposit));
    }
  `;

  const diffuseWGSL = /* wgsl */ `
    struct U { w: u32, h: u32, count: u32, _p: u32, time: f32, sensorDist: f32, sensorAngle: f32, turnSpeed: f32, speed: f32, deposit: f32, decay: f32, _p2: f32 };
    @group(0) @binding(0) var<storage, read_write> inT: array<atomic<u32>>;
    @group(0) @binding(1) var<storage, read_write> outT: array<atomic<u32>>;
    @group(0) @binding(2) var<storage, read_write> disp: array<u32>;
    @group(0) @binding(3) var<uniform> u: U;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) gid: vec3u) {
      let i = gid.x;
      if (i >= u.w * u.h) { return; }
      let w = i32(u.w); let h = i32(u.h);
      let x = i32(i) % w; let y = i32(i) / w;
      var sum = 0u;
      for (var dy = -1; dy <= 1; dy = dy + 1) {
        for (var dx = -1; dx <= 1; dx = dx + 1) {
          let xx = ((x + dx) % w + w) % w;
          let yy = ((y + dy) % h + h) % h;
          sum = sum + atomicLoad(&inT[u32(yy * w + xx)]);
        }
      }
      let v = u32((f32(sum) / 9.0) * u.decay);
      atomicStore(&outT[i], v);
      disp[i] = v;
    }
  `;

  const renderWGSL = /* wgsl */ `
    struct U { w: u32, h: u32, count: u32, _p: u32, time: f32, sensorDist: f32, sensorAngle: f32, turnSpeed: f32, speed: f32, deposit: f32, decay: f32, _p2: f32 };
    @group(0) @binding(0) var<storage, read> disp: array<u32>;
    @group(0) @binding(1) var<uniform> u: U;
    struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
    @vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
      var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
      var o: VO; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * 0.5 + 0.5; return o;
    }
    @fragment fn fs(in: VO) -> @location(0) vec4f {
      let xi = min(u32(in.uv.x * f32(u.w)), u.w - 1u);
      let yi = min(u32((1.0 - in.uv.y) * f32(u.h)), u.h - 1u);
      let t = clamp(f32(disp[yi * u.w + xi]) / 110.0, 0.0, 1.0);
      var col = mix(vec3f(0.02, 0.02, 0.05), vec3f(0.486, 0.360, 1.0), smoothstep(0.0, 0.4, t));
      col = mix(col, vec3f(0.098, 0.890, 0.839), smoothstep(0.4, 0.8, t));
      col = mix(col, vec3f(1.0, 1.0, 1.0), smoothstep(0.85, 1.0, t));
      return vec4f(col, 1.0);
    }
  `;

  function fallback(canvas: HTMLCanvasElement, msg: string): void {
    const c = canvas.getContext('2d'); if (!c) return;
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    c.fillStyle = '#05060a'; c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = '#8b93a7'; c.font = '14px ui-monospace, monospace'; c.textAlign = 'center';
    c.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  const slime: Attachment<HTMLCanvasElement> = (canvas) => {
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

      // Seed agents in a centred disc, facing inward, so a colony blooms.
      const adata = new Float32Array(AGENTS * 4);
      for (let i = 0; i < AGENTS; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * Math.min(W, H) * 0.3;
        adata[i * 4 + 0] = W / 2 + Math.cos(ang) * r;
        adata[i * 4 + 1] = H / 2 + Math.sin(ang) * r;
        adata[i * 4 + 2] = ang + Math.PI; // face the centre
        adata[i * 4 + 3] = 0;
      }
      const agents = device.createBuffer({ size: AGENTS * 16, usage: GPUBufferUsage.STORAGE, mappedAtCreation: true });
      new Float32Array(agents.getMappedRange()).set(adata);
      agents.unmap();

      const trail = [
        device.createBuffer({ size: CELLS * 4, usage: GPUBufferUsage.STORAGE }),
        device.createBuffer({ size: CELLS * 4, usage: GPUBufferUsage.STORAGE })
      ];
      const disp = device.createBuffer({ size: CELLS * 4, usage: GPUBufferUsage.STORAGE });

      const uni = device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const ub = new ArrayBuffer(48);
      const u32 = new Uint32Array(ub);
      const f32 = new Float32Array(ub);
      u32[0] = W; u32[1] = H; u32[2] = AGENTS;
      f32[5] = 9.0;   // sensorDist
      f32[6] = 0.5;   // sensorAngle
      f32[7] = 0.4;   // turnSpeed
      f32[8] = 1.1;   // speed
      f32[9] = 32.0;  // deposit
      f32[10] = 0.9;  // decay

      const aPipe = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: agentWGSL }), entryPoint: 'main' } });
      const dPipe = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: diffuseWGSL }), entryPoint: 'main' } });
      const rMod = device.createShaderModule({ code: renderWGSL });
      const rPipe = device.createRenderPipeline({ layout: 'auto', vertex: { module: rMod, entryPoint: 'vs' }, fragment: { module: rMod, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });

      const aBind = [
        device.createBindGroup({ layout: aPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: agents } }, { binding: 1, resource: { buffer: trail[0] } }, { binding: 2, resource: { buffer: uni } }] }),
        device.createBindGroup({ layout: aPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: agents } }, { binding: 1, resource: { buffer: trail[1] } }, { binding: 2, resource: { buffer: uni } }] })
      ];
      const dBind = [
        device.createBindGroup({ layout: dPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: trail[0] } }, { binding: 1, resource: { buffer: trail[1] } }, { binding: 2, resource: { buffer: disp } }, { binding: 3, resource: { buffer: uni } }] }),
        device.createBindGroup({ layout: dPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: trail[1] } }, { binding: 1, resource: { buffer: trail[0] } }, { binding: 2, resource: { buffer: disp } }, { binding: 3, resource: { buffer: uni } }] })
      ];
      const rBind = device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: disp } }, { binding: 1, resource: { buffer: uni } }] });

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      let cur = 0;
      const start = performance.now();
      const frame = () => {
        if (destroyed || !device) return;
        f32[4] = (performance.now() - start) / 1000;
        device.queue.writeBuffer(uni, 0, ub);

        const enc = device.createCommandEncoder();
        const ap = enc.beginComputePass();
        ap.setPipeline(aPipe);
        ap.setBindGroup(0, aBind[cur]);                 // sense + deposit into trail[cur]
        ap.dispatchWorkgroups(Math.ceil(AGENTS / 64));
        ap.end();
        const dp = enc.beginComputePass();
        dp.setPipeline(dPipe);
        dp.setBindGroup(0, dBind[cur]);                 // diffuse trail[cur] → trail[1-cur] + disp
        dp.dispatchWorkgroups(Math.ceil(CELLS / 64));
        dp.end();
        const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.02, g: 0.02, b: 0.05, a: 1 } }] });
        rp.setPipeline(rPipe);
        rp.setBindGroup(0, rBind);
        rp.draw(3);
        rp.end();
        device.queue.submit([enc.finish()]);
        cur = 1 - cur;
        raf = requestAnimationFrame(frame);
      };
      frame();
      cleanup = () => ro.disconnect();
    })();

    return () => { destroyed = true; cancelAnimationFrame(raf); cleanup(); device?.destroy(); };
  };
</script>

<canvas class="viewport" {@attach slime}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; background: #05060a; }
</style>
