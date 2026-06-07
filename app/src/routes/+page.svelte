<script lang="ts">
  import { lessons } from '$lib/lessons';
  import { ArrowRight, Lightning } from 'phosphor-svelte';
  import CinematicTitle from '$lib/components/CinematicTitle.svelte';

  // Bump `replay` to re-trigger the hero's entrance animation.
  let replay = $state(0);
</script>

<section class="hero">
  <div class="hero__glow" aria-hidden="true"></div>
  <p class="eyebrow"><Lightning size={15} weight="fill" /> The reference project</p>
  <div class="hero__title">
    <CinematicTitle text="MOTION" {replay} />
  </div>
  <p class="hero__lead">
    Eleven cinematic animation techniques, each a real, scoped, TypeScript Svelte&nbsp;5
    component you can read, run and lift straight into your own app. Pair it with the
    HTML textbook in <code>/course</code>.
  </p>
  <button class="replay" onclick={() => (replay += 1)}>Replay intro</button>
</section>

<section class="grid-section">
  <h2 class="section-title">Lessons</h2>
  <div class="grid">
    {#each lessons as lesson (lesson.slug)}
      <a class="card" href="/{lesson.slug}">
        <span class="card__module">{lesson.module}</span>
        <h3>{lesson.title}</h3>
        <p>{lesson.blurb}</p>
        <span class="card__go">Open <ArrowRight size={15} weight="bold" /></span>
      </a>
    {/each}
  </div>
</section>

<style>
  .hero { position: relative; width: min(100% - 2.5rem, var(--container)); margin-inline: auto; padding-block: clamp(3rem, 10vh, 6rem); overflow: hidden; }
  .hero__glow {
    position: absolute;
    inset: -30% -10% auto -10%;
    height: 80%;
    z-index: -1;
    background: radial-gradient(50% 60% at 30% 0%, color-mix(in oklab, var(--accent) 38%, transparent), transparent 70%),
      radial-gradient(45% 55% at 80% 10%, color-mix(in oklab, var(--accent-2) 30%, transparent), transparent 70%);
    filter: blur(10px);
  }
  .eyebrow { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent-2); }
  .hero__title { margin: 0.8rem 0; }
  .hero__lead { max-width: 56ch; font-size: 1.2rem; color: var(--mist-300); }
  .hero__lead code { font-family: var(--font-mono); font-size: 0.9em; background: var(--ink-700); padding: 0.1em 0.4em; border-radius: 6px; }
  .replay {
    margin-top: 1.6rem;
    padding: 0.7rem 1.5rem;
    border-radius: 999px;
    border: 1px solid var(--ink-600);
    background: var(--ink-800);
    color: var(--mist-100);
    transition: border-color 0.3s, transform 0.3s var(--ease-spring);
  }
  .replay:hover { border-color: var(--accent); transform: translateY(-2px); }

  .grid-section { width: min(100% - 2.5rem, var(--container)); margin: 0 auto clamp(3rem, 8vh, 5rem); }
  .section-title { font-size: var(--step-3); color: var(--mist-100); letter-spacing: -0.02em; margin-bottom: 1.5rem; }
  .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
  .card {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.4rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--ink-600);
    background: linear-gradient(180deg, var(--ink-800), var(--ink-700));
    transition: transform 0.5s var(--ease-out-expo), border-color 0.4s;
  }
  .card:hover { transform: translateY(-4px); border-color: var(--ink-500); }
  .card__module { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-2); }
  .card h3 { color: var(--mist-100); font-size: 1.2rem; letter-spacing: -0.01em; }
  .card p { color: var(--mist-400); font-size: 0.9rem; flex: 1; }
  .card__go { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--mist-200); font-weight: 600; font-size: 0.9rem; margin-top: 0.3rem; }
</style>
