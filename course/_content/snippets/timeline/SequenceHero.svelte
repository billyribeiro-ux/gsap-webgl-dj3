<script lang="ts">
  import { gsap } from 'gsap';
  import type { Attachment } from 'svelte/attachments';

  // A timeline sequences many tweens on one playhead. Instead of juggling delays
  // by hand, you append tweens and use the position parameter ('-=0.4', '<', a
  // label) to overlap or offset them. Change one duration and everything after it
  // shifts automatically — that's the whole reason timelines exist.
  const sequence: Attachment<HTMLElement> = (node) => {
    const q = gsap.utils.selector(node); // scoped querySelector
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.6 } });

      tl.from(q('.bar i'), { scaleX: 0, transformOrigin: 'left', duration: 1 })
        .addLabel('reveal', '-=0.3') // a named point we can sync other tweens to
        .from(q('.badge'), { scale: 0, rotate: -90, ease: 'back.out(1.7)' }, 'reveal')
        .from(q('.line'), { yPercent: 120, opacity: 0, stagger: 0.12 }, 'reveal+=0.1')
        .from(q('.cta'), { y: 20, opacity: 0 }, '-=0.2');
    }, node);

    return () => ctx.revert();
  };
</script>

<div class="hero" {@attach sequence}>
  <div class="bar"><i></i></div>
  <div class="badge" aria-hidden="true">★</div>
  <h3 class="line">Now streaming</h3>
  <p class="line">Sequenced with a single GSAP timeline.</p>
  <button class="cta">Play</button>
</div>

<style>
  .hero { width: min(360px, 90%); display: flex; flex-direction: column; align-items: center; gap: 0.7rem; text-align: center; }
  .bar { width: 100%; height: 4px; border-radius: 99px; background: #1b2030; overflow: hidden; }
  .bar i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #7c5cff, #19e3d6); }
  .badge { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 50%; font-size: 1.5rem; color: #0a0414; background: linear-gradient(135deg, #ff5f9e, #7c5cff); }
  .line { margin: 0; color: #f4f6fb; }
  h3.line { font-size: 1.4rem; }
  p.line { color: #8b93a7; font-size: 0.9rem; }
  .cta { margin-top: 0.3rem; padding: 0.55rem 1.4rem; border: none; border-radius: 999px; font-weight: 700; color: #0a0414; background: linear-gradient(135deg, #7c5cff, #19e3d6); cursor: pointer; }
</style>
