<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { House, GithubLogo } from 'phosphor-svelte';

  let { children } = $props();
</script>

<div class="shell">
  <header class="topbar">
    <a class="brand" href="/">
      <span class="dot" aria-hidden="true"></span>
      MOTION
      <span class="brand__sub">reference app</span>
    </a>
    <nav>
      <a class="nav-link" class:active={page.url.pathname === '/'} href="/">
        <House size={16} weight="bold" /> Home
      </a>
      <a class="nav-link" href="https://github.com" target="_blank" rel="noreferrer noopener">
        <GithubLogo size={16} weight="bold" /> Source
      </a>
    </nav>
  </header>

  <main>
    {@render children?.()}
  </main>

  <footer class="footer">
    Built with Svelte 5, GSAP, Three.js, Threlte &amp; D3 — every component scoped, typed and accessible.
  </footer>
</div>

<style>
  .shell { display: flex; flex-direction: column; min-height: 100svh; }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 1rem;
    height: 64px;
    padding-inline: clamp(1rem, 4vw, 2.5rem);
    backdrop-filter: blur(14px) saturate(140%);
    background: color-mix(in oklab, var(--ink-900) 72%, transparent);
    border-bottom: 1px solid var(--ink-600);
  }
  .brand { display: inline-flex; align-items: center; gap: 0.55rem; font-weight: 750; color: var(--mist-100); }
  .brand__sub { font-weight: 500; font-size: 0.72rem; color: var(--mist-400); letter-spacing: 0.04em; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--grad-spotlight); box-shadow: 0 0 14px color-mix(in oklab, var(--accent) 60%, transparent); }

  nav { margin-left: auto; display: flex; gap: 0.4rem; }
  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--mist-300);
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    transition: color 0.3s var(--ease-out-expo), background 0.3s var(--ease-out-expo);
  }
  .nav-link:hover,
  .nav-link.active { color: var(--mist-100); background: var(--ink-700); }

  main { flex: 1; }

  .footer {
    border-top: 1px solid var(--ink-600);
    padding: 1.6rem clamp(1rem, 4vw, 2.5rem);
    color: var(--mist-400);
    font-size: 0.85rem;
  }
</style>
