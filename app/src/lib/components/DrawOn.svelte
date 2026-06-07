<script lang="ts">
  // The "draw-on" effect: an SVG stroke that paints itself into existence.
  // The trick is two properties — stroke-dasharray (the dash pattern) and
  // stroke-dashoffset (how far the pattern is pushed along the path). Set the
  // dash to the full path length and animate the offset from that length to 0,
  // and the line appears to draw.
  let { replay = 0 }: { replay?: number } = $props();
</script>

{#key replay}
  <svg class="draw" viewBox="0 0 200 200" role="img" aria-label="Animated check mark">
    <!-- The circle and tick share one timeline via staggered delays. -->
    <circle class="ring" cx="100" cy="100" r="84" fill="none" />
    <path class="tick" d="M64 104 L92 132 L140 74" fill="none" />
  </svg>
{/key}

<style>
  .draw {
    width: min(60%, 220px);
    aspect-ratio: 1;
  }

  .ring,
  .tick {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ring {
    stroke: #7c5cff;
    stroke-dasharray: 540;
    stroke-dashoffset: 540;
    animation: draw 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .tick {
    stroke-dasharray: 130;
    stroke-dashoffset: 130;
    animation: draw 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
  }

  @keyframes draw {
    to { stroke-dashoffset: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ring, .tick { animation: none; stroke-dashoffset: 0; }
  }
</style>
