<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import FlipList from '$lib/components/FlipList.svelte';
</script>

<LessonShell slug="flip-list">
  {#snippet demo()}
    <FlipList />
  {/snippet}
</LessonShell>

