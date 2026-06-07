<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ButtonEffects from '$lib/components/ButtonEffects.svelte';
</script>

<LessonShell slug="buttons">
  {#snippet demo()}
    <ButtonEffects />
  {/snippet}
</LessonShell>
