<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import CustomCursor from '$lib/fx/CustomCursor.svelte';
</script>

<LessonShell slug="cursor">
  {#snippet demo()}
    <div class="wrap"><CustomCursor /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 380px; }
</style>
