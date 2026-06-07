<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import D3Force from '$lib/components/D3Force.svelte';
</script>

<LessonShell slug="d3-force">
  {#snippet demo()}
    <D3Force />
  {/snippet}
</LessonShell>

