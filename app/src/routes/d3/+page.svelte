<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import D3Bars from '$lib/components/D3Bars.svelte';

  const rand = () => 20 + Math.random() * 80;
  let data = $state<number[]>(Array.from({ length: 6 }, rand));

  function shuffle(): void {
    data = data.map(rand);
  }
  function add(): void {
    if (data.length < 11) data = [...data, rand()];
  }
  function remove(): void {
    if (data.length > 2) data = data.slice(0, -1);
  }
</script>

<LessonShell slug="d3">
  {#snippet demo()}
    <div class="wrap">
      <D3Bars {data} />
      <div class="controls">
        <button onclick={shuffle}>Shuffle</button>
        <button onclick={add}>Add</button>
        <button onclick={remove}>Remove</button>
      </div>
    </div>
  {/snippet}
</LessonShell>

<style>
  .wrap { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
  .controls { display: flex; gap: 0.6rem; }
  button { padding: 0.45rem 1.1rem; border-radius: 999px; border: 1px solid var(--ink-500); background: var(--ink-700); color: var(--mist-200); font-size: 0.85rem; }
  button:hover { border-color: var(--accent-2); color: var(--accent-2); }
</style>
