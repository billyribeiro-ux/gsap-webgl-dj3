<script lang="ts">
  // Native scroll-driven animations — no JavaScript, no IntersectionObserver, no
  // GSAP. The browser drives these CSS @keyframes from scroll position itself,
  // off the main thread, so they're buttery even on cheap phones.
  const items = ['Direct', 'Native', 'Buttery', 'Zero JS', 'Off-thread', 'Cinematic'];
</script>

<div class="reel">
  <p class="tip">Scroll this panel ↓</p>
  {#each items as item, i (item)}
    <div class="row" style="--i: {i}">
      <span class="num">{String(i + 1).padStart(2, '0')}</span>
      <span class="word">{item}</span>
    </div>
  {/each}
</div>

<style>
  .reel { height: 100%; overflow-y: auto; scroll-snap-type: y proximity; padding: 40% 1.5rem; }
  .tip { text-align: center; color: #5b6478; font-size: 0.8rem; margin-bottom: 1rem; }

  .row {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.1rem 1.4rem;
    margin: 0 auto 1rem;
    max-width: 360px;
    border-radius: 14px;
    background: #11141f;
    border: 1px solid #1b2030;
    scroll-snap-align: center;

    /* The whole effect: run `reveal` keyframes, but tie their timeline to this
       element entering the scroll container's view, not to wall-clock time. */
    animation: reveal linear both;
    animation-timeline: view();
    /* Play the animation across the band where the element enters and exits. */
    animation-range: entry 5% cover 35%;
  }

  @keyframes reveal {
    from { opacity: 0; transform: translateY(40px) scale(0.92); filter: blur(6px); }
    to { opacity: 1; transform: none; filter: blur(0); }
  }

  .num { font-family: ui-monospace, monospace; color: #19e3d6; font-size: 0.9rem; }
  .word { font-size: 1.4rem; font-weight: 700; color: #f4f6fb; }

  /* Graceful fallback: browsers without scroll-driven animations just show the
     content (no animation-timeline support = the keyframes never run). */
  @supports not (animation-timeline: view()) {
    .row { animation: none; opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .row { animation: none; opacity: 1; }
  }
</style>
