<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // ─── Two attachments power the two "advanced" buttons ───────────────────────

  // Magnetic: the button leans toward the pointer, then springs back on leave.
  function magnetic(strength = 0.4): Attachment<HTMLElement> {
    return (node) => {
      let raf = 0;
      const move = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          node.style.setProperty('--mx', `${x}px`);
          node.style.setProperty('--my', `${y}px`);
        });
      };
      const reset = () => {
        cancelAnimationFrame(raf);
        node.style.setProperty('--mx', '0px');
        node.style.setProperty('--my', '0px');
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerleave', reset);
      return () => {
        cancelAnimationFrame(raf);
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerleave', reset);
      };
    };
  }

  // Particle burst: each click sprays short-lived dots from the click point,
  // animated with the Web Animations API so there's no per-frame bookkeeping.
  function burst(): Attachment<HTMLElement> {
    return (node) => {
      const onClick = (e: MouseEvent) => {
        const r = node.getBoundingClientRect();
        const cx = e.clientX - r.left;
        const cy = e.clientY - r.top;
        const COUNT = 16;
        for (let i = 0; i < COUNT; i++) {
          const p = document.createElement('span');
          p.className = 'particle';
          node.appendChild(p);
          const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.4;
          const dist = 26 + Math.random() * 46;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          p.animate(
            [
              { transform: `translate(${cx}px, ${cy}px) scale(1)`, opacity: 1 },
              { transform: `translate(${cx + dx}px, ${cy + dy}px) scale(0)`, opacity: 0 }
            ],
            { duration: 620 + Math.random() * 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
          ).onfinish = () => p.remove();
        }
      };
      node.addEventListener('click', onClick);
      return () => node.removeEventListener('click', onClick);
    };
  }
</script>

<div class="gallery">
  <!-- 1 · Fill up — the simplest: a layer scales up from the bottom on hover. -->
  <button class="btn fx-fill">Fill up</button>

  <!-- 2 · Slide fill — same idea, swept in from the left. -->
  <button class="btn fx-slide">Slide fill</button>

  <!-- 3 · Border draw — two corners draw the outline in an L, meeting in the middle. -->
  <button class="btn fx-border">Border draw</button>

  <!-- 4 · Shine — a gloss sweeps across the surface. -->
  <button class="btn fx-shine">Shine</button>

  <!-- 5 · Label swap — the text slides up and a new line slides in. -->
  <button class="btn fx-swap">
    <span class="swap">
      <span>Hover me</span>
      <span>Let's go →</span>
    </span>
  </button>

  <!-- 6 · Icon reveal — an arrow slides in as the label shifts to make room. -->
  <button class="btn fx-icon"><span class="ico">→</span><span class="lbl">Continue</span></button>

  <!-- 7 · Animated gradient — the gradient drifts on hover. -->
  <button class="btn fx-gradient">Gradient</button>

  <!-- 8 · Neon glow — the border lights up and pulses. -->
  <button class="btn fx-glow">Neon glow</button>

  <!-- 9 · Magnetic — follows the pointer with a spring (attachment). -->
  <button class="btn fx-magnetic" {@attach magnetic(0.4)}>Magnetic</button>

  <!-- 10 · Particle burst — sprays particles on click (attachment + WAAPI). -->
  <button class="btn fx-burst" {@attach burst()}>Click me ✦</button>
</div>

<style>
  .gallery {
    --a: #7c5cff;
    --a2: #19e3d6;
    --a3: #ff5f9e;
    --ink: #05060a;
    --ease: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    width: min(560px, 94%);
  }

  /* Shared base — every effect builds on this. */
  .btn {
    position: relative;
    isolation: isolate;
    padding: 0.9rem 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--a);
    background: transparent;
    color: #f4f6fb;
    font-weight: 650;
    font-size: 0.95rem;
    cursor: pointer;
    overflow: hidden;
    transition: color 0.4s var(--ease);
  }

  /* 1 · Fill up */
  .fx-fill::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(180deg, var(--a), var(--a2));
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.45s var(--ease);
  }
  .fx-fill:hover { color: var(--ink); }
  .fx-fill:hover::before { transform: scaleY(1); }

  /* 2 · Slide fill */
  .fx-slide::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(90deg, var(--a), var(--a3));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.45s var(--ease);
  }
  .fx-slide:hover { color: var(--ink); }
  .fx-slide:hover::before { transform: scaleX(1); }

  /* 3 · Border draw */
  .fx-border { border-color: transparent; }
  .fx-border::before,
  .fx-border::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-radius: 12px;
  }
  .fx-border::before { top: 0; left: 0; border-top: 2px solid var(--a2); border-left: 2px solid var(--a2); }
  .fx-border::after { bottom: 0; right: 0; border-bottom: 2px solid var(--a2); border-right: 2px solid var(--a2); }
  .fx-border::before,
  .fx-border::after { transition: width 0.25s var(--ease) 0.25s, height 0.25s var(--ease); }
  .fx-border:hover::before,
  .fx-border:hover::after { width: 100%; height: 100%; }

  /* 4 · Shine */
  .fx-shine { background: #11141f; border-color: #2a3142; }
  .fx-shine::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 30%, #ffffff55 50%, transparent 70%);
    transform: translateX(-130%);
    transition: transform 0.7s var(--ease);
  }
  .fx-shine:hover::before { transform: translateX(130%); }

  /* 5 · Label swap */
  .fx-swap .swap { display: grid; }
  .fx-swap .swap span { grid-area: 1 / 1; transition: transform 0.45s var(--ease); }
  .fx-swap .swap span:nth-child(2) { transform: translateY(160%); }
  .fx-swap:hover .swap span:nth-child(1) { transform: translateY(-160%); }
  .fx-swap:hover .swap span:nth-child(2) { transform: translateY(0); }

  /* 6 · Icon reveal */
  .fx-icon .ico { display: inline-block; width: 0; opacity: 0; transform: translateX(-10px); transition: all 0.4s var(--ease); }
  .fx-icon .lbl { display: inline-block; transition: transform 0.4s var(--ease); }
  .fx-icon:hover .ico { width: 1.1em; opacity: 1; transform: translateX(0); }
  .fx-icon:hover .lbl { transform: translateX(4px); }

  /* 7 · Animated gradient */
  .fx-gradient {
    border: none;
    color: var(--ink);
    background: linear-gradient(120deg, var(--a), var(--a3), var(--a2), var(--a));
    background-size: 300% 100%;
    background-position: 0% 50%;
    transition: background-position 0.7s var(--ease), box-shadow 0.4s var(--ease);
  }
  .fx-gradient:hover { background-position: 100% 50%; box-shadow: 0 12px 34px -10px var(--a); }

  /* 8 · Neon glow */
  .fx-glow { border-color: var(--a2); color: var(--a2); transition: box-shadow 0.4s var(--ease), color 0.4s, text-shadow 0.4s; }
  .fx-glow:hover {
    color: #eafffd;
    text-shadow: 0 0 10px var(--a2);
    box-shadow: 0 0 6px var(--a2), 0 0 22px var(--a2), inset 0 0 12px color-mix(in oklab, var(--a2) 30%, transparent);
    animation: glow-pulse 1.4s ease-in-out infinite;
  }
  @keyframes glow-pulse {
    50% { box-shadow: 0 0 10px var(--a2), 0 0 34px var(--a2), inset 0 0 18px color-mix(in oklab, var(--a2) 45%, transparent); }
  }

  /* 9 · Magnetic */
  .fx-magnetic {
    --mx: 0px;
    --my: 0px;
    border: none;
    color: var(--ink);
    background: linear-gradient(135deg, var(--a), var(--a2));
    transform: translate(var(--mx), var(--my));
    transition: transform 0.5s var(--ease-spring), box-shadow 0.4s var(--ease);
  }
  .fx-magnetic:hover { box-shadow: 0 16px 40px -12px var(--a); }
  .fx-magnetic:active { transform: translate(var(--mx), var(--my)) scale(0.96); }

  /* 10 · Particle burst */
  .fx-burst {
    overflow: visible;
    border: none;
    color: var(--ink);
    background: linear-gradient(135deg, var(--a3), var(--a));
  }
  .fx-burst :global(.particle) {
    position: absolute;
    top: 0;
    left: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--a2);
    pointer-events: none;
    z-index: 2;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn,
    .btn::before,
    .btn::after { transition: none !important; animation: none !important; }
    .fx-magnetic { transform: none !important; }
  }
</style>
