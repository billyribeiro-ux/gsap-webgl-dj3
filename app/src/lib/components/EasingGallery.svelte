<script lang="ts">
  // A side-by-side easing gallery. Every tile runs the SAME distance over the
  // SAME duration, looping forever — so the only variable is the easing curve.
  // Watching them together is the fastest way to build an intuition for "feel".
  const eases: { name: string; css: string }[] = [
    { name: 'linear', css: 'linear' },
    { name: 'ease-out', css: 'cubic-bezier(0, 0, 0.2, 1)' },
    { name: 'expo.out', css: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { name: 'back.out', css: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    { name: 'in-out', css: 'cubic-bezier(0.83, 0, 0.17, 1)' },
    { name: 'anticipate', css: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)' }
  ];
</script>

<div class="gallery">
  {#each eases as ease (ease.name)}
    <div class="tile">
      <span class="name">{ease.name}</span>
      <div class="track">
        <span class="dot" style="animation-timing-function: {ease.css}"></span>
      </div>
    </div>
  {/each}
</div>

<style>
  .gallery { display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); width: min(560px, 94%); }
  .tile { padding: 0.9rem 1rem; border-radius: 12px; background: #11141f; border: 1px solid #1b2030; }
  .name { font: 600 0.74rem/1 ui-monospace, monospace; color: #8b93a7; letter-spacing: 0.06em; }
  .track { margin-top: 0.7rem; height: 14px; display: flex; align-items: center; }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c5cff, #19e3d6);
    /* Same keyframes + duration everywhere; only the timing-function differs. */
    animation: slide 2.4s infinite alternate;
  }
  @keyframes slide {
    from { transform: translateX(0); }
    to { transform: translateX(calc(100% + 200px)); }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot { animation: none; }
  }
</style>
