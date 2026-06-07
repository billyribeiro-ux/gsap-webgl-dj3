<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Volumetric from '$lib/fx/Volumetric.svelte';
</script>

<LessonShell slug="volumetrics">
  {#snippet demo()}
    <div class="wrap"><Volumetric /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 420px; }
</style>
