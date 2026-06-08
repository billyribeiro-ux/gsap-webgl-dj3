<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import WebLLM from '$lib/fx/WebLLM.svelte';
</script>

<LessonShell slug="webllm">
  {#snippet demo()}
    <WebLLM />
  {/snippet}
</LessonShell>

