<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import NetflixHero from '$lib/components/NetflixHero.svelte';
</script>

<LessonShell slug="netflix-hero" fill>
  {#snippet demo()}
    <NetflixHero
      title="The Signal Beyond"
      kicker="Series"
      description="When a deep-space array catches a transmission that predates the universe, one engineer must decide what — or who — is calling back."
    />
  {/snippet}
</LessonShell>
