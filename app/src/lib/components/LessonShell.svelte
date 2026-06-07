<script lang="ts">
  import type { Snippet } from 'svelte';
  import { CaretLeft, CaretRight, ArrowLeft } from 'phosphor-svelte';
  import { lessons, neighbours } from '$lib/lessons';

  // `fill` drops the fixed-height "stage" framing — used by the scroll-driven
  // demo, which needs the real page scroll to drive its ScrollTriggers.
  let { slug, demo, fill = false }: { slug: string; demo: Snippet; fill?: boolean } = $props();

  let entry = $derived(lessons.find((l) => l.slug === slug));
  let nav = $derived(neighbours(slug));

  // Demos use WebGL / GSAP / the DOM, so we only render them in the browser.
  // An $effect runs client-side only, so this also keeps prerendering clean.
  let mounted = $state(false);
  $effect(() => {
    mounted = true;
  });
</script>

<svelte:head>
  <title>{entry?.title ?? 'Lesson'} — MOTION</title>
</svelte:head>

<article class="lesson">
  <a class="back" href="/"><ArrowLeft size={14} weight="bold" /> All lessons</a>

  <header class="head">
    <p class="eyebrow">{entry?.module}</p>
    <h1>{entry?.title}</h1>
    <p class="blurb">{entry?.blurb}</p>
  </header>

  <div class="stage" class:fill>
    {#if mounted}
      {@render demo()}
    {:else}
      <span class="loading">Loading demo…</span>
    {/if}
  </div>

  <nav class="pager">
    {#if nav.prev}
      <a class="pager__link" href="/{nav.prev.slug}">
        <span class="dir"><CaretLeft size={13} weight="bold" /> Previous</span>
        <span class="title">{nav.prev.title}</span>
      </a>
    {:else}
      <span></span>
    {/if}
    {#if nav.next}
      <a class="pager__link pager__link--next" href="/{nav.next.slug}">
        <span class="dir">Next <CaretRight size={13} weight="bold" /></span>
        <span class="title">{nav.next.title}</span>
      </a>
    {/if}
  </nav>
</article>

<style>
  .lesson { width: min(100% - 2.5rem, var(--container)); margin-inline: auto; padding-block: clamp(1.5rem, 5vw, 3.5rem); }
  .back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--mist-400); margin-bottom: 1.5rem; }
  .back:hover { color: var(--accent-2); }

  .head { max-width: 60ch; margin-bottom: 2rem; }
  .eyebrow { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent-2); }
  .head h1 { font-size: var(--step-3); letter-spacing: -0.025em; color: var(--mist-100); margin: 0.4rem 0 0.6rem; }
  .blurb { color: var(--mist-300); font-size: 1.1rem; }

  .stage {
    position: relative;
    min-height: 440px;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--ink-600);
    background:
      radial-gradient(80% 120% at 50% 0%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 70%),
      var(--ink-800);
    overflow: hidden;
  }
  .loading { color: var(--mist-400); font-family: var(--font-mono); font-size: 0.85rem; }

  .stage.fill { min-height: 0; padding: 0; overflow: visible; background: none; border: none; display: block; }

  .pager { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2.5rem; }
  .pager__link {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1.2rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--ink-600);
    background: var(--ink-800);
    transition: transform 0.4s var(--ease-out-expo), border-color 0.3s;
  }
  .pager__link:hover { transform: translateY(-3px); border-color: var(--ink-500); }
  .pager__link--next { text-align: right; }
  .dir { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mist-400); }
  .pager__link--next .dir { justify-content: flex-end; }
  .title { color: var(--mist-100); font-weight: 650; font-size: 1.1rem; }
</style>
