<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import SpringFollow from '$lib/components/SpringFollow.svelte';
</script>

<LessonShell slug="spring">
  {#snippet demo()}
    <SpringFollow />
  {/snippet}
</LessonShell>
