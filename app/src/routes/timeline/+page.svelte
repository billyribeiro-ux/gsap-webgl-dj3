<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import SequenceHero from '$lib/components/SequenceHero.svelte';
</script>

<LessonShell slug="timeline">
  {#snippet demo()}
    <SequenceHero />
  {/snippet}
</LessonShell>
