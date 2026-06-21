<script lang="ts">
  import type { ReconciliationInsights } from '$lib/finances/calc';
  import { formatCurrency } from '$lib/finances/format';
  import LineChart from '$lib/components/finances/LineChart.svelte';

  let { reconciliation }: { reconciliation: ReconciliationInsights } = $props();

  const maxExtra = $derived(
    Math.max(...reconciliation.points.map((point) => Math.abs(point.monthlyExtraSpend)), 1)
  );

  function barHeight(value: number): string {
    return `${Math.max(4, (Math.abs(value) / maxExtra) * 100)}%`;
  }
</script>

{#if reconciliation.points.length === 0}
  <article class="panel fin-chart-panel fin-chart-panel--hero">
    <h2 class="fin-panel-title">Budget vs reality</h2>
  </article>
{:else}
  <section class="summary-grid fin-reconcile-summary">
    <article class="summary-card">
      <div class="summary-card__label">Current gap</div>
      <div
        class="summary-card__value"
        class:summary-card__value--negative={reconciliation.currentGap < 0}
        class:summary-card__value--positive={reconciliation.currentGap > 0}
      >
        {formatCurrency(reconciliation.currentGap)}
      </div>
    </article>
    <article class="summary-card">
      <div class="summary-card__label">Extra spend this month</div>
      <div
        class="summary-card__value"
        class:summary-card__value--negative={reconciliation.currentMonthExtraSpend > 0}
      >
        {reconciliation.currentMonthExtraSpend > 0
          ? formatCurrency(reconciliation.currentMonthExtraSpend)
          : '—'}
      </div>
    </article>
    <article class="summary-card">
      <div class="summary-card__label">Median extra spend</div>
      <div class="summary-card__value summary-card__value--negative">
        {reconciliation.medianExtraSpend === null
          ? '—'
          : formatCurrency(reconciliation.medianExtraSpend)}
      </div>
    </article>
    <article class="summary-card">
      <div class="summary-card__label">Logged one-offs (all time)</div>
      <div class="summary-card__value">
        {formatCurrency(reconciliation.totalLoggedOneOffs)}
      </div>
    </article>
  </section>

  <article class="panel fin-chart-panel fin-chart-panel--hero">
    <h2 class="fin-panel-title">Expected vs actual liquid assets</h2>
    <div class="fin-line-chart--featured">
      <LineChart
        series={[
          {
            id: 'expected',
            label: 'Expected',
            color: '#5b9fd4',
            points: reconciliation.points.map((point) => ({
              date: point.date,
              label: point.label,
              value: point.expectedLiquid
            }))
          },
          {
            id: 'expected-oneoffs',
            label: 'Expected + one-offs',
            color: '#7fd99a',
            points: reconciliation.points.map((point) => ({
              date: point.date,
              label: point.label,
              value: point.expectedWithOneOffs
            }))
          },
          {
            id: 'actual',
            label: 'Actual',
            color: '#e8edf4',
            points: reconciliation.points.map((point) => ({
              date: point.date,
              label: point.label,
              value: point.actualLiquid
            }))
          }
        ]}
        height={280}
      />
    </div>
  </article>

  <article class="panel fin-chart-panel fin-chart-panel--hero">
    <h2 class="fin-panel-title">Extra spending per month</h2>
    <div class="fin-extra-bars">
      {#each reconciliation.points as point (point.date)}
        <div class="fin-extra-bar-col" title="{point.label}: {formatCurrency(point.monthlyExtraSpend)}">
          <div class="fin-extra-bar-track">
            {#if point.monthlyExtraSpend > 0}
              <div
                class="fin-extra-bar fin-extra-bar--spend"
                style={`height: ${barHeight(point.monthlyExtraSpend)}`}
              ></div>
            {:else if point.monthlyExtraSpend < 0}
              <div
                class="fin-extra-bar fin-extra-bar--saved"
                style={`height: ${barHeight(point.monthlyExtraSpend)}`}
              ></div>
            {/if}
          </div>
          <span class="fin-extra-bar-label">{point.label}</span>
        </div>
      {/each}
    </div>
  </article>
{/if}
