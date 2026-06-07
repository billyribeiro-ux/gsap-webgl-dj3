<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Notifications from '$lib/components/Notifications.svelte';
</script>

<LessonShell slug="svelte-motion">
  {#snippet demo()}
    <Notifications />
  {/snippet}
</LessonShell>
