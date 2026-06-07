<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import IconShowcase from '$lib/components/IconShowcase.svelte';
</script>

<LessonShell slug="icons">
  {#snippet demo()}
    <IconShowcase />
  {/snippet}
</LessonShell>

