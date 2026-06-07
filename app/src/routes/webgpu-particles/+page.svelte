<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import WebGPUParticles from '$lib/fx/WebGPUParticles.svelte';
</script>

<LessonShell slug="webgpu-particles">
  {#snippet demo()}
    <div class="wrap"><WebGPUParticles /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
