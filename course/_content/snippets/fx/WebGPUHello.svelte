<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // WebGPU is the successor to WebGL — explicit, modern, and the gateway to
  // compute shaders. This is the minimal render pipeline: ask for an adapter and
  // device, configure the canvas, and draw a fullscreen triangle whose fragment
  // shader (written in WGSL) animates an aurora. If WebGPU is missing, we say so.
  const shader = /* wgsl */ `
    struct U { time: f32, _pad: f32 };
    @group(0) @binding(0) var<uniform> u: U;

    struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

    @vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
      var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
      var o: VO;
      o.pos = vec4f(p[i], 0.0, 1.0);
      o.uv = p[i] * 0.5 + 0.5;
      return o;
    }

    @fragment fn fs(in: VO) -> @location(0) vec4f {
      let uv = in.uv;
      let t = u.time;
      let v = (sin(uv.x * 6.0 + t) + sin(uv.y * 7.0 - t) + sin((uv.x + uv.y) * 5.0 + t * 1.3)) * 0.33;
      let violet = vec3f(0.486, 0.360, 1.0);
      let cyan = vec3f(0.098, 0.890, 0.839);
      let pink = vec3f(1.0, 0.373, 0.620);
      var col = mix(violet, cyan, smoothstep(-1.0, 1.0, v));
      col = mix(col, pink, smoothstep(0.4, 1.0, sin(uv.y * 3.0 + t)) * 0.6);
      return vec4f(col, 1.0);
    }
  `;

  function fallback(canvas: HTMLCanvasElement, msg: string): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8b93a7';
    ctx.font = '14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  const hello: Attachment<HTMLCanvasElement> = (canvas) => {
    let raf = 0;
    let destroyed = false;
    let device: GPUDevice | null = null;
    let cleanup = () => {};

    (async () => {
      if (!navigator.gpu) {
        fallback(canvas, 'WebGPU is not available in this browser.');
        return;
      }
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        fallback(canvas, 'No suitable GPU adapter found.');
        return;
      }
      device = await adapter.requestDevice();
      if (destroyed) {
        device.destroy();
        return;
      }
      const ctx = canvas.getContext('webgpu') as GPUCanvasContext;
      const format = navigator.gpu.getPreferredCanvasFormat();
      ctx.configure({ device, format, alphaMode: 'premultiplied' });

      const module = device.createShaderModule({ code: shader });
      const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module, entryPoint: 'vs' },
        fragment: { module, entryPoint: 'fs', targets: [{ format }] },
        primitive: { topology: 'triangle-list' }
      });

      const uniform = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const bind = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniform } }]
      });

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      const start = performance.now();
      const frame = () => {
        if (destroyed || !device) return;
        device.queue.writeBuffer(uniform, 0, new Float32Array([(performance.now() - start) / 1000, 0]));
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.02, g: 0.025, b: 0.04, a: 1 } }]
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bind);
        pass.draw(3);
        pass.end();
        device.queue.submit([encoder.finish()]);
        raf = requestAnimationFrame(frame);
      };
      frame();

      cleanup = () => ro.disconnect();
    })();

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      cleanup();
      device?.destroy();
    };
  };
</script>

<canvas class="viewport" {@attach hello}></canvas>

<style>
  .viewport { width: 100%; height: 100%; min-height: 320px; display: block; border-radius: 12px; }
</style>
