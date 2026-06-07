<script lang="ts">
  import { gsap } from 'gsap';
  import { SplitText } from 'gsap/SplitText';
  import type { Attachment } from 'svelte/attachments';

  gsap.registerPlugin(SplitText);

  type Props = {
    kicker?: string;
    title: string;
    meta?: string[];
    description: string;
  };

  let {
    kicker = 'Series',
    title,
    meta = ['2026', 'TV-MA', '1 Season', 'Sci-Fi Thriller'],
    description
  }: Props = $props();

  // The full cinematic intro: everything you learned, on ONE timeline.
  // backdrop zoom → masked headline → metadata stagger → description → buttons.
  const intro: Attachment<HTMLElement> = (node) => {
    const q = gsap.utils.selector(node);
    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        split = new SplitText(q('.hero__title'), { type: 'lines,chars', mask: 'lines' });

        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from(q('.hero__backdrop'), { scale: 1.25, opacity: 0, duration: 1.6, ease: 'power2.out' })
          .from(q('.hero__kicker'), { y: 16, opacity: 0, duration: 0.6 }, 0.3)
          .from(
            split!.chars,
            { yPercent: 120, opacity: 0, duration: 0.9, stagger: 0.02 },
            0.4
          )
          .from(q('.hero__meta span'), { y: 14, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.3')
          .from(q('.hero__desc'), { y: 14, opacity: 0, duration: 0.6 }, '-=0.2')
          .from(q('.hero__actions > *'), { y: 18, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.25');
      });
    }, node);

    return () => {
      split?.revert();
      ctx.revert();
    };
  };
</script>

<section class="hero" {@attach intro}>
  <div class="hero__backdrop" aria-hidden="true"></div>
  <div class="hero__vignette" aria-hidden="true"></div>

  <div class="hero__content">
    <p class="hero__kicker">{kicker}</p>
    <h1 class="hero__title">{title}</h1>

    <div class="hero__meta">
      {#each meta as item (item)}
        <span>{item}</span>
      {/each}
    </div>

    <p class="hero__desc">{description}</p>

    <div class="hero__actions">
      <button class="btn btn--play">▶ Play</button>
      <button class="btn btn--info">ⓘ More Info</button>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 540px;
    display: flex;
    align-items: flex-end;
    padding: clamp(1.5rem, 5vw, 4rem);
    border-radius: 18px;
    overflow: hidden;
    isolation: isolate;
  }
  .hero__backdrop {
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      radial-gradient(80% 80% at 75% 20%, #3a1d6e, transparent 60%),
      radial-gradient(70% 70% at 20% 80%, #0c3a4a, transparent 60%),
      linear-gradient(120deg, #120a2e, #05060a);
  }
  .hero__vignette {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(0deg, #05060a 4%, transparent 55%),
               linear-gradient(90deg, #05060aee 0%, transparent 55%);
  }
  .hero__content { max-width: 46ch; }
  .hero__kicker {
    margin: 0 0 0.6rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    font-size: 0.8rem;
    color: #19e3d6;
  }
  .hero__title {
    margin: 0;
    font-size: clamp(2.6rem, 8vw, 5.5rem);
    line-height: 0.98;
    letter-spacing: -0.03em;
    font-weight: 800;
    color: #fff;
  }
  .hero__title :global(.line) { overflow: hidden; }
  .hero__meta { display: flex; flex-wrap: wrap; gap: 0.9rem; margin: 1.1rem 0; color: #d6dbe6; font-weight: 600; font-size: 0.9rem; }
  .hero__meta span { display: inline-flex; align-items: center; }
  .hero__meta span + span::before { content: '•'; margin-right: 0.9rem; color: #5b6478; }
  .hero__desc { margin: 0 0 1.5rem; color: #aab2c5; line-height: 1.6; }
  .hero__actions { display: flex; gap: 0.8rem; flex-wrap: wrap; }
  .btn { padding: 0.85rem 1.8rem; border-radius: 8px; border: none; font-weight: 700; font-size: 1rem; cursor: pointer; }
  .btn--play { background: #fff; color: #05060a; }
  .btn--info { background: #ffffff26; color: #fff; backdrop-filter: blur(6px); }

  @media (prefers-reduced-motion: reduce) {
    .hero__backdrop { transform: none !important; }
  }
</style>
