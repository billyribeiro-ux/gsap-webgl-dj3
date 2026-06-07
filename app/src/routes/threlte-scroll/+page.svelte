<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ScrollLinked3D from '$lib/three/ScrollLinked3D.svelte';
</script>

<LessonShell slug="threlte-scroll" fill>
  {#snippet demo()}
    <ScrollLinked3D />
  {/snippet}
</LessonShell>

