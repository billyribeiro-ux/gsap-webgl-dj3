<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ShaderPlane from '$lib/three/ShaderPlane.svelte';
</script>

<LessonShell slug="shaders">
  {#snippet demo()}
    <div class="wrap"><ShaderPlane /></div>
  {/snippet}
</LessonShell>


<style>
  .wrap { width: 100%; height: 380px; }
</style>
