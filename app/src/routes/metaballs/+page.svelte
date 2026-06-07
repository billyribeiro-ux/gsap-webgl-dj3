<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Metaballs from '$lib/fx/Metaballs.svelte';
</script>

<LessonShell slug="metaballs">
  {#snippet demo()}
    <div class="wrap"><Metaballs /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 380px; }
</style>
