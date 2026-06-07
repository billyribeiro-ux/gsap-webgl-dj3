<script lang="ts">
  import { flushSync } from 'svelte';

  // The View Transitions API animates between two DOM states for you. You change
  // the DOM inside document.startViewTransition(...), and the browser crossfades —
  // or, for elements sharing a `view-transition-name`, *morphs* one into the other.
  type Shot = { id: number; title: string; hue: number };
  const shots: Shot[] = [
    { id: 1, title: 'Aurora', hue: 265 },
    { id: 2, title: 'Tide', hue: 180 },
    { id: 3, title: 'Ember', hue: 330 },
    { id: 4, title: 'Dusk', hue: 220 }
  ];

  let openId = $state<number | null>(null);

  function go(next: number | null): void {
    // Progressive enhancement: if the API is missing, just swap state.
    if (!document.startViewTransition) {
      openId = next;
      return;
    }
    document.startViewTransition(() => {
      openId = next;
      flushSync(); // force Svelte to apply the DOM change *inside* the transition
    });
  }
</script>

<div class="wrap">
  {#if openId === null}
    <div class="grid">
      {#each shots as shot (shot.id)}
        <button
          class="thumb"
          style="--h: {shot.hue}; view-transition-name: shot-{shot.id}"
          onclick={() => go(shot.id)}
        >
          {shot.title}
        </button>
      {/each}
    </div>
  {:else}
    {@const shot = shots.find((s) => s.id === openId)!}
    <button
      class="detail"
      style="--h: {shot.hue}; view-transition-name: shot-{shot.id}"
      onclick={() => go(null)}
    >
      <span>{shot.title}</span>
      <small>click to close</small>
    </button>
  {/if}
</div>

<style>
  .wrap { width: min(420px, 92%); }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
  .thumb {
    aspect-ratio: 4 / 3;
    border: 1px solid #2a3142;
    border-radius: 14px;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    background: linear-gradient(150deg, hsl(var(--h) 80% 60%), hsl(calc(var(--h) + 40) 70% 30%));
  }
  .detail {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 1px solid #2a3142;
    border-radius: 18px;
    color: #fff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    background: linear-gradient(150deg, hsl(var(--h) 80% 60%), hsl(calc(var(--h) + 40) 70% 30%));
  }
  .detail span { font-size: 2rem; font-weight: 800; }
  .detail small { opacity: 0.8; }

  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-group(*)) { animation: none; }
  }
</style>
