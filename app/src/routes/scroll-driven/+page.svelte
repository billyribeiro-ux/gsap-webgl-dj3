<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import ScrollReveal from '$lib/components/ScrollReveal.svelte';
</script>

<LessonShell slug="scroll-driven">
  {#snippet demo()}
    <div class="frame">
      <ScrollReveal />
    </div>
  {/snippet}
</LessonShell>

<style>
  /* Give the native scroll-driven demo its own scroll container. */
  .frame { width: min(440px, 100%); height: 380px; border-radius: 16px; border: 1px solid var(--ink-600); overflow: hidden; }
</style>
