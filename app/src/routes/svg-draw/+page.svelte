<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import DrawOn from '$lib/components/DrawOn.svelte';

  let replay = $state(0);
</script>

<LessonShell slug="svg-draw">
  {#snippet demo()}
    <div class="wrap">
      <DrawOn {replay} />
      <button onclick={() => (replay += 1)}>Replay</button>
    </div>
  {/snippet}
</LessonShell>

<style>
  .wrap { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
  button { padding: 0.55rem 1.4rem; border-radius: 999px; border: 1px solid var(--ink-500); background: var(--ink-700); color: var(--mist-200); }
  button:hover { border-color: var(--accent-2); color: var(--accent-2); }
</style>
