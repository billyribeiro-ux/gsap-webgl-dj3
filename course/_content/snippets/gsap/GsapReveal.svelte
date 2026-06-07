<script lang="ts">
  import { gsap } from 'gsap';
  import type { Attachment } from 'svelte/attachments';

  type Feature = { title: string; body: string };

  let { features }: { features: Feature[] } = $props();

  // An attachment that animates the element's children in on mount. We wrap the
  // tween in a gsap.context() scoped to `node`; calling ctx.revert() in cleanup
  // kills every animation it created and restores the original styles. This is
  // THE pattern for using GSAP inside a component without leaks.
  const revealOnMount: Attachment<HTMLElement> = (node) => {
    const ctx = gsap.context(() => {
      gsap.from(node.children, {
        y: 48,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.12 // each child starts 120ms after the previous one
      });
    }, node);

    return () => ctx.revert();
  };
</script>

<div class="row" {@attach revealOnMount}>
  {#each features as feature (feature.title)}
    <article class="card">
      <h3>{feature.title}</h3>
      <p>{feature.body}</p>
    </article>
  {/each}
</div>

<style>
  .row { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); width: min(520px, 92%); }
  .card { padding: 1.2rem; border-radius: 14px; background: #11141f; border: 1px solid #1b2030; }
  .card h3 { margin: 0 0 0.35rem; color: #f4f6fb; font-size: 1rem; }
  .card p { margin: 0; color: #8b93a7; font-size: 0.85rem; }
</style>
