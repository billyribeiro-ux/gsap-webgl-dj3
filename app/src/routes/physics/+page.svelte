<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ThreePhysics from '$lib/fx/ThreePhysics.svelte';
</script>

<LessonShell slug="physics">
  {#snippet demo()}
    <div class="wrap"><ThreePhysics /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
