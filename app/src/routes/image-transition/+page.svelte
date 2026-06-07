<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import DisplaceTransition from '$lib/fx/DisplaceTransition.svelte';
</script>

<LessonShell slug="image-transition">
  {#snippet demo()}
    <div class="wrap"><DisplaceTransition /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 380px; }
</style>
