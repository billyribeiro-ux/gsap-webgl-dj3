<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';

  // The "decode" effect: text resolves out of a storm of random glyphs, one
  // character locking into place at a time. Each slot gets a random start/end
  // frame, so the resolve looks organic rather than a clean left-to-right wipe.
  // We render per-character spans (no {@html}) so it stays XSS-safe.
  let { text = 'ACCESS GRANTED' }: { text?: string } = $props();

  type Slot = { char: string; solved: boolean };

  const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCXYZ';
  let slots = $state<Slot[]>([]);
  let raf = 0;

  function scramble(target: string): void {
    cancelAnimationFrame(raf);

    const meta = [...target].map((to) => {
      const start = Math.floor(Math.random() * 18);
      return { to, start, end: start + 10 + Math.floor(Math.random() * 22) };
    });

    if (prefersReducedMotion.current) {
      slots = meta.map((m) => ({ char: m.to, solved: true }));
      return;
    }

    const cache: string[] = meta.map(() => ' ');
    let frame = 0;
    const tick = () => {
      let done = 0;
      slots = meta.map((m, i) => {
        if (frame >= m.end) {
          done++;
          return { char: m.to, solved: true };
        }
        if (frame >= m.start) {
          if (cache[i] === ' ' || Math.random() < 0.28) {
            cache[i] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          return { char: cache[i], solved: false };
        }
        return { char: ' ', solved: false };
      });
      if (done === meta.length) return;
      frame++;
      raf = requestAnimationFrame(tick);
    };
    tick();
  }

  // Decode once on mount.
  $effect(() => {
    scramble(text);
    return () => cancelAnimationFrame(raf);
  });
</script>

<button class="decode" aria-label={text} onpointerenter={() => scramble(text)}>
  <span aria-hidden="true">
    {#each slots as slot, i (i)}<span class="cell" class:ghost={!slot.solved}>{slot.char}</span>{/each}
  </span>
</button>

<style>
  .decode {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: clamp(1.4rem, 5vw, 2.6rem);
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #19e3d6;
    background: none;
    border: 1px solid color-mix(in oklab, #19e3d6 35%, transparent);
    border-radius: 10px;
    padding: 0.8rem 1.4rem;
    cursor: pointer;
    white-space: pre;
    text-shadow: 0 0 12px color-mix(in oklab, #19e3d6 50%, transparent);
    transition: box-shadow 0.3s, border-color 0.3s;
  }
  .decode:hover { border-color: #19e3d6; box-shadow: 0 0 24px -6px #19e3d6; }
  .cell { display: inline-block; }
  /* The mid-resolve glyphs are dimmed so the locked characters read as "solved". */
  .ghost { color: color-mix(in oklab, #19e3d6 55%, #5b6478); }
</style>
