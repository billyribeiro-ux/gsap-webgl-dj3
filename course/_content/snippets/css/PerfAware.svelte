<script lang="ts">
  import { fly } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';

  // Two pillars of professional motion in one component:
  // 1. We only animate transform/opacity (fly does exactly that) — GPU-cheap.
  // 2. We read prefersReducedMotion and collapse the motion to an instant,
  //    accessible swap for users who asked for less movement.
  let open = $state(false);

  // Derived options so the transition adapts to the user's preference.
  let motion = $derived(
    prefersReducedMotion.current ? { y: 0, duration: 0 } : { y: 28, duration: 420 }
  );
</script>

<button class="toggle" onclick={() => (open = !open)} aria-expanded={open}>
  {open ? 'Hide' : 'Reveal'} panel
</button>

{#if open}
  <div class="panel" transition:fly={motion}>
    <strong>Composited &amp; considerate</strong>
    <p>This panel flies in on <code>transform</code> + <code>opacity</code> only — and
      snaps instantly if you prefer reduced motion.</p>
  </div>
{/if}

<style>
  .toggle {
    padding: 0.7rem 1.5rem;
    border-radius: 999px;
    border: none;
    font-weight: 700;
    color: #0a0414;
    background: linear-gradient(135deg, #7c5cff, #19e3d6);
    cursor: pointer;
  }
  .panel {
    margin-top: 1rem;
    max-width: 320px;
    padding: 1.1rem 1.3rem;
    border-radius: 14px;
    background: #11141f;
    border: 1px solid #1b2030;
    /* will-change hints the compositor to promote this layer — use sparingly,
       only on elements you KNOW are about to animate. */
    will-change: transform, opacity;
  }
  .panel strong { color: #f4f6fb; }
  .panel p { margin: 0.3rem 0 0; color: #8b93a7; font-size: 0.9rem; }
  code { font-family: ui-monospace, monospace; color: #19e3d6; }
</style>
