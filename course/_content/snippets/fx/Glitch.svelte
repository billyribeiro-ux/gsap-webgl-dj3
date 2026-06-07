<script lang="ts">
  // A broadcast-grade glitch: two color-split copies of the text (red + cyan)
  // jitter independently via clip-path, scanlines roll over the top, and a
  // timer fires random "datamosh" bursts so it never looks mechanical.
  let { text = 'SYSTEM FAILURE', auto = true }: { text?: string; auto?: boolean } = $props();

  let active = $state(false);

  // Randomly intensify the glitch at irregular intervals — the key to making it
  // feel like a real signal breaking up rather than a CSS loop.
  $effect(() => {
    if (!auto) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          active = true;
          setTimeout(() => (active = false), 120 + Math.random() * 200);
          schedule();
        },
        1400 + Math.random() * 2600
      );
    };
    schedule();
    return () => clearTimeout(t);
  });
</script>

<div
  class="glitch"
  class:active
  data-text={text}
  role="img"
  aria-label={text}
  onpointerenter={() => (active = true)}
  onpointerleave={() => (active = false)}
>
  {text}
  <span class="scanlines" aria-hidden="true"></span>
</div>

<style>
  .glitch {
    position: relative;
    display: inline-block;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: clamp(1.8rem, 7vw, 4.5rem);
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #f4f6fb;
    text-transform: uppercase;
    user-select: none;
  }

  /* The two offset color channels. They sit exactly on top of the text. */
  .glitch::before,
  .glitch::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    clip-path: inset(0 0 0 0);
  }
  .glitch::before { color: #ff2e63; left: 2px; text-shadow: -1px 0 #ff2e63; }
  .glitch::after { color: #19e3d6; left: -2px; text-shadow: 1px 0 #19e3d6; }

  /* Subtle, always-on channel drift. */
  .glitch::before { animation: drift-r 4s steps(40) infinite; }
  .glitch::after { animation: drift-c 5s steps(40) infinite reverse; }

  @keyframes drift-r {
    0%, 100% { clip-path: inset(0 0 95% 0); transform: translateX(0); }
    20% { clip-path: inset(40% 0 40% 0); transform: translateX(-2px); }
    40% { clip-path: inset(75% 0 8% 0); transform: translateX(2px); }
    60% { clip-path: inset(15% 0 65% 0); transform: translateX(-1px); }
    80% { clip-path: inset(60% 0 20% 0); transform: translateX(1px); }
  }
  @keyframes drift-c {
    0%, 100% { clip-path: inset(85% 0 0 0); transform: translateX(0); }
    25% { clip-path: inset(20% 0 55% 0); transform: translateX(2px); }
    50% { clip-path: inset(55% 0 25% 0); transform: translateX(-2px); }
    75% { clip-path: inset(5% 0 80% 0); transform: translateX(1px); }
  }

  /* When active, slam the channels apart and add a hard shake + flicker. */
  .glitch.active::before { animation: smash-r 0.25s steps(2) infinite; left: 6px; }
  .glitch.active::after { animation: smash-c 0.25s steps(2) infinite; left: -6px; }
  .glitch.active { animation: shake 0.18s steps(2) infinite; }

  @keyframes smash-r {
    0% { clip-path: inset(10% 0 60% 0); transform: translate(-8px, -2px); }
    50% { clip-path: inset(70% 0 5% 0); transform: translate(6px, 2px); }
    100% { clip-path: inset(40% 0 30% 0); transform: translate(-4px, 0); }
  }
  @keyframes smash-c {
    0% { clip-path: inset(65% 0 12% 0); transform: translate(8px, 2px); }
    50% { clip-path: inset(8% 0 72% 0); transform: translate(-6px, -2px); }
    100% { clip-path: inset(35% 0 35% 0); transform: translate(4px, 0); }
  }
  @keyframes shake {
    0%, 100% { transform: translate(0); }
    33% { transform: translate(-2px, 1px) skewX(-3deg); }
    66% { transform: translate(2px, -1px) skewX(2deg); }
  }

  /* Scanlines + a faint vignette over the whole thing. */
  .scanlines {
    position: absolute;
    inset: -4px;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent 0 2px,
      rgba(0, 0, 0, 0.28) 2px 3px
    );
    mix-blend-mode: overlay;
    opacity: 0.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .glitch::before,
    .glitch::after,
    .glitch.active,
    .glitch.active::before,
    .glitch.active::after { animation: none; }
    .glitch::before { left: 1px; }
    .glitch::after { left: -1px; }
  }
</style>
