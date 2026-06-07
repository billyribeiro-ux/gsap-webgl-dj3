<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import EasingGallery from '$lib/components/EasingGallery.svelte';
</script>

<LessonShell slug="easing">
  {#snippet demo()}
    <EasingGallery />
  {/snippet}
</LessonShell>

