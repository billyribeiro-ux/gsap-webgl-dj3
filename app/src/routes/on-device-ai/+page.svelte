<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import OnDeviceAI from '$lib/fx/OnDeviceAI.svelte';
</script>

<LessonShell slug="on-device-ai">
  {#snippet demo()}
    <OnDeviceAI />
  {/snippet}
</LessonShell>

