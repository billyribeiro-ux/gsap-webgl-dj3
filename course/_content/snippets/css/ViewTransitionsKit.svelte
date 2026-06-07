<script lang="ts">
  import { onNavigate } from '$app/navigation';

  let { children } = $props();

  // Drop this in your root +layout.svelte and EVERY client-side navigation in the
  // app becomes a view transition. Elements that share a `view-transition-name`
  // across the two pages will morph from one into the other.
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete; // wait for the new page to be ready
      });
    });
  });
</script>

{@render children?.()}
