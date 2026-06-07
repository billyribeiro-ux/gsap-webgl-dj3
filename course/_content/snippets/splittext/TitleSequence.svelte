<script lang="ts">
  import { gsap } from 'gsap';
  import { SplitText } from 'gsap/SplitText';
  import type { Attachment } from 'svelte/attachments';

  gsap.registerPlugin(SplitText);

  type Props = { studio?: string; title: string; subtitle?: string; replay?: number };
  let { studio = 'NEBULA PICTURES', title, subtitle = 'In cinemas everywhere', replay = 0 }: Props = $props();

  // A film-title sequence: studio card fades through, a light sweeps, the title
  // resolves from a wide, blurred, dim state into sharp focus — then the subtitle
  // settles. It's a master timeline composed of beats you already know.
  const sequence: Attachment<HTMLElement> = (node) => {
    const q = gsap.utils.selector(node);
    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        split = new SplitText(q('.title'), { type: 'chars' });

        const tl = gsap.timeline();
        tl.from(q('.studio'), { autoAlpha: 0, letterSpacing: '0.6em', duration: 1, ease: 'power2.out' })
          .to(q('.studio'), { autoAlpha: 0, duration: 0.6 }, '+=0.6')
          .to(q('.flare'), { xPercent: 220, duration: 1.1, ease: 'power2.inOut' }, '-=0.3')
          // The title resolves into focus: from wide + blurred + dim to sharp.
          .from(
            split!.chars,
            {
              autoAlpha: 0,
              filter: 'blur(14px)',
              scale: 1.6,
              duration: 1.1,
              ease: 'expo.out',
              stagger: { each: 0.04, from: 'center' }
            },
            '-=0.5'
          )
          .from(q('.subtitle'), { autoAlpha: 0, y: 14, letterSpacing: '0.1em', duration: 0.8, ease: 'power2.out' }, '-=0.3');
      });
    }, node);

    return () => {
      split?.revert();
      ctx.revert();
    };
  };
</script>

{#key replay}
  <div class="frame" {@attach sequence}>
    <div class="vignette" aria-hidden="true"></div>
    <span class="flare" aria-hidden="true"></span>
    <p class="studio">{studio}</p>
    <h1 class="title">{title}</h1>
    <p class="subtitle">{subtitle}</p>
  </div>
{/key}

<style>
  .frame {
    position: relative;
    width: 100%;
    min-height: 360px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: radial-gradient(120% 90% at 50% 40%, #15102e, #05060a 70%);
    isolation: isolate;
  }
  .vignette { position: absolute; inset: 0; box-shadow: inset 0 0 160px 40px #05060a; pointer-events: none; }
  .flare {
    position: absolute;
    top: 0;
    left: -40%;
    width: 30%;
    height: 100%;
    background: linear-gradient(100deg, transparent, #ffffff22 50%, transparent);
    transform: skewX(-12deg);
    pointer-events: none;
  }
  .studio { position: absolute; margin: 0; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.4em; color: #aab2c5; }
  .title { margin: 0; font-size: clamp(2rem, 8vw, 5rem); font-weight: 800; letter-spacing: 0.02em; color: #fff; text-align: center; }
  .subtitle { position: absolute; bottom: 14%; margin: 0; font-size: 0.95rem; letter-spacing: 0.25em; text-transform: uppercase; color: #8b93a7; }

  @media (prefers-reduced-motion: reduce) {
    .flare { display: none; }
  }
</style>
