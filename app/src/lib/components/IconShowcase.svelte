<script lang="ts">
  import { Heart, BellRinging, Sun, Lightning } from 'phosphor-svelte';

  // phosphor-svelte gives you 9,000+ icons as tree-shakeable components. Because
  // they render real <svg>, you can animate them like any element — and the
  // `weight` prop lets you swap between thin/regular/bold/fill/duotone instantly.
  let liked = $state(false);
</script>

<div class="row">
  <!-- A "like" with a pop + a weight swap (outline → fill) on toggle. -->
  <button class="icon like" class:liked onclick={() => (liked = !liked)} aria-pressed={liked} aria-label="Like">
    <Heart size={30} weight={liked ? 'fill' : 'regular'} />
  </button>

  <!-- Hover to ring the bell (CSS rotation on the SVG). -->
  <span class="icon bell" aria-hidden="true"><BellRinging size={30} weight="regular" /></span>

  <!-- Hover to spin the sun. -->
  <span class="icon sun" aria-hidden="true"><Sun size={30} weight="regular" /></span>

  <!-- A pulsing accent. -->
  <span class="icon bolt" aria-hidden="true"><Lightning size={30} weight="fill" /></span>
</div>

<style>
  .row { display: flex; gap: 1rem; }
  .icon {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: #11141f;
    border: 1px solid #1b2030;
    color: #aab2c5;
    transition: color 0.3s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s;
  }
  .icon:hover { color: #f4f6fb; border-color: #2a3142; }

  .like { cursor: pointer; }
  .like.liked { color: #ff5f9e; }
  .like:active { transform: scale(0.9); }
  .like.liked { animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes pop { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }

  .bell:hover :global(svg) { animation: ring 0.6s ease; transform-origin: top center; color: #19e3d6; }
  @keyframes ring { 0%,100% { transform: rotate(0); } 20% { transform: rotate(14deg); } 40% { transform: rotate(-12deg); } 60% { transform: rotate(8deg); } 80% { transform: rotate(-4deg); } }

  .sun:hover :global(svg) { animation: spin 4s linear infinite; color: #ffce4a; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .bolt { color: #7c5cff; }
  .bolt :global(svg) { animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }

  @media (prefers-reduced-motion: reduce) {
    .icon :global(svg), .like.liked { animation: none !important; }
  }
</style>
