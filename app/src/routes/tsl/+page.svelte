<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import TSLGradient from '$lib/fx/TSLGradient.svelte';
</script>

<LessonShell slug="tsl">
  {#snippet demo()}
    <div class="wrap"><TSLGradient /></div>
  {/snippet}
</LessonShell>


<style>
  .wrap { width: 100%; height: 380px; }
</style>
