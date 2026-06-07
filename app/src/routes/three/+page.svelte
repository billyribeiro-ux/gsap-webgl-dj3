<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ThreeScene from '$lib/three/ThreeScene.svelte';
</script>

<LessonShell slug="three">
  {#snippet demo()}
    <div class="canvas-wrap">
      <ThreeScene />
    </div>
  {/snippet}
</LessonShell>

<style>
  .canvas-wrap { width: 100%; height: 400px; }
</style>
