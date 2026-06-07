<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import FluidSim from '$lib/fx/FluidSim.svelte';
</script>

<LessonShell slug="fluid">
  {#snippet demo()}
    <div class="wrap"><FluidSim /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
