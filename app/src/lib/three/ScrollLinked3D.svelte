<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Spinner from './Spinner.svelte';

  // The wiring: a tall section with a sticky canvas. As the section scrolls past,
  // we compute how far through it we are (0 → 1) and feed that to the 3D scene.
  // Because Spinner just consumes `progress`, the scroll math lives entirely here —
  // clean separation between "what drives the animation" and "what the animation is."
  let progress = $state(0);
  let section: HTMLElement | undefined = $state();

  function update(): void {
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    // -rect.top goes from 0 (top aligned) to `total` (bottom aligned).
    progress = Math.min(1, Math.max(0, -rect.top / total));
  }
</script>

<svelte:window onscroll={update} onresize={update} />

<section class="tall" bind:this={section}>
  <div class="sticky">
    <Canvas>
      <Spinner {progress} />
    </Canvas>
  </div>
</section>

<style>
  /* The section is 3 viewports tall, giving the scroll room to drive the scene. */
  .tall { height: 300vh; position: relative; }
  .sticky { position: sticky; top: 0; height: 100vh; }
</style>
