// Principal-grade verification: load every prerendered route in a real (software-GL)
// Chromium, capture console errors / exceptions / failed requests, confirm a canvas
// got sized, and screenshot each for visual inspection. WebGPU is absent in this
// sandbox, so WebGPU demos should hit their graceful fallback (no error); every
// WebGL/three/GSAP/D3/Svelte demo runs for real and any shader/JS bug shows up.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4178';
const routes = fs
  .readdirSync('build', { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(`build/${d.name}/index.html`))
  .map((d) => d.name)
  .sort();
routes.unshift(''); // landing page

fs.mkdirSync('verify-shots', { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox']
});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 720 } });

const benign = /favicon|the_real_index|Failed to load resource: the server responded with a status of 404/i;
const results = [];

for (const r of routes) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('EXCEPTION: ' + (e.message || String(e))));
  page.on('requestfailed', (req) => {
    const u = req.url();
    if (!benign.test(u)) errors.push('REQFAIL: ' + u + ' ' + (req.failure()?.errorText || ''));
  });
  try {
    await page.goto(`${BASE}/${r}`, { waitUntil: 'load', timeout: 25000 });
    await page.waitForTimeout(3400); // let demos mount + run a few hundred frames
    const info = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { canvas: !!c, w: c ? c.width : 0, h: c ? c.height : 0 };
    });
    await page.screenshot({ path: `verify-shots/${r || 'home'}.png` });
    results.push({ r: r || '(home)', errors: errors.filter((e) => !benign.test(e)), info });
  } catch (e) {
    results.push({ r: r || '(home)', errors: ['NAV: ' + e.message], info: {} });
  }
  await page.close();
}
await browser.close();

const bad = results.filter((x) => x.errors.length > 0);
console.log(`\n===== Verified ${results.length} routes · ${bad.length} with problems =====`);
for (const b of bad) {
  console.log(`\n# /${b.r}`);
  [...new Set(b.errors)].slice(0, 6).forEach((e) => console.log('   • ' + e.replace(/\s+/g, ' ').slice(0, 220)));
}
// Note any canvas that came back zero-sized (possible silent failure).
const zero = results.filter((x) => x.info && x.info.canvas && (x.info.w === 0 || x.info.h === 0));
if (zero.length) { console.log('\n--- zero-sized canvases ---'); zero.forEach((z) => console.log('   • /' + z.r)); }
console.log(bad.length === 0 ? '\n✅ ALL ROUTES CLEAN (no console errors / exceptions / failed requests)' : `\n❌ ${bad.length} routes need fixes`);
