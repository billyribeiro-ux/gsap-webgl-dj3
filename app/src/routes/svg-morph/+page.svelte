<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import MorphShapes from '$lib/components/MorphShapes.svelte';
</script>

<LessonShell slug="svg-morph">
  {#snippet demo()}
    <MorphShapes />
  {/snippet}
</LessonShell>

