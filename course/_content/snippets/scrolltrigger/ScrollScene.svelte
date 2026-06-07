<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import type { Attachment } from 'svelte/attachments';

  // Register the plugin once. In a real app, do this in a shared module
  // (src/lib/gsap.ts) so it only runs a single time — see the course app.
  gsap.registerPlugin(ScrollTrigger);

  // This attachment wires three scroll-driven effects to a section:
  //   1. a pinned panel that stays put while you scroll "through" it
  //   2. layers that parallax at different speeds for depth
  //   3. a headline whose progress is *scrubbed* directly by the scrollbar
  const scrollScene: Attachment<HTMLElement> = (node) => {
    const q = gsap.utils.selector(node);
    const ctx = gsap.context(() => {
      // Parallax: background drifts slower than foreground = perceived depth.
      gsap.to(q('.bg'), {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: { trigger: node, start: 'top bottom', end: 'bottom top', scrub: true }
      });

      // Scrub: tie the headline's reveal directly to scroll position. With
      // scrub:true the animation has no duration of its own — the scrollbar IS
      // the playhead, so scrolling back rewinds it.
      gsap.from(q('.headline'), {
        scale: 0.7,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: node, start: 'top center', end: 'center center', scrub: true }
      });

      // Pin: freeze the card in place for one viewport of scrolling, then release.
      ScrollTrigger.create({
        trigger: q('.pin'),
        start: 'center center',
        end: '+=400',
        pin: true,
        pinSpacing: true
      });
    }, node);

    return () => ctx.revert(); // kills tweens AND their ScrollTriggers
  };
</script>

<section class="scene" {@attach scrollScene}>
  <div class="bg" aria-hidden="true"></div>
  <h2 class="headline">Scroll writes the story</h2>
  <div class="pin">Pinned while you scroll</div>
</section>

<style>
  .scene { position: relative; min-height: 220vh; display: grid; place-items: center; overflow: clip; }
  .bg { position: absolute; inset: -20% 0; background: radial-gradient(40% 40% at 50% 30%, #7c5cff55, transparent); }
  .headline { font-size: clamp(2rem, 6vw, 4rem); color: #f4f6fb; text-align: center; }
  .pin { padding: 1rem 2rem; border-radius: 14px; background: #11141f; border: 1px solid #1b2030; color: #d6dbe6; }
</style>
