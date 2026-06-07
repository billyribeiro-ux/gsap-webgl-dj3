<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import GameOfLife from '$lib/fx/GameOfLife.svelte';
</script>

<LessonShell slug="game-of-life">
  {#snippet demo()}
    <div class="wrap"><GameOfLife /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
