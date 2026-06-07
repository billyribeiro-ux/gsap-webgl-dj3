/* ============================================================================
   lessons.js — the single ordered manifest for the whole course.
   This drives: the table of contents on index.html, the Prev/Next pager on
   every lesson page, and keyboard navigation. Add a lesson here and it is
   automatically wired into navigation everywhere. (One source of truth.)
   `status: "live"`  = fully built flagship lesson with running demo + code.
   `status: "live"`  = scaffolded, expandable in a later pass.
   ============================================================================ */
window.COURSE = {
  title: "MOTION",
  subtitle: "The Ultimate Cinematic Animation Course",
  modules: [
    {
      num: "M0",
      title: "Foundations of Motion",
      desc: "The physics, timing and language behind every great animation.",
      lessons: [
        { slug: "00-welcome", title: "Welcome — Think Like a Motion Director", status: "live" },
        { slug: "01-principles-of-motion", title: "The 12 Principles, Translated for the Web", status: "live" },
        { slug: "02-easing-and-timing", title: "Easing & Timing — The Soul of Motion", status: "live" },
        { slug: "03-performance-and-a11y", title: "60fps & Accessible Motion", status: "live" }
      ]
    },
    {
      num: "M1",
      title: "CSS Animation",
      desc: "Native, GPU-accelerated motion with zero dependencies.",
      lessons: [
        { slug: "10-css-transitions", title: "Transitions & the Cinematic Hover", status: "live" },
        { slug: "11-keyframes-transforms", title: "Keyframes, Transforms & 3D Space", status: "live" },
        { slug: "12-scroll-driven", title: "Scroll-Driven Animations (animation-timeline)", status: "live" },
        { slug: "13-view-transitions", title: "The View Transitions API", status: "live" },
        { slug: "14-button-effects", title: "The Button Effects Cookbook", status: "live" }
      ]
    },
    {
      num: "M2",
      title: "SVG & Phosphor Icons",
      desc: "Vector anatomy, draw-on strokes, morphing and living icons.",
      lessons: [
        { slug: "20-svg-anatomy", title: "SVG Anatomy & the Draw-On Effect", status: "live" },
        { slug: "21-phosphor-icons", title: "Building a Living Phosphor Icon System", status: "live" },
        { slug: "22-svg-morphing", title: "Shape Morphing", status: "live" }
      ]
    },
    {
      num: "M3",
      title: "Svelte 5 Built-in Motion",
      desc: "Transitions, Tween, Spring and FLIP — batteries included.",
      lessons: [
        { slug: "30-svelte-transitions", title: "transition: / in: / out: / animate:", status: "live" },
        { slug: "31-tween-spring", title: "svelte/motion — Tween & Spring", status: "live" },
        { slug: "32-flip-lists", title: "FLIP & Crossfade", status: "live" }
      ]
    },
    {
      num: "M4",
      title: "GSAP Core",
      desc: "The industry-standard tween engine — now 100% free.",
      lessons: [
        { slug: "40-gsap-first-tween", title: "Your First Tween — to, from, fromTo", status: "live" },
        { slug: "41-stagger", title: "Stagger — Choreographing Many Elements", status: "live" },
        { slug: "42-gsap-utils", title: "gsap.utils — The Secret Toolbox", status: "live" }
      ]
    },
    {
      num: "M5",
      title: "GSAP Timelines",
      desc: "Sequence anything with frame-perfect control.",
      lessons: [
        { slug: "50-timelines", title: "Timelines — Sequencing & Labels", status: "live" },
        { slug: "51-nested-timelines", title: "Nested & Reusable Timelines", status: "live" }
      ]
    },
    {
      num: "M6",
      title: "GSAP ScrollTrigger",
      desc: "Pin, scrub and parallax — scroll becomes a storyboard.",
      lessons: [
        { slug: "60-scrolltrigger", title: "Pin, Scrub & Parallax", status: "live" },
        { slug: "61-horizontal-scroll", title: "Horizontal Scroll Storytelling", status: "live" }
      ]
    },
    {
      num: "M7",
      title: "GSAP SVG & Text",
      desc: "DrawSVG, MorphSVG, MotionPath and SplitText title reveals.",
      lessons: [
        { slug: "70-splittext", title: "SplitText — The Apple/Netflix Headline Reveal", status: "live" },
        { slug: "71-motionpath", title: "MotionPath & DrawSVG", status: "live" }
      ]
    },
    {
      num: "M8",
      title: "D3 Motion",
      desc: "Data-driven animation: enter / update / exit.",
      lessons: [
        { slug: "80-d3-transitions", title: "Animated Data with enter/update/exit", status: "live" },
        { slug: "81-d3-force", title: "Force-Directed Motion", status: "live" }
      ]
    },
    {
      num: "M9",
      title: "WebGL / Three.js",
      desc: "Real-time 3D, the render loop, and a first shader.",
      lessons: [
        { slug: "90-threejs-first-scene", title: "Your First 3D Scene + Render Loop", status: "live" },
        { slug: "91-shaders", title: "A Gentle Introduction to Shaders", status: "live" }
      ]
    },
    {
      num: "M10",
      title: "Threlte (Svelte 5)",
      desc: "Declarative 3D inside Svelte — Three.js, the Svelte way.",
      lessons: [
        { slug: "a0-threlte-intro", title: "Declarative 3D with Threlte + useTask", status: "live" },
        { slug: "a1-threlte-scroll", title: "Scroll-Linked & GSAP-Driven 3D", status: "live" }
      ]
    },
    {
      num: "M11",
      title: "Capstone Compositions",
      desc: "Put it all together — beat the big studios.",
      lessons: [
        { slug: "b0-netflix-hero", title: "A Netflix-Grade Cinematic Hero", status: "live" },
        { slug: "b1-apple-reveal", title: "An Apple-Style Product Reveal", status: "live" },
        { slug: "b2-title-sequence", title: "A Hollywood Title Sequence", status: "live" }
      ]
    },
    {
      num: "M12",
      title: "Advanced Cinematic FX",
      desc: "The boss level — glitch, distortion, GPU particles and the cinematic grade.",
      lessons: [
        { slug: "c0-glitch", title: "The Glitch — RGB Split, Scanlines & Datamosh", status: "live" },
        { slug: "c1-text-scramble", title: "Text Scramble / Decode", status: "live" },
        { slug: "c2-image-distortion", title: "WebGL Hover Distortion (Shaders)", status: "live" },
        { slug: "c3-gpu-particles", title: "Morphing GPU Particles", status: "live" },
        { slug: "c4-postprocessing", title: "Postprocessing — Bloom & Chromatic Aberration", status: "live" },
        { slug: "c5-scroll-skew", title: "Inertia Scroll & Velocity Skew", status: "live" }
      ]
    },
    {
      num: "M13",
      title: "The Frontier",
      desc: "Signature WebGL & interaction — the effects on the web's most awarded sites.",
      lessons: [
        { slug: "d0-image-transition", title: "WebGL Image-to-Image Transition", status: "live" },
        { slug: "d1-metaballs", title: "Fluid Metaballs", status: "live" },
        { slug: "d2-custom-cursor", title: "Custom Cursor & Magnetic Field", status: "live" },
        { slug: "d3-audio-reactive", title: "Audio-Reactive Shader", status: "live" }
      ]
    },
    {
      num: "M14",
      title: "The Bleeding Edge",
      desc: "Single-shader 3D, GPU simulations and rigid-body physics — the deepest end.",
      lessons: [
        { slug: "e0-raymarch", title: "Raymarched SDF Worlds", status: "live" },
        { slug: "e1-reaction-diffusion", title: "GPU Reaction-Diffusion", status: "live" },
        { slug: "e2-flow-field", title: "GPGPU Flow-Field Particles", status: "live" },
        { slug: "e3-physics", title: "A 3D Physics Playground", status: "live" }
      ]
    },
    {
      num: "M15",
      title: "WebGPU — The Very Edge",
      desc: "The newest frontier: WGSL render pipelines and a million-particle compute shader.",
      lessons: [
        { slug: "f0-webgpu-intro", title: "Hello WebGPU — Your First Render Pipeline", status: "live" },
        { slug: "f1-webgpu-particles", title: "A Million Particles with Compute Shaders", status: "live" },
        { slug: "f2-boids", title: "Compute Boids — Emergent Flocking", status: "live" },
        { slug: "f3-nbody", title: "N-Body Gravity — A Galaxy Forms", status: "live" },
        { slug: "f4-game-of-life", title: "Conway's Game of Life on the GPU", status: "live" },
        { slug: "f5-slime-mould", title: "Slime Mould (Physarum) — Emergent Networks", status: "live" },
        { slug: "f6-fluid", title: "A Real-Time Fluid Solver (Navier-Stokes)", status: "live" }
      ]
    },
    {
      num: "M16",
      title: "The Abyss — Beyond Real-Time",
      desc: "Rendering light itself: volumetric clouds and a progressive path tracer with true GI.",
      lessons: [
        { slug: "g0-volumetrics", title: "Volumetric Raymarching — Clouds & Light", status: "live" },
        { slug: "g1-pathtracer", title: "A Real-Time Path Tracer — True Global Illumination", status: "live" }
      ]
    }
  ]
};

/* Flatten to an ordered list for prev/next traversal. */
window.COURSE.flat = window.COURSE.modules.flatMap((m) =>
  m.lessons.map((l) => ({ ...l, module: m.num, moduleTitle: m.title }))
);
