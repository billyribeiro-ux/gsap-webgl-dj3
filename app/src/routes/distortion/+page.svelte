<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import DistortionPlane from '$lib/fx/DistortionPlane.svelte';
</script>

<LessonShell slug="distortion">
  {#snippet demo()}
    <div class="wrap"><DistortionPlane /></div>
  {/snippet}
</LessonShell>


<style>
  .wrap { width: 100%; height: 380px; }
</style>
