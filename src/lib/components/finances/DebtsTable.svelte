<script lang="ts">
  import type { Debt, FinancesData } from '$lib/finances/types';
  import { projectCombinedDebtTimeline, projectDebt } from '$lib/finances/calc';
  import { monthStartISO } from '$lib/finances/dates';
  import { formatAxisThousands, formatCurrency, parseAmount } from '$lib/finances/format';
  import LineChart from '$lib/components/finances/LineChart.svelte';

  let {
    data,
    onchange
  }: {
    data: FinancesData;
    onchange: () => void;
  } = $props();

  const debtTimeline = $derived(projectCombinedDebtTimeline(data));

  function addDebt() {
    data.debts = [
      ...data.debts,
      {
        id: crypto.randomUUID(),
        name: 'New debt',
        balance: 0,
        interestRateAnnual: 0,
        monthlyPayment: 0,
        monthlyAccrual: 0,
        startDate: monthStartISO(),
        endDate: ''
      }
    ];
    onchange();
  }

  function removeDebt(id: string) {
    data.debts = data.debts.filter((item) => item.id !== id);
    onchange();
  }

  function updateDebt(id: string, patch: Partial<Debt>) {
    data.debts = data.debts.map((item) => (item.id === id ? { ...item, ...patch } : item));
    onchange();
  }

  function payoffLabel(months: number | null): string {
    if (months === null) return 'Not paying off';
    if (months === 0) return 'Paid off';
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years === 0) return `${months} mo`;
    if (rem === 0) return `${years} yr`;
    return `${years} yr ${rem} mo`;
  }
</script>

<div class="fin-entry-list">
  {#each data.debts as debt (debt.id)}
    {@const insight = projectDebt(debt)}
    <article class="fin-entry-card fin-entry-card--debt">
      <div class="fin-entry-card__top">
        <div class="fin-pill fin-pill--grow">
          <input
            class="fin-pill__input"
            value={debt.name}
            oninput={(event) => updateDebt(debt.id, { name: event.currentTarget.value })}
            aria-label="Debt name"
          />
        </div>
        <button
          class="fin-icon-btn"
          type="button"
          aria-label="Remove {debt.name}"
          onclick={() => removeDebt(debt.id)}>×</button
        >
      </div>

      <div class="fin-entry-card__grid fin-entry-card__grid--debt">
        <label class="fin-field">
          <span>Start</span>
          <input
            class="fin-field__input"
            type="date"
            value={debt.startDate}
            oninput={(event) => updateDebt(debt.id, { startDate: event.currentTarget.value })}
          />
        </label>
        <label class="fin-field">
          <span>End</span>
          <input
            class="fin-field__input"
            type="date"
            value={debt.endDate}
            oninput={(event) => updateDebt(debt.id, { endDate: event.currentTarget.value })}
          />
        </label>
        <label class="fin-field">
          <span>Balance</span>
          <input
            class="fin-field__input fin-field__input--amount"
            inputmode="decimal"
            value={debt.balance || ''}
            placeholder="0"
            oninput={(event) => updateDebt(debt.id, { balance: parseAmount(event.currentTarget.value) })}
          />
        </label>
        <label class="fin-field">
          <span>Interest % / yr</span>
          <input
            class="fin-field__input fin-field__input--amount"
            inputmode="decimal"
            value={debt.interestRateAnnual || ''}
            placeholder="0"
            oninput={(event) =>
              updateDebt(debt.id, { interestRateAnnual: parseAmount(event.currentTarget.value) })}
          />
        </label>
        <label class="fin-field">
          <span>Monthly pay-off</span>
          <input
            class="fin-field__input fin-field__input--amount"
            inputmode="decimal"
            value={debt.monthlyPayment || ''}
            placeholder="0"
            oninput={(event) =>
              updateDebt(debt.id, { monthlyPayment: parseAmount(event.currentTarget.value) })}
          />
        </label>
        <label class="fin-field">
          <span>Monthly accrual</span>
          <input
            class="fin-field__input fin-field__input--amount"
            inputmode="decimal"
            value={debt.monthlyAccrual || ''}
            placeholder="0"
            oninput={(event) =>
              updateDebt(debt.id, { monthlyAccrual: parseAmount(event.currentTarget.value) })}
          />
        </label>
      </div>

      <div class="fin-debt-stats">
        <div><span>Monthly interest</span><strong>{formatCurrency(insight.monthlyInterest)}</strong></div>
        <div>
          <span>Net change / mo</span>
          <strong
            class:fin-readout--negative={insight.monthlyNetChange > 0}
            class:fin-readout--positive={insight.monthlyNetChange < 0}
          >
            {insight.monthlyNetChange >= 0 ? '+' : ''}{formatCurrency(insight.monthlyNetChange)}
          </strong>
        </div>
        <div><span>Pay-off</span><strong>{payoffLabel(insight.monthsToPayoff)}</strong></div>
        <div><span>12 mo projection</span><strong>{formatCurrency(insight.projectedBalance12Mo)}</strong></div>
      </div>
    </article>
  {:else}
    <p class="muted fin-empty">No debts tracked yet.</p>
  {/each}

  <button class="fin-plus fin-plus--wide" type="button" onclick={addDebt}>+ Add debt</button>
</div>

{#if debtTimeline.length > 0 && data.debts.length > 0}
  <article class="panel fin-chart-panel fin-chart-panel--wide">
    <h2 class="fin-panel-title">Total debt over time</h2>
    <LineChart
      series={[
        {
          id: 'total-debt',
          label: 'Total debt',
          color: '#e5c07b',
          points: debtTimeline.map((point) => ({
            date: point.date,
            label: point.label,
            value: point.totalDebt
          }))
        }
      ]}
      height={260}
      formatValue={formatAxisThousands}
    />
  </article>
{/if}
