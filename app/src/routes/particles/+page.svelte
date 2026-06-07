<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Particles from '$lib/fx/Particles.svelte';
</script>

<LessonShell slug="particles">
  {#snippet demo()}
    <div class="wrap"><Particles /></div>
  {/snippet}
</LessonShell>


<style>
  .wrap { width: 100%; height: 380px; }
</style>
