<script lang="ts">
  import { gsap } from 'gsap';
  import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
  import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
  import type { Attachment } from 'svelte/attachments';

  gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin);

  // Two free SVG superpowers: DrawSVG animates a stroke into existence, and
  // MotionPath flies any element along an SVG path (with auto-rotation, so a
  // rocket actually banks into its turns).
  const journey: Attachment<SVGSVGElement> = (node) => {
    const q = gsap.utils.selector(node);
    const ctx = gsap.context(() => {
      const path = q('.route')[0] as unknown as SVGPathElement;
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });

      // 1. Draw the route in.
      tl.from(path, { drawSVG: '0%', duration: 1.3, ease: 'power1.inOut' })
        // 2. Fly the rocket along that exact path, rotating to follow it.
        .to(
          q('.rocket'),
          {
            duration: 2.2,
            ease: 'power1.inOut',
            motionPath: {
              path,
              align: path,
              alignOrigin: [0.5, 0.5],
              autoRotate: 90 // the rocket art points up, so offset 90°
            }
          },
          '-=0.5'
        );
    }, node);

    return () => ctx.revert();
  };
</script>

<svg viewBox="0 0 400 240" class="map" {@attach journey} aria-hidden="true">
  <path
    class="route"
    d="M24,200 C90,40 190,40 210,130 S350,250 376,56"
    fill="none"
    stroke="#7c5cff"
    stroke-width="3"
    stroke-linecap="round"
    stroke-dasharray="2 8"
  />
  <g class="rocket">
    <path d="M0,-12 L7,8 L0,3 L-7,8 Z" fill="#19e3d6" />
  </g>
</svg>

<style>
  .map { width: min(460px, 94%); height: auto; overflow: visible; }
</style>
