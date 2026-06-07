// Single source for GSAP + plugins. Importing from here guarantees every plugin
// is registered exactly once, no matter how many components use it. In your own
// app, always centralise plugin registration like this — registering in multiple
// files is harmless but registering nowhere is a silent no-op bug.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };
