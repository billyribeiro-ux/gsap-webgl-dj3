// The ordered list of demo routes in the reference app. Drives the landing grid
// and the Prev/Next pager. Mirrors the curriculum in the HTML textbook.
export type Lesson = {
  slug: string;
  title: string;
  module: string;
  blurb: string;
};

export const lessons: Lesson[] = [
  { slug: 'css-transitions', title: 'Magnetic CTA', module: 'CSS', blurb: 'Transitions + a pointer-tracking attachment.' },
  { slug: 'svg-draw', title: 'SVG Draw-On', module: 'SVG', blurb: 'Self-drawing strokes with dash offsets.' },
  { slug: 'svelte-motion', title: 'Transitions & FLIP', module: 'Svelte', blurb: "Svelte's built-in enter/leave + FLIP." },
  { slug: 'gsap', title: 'First Tween', module: 'GSAP', blurb: 'Staggered reveal with gsap.from.' },
  { slug: 'timeline', title: 'Sequenced Hero', module: 'GSAP', blurb: 'One timeline, perfect choreography.' },
  { slug: 'scrolltrigger', title: 'Scroll Story', module: 'GSAP', blurb: 'Pin, scrub and parallax on scroll.' },
  { slug: 'splittext', title: 'Cinematic Headline', module: 'GSAP', blurb: 'The masked SplitText reveal.' },
  { slug: 'd3', title: 'Animated Data', module: 'D3', blurb: 'enter / update / exit transitions.' },
  { slug: 'three', title: 'First 3D Scene', module: 'Three.js', blurb: 'A lit, spinning mesh in WebGL.' },
  { slug: 'threlte', title: 'Declarative 3D', module: 'Threlte', blurb: 'Three.js as Svelte components.' },
  { slug: 'netflix-hero', title: 'Cinematic Hero', module: 'Capstone', blurb: 'Everything, on one timeline.' }
];

export function neighbours(slug: string): { prev?: Lesson; next?: Lesson } {
  const i = lessons.findIndex((l) => l.slug === slug);
  if (i === -1) return {};
  return { prev: lessons[i - 1], next: lessons[i + 1] };
}
