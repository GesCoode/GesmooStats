<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';

  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = '';
    submitting = true;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        error = data.error ?? 'Could not sign in.';
        return;
      }

      await invalidateAll();
      goto('/dashboard', { replaceState: true });
    } catch {
      error = 'Could not sign in.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in · Personal</title>
</svelte:head>

<div class="login-wrap">
  <div class="panel login-panel">
    <p class="muted">Personal</p>
    <h1>Sign in</h1>
    <p>Private space for stats, finances, and more.</p>

    <form class="login-form" onsubmit={handleSubmit}>
      {#if error}
        <p class="message-error">{error}</p>
      {/if}

      <label>
        <span class="field-label">Admin password</span>
        <input
          class="field-input"
          type="password"
          autocomplete="current-password"
          bind:value={password}
          required
          disabled={submitting}
        />
      </label>

      <button class="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  </div>
</div>
