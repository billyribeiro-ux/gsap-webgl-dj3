<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import AudioReactive from '$lib/fx/AudioReactive.svelte';
</script>

<LessonShell slug="audio">
  {#snippet demo()}
    <div class="wrap"><AudioReactive /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 380px; }
</style>
