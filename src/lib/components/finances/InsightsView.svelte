<script lang="ts">
  import type { FinancesInsights } from '$lib/finances/calc';
  import { formatAxisThousands, formatCurrency } from '$lib/finances/format';
  import LineChart from '$lib/components/finances/LineChart.svelte';
  import NetWorthChart from '$lib/components/finances/NetWorthChart.svelte';
  import ReconciliationPanel from '$lib/components/finances/ReconciliationPanel.svelte';

  let { insights }: { insights: FinancesInsights } = $props();

  const maxCashFlow = $derived(
    Math.max(insights.cashFlow.income, insights.cashFlow.expenses, insights.cashFlow.debtPayments, 1)
  );

  const donutColors = ['#5b9fd4', '#7fd99a', '#e5c07b', '#e06c75', '#c678dd', '#56b6c2'];

  const expenseSegments = $derived.by(() => {
    let offset = 0;
    return insights.expenseBreakdown
      .filter((item) => item.amount > 0)
      .map((item, index) => {
        const segment = { ...item, offset, color: donutColors[index % donutColors.length] };
        offset += item.pct;
        return segment;
      });
  });

  function barWidth(value: number): string {
    return `${Math.max(4, (value / maxCashFlow) * 100)}%`;
  }

  function runwayLabel(months: number | null): string {
    if (months === null) return '—';
    if (months > 120) return '10+ years';
    return `${months.toFixed(1)} months`;
  }
</script>

<section class="summary-grid">
  <article class="summary-card">
    <div class="summary-card__label">Liquid assets</div>
    <div class="summary-card__value">{formatCurrency(insights.totalLiquid)}</div>
  </article>
  <article class="summary-card">
    <div class="summary-card__label">Net income (month)</div>
    <div class="summary-card__value summary-card__value--positive">
      {formatCurrency(insights.totalIncomeNet)}
    </div>
  </article>
  <article class="summary-card">
    <div class="summary-card__label">Expenses (month)</div>
    <div class="summary-card__value summary-card__value--negative">
      {formatCurrency(insights.totalExpenses)}
    </div>
  </article>
  <article class="summary-card">
    <div class="summary-card__label">Net monthly</div>
    <div
      class="summary-card__value"
      class:summary-card__value--positive={insights.netMonthly >= 0}
      class:summary-card__value--negative={insights.netMonthly < 0}
    >
      {formatCurrency(insights.netMonthly)}
    </div>
  </article>
</section>

<div class="fin-insights-grid">
  <article class="panel fin-chart-panel">
    <h2 class="fin-panel-title">Cash flow (this month)</h2>
    <div class="fin-bars">
      <div class="fin-bar-row">
        <span class="fin-bar-label">Income</span>
        <div class="fin-bar-track">
          <div class="fin-bar fin-bar--income" style={`width: ${barWidth(insights.cashFlow.income)}`}></div>
        </div>
        <span class="fin-bar-value">{formatCurrency(insights.cashFlow.income)}</span>
      </div>
      <div class="fin-bar-row">
        <span class="fin-bar-label">Expenses</span>
        <div class="fin-bar-track">
          <div class="fin-bar fin-bar--expense" style={`width: ${barWidth(insights.cashFlow.expenses)}`}></div>
        </div>
        <span class="fin-bar-value">{formatCurrency(insights.cashFlow.expenses)}</span>
      </div>
      <div class="fin-bar-row">
        <span class="fin-bar-label">Debt payments</span>
        <div class="fin-bar-track">
          <div
            class="fin-bar fin-bar--debt"
            style={`width: ${barWidth(insights.cashFlow.debtPayments)}`}
          ></div>
        </div>
        <span class="fin-bar-value">{formatCurrency(insights.cashFlow.debtPayments)}</span>
      </div>
      <div class="fin-bar-row fin-bar-row--net">
        <span class="fin-bar-label">Net left</span>
        <div class="fin-bar-track">
          <div
            class="fin-bar fin-bar--net"
            style={`width: ${barWidth(Math.abs(insights.cashFlow.net))}`}
          ></div>
        </div>
        <span class="fin-bar-value">{formatCurrency(insights.cashFlow.net)}</span>
      </div>
    </div>
  </article>

  <article class="panel fin-chart-panel">
    <h2 class="fin-panel-title">Expense split</h2>
    {#if insights.expenseBreakdown.some((item) => item.amount > 0)}
      <div class="fin-donut-wrap">
        <svg class="fin-donut" viewBox="0 0 100 100" aria-hidden="true">
          {#each expenseSegments as segment (segment.name)}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={segment.color}
              stroke-width="14"
              stroke-dasharray="{segment.pct} {100 - segment.pct}"
              stroke-dashoffset={-segment.offset}
              transform="rotate(-90 50 50)"
            />
          {/each}
        </svg>
        <ul class="fin-legend">
          {#each insights.expenseBreakdown.filter((item) => item.amount > 0) as item (item.name)}
            <li><span>{item.name}</span><span>{formatCurrency(item.amount)}</span></li>
          {/each}
        </ul>
      </div>
    {:else}
      <p class="muted fin-empty">Add expenses to see the breakdown.</p>
    {/if}
  </article>

  <article class="panel fin-chart-panel">
    <h2 class="fin-panel-title">Debt overview</h2>
    <div class="fin-stat-list fin-stat-list--compact">
      <div class="fin-stat">
        <span>Total debt</span>
        <strong>{formatCurrency(insights.totalDebt)}</strong>
      </div>
      <div class="fin-stat">
        <span>Debt vs liquid</span>
        <strong>
          {insights.totalLiquid > 0
            ? `${((insights.totalDebt / insights.totalLiquid) * 100).toFixed(0)}%`
            : '—'}
        </strong>
      </div>
      <div class="fin-stat">
        <span>Savings rate</span>
        <strong>{insights.savingsRate.toFixed(1)}%</strong>
      </div>
      <div class="fin-stat">
        <span>Runway at current burn</span>
        <strong>{runwayLabel(insights.runwayMonths)}</strong>
      </div>
    </div>
  </article>

  <article class="panel fin-chart-panel">
    <h2 class="fin-panel-title">Income streams</h2>
    {#if insights.incomeBreakdown.some((item) => item.net > 0)}
      <ul class="fin-legend fin-legend--full">
        {#each insights.incomeBreakdown.filter((item) => item.net > 0) as item (item.name)}
          <li>
            <span>{item.name}</span>
            <span>{formatCurrency(item.net)} net · {item.pct.toFixed(0)}%</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted fin-empty">Add income streams to see the breakdown.</p>
    {/if}
  </article>
</div>

<ReconciliationPanel reconciliation={insights.reconciliation} />

{#if insights.debtTimeline.length > 0}
  <article class="panel fin-chart-panel fin-chart-panel--hero">
    <h2 class="fin-panel-title">Total debt over time</h2>
    <div class="fin-line-chart--featured">
      <LineChart
        series={[
          {
            id: 'combined-debt',
            label: 'Total debt',
            color: '#e5c07b',
            points: insights.debtTimeline.map((point) => ({
              date: point.date,
              label: point.label,
              value: point.totalDebt
            }))
          }
        ]}
        height={300}
        formatValue={formatAxisThousands}
      />
    </div>
  </article>
{/if}

<article class="panel fin-chart-panel fin-chart-panel--hero">
  <h2 class="fin-panel-title">Net worth over time</h2>
  <NetWorthChart
    points={insights.netWorthTimeline.map((point) => ({
      date: point.date,
      label: point.label,
      value: point.netWorth
    }))}
    height={320}
  />
</article>
