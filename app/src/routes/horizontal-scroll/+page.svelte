<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import HorizontalScroll from '$lib/components/HorizontalScroll.svelte';
</script>

<LessonShell slug="horizontal-scroll" fill>
  {#snippet demo()}
    <HorizontalScroll />
  {/snippet}
</LessonShell>

