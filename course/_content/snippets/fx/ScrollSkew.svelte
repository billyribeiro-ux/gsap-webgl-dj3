<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';

  // The "smooth scroll" signature: content shears slightly in the direction of
  // travel, proportional to scroll *velocity*, then springs back to flat when you
  // stop. It reads as weight and momentum — the Locomotive/Lenis house style —
  // without hijacking the native scrollbar.
  const items = ['Momentum', 'Velocity', 'Inertia', 'Damping', 'Easing', 'Flow', 'Drift', 'Glide'];

  let scroller: HTMLDivElement | undefined = $state();
  let skew = $state(0);

  $effect(() => {
    if (!scroller || prefersReducedMotion.current) return;
    let last = scroller.scrollTop;
    let current = 0;
    let raf = 0;

    const loop = () => {
      const now = scroller!.scrollTop;
      const velocity = now - last;
      last = now;
      // Target skew clamped so fast flicks don't tear the layout apart.
      const target = Math.max(-12, Math.min(12, velocity * 0.4));
      // Critically-damped-ish lerp: snappy toward target, smooth back to 0.
      current += (target - current) * 0.1;
      skew = Math.abs(current) < 0.01 ? 0 : current;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="scroller" bind:this={scroller}>
  <!-- Skew + a touch of vertical stretch scales with speed for a motion-blur feel. -->
  <div class="content" style="transform: skewY({skew}deg) scaleY({1 + Math.abs(skew) * 0.004})">
    {#each items as item, i (item)}
      <div class="card" style="--i: {i}">
        <span class="n">0{i + 1}</span>
        <span class="t">{item}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .scroller {
    width: min(440px, 100%);
    height: 340px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 16px;
    border: 1px solid #1b2030;
    background: #0a0c14;
    scroll-snap-type: y proximity;
  }
  .content { padding: 2rem 1.2rem; transform-origin: center; will-change: transform; }
  .card {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.6rem 1.4rem;
    margin-bottom: 1rem;
    border-radius: 14px;
    background: linear-gradient(135deg, hsl(calc(220 + var(--i) * 18) 55% 16%), #11141f);
    border: 1px solid #1b2030;
    scroll-snap-align: center;
  }
  .n { font-family: ui-monospace, monospace; color: #19e3d6; font-size: 0.85rem; }
  .t { font-size: 1.5rem; font-weight: 700; color: #f4f6fb; letter-spacing: -0.01em; }
</style>
