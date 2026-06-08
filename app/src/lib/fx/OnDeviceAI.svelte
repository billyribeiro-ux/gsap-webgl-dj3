<script lang="ts">
  // On-device AI: a real neural network running in the browser, on the GPU, with
  // nothing sent to a server. Transformers.js v4 loads a quantized model and runs
  // inference via WebGPU (falling back to WASM). Here: live sentiment analysis as
  // you type. The model downloads once, then every keystroke is classified locally.
  type Sentiment = { label: string; score: number };

  let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  let backend = $state('');
  let text = $state("I can't believe how good this animation course is!");
  let result = $state<Sentiment | null>(null);

  let classify: ((t: string) => Promise<Sentiment[]>) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function start(): Promise<void> {
    status = 'loading';
    try {
      // Load straight from the CDN; the URL is a variable so the bundler leaves it alone.
      const url = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4';
      const mod = await import(/* @vite-ignore */ url);
      try {
        classify = await mod.pipeline('sentiment-analysis', undefined, { device: 'webgpu' });
        backend = 'WebGPU';
      } catch {
        classify = await mod.pipeline('sentiment-analysis'); // WASM fallback
        backend = 'WASM';
      }
      status = 'ready';
      run();
    } catch {
      status = 'error';
    }
  }

  async function run(): Promise<void> {
    if (!classify) return;
    const out = await classify(text);
    result = out[0];
  }

  function onInput(): void {
    if (status !== 'ready') return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, 350); // debounce keystrokes
  }
</script>

<div class="ai">
  {#if status === 'idle'}
    <button class="go" onclick={start}>▷ Run a neural net on your GPU</button>
    <p class="note">Downloads a ~65&nbsp;MB model once, then runs entirely on your device.</p>
  {:else if status === 'loading'}
    <p class="status"><span class="spin"></span> Downloading &amp; compiling the model…</p>
  {:else if status === 'error'}
    <p class="status err">Couldn't load the model (offline or blocked).</p>
  {:else}
    <span class="badge">inference: {backend}</span>
    <textarea bind:value={text} oninput={onInput} rows="2" spellcheck="false"></textarea>
    {#if result}
      {@const positive = result.label === 'POSITIVE'}
      <div class="result" class:positive class:negative={!positive}>
        <span class="label">{result.label}</span>
        <div class="bar"><span style="width: {(result.score * 100).toFixed(1)}%"></span></div>
        <span class="score">{(result.score * 100).toFixed(1)}%</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .ai { width: min(440px, 94%); display: flex; flex-direction: column; gap: 0.9rem; align-items: center; text-align: center; }
  .go { padding: 0.85rem 1.6rem; border-radius: 999px; border: none; font-weight: 700; color: #05060a; background: linear-gradient(135deg, #7c5cff, #19e3d6); cursor: pointer; }
  .note, .status { color: #8b93a7; font-size: 0.85rem; margin: 0; }
  .status { display: inline-flex; align-items: center; gap: 0.5rem; color: #d6dbe6; }
  .err { color: #ff5f9e; }
  .spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #2a3142; border-top-color: #19e3d6; animation: sp 0.8s linear infinite; }
  @keyframes sp { to { transform: rotate(360deg); } }
  .badge { font-family: ui-monospace, monospace; font-size: 0.7rem; letter-spacing: 0.08em; color: #19e3d6; border: 1px solid color-mix(in oklab, #19e3d6 40%, transparent); border-radius: 999px; padding: 0.15rem 0.6rem; }
  textarea { width: 100%; resize: none; padding: 0.8rem 1rem; border-radius: 12px; background: #11141f; border: 1px solid #2a3142; color: #f4f6fb; font: inherit; }
  textarea:focus { outline: none; border-color: #7c5cff; }
  .result { display: flex; align-items: center; gap: 0.8rem; width: 100%; }
  .label { font-weight: 700; font-size: 0.85rem; min-width: 8ch; text-align: left; }
  .bar { flex: 1; height: 10px; border-radius: 999px; background: #11141f; overflow: hidden; }
  .bar span { display: block; height: 100%; transition: width 0.3s ease; }
  .positive .label { color: #19e3d6; } .positive .bar span { background: linear-gradient(90deg, #19e3d6, #7c5cff); }
  .negative .label { color: #ff5f9e; } .negative .bar span { background: linear-gradient(90deg, #ff5f9e, #ff9e5f); }
  .score { font-variant-numeric: tabular-nums; color: #aab2c5; font-size: 0.85rem; }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
