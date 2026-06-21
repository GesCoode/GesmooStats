<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';

  let { children } = $props();

  const navItems = [
    { href: '/dashboard', label: 'Stats' },
    { href: '/finances', label: 'Finances' }
  ];

  function isActive(href: string): boolean {
    return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await invalidateAll();
    goto('/login', { replaceState: true });
  }
</script>

<div class="page" class:page--wide={page.url.pathname.startsWith('/finances')}>
  <header class="app-nav">
    <div class="app-nav__brand">
      <span class="app-nav__title">Personal</span>
      <nav class="app-nav__links" aria-label="Main">
        {#each navItems as item (item.href)}
          <a class="app-nav__link" class:app-nav__link--active={isActive(item.href)} href={item.href}>
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
    <button class="btn btn-ghost" type="button" onclick={signOut}>Sign out</button>
  </header>

  {@render children()}
</div>
