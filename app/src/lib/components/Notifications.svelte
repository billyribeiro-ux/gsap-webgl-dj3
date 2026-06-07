<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  type Toast = { id: number; text: string };

  let toasts = $state<Toast[]>([]);
  let nextId = 0;

  const messages = [
    'Render complete',
    'Deploy succeeded',
    'New comment',
    'Build passed',
    '3 files synced'
  ];

  function add(): void {
    const text = messages[Math.floor(Math.random() * messages.length)];
    toasts.push({ id: nextId++, text });
    // Auto-dismiss after a moment so the exit transition gets to shine.
    const id = nextId - 1;
    setTimeout(() => remove(id), 2600);
  }

  function remove(id: number): void {
    toasts = toasts.filter((t) => t.id !== id);
  }
</script>

<button class="add" onclick={add}>Add notification</button>

<ul class="stack">
  {#each toasts as toast (toast.id)}
    <!--
      in:  the entrance transition (fly up + fade)
      out: the exit transition (fade out)
      animate:flip  smoothly slides the *remaining* items into their new slots
                    when one is removed. This is the FLIP technique, built in.
    -->
    <li
      class="toast"
      in:fly={{ y: 24, duration: 450, easing: quintOut }}
      out:fade={{ duration: 250 }}
      animate:flip={{ duration: 350, easing: quintOut }}
    >
      <span>{toast.text}</span>
      <button class="close" aria-label="Dismiss" onclick={() => remove(toast.id)}>×</button>
    </li>
  {/each}
</ul>

<style>
  .add {
    padding: 0.6rem 1.3rem;
    border-radius: 999px;
    border: none;
    font-weight: 700;
    color: #0a0414;
    background: linear-gradient(135deg, #7c5cff, #19e3d6);
    cursor: pointer;
  }
  .stack { list-style: none; padding: 0; margin: 1rem 0 0; display: flex; flex-direction: column; gap: 0.6rem; width: min(320px, 90%); }
  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    background: #11141f;
    border: 1px solid #1b2030;
    color: #d6dbe6;
    box-shadow: 0 10px 30px -14px #000;
  }
  .close { background: none; border: none; color: #8b93a7; font-size: 1.2rem; cursor: pointer; line-height: 1; }
  .close:hover { color: #ff5f9e; }
</style>
