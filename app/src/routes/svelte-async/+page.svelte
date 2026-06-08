<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import AsyncData from '$lib/fx/AsyncData.svelte';
</script>

<LessonShell slug="svelte-async">
  {#snippet demo()}
    <AsyncData />
  {/snippet}
</LessonShell>

