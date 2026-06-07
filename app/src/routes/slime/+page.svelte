<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import SlimeMould from '$lib/fx/SlimeMould.svelte';
</script>

<LessonShell slug="slime">
  {#snippet demo()}
    <div class="wrap"><SlimeMould /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
