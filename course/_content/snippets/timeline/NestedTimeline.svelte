<script lang="ts">
  import { gsap } from 'gsap';
  import type { Attachment } from 'svelte/attachments';

  const cards = ['Capture', 'Compose', 'Cut', 'Color'];

  // A reusable function that returns a self-contained timeline for ONE card.
  // Because timelines are objects, we can build small ones and slot them into a
  // bigger one — the key to keeping complex sequences readable and DRY.
  function cardIn(el: Element): gsap.core.Timeline {
    const q = gsap.utils.selector(el);
    return gsap
      .timeline()
      .from(el, { y: 40, opacity: 0, duration: 0.5, ease: 'expo.out' })
      .from(q('.dot'), { scale: 0, ease: 'back.out(2)', duration: 0.4 }, '-=0.2')
      .from(q('.bar'), { scaleX: 0, transformOrigin: 'left', duration: 0.5 }, '-=0.25');
  }

  const orchestrate: Attachment<HTMLElement> = (node) => {
    const ctx = gsap.context(() => {
      const master = gsap.timeline({ defaults: { ease: 'power2.out' } });
      // Slot each child timeline onto the master, overlapping by 0.35s. Change one
      // child and the master re-times itself automatically.
      node.querySelectorAll('.card').forEach((card, i) => {
        master.add(cardIn(card), i * 0.35);
      });
    }, node);
    return () => ctx.revert();
  };
</script>

<div class="deck" {@attach orchestrate}>
  {#each cards as card (card)}
    <div class="card">
      <span class="dot"></span>
      <strong>{card}</strong>
      <span class="bar"></span>
    </div>
  {/each}
</div>

<style>
  .deck { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; width: min(420px, 92%); }
  .card { padding: 1.1rem; border-radius: 14px; background: #11141f; border: 1px solid #1b2030; display: flex; flex-direction: column; gap: 0.6rem; }
  .dot { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #7c5cff, #19e3d6); }
  strong { color: #f4f6fb; }
  .bar { height: 4px; border-radius: 99px; background: linear-gradient(90deg, #7c5cff, #19e3d6); }
</style>
