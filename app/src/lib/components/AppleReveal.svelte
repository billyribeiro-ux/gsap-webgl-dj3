<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import type { Attachment } from 'svelte/attachments';

  gsap.registerPlugin(ScrollTrigger);

  // The Apple product page move: pin the product, then scrub a single timeline so
  // it rotates and scales while captions crossfade through "chapters" — all tied
  // to scroll. One timeline + one ScrollTrigger does the whole sequence.
  const reveal: Attachment<HTMLElement> = (node) => {
    const q = gsap.utils.selector(node);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: node,
          start: 'top top',
          end: '+=2200',
          pin: true,
          scrub: 1
        }
      });

      // Chapter 1 — arrival
      tl.from(q('.product'), { scale: 0.6, autoAlpha: 0, rotateY: -40 }, 0)
        .from(q('.cap-1'), { autoAlpha: 0, y: 30 }, 0.1)
        .to(q('.cap-1'), { autoAlpha: 0, y: -30 }, 1)
        // Chapter 2 — turn to profile, second caption
        .to(q('.product'), { rotateY: 25, scale: 1.05 }, 1)
        .fromTo(q('.cap-2'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0 }, 1.1)
        .to(q('.cap-2'), { autoAlpha: 0, y: -30 }, 2)
        // Chapter 3 — hero shot, final caption
        .to(q('.product'), { rotateY: 0, scale: 1.18 }, 2)
        .fromTo(q('.cap-3'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0 }, 2.1);
    }, node);

    return () => ctx.revert();
  };
</script>

<section class="reveal" {@attach reveal}>
  <div class="stageinner">
    <div class="product" aria-hidden="true">
      <div class="screen"></div>
    </div>
    <p class="cap cap-1">Forged from a single block.</p>
    <p class="cap cap-2">Every angle, considered.</p>
    <p class="cap cap-3">This is Nebula.</p>
  </div>
</section>

<style>
  .reveal { height: 100vh; }
  .stageinner { position: relative; height: 100vh; display: grid; place-items: center; perspective: 1200px; overflow: hidden; }
  .product {
    width: 180px;
    height: 360px;
    border-radius: 36px;
    background: linear-gradient(150deg, #2b2350, #0a0c14);
    border: 1px solid #3a3170;
    box-shadow: 0 40px 120px -30px #7c5cff66;
    transform-style: preserve-3d;
    display: grid;
    place-items: center;
  }
  .screen { width: 80%; height: 88%; border-radius: 26px; background: radial-gradient(120% 80% at 50% 0%, #7c5cff55, #05060a); }
  .cap { position: absolute; bottom: 12%; margin: 0; font-size: clamp(1.2rem, 3.5vw, 2rem); font-weight: 700; color: #f4f6fb; text-align: center; }
</style>
