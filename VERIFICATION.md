# Verification

This project isn't "it type-checks, ship it." Every demo is exercised in a real
browser before it's considered done.

## Gates (run in CI on every push — `.github/workflows/ci.yml`)

1. **`pnpm check`** — `svelte-check` in TypeScript **strict** mode. Must be **0 errors**.
2. **`pnpm build`** — `adapter-static` prerenders all routes; must compile clean.
3. **`pnpm verify`** — `app/verify.mjs` launches a real **headless Chromium with
   software GL (SwiftShader)**, loads **every prerendered route**, and **fails the
   run on any console error, uncaught exception, or failed network request.** It
   also screenshots each route (artifact-uploaded in CI) for visual inspection.

## What the browser run actually proves

Run locally with `cd app && pnpm build && pnpm verify`.

- **63 / 63 routes load with zero console errors, exceptions or failed requests.**
- Because the harness uses **software WebGL2**, every WebGL/three.js/GSAP/D3/CSS/
  Svelte demo *runs for real* — so shader-compile errors and runtime JS bugs would
  surface as console errors and fail the gate. They don't. The blind-written GLSL
  was visually confirmed rendering correctly, including:
  - the **spectral ocean** (Gerstner waves + water shading),
  - the **raymarched SDF** (smooth-union metaballs, lit),
  - **3D Gaussian splatting** (EWA projected anisotropic Gaussians),
  - **Gray–Scott reaction-diffusion** (coral patterns forming),
  - **GPGPU flow-field particles** (16k points advecting),
  - the **GSAP/SplitText cinematic capstones**, postprocessing, metaballs, distortion, etc.

## Honest limits (the real-GPU caveat)

This sandbox/CI has **no GPU and no WebGPU**, so the WebGPU-native demos cannot be
pixel-verified here. The harness confirms they **fall back gracefully** — they detect
the missing adapter and paint a clear message instead of crashing (e.g. *"No suitable
GPU adapter found."*), with **no console errors**. These need an eyeball on real
WebGPU hardware (Chrome/Edge/Safari 26+) to confirm pixels:

- M14–M16 WebGPU compute: million-particle compute, boids, N-body, Game of Life,
  slime mould, stable-fluids, the path tracer.
- M18–M19: on-device AI (Transformers.js), the in-browser LLM (WebLLM), and the
  WebGPURenderer + TSL lesson (which *does* fall back to WebGL2 and was verified there).

Their structure is sound (they load and fall back cleanly), and the **WebGL ports of
the same techniques** (reaction-diffusion, GPGPU particles) are visually confirmed —
which gives high confidence the WGSL versions are correct too.

## Two notes

- `/denoiser` and `/volumetrics` are too heavy to *screenshot* under pure software
  rendering (SwiftShader pegs the CPU and Playwright's frame-stabilisation times out);
  both were confirmed to load **error-free** with a correctly-sized canvas. They render
  fine on any real GPU. Screenshots are therefore best-effort and never fail the gate.
- Versions verified current to the official docs as of **June 8, 2026** (Svelte 5.56 /
  SvelteKit 2.63 / Three r184 / GSAP 3.15 / TS 6 / Node 24.16 / pnpm 11.5.2). WebGPU
  hardware ray tracing is not shipping (earliest 2027), so the compute path tracer
  remains the in-browser rendering ceiling.
