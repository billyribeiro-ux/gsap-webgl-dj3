<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import GsapReveal from '$lib/components/GsapReveal.svelte';

  const features = [
    { title: 'Fast', body: '60fps, GPU-aware tweens.' },
    { title: 'Precise', body: 'Frame-perfect sequencing.' },
    { title: 'Free', body: 'Every plugin, zero cost.' }
  ];
</script>

<LessonShell slug="gsap">
  {#snippet demo()}
    <GsapReveal {features} />
  {/snippet}
</LessonShell>
