/* ============================================================================
   build.mjs — the course's tiny static generator (Node 24, ESM, zero deps).
   ----------------------------------------------------------------------------
   Why a generator? Every lesson page shares the exact same chrome (head, top
   bar, header, pager, footer, script includes). Rather than copy-paste that
   into 30+ files, we author only the lesson BODY as a fragment in
   `_content/<slug>.html` and wrap it here. Lessons without a fragment get a
   clean, still-useful "expandable" scaffold. Output → `lessons/<slug>.html`.

   Run:  node course/build.mjs        (from repo root)
         node build.mjs               (from inside course/)
   ============================================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(__dirname, "_content");
const OUT = path.join(__dirname, "lessons");

/* ---- load the manifest (reuse the browser file as the single source) ---- */
const manifestSrc = fs.readFileSync(path.join(__dirname, "assets", "lessons.js"), "utf8");
const window = {};
// Direct eval shares this scope, so `window.COURSE = ...` populates our object.
eval(manifestSrc); // eslint-disable-line no-eval
const COURSE = window.COURSE;
const FLAT = COURSE.flat;

/* ---- which CDN libraries each lesson's live demo needs ------------------ */
const V = {
  gsap: "https://unpkg.com/gsap@3.15.0/dist/gsap.min.js",
  scrolltrigger: "https://unpkg.com/gsap@3.15.0/dist/ScrollTrigger.min.js",
  splittext: "https://unpkg.com/gsap@3.15.0/dist/SplitText.min.js",
  motionpath: "https://unpkg.com/gsap@3.15.0/dist/MotionPathPlugin.min.js",
  morphsvg: "https://unpkg.com/gsap@3.15.0/dist/MorphSVGPlugin.min.js",
  drawsvg: "https://unpkg.com/gsap@3.15.0/dist/DrawSVGPlugin.min.js",
  d3: "https://unpkg.com/d3@7/dist/d3.min.js"
};
const THREE_VERSION = "0.184.0";

// Per-slug library requirements for the live demos.
const LIBS = {
  "10-css-transitions": [],
  "11-keyframes-transforms": [],
  "12-scroll-driven": [],
  "20-svg-anatomy": [],
  "22-svg-morphing": ["gsap", "morphsvg"],
  "30-svelte-transitions": [],
  "31-tween-spring": [],
  "40-gsap-first-tween": ["gsap"],
  "41-stagger": ["gsap"],
  "42-gsap-utils": ["gsap"],
  "50-timelines": ["gsap"],
  "51-nested-timelines": ["gsap"],
  "60-scrolltrigger": ["gsap", "scrolltrigger"],
  "61-horizontal-scroll": ["gsap", "scrolltrigger"],
  "70-splittext": ["gsap", "splittext"],
  "71-motionpath": ["gsap", "motionpath", "drawsvg"],
  "80-d3-transitions": ["d3"],
  "81-d3-force": ["d3"],
  "90-threejs-first-scene": ["three"],
  "91-shaders": ["three"],
  "a0-threlte-intro": ["three"],
  "a1-threlte-scroll": ["three"],
  "b0-netflix-hero": ["gsap", "splittext", "scrolltrigger"],
  "b1-apple-reveal": ["gsap", "scrolltrigger"],
  "b2-title-sequence": ["gsap", "splittext"],
  "c0-glitch": [],
  "c1-text-scramble": [],
  "c2-image-distortion": ["three"],
  "c3-gpu-particles": ["three"],
  "c4-postprocessing": ["three"],
  "c5-scroll-skew": [],
  "d0-image-transition": ["three"],
  "d1-metaballs": ["three"],
  "d2-custom-cursor": [],
  "d3-audio-reactive": ["three"],
  "e0-raymarch": ["three"],
  "e1-reaction-diffusion": ["three"],
  "e2-flow-field": ["three"],
  "e3-physics": ["three", "cannon"],
  "g0-volumetrics": ["three"],
  "g1-pathtracer": [],
  "00-welcome": [],
  "01-principles-of-motion": []
};

/* ----------------------------- helpers ---------------------------------- */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* A self-contained code panel: Monaco mounts into .codepanel__editor; the
   escaped <pre> is the copy source + the no-JS fallback. */
function codePanel(name, code) {
  return `<div class="codepanel" data-file="${esc(name)}">
        <div class="codepanel__bar">
          <span class="codepanel__dots"><i></i><i></i><i></i></span>
          <span class="codepanel__file">${esc(name)}</span>
          <button class="codepanel__copy" type="button" aria-label="Copy code">Copy</button>
        </div>
        <pre class="codepanel__source"><code>${esc(code)}</code></pre>
        <div class="codepanel__editor"></div>
      </div>`;
}

/* Expand <!--code file="..." name="..."--> directives into full panels by
   reading the real snippet file from _content/snippets/. */
function expandCode(html) {
  return html.replace(/<!--code\s+([^>]*?)-->/g, (m, attrs) => {
    const file = (/file="([^"]+)"/.exec(attrs) || [])[1];
    const name = (/name="([^"]+)"/.exec(attrs) || [])[1] || file;
    if (!file) return m;
    const p = path.join(CONTENT, "snippets", file);
    if (!fs.existsSync(p)) return `<!-- missing snippet: ${file} -->`;
    const code = fs.readFileSync(p, "utf8").replace(/\s+$/, "");
    return codePanel(name, code);
  });
}

