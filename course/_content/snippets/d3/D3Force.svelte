<script lang="ts">
  import * as d3 from 'd3';

  // A force simulation treats nodes like charged particles connected by springs.
  // d3 runs the physics; on every "tick" we read each node's computed x/y and
  // update the SVG. Repulsion spreads nodes out, links pull them together, and a
  // centering force keeps the whole graph on screen.
  type Node = d3.SimulationNodeDatum & { id: number };
  type Link = d3.SimulationLinkDatum<Node>;

  const width = 440;
  const height = 280;

  const nodes: Node[] = Array.from({ length: 14 }, (_, id) => ({ id }));
  const links: Link[] = nodes
    .slice(1)
    .map((n, i) => ({ source: n.id, target: Math.floor(Math.random() * (i + 1)) }));

  let svgEl: SVGSVGElement | undefined = $state();

  $effect(() => {
    if (!svgEl) return;
    const svg = d3.select(svgEl);

    const link = svg
      .selectAll<SVGLineElement, Link>('line')
      .data(links)
      .join('line')
      .attr('stroke', '#2a3142')
      .attr('stroke-width', 1.5);

    const node = svg
      .selectAll<SVGCircleElement, Node>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 11)
      .attr('fill', '#7c5cff')
      .attr('stroke', '#19e3d6')
      .attr('stroke-width', 1.5)
      .style('cursor', 'grab');

    const sim = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('link', d3.forceLink<Node, Link>(links).id((d) => d.id).distance(54))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(16))
      .on('tick', () => {
        link
          .attr('x1', (d) => (d.source as Node).x ?? 0)
          .attr('y1', (d) => (d.source as Node).y ?? 0)
          .attr('x2', (d) => (d.target as Node).x ?? 0)
          .attr('y2', (d) => (d.target as Node).y ?? 0);
        node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
      });

    // Drag: pin a node under the pointer (fx/fy), release on end.
    node.call(
      d3
        .drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    return () => sim.stop(); // halt the physics loop on unmount
  });
</script>

<svg bind:this={svgEl} viewBox="0 0 {width} {height}" class="graph" role="img" aria-label="Force-directed graph"></svg>

<style>
  .graph { width: min(460px, 94%); height: auto; }
</style>
