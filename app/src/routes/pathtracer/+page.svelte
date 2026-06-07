<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import PathTracer from '$lib/fx/PathTracer.svelte';
</script>

<LessonShell slug="pathtracer">
  {#snippet demo()}
    <div class="wrap"><PathTracer /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 420px; }
</style>
