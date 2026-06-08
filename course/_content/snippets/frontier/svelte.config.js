// Both features are experimental in mid-2026 — opt in explicitly.
/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    experimental: {
      remoteFunctions: true // enables query / form / command / prerender
    }
  },
  compilerOptions: {
    experimental: {
      async: true // enables top-level `await` in components, $derived and markup
    }
  }
};

export default config;
