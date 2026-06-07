<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Boids from '$lib/fx/Boids.svelte';
</script>

<LessonShell slug="boids">
  {#snippet demo()}
    <div class="wrap"><Boids /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
