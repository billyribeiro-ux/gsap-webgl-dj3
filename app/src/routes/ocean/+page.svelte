<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Ocean from '$lib/fx/Ocean.svelte';
</script>

<LessonShell slug="ocean">
  {#snippet demo()}
    <div class="wrap"><Ocean /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 440px; }
</style>
