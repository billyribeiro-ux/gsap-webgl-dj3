<script lang="ts">
  import LessonShell from '$lib/components/LessonShell.svelte';
  import Bloom from '$lib/fx/Bloom.svelte';
</script>

<LessonShell slug="bloom">
  {#snippet demo()}
    <div class="wrap"><Bloom /></div>
  {/snippet}
</LessonShell>


<style>
  .wrap { width: 100%; height: 380px; }
</style>
