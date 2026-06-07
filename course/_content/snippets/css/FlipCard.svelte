<script lang="ts">
  // A 3D flip card — the canonical lesson in CSS 3D space. The magic is three
  // properties: `perspective` (how deep the 3D is), `transform-style:
  // preserve-3d` (let children live in real 3D), and `backface-visibility:
  // hidden` (hide a face when it's turned away). Then we just rotateY.
  let flipped = $state(false);
</script>

<button class="scene" class:flipped onclick={() => (flipped = !flipped)} aria-pressed={flipped}>
  <div class="card">
    <div class="face face--front">
      <span class="label">Hover / tap</span>
      <strong>NEBULA</strong>
      <span class="muted">Premium plan</span>
    </div>
    <div class="face face--back">
      <strong>$24<small>/mo</small></strong>
      <span class="muted">Everything, unlocked</span>
    </div>
  </div>
</button>

<style>
  .scene {
    /* perspective makes far edges recede — the smaller the number, the more
       dramatic the 3D. This lives on the parent, not the rotating element. */
    perspective: 1000px;
    width: 240px;
    height: 320px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d; /* children inhabit real 3D space */
    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .scene:hover .card,
  .scene.flipped .card {
    transform: rotateY(180deg);
  }

  .face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 20px;
    border: 1px solid #2a3142;
    backface-visibility: hidden; /* hide whichever side faces away */
    text-align: center;
  }
  .face--front { background: linear-gradient(160deg, #1b1340, #0a0c14); color: #f4f6fb; }
  .face--back {
    background: linear-gradient(160deg, #7c5cff, #19e3d6);
    color: #05060a;
    transform: rotateY(180deg); /* pre-rotate the back so it reads correctly */
  }
  strong { font-size: 2rem; letter-spacing: 0.04em; }
  small { font-size: 0.9rem; opacity: 0.7; }
  .label { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #19e3d6; }
  .muted { font-size: 0.85rem; opacity: 0.7; }

  @media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
  }
</style>
