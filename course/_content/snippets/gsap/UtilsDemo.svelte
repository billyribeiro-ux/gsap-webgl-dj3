<script lang="ts">
  import { gsap } from 'gsap';

  // gsap.utils is a box of pure helper functions you'll use constantly — even in
  // code that has nothing else to do with animation. Here we map a pointer's
  // position to rotation and hue, then snap/randomise on demand.
  let rotation = $state(0);
  let hue = $state(265);

  let pad: HTMLDivElement | undefined = $state();

  // mapRange returns a *reusable function* that remaps one numeric range to another.
  const toRotation = gsap.utils.mapRange(0, 1, -28, 28);
  const toHue = gsap.utils.mapRange(0, 1, 200, 340);

  function move(e: PointerEvent): void {
    if (!pad) return;
    const r = pad.getBoundingClientRect();
    // clamp keeps the normalised value safely inside 0..1.
    const t = gsap.utils.clamp(0, 1, (e.clientX - r.left) / r.width);
    rotation = toRotation(t);
    hue = toHue(t);
  }

  function randomise(): void {
    // random(min, max) → a number; random([..]) → a pick; snap rounds to a step.
    rotation = gsap.utils.snap(5, gsap.utils.random(-28, 28));
    hue = gsap.utils.random([200, 240, 265, 300, 330]);
  }
</script>

<div class="pad" bind:this={pad} onpointermove={move} role="application" aria-label="Drag to remap">
  <div
    class="card"
    style="transform: rotate({rotation}deg); background: linear-gradient(150deg, hsl({hue} 80% 62%), hsl({hue + 40} 70% 40%))"
  >
    <span>{Math.round(rotation)}°</span>
    <small>hue {Math.round(hue)}</small>
  </div>
</div>

<button class="rnd" onclick={randomise}>Randomise</button>

<style>
  .pad { width: min(420px, 92%); height: 220px; display: grid; place-items: center; border-radius: 16px; background: #11141f; border: 1px solid #1b2030; cursor: ew-resize; touch-action: none; }
  .card {
    width: 130px;
    height: 160px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    color: #05060a;
    font-weight: 800;
    box-shadow: 0 20px 50px -20px #000;
    transition: transform 0.2s ease;
  }
  .card span { font-size: 1.6rem; }
  .card small { font-weight: 600; opacity: 0.75; }
  .rnd { margin-top: 1rem; padding: 0.55rem 1.3rem; border-radius: 999px; border: 1px solid #2a3142; background: #11141f; color: #d6dbe6; cursor: pointer; }
  .rnd:hover { border-color: #19e3d6; color: #19e3d6; }
</style>
