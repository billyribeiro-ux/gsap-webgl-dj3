<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ScrollScene from '$lib/components/ScrollScene.svelte';
</script>

<!-- fill mode: the scene is tall and drives the page's own scroll. -->
<LessonShell slug="scrolltrigger" fill>
  {#snippet demo()}
    <ScrollScene />
  {/snippet}
</LessonShell>
