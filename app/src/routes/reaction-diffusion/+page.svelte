<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ReactionDiffusion from '$lib/fx/ReactionDiffusion.svelte';
</script>

<LessonShell slug="reaction-diffusion">
  {#snippet demo()}
    <div class="wrap"><ReactionDiffusion /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
