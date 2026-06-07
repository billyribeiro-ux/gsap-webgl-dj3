<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import PerfAware from '$lib/components/PerfAware.svelte';
</script>

<LessonShell slug="perf">
  {#snippet demo()}
    <PerfAware />
  {/snippet}
</LessonShell>

