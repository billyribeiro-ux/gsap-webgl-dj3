<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import AppleReveal from '$lib/components/AppleReveal.svelte';
</script>

<LessonShell slug="apple-reveal" fill>
  {#snippet demo()}
    <AppleReveal />
  {/snippet}
</LessonShell>

