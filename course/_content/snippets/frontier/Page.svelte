<script lang="ts">
  // The 2026 way: `await` data directly — no load function, no {#await} wrapper,
  // no fetch boilerplate. Calling a remote query returns a promise you await right
  // in the markup; the nearest <svelte:boundary> shows loading & error states.
  import { getPosts, getTime } from './data.remote';

  const time = getTime(); // a live query — self-updating
</script>

<svelte:boundary>
  <ul>
    {#each await getPosts() as { title, slug } (slug)}
      <li><a href="/blog/{slug}">{title}</a></li>
    {/each}
  </ul>

  <p>server time: {await time}</p>
  <p>connected: {time.connected}</p>

  {#snippet pending()}
    <p>loading…</p>
  {/snippet}
</svelte:boundary>
