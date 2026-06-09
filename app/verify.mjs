// Principal-grade verification gate: load every prerendered route in a real
// (software-GL) Chromium, and FAIL on any console error, uncaught exception or
// failed request. WebGPU is absent in CI/sandbox, so WebGPU demos must hit their
// graceful fallback (no error) and every WebGL/three/GSAP/D3/Svelte demo runs for
// real — surfacing any shader-compile or JS bug. Screenshots are best-effort
// (a couple of demos are too heavy to snapshot under pure software rendering).
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4178';
const routes = fs
  .readdirSync('build', { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(`build/${d.name}/index.html`))
  .map((d) => d.name)
  .sort();
routes.unshift(''); // landing
fs.mkdirSync('verify-shots', { recursive: true });

const benign = /favicon|status of 404/i;
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox']
});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 720 } });
const results = [];

for (const r of routes) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !benign.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('EXCEPTION: ' + (e.message || String(e))));
  page.on('requestfailed', (req) => { if (!benign.test(req.url())) errors.push('REQFAIL: ' + req.url()); });
  let info = {};
  try {
    await page.goto(`${BASE}/${r}`, { waitUntil: 'load', timeout: 25000 });
    await page.waitForTimeout(3200);
    info = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { canvas: !!c, w: c ? c.width : 0, h: c ? c.height : 0 };
    });
    await page.screenshot({ path: `verify-shots/${r || 'home'}.png`, timeout: 8000, animations: 'disabled' }).catch(() => {});
  } catch (e) {
    errors.push('NAV: ' + e.message);
  }
  results.push({ r: r || '(home)', errors: [...new Set(errors)], info });
  await page.close();
}
await browser.close();

const bad = results.filter((x) => x.errors.length > 0);
console.log(`\n===== Verified ${results.length} routes · ${bad.length} with errors =====`);
for (const b of bad) {
  console.log(`\n# /${b.r}`);
  b.errors.slice(0, 6).forEach((e) => console.log('   • ' + e.replace(/\s+/g, ' ').slice(0, 220)));
}
console.log(bad.length === 0 ? '\n✅ ALL ROUTES CLEAN' : `\n❌ ${bad.length} routes have errors`);
process.exit(bad.length === 0 ? 0 : 1);
