<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';

  // A bespoke cursor: a dot that tracks instantly and a ring that lags behind
  // with a lerp. Over "magnetic" targets the ring grows and snaps to the target's
  // center, while the target itself leans toward the pointer — the interaction
  // language of high-end portfolio sites. Scoped to this scene; native cursor
  // returns the moment you leave it.
  let scene: HTMLDivElement | undefined = $state();
  let dot: HTMLDivElement | undefined = $state();
  let ring: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!scene || !dot || !ring) return;
    const reduce = prefersReducedMotion.current;
    let mx = 0, my = 0, rx = 0, ry = 0;
    let hovering = false;
    let stick: { x: number; y: number } | null = null;
    let currentTarget: HTMLElement | null = null;
    let raf = 0;

    const resetTarget = () => {
      if (currentTarget) currentTarget.style.transform = '';
      currentTarget = null;
    };

    const move = (e: PointerEvent) => {
      const r = scene!.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      const t = (e.target as HTMLElement).closest('.target') as HTMLElement | null;
      if (t) {
        const tr = t.getBoundingClientRect();
        const cx = tr.left - r.left + tr.width / 2;
        const cy = tr.top - r.top + tr.height / 2;
        hovering = true;
        stick = { x: cx, y: cy };
        if (currentTarget && currentTarget !== t) resetTarget();
        currentTarget = t;
        if (!reduce) t.style.transform = `translate(${(mx - cx) * 0.3}px, ${(my - cy) * 0.3}px)`;
      } else {
        hovering = false;
        stick = null;
        resetTarget();
      }
    };
    const leave = () => {
      hovering = false;
      stick = null;
      resetTarget();
    };
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerleave', leave);

    const loop = () => {
      const tx = stick ? stick.x : mx;
      const ty = stick ? stick.y : my;
      const k = reduce ? 1 : 0.2;
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;
      ring!.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${hovering ? 1.9 : 1})`;
      dot!.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      scene!.removeEventListener('pointermove', move);
      scene!.removeEventListener('pointerleave', leave);
      resetTarget();
    };
  });
</script>

<div class="scene" bind:this={scene}>
  <div class="cursor-dot" bind:this={dot}></div>
  <div class="cursor-ring" bind:this={ring}></div>
  <p class="hint">move around — hover the targets</p>
  <div class="targets">
    <button class="target">Explore</button>
    <button class="target">Projects</button>
    <button class="target">Contact</button>
  </div>
</div>

<style>
  .scene {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 320px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 12px;
    background: radial-gradient(80% 80% at 50% 40%, #11122a, #05060a);
    cursor: none; /* hide the native cursor inside the scene */
  }
  .cursor-dot,
  .cursor-ring { position: absolute; top: 0; left: 0; pointer-events: none; border-radius: 50%; will-change: transform; }
  .cursor-dot { width: 8px; height: 8px; background: #19e3d6; box-shadow: 0 0 10px #19e3d6; z-index: 3; }
  .cursor-ring { width: 42px; height: 42px; border: 1.5px solid color-mix(in oklab, #7c5cff 70%, transparent); transition: width 0.2s, height 0.2s; z-index: 2; }

  .targets { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
  .target {
    padding: 0.9rem 1.6rem;
    border-radius: 999px;
    border: 1px solid #2a3142;
    background: #11141f;
    color: #f4f6fb;
    font-weight: 650;
    cursor: none;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s;
  }
  .target:hover { border-color: #7c5cff; }
  .hint { position: absolute; top: 1rem; color: #5b6478; font-size: 0.8rem; pointer-events: none; }

  @media (prefers-reduced-motion: reduce) {
    .cursor-ring { transition: none; }
  }
</style>
