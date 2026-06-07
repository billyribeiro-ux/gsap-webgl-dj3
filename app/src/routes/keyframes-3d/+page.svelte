<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import FlipCard from '$lib/components/FlipCard.svelte';
</script>

<LessonShell slug="keyframes-3d">
  {#snippet demo()}
    <FlipCard />
  {/snippet}
</LessonShell>
