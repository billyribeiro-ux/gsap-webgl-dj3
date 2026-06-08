<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import SortedSplat from '$lib/fx/SortedSplat.svelte';
</script>

<LessonShell slug="sorted-splatting">
  {#snippet demo()}
    <div class="wrap"><SortedSplat /></div>
  {/snippet}
</LessonShell>


<style>
  .wrap { width: 100%; height: 400px; }
</style>
