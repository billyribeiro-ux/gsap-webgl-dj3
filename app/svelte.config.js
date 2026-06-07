import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // adapter-static prerenders the whole course to plain HTML — so the
    // SvelteKit reference also ships as a standalone, deployable site.
    adapter: adapter({
      fallback: '404.html'
    }),
    prerender: {
      handleHttpError: 'warn'
    }
  }
};

export default config;
