<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import StaggerGrid from '$lib/components/StaggerGrid.svelte';
</script>

<LessonShell slug="stagger">
  {#snippet demo()}
    <StaggerGrid />
  {/snippet}
</LessonShell>

