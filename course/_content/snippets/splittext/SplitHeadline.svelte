<script lang="ts">
  import { gsap } from 'gsap';
  import { SplitText } from 'gsap/SplitText';
  import type { Attachment } from 'svelte/attachments';

  gsap.registerPlugin(SplitText);

  let { text }: { text: string } = $props();

  // The signature "cinematic headline": split the text into individual characters
  // (and lines), then reveal them with a masked, staggered rise. SplitText wraps
  // each character in its own <span> for you — animating that by hand is misery.
  const cinematicReveal: Attachment<HTMLElement> = (node) => {
    let split: SplitText | undefined;

    // Wait for fonts so the split measures the real glyph widths.
    document.fonts.ready.then(() => {
      split = new SplitText(node, {
        type: 'lines,chars',
        linesClass: 'line',
        // mask:'lines' clips each line so characters rise out from behind it —
        // the polished, "premium" version of the effect.
        mask: 'lines'
      });

      gsap.from(split.chars, {
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: { each: 0.025, from: 'start' }
      });
    });

    return () => split?.revert(); // restores the original, un-split markup
  };
</script>

<h1 class="headline" {@attach cinematicReveal}>{text}</h1>

<style>
  .headline {
    font-size: clamp(2.4rem, 9vw, 6rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.02;
    text-align: center;
    max-width: 14ch;
    background: linear-gradient(135deg, #f4f6fb, #aab2c5);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  /* SplitText adds .line per line; we hide overflow so masked chars clip cleanly. */
  .headline :global(.line) { overflow: hidden; }
</style>
