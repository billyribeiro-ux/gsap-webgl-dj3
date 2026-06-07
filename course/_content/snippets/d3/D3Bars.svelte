<script lang="ts">
  import * as d3 from 'd3';

  // D3's magic isn't drawing — it's the *data join*. You bind an array to DOM
  // nodes and describe what happens to nodes that are new (enter), that persist
  // (update), or that are gone (exit). Wrap those in transitions and your chart
  // animates itself whenever the data changes. No manual tweening at all.
  let { data }: { data: number[] } = $props();

  let svgEl: SVGSVGElement | undefined = $state();
  const width = 360;
  const height = 220;

  const color = d3.scaleSequential(d3.interpolateCool);

  // This effect re-runs automatically whenever `data` changes, because it reads
  // `data` (a reactive prop). That's the bridge between Svelte's reactivity and
  // D3's imperative drawing.
  $effect(() => {
    if (!svgEl) return;
    const svg = d3.select(svgEl);

    const x = d3
      .scaleBand<number>()
      .domain(d3.range(data.length))
      .range([0, width])
      .padding(0.18);

    const max = d3.max(data) ?? 1;
    const y = d3.scaleLinear().domain([0, max]).range([height, 0]);
    color.domain([0, max]);

    // A standalone transition we hand to every selection so they share one
    // timing/easing. (d3.transition() types cleanly across selection kinds.)
    const t = d3.transition().duration(750).ease(d3.easeCubicOut);

    svg
      .selectAll<SVGRectElement, number>('rect')
      .data(data)
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('x', (_d, i) => x(i) ?? 0)
            .attr('width', x.bandwidth())
            .attr('rx', 5)
            .attr('y', height) // new bars grow up from the baseline
            .attr('height', 0),
        (update) => update,
        (exit) => exit.transition(t).attr('y', height).attr('height', 0).remove()
      )
      .transition(t)
      .attr('x', (_d, i) => x(i) ?? 0)
      .attr('width', x.bandwidth())
      .attr('y', (d) => y(d))
      .attr('height', (d) => height - y(d))
      .attr('fill', (d) => color(d));
  });
</script>

<svg bind:this={svgEl} viewBox="0 0 {width} {height}" class="chart" role="img" aria-label="Animated bar chart"></svg>

<style>
  .chart { width: min(420px, 92%); height: auto; overflow: visible; }
</style>
