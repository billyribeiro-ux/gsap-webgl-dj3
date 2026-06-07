/* ============================================================================
   course.js — the shell runtime for the HTML textbook (vanilla, no framework).
   Responsibilities:
     1. Lazy-load Monaco and upgrade every <pre data-code> into a read-only,
        syntax-highlighted editor with a working Copy button.
     2. Build the Prev/Next pager + keyboard arrows from window.COURSE.
     3. Drive the scroll-progress rail.
     4. Reveal-on-scroll via IntersectionObserver.
     5. Wire up "Replay" buttons for demos that opt in.
     6. Respect prefers-reduced-motion globally.
   ============================================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MONACO_BASE = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min";

  /* ---------------------------------------------------------------- helpers */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function copyIcon() {
    return `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>`;
  }
  function checkIcon() {
    return `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>`;
  }

  /* ----------------------------------------------------- 1. copy buttons */
  function wireCopyButtons() {
    $$(".codepanel").forEach((panel) => {
      const source = $(".codepanel__source", panel);
      const btn = $(".codepanel__copy", panel);
      if (!source || !btn) return;
      btn.innerHTML = copyIcon() + "<span>Copy</span>";
      btn.addEventListener("click", async () => {
        const text = panel.__getCode ? panel.__getCode() : source.textContent;
        try {
          await navigator.clipboard.writeText(text);
        } catch (_) {
          // Fallback for non-secure contexts (file://)
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          ta.remove();
        }
        btn.classList.add("is-copied");
        btn.innerHTML = checkIcon() + "<span>Copied</span>";
        setTimeout(() => {
          btn.classList.remove("is-copied");
          btn.innerHTML = copyIcon() + "<span>Copy</span>";
        }, 1600);
      });
    });
  }

  /* ----------------------------------------------------- 2. Monaco editors */
  function langFromFile(file) {
    if (!file) return "javascript";
    if (file.endsWith(".svelte")) return "html"; // closest built-in highlight for Svelte
    if (file.endsWith(".css")) return "css";
    if (file.endsWith(".html")) return "html";
    if (file.endsWith(".ts")) return "typescript";
    if (file.endsWith(".json")) return "json";
    return "javascript";
  }

  function defineTheme(monaco) {
    monaco.editor.defineTheme("motion-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5b6478", fontStyle: "italic" },
        { token: "keyword", foreground: "b79bff" },
        { token: "string", foreground: "7ce7dd" },
        { token: "number", foreground: "ff9ec4" },
        { token: "tag", foreground: "b79bff" },
        { token: "attribute.name", foreground: "7ce7dd" }
      ],
      colors: {
        "editor.background": "#11141f",
        "editor.foreground": "#d6dbe6",
        "editorLineNumber.foreground": "#2a3142",
        "editorLineNumber.activeForeground": "#8b93a7",
        "editor.selectionBackground": "#7c5cff44",
        "editor.lineHighlightBackground": "#00000000",
        "editorIndentGuide.background1": "#1b2030"
      }
    });
  }

  function mountMonaco() {
    const panels = $$(".codepanel");
    if (!panels.length) return;
    if (!window.require) return; // loader.js failed → keep <pre> fallback

    window.require.config({ paths: { vs: MONACO_BASE + "/vs" } });
    window.require(["vs/editor/editor.main"], function () {
      const monaco = window.monaco;
      defineTheme(monaco);
      panels.forEach((panel) => {
        const host = $(".codepanel__editor", panel);
        const source = $(".codepanel__source", panel);
        if (!host || !source) return;
        const code = source.textContent.replace(/\s+$/, "");
        const file = panel.dataset.file || "";
        const editor = monaco.editor.create(host, {
          value: code,
          language: langFromFile(file),
          theme: "motion-dark",
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 21,
          fontFamily: "var(--font-mono)",
          fontLigatures: true,
          padding: { top: 14, bottom: 14 },
          renderLineHighlight: "none",
          scrollbar: { vertical: "auto", horizontalScrollbarSize: 8, verticalScrollbarSize: 8 },
          guides: { indentation: false },
          contextmenu: false,
          tabSize: 2,
          wordWrap: "off",
          automaticLayout: true
        });
        panel.__getCode = () => editor.getValue();
        panel.classList.add("is-live");
        // Auto-size to content (so panels grow with the code, capped for long files)
        const lineCount = editor.getModel().getLineCount();
        const target = Math.min(Math.max(lineCount * 21 + 28, 280), 560);
        host.style.height = target + "px";
      });
    });
  }

  function loadMonacoLoader() {
    if ($$(".codepanel").length === 0) return;
    const s = document.createElement("script");
    s.src = MONACO_BASE + "/vs/loader.min.js";
    s.onload = mountMonaco;
    s.onerror = () => {/* fallback <pre> remains visible */};
    document.head.appendChild(s);
  }

  /* ----------------------------------------------------- 3. Prev/Next pager */
  function buildPager() {
    const host = $("[data-pager]");
    if (!host || !window.COURSE) return;
    const flat = window.COURSE.flat;
    const slug = document.body.dataset.slug;
    const i = flat.findIndex((l) => l.slug === slug);
    if (i === -1) return;
    const prev = flat[i - 1];
    const next = flat[i + 1];

    const arrowL = `<svg viewBox="0 0 256 256" width="14" height="14" fill="currentColor"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/></svg>`;
    const arrowR = `<svg viewBox="0 0 256 256" width="14" height="14" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>`;

    host.innerHTML = `
      <a class="pager__link pager__link--prev" ${prev ? `href="./${prev.slug}.html"` : "hidden"}>
        <span class="pager__dir">${arrowL} Previous</span>
        <span class="pager__title">${prev ? prev.title : ""}</span>
      </a>
      <a class="pager__link pager__link--next" ${next ? `href="./${next.slug}.html"` : "hidden"}>
        <span class="pager__dir">Next ${arrowR}</span>
        <span class="pager__title">${next ? next.title : ""}</span>
      </a>`;

    // Keyboard arrows (ignore when typing / in the editor)
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" && prev) location.href = `./${prev.slug}.html`;
      if (e.key === "ArrowRight" && next) location.href = `./${next.slug}.html`;
    });
  }

  /* ----------------------------------------------------- 4. progress rail */
  function progressRail() {
    const rail = $(".progress-rail");
    if (!rail) return;
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      rail.style.setProperty("--progress", pct.toFixed(2) + "%");
      ticking = false;
    };
    document.addEventListener("scroll", () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------- 5. reveal on scroll */
  function revealOnScroll() {
    const els = $$("[data-reveal]");
    if (!els.length) return;
    if (prefersReduced) { els.forEach((el) => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.reveal;
          if (delay) entry.target.style.transitionDelay = delay + "ms";
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ----------------------------------------------------- 6. replay buttons */
  // A demo opts in by adding a [data-replay] button inside a [data-demo] root
  // and registering window.MotionDemos[name] = () => { ...run/restart... }.
  window.MotionDemos = window.MotionDemos || {};
  function wireReplays() {
    $$("[data-replay]").forEach((btn) => {
      const name = btn.dataset.replay;
      btn.addEventListener("click", () => {
        const fn = window.MotionDemos[name];
        if (typeof fn === "function") fn();
      });
    });
  }

  /* expose reduced-motion flag for demos */
  window.MOTION_REDUCED = prefersReduced;

  /* ------------------------------------------------------------------ boot */
  function boot() {
    wireCopyButtons();
    loadMonacoLoader();
    buildPager();
    progressRail();
    revealOnScroll();
    wireReplays();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