function libTags(slug) {
  const libs = LIBS[slug] || [];
  const tags = [];
  const imports = {};
  if (libs.includes("three")) {
    imports["three"] = `https://unpkg.com/three@${THREE_VERSION}/build/three.module.js`;
    imports["three/addons/"] = `https://unpkg.com/three@${THREE_VERSION}/examples/jsm/`;
  }
  if (libs.includes("cannon")) {
    imports["cannon-es"] = "https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js";
  }
  let importmap = "";
  if (Object.keys(imports).length) {
    importmap = `\n  <script type="importmap">\n  ${JSON.stringify({ imports }, null, 2).replace(/\n/g, "\n  ")}\n  </script>`;
  }
  for (const lib of libs) {
    if (lib === "three" || lib === "cannon") continue;
    if (V[lib]) tags.push(`  <script src="${V[lib]}" defer></script>`);
  }
  return importmap + (tags.length ? "\n" + tags.join("\n") : "");
}

function moduleOf(slug) {
  const item = FLAT.find((l) => l.slug === slug);
  return item ? { num: item.module, title: item.moduleTitle } : { num: "", title: "" };
}

/* ----------------------------- the master template ---------------------- */
function page({ slug, title, mod, lead, bodyHTML }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — MOTION</title>
  <meta name="description" content="${esc(lead || title)}" />
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
  <link rel="preconnect" href="https://unpkg.com" />
  <link rel="stylesheet" href="../assets/course.css" />${libTags(slug)}
</head>
<body data-slug="${slug}">
  <div class="progress-rail"><span></span></div>

  <header class="topbar">
    <div class="container">
      <a class="brand" href="../index.html"><span class="dot"></span> MOTION</a>
      <nav>
        <a href="../index.html#curriculum">Curriculum</a>
        <a href="../index.html">Home</a>
      </nav>
    </div>
  </header>

  <main class="page">
    <article class="lesson container">
      <header style="max-width: var(--measure); margin-bottom: var(--space-lg);">
        <p class="eyebrow" data-reveal>${esc(mod.num)} · ${esc(mod.title)}</p>
        <h1 class="hero__title" style="font-size: var(--step-4); max-width: 20ch;" data-reveal="60">${title}</h1>
        ${lead ? `<p class="hero__lead" data-reveal="120">${lead}</p>` : ""}
      </header>

      ${bodyHTML}

      <nav class="pager" data-pager aria-label="Lesson navigation"></nav>
    </article>
  </main>

  <footer class="footer">
    <div class="container">
      <span>MOTION · ${esc(mod.num)} ${esc(mod.title)}</span>
      <span class="muted">Use ← / → to move between lessons.</span>
    </div>
  </footer>

  <script src="../assets/lessons.js"></script>
  <script src="../assets/course.js" defer></script>
</body>
</html>
`;
}

/* ----------------------------- scaffold body ---------------------------- */
function scaffoldBody(item) {
  return `
      <div class="lesson__body prose">
        <div class="callout callout--build" data-reveal>
          <span class="callout__icon"><svg viewBox="0 0 256 256" width="22" height="22" fill="currentColor"><path d="M226.76,69a8,8,0,0,0-12.84-2.88l-40.3,37.19-17.23-3.7-3.7-17.23,37.19-40.3A8,8,0,0,0,184,29.24,72,72,0,0,0,88.27,118.7L40,167a24,24,0,0,0,34,34l48.26-48.27A72,72,0,0,0,226.76,69ZM160,176a8,8,0,1,1,8-8A8,8,0,0,1,160,176Z"/></svg></span>
          <div class="callout__body">
            <strong>This lesson is part of the live curriculum and is being expanded.</strong>
            The module's flagship lesson already ships with a full running demo and
            copy-paste Svelte&nbsp;5 code — start there, then return here as this
            page deepens. Everything plugs into the same platform with zero rework.
          </div>
        </div>
        <h2>What you'll master here</h2>
        <p>${esc(item.title)} builds directly on <em>${esc(item.moduleTitle)}</em>.
        You'll learn the technique, the timing decisions behind it, and exactly how
        to recreate it inside your SvelteKit app with scoped styles and Phosphor icons.</p>
        <p class="muted">Tip: every lesson is reachable from the
        <a href="../index.html#curriculum">curriculum</a>, and you can jump with the
        ← / → arrow keys.</p>
      </div>`;
}

/* ----------------------------- generate -------------------------------- */
fs.mkdirSync(OUT, { recursive: true });
let live = 0;
let scaffold = 0;
for (const item of FLAT) {
  const mod = moduleOf(item.slug);
  const fragmentPath = path.join(CONTENT, item.slug + ".html");
  let bodyHTML;
  let lead = "";
  if (fs.existsSync(fragmentPath)) {
    const raw = fs.readFileSync(fragmentPath, "utf8");
    // Optional first-line directive:  <!--lead: ...-->
    const leadMatch = raw.match(/^<!--lead:\s*([\s\S]*?)-->/);
    if (leadMatch) lead = leadMatch[1].trim();
    bodyHTML = expandCode(raw.replace(/^<!--lead:[\s\S]*?-->\s*/, ""));
    live += 1;
  } else {
    bodyHTML = scaffoldBody(item);
    scaffold += 1;
  }
  const html = page({ slug: item.slug, title: item.title, mod, lead, bodyHTML });
  fs.writeFileSync(path.join(OUT, item.slug + ".html"), html);
}
console.log(`✓ Generated ${FLAT.length} lessons  (${live} authored, ${scaffold} scaffolded) → course/lessons/`);
