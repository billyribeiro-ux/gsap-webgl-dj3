<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import GaussianSplat from '$lib/fx/GaussianSplat.svelte';
</script>

<LessonShell slug="splatting">
  {#snippet demo()}
    <div class="wrap"><GaussianSplat /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 440px; }
</style>
