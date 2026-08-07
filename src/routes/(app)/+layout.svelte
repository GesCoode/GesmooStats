<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';

  let { children } = $props();

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await invalidateAll();
    goto('/login', { replaceState: true });
  }
</script>

<div class="page">
  <header class="app-nav">
    <div class="app-nav__brand">
      <span class="app-nav__title">Gesmoo Stats</span>
    </div>
    <button class="btn btn-ghost" type="button" onclick={signOut}>Sign out</button>
  </header>

  {@render children()}
</div>
