<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Raymarch from '$lib/fx/Raymarch.svelte';
</script>

<LessonShell slug="raymarch">
  {#snippet demo()}
    <div class="wrap"><Raymarch /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
