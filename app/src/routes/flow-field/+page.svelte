<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import FlowField from '$lib/fx/FlowField.svelte';
</script>

<LessonShell slug="flow-field">
  {#snippet demo()}
    <div class="wrap"><FlowField /></div>
  {/snippet}
</LessonShell>

<style>
  .wrap { width: 100%; height: 400px; }
</style>
