<script lang="ts">
  // A full large language model running in your browser, on your GPU. WebLLM
  // downloads a quantized model once (cached), compiles it for WebGPU, and streams
  // tokens — no server, no API key, completely private. This is the literal
  // frontier of the 2026 web: an LLM as a client-side dependency.
  type Msg = { role: 'user' | 'assistant'; content: string };

  const MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'; // ~0.5B params, smallest practical

  let status = $state<'idle' | 'loading' | 'ready' | 'busy' | 'error'>('idle');
  let progress = $state(0);
  let progressText = $state('');
  let input = $state('');
  let messages = $state<Msg[]>([]);
  let engine: { chat: { completions: { create: (o: unknown) => Promise<AsyncIterable<unknown>> } } } | null = null;

  async function load(): Promise<void> {
    if (!navigator.gpu) { status = 'error'; progressText = 'WebGPU is required and not available here.'; return; }
    status = 'loading';
    try {
      const url = 'https://esm.run/@mlc-ai/web-llm';
      const mod = await import(/* @vite-ignore */ url);
      engine = await mod.CreateMLCEngine(MODEL, {
        initProgressCallback: (r: { progress: number; text: string }) => {
          progress = r.progress;
          progressText = r.text;
        }
      });
      status = 'ready';
    } catch {
      status = 'error';
      progressText = 'Failed to load the model (needs WebGPU + bandwidth).';
    }
  }

  async function send(): Promise<void> {
    if (status !== 'ready' || !input.trim() || !engine) return;
    const text = input.trim();
    input = '';
    messages = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    status = 'busy';
    try {
      const stream = await engine.chat.completions.create({
        messages: messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        temperature: 0.7,
        max_tokens: 256
      });
      let acc = '';
      for await (const chunk of stream as AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>) {
        acc += chunk.choices?.[0]?.delta?.content ?? '';
        messages = [...messages.slice(0, -1), { role: 'assistant', content: acc }];
      }
    } catch {
      messages = [...messages.slice(0, -1), { role: 'assistant', content: '(generation error)' }];
    }
    status = 'ready';
  }
</script>

<div class="llm">
  {#if status === 'idle'}
    <button class="go" onclick={load}>▷ Load a 0.5B LLM onto your GPU</button>
    <p class="note">One-time ~400&nbsp;MB download, then it runs entirely on your device.</p>
  {:else if status === 'loading'}
    <p class="ld">Loading model… {(progress * 100).toFixed(0)}%</p>
    <div class="bar"><span style="width: {(progress * 100).toFixed(1)}%"></span></div>
    <p class="sub">{progressText}</p>
  {:else if status === 'error'}
    <p class="err">{progressText}</p>
  {:else}
    <div class="log">
      {#each messages as m, i (i)}
        <div class="msg {m.role}"><span>{m.content || '…'}</span></div>
      {/each}
      {#if messages.length === 0}<p class="hint">Ask it anything — it answers on your hardware.</p>{/if}
    </div>
    <form class="row" onsubmit={(e) => { e.preventDefault(); send(); }}>
      <input bind:value={input} placeholder="Type a message…" disabled={status === 'busy'} />
      <button type="submit" disabled={status === 'busy'}>{status === 'busy' ? '…' : 'Send'}</button>
    </form>
  {/if}
</div>

<style>
  .llm { width: min(460px, 96%); display: flex; flex-direction: column; gap: 0.8rem; }
  .go { align-self: center; padding: 0.85rem 1.6rem; border-radius: 999px; border: none; font-weight: 700; color: #05060a; background: linear-gradient(135deg, #7c5cff, #19e3d6); cursor: pointer; }
  .note, .sub, .hint { color: #8b93a7; font-size: 0.82rem; text-align: center; margin: 0; }
  .ld { color: #d6dbe6; text-align: center; margin: 0; }
  .err { color: #ff5f9e; text-align: center; }
  .bar { height: 8px; border-radius: 999px; background: #11141f; overflow: hidden; }
  .bar span { display: block; height: 100%; background: linear-gradient(90deg, #7c5cff, #19e3d6); transition: width 0.2s; }
  .log { display: flex; flex-direction: column; gap: 0.5rem; max-height: 230px; overflow-y: auto; padding: 0.4rem; }
  .msg { padding: 0.6rem 0.85rem; border-radius: 12px; font-size: 0.9rem; line-height: 1.5; max-width: 85%; }
  .msg.user { align-self: flex-end; background: linear-gradient(135deg, #7c5cff, #6b4ee6); color: #fff; }
  .msg.assistant { align-self: flex-start; background: #11141f; border: 1px solid #1b2030; color: #d6dbe6; }
  .row { display: flex; gap: 0.5rem; }
  .row input { flex: 1; padding: 0.7rem 1rem; border-radius: 999px; background: #11141f; border: 1px solid #2a3142; color: #f4f6fb; font: inherit; }
  .row input:focus { outline: none; border-color: #7c5cff; }
  .row button { padding: 0.7rem 1.3rem; border-radius: 999px; border: none; font-weight: 700; color: #05060a; background: linear-gradient(135deg, #7c5cff, #19e3d6); cursor: pointer; }
  .row button:disabled, .row input:disabled { opacity: 0.6; }
</style>
