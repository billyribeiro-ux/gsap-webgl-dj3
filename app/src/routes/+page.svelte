<script lang="ts">
  import { byModule, lessons } from '$lib/lessons';
  import { ArrowRight, Lightning } from 'phosphor-svelte';
  import CinematicTitle from '$lib/components/CinematicTitle.svelte';

  // Bump `replay` to re-trigger the hero's entrance animation.
  let replay = $state(0);
  const groups = byModule();
</script>

<section class="hero">
  <div class="hero__glow" aria-hidden="true"></div>
  <p class="eyebrow"><Lightning size={15} weight="fill" /> The reference project · {lessons.length} live demos</p>
  <div class="hero__title">
    <CinematicTitle text="MOTION" {replay} />
  </div>
  <p class="hero__lead">
    Every technique in the course as a real, scoped, TypeScript Svelte&nbsp;5 component —
    from a first hover transition to a million-particle GPU compute shader. Read the
    teaching in <code>/course</code>; run and lift the code here.
  </p>
  <button class="replay" onclick={() => (replay += 1)}>Replay intro</button>
</section>

{#each groups as group (group.module)}
  <section class="module" style="view-transition-name: mod-{group.module.replace(/\s+/g, '-')}">
    <header class="module__head">
      <h2>{group.module}</h2>
      <span class="count">{group.items.length}</span>
    </header>
    <div class="grid">
      {#each group.items as lesson (lesson.slug)}
        <a class="card" href="/{lesson.slug}" style="view-transition-name: card-{lesson.slug}">
          <h3>{lesson.title}</h3>
          <p>{lesson.blurb}</p>
          <span class="card__go">Open <ArrowRight size={15} weight="bold" /></span>
        </a>
      {/each}
    </div>
  </section>
{/each}

<style>
  .hero { position: relative; width: min(100% - 2.5rem, var(--container)); margin-inline: auto; padding-block: clamp(3rem, 10vh, 6rem); overflow: hidden; }
  .hero__glow {
    position: absolute; inset: -30% -10% auto -10%; height: 80%; z-index: -1;
    background: radial-gradient(50% 60% at 30% 0%, color-mix(in oklab, var(--accent) 38%, transparent), transparent 70%),
      radial-gradient(45% 55% at 80% 10%, color-mix(in oklab, var(--accent-2) 30%, transparent), transparent 70%);
    filter: blur(10px);
  }
  .eyebrow { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent-2); }
  .hero__title { margin: 0.8rem 0; }
  .hero__lead { max-width: 58ch; font-size: 1.2rem; color: var(--mist-300); }
  .hero__lead code { font-family: var(--font-mono); font-size: 0.9em; background: var(--ink-700); padding: 0.1em 0.4em; border-radius: 6px; }
  .replay { margin-top: 1.6rem; padding: 0.7rem 1.5rem; border-radius: 999px; border: 1px solid var(--ink-600); background: var(--ink-800); color: var(--mist-100); transition: border-color 0.3s, transform 0.3s var(--ease-spring); }
  .replay:hover { border-color: var(--accent); transform: translateY(-2px); }

  .module { width: min(100% - 2.5rem, var(--container)); margin: 0 auto clamp(2.5rem, 6vh, 4rem); }
  .module__head { display: flex; align-items: baseline; gap: 0.8rem; margin-bottom: 1.1rem; padding-bottom: 0.6rem; border-bottom: 1px solid var(--ink-600); }
  .module__head h2 { font-size: var(--step-3); color: var(--mist-100); letter-spacing: -0.02em; }
  .count { font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-2); border: 1px solid var(--ink-500); border-radius: 999px; padding: 0.1rem 0.55rem; }

  .grid { display: grid; gap: 0.9rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
  .card {
    display: flex; flex-direction: column; gap: 0.35rem; padding: 1.3rem;
    border-radius: var(--radius-lg); border: 1px solid var(--ink-600);
    background: linear-gradient(180deg, var(--ink-800), var(--ink-700));
    transition: transform 0.5s var(--ease-out-expo), border-color 0.4s;
  }
  .card:hover { transform: translateY(-4px); border-color: var(--ink-500); }
  .card h3 { color: var(--mist-100); font-size: 1.15rem; letter-spacing: -0.01em; }
  .card p { color: var(--mist-400); font-size: 0.88rem; flex: 1; }
  .card__go { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--mist-200); font-weight: 600; font-size: 0.88rem; margin-top: 0.3rem; }
</style>
