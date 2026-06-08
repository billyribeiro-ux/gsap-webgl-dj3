<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Denoiser from '$lib/fx/Denoiser.svelte';
</script>

<LessonShell slug="denoiser">
  {#snippet demo()}
    <div class="wrap"><Denoiser /></div>
  {/snippet}
</LessonShell>


<style>
  .wrap { width: 100%; height: 400px; }
</style>
