<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Scramble from '$lib/fx/Scramble.svelte';
</script>

<LessonShell slug="scramble">
  {#snippet demo()}
    <Scramble />
  {/snippet}
</LessonShell>

