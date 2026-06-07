<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import type { Attachment } from 'svelte/attachments';

  gsap.registerPlugin(ScrollTrigger);

  const panels = ['Capture', 'Edit', 'Grade', 'Deliver'];

  // The horizontal-scroll classic: pin a section, then convert the user's VERTICAL
  // scroll into HORIZONTAL movement of a track. The page scrolls down; the gallery
  // moves sideways. Used by Apple, agencies and product tours everywhere.
  const horizontal: Attachment<HTMLElement> = (node) => {
    const ctx = gsap.context(() => {
      const track = node.querySelector('.track') as HTMLElement;
      // How far the track must travel to reveal its last panel.
      const distance = () => track.scrollWidth - node.offsetWidth;

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: node,
          start: 'top top',
          end: () => '+=' + distance(), // scroll distance == horizontal distance
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true // recompute on resize
        }
      });
    }, node);
    return () => ctx.revert();
  };
</script>

<section class="wrap" {@attach horizontal}>
  <div class="track">
    {#each panels as panel, i (panel)}
      <article class="panel" style="--i: {i}">
        <span class="num">0{i + 1}</span>
        <h3>{panel}</h3>
      </article>
    {/each}
  </div>
</section>

<style>
  .wrap { height: 100vh; overflow: hidden; }
  .track { display: flex; height: 100%; width: max-content; }
  .panel {
    width: 80vw;
    height: 100%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4vw;
    border-right: 1px solid #1b2030;
    background: linear-gradient(135deg, hsl(calc(220 + var(--i) * 30) 60% 18%), #05060a);
  }
  .num { font-family: ui-monospace, monospace; color: #19e3d6; font-size: 1rem; }
  .panel h3 { font-size: clamp(2rem, 8vw, 5rem); color: #f4f6fb; letter-spacing: -0.03em; }
</style>
