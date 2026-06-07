<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Glitch from '$lib/fx/Glitch.svelte';
</script>

<LessonShell slug="glitch">
  {#snippet demo()}
    <Glitch text="SYSTEM FAILURE" />
  {/snippet}
</LessonShell>

