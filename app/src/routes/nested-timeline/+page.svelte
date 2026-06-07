<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import NestedTimeline from '$lib/components/NestedTimeline.svelte';
</script>

<LessonShell slug="nested-timeline">
  {#snippet demo()}
    <NestedTimeline />
  {/snippet}
</LessonShell>

