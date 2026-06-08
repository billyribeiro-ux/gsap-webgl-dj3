# MOTION — The Ultimate Cinematic Animation Course

> Go from 0 to world‑class cinematic web animation. CSS, SVG & Phosphor, Svelte 5
> motion, GSAP (core · timelines · ScrollTrigger · SplitText), D3, WebGL/Three.js
> and Threlte — taught by a principal‑engineer persona, in plain English, with
> **real running demos** and **copy‑paste Svelte 5 code**.

This repository has two halves that work together:

| | What it is | How you use it |
|---|---|---|
| **`course/`** | The **HTML textbook**. Self‑contained lesson pages: narration, a Monaco editor showing the Svelte 5 code, a live running demo, and Previous/Next navigation. No build step. | Open `course/index.html` in a browser and read. |
| **`app/`** | The **SvelteKit reference project**. Every technique as a real, scoped, **TypeScript (strict)** Svelte 5 component you can run. | `cd app && pnpm install && pnpm dev` |

You **read** in `course/`, then **rebuild** it in `app/` by copying the code — which
is exactly the same code that powers the reference components.

---

## Toolchain

- **Node** `24.16.0` (`.nvmrc`)
- **pnpm** `11.5.2` (`packageManager` field)
- **Svelte** 5.56 · **SvelteKit** 2.63 · **Vite** 8 · **TypeScript** 6 (strict)
- **GSAP** 3.15 (all plugins free) · **Three.js** r184 · **Threlte** 8 · **D3** 7
- **phosphor‑svelte** for icons · **Monaco** (CDN) for the in‑page code panels
- No Tailwind. All styling is hand‑authored, scoped CSS.

---

## Read the textbook (`course/`)

No install required — it's plain HTML + CSS + a little vanilla JS, with libraries
loaded from a CDN for the live demos.

```bash
# any static server works; for example:
pnpm dlx serve course
# then open the printed URL, or just open course/index.html directly
```

- **`course/index.html`** — cinematic landing + the full 12‑module curriculum.
- **`course/lessons/*.html`** — the lessons (← / → arrow keys navigate).
- **`course/assets/`** — the design system (`course.css`), the shell runtime
  (`course.js` — Monaco loader, copy buttons, pager, scroll progress) and the
  single lesson manifest (`lessons.js`).

### Editing / adding lessons

Lessons are generated from content fragments by a tiny zero‑dependency script:

```bash
node course/build.mjs
```

- Authored lessons live in `course/_content/<slug>.html` (narration + demo), and
  their copy‑paste code lives as **real files** in `course/_content/snippets/`.
- A `<!--code file="..." name="..."-->` directive injects a snippet into a Monaco
  panel (auto‑escaped). Add an entry to `course/assets/lessons.js` and a fragment,
  then re‑run the script — navigation wires up automatically.

---

## Run the reference app (`app/`)

```bash
cd app
pnpm install
pnpm dev        # http://localhost:5173
pnpm check      # svelte-check, TypeScript strict — 0 errors
pnpm build      # static, prerendered output in app/build/
```

The app uses **adapter‑static**, so `pnpm build` produces a fully prerendered,
deployable site. Reusable building blocks live in `app/src/lib/` (components,
the shared `gsap.ts` plugin registry, the `three/` scene primitives) and each
lesson is a route under `app/src/routes/` with Prev/Next navigation.

---

## Curriculum

M0 Foundations · M1 CSS Animation · M2 SVG & Phosphor · M3 Svelte 5 Motion ·
M4 GSAP Core · M5 Timelines · M6 ScrollTrigger · M7 SplitText & SVG ·
M8 D3 Motion · M9 Three.js · M10 Threlte · M11 Cinematic Capstones ·
M12 Advanced Cinematic FX (glitch, distortion, GPU particles, postprocessing) ·
M13 The Frontier (image transitions, metaballs, magnetic cursor, audio‑reactive) ·
M14 The Bleeding Edge (raymarched SDFs, GPU reaction‑diffusion, GPGPU particles, rigid‑body physics) ·
M15 WebGPU (WGSL pipelines, a million‑particle compute shader, boids, N‑body gravity,
Conway's Life, a 200k‑agent slime‑mould, and a real‑time Navier‑Stokes fluid solver) ·
M16 The Abyss — beyond real‑time (volumetric cloud raymarching, and a progressive WebGPU
path tracer with true global illumination) ·
M17 Mastery — distinguished rendering (a spectral/FFT‑style ocean, and 3D Gaussian splatting) ·
M18 The 2026 Frontier — on‑device AI (Transformers.js v4 neural nets on WebGPU), the modern
Three.js WebGPURenderer + TSL node shaders, and Svelte's newest async + SvelteKit remote functions.

**61 lessons across 18 modules**, every one fully authored with a live demo and
copy‑paste TypeScript code — and **59 runnable routes** in the reference app. The app's
landing page groups every demo by module, and all navigations use the View Transitions API.

---

## Accessibility

Every animation respects `prefers-reduced-motion`. Navigation is keyboard‑friendly,
focus states are visible, and motion is built on GPU‑cheap `transform`/`opacity`
for a steady 60fps.
