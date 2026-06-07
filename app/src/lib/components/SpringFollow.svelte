<script lang="ts">
  import { Spring } from 'svelte/motion';

  // svelte/motion's Spring (Svelte 5.8+) animates a value with real spring
  // physics. You set `.target`; `.current` chases it, governed by stiffness and
  // damping. It's perfect for anything that should feel physical and
  // interruptible — drag, pointer-follow, springy toggles.
  const coords = new Spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.4 });

  let pad: HTMLDivElement | undefined = $state();

  function move(e: PointerEvent): void {
    if (!pad) return;
    const r = pad.getBoundingClientRect();
    // Just retarget — the spring handles the easing, and if the pointer keeps
    // moving it smoothly redirects mid-flight instead of restarting.
    coords.target = { x: e.clientX - r.left, y: e.clientY - r.top };
  }
</script>

<div class="pad" bind:this={pad} onpointermove={move} role="application" aria-label="Spring follow area">
  <div
    class="dot"
    style="transform: translate(calc({coords.current.x}px - 50%), calc({coords.current.y}px - 50%))"
  ></div>
  <span class="hint">move your pointer</span>
</div>

<!-- Bind sliders straight to the spring's parameters and feel them change live. -->
<div class="controls">
  <label>
    stiffness <b>{coords.stiffness.toFixed(2)}</b>
    <input type="range" min="0.01" max="0.4" step="0.01" bind:value={coords.stiffness} />
  </label>
  <label>
    damping <b>{coords.damping.toFixed(2)}</b>
    <input type="range" min="0.05" max="1" step="0.05" bind:value={coords.damping} />
  </label>
</div>

<style>
  .pad {
    position: relative;
    width: min(420px, 90%);
    height: 240px;
    border-radius: 16px;
    background: #11141f;
    border: 1px solid #1b2030;
    overflow: hidden;
    cursor: crosshair;
    touch-action: none;
  }
  .dot {
    position: absolute;
    top: 0;
    left: 0;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #b79bff, #7c5cff 60%, #19e3d6);
    box-shadow: 0 0 24px #7c5cffaa;
    will-change: transform;
  }
  .hint { position: absolute; bottom: 0.6rem; left: 0.8rem; font-size: 0.72rem; color: #5b6478; pointer-events: none; }
  .controls { display: flex; gap: 1.5rem; margin-top: 1.1rem; flex-wrap: wrap; }
  label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.78rem; color: #8b93a7; }
  b { color: #19e3d6; font-variant-numeric: tabular-nums; }
  input { accent-color: #7c5cff; }
</style>
