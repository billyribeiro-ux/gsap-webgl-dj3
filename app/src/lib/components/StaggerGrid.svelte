<script lang="ts">
  import { gsap } from 'gsap';
  import type { Attachment } from 'svelte/attachments';

  const COLS = 8;
  const ROWS = 6;
  const cells = Array.from({ length: COLS * ROWS });

  // Advanced stagger: the `grid` + `from` options ripple the animation across
  // two dimensions. 'center' radiates outward like a drop in water; try 'edges',
  // 'end', or [row, col] coordinates for completely different choreography.
  const ripple: Attachment<HTMLElement> = (node) => {
    const ctx = gsap.context(() => {
      gsap.from(node.children, {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center',
        ease: 'back.out(1.7)',
        duration: 0.6,
        stagger: { each: 0.04, grid: [ROWS, COLS], from: 'center' }
      });
    }, node);
    return () => ctx.revert();
  };
</script>

<div class="grid" style="--cols: {COLS}" {@attach ripple}>
  {#each cells as _cell, i (i)}
    <span class="cell"></span>
  {/each}
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 8px; width: min(420px, 92%); }
  .cell { aspect-ratio: 1; border-radius: 6px; background: linear-gradient(135deg, #7c5cff, #19e3d6); }
</style>
