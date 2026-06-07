<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import SplitHeadline from '$lib/components/SplitHeadline.svelte';
</script>

<LessonShell slug="splittext">
  {#snippet demo()}
    <SplitHeadline text="Made for the big screen" />
  {/snippet}
</LessonShell>
