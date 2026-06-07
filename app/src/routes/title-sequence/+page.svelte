<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import TitleSequence from '$lib/components/TitleSequence.svelte';
</script>

<LessonShell slug="title-sequence">
  {#snippet demo()}
    <TitleSequence title="The Last Signal" />
  {/snippet}
</LessonShell>

