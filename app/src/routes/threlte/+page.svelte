<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ThrelteStage from '$lib/three/ThrelteStage.svelte';
</script>

<LessonShell slug="threlte">
  {#snippet demo()}
    <ThrelteStage />
  {/snippet}
</LessonShell>
