<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  // A reusable *attachment* — Svelte 5's modern replacement for actions. The
  // element leans toward the pointer, then springs back on leave. Attachments
  // run when the element mounts and return a cleanup function, so there are no
  // leaks and no onMount/onDestroy boilerplate.
  function magnetic(strength = 0.35): Attachment<HTMLElement> {
    return (node) => {
      let raf = 0;

      function move(e: PointerEvent): void {
        const r = node.getBoundingClientRect();
        // Vector from the element's centre to the pointer.
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          node.style.setProperty('--mx', `${x}px`);
          node.style.setProperty('--my', `${y}px`);
        });
      }

      function reset(): void {
        cancelAnimationFrame(raf);
        node.style.setProperty('--mx', '0px');
        node.style.setProperty('--my', '0px');
      }

      node.addEventListener('pointermove', move);
      node.addEventListener('pointerleave', reset);

      // The returned function is the cleanup — Svelte calls it automatically.
      return () => {
        cancelAnimationFrame(raf);
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerleave', reset);
      };
    };
  }
</script>

<button class="cta" {@attach magnetic(0.4)}>
  <span class="cta__label">Get started</span>
  <span class="cta__sheen" aria-hidden="true"></span>
</button>

<style>
  .cta {
    --mx: 0px;
    --my: 0px;
    position: relative;
    overflow: hidden;
    padding: 1rem 2.2rem;
    border: none;
    border-radius: 999px;
    font: 700 1.05rem/1 system-ui, sans-serif;
    color: #0a0414;
    background: linear-gradient(135deg, #7c5cff, #ff5f9e 50%, #19e3d6);
    cursor: pointer;
    /* The magnetic offset + a subtle lift, both eased. transform is GPU-cheap. */
    transform: translate(var(--mx), var(--my));
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 10px 30px -8px #7c5cff99;
  }

  .cta__label { position: relative; z-index: 1; }
  .cta:hover { box-shadow: 0 18px 46px -10px #7c5cffcc; }
  .cta:active { transform: translate(var(--mx), var(--my)) scale(0.97); }

  /* A light sweep that crosses the button on hover. */
  .cta__sheen {
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 30%, #ffffff66 50%, transparent 70%);
    transform: translateX(-120%);
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .cta:hover .cta__sheen { transform: translateX(120%); }

  @media (prefers-reduced-motion: reduce) {
    .cta { transition: none; transform: none; }
    .cta__sheen { display: none; }
  }
</style>
