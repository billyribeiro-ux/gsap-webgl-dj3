<script lang="ts">
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  // FLIP = First, Last, Invert, Play. Svelte measures where each keyed item was
  // (First) and where it lands (Last), then animates the difference. You just
  // reorder the array; `animate:flip` makes every item glide to its new slot.
  let items = $state(['Avatar', 'Dune', 'Gravity', 'Inception', 'Tenet', 'Arrival']);

  function shuffle(): void {
    items = [...items].sort(() => Math.random() - 0.5);
  }
  function sortAZ(): void {
    items = [...items].sort((a, b) => a.localeCompare(b));
  }
</script>

<div class="controls">
  <button onclick={shuffle}>Shuffle</button>
  <button onclick={sortAZ}>Sort A–Z</button>
</div>

<ul class="list">
  {#each items as item (item)}
    <!-- The key (item) is essential: it's how Svelte tracks identity across the
         reorder so it knows which node moved where. -->
    <li class="chip" animate:flip={{ duration: 420, easing: quintOut }}>{item}</li>
  {/each}
</ul>

<style>
  .controls { display: flex; gap: 0.6rem; margin-bottom: 1rem; justify-content: center; }
  button { padding: 0.5rem 1.1rem; border-radius: 999px; border: 1px solid #2a3142; background: #11141f; color: #d6dbe6; cursor: pointer; font-size: 0.85rem; }
  button:hover { border-color: #19e3d6; color: #19e3d6; }
  .list { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; max-width: 360px; }
  .chip {
    padding: 0.6rem 1.1rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #1b1340, #11141f);
    border: 1px solid #2a3142;
    color: #f4f6fb;
    font-weight: 600;
    font-size: 0.9rem;
  }
</style>
