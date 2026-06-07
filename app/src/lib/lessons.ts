// The ordered list of demo routes in the reference app. Drives the landing grid
// and the Prev/Next pager. Mirrors the curriculum in the HTML textbook.
export type Lesson = {
  slug: string;
  title: string;
  module: string;
  blurb: string;
};

export const lessons: Lesson[] = [
  { slug: 'easing', title: 'Easing Gallery', module: 'Foundations', blurb: 'Read the feel of six curves at once.' },
  { slug: 'perf', title: 'Performant & Accessible', module: 'Foundations', blurb: 'transform/opacity + reduced motion.' },
  { slug: 'css-transitions', title: 'Magnetic CTA', module: 'CSS', blurb: 'Transitions + a pointer-tracking attachment.' },
  { slug: 'keyframes-3d', title: '3D Flip Card', module: 'CSS', blurb: 'Keyframes + CSS 3D transforms.' },
  { slug: 'scroll-driven', title: 'Scroll-Driven CSS', module: 'CSS', blurb: 'Native animation-timeline reveals.' },
  { slug: 'view-transitions', title: 'View Transitions', module: 'CSS', blurb: 'Morph between states with the VT API.' },
  { slug: 'svg-draw', title: 'SVG Draw-On', module: 'SVG', blurb: 'Self-drawing strokes with dash offsets.' },
  { slug: 'svg-morph', title: 'Shape Morphing', module: 'SVG', blurb: 'MorphSVG flows one path into another.' },
  { slug: 'icons', title: 'Living Icons', module: 'SVG', blurb: 'Animated Phosphor micro-interactions.' },
  { slug: 'svelte-motion', title: 'Transitions & FLIP', module: 'Svelte', blurb: "Svelte's built-in enter/leave + FLIP." },
  { slug: 'spring', title: 'Spring & Tween', module: 'Svelte', blurb: 'Physics-based motion with svelte/motion.' },
  { slug: 'flip-list', title: 'FLIP Reordering', module: 'Svelte', blurb: 'Lists that glide when they sort.' },
  { slug: 'gsap', title: 'First Tween', module: 'GSAP', blurb: 'Staggered reveal with gsap.from.' },
  { slug: 'stagger', title: 'Grid Stagger', module: 'GSAP', blurb: 'Ripple a wave across a grid.' },
  { slug: 'gsap-utils', title: 'gsap.utils', module: 'GSAP', blurb: 'mapRange, clamp, random, snap.' },
  { slug: 'timeline', title: 'Sequenced Hero', module: 'GSAP', blurb: 'One timeline, perfect choreography.' },
  { slug: 'nested-timeline', title: 'Nested Timelines', module: 'GSAP', blurb: 'Reusable child timelines in a master.' },
  { slug: 'scrolltrigger', title: 'Scroll Story', module: 'GSAP', blurb: 'Pin, scrub and parallax on scroll.' },
  { slug: 'horizontal-scroll', title: 'Horizontal Scroll', module: 'GSAP', blurb: 'Vertical scroll becomes sideways travel.' },
  { slug: 'splittext', title: 'Cinematic Headline', module: 'GSAP', blurb: 'The masked SplitText reveal.' },
  { slug: 'motion-path', title: 'MotionPath + DrawSVG', module: 'GSAP', blurb: 'Fly an element along a drawn path.' },
  { slug: 'd3', title: 'Animated Data', module: 'D3', blurb: 'enter / update / exit transitions.' },
  { slug: 'd3-force', title: 'Force Graph', module: 'D3', blurb: 'Physics-driven, draggable network.' },
  { slug: 'three', title: 'First 3D Scene', module: 'Three.js', blurb: 'A lit, spinning mesh in WebGL.' },
  { slug: 'shaders', title: 'Fragment Shader', module: 'Three.js', blurb: 'A flowing aurora from pure math.' },
  { slug: 'threlte', title: 'Declarative 3D', module: 'Threlte', blurb: 'Three.js as Svelte components.' },
  { slug: 'threlte-scroll', title: 'Scroll-Linked 3D', module: 'Threlte', blurb: 'Drive a Threlte scene from scroll.' },
  { slug: 'netflix-hero', title: 'Cinematic Hero', module: 'Capstone', blurb: 'Everything, on one timeline.' },
  { slug: 'apple-reveal', title: 'Product Reveal', module: 'Capstone', blurb: 'Pinned, scrubbed Apple-style story.' },
  { slug: 'title-sequence', title: 'Title Sequence', module: 'Capstone', blurb: 'A Hollywood-grade movie intro.' }
];

export function neighbours(slug: string): { prev?: Lesson; next?: Lesson } {
  const i = lessons.findIndex((l) => l.slug === slug);
  if (i === -1) return {};
  return { prev: lessons[i - 1], next: lessons[i + 1] };
}
