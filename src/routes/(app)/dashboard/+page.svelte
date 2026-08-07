<script lang="ts">
  import type { SiteStats } from '$lib/server/stats';

  let { data } = $props();

  function formatCount(value: number | null): string {
    if (value === null) return '—';
    return value.toLocaleString();
  }

  function statusBadge(site: SiteStats): { label: string; class: string } {
    if (site.status === 'ok') return { label: 'Live', class: 'badge-ok' };
    if (site.status === 'coming_soon') return { label: 'Coming soon', class: 'badge-warn' };
    if (site.status === 'no_accounts') return { label: 'No accounts', class: 'badge-warn' };
    return { label: 'Unavailable', class: 'badge-error' };
  }

  function fetchedLabel(iso: string): string {
    return new Date(iso).toLocaleString();
  }
</script>

<svelte:head>
  <title>Dashboard · Gesmoo Stats</title>
</svelte:head>

<header class="header">
  <div>
    <h1>Gesmoo Stats</h1>
    <p>Subscriber overview · updated {fetchedLabel(data.fetchedAt)}</p>
  </div>
</header>

<section class="summary-grid">
  <article class="summary-card">
    <div class="summary-card__label">Total accounts</div>
    <div class="summary-card__value">{formatCount(data.totals.totalAccounts)}</div>
  </article>
  <article class="summary-card">
    <div class="summary-card__label">Verified</div>
    <div class="summary-card__value">{formatCount(data.totals.verifiedAccounts)}</div>
  </article>
  <article class="summary-card">
    <div class="summary-card__label">New (7 days)</div>
    <div class="summary-card__value">{formatCount(data.totals.last7Days)}</div>
  </article>
  <article class="summary-card">
    <div class="summary-card__label">New (30 days)</div>
    <div class="summary-card__value">{formatCount(data.totals.last30Days)}</div>
  </article>
</section>

<section class="panel">
  <table class="site-table">
    <thead>
      <tr>
        <th>Website</th>
        <th>Status</th>
        <th>Total</th>
        <th>Verified</th>
        <th>Unverified</th>
        <th>7 days</th>
        <th>30 days</th>
      </tr>
    </thead>
    <tbody>
      {#each data.sites as site (site.id)}
        {@const badge = statusBadge(site)}
        <tr>
          <td>
            <a href={site.url} target="_blank" rel="noreferrer">{site.name}</a>
            {#if site.note}
              <div class="muted">{site.note}</div>
            {/if}
            {#if site.error}
              <div class="muted">{site.error}</div>
            {/if}
          </td>
          <td><span class="badge {badge.class}">{badge.label}</span></td>
          <td>{formatCount(site.totalAccounts)}</td>
          <td>{formatCount(site.verifiedAccounts)}</td>
          <td>{formatCount(site.unverifiedAccounts)}</td>
          <td>{formatCount(site.last7Days)}</td>
          <td>{formatCount(site.last30Days)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>
