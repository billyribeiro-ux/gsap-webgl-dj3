<script lang="ts">
  // What runs everywhere today: the stable {#await} block plus a self-updating
  // value (the shape a live query gives you). The lesson's other panels show the
  // 2026 syntax — top-level `await` and SvelteKit remote functions — that this
  // desugars to once you opt in.
  type Post = { title: string; mins: number };
  const POOL: Post[] = [
    { title: 'Easing & the soul of motion', mins: 8 },
    { title: 'GSAP timelines', mins: 12 },
    { title: 'ScrollTrigger storytelling', mins: 15 },
    { title: 'A path tracer in WGSL', mins: 22 },
    { title: 'Gaussian splatting', mins: 18 }
  ];

  let promise = $state<Promise<Post[]> | null>(null);

  function load(): void {
    // Simulate a server round-trip; in 2026 this is just `await getPosts()`.
    promise = new Promise((resolve) => {
      setTimeout(() => resolve([...POOL].sort(() => Math.random() - 0.5).slice(0, 3)), 900);
    });
  }

  // A value that updates on its own — exactly what `query.live()` surfaces.
  let seconds = $state(0);
  $effect(() => {
    const id = setInterval(() => (seconds += 1), 1000);
    return () => clearInterval(id);
  });
</script>

<div class="demo">
  <button class="load" onclick={load}>Load posts</button>

  {#if promise}
    {#await promise}
      <p class="muted">fetching on the server…</p>
    {:then posts}
      <ul>
        {#each posts as p (p.title)}
          <li><span>{p.title}</span><b>{p.mins}m</b></li>
        {/each}
      </ul>
    {:catch}
      <p class="err">something went wrong</p>
    {/await}
  {/if}

  <p class="live"><span class="dot"></span> live query · connected {seconds}s</p>
</div>

<style>
  .demo { width: min(380px, 92%); display: flex; flex-direction: column; gap: 1rem; }
  .load { align-self: start; padding: 0.6rem 1.3rem; border-radius: 999px; border: none; font-weight: 700; color: #05060a; background: linear-gradient(135deg, #7c5cff, #19e3d6); cursor: pointer; }
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0.9rem; border-radius: 10px; background: #11141f; border: 1px solid #1b2030; color: #d6dbe6; }
  li b { color: #19e3d6; font-variant-numeric: tabular-nums; }
  .muted { color: #8b93a7; } .err { color: #ff5f9e; }
  .live { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #8b93a7; font-family: ui-monospace, monospace; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #19e3d6; box-shadow: 0 0 8px #19e3d6; animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 50% { opacity: 0.3; } }
  @media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
