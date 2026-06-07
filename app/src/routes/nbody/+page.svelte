<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import NBody from '$lib/fx/NBody.svelte';
</script>

<LessonShell slug="nbody">
  {#snippet demo()}
    <div class="wrap"><NBody /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
