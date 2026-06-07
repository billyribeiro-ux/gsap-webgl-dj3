<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import MotionPath from '$lib/components/MotionPath.svelte';
</script>

<LessonShell slug="motion-path">
  {#snippet demo()}
    <MotionPath />
  {/snippet}
</LessonShell>

