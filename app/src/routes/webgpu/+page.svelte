<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import WebGPUHello from '$lib/fx/WebGPUHello.svelte';
</script>

<LessonShell slug="webgpu">
  {#snippet demo()}
    <div class="wrap"><WebGPUHello /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
