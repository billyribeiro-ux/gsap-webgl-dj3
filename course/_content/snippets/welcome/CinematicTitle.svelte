<script lang="ts">
  // A cinematic title that rises into view, letter by letter.
  // `replay` is bumped by the parent to re-trigger the CSS animation.
  type Props = {
    text?: string;
    /** Change this number to replay the entrance animation. */
    replay?: number;
  };

  let { text = 'MOTION', replay = 0 }: Props = $props();

  // Split into characters so each can be animated on its own delay.
  let chars = $derived<string[]>([...text]);
</script>

<!-- {#key replay} forces Svelte to recreate the node, restarting the CSS
     animation from scratch every time `replay` changes. -->
{#key replay}
  <h2 class="title" aria-label={text}>
    {#each chars as char, i (i)}
      <span class="char" style="--i: {i}" aria-hidden="true">{char}</span>
    {/each}
  </h2>
{/key}

<style>
  .title {
    display: flex;
    gap: 0.02em;
    font-size: clamp(2.5rem, 12vw, 7rem);
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .char {
    display: inline-block;
    /* The gradient lives on the text itself. */
    background: linear-gradient(135deg, #7c5cff, #ff5f9e 45%, #19e3d6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    /* Each character starts below, blurred, invisible... */
    animation: rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    /* ...and is staggered by its index. This is the whole trick. */
    animation-delay: calc(var(--i) * 60ms);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(0.6em) rotateX(-40deg);
      filter: blur(8px);
    }
    to {
      opacity: 1;
      transform: none;
      filter: blur(0);
    }
  }

  /* Never animate for users who asked us not to. */
  @media (prefers-reduced-motion: reduce) {
    .char { animation: none; }
  }
</style>
