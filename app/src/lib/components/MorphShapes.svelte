<script lang="ts">
  import { gsap } from 'gsap';
  import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

  gsap.registerPlugin(MorphSVGPlugin);

  // MorphSVG tweens one path's `d` into another's — even when they have totally
  // different numbers of points. It figures out a sensible mapping, so a square
  // can flow into a triangle into a plus. This is genuinely hard maths, made trivial.
  const shapes = [
    'M60,60 L196,60 L196,196 L60,196 Z', // square
    'M128,48 L210,196 L46,196 Z', // triangle
    'M128,44 L212,128 L128,212 L44,128 Z', // diamond
    'M104,52 L152,52 L152,104 L204,104 L204,152 L152,152 L152,204 L104,204 L104,152 L52,152 L52,104 L104,104 Z' // plus
  ];

  let i = $state(0);
  let pathEl: SVGPathElement | undefined = $state();

  // Re-run whenever `i` changes: morph the live path toward the chosen shape.
  $effect(() => {
    if (!pathEl) return;
    const tween = gsap.to(pathEl, { duration: 0.7, ease: 'power2.inOut', morphSVG: shapes[i] });
    return () => tween.kill();
  });

  function next(): void {
    i = (i + 1) % shapes.length;
  }
</script>

<svg viewBox="0 0 256 256" class="canvas" aria-hidden="true">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c5cff" />
      <stop offset="1" stop-color="#19e3d6" />
    </linearGradient>
  </defs>
  <path class="shape" bind:this={pathEl} d={shapes[0]} fill="url(#grad)" />
</svg>

<button class="morph-btn" onclick={next}>Morph →</button>

<style>
  .canvas { width: min(60%, 220px); aspect-ratio: 1; }
  .morph-btn { margin-top: 1rem; padding: 0.55rem 1.4rem; border-radius: 999px; border: none; font-weight: 700; color: #0a0414; background: linear-gradient(135deg, #7c5cff, #19e3d6); cursor: pointer; }
</style>
