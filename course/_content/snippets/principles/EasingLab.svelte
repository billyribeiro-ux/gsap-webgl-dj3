<script lang="ts">
  // A side-by-side easing comparison. Press "Race" and watch how linear motion
  // feels robotic while an eased curve feels alive. Same distance, same time.
  let racing = $state(false);

  // The eases we teach throughout the course, as plain CSS values.
  const eases: { name: string; css: string }[] = [
    { name: 'linear', css: 'linear' },
    { name: 'ease-out-expo', css: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { name: 'ease-spring', css: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  ];

  function race(): void {
    // Toggle off, then on next frame toggle on, so the transition re-runs.
    racing = false;
    requestAnimationFrame(() => requestAnimationFrame(() => (racing = true)));
  }
</script>

<div class="lab">
  {#each eases as ease (ease.name)}
    <div class="track">
      <span class="label">{ease.name}</span>
      <span
        class="puck"
        style="transition: transform 1.4s {ease.css}; transform: translateX({racing ? 'calc(100% - 2.4rem)' : '0'})"
      ></span>
    </div>
  {/each}
</div>

<button class="race" onclick={race}>Race</button>

<style>
  .lab { display: flex; flex-direction: column; gap: 1rem; width: min(420px, 90%); }
  .track {
    position: relative;
    height: 2.4rem;
    border-radius: 999px;
    background: #11141f;
    border: 1px solid #1b2030;
    display: flex;
    align-items: center;
  }
  .label {
    position: absolute;
    left: 0.9rem;
    font: 600 0.72rem/1 ui-monospace, monospace;
    letter-spacing: 0.08em;
    color: #8b93a7;
    pointer-events: none;
  }
  .puck {
    width: 2rem;
    height: 2rem;
    margin: 0 0.2rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c5cff, #19e3d6);
    box-shadow: 0 0 16px #7c5cff88;
  }
  .race {
    margin-top: 1.2rem;
    padding: 0.6rem 1.4rem;
    border-radius: 999px;
    border: none;
    font-weight: 700;
    color: #0a0414;
    background: linear-gradient(135deg, #7c5cff, #19e3d6);
    cursor: pointer;
  }

  @media (prefers-reduced-motion: reduce) {
    .puck { transition: none !important; }
  }
</style>
